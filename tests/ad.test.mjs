// Active Directory simulado: los tickets no empiezan resueltos, la secuencia correcta los cierra y los errores típicos se detectan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nuevoAd, TICKETS, buscar, verificarIdentidad, desbloquear, restablecer, crearUsuario, mover, ponerGrupo, habilitar, borrar, cerrarTicket, rechazarTicket, contrasenaValida } from '../js/ti/ad.js';

test('AD: ningún ticket empieza resuelto', () => {
  const s = nuevoAd();
  for (const t of TICKETS) assert.equal(cerrarTicket(s, t.id).ok, false, t.id);
});

test('AD: la secuencia correcta cierra los 7 tickets', () => {
  const s = nuevoAd();
  assert.ok(desbloquear(s, 'mfernandez').ok);
  assert.equal(restablecer(s, 'psantos', 'Temporal2026Ok', true).ok, false, 'sin verificar identidad');
  verificarIdentidad(s, 'psantos');
  assert.equal(restablecer(s, 'psantos', 'corta', true).ok, false);
  assert.ok(restablecer(s, 'psantos', 'Temporal2026Ok', true).ok);
  assert.ok(crearUsuario(s, { nombre: 'Laura', apellido: 'Méndez', usuario: 'lmendez', ou: 'Ventas', contrasena: 'Bienvenida2026', cambiar: true }).ok);
  ponerGrupo(s, 'lmendez', 'GG_Ventas', true);
  mover(s, 'jmartinez', 'Contabilidad'); ponerGrupo(s, 'jmartinez', 'GG_Contabilidad', true); ponerGrupo(s, 'jmartinez', 'GG_Ventas', false);
  habilitar(s, 'cpena', false); mover(s, 'cpena', 'Bajas'); ponerGrupo(s, 'cpena', 'GG_VPN', false);
  ponerGrupo(s, 'abatista', 'GG_VPN', true);
  for (const t of TICKETS.filter(t => !t.rechazar)) assert.ok(cerrarTicket(s, t.id).ok, t.id + ': ' + cerrarTicket(s, t.id).msg);
  assert.equal(rechazarTicket(s, 'T-5106').ok, false, 'una petición legítima no se rechaza');
  assert.ok(rechazarTicket(s, 'T-5107').ok);
  assert.equal(s.cerrados.size, TICKETS.length);
});

test('AD: errores típicos', () => {
  const s = nuevoAd();
  verificarIdentidad(s, 'mfernandez'); restablecer(s, 'mfernandez', 'OtraClave2026x', true);
  assert.match(cerrarTicket(s, 'T-5101').msg, /desbloquear/);
  borrar(s, 'cpena');
  assert.match(cerrarTicket(s, 'T-5105').msg, /deshabilita, no se borra/);
  ponerGrupo(s, 'rvaldez', 'Admins. del dominio', true);
  assert.match(rechazarTicket(s, 'T-5107').msg, /control total/);
  assert.equal(crearUsuario(s, { nombre: 'A', apellido: 'B', usuario: 'mfernandez', ou: 'Ventas', contrasena: 'Bienvenida2026' }).ok, false, 'duplicado');
  assert.ok(contrasenaValida('abc'));
  assert.equal(contrasenaValida('Bienvenida2026'), null);
  assert.ok(buscar(s, 'lrosario'));
});
