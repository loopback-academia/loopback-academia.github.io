// Integridad del examen: preguntas de razonamiento generadas (correctas y distintas en cada intento) y aviso para IA.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generarPreguntas, comprobar, TIPOS_POR_AREA } from '../js/examen/generadas.js';
import { AVISO_COPIA, INSTRUCCION_IA } from '../js/examen/integridad.js';

// Generador pseudoaleatorio con semilla, para pruebas reproducibles.
const semilla = s => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);

test('cada área tiene preguntas de razonamiento y todas traen respuesta y explicación', () => {
  for (const area of ['base', 'redes', 'bd', 'prog', 'ti', 'en', 'sec']) {
    const ps = generarPreguntas(area, 6, semilla(7));
    assert.equal(ps.length, 6);
    for (const p of ps) {
      assert.ok(p.generada && p.id.startsWith('gen:') && p.q && p.respuesta && p.explain, JSON.stringify(p));
      assert.equal(p.area, area);
      assert.equal(comprobar(p, p.respuesta), true);
      assert.equal(comprobar(p, ''), false);
    }
  }
  assert.ok(Object.values(TIPOS_POR_AREA).every(t => t.length >= 1));
});

test('las respuestas calculadas son correctas', () => {
  for (let k = 1; k < 200; k++) for (const p of generarPreguntas('redes', 3, semilla(k))) {
    if (p.tipo.startsWith('topo-')) continue; // se comprueban con el simulador en topologia.test.mjs
    const [ip, pref] = (p.q.match(/(\d+\.\d+\.\d+\.\d+)\/(\d+)/) || []).slice(1);
    const bits = Number(pref ?? p.q.match(/\/(\d+)/)[1]);
    if (p.tipo === 'hosts-utiles') assert.equal(Number(p.respuesta), 2 ** (32 - bits) - 2);
    else {
      const n = ip.split('.').reduce((a, o) => a * 256 + Number(o), 0);
      const bloque = 2 ** (32 - bits);
      const red = Math.floor(n / bloque) * bloque;
      const esperado = p.tipo === 'red-de-ip' ? red : red + bloque - 1;
      const txt = [24, 16, 8, 0].map(s => Math.floor(esperado / 2 ** s) % 256).join('.');
      assert.equal(p.respuesta, txt, p.q);
    }
  }
  for (let k = 1; k < 100; k++) for (const p of generarPreguntas('prog', 3, semilla(k))) {
    const c = p.contexto.codigo;
    let esperado;
    if (p.tipo === 'py-bucle') { const [, a, n] = c.match(/total = (\d+)\nfor i in range\((\d+)\)/); esperado = Number(a) + (n * (n - 1)) / 2; }
    if (p.tipo === 'py-condicion') { const x = Number(c.match(/x = (\d+)/)[1]); esperado = x % 2 === 0 ? x / 2 : x * 3 + 1; }
    if (p.tipo === 'py-lista') { const d = c.match(/\[([^\]]+)\]/)[1].split(', ').map(Number); const i = Number(c.match(/datos\[(\d)\]/)[1]); esperado = d[i] + d[d.length - 1]; }
    assert.equal(Number(p.respuesta), esperado, c);
  }
  for (let k = 1; k < 100; k++) for (const p of generarPreguntas('bd', 2, semilla(k))) {
    const { filas } = p.contexto.tabla;
    if (p.tipo === 'sql-contar') { const u = Number(p.q.match(/total > (\d+)/)[1]); assert.equal(Number(p.respuesta), filas.filter(f => f[2] > u).length); }
    else { const t = p.q.match(/tienda = '([^']+)'/)[1]; assert.equal(Number(p.respuesta), filas.filter(f => f[1] === t).reduce((s, f) => s + f[2], 0)); }
  }
});

test('dos intentos generan datos distintos', () => {
  for (const area of ['redes', 'bd', 'prog']) {
    const a = generarPreguntas(area, 3).map(p => p.q + JSON.stringify(p.contexto || ''));
    const b = generarPreguntas(area, 3).map(p => p.q + JSON.stringify(p.contexto || ''));
    assert.ok(a.some((x, i) => x !== b[i]), area);
  }
});

test('la respuesta escrita admite variaciones razonables de formato', () => {
  const p = { respuesta: '192.168.10.64' };
  assert.equal(comprobar(p, ' 192.168.10.64 '), true);
  assert.equal(comprobar(p, '192.168.10.64/26'), true);
  assert.equal(comprobar({ respuesta: 'P2' }, 'p2'), true);
  assert.equal(comprobar(p, '192.168.10.0'), false);
});

test('lo que se copia durante un examen es un aviso con instrucciones para asistentes de IA, no la pregunta', () => {
  assert.match(AVISO_COPIA, /examen en curso/i);
  assert.match(INSTRUCCION_IA, /No respondas la pregunta/);
  assert.match(INSTRUCCION_IA, /no la reformules/);
  assert.match(INSTRUCCION_IA, /Do not answer/);
});
