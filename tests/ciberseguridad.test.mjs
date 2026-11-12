// Ciberseguridad: analizador de contraseñas, hashes y sal, cifrados, registros, cortafuegos e incidentes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../js/sec/seguridad.js';
import { SEC_INFO, CATALOGO } from '../js/labs/catalogo.js';

test('analizador: los patrones conocidos se castigan y la longitud manda', () => {
  for (const pw of ['123456', 'Verano2024!', 'P@ssw0rd', 'qwerty123', 'casa']) assert.ok(S.analizarContrasena(pw).puntuacion <= 1, pw);
  assert.equal(S.analizarContrasena('tren-nube-limon-faro-azul').puntuacion, 4);
  assert.equal(S.analizarContrasena('').bits, 0);
  assert.match(S.analizarContrasena('Hola1234').problemas.join(' '), /secuencia/);
  for (const [a, b, c] of S.PARES) assert.equal(S.analizarContrasena(b).bits > S.analizarContrasena(a).bits ? 1 : 0, c, `${a} / ${b}`);
  assert.ok(S.TAREAS_FUERZA[0].ok(S.analizarContrasena('k7#Qm2!xVr9$Lp-Zt4'), 'k7#Qm2!xVr9$Lp-Zt4'));
  assert.ok(S.TAREAS_FUERZA[1].ok(S.analizarContrasena('casa-azul-feliz'), 'casa-azul-feliz'));
  assert.equal(S.tiempoTexto(0.5), 'al instante');
  assert.equal(S.tiempoTexto(90), '2 minutos');
  assert.equal(S.tiempoTexto(1e30), 'más de un millón de años');
});

test('hashes: SHA-256 conocido, sal y ataque de diccionario coinciden con las preguntas', async () => {
  assert.equal(await S.sha256('password'), '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8');
  const sin = await S.tablaFiltrada(false), con = await S.tablaFiltrada(true);
  const h = u => sin.find(x => x.usuario === u).hash, hc = u => con.find(x => x.usuario === u).hash;
  assert.equal(h('marta'), h('sofia'));
  assert.notEqual(hc('marta'), hc('sofia'));
  const r = await S.ataqueDiccionario(sin), r2 = await S.ataqueDiccionario(con);
  const caidas = x => x.resultados.filter(y => y.clave).map(y => y.usuario).sort();
  assert.deepEqual(caidas(r), ['ana', 'marta', 'pedro', 'sofia']);
  assert.deepEqual(caidas(r2), caidas(r), 'la sal no salva una contraseña débil');
  assert.ok(r2.calculos > r.calculos, 'con sal hay que trabajar cuenta por cuenta');
  assert.equal(S.PREGUNTAS_HASH[1].opciones[S.PREGUNTAS_HASH[1].c], String(caidas(r).length));
});

test('criptografía: César y Vigenère son reversibles y los retos aceptan su respuesta', () => {
  assert.equal(S.cesar(S.cesar('Hola, Mundo', 5), -5), 'HOLA, MUNDO');
  assert.equal(S.vigenere(S.vigenere('ataque al amanecer', 'LIMON'), 'LIMON', true), 'ATAQUE AL AMANECER');
  assert.equal(S.vigenere('ATTACKATDAWN', 'LEMON'), 'LXFOPVEFRNHR', 'ejemplo clásico');
  assert.equal(S.b64dec(S.b64cod('contraseña: ñandú')), 'contraseña: ñandú');
  assert.equal(S.b64dec('%%%'), null);
  for (const r of S.RETOS_CRIPTO) {
    assert.ok(S.comprobarCripto(r, r.tipo === 'opciones' ? r.c : r.respuesta), r.titulo);
    assert.equal(S.comprobarCripto(r, r.tipo === 'opciones' ? (r.c + 1) % r.opciones.length : 'nada'), false, r.titulo);
  }
  assert.ok(S.comprobarCripto(S.RETOS_CRIPTO[0], 'el servidor de copias se apaga a las dos'), 'sin importar mayúsculas');
  const cif = S.RETOS_CRIPTO[0].q.match(/«([^»]+)»/)[1];
  assert.equal(S.cesar(cif, -7), S.RETOS_CRIPTO[0].respuesta);
  const vig = S.RETOS_CRIPTO[1].q.match(/«([^»]+)»/)[1];
  assert.equal(S.vigenere(vig, 'RED', true), S.RETOS_CRIPTO[1].respuesta);
  const b = S.RETOS_CRIPTO[2].q.match(/«([^»]+)»/)[1];
  assert.match(S.b64dec(b), /Copias#2025/);
});

test('registros: las respuestas se deducen de las líneas', () => {
  const { lineas, preguntas } = S.LOGS.ssh;
  assert.equal(String(S.filtrarLineas(lineas, 'Failed 203.0.113.45').length), preguntas[1].respuesta);
  const entrada = S.filtrarLineas(lineas, 'Accepted 203.0.113.45');
  assert.equal(entrada.length, 1);
  assert.match(entrada[0], /for admin /);
  assert.ok(entrada[0].includes(preguntas[3].respuesta));
  const web = S.LOGS.web;
  assert.equal(String(S.filtrarLineas(web.lineas, '192.0.2.77 " 404').length), web.preguntas[1].respuesta);
  for (const log of Object.values(S.LOGS)) for (const p of log.preguntas) assert.ok(S.comprobarLog(p, p.opciones ? p.c : p.respuesta), p.q);
  assert.ok(S.comprobarLog(web.preguntas[3], 'SQLMap/1.7'));
});

test('cortafuegos: primera coincidencia, denegación implícita y retos resolubles', () => {
  const f = { origen: '192.168.1.5', destino: '8.8.8.8', proto: 'udp', puerto: 53 };
  assert.deepEqual(S.evaluarFirewall([], f), { accion: 'denegar', regla: -1 });
  const reglas = [{ accion: 'denegar', proto: 'udp', origen: 'LAN', destino: 'cualquiera', puerto: 53 }, { accion: 'permitir', proto: 'cualquiera', origen: 'cualquiera', destino: 'cualquiera', puerto: 'cualquiera' }];
  assert.equal(S.evaluarFirewall(reglas, f).regla, 0);
  assert.equal(S.zonaDe('172.16.0.10'), 'DMZ');
  const oficina = [
    { accion: 'permitir', proto: 'tcp', origen: 'LAN', destino: 'Internet', puerto: 443 },
    { accion: 'permitir', proto: 'tcp', origen: 'LAN', destino: 'Internet', puerto: 80 },
    { accion: 'permitir', proto: 'udp', origen: 'LAN', destino: '8.8.8.8', puerto: 53 },
  ];
  assert.ok(!S.revisarFirewall(S.RETOS_FW.oficina, []).every(Boolean));
  assert.ok(S.revisarFirewall(S.RETOS_FW.oficina, oficina).every(Boolean));
  assert.ok(!S.revisarFirewall(S.RETOS_FW.dmz, S.RETOS_FW.dmz.inicial).every(Boolean), 'la regla «permitir todo» rompe el reto');
  const dmz = [
    { accion: 'permitir', proto: 'tcp', origen: 'Internet', destino: '172.16.0.10', puerto: 443 },
    { accion: 'permitir', proto: 'tcp', origen: 'LAN', destino: '172.16.0.10', puerto: 22 },
    { accion: 'permitir', proto: 'tcp', origen: 'LAN', destino: 'Internet', puerto: 443 },
  ];
  assert.ok(S.revisarFirewall(S.RETOS_FW.dmz, dmz).every(Boolean));
});

test('incidentes: cada paso tiene una sola mejor decisión', () => {
  for (const inc of Object.values(S.INCIDENTES)) {
    for (const p of inc.pasos) assert.equal(p.o.filter(o => o[1] === 2).length, 1, p.s);
    assert.equal(S.maximoIncidente(inc), inc.pasos.length * 2);
  }
});

test('el catálogo describe las mismas prácticas que los laboratorios', () => {
  const tareas = { 'pass:fuerza': 3, 'pass:hash': S.PREGUNTAS_HASH.length, 'cripto:retos': S.RETOS_CRIPTO.length, 'fw:oficina': S.RETOS_FW.oficina.flujos.length, 'fw:dmz': S.RETOS_FW.dmz.flujos.length,
    'logs:ssh': S.LOGS.ssh.preguntas.length, 'logs:web': S.LOGS.web.preguntas.length, 'ir:ransomware': S.INCIDENTES.ransomware.pasos.length, 'ir:cuenta': S.INCIDENTES.cuenta.pasos.length };
  assert.deepEqual(Object.fromEntries(SEC_INFO.map(x => [x[0], x[5]])), tareas);
  const sec = CATALOGO.filter(l => l.area === 'sec');
  assert.equal(sec.length, SEC_INFO.length);
  assert.ok(sec.every(l => /^[a-z]+-[a-z]+$/.test(l.progreso)));
  assert.deepEqual(sec.filter(l => l.clave.startsWith('fw:')).map(l => l.nivel), Object.values(S.RETOS_FW).map(r => r.nivel));
});
