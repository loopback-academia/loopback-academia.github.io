-- Loopback · blindaje del contenido de pago y de los códigos de acceso.
-- Pégalo entero en Supabase → SQL Editor → Run, después de 20261118000000_codigos.sql. Se puede ejecutar más de una vez.
--
-- Qué cambia:
--  * El contenido de pago ya no se puede leer de golpe desde las tablas: cada lección se pide por separado con
--    leer_leccion(), con un límite por hora y por día, y cada lectura queda registrada (para detectar copias masivas y
--    cuentas compartidas). El banco de preguntas se pide con banco_premium(), también con límite diario.
--  * Los códigos de acceso caducan si no se canjean (30 días) y pueden ir a nombre de un correo: así un código que se
--    filtre no le sirve a nadie más.
--  * Para canjear hace falta el correo confirmado. Además del límite por usuario, hay un límite global: si alguien crea
--    muchas cuentas para adivinar códigos, el canje se pausa una hora.
--  * El administrador ve las cuentas con actividad rara (muchas lecturas, muchas sesiones distintas, muchos intentos de
--    canje) y puede bloquearlas: una cuenta bloqueada pierde el acceso al momento.

-- ---------------------------------------------------------------- cuentas bloqueadas
create table if not exists public.cuentas_bloqueadas (
  user_id uuid primary key references auth.users(id) on delete cascade,
  motivo  text not null default '' check (char_length(motivo) <= 200),
  desde   timestamptz not null default now()
);
alter table public.cuentas_bloqueadas enable row level security;
alter table public.cuentas_bloqueadas force row level security;
revoke all on public.cuentas_bloqueadas from anon, authenticated;

create or replace function public.tiene_acceso() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null
     and public.sesion_segura()
     and not exists (select 1 from public.cuentas_bloqueadas b where b.user_id = auth.uid())
     and (coalesce((select a.valor = 'true'::jsonb from public.ajustes a where a.clave = 'acceso_abierto'), false)
          or exists (select 1 from public.suscripciones s where s.user_id = auth.uid() and s.hasta > now()));
$$;
revoke all on function public.tiene_acceso() from public, anon;
grant execute on function public.tiene_acceso() to authenticated;

-- ---------------------------------------------------------------- lecturas del contenido de pago
create table if not exists public.lecturas_premium (
  user_id uuid not null references auth.users(id) on delete cascade,
  recurso text not null check (char_length(recurso) <= 80),
  sesion  text check (char_length(sesion) <= 64),        -- id de la sesión de Supabase (cada inicio de sesión tiene uno)
  momento timestamptz not null default now()
);
create index if not exists lecturas_premium_idx on public.lecturas_premium (user_id, momento);
create index if not exists lecturas_premium_momento_idx on public.lecturas_premium (momento);
alter table public.lecturas_premium enable row level security;
alter table public.lecturas_premium force row level security;
revoke all on public.lecturas_premium from anon, authenticated;

-- Ya no se lee directamente de las tablas: solo a través de las funciones de abajo.
drop policy if exists lecciones_premium_leer on public.lecciones_premium;
drop policy if exists preguntas_premium_leer on public.preguntas_premium;
revoke all on public.lecciones_premium, public.preguntas_premium from anon, authenticated;

-- Una lección de pago: {blocks, quiz} o {error: 'sin_acceso' | 'limite' | 'no_existe'}.
-- Límite: 60 lecturas por hora y 150 por día (estudiando de verdad no se llega; copiando el curso entero, sí).
create or replace function public.leer_leccion(p_id text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_hora integer;
  v_dia integer;
  v_l public.lecciones_premium;
begin
  if not public.tiene_acceso() then return jsonb_build_object('error', 'sin_acceso'); end if;
  perform pg_advisory_xact_lock(hashtextextended('lectura:' || v_uid::text, 0));
  select count(*) filter (where l.momento > now() - interval '1 hour'), count(*) into v_hora, v_dia
    from public.lecturas_premium l where l.user_id = v_uid and l.momento > now() - interval '1 day';
  if v_hora >= 60 or v_dia >= 150 then return jsonb_build_object('error', 'limite'); end if;
  select * into v_l from public.lecciones_premium l where l.id = p_id;
  if v_l.id is null then return jsonb_build_object('error', 'no_existe'); end if;
  insert into public.lecturas_premium (user_id, recurso, sesion) values (v_uid, 'leccion:' || p_id, left(auth.jwt()->>'session_id', 64));
  delete from public.lecturas_premium l where l.user_id = v_uid and l.momento < now() - interval '30 days';
  return jsonb_build_object('blocks', v_l.blocks, 'quiz', v_l.quiz);
end $$;
revoke all on function public.leer_leccion(text) from public, anon;
grant execute on function public.leer_leccion(text) to authenticated;

-- El banco de preguntas de pago (para exámenes de escalón, simulacros y repaso): [datos, …] o {error}.
-- Se guarda en el navegador, así que basta con pedirlo pocas veces: 20 al día.
create or replace function public.banco_premium() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if not public.tiene_acceso() then return jsonb_build_object('error', 'sin_acceso'); end if;
  perform pg_advisory_xact_lock(hashtextextended('lectura:' || v_uid::text, 0));
  if (select count(*) from public.lecturas_premium l where l.user_id = v_uid and l.recurso = 'banco' and l.momento > now() - interval '1 day') >= 20 then
    return jsonb_build_object('error', 'limite');
  end if;
  insert into public.lecturas_premium (user_id, recurso, sesion) values (v_uid, 'banco', left(auth.jwt()->>'session_id', 64));
  return coalesce((select jsonb_agg(p.datos order by p.id) from public.preguntas_premium p), '[]'::jsonb);
end $$;
revoke all on function public.banco_premium() from public, anon;
grant execute on function public.banco_premium() to authenticated;

-- ---------------------------------------------------------------- códigos: caducidad y correo del comprador
alter table public.codigos_acceso add column if not exists caduca timestamptz;
alter table public.codigos_acceso add column if not exists para_correo text;
alter table public.codigos_acceso drop constraint if exists codigos_acceso_para_correo_check;
alter table public.codigos_acceso add constraint codigos_acceso_para_correo_check
  check (para_correo is null or (char_length(para_correo) <= 254 and para_correo ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and para_correo = lower(para_correo)));
update public.codigos_acceso set caduca = creado + interval '30 days' where caduca is null;
alter table public.codigos_acceso alter column caduca set default now() + interval '30 days';
alter table public.codigos_acceso alter column caduca set not null;

drop function if exists public.admin_crear_codigo(text, text, numeric, text, text, integer);
create or replace function public.admin_crear_codigo(p_plan text, p_metodo text, p_monto numeric default 0, p_moneda text default 'DOP',
                                                    p_nota text default '', p_dias integer default null, p_correo text default null) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_abc constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_bytes bytea;
  v_i integer;
  v_cuerpo text;
  v_dias integer := coalesce(p_dias, public.dias_plan(p_plan));
  v_correo text := nullif(lower(btrim(coalesce(p_correo, ''))), '');
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  if v_dias is null then raise exception 'Indica los días para este plan'; end if;
  if v_correo is not null and v_correo !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'El correo del alumno no es válido'; end if;
  loop
    v_bytes := uuid_send(gen_random_uuid());
    v_cuerpo := '';
    foreach v_i in array array[0, 1, 2, 3, 4, 5, 7, 9] loop v_cuerpo := v_cuerpo || substr(v_abc, (get_byte(v_bytes, v_i) % 32) + 1, 1); end loop;
    exit when not exists (select 1 from public.codigos_acceso c where c.hash = public.hash_codigo('LB' || v_cuerpo));
  end loop;
  insert into public.codigos_acceso (hash, pista, plan, dias, metodo, monto, moneda, nota, creado_por, para_correo)
    values (public.hash_codigo('LB' || v_cuerpo), 'LB-' || left(v_cuerpo, 4), p_plan, v_dias, p_metodo, coalesce(p_monto, 0),
            coalesce(p_moneda, 'DOP'), left(btrim(coalesce(p_nota, '')), 120), auth.uid(), v_correo);
  return 'LB-' || left(v_cuerpo, 4) || '-' || right(v_cuerpo, 4);  -- se muestra una sola vez
end $$;
revoke all on function public.admin_crear_codigo(text, text, numeric, text, text, integer, text) from public, anon;
grant execute on function public.admin_crear_codigo(text, text, numeric, text, text, integer, text) to authenticated;

create or replace function public.admin_ventas(p_limite integer default 100) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  return jsonb_build_object(
    'codigos', (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'pista', c.pista, 'plan', c.plan, 'dias', c.dias, 'metodo', c.metodo,
                  'monto', c.monto, 'moneda', c.moneda, 'nota', c.nota, 'creado', c.creado, 'canjeado', c.canjeado, 'anulado', c.anulado,
                  'caduca', c.caduca, 'para_correo', c.para_correo) order by c.creado desc), '[]'::jsonb)
                from (select * from public.codigos_acceso order by creado desc limit least(greatest(coalesce(p_limite, 100), 1), 500)) c),
    'totales', (select coalesce(jsonb_object_agg(t.moneda, jsonb_build_object('mes', t.mes, 'total', t.total, 'ventas', t.ventas)), '{}'::jsonb) from (
                  select moneda, sum(monto) filter (where creado >= date_trunc('month', now())) mes, sum(monto) total, count(*) filter (where monto > 0) ventas
                  from public.codigos_acceso where not anulado group by moneda) t),
    'pendientes', (select count(*) from public.codigos_acceso where canjeado is null and not anulado and caduca > now()),
    'suscripciones_activas', (select count(*) from public.suscripciones where hasta > now()));
end $$;
revoke all on function public.admin_ventas(integer) from public, anon;
grant execute on function public.admin_ventas(integer) to authenticated;

-- ---------------------------------------------------------------- canjear un código (alumno)
-- Solo cuentan como intentos los fallidos. Límites: 10 fallos por hora y 30 por día por usuario, y 300 por hora en
-- total (si se superan, el canje se pausa una hora para todos: señal de que alguien está probando códigos al azar).
create or replace function public.canjear_codigo(p_codigo text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_cod public.codigos_acceso;
  v_correo text;
  v_hasta timestamptz;
  v_error text;
begin
  if v_uid is null then raise exception 'Sin sesión'; end if;
  if not public.sesion_segura() then raise exception 'Verifica tu segundo factor'; end if;
  if exists (select 1 from public.cuentas_bloqueadas b where b.user_id = v_uid) then
    return jsonb_build_object('error', 'Esta cuenta está bloqueada. Escríbenos por WhatsApp si crees que es un error.');
  end if;
  select lower(u.email) into v_correo from auth.users u where u.id = v_uid and u.email_confirmed_at is not null;
  if v_correo is null then return jsonb_build_object('error', 'Primero confirma tu correo: abre el enlace que te enviamos al crear la cuenta.'); end if;

  perform pg_advisory_xact_lock(hashtextextended('canje:' || v_uid::text, 0));
  if (select count(*) from public.intentos_canje i where i.user_id = v_uid and i.momento > now() - interval '1 hour') >= 10
     or (select count(*) from public.intentos_canje i where i.user_id = v_uid and i.momento > now() - interval '1 day') >= 30 then
    raise exception 'Demasiados intentos. Espera una hora y vuelve a intentarlo, o escríbenos por WhatsApp.';
  end if;
  if (select count(*) from public.intentos_canje i where i.momento > now() - interval '1 hour') >= 300 then
    raise exception 'Por seguridad, el canje de códigos está en pausa. Vuelve a intentarlo en una hora o escríbenos por WhatsApp.';
  end if;

  select * into v_cod from public.codigos_acceso c where c.hash = public.hash_codigo(p_codigo) for update;
  v_error := case
    when v_cod.id is null or v_cod.anulado then 'Ese código no es válido. Revisa que esté bien escrito.'
    when v_cod.canjeado is not null then 'Ese código ya se usó.'
    when v_cod.caduca <= now() then 'Ese código caducó sin usarse. Escríbenos por WhatsApp y te damos uno nuevo.'
    when v_cod.para_correo is not null and v_cod.para_correo <> v_correo then 'Ese código es para otra cuenta. Entra con el correo con el que hiciste la compra.'
  end;
  if v_error is not null then
    insert into public.intentos_canje (user_id) values (v_uid);
    delete from public.intentos_canje i where i.momento < now() - interval '1 day';
    return jsonb_build_object('error', v_error);
  end if;

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

-- ---------------------------------------------------------------- vigilancia (administrador)
-- Cuentas con actividad rara en los últimos días: muchas lecturas de lecciones, muchas sesiones distintas (señal de
-- cuenta compartida) o muchos intentos fallidos de canje. Solo esas cuentas aparecen, con su correo, para poder actuar.
create or replace function public.admin_alertas() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  return coalesce((select jsonb_agg(x order by x->>'motivo', x->>'correo') from (
    select jsonb_build_object('user_id', u.id, 'correo', u.email,
             'lecturas_24h', coalesce(l.l24, 0), 'sesiones_7d', coalesce(l.s7, 0), 'fallos_canje_24h', coalesce(f.n, 0),
             'bloqueada', b.user_id is not null,
             'motivo', case when coalesce(f.n, 0) >= 10 then 'Muchos intentos de canje'
                            when coalesce(l.s7, 0) >= 6 then 'Muchas sesiones distintas (¿cuenta compartida?)'
                            else 'Muchas lecturas (¿copia del curso?)' end) x
    from auth.users u
    left join (select user_id, count(*) filter (where momento > now() - interval '1 day') l24,
                      count(distinct sesion) filter (where momento > now() - interval '7 days') s7
               from public.lecturas_premium group by user_id) l on l.user_id = u.id
    left join (select user_id, count(*) n from public.intentos_canje where momento > now() - interval '1 day' group by user_id) f on f.user_id = u.id
    left join public.cuentas_bloqueadas b on b.user_id = u.id
    where coalesce(l.l24, 0) >= 100 or coalesce(l.s7, 0) >= 6 or coalesce(f.n, 0) >= 10 or b.user_id is not null) t), '[]'::jsonb);
end $$;
revoke all on function public.admin_alertas() from public, anon;
grant execute on function public.admin_alertas() to authenticated;

create or replace function public.admin_bloquear(p_user uuid, p_motivo text default '') returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  if p_user = auth.uid() then raise exception 'No puedes bloquear tu propia cuenta'; end if;
  insert into public.cuentas_bloqueadas (user_id, motivo) values (p_user, left(btrim(coalesce(p_motivo, '')), 200))
    on conflict (user_id) do update set motivo = excluded.motivo, desde = now();
end $$;
revoke all on function public.admin_bloquear(uuid, text) from public, anon;
grant execute on function public.admin_bloquear(uuid, text) to authenticated;

create or replace function public.admin_desbloquear(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  delete from public.cuentas_bloqueadas where user_id = p_user;
end $$;
revoke all on function public.admin_desbloquear(uuid) from public, anon;
grant execute on function public.admin_desbloquear(uuid) to authenticated;
