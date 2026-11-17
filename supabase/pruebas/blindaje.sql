-- Pruebas del blindaje: límites de lectura del contenido de pago, códigos con caducidad y a nombre de un correo,
-- correo confirmado para canjear, límite global de canje, bloqueo de cuentas y alertas del administrador.
-- Usa sus propios usuarios y lo deja todo como estaba.
\set ON_ERROR_STOP 1
\set jefe  'bbbbbbbb-0000-4000-8000-000000000001'
\set ana   'bbbbbbbb-0000-4000-8000-000000000002'
\set leo   'bbbbbbbb-0000-4000-8000-000000000003'
\set nuevo 'bbbbbbbb-0000-4000-8000-000000000004'

create or replace function pg_temp.como(p_uid text, p_aal text default 'aal1', p_sesion text default 's1') returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'aal', p_aal, 'session_id', p_sesion)::text, false);
$$;
create or replace function pg_temp.debe(cond boolean, msg text) returns void language plpgsql as $$
begin if not coalesce(cond, false) then raise exception 'FALLA: %', msg; end if; end $$;
create or replace function pg_temp.falla(sql text, msg text) returns void language plpgsql as $$
begin execute sql; raise exception 'FALLA (debía dar error): %', msg;
exception when others then
  if sqlerrm like 'FALLA%' then raise; end if;
end $$;
grant execute on all functions in schema pg_temp to anon, authenticated;

insert into auth.users (id, email) values (:'jefe', 'jefe-bl@example.com'), (:'ana', 'ana-bl@example.com'), (:'leo', 'leo-bl@example.com');
insert into auth.users (id, email, email_confirmed_at) values (:'nuevo', 'nuevo-bl@example.com', null);
insert into public.administradores (user_id) values (:'jefe');
update public.ajustes set valor = 'false' where clave = 'acceso_abierto';
insert into public.suscripciones (user_id, plan, hasta) values (:'ana', 'anual', now() + interval '1 year');

-- 1. Límite de lecturas: 60 por hora
set role authenticated;
select pg_temp.como(:'ana');
select pg_temp.debe(public.leer_leccion('m10-nat') ? 'blocks', 'Ana lee una lección');
select pg_temp.debe(public.leer_leccion('no-existe')->>'error' = 'no_existe', 'una lección que no existe');
reset role;
insert into public.lecturas_premium (user_id, recurso, sesion) select :'ana', 'leccion:m10-nat', 's1' from generate_series(1, 58);
set role authenticated;
select pg_temp.como(:'ana');
select pg_temp.debe(public.leer_leccion('m10-vpn') ? 'blocks', 'la lectura 60 todavía entra');
select pg_temp.debe(public.leer_leccion('m10-vpn')->>'error' = 'limite', 'la 61 en una hora no');
select pg_temp.falla($$select * from public.lecturas_premium$$, 'nadie lee el registro de lecturas');
reset role;
delete from public.lecturas_premium where user_id = :'ana';

-- 2. Cuenta bloqueada: pierde el acceso y no puede canjear
set role authenticated;
select pg_temp.como(:'ana');
select pg_temp.falla($$select public.admin_bloquear('bbbbbbbb-0000-4000-8000-000000000003', 'prueba')$$, 'un alumno no bloquea');
select pg_temp.como(:'jefe', 'aal2');
select public.admin_bloquear(:'ana', 'Cuenta compartida');
select pg_temp.falla($$select public.admin_bloquear(auth.uid(), 'yo')$$, 'el admin no se bloquea a sí mismo');
select pg_temp.como(:'ana');
select pg_temp.debe(not public.tiene_acceso(), 'bloqueada: sin acceso aunque pague');
select pg_temp.debe(public.leer_leccion('m10-nat')->>'error' = 'sin_acceso', 'bloqueada: no lee lecciones');
select pg_temp.debe(public.canjear_codigo('LB-AAAA-AAAA') ? 'error', 'bloqueada: no canjea');
select pg_temp.como(:'jefe', 'aal2');
select pg_temp.debe(exists (select 1 from jsonb_array_elements(public.admin_alertas()) a where a->>'correo' = 'ana-bl@example.com' and (a->>'bloqueada')::boolean), 'la cuenta bloqueada sale en las alertas');
select public.admin_desbloquear(:'ana');
select pg_temp.como(:'ana');
select pg_temp.debe(public.tiene_acceso(), 'desbloqueada: vuelve a tener acceso');
reset role;

-- 3. Códigos a nombre de un correo y con caducidad
set role authenticated;
select pg_temp.como(:'jefe', 'aal2');
select pg_temp.falla($$select public.admin_crear_codigo('mensual', 'transferencia', 499, 'DOP', '', null, 'no-es-correo')$$, 'correo no válido');
select public.admin_crear_codigo('mensual', 'transferencia', 499, 'DOP', 'Para Leo', null, '  Leo-BL@Example.com ') as para_leo \gset
select public.admin_crear_codigo('mensual', 'transferencia', 499, 'DOP', 'Caducará') as caduco \gset
select pg_temp.debe((select c->>'para_correo' from jsonb_array_elements(public.admin_ventas()->'codigos') c where c->>'nota' = 'Para Leo') = 'leo-bl@example.com', 'se guarda el correo en minúsculas');
select pg_temp.como(:'ana');
select pg_temp.debe(public.canjear_codigo(:'para_leo')->>'error' like '%otra cuenta%', 'un código a nombre de Leo no sirve a Ana');
select pg_temp.como(:'leo');
select pg_temp.debe(public.canjear_codigo(:'para_leo')->>'plan' = 'mensual', 'Leo sí puede canjearlo');
reset role;
update public.codigos_acceso set caduca = now() - interval '1 minute' where hash = public.hash_codigo(:'caduco');
set role authenticated;
select pg_temp.como(:'ana');
select pg_temp.debe(public.canjear_codigo(:'caduco')->>'error' like '%caducó%', 'un código caducado no sirve');
select pg_temp.como(:'jefe', 'aal2');
select pg_temp.debe((public.admin_ventas()->>'pendientes')::int = 0, 'los caducados no cuentan como pendientes');

-- 4. Correo sin confirmar: no se canjea
select public.admin_crear_codigo('mensual', 'transferencia', 499, 'DOP', 'Nuevo') as cod_nuevo \gset
select pg_temp.como(:'nuevo');
select pg_temp.debe(public.canjear_codigo(:'cod_nuevo')->>'error' like '%confirma tu correo%', 'sin correo confirmado no se canjea');
reset role;

-- 5. Límite global: con 300 fallos en la última hora, el canje se pausa para todos
insert into public.intentos_canje (user_id) select :'jefe' from generate_series(1, 300);
set role authenticated;
select pg_temp.como(:'leo');
select pg_temp.falla($$select public.canjear_codigo('LB-ZZZZ-ZZZZ')$$, 'canje en pausa por el límite global');
reset role;
delete from public.intentos_canje where user_id in (:'jefe', :'ana', :'leo', :'nuevo');

-- 6. Varias sesiones distintas leyendo: aparece en las alertas (posible cuenta compartida)
insert into public.lecturas_premium (user_id, recurso, sesion) select :'leo', 'leccion:m10-nat', 'sesion-' || n from generate_series(1, 6) n;
set role authenticated;
select pg_temp.como(:'jefe', 'aal2');
select pg_temp.debe(exists (select 1 from jsonb_array_elements(public.admin_alertas()) a where a->>'correo' = 'leo-bl@example.com' and a->>'motivo' like '%compartida%'), 'alerta de cuenta compartida');
select pg_temp.como(:'ana');
select pg_temp.falla($$select public.admin_alertas()$$, 'un alumno no ve las alertas');
reset role;

-- Limpieza
update public.ajustes set valor = 'true' where clave = 'acceso_abierto';
delete from public.codigos_acceso where creado_por = :'jefe';
delete from public.administradores where user_id = :'jefe';
delete from auth.users where id in (:'jefe', :'ana', :'leo', :'nuevo');
\echo 'Pruebas del blindaje: todo correcto'
