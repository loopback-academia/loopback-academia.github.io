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

test('examen.json solo lleva unas pocas preguntas de muestra por lección (para el examen de entrada)', () => {
  assert.ok(examen.every(q => q.muestra), 'solo preguntas de muestra');
  const porLeccion = {};
  for (const q of examen) porLeccion[q.id.split('#')[0]] = (porLeccion[q.id.split('#')[0]] || 0) + 1;
  assert.ok(Object.values(porLeccion).every(n => n <= 3), 'como mucho 3 por lección');
  assert.equal(new Set(examen.map(q => q.id)).size, examen.length);
  assert.ok(examen.length < examenCompleto.length / 2, 'la mayor parte del banco sigue siendo privada');
});

test('cada bloque del examen de entrada tiene sus 6 preguntas con el banco público', async () => {
  const { bloquesNivel, POR_BLOQUE } = await import('../js/nivel.js');
  for (const area of new Set(publico.modulos.map(m => m.area)))
    for (const b of bloquesNivel(publico, examen, area)) assert.equal(b.preguntas.length, POR_BLOQUE, `${area}, bloque ${b.n}`);
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
