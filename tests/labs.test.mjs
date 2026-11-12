// Pruebas de la lógica de los laboratorios: cálculo IPv4/VLSM, simulador de IOS y ejercicios SQL.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import * as ip from '../js/labs/ipv4.js';

// Generador pseudoaleatorio con semilla, para que las pruebas sean reproducibles.
const aleatorio = semilla => { let s = semilla >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; }; };
import { nuevoEquipo, ejecutar, runningConfig } from '../js/labs/ios.js';
import { LABS } from '../js/labs/ios-labs.js';
import { ESQUEMA, DATOS, ESQUEMA_DETECTIVE, DATOS_DETECTIVE } from '../js/labs/sql-datos.js';
import { EJERCICIOS, CONJUNTOS } from '../js/labs/sql-ejercicios.js';
import { repartir } from '../js/quiz.js';

test('subred de 192.168.10.77/27', () => {
  const c = ip.calcular('192.168.10.77', 27);
  assert.equal(c.red, '192.168.10.64');
  assert.equal(c.broadcast, '192.168.10.95');
  assert.equal(c.primero, '192.168.10.65');
  assert.equal(c.ultimo, '192.168.10.94');
  assert.equal(c.hosts, 30);
  assert.equal(ip.calcular('10.0.0.300', 8), null);
});

test('máscaras y comodines', () => {
  assert.equal(ip.aTexto(ip.mascara(20)), '255.255.240.0');
  assert.equal(ip.aTexto(ip.wildcard(22)), '0.0.3.255');
  assert.equal(ip.prefijoParaHosts(50), 26);
  assert.equal(ip.hostsUtiles(31), 2); // RFC 3021: enlaces punto a punto
});

test('los ejercicios aleatorios de subnetting son coherentes', () => {
  const rnd = aleatorio(42);
  for (let i = 0; i < 500; i++) {
    const c = ip.generarEjercicio(['facil', 'normal', 'dificil'][i % 3], rnd);
    const n = ip.aEntero(c.ip), r = ip.aEntero(c.red);
    assert.ok(r <= n && n < r + ip.tamano(c.prefijo), JSON.stringify(c));
    assert.equal(r % ip.tamano(c.prefijo), 0);
    assert.equal(ip.explicar(c).length, 4);
  }
});

test('VLSM: la solución de referencia es válida y la detección de errores funciona', () => {
  const rnd = aleatorio(7);
  for (let i = 0; i < 200; i++) {
    const g = ip.generarVlsm(rnd);
    const sol = ip.resolverVlsm(g.base, g.prefijo, g.necesidades);
    const errores = ip.validarVlsm(g.base, g.prefijo, g.necesidades, sol.map(x => `${x.red}/${x.prefijo}`));
    assert.equal(errores.filter(Boolean).length, 0, JSON.stringify({ g, errores }));
  }
  const nec = [{ nombre: 'A', hosts: 50 }, { nombre: 'B', hosts: 20 }];
  const e = ip.validarVlsm('192.168.1.0', 24, nec, ['192.168.1.0/26', '192.168.1.32/27']);
  assert.match(e[1], /solapa/);
});

for (const [id, lab] of Object.entries(LABS)) {
  test(`laboratorio IOS «${id}»: la solución completa todas las tareas`, () => {
    const s = nuevoEquipo(lab.equipo);
    assert.ok(!lab.tareas.every(t => t.ok(s, runningConfig)), 'no debe empezar resuelto');
    for (const linea of lab.solucion) {
      const r = ejecutar(s, linea);
      assert.ok(!/^% (Invalid|Incomplete|Ambiguous)/m.test(r.salida), `«${linea}» → ${r.salida}`);
    }
    lab.tareas.forEach(t => assert.ok(t.ok(s, runningConfig), 'tarea sin completar: ' + t.texto));
  });
}

test('IOS: errores y abreviaturas', () => {
  const s = nuevoEquipo({ tipo: 'switch', interfaces: [{ nombre: 'FastEthernet0/1' }] });
  assert.match(ejecutar(s, 'confgure terminal').salida, /%/);
  ejecutar(s, 'en'); ejecutar(s, 'conf t');
  assert.match(ejecutar(s, 'int fa0/1').prompt, /config-if/);
});

test('SQL: todas las soluciones se ejecutan sobre los datos de ejemplo', async () => {
  const require = createRequire(import.meta.url);
  const initSqlJs = require('../vendor/sql-wasm.js');
  const SQL = await initSqlJs({ locateFile: f => new URL('../vendor/' + f, import.meta.url).pathname });
  for (const [grupo, lista] of Object.entries(EJERCICIOS)) {
    for (const ej of lista) {
      const db = new SQL.Database();
      if (CONJUNTOS[grupo]?.base === 'detective') { db.run(ESQUEMA_DETECTIVE); db.run(DATOS_DETECTIVE); } else { db.run(ESQUEMA); db.run(DATOS); }
      const r = db.exec(ej.solucion);
      if (ej.verificar) assert.ok(db.exec(ej.verificar).length, `${grupo}: verificar sin filas`);
      else assert.ok(r.length && r[r.length - 1].values.length, `${grupo}: «${ej.enunciado}» no devuelve filas`);
      db.close();
    }
  }
});

test('reparto del simulacro según el peso de cada dominio', () => {
  const pesos = { m1: 20, m2: 20, m3: 25, m4: 10, m5: 15, m6: 10 };
  const disp = { m1: 72, m2: 47, m3: 38, m4: 35, m5: 37, m6: 23 };
  assert.deepEqual(repartir(100, pesos, disp), { m1: 20, m2: 20, m3: 25, m4: 10, m5: 15, m6: 10 });
  const c = repartir(20, pesos, disp);
  assert.equal(Object.values(c).reduce((a, b) => a + b), 20);
  const poco = repartir(50, pesos, { ...disp, m6: 2 });
  assert.equal(poco.m6, 2);
  assert.equal(Object.values(poco).reduce((a, b) => a + b), 50);
});

// ---------------------------------------------------------------- simulador ampliado
import { completar, modoOperativo, vlanPasa } from '../js/labs/ios.js';
import { COMANDOS, CATEGORIAS, MODOS } from '../js/comandos-datos.js';

test('averías: ninguna tarea empieza resuelta y todas tienen pistas', () => {
  for (const [id, lab] of Object.entries(LABS).filter(([, l]) => l.tipo === 'averia')) {
    const s = nuevoEquipo(lab.equipo);
    lab.tareas.forEach(t => assert.ok(!t.ok(s, runningConfig), `${id}: «${t.texto}» ya está hecha al empezar`));
    assert.ok(lab.pistas?.length >= 2, id + ' sin pistas');
  }
});

test('todos los laboratorios tienen nivel y tipo', () => {
  for (const [id, lab] of Object.entries(LABS)) {
    assert.ok(['principiante', 'intermedio', 'avanzado'].includes(lab.nivel), id);
    assert.ok(['guiado', 'averia'].includes(lab.tipo), id);
  }
});

test('DTP: el trunk se forma (o no) como en un Cisco real', () => {
  const eq = (local, remoto) => nuevoEquipo({ tipo: 'switch', interfaces: [{ nombre: 'GigabitEthernet0/1' }], vecinoL2: { 'GigabitEthernet0/1': remoto }, estadoInicial: s => { s.ifs['GigabitEthernet0/1'].mode = local; } });
  assert.equal(modoOperativo(eq('dynamic auto', { mode: 'dynamic auto' }), 'GigabitEthernet0/1'), 'access');
  assert.equal(modoOperativo(eq('dynamic auto', { mode: 'dynamic desirable' }), 'GigabitEthernet0/1'), 'trunk');
  assert.equal(modoOperativo(eq('dynamic desirable', { mode: 'trunk', nonegotiate: true }), 'GigabitEthernet0/1'), 'access');
  assert.equal(modoOperativo(eq('trunk', { mode: 'trunk', nonegotiate: true }), 'GigabitEthernet0/1'), 'trunk');
  const s = eq('trunk', { mode: 'trunk', native: 99 });
  s.vlans[10] = 'A'; s.vlans[99] = 'N';
  assert.equal(vlanPasa(s, 'GigabitEthernet0/1', 10), true);
  assert.equal(vlanPasa(s, 'GigabitEthernet0/1', 99), false, 'nativa distinta');
});

test('autocompletado con Tab', () => {
  const s = nuevoEquipo({ tipo: 'router', interfaces: [{ nombre: 'GigabitEthernet0/0' }] });
  s.modo = 'priv';
  assert.equal(completar(s, 'conf'), 'configure ');
  assert.equal(completar(s, 'show ip int'), 'show ip interface ');
  assert.equal(completar(s, 'sh'), 'show ');
  assert.equal(completar(s, 'c'), null, 'configure / copy / clear: ambiguo');
});

test('guía de comandos: categorías, modos, niveles y laboratorios válidos', () => {
  const cats = new Set(CATEGORIAS.map(c => c.id));
  assert.ok(COMANDOS.length >= 70);
  for (const c of COMANDOS) {
    assert.ok(cats.has(c.cat), c.cmd);
    assert.ok(MODOS[c.modo], c.cmd);
    assert.ok([1, 2, 3].includes(c.nivel), c.cmd);
    assert.ok(c.que.length > 20 && c.ej.length, c.cmd);
    if (c.lab) assert.ok(LABS[c.lab], `${c.cmd}: el laboratorio ${c.lab} no existe`);
  }
  for (const cat of cats) assert.ok(COMANDOS.some(c => c.cat === cat), 'categoría vacía: ' + cat);
});

// ---------------------------------------------------------------- inyección SQL
import { ESQUEMA_TIENDA, DATOS_TIENDA, retoLogin, retoBusqueda, retoArreglo } from '../js/labs/inyeccion-logica.js';
test('inyección SQL: los ataques funcionan en la versión vulnerable y fallan con parámetros', async () => {
  const require = createRequire(import.meta.url);
  const initSqlJs = require('../vendor/sql-wasm.js');
  const SQL = await initSqlJs({ locateFile: f => new URL('../vendor/' + f, import.meta.url).pathname });
  const db = new SQL.Database(); db.run(ESQUEMA_TIENDA); db.run(DATOS_TIENDA);
  assert.equal(retoLogin(db, 'admin', 'mal').ok, false);
  assert.equal(retoLogin(db, 'admin', 'Tr0pical!2026').ok, false, 'con la clave real no cuenta como ataque');
  assert.equal(retoLogin(db, "admin' --", 'x').ok, true);
  assert.equal(retoBusqueda(db, 'cable').ok, false);
  assert.equal(retoBusqueda(db, "x' UNION SELECT usuario, clave FROM usuarios --").ok, true);
  assert.equal(retoArreglo(db, "SELECT usuario, rol FROM usuarios WHERE usuario = '' AND clave = ''").ok, false);
  assert.equal(retoArreglo(db, "SELECT usuario, rol FROM usuarios WHERE usuario = '?' AND clave = '?'").ok, false);
  assert.equal(retoArreglo(db, 'SELECT usuario, rol FROM usuarios WHERE usuario = ? OR clave = ?').ok, false);
  assert.equal(retoArreglo(db, 'SELECT usuario, rol FROM usuarios WHERE usuario = ? AND clave = ?;').ok, true);
});

// ---------------------------------------------------------------- visor de capturas
import { CAPTURAS, filtrar, compilarFiltro, fila, detalle, corregirPregunta } from '../js/labs/capturas.js';
test('capturas: filtros, filas, detalle y respuestas', () => {
  const web = CAPTURAS.web.paquetes;
  assert.equal(filtrar(web, 'dns').length, 4);
  assert.equal(filtrar(web, 'tcp.port == 80 && tcp.flags.syn == 1').length, 2);
  assert.equal(filtrar(web, 'http').length, 3);
  assert.equal(filtrar(web, '!tcp').length, 4);
  assert.equal(filtrar(web, 'ip.addr == 203.0.113.80 || dns.qry.name contains proveedor').length, 8);
  assert.equal(filtrar(web, '').length, web.length);
  assert.throws(() => compilarFiltro('ip.addr =='), /valor/);
  assert.throws(() => compilarFiltro('foo'), /no es un protocolo/);
  assert.throws(() => compilarFiltro('(dns'), /paréntesis/);
  for (const [id, c] of Object.entries(CAPTURAS)) {
    c.paquetes.forEach((p, i) => { assert.equal(p.n, i + 1, id); assert.ok(fila(p).info !== undefined && detalle(p).length >= 2); });
    for (const q of c.preguntas) {
      const buena = q.tipo === 'opcion' ? q.respuesta : q.tipo === 'lista' ? q.respuesta.join(', ') : q.respuesta[0];
      assert.ok(corregirPregunta(q, buena), `${id}: ${q.texto}`);
      assert.ok(!corregirPregunta(q, q.tipo === 'opcion' ? (q.respuesta + 1) % q.opciones.length : 'nada'), `${id}: acepta cualquier cosa`);
    }
  }
  assert.ok(corregirPregunta(CAPTURAS.web.preguntas[1], '5,3, 4'));
  assert.equal(filtrar(CAPTURAS.dhcp.paquetes, 'dhcp').length, 6);
});
