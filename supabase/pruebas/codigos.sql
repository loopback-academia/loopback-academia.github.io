-- Pruebas de los códigos de acceso y el registro de ventas. Usa sus propios usuarios y lo deja todo como estaba.
\set ON_ERROR_STOP 1
\set jefe  'aaaaaaaa-0000-4000-8000-000000000001'
\set ana   'aaaaaaaa-0000-4000-8000-000000000002'
\set leo   'aaaaaaaa-0000-4000-8000-000000000003'

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

insert into auth.users (id, email) values (:'jefe', 'jefe@example.com'), (:'ana', 'ana-cod@example.com'), (:'leo', 'leo-cod@example.com');
insert into public.administradores (user_id) values (:'jefe');
update public.ajustes set valor = 'false' where clave = 'acceso_abierto';

-- 1. Solo el administrador (con aal2) crea códigos y ve las ventas
set role authenticated;
select pg_temp.como(:'ana', 'aal2');
select pg_temp.falla($$select public.admin_crear_codigo('anual', 'transferencia', 3499, 'DOP', 'yo misma')$$, 'un alumno no crea códigos');
select pg_temp.falla($$select public.admin_ventas()$$, 'un alumno no ve las ventas');
select pg_temp.falla($$select * from public.codigos_acceso$$, 'nadie lee la tabla de códigos');
select pg_temp.como(:'jefe', 'aal1');
select pg_temp.falla($$select public.admin_crear_codigo('anual', 'transferencia')$$, 'el administrador necesita aal2');
select pg_temp.como(:'jefe', 'aal2');
select public.admin_crear_codigo('trimestral', 'transferencia', 1199, 'DOP', 'Ana · WhatsApp') as cod1 \gset
select public.admin_crear_codigo('mensual', 'hotmart', 9, 'USD', 'Venta Hotmart') as cod2 \gset
select public.admin_crear_codigo('anual', 'transferencia', 3499, 'DOP', 'Enviado por error') as cod3 \gset
select pg_temp.debe(:'cod1' ~ '^LB-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$', 'formato del código');
reset role;
select pg_temp.debe((select count(*) from public.codigos_acceso where hash = public.hash_codigo(:'cod1')) = 1, 'se guarda solo el resumen');
set role authenticated;
select pg_temp.como(:'jefe', 'aal2');
select (select (c->>'id') from jsonb_array_elements(public.admin_ventas()->'codigos') c where c->>'nota' = 'Enviado por error') as id3 \gset
select public.admin_anular_codigo(:'id3');
select pg_temp.debe((public.admin_ventas()->'totales'->'DOP'->>'total')::numeric = 1199, 'el anulado no cuenta en los totales');
select pg_temp.debe((public.admin_ventas()->'totales'->'USD'->>'total')::numeric = 9, 'totales en dólares');

-- 2. Canjear: amplía la suscripción y el código no se puede reutilizar
select pg_temp.como(:'ana');
select pg_temp.debe(not public.tiene_acceso(), 'antes de canjear, Ana no tiene acceso');
select public.canjear_codigo(lower(replace(:'cod1', '-', ' '))) as r1 \gset
select pg_temp.debe(:'r1'::jsonb->>'plan' = 'trimestral', 'acepta minúsculas y espacios');
select pg_temp.debe(public.tiene_acceso(), 'después de canjear tiene acceso');
select pg_temp.debe((select hasta from public.suscripciones) between now() + interval '91 days' and now() + interval '93 days', 'unos 92 días');
select public.canjear_codigo(substr(:'cod2', 4)) as r2 \gset
select pg_temp.debe((select hasta from public.suscripciones) between now() + interval '122 days' and now() + interval '124 days', 'el segundo código se suma al primero (y sirve sin «LB»)');
select pg_temp.como(:'leo');
select pg_temp.debe(public.canjear_codigo(:'cod1') ? 'error', 'un código ya usado no sirve');
select pg_temp.debe(public.canjear_codigo(:'cod3') ? 'error', 'un código anulado no sirve');
select pg_temp.debe(not public.tiene_acceso(), 'Leo sigue sin acceso');
select pg_temp.falla($$insert into public.suscripciones (user_id, plan, hasta) values (auth.uid(), 'anual', now() + interval '1 year')$$, 'nadie se crea una suscripción');

-- 3. Límite de intentos: 10 por hora (los fallos cuentan)
select public.canjear_codigo('LB-ZZZZ-ZZZZ') from generate_series(1, 8) \g /dev/null
select pg_temp.falla($$select public.canjear_codigo('LB-AAAA-AAAA')$$, 'el intento 11 se bloquea');
reset role;
select pg_temp.debe((select count(*) from public.intentos_canje where user_id = :'leo') = 10, 'los intentos fallidos quedan registrados');

-- Limpieza
update public.ajustes set valor = 'true' where clave = 'acceso_abierto';
delete from public.codigos_acceso where creado_por = :'jefe';
delete from auth.users where id in (:'jefe', :'ana', :'leo');
\echo 'Pruebas de los códigos de acceso: todo correcto'
