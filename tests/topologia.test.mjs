// Simulador de topologías: capa 2 con VLAN y troncales, enrutamiento, DHCP, ping de ida y vuelta, y todos los retos resueltos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../js/labs/topologia.js';
import { RETOS, revisarReto } from '../js/labs/topologia-retos.js';

const pc = (t, n, ip, gw = '') => { const e = T.agregarEquipo(t, 'pc', { nombre: n }); const [a, p] = ip.split('/'); Object.assign(e.ifs.Fa0, { ip: a, mask: T.mascaraDe(+p) }); e.gw = gw; return e; };

test('máscaras e IP', () => {
  assert.equal(T.prefijo('255.255.255.0'), 24);
  assert.equal(T.prefijo('/26'), 26);
  assert.equal(T.prefijo('255.0.255.0'), null);
  assert.equal(T.redDe('192.168.1.77', '255.255.255.192'), '192.168.1.64');
  assert.equal(T.ipDeHost('192.168.1.0', '255.255.255.0'), false);
  assert.equal(T.ipDeHost('192.168.1.255', '255.255.255.0'), false);
  assert.equal(T.ipDeHost('10.0.12.1', '255.255.255.252'), true);
});

test('LAN con switch: ping, cable suelto y puerto apagado', () => {
  const t = T.nuevaTopologia();
  T.agregarEquipo(t, 'switch', { nombre: 'SW1' });
  pc(t, 'PC1', '10.0.0.1/24'); pc(t, 'PC2', '10.0.0.2/24');
  assert.match(T.pingEquipo(t, 'PC1', 'PC2').motivo, /no tiene cable/);
  assert.equal(T.conectar(t, 'PC1', 'SW1').cable.b.p, 'Fa0/1');
  T.conectar(t, 'PC2', 'SW1');
  const r = T.pingEquipo(t, 'PC1', 'PC2');
  assert.ok(r.ok, r.motivo);
  assert.deepEqual(r.ida[0].camino.map(id => T.equipo(t, id).nombre), ['PC1', 'SW1', 'PC2']);
  T.equipo(t, 'SW1').ifs['Fa0/2'].on = false;
  assert.equal(T.pingEquipo(t, 'PC1', 'PC2').ok, false);
});

test('VLAN distintas aíslan; un troncal en un solo extremo no basta', () => {
  const t = T.nuevaTopologia();
  T.agregarEquipo(t, 'switch', { nombre: 'SW1' }); T.agregarEquipo(t, 'switch', { nombre: 'SW2' });
  pc(t, 'A', '10.0.0.1/24'); pc(t, 'B', '10.0.0.2/24');
  T.conectar(t, 'A', 'SW1'); T.conectar(t, 'B', 'SW2'); T.conectar(t, 'SW1', 'SW2');
  assert.ok(T.pingEquipo(t, 'A', 'B').ok, 'todo en VLAN 1');
  T.equipo(t, 'SW1').ifs['Fa0/1'].vlan = 10; T.equipo(t, 'SW2').ifs['Fa0/1'].vlan = 10;
  assert.equal(T.pingEquipo(t, 'A', 'B').ok, false, 'el enlace de acceso VLAN 1 no lleva la 10');
  T.equipo(t, 'SW1').ifs['Gi0/1'].modo = 'trunk';
  assert.equal(T.pingEquipo(t, 'A', 'B').ok, false, 'el otro extremo de acceso descarta tramas etiquetadas');
  T.equipo(t, 'SW2').ifs['Gi0/1'].modo = 'trunk';
  assert.ok(T.pingEquipo(t, 'A', 'B').ok);
});

test('enrutamiento: sin puerta de enlace, interfaz apagada, sin ruta de vuelta y bucle', () => {
  const t = T.nuevaTopologia();
  const r1 = T.agregarEquipo(t, 'router', { nombre: 'R1' }), r2 = T.agregarEquipo(t, 'router', { nombre: 'R2' });
  pc(t, 'PC1', '192.168.1.10/24'); pc(t, 'PC2', '192.168.2.10/24', '192.168.2.1');
  T.conectar(t, 'PC1', 'R1'); T.conectar(t, 'R1', 'R2'); T.conectar(t, 'R2', 'PC2');
  Object.assign(r1.ifs['Gi0/0'], { ip: '192.168.1.1', mask: '255.255.255.0', on: true });
  Object.assign(r1.ifs['Gi0/1'], { ip: '10.0.12.1', mask: '255.255.255.252' });
  Object.assign(r2.ifs['Gi0/0'], { ip: '10.0.12.2', mask: '255.255.255.252', on: true });
  Object.assign(r2.ifs['Gi0/1'], { ip: '192.168.2.1', mask: '255.255.255.0', on: true });
  assert.match(T.pingEquipo(t, 'PC1', 'PC2').motivo, /no tiene puerta de enlace/);
  T.equipo(t, 'PC1').gw = '192.168.1.1';
  assert.match(T.pingEquipo(t, 'PC1', 'PC2').motivo, /R1 no tiene ninguna ruta/);
  r1.ifs['Gi0/1'].on = true;
  r1.rutas.push({ red: '192.168.2.0', mask: '255.255.255.0', via: '10.0.12.2' });
  const sinVuelta = T.pingEquipo(t, 'PC1', 'PC2');
  assert.equal(sinVuelta.fase, 'vuelta');
  assert.match(sinVuelta.motivo, /respuesta no vuelve.*R2 no tiene ninguna ruta/);
  r2.rutas.push({ red: '0.0.0.0', mask: '0.0.0.0', via: '10.0.12.1' });
  const ok = T.pingEquipo(t, 'PC1', 'PC2');
  assert.ok(ok.ok, ok.motivo);
  assert.equal(ok.ida.length, 3);
  assert.equal(T.buscarRuta(t, 'R2', '8.8.8.8').cod, 'S*');
  // bucle de enrutamiento: R1 manda 172.16/16 a R2 y R2 de vuelta a R1
  r1.rutas.push({ red: '172.16.0.0', mask: '/16', via: '10.0.12.2' });
  assert.match(T.ping(t, 'PC1', '172.16.0.1').motivo, /TTL/);
});

test('subinterfaces (router-on-a-stick) y DHCP', () => {
  const t = T.nuevaTopologia();
  const r = T.agregarEquipo(t, 'router', { nombre: 'R1' }); const sw = T.agregarEquipo(t, 'switch', { nombre: 'SW1' });
  pc(t, 'A', '10.10.0.5/24', '10.10.0.1'); pc(t, 'B', '10.20.0.5/24', '10.20.0.1');
  T.conectar(t, 'A', 'SW1'); T.conectar(t, 'B', 'SW1'); T.conectar(t, 'R1', 'SW1');
  sw.ifs['Fa0/1'].vlan = 10; sw.ifs['Fa0/2'].vlan = 20;
  r.ifs['Gi0/0'].on = true;
  r.ifs['Gi0/0'].subs.push({ vlan: 10, ip: '10.10.0.1', mask: '255.255.255.0' }, { vlan: 20, ip: '10.20.0.1', mask: '255.255.255.0' });
  assert.equal(T.pingEquipo(t, 'A', 'B').ok, false, 'el puerto del router aún es de acceso');
  sw.ifs['Gi0/1'].modo = 'trunk';
  assert.ok(T.pingEquipo(t, 'A', 'B').ok);
  // DHCP en la VLAN 10
  const s = T.agregarEquipo(t, 'servidor', { nombre: 'SRV1' }); Object.assign(s.ifs.Fa0, { ip: '10.10.0.2', mask: '255.255.255.0' });
  T.conectar(t, 'SRV1', 'SW1'); sw.ifs['Fa0/3'].vlan = 10;
  const c = T.agregarEquipo(t, 'pc', { nombre: 'C' }); T.conectar(t, 'C', 'SW1'); sw.ifs['Fa0/4'].vlan = 10;
  assert.equal(T.pedirDhcp(t, 'C').ok, false);
  s.pools.push({ inicio: '10.10.0.5', cantidad: 10, mask: '255.255.255.0', gw: '10.10.0.1', dns: '' });
  const d = T.pedirDhcp(t, 'C');
  assert.ok(d.ok, d.motivo);
  assert.equal(d.ip, '10.10.0.6', 'salta la .5, que ya usa A');
  assert.ok(T.pingEquipo(t, 'C', 'B').ok);
  sw.ifs['Fa0/4'].vlan = 20;
  assert.equal(T.pedirDhcp(t, 'C').ok, false, 'en la VLAN 20 no hay servidor');
});

test('IP duplicadas y bucles de capa 2', () => {
  const t = T.nuevaTopologia();
  T.agregarEquipo(t, 'switch', { nombre: 'SW1' }); T.agregarEquipo(t, 'switch', { nombre: 'SW2' });
  pc(t, 'A', '10.0.0.1/24'); pc(t, 'B', '10.0.0.1/24');
  T.conectar(t, 'A', 'SW1'); T.conectar(t, 'B', 'SW2'); T.conectar(t, 'SW1', 'SW2');
  assert.deepEqual(T.ipsDuplicadas(t), ['10.0.0.1']);
  assert.equal(T.hayBucle(t), false);
  T.conectar(t, 'SW1', 'SW2');
  assert.equal(T.hayBucle(t), true);
});

// Soluciones de cada reto: lo que haría el alumno en la interfaz.
const SOL = {
  lan: (t, h) => { ['PC1', 'PC2', 'PC3'].forEach((p, i) => { T.conectar(t, p, 'SW1'); Object.assign(T.equipo(t, p).ifs.Fa0, { ip: '192.168.1.' + (10 + i), mask: '255.255.255.0' }); }); h.add('ok:PC1>PC3'); },
  gateway: (t, h) => { const r = T.equipo(t, 'R1'); Object.assign(r.ifs['Gi0/0'], { ip: '192.168.1.1', mask: '255.255.255.0', on: true }); Object.assign(r.ifs['Gi0/1'], { ip: '192.168.2.1', mask: '255.255.255.0', on: true }); T.equipo(t, 'PC1').gw = T.equipo(t, 'PC2').gw = '192.168.1.1'; T.equipo(t, 'PC3').gw = '192.168.2.1'; h.add('ok:PC1>PC3'); },
  vlan: (t, h) => { const s = T.equipo(t, 'SW1'); s.ifs['Fa0/1'].vlan = s.ifs['Fa0/2'].vlan = 10; s.ifs['Fa0/3'].vlan = s.ifs['Fa0/4'].vlan = 20; h.add('ok:PC1>PC2'); h.add('ok:PC3>PC4'); h.add('fallo:PC1>PC3'); },
  troncal: (t, h) => { T.equipo(t, 'SW1').ifs['Gi0/1'].modo = 'trunk'; T.equipo(t, 'SW2').ifs['Gi0/1'].modo = 'trunk'; h.add('ok:PC1>PC3'); h.add('ok:PC2>PC4'); },
  intervlan: (t, h) => { T.equipo(t, 'SW1').ifs['Gi0/2'].modo = 'trunk'; const g = T.equipo(t, 'R1').ifs['Gi0/0']; g.on = true; g.subs.push({ vlan: 10, ip: '192.168.10.1', mask: '255.255.255.0' }, { vlan: 20, ip: '192.168.20.1', mask: '255.255.255.0' }); h.add('ok:PC1>PC4'); },
  estaticas: (t, h) => { T.equipo(t, 'R1').rutas.push({ red: '192.168.2.0', mask: '255.255.255.0', via: '10.0.12.2' }); T.equipo(t, 'R2').rutas.push({ red: '192.168.1.0', mask: '255.255.255.0', via: '10.0.12.1' }); h.add('ok:PC1>PC2'); },
  dhcp: (t, h) => { T.equipo(t, 'SRV1').pools.push({ inicio: '192.168.1.100', cantidad: 50, mask: '255.255.255.0', gw: '192.168.1.1', dns: '' }); ['PC1', 'PC2', 'PC3'].forEach(p => assert.ok(T.pedirDhcp(t, p).ok)); h.add('ok:PC1>SRV1'); },
  averias: (t, h) => { T.equipo(t, 'PC2').gw = '192.168.1.1'; T.equipo(t, 'SW2').ifs['Fa0/2'].vlan = 1; T.equipo(t, 'R1').ifs['Gi0/1'].on = true; T.equipo(t, 'PC3').ifs.Fa0.mask = '255.255.255.0'; h.add('ok:PC1>PC3'); h.add('ok:PC2>PC4'); h.add('ok:PC4>PC1'); },
  libre: (t, h) => {
    const r = T.agregarEquipo(t, 'router'); const a = pc(t, 'PC1', '10.0.1.2/24', '10.0.1.1'); const b = pc(t, 'PC2', '10.0.2.2/24', '10.0.2.1');
    T.conectar(t, a.id, r.id); T.conectar(t, b.id, r.id);
    Object.assign(r.ifs['Gi0/0'], { ip: '10.0.1.1', mask: '255.255.255.0', on: true }); Object.assign(r.ifs['Gi0/1'], { ip: '10.0.2.1', mask: '255.255.255.0', on: true });
    h.add('ok:PC1>PC2');
  },
};

for (const [id, reto] of Object.entries(RETOS)) {
  test(`reto ${id}: empieza sin resolver, cada ping de la solución funciona y se completa`, () => {
    const t = reto.inicial(), h = new Set();
    assert.ok(T.validarTopologia(t));
    assert.ok(!revisarReto(reto, t, h).every(Boolean), 'no debe empezar resuelto');
    SOL[id](t, h);
    for (const k of h) {
      const [a, b] = k.slice(k.indexOf(':') + 1).split('>');
      assert.equal(T.pingEquipo(t, a, b).ok, k.startsWith('ok:'), `${id}: ${k} → ${T.pingEquipo(t, a, b).motivo}`);
    }
    assert.deepEqual(revisarReto(reto, t, h), reto.tareas.map(() => true));
    assert.ok(T.validarTopologia(T.clonar(t)));
  });
}

test('averías: con un solo arreglo la red sigue rota (hay cuatro errores)', () => {
  const t = RETOS.averias.inicial();
  T.equipo(t, 'R1').ifs['Gi0/1'].on = true;
  const r = T.pingEquipo(t, 'PC1', 'PC3');
  assert.equal(r.fase, 'vuelta', 'la petición llega, la respuesta no: la máscara de PC3');
  assert.equal(T.pingEquipo(t, 'PC2', 'PC4').ok, false);
});

test('el catálogo describe los mismos retos que el simulador', async () => {
  const { TOPO_INFO } = await import('../js/labs/catalogo.js');
  assert.deepEqual(TOPO_INFO.map(([id, titulo, nivel, n]) => [id, titulo, nivel, n]), Object.entries(RETOS).map(([id, r]) => [id, r.titulo, r.nivel, r.tareas.length]));
});

test('preguntas generadas con el simulador: la causa es siempre la ruta que falta y la respuesta se acepta', async () => {
  const G = await import('../js/examen/generadas.js');
  let semilla = 7; const rnd = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 60; i++) {
    for (const q of G.generarPreguntas('redes', 5, rnd).filter(x => x.tipo.startsWith('topo'))) {
      assert.ok(G.comprobar(q, q.respuesta), q.q);
      if (q.tipo === 'topo-ruta') assert.match(q.contexto.codigo, /no tiene ninguna ruta hacia/, q.contexto.codigo);
    }
  }
});
