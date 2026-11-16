-- Pruebas de seguridad de los exámenes finales verificados, los certificados y el panel de administración.
-- Se ejecutan con scripts/probar-sql.sh contra un PostgreSQL local que imita Supabase. Usan su propio banco de preguntas
-- de prueba y sus propios usuarios, y lo borran todo al terminar.
\set ON_ERROR_STOP 1
\set alumno '55555555-5555-5555-5555-555555555555'
\set otro   '66666666-6666-6666-6666-666666666666'
\set admin  '77777777-7777-7777-7777-777777777777'

create or replace function pg_temp.como(p_uid text, p_aal text default 'aal1') returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'aal', p_aal)::text, false);
$$;
create or replace function pg_temp.debe(cond boolean, msg text) returns void language plpgsql as $$
begin if not coalesce(cond, false) then raise exception 'FALLA: %', msg; end if; end $$;
create or replace function pg_temp.falla(sql text, msg text) returns void language plpgsql as $$
begin execute sql; raise exception 'FALLA (debía dar error): %', msg;
exception when others then
  if sqlerrm like 'FALLA%' then raise; end if;
end $$;
grant execute on all functions in schema pg_temp to anon, authenticated;

-- Banco de prueba: 12 preguntas de redes (la 2 tiene dos respuestas correctas) y usuarios nuevos.
insert into auth.users (id, email) values (:'alumno', 'alumno@example.com'), (:'otro', 'otro@example.com'), (:'admin', 'admin@example.com');
insert into public.banco_final (id, area, dominio, pregunta, opciones, correctas)
  select 'red-' || g, 'redes', case when g <= 6 then 'Conmutación' else 'Enrutamiento' end, 'Pregunta de prueba ' || g,
         '["A", "B", "C", "D"]'::jsonb, case when g = 2 then array[0, 2] else array[g % 4] end
  from generate_series(1, 12) g;

-- 1. Nadie lee el banco; las preguntas llegan sin respuestas
set role authenticated;
select pg_temp.como(:'alumno');
select pg_temp.falla($$select * from public.banco_final$$, 'el alumno no lee el banco');
select pg_temp.falla($$select * from public.administradores$$, 'el alumno no lee administradores');
select (public.final_iniciar('redes')) as examen \gset
select pg_temp.debe(jsonb_array_length((:'examen'::jsonb)->'preguntas') = 12, 'el examen trae las 12 preguntas');
select pg_temp.debe(not ((:'examen'::jsonb)->'preguntas'->0 ? 'correctas'), 'las preguntas no llevan la respuesta');
select pg_temp.debe(position('correctas' in :'examen') = 0, 'nada de correctas en el examen');
select pg_temp.debe((public.final_iniciar('redes'))->>'intento' = (:'examen'::jsonb)->>'intento', 'recargar retoma el mismo intento');
select pg_temp.falla($$select public.final_iniciar('admin')$$, 'área no válida');

-- 2. El alumno no puede escribir sus notas ni ver el detalle por pregunta
select pg_temp.falla(format($$update public.intentos_final set aprobado = true, puntos = 12, total = 12 where id = %L$$, (:'examen'::jsonb)->>'intento'), 'no puede ponerse la nota');
select pg_temp.falla($$insert into public.intentos_final (user_id, area, preguntas, limite, aprobado) values (auth.uid(), 'redes', '{}', now(), true)$$, 'no puede crear intentos aprobados');
select pg_temp.falla($$select resultado from public.intentos_final$$, 'no ve qué preguntas falló');
select pg_temp.falla($$insert into public.certificados (codigo, user_id, area, nombre, nota, intento) values ('LB-AAAAAAAAAA', auth.uid(), 'redes', 'Falso', 100, gen_random_uuid())$$, 'no puede crear certificados');

-- 3. Corrección en el servidor (las respuestas correctas las calcula la prueba como superusuario)
reset role;
select jsonb_object_agg(id, to_jsonb(correctas)) as todas_bien from public.banco_final where id like 'red-%' \gset
set role authenticated;
select pg_temp.como(:'alumno');
select pg_temp.falla($$select public.certificado_emitir('redes', 'Ana Pérez')$$, 'sin aprobar no hay certificado');
select public.final_entregar(((:'examen'::jsonb)->>'intento')::uuid, :'todas_bien'::jsonb) as nota \gset
select pg_temp.debe((:'nota'::jsonb->>'aprobado')::boolean and (:'nota'::jsonb->>'puntos')::int = 12, 'todo bien = aprobado con 12');
select pg_temp.debe((:'nota'::jsonb->'temas'->'Conmutación'->>'t')::int = 6, 'resultado por tema');
select pg_temp.debe(position('red-' in :'nota') = 0, 'el resultado no dice qué preguntas');
select pg_temp.falla(format($$select public.final_entregar(%L, '{}')$$, (:'examen'::jsonb)->>'intento'), 'no se puede entregar dos veces');
-- La de dos respuestas: elegir solo una de las dos es incorrecto
select (public.final_iniciar('redes'))->>'intento' as intento2 \gset
select public.final_entregar(:'intento2', jsonb_set(:'todas_bien'::jsonb, '{red-2}', '[0]')) as nota2 \gset
select pg_temp.debe((:'nota2'::jsonb->>'puntos')::int = 11, 'respuesta incompleta = incorrecta');
-- Límite de 2 intentos al día por área
select pg_temp.falla($$select public.final_iniciar('redes')$$, 'máximo 2 intentos al día');

-- 4. Entregar fuera de tiempo cuenta como 0
select pg_temp.como(:'otro');
select (public.final_iniciar('redes'))->>'intento' as intento3 \gset
select pg_temp.falla(format($$select public.final_entregar(%L, '{}')$$, :'intento2'), 'no se entrega el intento de otro');
reset role;
update public.intentos_final set limite = now() - interval '10 minutes' where id = :'intento3';
set role authenticated;
select pg_temp.como(:'otro');
select public.final_entregar(:'intento3', :'todas_bien'::jsonb) as nota3 \gset
select pg_temp.debe((:'nota3'::jsonb->>'puntos')::int = 0 and (:'nota3'::jsonb->>'tarde')::boolean, 'tarde = 0 puntos');
select pg_temp.debe((select count(*) from public.intentos_final) = 1, 'otro solo ve sus intentos');

-- 5. Certificado: se emite una vez, con nombre fijo, y cualquiera lo puede comprobar
select pg_temp.como(:'alumno');
select codigo from public.certificado_emitir('redes', '  Ana   Pérez ') \gset
select pg_temp.debe((select nombre from public.certificados where codigo = :'codigo') = 'Ana Pérez', 'nombre normalizado');
select pg_temp.debe((select nombre from public.certificado_emitir('redes', 'Otra Persona')) = 'Ana Pérez', 'el nombre no se cambia');
select pg_temp.debe((select nota from public.certificados where codigo = :'codigo') = 100, 'nota del mejor intento aprobado');
select pg_temp.como(:'otro');
select pg_temp.falla($$select public.certificado_emitir('redes', 'Otro Nombre')$$, 'otro no aprobó');
select pg_temp.debe((select count(*) from public.certificados) = 0, 'otro no ve certificados ajenos');
reset role;
set role anon;
select pg_temp.debe((select nombre from public.certificado_verificar(:'codigo')) = 'Ana Pérez', 'verificación pública');
select pg_temp.debe((select count(*) from public.certificado_verificar(lower(replace(:'codigo', 'LB-', ' lb ')))) = 1, 'acepta minúsculas y espacios');
select pg_temp.debe((select count(*) from public.certificado_verificar('LB-ZZZZZZZZZZ')) = 0, 'código inexistente');
select pg_temp.falla($$select public.final_iniciar('redes')$$, 'anon no hace exámenes');
select pg_temp.falla($$select public.admin_estadisticas()$$, 'anon no ve estadísticas');
select pg_temp.falla($$select * from public.certificados$$, 'anon no lista certificados');
reset role;

-- 6. Verificación en dos pasos: con un factor activo, aal1 no hace el examen
insert into auth.mfa_factors (user_id, status) values (:'otro', 'verified');
set role authenticated;
select pg_temp.como(:'otro', 'aal1');
select pg_temp.falla($$select public.final_iniciar('bd')$$, 'aal1 no empieza exámenes');
reset role;

-- 7. Panel de administración: hace falta ser administrador y aal2
set role authenticated;
select pg_temp.como(:'admin', 'aal2');
select pg_temp.falla($$select public.admin_estadisticas()$$, 'sin ser administrador');
select pg_temp.debe(not public.es_admin(), 'es_admin falso');
reset role;
insert into public.administradores (user_id) values (:'admin');
set role authenticated;
select pg_temp.como(:'admin', 'aal1');
select pg_temp.falla($$select public.admin_estadisticas()$$, 'administrador sin aal2');
select pg_temp.debe(not public.es_admin(), 'es_admin exige aal2');
select pg_temp.como(:'admin', 'aal2');
select pg_temp.debe(public.es_admin(), 'es_admin con aal2');
select public.admin_estadisticas() as est \gset
select pg_temp.debe((:'est'::jsonb->'usuarios'->>'total')::int >= 3, 'cuenta usuarios');
select pg_temp.debe((:'est'::jsonb->'finales'->'redes'->>'intentos')::int = 3 and (:'est'::jsonb->'finales'->'redes'->>'aprobados')::int = 2, 'estadísticas de finales (12/12 y 11/12 aprueban)');
select pg_temp.debe((:'est'::jsonb->'certificados'->>'redes')::int = 1, 'certificados emitidos');
select pg_temp.debe(position('@' in :'est') = 0, 'ningún correo en las estadísticas');
select pg_temp.debe(position(:'alumno' in :'est') = 0, 'ningún identificador de alumno');

-- Limpieza
reset role;
delete from auth.users where id in (:'alumno', :'otro', :'admin');
delete from public.banco_final where id like 'red-%';
\echo 'Pruebas de exámenes finales, certificados y administración: todo correcto'
