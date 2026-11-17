-- Pruebas de seguridad del contenido de pago. Se ejecutan con scripts/probar-sql.sh después de aplicar las migraciones
-- y _privado/premium.sql (el contenido de pago real). Usa sus propios usuarios y lo deja todo como estaba.
\set ON_ERROR_STOP 1
\set ana   '88888888-8888-8888-8888-888888888888'
\set beto  '99999999-9999-9999-9999-999999999999'

create or replace function pg_temp.como(p_uid text, p_aal text default 'aal1') returns void language sql as $$
  select set_config('request.jwt.claims', case when p_uid is null then '{}' else json_build_object('sub', p_uid, 'aal', p_aal)::text end, false);
$$;
create or replace function pg_temp.debe(cond boolean, msg text) returns void language plpgsql as $$
begin if not coalesce(cond, false) then raise exception 'FALLA: %', msg; end if; end $$;
create or replace function pg_temp.falla(sql text, msg text) returns void language plpgsql as $$
begin execute sql; raise exception 'FALLA (debía dar error): %', msg;
exception when others then
  if sqlerrm like 'FALLA%' then raise; end if;
end $$;
grant execute on all functions in schema pg_temp to anon, authenticated;

insert into auth.users (id, email) values (:'ana', 'ana-premium@example.com'), (:'beto', 'beto-premium@example.com');
select pg_temp.debe((select count(*) from public.lecciones_premium) > 100, 'el contenido de pago está cargado');
select pg_temp.debe((select count(*) from public.preguntas_premium) > 500, 'las preguntas de pago están cargadas');

-- 1. Sin sesión: nada
set role anon;
select pg_temp.como(null);
select pg_temp.falla($$select * from public.lecciones_premium$$, 'anon no lee lecciones de pago');
select pg_temp.falla($$select * from public.preguntas_premium$$, 'anon no lee preguntas de pago');
select pg_temp.falla($$select public.tiene_acceso()$$, 'anon no llama a tiene_acceso');
select pg_temp.debe(not (public.mi_acceso()->>'acceso')::boolean and (public.mi_acceso()->>'abierto') is not null, 'anon ve si el acceso está abierto, sin acceso');
reset role;

-- 2. Con el interruptor abierto (sin cobro todavía), cualquier cuenta tiene acceso
update public.ajustes set valor = 'true' where clave = 'acceso_abierto';
set role authenticated;
select pg_temp.como(:'ana');
select pg_temp.debe(public.tiene_acceso(), 'acceso abierto: Ana tiene acceso');
select pg_temp.falla($$select * from public.lecciones_premium$$, 'ni con acceso se lee la tabla de golpe');
select pg_temp.falla($$select * from public.preguntas_premium$$, 'ni con acceso se leen todas las preguntas de la tabla');
select pg_temp.debe(public.leer_leccion('m10-politicas') ? 'blocks', 'Ana lee una lección de pago con leer_leccion');
select pg_temp.debe(jsonb_array_length(public.banco_premium()) > 500, 'Ana recibe el banco de preguntas');
select pg_temp.debe((public.mi_acceso()->>'abierto')::boolean, 'mi_acceso indica que está abierto');
select pg_temp.falla($$update public.ajustes set valor = 'true'$$, 'nadie cambia el interruptor desde la API');
select pg_temp.falla($$insert into public.suscripciones (user_id, plan, hasta) values (auth.uid(), 'anual', now() + interval '1 year')$$, 'nadie se regala una suscripción');
select pg_temp.falla($$update public.lecciones_premium set blocks = '[]'$$, 'nadie modifica el contenido');
reset role;

-- 3. Interruptor cerrado (cobrando): solo con suscripción vigente
update public.ajustes set valor = 'false' where clave = 'acceso_abierto';
insert into public.suscripciones (user_id, plan, hasta) values (:'ana', 'anual', now() + interval '1 year'), (:'beto', 'mensual', now() - interval '1 day');
set role authenticated;
select pg_temp.como(:'ana');
select pg_temp.debe(public.tiene_acceso(), 'Ana con suscripción vigente tiene acceso');
select pg_temp.debe(public.mi_acceso()->>'plan' = 'anual', 'mi_acceso muestra su plan');
select pg_temp.debe((select count(*) from public.suscripciones) = 1, 'Ana solo ve su suscripción');
select pg_temp.como(:'beto');
select pg_temp.debe(not public.tiene_acceso(), 'Beto con suscripción vencida no tiene acceso');
select pg_temp.debe(public.leer_leccion('m10-politicas')->>'error' = 'sin_acceso', 'Beto no lee lecciones de pago');
select pg_temp.debe(public.banco_premium()->>'error' = 'sin_acceso', 'Beto no lee preguntas de pago');
select pg_temp.debe((select count(*) from public.suscripciones) = 1 and (select user_id from public.suscripciones) = :'beto', 'Beto solo ve la suya');
reset role;

-- 4. Verificación en dos pasos: con factor activo, aal1 no tiene acceso aunque pague
insert into auth.mfa_factors (user_id, status) values (:'ana', 'verified');
set role authenticated;
select pg_temp.como(:'ana', 'aal1');
select pg_temp.debe(not public.tiene_acceso(), 'aal1 sin acceso');
select pg_temp.debe(public.leer_leccion('m10-politicas')->>'error' = 'sin_acceso', 'aal1 no lee lecciones de pago');
select pg_temp.como(:'ana', 'aal2');
select pg_temp.debe(public.tiene_acceso(), 'aal2 con acceso');
reset role;

-- Limpieza: se deja el interruptor abierto, como en una instalación nueva
update public.ajustes set valor = 'true' where clave = 'acceso_abierto';
delete from auth.users where id in (:'ana', :'beto');
\echo 'Pruebas del contenido de pago: todo correcto'
