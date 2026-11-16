-- Loopback · exámenes finales verificados, certificados verificables y panel de administración.
-- Pégalo entero en Supabase → SQL Editor → Run, DESPUÉS de 20261111000000_aula.sql y 20261112000000_profesor.sql.
-- Se puede ejecutar más de una vez sin borrar datos.
--
-- Seguridad:
--  * Las preguntas del examen final viven SOLO en la tabla banco_final, que ningún alumno puede leer: no están en la web
--    ni en el repositorio público. Se cargan aparte (archivo de preguntas privado).
--  * El servidor elige las preguntas, guarda la hora límite, corrige y guarda la nota. El alumno no puede escribir en
--    intentos_final ni en certificados: solo leer lo suyo.
--  * Tras entregar, el alumno ve su nota y el resultado por tema, nunca qué preguntas falló ni las respuestas correctas.
--  * Máximo de intentos por día y área, para que nadie recorra el banco a base de repetir.
--  * Los certificados se emiten solo con un examen final aprobado; el nombre no se puede cambiar después. Cualquiera puede
--    comprobar un certificado con su código (página verificar.html).
--  * El panel de administración solo devuelve cifras agregadas, y exige ser administrador y una sesión con verificación
--    en dos pasos (aal2) completada.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- banco privado de preguntas
create table if not exists public.banco_final (
  id        text primary key check (id ~ '^[a-z]{2,5}-[0-9]{1,4}$'),
  area      text not null check (area in ('base', 'redes', 'bd', 'prog', 'ti', 'en', 'sec')),
  dominio   text not null check (char_length(dominio) between 1 and 80),
  pregunta  text not null check (char_length(pregunta) between 5 and 1200),
  opciones  jsonb not null check (jsonb_typeof(opciones) = 'array' and jsonb_array_length(opciones) between 2 and 6),
  correctas integer[] not null check (cardinality(correctas) between 1 and 5),
  activa    boolean not null default true
);
create index if not exists banco_final_area_idx on public.banco_final (area) where activa;

-- ---------------------------------------------------------------- intentos (los crea y corrige el servidor)
create table if not exists public.intentos_final (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  area      text not null check (area in ('base', 'redes', 'bd', 'prog', 'ti', 'en', 'sec')),
  preguntas text[] not null,
  iniciado  timestamptz not null default now(),
  limite    timestamptz not null,
  entregado timestamptz,
  puntos    integer,
  total     integer,
  aprobado  boolean,
  resultado jsonb   -- {id_pregunta: true|false}: solo para las estadísticas del administrador
);
create index if not exists intentos_final_user_idx on public.intentos_final (user_id, area, iniciado);

-- ---------------------------------------------------------------- certificados
create table if not exists public.certificados (
  codigo  text primary key check (codigo ~ '^LB-[A-HJ-NP-Z2-9]{10}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  area    text not null check (area in ('base', 'redes', 'bd', 'prog', 'ti', 'en', 'sec')),
  nombre  text not null check (char_length(btrim(nombre)) between 3 and 80),
  nota    integer not null check (nota between 0 and 100),
  emitido date not null default current_date,
  intento uuid not null references public.intentos_final(id) on delete cascade,
  unique (user_id, area)
);

-- ---------------------------------------------------------------- administradores (se añaden a mano en el SQL Editor)
create table if not exists public.administradores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  desde   timestamptz not null default now()
);

alter table public.banco_final     enable row level security;
alter table public.intentos_final  enable row level security;
alter table public.certificados    enable row level security;
alter table public.administradores enable row level security;
alter table public.banco_final     force row level security;
alter table public.intentos_final  force row level security;
alter table public.certificados    force row level security;
alter table public.administradores force row level security;

-- Sin políticas en banco_final ni administradores: nadie las lee desde la API (solo las funciones de abajo).
revoke all on public.banco_final, public.intentos_final, public.certificados, public.administradores from anon, authenticated;
-- El alumno puede leer sus intentos (sin el detalle por pregunta) y sus certificados.
grant select (id, area, iniciado, limite, entregado, puntos, total, aprobado) on public.intentos_final to authenticated;
grant select on public.certificados to authenticated;

drop policy if exists intentos_final_leer on public.intentos_final;
drop policy if exists intentos_final_mfa on public.intentos_final;
drop policy if exists certificados_leer on public.certificados;
drop policy if exists certificados_mfa on public.certificados;
create policy intentos_final_leer on public.intentos_final for select to authenticated using (user_id = (select auth.uid()));
create policy intentos_final_mfa  on public.intentos_final as restrictive for all to authenticated using ((select public.sesion_segura()));
create policy certificados_leer   on public.certificados for select to authenticated using (user_id = (select auth.uid()));
create policy certificados_mfa    on public.certificados as restrictive for all to authenticated using ((select public.sesion_segura()));

-- ---------------------------------------------------------------- empezar (o retomar) el examen final de un área
-- Devuelve las preguntas SIN las respuestas, la hora límite y la hora del servidor.
create or replace function public.final_iniciar(p_area text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c_preguntas constant integer := 25;
  c_minutos   constant integer := 40;
  c_por_dia   constant integer := 2;
  v_uid uuid := auth.uid();
  v_int public.intentos_final;
  v_ids text[];
begin
  if v_uid is null then raise exception 'Sin sesión'; end if;
  if not public.sesion_segura() then raise exception 'Verifica tu segundo factor'; end if;
  if p_area is null or p_area not in ('base', 'redes', 'bd', 'prog', 'ti', 'en', 'sec') then raise exception 'Área no válida'; end if;
  perform pg_advisory_xact_lock(hashtextextended('final:' || v_uid::text, 0));

  select * into v_int from public.intentos_final i
    where i.user_id = v_uid and i.area = p_area and i.entregado is null and i.limite > now()
    order by i.iniciado desc limit 1;
  if v_int.id is null then
    if (select count(*) from public.intentos_final i where i.user_id = v_uid and i.area = p_area and i.iniciado > now() - interval '24 hours') >= c_por_dia then
      raise exception 'Ya hiciste % intentos de este examen en las últimas 24 horas. Repasa los temas indicados y vuelve a intentarlo mañana.', c_por_dia;
    end if;
    select array_agg(s.id) into v_ids from (
      select b.id from public.banco_final b where b.area = p_area and b.activa order by random() limit c_preguntas) s;
    if coalesce(cardinality(v_ids), 0) < 10 then raise exception 'El examen final de esta área todavía no está disponible'; end if;
    insert into public.intentos_final (user_id, area, preguntas, limite)
      values (v_uid, p_area, v_ids, now() + make_interval(mins => c_minutos))
      returning * into v_int;
  end if;

  return jsonb_build_object(
    'intento', v_int.id, 'limite', v_int.limite, 'ahora', now(), 'minimo', 80,
    'preguntas', (select jsonb_agg(jsonb_build_object('id', b.id, 'dominio', b.dominio, 'pregunta', b.pregunta,
                                                      'opciones', b.opciones, 'elige', cardinality(b.correctas)) order by o.n)
                  from unnest(v_int.preguntas) with ordinality o(id, n) join public.banco_final b on b.id = o.id));
end $$;
revoke all on function public.final_iniciar(text) from public, anon;
grant execute on function public.final_iniciar(text) to authenticated;

-- ---------------------------------------------------------------- entregar y corregir
-- p_respuestas: {"id_pregunta": [índices elegidos], ...}. Una pregunta es correcta si se eligen exactamente sus opciones
-- correctas. Si se entrega más de 2 minutos después de la hora límite, el intento cuenta con 0 puntos.
create or replace function public.final_entregar(p_intento uuid, p_respuestas jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_int public.intentos_final;
  v_resp jsonb := coalesce(p_respuestas, '{}'::jsonb);
  v_tarde boolean;
  v_filas jsonb;
  v_puntos integer;
  v_total integer;
  v_resultado jsonb;
  v_temas jsonb;
  v_aprobado boolean;
begin
  if v_uid is null then raise exception 'Sin sesión'; end if;
  if not public.sesion_segura() then raise exception 'Verifica tu segundo factor'; end if;
  if jsonb_typeof(v_resp) <> 'object' or pg_column_size(v_resp) > 20000 then raise exception 'Respuestas no válidas'; end if;
  select * into v_int from public.intentos_final i where i.id = p_intento and i.user_id = v_uid for update;
  if v_int.id is null then raise exception 'Intento no encontrado'; end if;
  if v_int.entregado is not null then raise exception 'Este intento ya se entregó'; end if;
  v_tarde := now() > v_int.limite + interval '2 minutes';

  -- Una fila por pregunta: {id, dominio, ok}
  select coalesce(jsonb_agg(jsonb_build_object('id', b.id, 'dominio', b.dominio, 'ok',
           (not v_tarde) and
           coalesce((select array_agg(distinct x::integer order by x::integer)
                     from jsonb_array_elements_text(case when jsonb_typeof(v_resp -> b.id) = 'array' then v_resp -> b.id else '[]'::jsonb end) x
                     where x ~ '^[0-9]{1,2}$'), '{}')
             = (select array_agg(distinct c order by c) from unnest(b.correctas) c))), '[]'::jsonb)
    into v_filas
    from unnest(v_int.preguntas) o(id) join public.banco_final b on b.id = o.id;

  select count(*) filter (where (f->>'ok')::boolean), count(*), coalesce(jsonb_object_agg(f->>'id', (f->>'ok')::boolean), '{}'::jsonb)
    into v_puntos, v_total, v_resultado from jsonb_array_elements(v_filas) f;
  select coalesce(jsonb_object_agg(d.dominio, jsonb_build_object('p', d.p, 't', d.t)), '{}'::jsonb) into v_temas
    from (select f->>'dominio' dominio, count(*) filter (where (f->>'ok')::boolean) p, count(*) t
          from jsonb_array_elements(v_filas) f group by 1) d;
  v_aprobado := v_total > 0 and v_puntos * 100 >= v_total * 80;

  update public.intentos_final
     set entregado = now(), puntos = v_puntos, total = v_total, aprobado = v_aprobado, resultado = v_resultado
   where id = v_int.id;
  return jsonb_build_object('puntos', v_puntos, 'total', v_total, 'aprobado', v_aprobado, 'temas', v_temas, 'tarde', v_tarde,
                            'nota', case when v_total > 0 then round(v_puntos * 100.0 / v_total) else 0 end);
end $$;
revoke all on function public.final_entregar(uuid, jsonb) from public, anon;
grant execute on function public.final_entregar(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------- emitir el certificado (una vez por área)
-- Si ya existe, lo devuelve tal cual: el nombre no se puede cambiar después de emitirlo.
create or replace function public.certificado_emitir(p_area text, p_nombre text) returns public.certificados
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_abc constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_cert public.certificados;
  v_mejor public.intentos_final;
  v_nombre text := regexp_replace(btrim(coalesce(p_nombre, '')), '\s+', ' ', 'g');
  v_bytes bytea;
  v_i integer;
  v_codigo text;
begin
  if v_uid is null then raise exception 'Sin sesión'; end if;
  if not public.sesion_segura() then raise exception 'Verifica tu segundo factor'; end if;
  perform pg_advisory_xact_lock(hashtextextended('certificado:' || v_uid::text, 0));
  select * into v_cert from public.certificados c where c.user_id = v_uid and c.area = p_area;
  if v_cert.codigo is not null then return v_cert; end if;
  select * into v_mejor from public.intentos_final i
    where i.user_id = v_uid and i.area = p_area and i.aprobado
    order by i.puntos * 1.0 / nullif(i.total, 0) desc, i.entregado asc limit 1;
  if v_mejor.id is null then raise exception 'Para obtener el certificado tienes que aprobar el examen final del área'; end if;
  if char_length(v_nombre) not between 3 and 80 then raise exception 'El nombre debe tener entre 3 y 80 caracteres'; end if;
  loop
    v_bytes := uuid_send(gen_random_uuid());
    v_codigo := 'LB-';
    foreach v_i in array array[0, 1, 2, 3, 4, 5, 7, 9, 10, 11] loop v_codigo := v_codigo || substr(v_abc, (get_byte(v_bytes, v_i) % 32) + 1, 1); end loop;
    exit when not exists (select 1 from public.certificados c where c.codigo = v_codigo);
  end loop;
  insert into public.certificados (codigo, user_id, area, nombre, nota, intento)
    values (v_codigo, v_uid, p_area, v_nombre, round(v_mejor.puntos * 100.0 / v_mejor.total), v_mejor.id)
    returning * into v_cert;
  return v_cert;
end $$;
revoke all on function public.certificado_emitir(text, text) from public, anon;
grant execute on function public.certificado_emitir(text, text) to authenticated;

-- ---------------------------------------------------------------- comprobar un certificado (público)
-- Devuelve solo lo que ya figura en el certificado: nombre, área, nota y fecha.
create or replace function public.certificado_verificar(p_codigo text)
returns table (nombre text, area text, nota integer, emitido date)
language sql stable security definer set search_path = '' as $$
  -- Acepta el código con o sin «LB-», en minúsculas y con espacios o guiones.
  with entrada as (select regexp_replace(upper(coalesce(p_codigo, '')), '[^A-Z0-9]', '', 'g') s)
  select c.nombre, c.area, c.nota, c.emitido from public.certificados c, entrada e
  where (length(e.s) = 10 or (length(e.s) = 12 and left(e.s, 2) = 'LB')) and c.codigo = 'LB-' || right(e.s, 10);
$$;
revoke all on function public.certificado_verificar(text) from public;
grant execute on function public.certificado_verificar(text) to anon, authenticated;

-- ---------------------------------------------------------------- panel de administración
-- ¿Es administrador con la verificación en dos pasos completada? (la web lo usa para mostrar u ocultar el panel)
create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(auth.jwt()->>'aal', '') = 'aal2'
     and exists (select 1 from public.administradores a where a.user_id = auth.uid());
$$;
revoke all on function public.es_admin() from public, anon;
grant execute on function public.es_admin() to authenticated;

-- Cifras agregadas de toda la plataforma. Nunca devuelve correos, nombres ni datos de un alumno concreto.
create or replace function public.admin_estadisticas() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_area text;
begin
  if auth.uid() is null or not exists (select 1 from public.administradores a where a.user_id = auth.uid()) then
    raise exception 'No autorizado';
  end if;
  if coalesce(auth.jwt()->>'aal', '') <> 'aal2' then
    raise exception 'El panel de administración exige la verificación en dos pasos: actívala en «Tu cuenta» y vuelve a entrar';
  end if;
  return jsonb_build_object(
    'generado', now(),
    'usuarios', jsonb_build_object(
      'total',     (select count(*) from auth.users),
      'nuevos_7',  (select count(*) from auth.users u where u.created_at > now() - interval '7 days'),
      'nuevos_30', (select count(*) from auth.users u where u.created_at > now() - interval '30 days'),
      'activos_7', (select count(distinct p.user_id) from public.progreso p where p.actualizado > now() - interval '7 days'),
      'activos_30',(select count(distinct p.user_id) from public.progreso p where p.actualizado > now() - interval '30 days'),
      'con_mfa',   (select count(distinct f.user_id) from auth.mfa_factors f where f.status = 'verified')),
    'registros_semana', (select coalesce(jsonb_agg(jsonb_build_object('semana', s.semana, 'n', s.n) order by s.semana), '[]'::jsonb) from (
        select date_trunc('week', u.created_at)::date semana, count(*) n from auth.users u
        where u.created_at > now() - interval '12 weeks' group by 1) s),
    'areas', (select coalesce(jsonb_object_agg(x.area, jsonb_build_object('lecciones', x.lecciones, 'alumnos', x.alumnos)), '{}'::jsonb) from (
        select case substr(p.item_id, 9, 1) when 'i' then 'base' when 'm' then 'redes' when 'b' then 'bd' when 'p' then 'prog'
                                            when 't' then 'ti' when 'e' then 'en' when 'c' then 'sec' end area,
               count(*) lecciones, count(distinct p.user_id) alumnos
        from public.progreso p where p.tipo = 'leccion' and p.hecho and p.item_id like 'leccion:%' group by 1) x where x.area is not null),
    'simulacros', (select jsonb_build_object('total', count(*), 'alumnos', count(distinct e.user_id),
                                             'nota_media', round(avg(e.puntos * 100.0 / e.total))) from public.examenes e),
    'finales', (select coalesce(jsonb_object_agg(f.area, jsonb_build_object('intentos', f.intentos, 'aprobados', f.aprobados,
                                                                              'alumnos', f.alumnos, 'nota_media', f.nota_media)), '{}'::jsonb) from (
        select i.area, count(*) intentos, count(*) filter (where i.aprobado) aprobados, count(distinct i.user_id) alumnos,
               round(avg(i.puntos * 100.0 / nullif(i.total, 0))) nota_media
        from public.intentos_final i where i.entregado is not null group by i.area) f),
    'certificados', (select coalesce(jsonb_object_agg(c.area, c.n), '{}'::jsonb) from (
        select area, count(*) n from public.certificados group by area) c),
    'banco', (select coalesce(jsonb_object_agg(b.area, b.n), '{}'::jsonb) from (
        select area, count(*) n from public.banco_final where activa group by area) b),
    'preguntas_dificiles', (select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'area', b.area, 'pregunta', b.pregunta,
                                                                         'respuestas', d.t, 'fallos', d.f) order by d.f * 1.0 / d.t desc, d.t desc), '[]'::jsonb) from (
        select r.key id, count(*) t, count(*) filter (where r.value = 'false'::jsonb) f
        from public.intentos_final i, jsonb_each(i.resultado) r where i.entregado is not null
        group by r.key having count(*) >= 5 order by count(*) filter (where r.value = 'false'::jsonb) * 1.0 / count(*) desc limit 10) d
        join public.banco_final b on b.id = d.id),
    'clases', jsonb_build_object('total', (select count(*) from public.clases),
                                 'alumnos', (select count(distinct m.user_id) from public.clase_miembros m)));
end $$;
revoke all on function public.admin_estadisticas() from public, anon;
grant execute on function public.admin_estadisticas() to authenticated;
