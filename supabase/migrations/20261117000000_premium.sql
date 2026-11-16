-- Loopback · contenido de pago protegido en el servidor.
-- Pégalo entero en Supabase → SQL Editor → Run, después de las migraciones anteriores. Se puede ejecutar más de una vez.
--
-- Cómo funciona:
--  * Las lecciones y preguntas de los módulos de pago NO están en la web: viven en lecciones_premium y preguntas_premium
--    (las sube la integración continua con _privado/premium.sql) y solo se entregan a quien tiene acceso.
--  * Tener acceso = sesión iniciada (con el segundo factor si lo tiene activado) y, además, una de estas dos cosas:
--      - el interruptor ajustes.acceso_abierto está en true: cualquier cuenta gratuita tiene acceso (mientras no se cobre);
--      - una suscripción vigente en la tabla suscripciones.
--  * Para empezar a cobrar: update public.ajustes set valor = 'false' where clave = 'acceso_abierto';
--  * Ningún alumno puede escribir en suscripciones ni en ajustes: solo leer su propia suscripción.

-- ---------------------------------------------------------------- ajustes generales (solo se cambian desde el SQL Editor)
create table if not exists public.ajustes (
  clave text primary key check (clave ~ '^[a-z_]{1,40}$'),
  valor jsonb not null
);
insert into public.ajustes (clave, valor) values ('acceso_abierto', 'true') on conflict (clave) do nothing;

-- ---------------------------------------------------------------- suscripciones (las dará el sistema de cobro)
create table if not exists public.suscripciones (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  plan        text not null check (plan in ('mensual', 'anual', 'fundador', 'institucion', 'cortesia')),
  hasta       timestamptz not null,
  origen      text not null default 'manual' check (char_length(origen) between 1 and 40),
  actualizada timestamptz not null default now()
);

-- ---------------------------------------------------------------- contenido de pago
create table if not exists public.lecciones_premium (
  id          text primary key check (id ~ '^[a-z0-9-]{1,60}$'),
  area        text not null,
  modulo      text not null,
  blocks      jsonb not null,
  quiz        jsonb not null default '[]'::jsonb,
  actualizado timestamptz not null default now()
);
create table if not exists public.preguntas_premium (
  id     text primary key check (id ~ '^[a-z0-9#-]{1,80}$'),
  area   text not null,
  modulo text not null,
  datos  jsonb not null
);

alter table public.ajustes           enable row level security;
alter table public.suscripciones     enable row level security;
alter table public.lecciones_premium enable row level security;
alter table public.preguntas_premium enable row level security;
alter table public.ajustes           force row level security;
alter table public.suscripciones     force row level security;
alter table public.lecciones_premium force row level security;
alter table public.preguntas_premium force row level security;

revoke all on public.ajustes, public.suscripciones, public.lecciones_premium, public.preguntas_premium from anon, authenticated;
grant select on public.suscripciones, public.lecciones_premium, public.preguntas_premium to authenticated;

-- ¿El usuario que llama tiene acceso al contenido de pago?
create or replace function public.tiene_acceso() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null
     and public.sesion_segura()
     and (coalesce((select a.valor = 'true'::jsonb from public.ajustes a where a.clave = 'acceso_abierto'), false)
          or exists (select 1 from public.suscripciones s where s.user_id = auth.uid() and s.hasta > now()));
$$;
revoke all on function public.tiene_acceso() from public, anon;
grant execute on function public.tiene_acceso() to authenticated;

-- Estado del acceso para mostrarlo en la web: {acceso, abierto, plan, hasta}.
create or replace function public.mi_acceso() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'acceso',  public.tiene_acceso(),
    'abierto', coalesce((select a.valor = 'true'::jsonb from public.ajustes a where a.clave = 'acceso_abierto'), false),
    'plan',    (select s.plan from public.suscripciones s where s.user_id = auth.uid() and s.hasta > now()),
    'hasta',   (select s.hasta from public.suscripciones s where s.user_id = auth.uid() and s.hasta > now()));
$$;
revoke all on function public.mi_acceso() from public;
grant execute on function public.mi_acceso() to anon, authenticated; -- sin sesión: {acceso: false, abierto: …}

drop policy if exists suscripciones_leer on public.suscripciones;
drop policy if exists suscripciones_mfa on public.suscripciones;
drop policy if exists lecciones_premium_leer on public.lecciones_premium;
drop policy if exists preguntas_premium_leer on public.preguntas_premium;
create policy suscripciones_leer     on public.suscripciones for select to authenticated using (user_id = (select auth.uid()));
create policy suscripciones_mfa      on public.suscripciones as restrictive for all to authenticated using ((select public.sesion_segura()));
create policy lecciones_premium_leer on public.lecciones_premium for select to authenticated using ((select public.tiene_acceso()));
create policy preguntas_premium_leer on public.preguntas_premium for select to authenticated using ((select public.tiene_acceso()));
