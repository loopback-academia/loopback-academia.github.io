// Contenido de pago: los archivos públicos de data/ no deben llevar el texto ni las preguntas de los módulos de pago;
// todo eso va a _privado/premium.json (que se sube a Supabase) y el temario completo sigue intacto en _privado/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const leer = p => JSON.parse(readFileSync(new URL('../' + p, import.meta.url)));
const publico = leer('data/curso.json'), completo = leer('_privado/curso.json');
const examen = leer('data/examen.json'), examenCompleto = leer('_privado/examen.json');
const buscar = leer('data/buscar.json'), premium = leer('_privado/premium.json');
test('todo el temario es de pago y la estructura pública conserva todas las lecciones', () => {
  assert.deepEqual(publico.modulos.flatMap(m => m.lecciones.map(l => l.id)), completo.modulos.flatMap(m => m.lecciones.map(l => l.id)));
  for (const m of publico.modulos) for (const l of m.lecciones) {
    assert.equal(l.premium, true, l.id);
    assert.deepEqual(l.quiz, [], l.id);
    assert.ok(l.blocks.every(b => b.t === 'embed'), `${l.id}: solo elementos interactivos, sin texto`);
  }
  for (const b of buscar) assert.ok(b.premium && b.texto.length < 120, `${b.id}: el buscador no lleva el texto de pago`);
});

test('no se publica ninguna pregunta de las lecciones de pago: examen.json está vacío', () => {
  assert.deepEqual(examen, []);
});

test('el examen de entrada tiene su propio banco técnico y cada bloque tiene sus 6 preguntas', async () => {
  const { bloquesNivel, POR_BLOQUE } = await import('../js/nivel.js');
  const entrada = leer('data/entrada.json');
  assert.ok(entrada.length >= 150, 'banco amplio');
  const textoPago = new Set(examenCompleto.map(q => q.q.trim().toLowerCase()));
  for (const q of entrada) {
    assert.ok(!textoPago.has(q.q.trim().toLowerCase()), 'pregunta copiada de una lección de pago: ' + q.q);
    assert.ok(q.options.length >= 2 && q.correct.length >= 1 && q.explain, q.id);
  }
  for (const area of new Set(publico.modulos.map(m => m.area)))
    for (const b of bloquesNivel(publico, entrada, area)) assert.equal(b.preguntas.length, POR_BLOQUE, `${area}, bloque ${b.n}`);
});

test('nada se pierde: todo el temario está entero en premium.json', () => {
  const todas = completo.modulos.flatMap(m => m.lecciones);
  assert.equal(premium.lecciones.length, todas.length);
  for (const l of todas) assert.deepEqual(premium.lecciones.find(x => x.id === l.id).blocks, l.blocks);
  assert.equal(premium.preguntas.length, examenCompleto.length);
});

test('ningún texto de una lección de pago aparece en los archivos públicos', () => {
  const textoPublico = JSON.stringify([publico, examen, buscar]);
  const frases = premium.lecciones.flatMap(l => l.blocks.filter(b => b.t === 'p').slice(0, 1).map(b => JSON.stringify(b).slice(20, 80)));
  assert.ok(frases.length > 50);
  for (const f of frases) assert.ok(!textoPublico.includes(f), 'texto de pago filtrado: ' + f);
});

test('todos los laboratorios de las lecciones son de pago', async () => {
  const { labDePago } = await import('../js/escalera.js');
  const c = { ...publico, lecciones: publico.modulos.flatMap(m => m.lecciones.map(l => ({ ...l, modulo: m }))) };
  const labs = c.lecciones.flatMap(l => l.blocks.filter(b => b.t === 'embed').map(b => ({ clave: `${b.kind}:${b.id}`, area: l.modulo.area })));
  assert.ok(labs.length > 50);
  for (const lab of labs) assert.ok(labDePago(lab, c), lab.clave);
});

test('la web pide el contenido de pago de una lección en una lección, no la tabla entera', () => {
  const js = readFileSync(new URL('../js/premium.js', import.meta.url), 'utf8');
  assert.match(js, /rpc\('leer_leccion'/);
  assert.match(js, /rpc\('banco_premium'\)/);
  const sql = readFileSync(new URL('../supabase/migrations/20261119000000_blindaje.sql', import.meta.url), 'utf8');
  assert.match(sql, /revoke all on public\.lecciones_premium, public\.preguntas_premium from anon, authenticated/);
});
