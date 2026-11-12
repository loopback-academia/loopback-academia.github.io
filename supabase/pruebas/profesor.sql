-- Pruebas de seguridad del panel del profesor. Se ejecutan con scripts/probar-sql.sh contra un PostgreSQL local que imita
-- Supabase (roles anon/authenticated y auth.uid() leído de request.jwt.claims). Si una comprobación falla, el script se para.
\set ON_ERROR_STOP 1
\set profe '11111111-1111-1111-1111-111111111111'
\set ana   '22222222-2222-2222-2222-222222222222'
\set luis  '33333333-3333-3333-3333-333333333333'
\set intruso '44444444-4444-4444-4444-444444444444'

create or replace function pg_temp.como(p_uid text, p_aal text default 'aal1') returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'aal', p_aal)::text, false);
$$;
create or replace function pg_temp.debe(cond boolean, msg text) returns void language plpgsql as $$
begin if not coalesce(cond, false) then raise exception 'FALLA: %', msg; end if; end $$;
-- Ejecuta sql como el rol actual y comprueba que da error.
create or replace function pg_temp.falla(sql text, msg text) returns void language plpgsql as $$
begin execute sql; raise exception 'FALLA (debía dar error): %', msg;
exception when others then
  if sqlerrm like 'FALLA%' then raise; end if;
end $$;
grant execute on all functions in schema pg_temp to authenticated;

-- Progreso de los alumnos (como ellos mismos)
set role authenticated;
select pg_temp.como(:'ana');
insert into public.progreso (user_id, item_id, tipo, hecho) values (:'ana', 'leccion:m1-osi', 'leccion', true), (:'ana', 'leccion:m1-ipv4', 'leccion', false);
insert into public.progreso (user_id, item_id, tipo, puntos, total, hecho) values (:'ana', 'quiz:escalon-redes-1', 'quiz', 18, 20, true);
select pg_temp.como(:'luis');
insert into public.progreso (user_id, item_id, tipo, hecho) values (:'luis', 'leccion:b1-intro', 'leccion', true);
select pg_temp.como(:'intruso');
insert into public.progreso (user_id, item_id, tipo, hecho) values (:'intruso', 'leccion:p1-que-es', 'leccion', true);

-- 1. El profesor crea una clase; el código lo genera el servidor
select pg_temp.como(:'profe');
select codigo as codigo, id as clase from public.crear_clase('  2.º Redes  ') \gset
select pg_temp.debe(:'codigo' ~ '^[A-HJ-NP-Z2-9]{10}$', 'formato del código');
select pg_temp.debe((select nombre from public.clases where id = :'clase') = '2.º Redes', 'nombre recortado');
select pg_temp.falla($$insert into public.clases (profesor, nombre, codigo) values (auth.uid(), 'x', 'ABCDEFGHJK')$$, 'insertar clases directamente');
select pg_temp.falla($$select public.crear_clase('')$$, 'nombre vacío');
select pg_temp.falla(format($$select * from public.unirse_a_clase(%L, 'Profe')$$, :'codigo'), 'el profesor no se une a su clase');

-- 2. Un intruso no ve la clase, no ve miembros, no lee progreso ajeno ni se mete directamente
select pg_temp.como(:'intruso');
select pg_temp.debe((select count(*) from public.clases) = 0, 'el intruso no ve clases');
select pg_temp.falla(format($$select * from public.progreso_de_clase(%L)$$, :'clase'), 'el intruso no lee el progreso de la clase');
select pg_temp.falla(format($$insert into public.clase_miembros (clase_id, user_id, alias) values (%L, auth.uid(), 'x')$$, :'clase'), 'insertar miembros directamente');
select pg_temp.falla($$select * from public.unirse_a_clase('AAAAAAAAAA', 'Yo')$$, 'código inexistente');
select pg_temp.falla($$select public.crear_clase(repeat('x', 81))$$, 'nombre demasiado largo');

-- 3. Ana se une (código en minúsculas y con espacios); ve su clase pero no a los demás ni el progreso
select pg_temp.como(:'ana');
select pg_temp.debe((select nombre from public.unirse_a_clase(lower(' ' || substr(:'codigo', 1, 5) || '-' || substr(:'codigo', 6)), 'Ana G.')) = '2.º Redes', 'Ana se une');
select pg_temp.debe((select count(*) from public.clases) = 1, 'Ana ve su clase');
select pg_temp.falla(format($$select * from public.progreso_de_clase(%L)$$, :'clase'), 'un alumno no lee el progreso de la clase');
select pg_temp.falla($$select * from public.unirse_a_clase('X', '')$$, 'alias vacío');
update public.clase_miembros set alias = 'Ana García' where user_id = auth.uid();
select pg_temp.falla(format($$update public.clase_miembros set clase_id = %L where user_id = auth.uid()$$, :'clase'), 'cambiar la clase de la fila');
update public.clases set nombre = 'Hackeada';
select pg_temp.como(:'luis');
select * from public.unirse_a_clase(:'codigo', 'Luis') \g /dev/null
select pg_temp.como(:'ana');
select pg_temp.debe((select count(*) from public.clase_miembros) = 1, 'Ana solo ve su propia fila de miembro');

-- 4. El profesor ve el progreso de sus alumnos, con alias y sin el de quien no está en la clase
select pg_temp.como(:'profe');
select pg_temp.debe((select nombre from public.clases where id = :'clase') = '2.º Redes', 'un alumno no renombra la clase');
select pg_temp.debe((select count(*) from public.progreso) = 0, 'el profesor no lee la tabla progreso directamente');
select pg_temp.debe((select count(*) from public.clase_miembros where clase_id = :'clase') = 2, 'el profesor ve a sus dos alumnos');
select pg_temp.debe((select count(*) from public.progreso_de_clase(:'clase') where alias = 'Ana García' and item_id is not null) = 2, 'progreso de Ana: lo hecho y los quiz, no lo pendiente');
select pg_temp.debe((select count(*) from public.progreso_de_clase(:'clase') where item_id = 'leccion:p1-que-es') = 0, 'nada del intruso');
select pg_temp.debe((select count(distinct user_id) from public.progreso_de_clase(:'clase')) = 2, 'dos alumnos');

-- 5. Verificación en dos pasos: con un factor activo, una sesión aal1 no puede hacer nada
reset role;
insert into auth.mfa_factors (user_id, status) values (:'profe', 'verified');
set role authenticated;
select pg_temp.como(:'profe', 'aal1');
select pg_temp.debe((select count(*) from public.clases) = 0, 'aal1 no ve sus clases');
select pg_temp.falla(format($$select * from public.progreso_de_clase(%L)$$, :'clase'), 'aal1 no lee progreso');
select pg_temp.falla($$select public.crear_clase('Otra')$$, 'aal1 no crea clases');
select pg_temp.como(:'profe', 'aal2');
select pg_temp.debe((select count(*) from public.progreso_de_clase(:'clase')) >= 3, 'aal2 sí');

-- 6. Salir, expulsar y borrar
select pg_temp.como(:'ana');
delete from public.clase_miembros where user_id = auth.uid();
select pg_temp.debe((select count(*) from public.clases) = 0, 'Ana ya no ve la clase');
select pg_temp.como(:'luis');
delete from public.clase_miembros where user_id <> auth.uid();
select pg_temp.debe((select count(*) from public.clase_miembros) = 1, 'Luis no puede borrar filas de otros');
select pg_temp.como(:'profe', 'aal2');
select pg_temp.debe((select count(distinct user_id) from public.progreso_de_clase(:'clase')) = 1, 'tras salir Ana, solo queda Luis');
delete from public.clase_miembros where clase_id = :'clase';
select pg_temp.debe((select count(*) from public.progreso_de_clase(:'clase')) = 0, 'el profesor quita a Luis');
select pg_temp.como(:'intruso');
delete from public.clases;
select pg_temp.como(:'profe', 'aal2');
select pg_temp.debe((select count(*) from public.clases) = 1, 'el intruso no borra clases ajenas');
delete from public.clases where id = :'clase';
select pg_temp.debe((select count(*) from public.clases) = 0, 'el profesor borra su clase');

-- 7. Límite de clases por profesor
select pg_temp.como(:'luis');
select public.crear_clase('Clase ' || g) from generate_series(1, 20) g \g /dev/null
select pg_temp.falla($$select public.crear_clase('La 21')$$, 'límite de 20 clases');

-- 8. Los anónimos no llegan a nada
reset role;
set role anon;
select pg_temp.falla($$select * from public.clases$$, 'anon sin acceso a clases');
select pg_temp.falla($$select public.crear_clase('x')$$, 'anon no crea clases');
reset role;
\echo 'Pruebas del panel del profesor: todo correcto'
