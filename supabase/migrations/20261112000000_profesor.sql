-- Loopback · panel del profesor: clases, alumnos que se unen con un código y lectura del progreso por el profesor.
-- Pégalo entero en Supabase → SQL Editor → Run, DESPUÉS de 20261111000000_aula.sql. Se puede ejecutar más de una vez.
--
-- Seguridad y privacidad:
--  * RLS forzada en las dos tablas. Nadie puede insertar directamente: las clases se crean con crear_clase() (que genera
--    el código en el servidor) y los alumnos entran con unirse_a_clase(código, alias).
--  * El profesor NO puede leer la tabla progreso: solo llama a progreso_de_clase(), que comprueba que la clase es suya y
--    devuelve el progreso de quienes se unieron voluntariamente, identificados por el alias que eligieron (nunca su correo).
--  * El alumno puede salir de la clase cuando quiera (borra su fila) y el profesor puede quitar alumnos.
--  * Si el usuario tiene la verificación en dos pasos activada, todo exige una sesión verificada (aal2).
--  * Límites: 20 clases por profesor, 300 alumnos por clase y 20 clases por alumno.

create extension if not exists pgcrypto;

create table if not exists public.clases (
  id       uuid primary key default gen_random_uuid(),
  profesor uuid not null references auth.users(id) on delete cascade,
  nombre   text not null check (char_length(btrim(nombre)) between 1 and 80),
  codigo   text not null unique check (codigo ~ '^[A-HJ-NP-Z2-9]{10}$'),
  creada   timestamptz not null default now()
);
create index if not exists clases_profesor_idx on public.clases (profesor);

create table if not exists public.clase_miembros (
  clase_id uuid not null references public.clases(id) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade,
  alias    text not null check (char_length(btrim(alias)) between 1 and 40),
  unida    timestamptz not null default now(),
  primary key (clase_id, user_id)
);
create index if not exists clase_miembros_user_idx on public.clase_miembros (user_id);

alter table public.clases         enable row level security;
alter table public.clase_miembros enable row level security;
alter table public.clases         force row level security;
alter table public.clase_miembros force row level security;

revoke all on public.clases, public.clase_miembros from anon, authenticated;
grant select, delete on public.clases to authenticated;
grant update (nombre) on public.clases to authenticated;
grant select, delete on public.clase_miembros to authenticated;
grant update (alias) on public.clase_miembros to authenticated;

-- Comprobaciones sin recursión entre políticas (SECURITY DEFINER no aplica RLS dentro).
create or replace function public.es_profesor_de(p_clase uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.clases c where c.id = p_clase and c.profesor = auth.uid());
$$;
create or replace function public.es_miembro_de(p_clase uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.clase_miembros m where m.clase_id = p_clase and m.user_id = auth.uid());
$$;
revoke all on function public.es_profesor_de(uuid), public.es_miembro_de(uuid) from public, anon;
grant execute on function public.es_profesor_de(uuid), public.es_miembro_de(uuid) to authenticated;

drop policy if exists clases_leer on public.clases;
drop policy if exists clases_actualizar on public.clases;
drop policy if exists clases_borrar on public.clases;
drop policy if exists clases_mfa on public.clases;
create policy clases_leer       on public.clases for select to authenticated using (profesor = (select auth.uid()) or public.es_miembro_de(id));
create policy clases_actualizar on public.clases for update to authenticated using (profesor = (select auth.uid())) with check (profesor = (select auth.uid()));
create policy clases_borrar     on public.clases for delete to authenticated using (profesor = (select auth.uid()));
create policy clases_mfa        on public.clases as restrictive for all to authenticated using ((select public.sesion_segura())) with check ((select public.sesion_segura()));

drop policy if exists miembros_leer on public.clase_miembros;
drop policy if exists miembros_actualizar on public.clase_miembros;
drop policy if exists miembros_borrar on public.clase_miembros;
drop policy if exists miembros_mfa on public.clase_miembros;
create policy miembros_leer       on public.clase_miembros for select to authenticated using (user_id = (select auth.uid()) or public.es_profesor_de(clase_id));
create policy miembros_actualizar on public.clase_miembros for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy miembros_borrar     on public.clase_miembros for delete to authenticated using (user_id = (select auth.uid()) or public.es_profesor_de(clase_id));
create policy miembros_mfa        on public.clase_miembros as restrictive for all to authenticated using ((select public.sesion_segura())) with check ((select public.sesion_segura()));

-- ---------------------------------------------------------------- crear una clase (el código lo genera el servidor)
create or replace function public.crear_clase(p_nombre text) returns public.clases
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_abc constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- sin I, O, 0 ni 1 para que no se confundan
  v_bytes bytea;
  v_i integer;
  v_codigo text;
  v_fila public.clases;
begin
  if v_uid is null then raise exception 'Sin sesión'; end if;
  if not public.sesion_segura() then raise exception 'Verifica tu segundo factor'; end if;
  if char_length(btrim(coalesce(p_nombre, ''))) not between 1 and 80 then raise exception 'El nombre debe tener entre 1 y 80 caracteres'; end if;
  if (select count(*) from public.clases where profesor = v_uid) >= 20 then raise exception 'Límite de 20 clases alcanzado'; end if;
  loop
    -- 10 bytes aleatorios de un UUID v4 (se saltan los bytes 6 y 8, que llevan la versión y la variante)
    v_bytes := uuid_send(gen_random_uuid());
    v_codigo := '';
    foreach v_i in array array[0, 1, 2, 3, 4, 5, 7, 9, 10, 11] loop v_codigo := v_codigo || substr(v_abc, (get_byte(v_bytes, v_i) % 32) + 1, 1); end loop;
    exit when not exists (select 1 from public.clases where codigo = v_codigo);
  end loop;
  insert into public.clases (profesor, nombre, codigo) values (v_uid, btrim(p_nombre), v_codigo) returning * into v_fila;
  return v_fila;
end $$;
revoke all on function public.crear_clase(text) from public, anon;
grant execute on function public.crear_clase(text) to authenticated;

-- ---------------------------------------------------------------- unirse a una clase con su código
create or replace function public.unirse_a_clase(p_codigo text, p_alias text) returns table (id uuid, nombre text)
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_clase public.clases;
  v_alias text := btrim(coalesce(p_alias, ''));
begin
  if v_uid is null then raise exception 'Sin sesión'; end if;
  if not public.sesion_segura() then raise exception 'Verifica tu segundo factor'; end if;
  if char_length(v_alias) not between 1 and 40 then raise exception 'El nombre que verá tu profesor debe tener entre 1 y 40 caracteres'; end if;
  select * into v_clase from public.clases c where c.codigo = upper(regexp_replace(coalesce(p_codigo, ''), '[^A-Za-z0-9]', '', 'g'));
  if v_clase.id is null then raise exception 'No hay ninguna clase con ese código'; end if;
  if v_clase.profesor = v_uid then raise exception 'Eres el profesor de esta clase'; end if;
  if not exists (select 1 from public.clase_miembros m where m.clase_id = v_clase.id and m.user_id = v_uid) then
    if (select count(*) from public.clase_miembros m where m.clase_id = v_clase.id) >= 300 then raise exception 'La clase está llena'; end if;
    if (select count(*) from public.clase_miembros m where m.user_id = v_uid) >= 20 then raise exception 'Límite de 20 clases alcanzado'; end if;
  end if;
  insert into public.clase_miembros (clase_id, user_id, alias) values (v_clase.id, v_uid, v_alias)
    on conflict (clase_id, user_id) do update set alias = excluded.alias;
  return query select v_clase.id, v_clase.nombre;
end $$;
revoke all on function public.unirse_a_clase(text, text) from public, anon;
grant execute on function public.unirse_a_clase(text, text) to authenticated;

-- ---------------------------------------------------------------- progreso de los alumnos de una clase (solo su profesor)
-- Devuelve lo completado (lecciones, prácticas, exámenes de escalón y finales) y la actividad; nada más.
create or replace function public.progreso_de_clase(p_clase uuid)
returns table (user_id uuid, alias text, unida timestamptz, item_id text, tipo text, puntos integer, total integer, hecho boolean, datos jsonb, actualizado timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  if not public.sesion_segura() then raise exception 'Verifica tu segundo factor'; end if;
  if not public.es_profesor_de(p_clase) then raise exception 'No eres el profesor de esta clase'; end if;
  return query
    select m.user_id, m.alias, m.unida, p.item_id, p.tipo, p.puntos, p.total, p.hecho,
           case when p.tipo = 'actividad' then p.datos else '{}'::jsonb end, p.actualizado
    from public.clase_miembros m
    left join public.progreso p on p.user_id = m.user_id and (p.hecho or p.tipo in ('quiz', 'actividad'))
    where m.clase_id = p_clase
    order by m.alias
    limit 200000;
end $$;
revoke all on function public.progreso_de_clase(uuid) from public, anon;
grant execute on function public.progreso_de_clase(uuid) to authenticated;
