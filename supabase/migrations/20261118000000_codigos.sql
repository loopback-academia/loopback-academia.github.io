-- Loopback · códigos de acceso y registro de ventas.
-- Pégalo entero en Supabase → SQL Editor → Run, después de 20261117000000_premium.sql. Se puede ejecutar más de una vez.
--
-- Cómo funciona:
--  * El alumno paga (transferencia en República Dominicana o Hotmart desde otros países) y el administrador genera en su
--    panel un código de un solo uso (LB-XXXX-XXXX) para ese plan. El alumno lo canjea en «Tu cuenta» y su suscripción se
--    amplía al momento.
--  * Solo se guarda el resumen SHA-256 del código, nunca el código en claro: si alguien leyera la tabla, no podría usarlo.
--  * Canjear tiene un límite de intentos por usuario para que nadie pueda adivinar códigos.
--  * La tabla sirve también de registro de ventas (plan, importe, moneda, método y una nota del administrador).

-- El plan de 3 meses.
alter table public.suscripciones drop constraint if exists suscripciones_plan_check;
alter table public.suscripciones add constraint suscripciones_plan_check
  check (plan in ('mensual', 'trimestral', 'anual', 'fundador', 'institucion', 'cortesia'));

create table if not exists public.codigos_acceso (
  id           uuid primary key default gen_random_uuid(),
  hash         text not null unique check (hash ~ '^[0-9a-f]{64}$'),
  pista        text not null check (pista ~ '^LB-[A-HJ-NP-Z2-9]{4}$'),   -- primeros caracteres, para reconocerlo en el panel
  plan         text not null check (plan in ('mensual', 'trimestral', 'anual', 'fundador', 'institucion', 'cortesia')),
  dias         integer not null check (dias between 1 and 400),
  metodo       text not null check (metodo in ('transferencia', 'hotmart', 'paypal', 'cortesia', 'otro')),
  monto        numeric(10, 2) not null default 0 check (monto >= 0 and monto < 1000000),
  moneda       text not null default 'DOP' check (moneda in ('DOP', 'USD')),
  nota         text not null default '' check (char_length(nota) <= 120),
  creado       timestamptz not null default now(),
  creado_por   uuid references auth.users(id) on delete set null,
  canjeado     timestamptz,
  canjeado_por uuid references auth.users(id) on delete set null,
  anulado      boolean not null default false
);
create index if not exists codigos_acceso_creado_idx on public.codigos_acceso (creado desc);

create table if not exists public.intentos_canje (
  user_id uuid not null references auth.users(id) on delete cascade,
  momento timestamptz not null default now()
);
create index if not exists intentos_canje_idx on public.intentos_canje (user_id, momento);

alter table public.codigos_acceso enable row level security;
alter table public.intentos_canje enable row level security;
alter table public.codigos_acceso force row level security;
alter table public.intentos_canje force row level security;
-- Sin políticas ni permisos: solo las funciones de abajo tocan estas tablas.
revoke all on public.codigos_acceso, public.intentos_canje from anon, authenticated;

-- Días de cada plan.
create or replace function public.dias_plan(p_plan text) returns integer
language sql immutable set search_path = '' as $$
  select case p_plan when 'mensual' then 31 when 'trimestral' then 92 when 'anual' then 366 when 'fundador' then 366 else null end;
$$;

-- Resumen del código tal como lo escriba la persona (mayúsculas, sin espacios ni guiones).
-- Se acepta con o sin el «LB» inicial.
create or replace function public.hash_codigo(p_codigo text) returns text
language sql immutable set search_path = '' as $$
  select encode(sha256(convert_to(case when length(s) = 8 then 'LB' || s else s end, 'UTF8')), 'hex')
  from (select regexp_replace(upper(coalesce(p_codigo, '')), '[^A-Z0-9]', '', 'g') s) x;
$$;
revoke all on function public.hash_codigo(text) from public, anon, authenticated;

-- ---------------------------------------------------------------- administración: crear, listar y anular códigos
create or replace function public.admin_crear_codigo(p_plan text, p_metodo text, p_monto numeric default 0, p_moneda text default 'DOP',
                                                    p_nota text default '', p_dias integer default null) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_abc constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_bytes bytea;
  v_i integer;
  v_cuerpo text;
  v_dias integer := coalesce(p_dias, public.dias_plan(p_plan));
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  if v_dias is null then raise exception 'Indica los días para este plan'; end if;
  loop
    v_bytes := uuid_send(gen_random_uuid());
    v_cuerpo := '';
    foreach v_i in array array[0, 1, 2, 3, 4, 5, 7, 9] loop v_cuerpo := v_cuerpo || substr(v_abc, (get_byte(v_bytes, v_i) % 32) + 1, 1); end loop;
    exit when not exists (select 1 from public.codigos_acceso c where c.hash = public.hash_codigo('LB' || v_cuerpo));
  end loop;
  insert into public.codigos_acceso (hash, pista, plan, dias, metodo, monto, moneda, nota, creado_por)
    values (public.hash_codigo('LB' || v_cuerpo), 'LB-' || left(v_cuerpo, 4), p_plan, v_dias, p_metodo, coalesce(p_monto, 0),
            coalesce(p_moneda, 'DOP'), left(btrim(coalesce(p_nota, '')), 120), auth.uid());
  return 'LB-' || left(v_cuerpo, 4) || '-' || right(v_cuerpo, 4);  -- se muestra una sola vez
end $$;
revoke all on function public.admin_crear_codigo(text, text, numeric, text, text, integer) from public, anon;
grant execute on function public.admin_crear_codigo(text, text, numeric, text, text, integer) to authenticated;

-- Registro de ventas: los últimos códigos (sin el código en claro ni datos de quien lo canjeó) y los totales.
create or replace function public.admin_ventas(p_limite integer default 100) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  return jsonb_build_object(
    'codigos', (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'pista', c.pista, 'plan', c.plan, 'dias', c.dias, 'metodo', c.metodo,
                  'monto', c.monto, 'moneda', c.moneda, 'nota', c.nota, 'creado', c.creado, 'canjeado', c.canjeado, 'anulado', c.anulado)
                  order by c.creado desc), '[]'::jsonb)
                from (select * from public.codigos_acceso order by creado desc limit least(greatest(coalesce(p_limite, 100), 1), 500)) c),
    'totales', (select coalesce(jsonb_object_agg(t.moneda, jsonb_build_object('mes', t.mes, 'total', t.total, 'ventas', t.ventas)), '{}'::jsonb) from (
                  select moneda, sum(monto) filter (where creado >= date_trunc('month', now())) mes, sum(monto) total, count(*) filter (where monto > 0) ventas
                  from public.codigos_acceso where not anulado group by moneda) t),
    'pendientes', (select count(*) from public.codigos_acceso where canjeado is null and not anulado),
    'suscripciones_activas', (select count(*) from public.suscripciones where hasta > now()));
end $$;
revoke all on function public.admin_ventas(integer) from public, anon;
grant execute on function public.admin_ventas(integer) to authenticated;

-- Anular un código aún no canjeado (por ejemplo, si se envió por error o el pago no llegó).
create or replace function public.admin_anular_codigo(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  update public.codigos_acceso set anulado = true where id = p_id and canjeado is null;
  if not found then raise exception 'Ese código no existe o ya se canjeó'; end if;
end $$;
revoke all on function public.admin_anular_codigo(uuid) from public, anon;
grant execute on function public.admin_anular_codigo(uuid) to authenticated;

-- ---------------------------------------------------------------- canjear un código (alumno)
-- Amplía la suscripción del alumno los días del plan (desde hoy o desde que termine la actual). Devuelve {plan, hasta}, o
-- {error} si el código no sirve: sin lanzar una excepción, para que el intento quede registrado y cuente para el límite.
create or replace function public.canjear_codigo(p_codigo text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_cod public.codigos_acceso;
  v_hasta timestamptz;
begin
  if v_uid is null then raise exception 'Sin sesión'; end if;
  if not public.sesion_segura() then raise exception 'Verifica tu segundo factor'; end if;
  perform pg_advisory_xact_lock(hashtextextended('canje:' || v_uid::text, 0));
  if (select count(*) from public.intentos_canje i where i.user_id = v_uid and i.momento > now() - interval '1 hour') >= 10 then
    raise exception 'Demasiados intentos. Espera una hora y vuelve a intentarlo, o escríbenos por WhatsApp.';
  end if;
  insert into public.intentos_canje (user_id) values (v_uid);
  delete from public.intentos_canje i where i.momento < now() - interval '1 day';

  select * into v_cod from public.codigos_acceso c where c.hash = public.hash_codigo(p_codigo) for update;
  if v_cod.id is null or v_cod.anulado then return jsonb_build_object('error', 'Ese código no es válido. Revisa que esté bien escrito.'); end if;
  if v_cod.canjeado is not null then return jsonb_build_object('error', 'Ese código ya se usó.'); end if;

  insert into public.suscripciones (user_id, plan, hasta, origen)
    values (v_uid, v_cod.plan, now() + make_interval(days => v_cod.dias), 'codigo')
    on conflict (user_id) do update
      set plan = excluded.plan,
          hasta = greatest(public.suscripciones.hasta, now()) + make_interval(days => v_cod.dias),
          origen = 'codigo', actualizada = now()
    returning hasta into v_hasta;
  update public.codigos_acceso set canjeado = now(), canjeado_por = v_uid where id = v_cod.id;
  return jsonb_build_object('plan', v_cod.plan, 'hasta', v_hasta);
end $$;
revoke all on function public.canjear_codigo(text) from public, anon;
grant execute on function public.canjear_codigo(text) to authenticated;
