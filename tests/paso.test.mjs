// Ejecución paso a paso: el trazador de sandbox.js se ejecuta con Python de verdad sobre cada programa de ejemplo y las
// respuestas de las preguntas se comprueban contra la traza.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { PASOS, comprobarPaso } from '../js/codigo/pasos.js';
import { PASO_INFO, CATALOGO } from '../js/labs/catalogo.js';

const src = readFileSync(new URL('../js/codigo/sandbox.js', import.meta.url), 'utf8');
const TRAZADOR = new Function('return ' + src.match(/var TRAZADOR = (\[[\s\S]*?\]\.join\('\\n'\));/)[1])();
const hayPython = spawnSync('python3', ['--version']).status === 0;
function trazar(codigo) {
  const lineas = TRAZADOR.split('\n');
  const prog = `CODIGO = ${JSON.stringify(codigo)}\n${lineas.slice(0, -1).join('\n')}\nprint(${lineas[lineas.length - 1]})\n`;
  const r = spawnSync('python3', ['-I', '-c', prog], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}

test('catálogo y ejemplos coinciden; cada pregunta acepta su respuesta', () => {
  assert.deepEqual(PASO_INFO.map(([id, t, n]) => [id, t, n]), Object.entries(PASOS).map(([id, p]) => [id, p.titulo, p.nivel]));
  assert.ok(Object.values(PASOS).every(p => p.preguntas.length === 2));
  assert.equal(CATALOGO.filter(l => l.grupo === 'paso').length, PASO_INFO.length);
  for (const p of Object.values(PASOS)) for (const q of p.preguntas) assert.ok(comprobarPaso(q, q.opciones ? q.c : q.respuesta), q.q);
});

test('el trazador recorre los ejemplos y las respuestas salen de la traza', { skip: !hayPython && 'sin python3' }, () => {
  const t = Object.fromEntries(Object.entries(PASOS).map(([id, p]) => [id, trazar(p.codigo)]));
  for (const [id, r] of Object.entries(t)) { assert.equal(r.error, null, id); assert.ok(r.pasos.length > 3, id); }
  const fin = r => r.pasos[r.pasos.length - 1];
  const linea = (r, l) => r.pasos.find(p => p.e === 'line' && p.l === l);
  const val = (p, v) => p.pila[p.pila.length - 1].v[v]?.[0];
  assert.equal(val(linea(t.variables, 4), 'a'), PASOS.variables.preguntas[0].respuesta);
  assert.equal(t.variables.out.trim(), PASOS.variables.preguntas[1].respuesta);
  assert.equal(String(t.bucle.pasos.filter(p => p.e === 'line' && p.l === 3).length), PASOS.bucle.preguntas[0].respuesta);
  assert.equal(val(fin(t.bucle), 'total'), PASOS.bucle.preguntas[1].respuesta);
  assert.ok(t.funciones.pasos.filter(p => p.e === 'line').every(p => p.pila.length > 1 || !('rebaja' in p.pila[0].v)), 'rebaja nunca está en el programa principal');
  assert.equal(t.funciones.pasos.filter(p => p.e === 'return' && p.pila.length === 2)[1].r, PASOS.funciones.preguntas[1].respuesta);
  assert.ok(comprobarPaso(PASOS.listas.preguntas[0], t.listas.out.split('\n')[0]));
  const objs = fin(t.listas).pila[0].v;
  assert.equal(objs.compra[1], objs.otra[1], 'compra y otra son el mismo objeto');
  assert.notEqual(objs.compra[1], objs.copia[1]);
  assert.equal(String(Math.max(...t.pila.pasos.map(p => p.pila.filter(m => m.f === 'factorial').length))), PASOS.pila.preguntas[0].respuesta);
  assert.ok(t.pila.pasos.some(p => p.e === 'return' && val(p, 'n') === '2' && p.r === PASOS.pila.preguntas[1].respuesta));
  assert.equal(val(linea(t.busqueda, 7), 'medio'), PASOS.busqueda.preguntas[0].respuesta);
  assert.match(t.busqueda.out, new RegExp(`en ${PASOS.busqueda.preguntas[1].respuesta} pasos`));
});

test('el trazador informa de errores y corta los programas demasiado largos', { skip: !hayPython && 'sin python3' }, () => {
  const e = trazar('x = 1\ny = x / 0\n');
  assert.match(e.error, /ZeroDivisionError/);
  assert.ok(e.pasos.some(p => p.e === 'exception'));
  assert.match(trazar('while True:\n    pass\n').error, /Se ha detenido tras 600 pasos/);
  assert.match(trazar('print(\n').error, /SyntaxError/);
});
