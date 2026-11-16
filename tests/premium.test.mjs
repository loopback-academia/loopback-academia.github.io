// Contenido de pago: los archivos públicos de data/ no deben llevar el texto ni las preguntas de los módulos de pago;
// todo eso va a _privado/premium.json (que se sube a Supabase) y el temario completo sigue intacto en _privado/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const leer = p => JSON.parse(readFileSync(new URL('../' + p, import.meta.url)));
const publico = leer('data/curso.json'), completo = leer('_privado/curso.json');
const examen = leer('data/examen.json'), examenCompleto = leer('_privado/examen.json');
const buscar = leer('data/buscar.json'), premium = leer('_privado/premium.json');
const GRATIS = new Set(['i1', 'i2', 'i3', 'm0', 'm1', 'b1', 'p1', 's1', 's11', 'c1']);

test('cada área tiene contenido gratis y la estructura pública conserva todas las lecciones', () => {
  for (const area of new Set(completo.modulos.map(m => m.area)))
    assert.ok(publico.modulos.some(m => m.area === area && GRATIS.has(m.id)), `${area} sin módulo gratis`);
  assert.deepEqual(publico.modulos.flatMap(m => m.lecciones.map(l => l.id)), completo.modulos.flatMap(m => m.lecciones.map(l => l.id)));
});

test('las lecciones de pago no llevan texto ni preguntas en los archivos públicos', () => {
  for (const m of publico.modulos) for (const l of m.lecciones) {
    if (GRATIS.has(m.id)) { assert.ok(!l.premium); continue; }
    assert.equal(l.premium, true, l.id);
    assert.deepEqual(l.quiz, [], l.id);
    assert.ok(l.blocks.every(b => b.t === 'embed'), `${l.id}: solo elementos interactivos, sin texto`);
  }
  assert.ok(examen.every(q => GRATIS.has(q.modulo) || q.muestra), 'examen.json: preguntas gratis y las de muestra');
  const muestras = examen.filter(q => q.muestra);
  assert.ok(muestras.length <= premium.lecciones.length, 'como mucho una pregunta de muestra por lección de pago');
  assert.equal(new Set(muestras.map(q => q.id.split('#')[0])).size, muestras.length);
  for (const b of buscar) if (!GRATIS.has(b.modulo)) assert.ok(b.premium && b.texto.length < 120, `${b.id}: el buscador no lleva el texto de pago`);
});

test('nada se pierde: lo de pago está entero en premium.json', () => {
  const dePago = completo.modulos.filter(m => !GRATIS.has(m.id)).flatMap(m => m.lecciones);
  assert.equal(premium.lecciones.length, dePago.length);
  for (const l of dePago) assert.deepEqual(premium.lecciones.find(x => x.id === l.id).blocks, l.blocks);
  assert.equal(premium.preguntas.length + examen.filter(q => !q.muestra).length, examenCompleto.length);
});

test('ningún texto de una lección de pago aparece en los archivos públicos', () => {
  const textoPublico = JSON.stringify([publico, examen, buscar]);
  const frases = premium.lecciones.flatMap(l => l.blocks.filter(b => b.t === 'p').slice(0, 1).map(b => JSON.stringify(b).slice(20, 80)));
  assert.ok(frases.length > 50);
  for (const f of frases) assert.ok(!textoPublico.includes(f), 'texto de pago filtrado: ' + f);
});

test('un laboratorio es de pago solo si todas sus lecciones son de pago', async () => {
  const { labDePago } = await import('../js/escalera.js');
  const conLecciones = c => ({ ...c, lecciones: c.modulos.flatMap(m => m.lecciones.map(l => ({ ...l, modulo: m }))) });
  const c = conLecciones(publico);
  const claves = l => l.blocks.filter(b => b.t === 'embed').map(b => `${b.kind}:${b.id}`);
  const enGratis = new Set(c.lecciones.filter(l => !l.premium).flatMap(claves));
  const soloPago = c.lecciones.filter(l => l.premium).flatMap(l => claves(l).map(k => ({ clave: k, area: l.modulo.area }))).find(x => !enGratis.has(x.clave));
  const compartido = c.lecciones.filter(l => l.premium).flatMap(l => claves(l).map(k => ({ clave: k, area: l.modulo.area }))).find(x => enGratis.has(x.clave));
  assert.ok(soloPago && labDePago(soloPago, c), 'laboratorio solo en lecciones de pago');
  assert.ok(compartido && !labDePago(compartido, c), 'laboratorio que también está en una lección gratis');
});
