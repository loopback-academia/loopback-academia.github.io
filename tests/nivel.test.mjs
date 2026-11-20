// Examen de entrada: bloques por escalón y convalidación de escalones en la escalera.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bloquesNivel, superaBloque, puntoDePartida, POR_BLOQUE, MINIMO_BLOQUE } from '../js/nivel.js';
import { construirEscalera, estadoEscalera, aprueba } from '../js/escalera.js';

const curso = JSON.parse(readFileSync(new URL('../_privado/curso.json', import.meta.url)));
curso.lecciones = curso.modulos.flatMap(m => m.lecciones.map(l => ({ ...l, modulo: m })));
const banco = JSON.parse(readFileSync(new URL('../_privado/examen.json', import.meta.url)));
let s = 5; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);

test('un bloque por escalón, con preguntas de las lecciones de ese escalón y sin repetir', () => {
  for (const area of ['redes', 'bd', 'prog', 'ti', 'en', 'sec']) {
    const esc = construirEscalera(curso, area);
    const bl = bloquesNivel(curso, banco, area, rnd);
    assert.equal(bl.length, esc.length, area);
    for (const b of bl) {
      assert.equal(b.preguntas.length, POR_BLOQUE, `${area} bloque ${b.n}`);
      assert.equal(new Set(b.preguntas.map(q => q.id)).size, POR_BLOQUE);
      const ids = new Set(b.escalon.lecciones.map(l => l.id));
      assert.ok(b.preguntas.every(q => ids.has(q.id.split('#')[0])), `${area} bloque ${b.n}: preguntas de su escalón`);
    }
  }
});

test('superar un bloque equivale a aprobar con el criterio de los exámenes', () => {
  assert.equal(superaBloque(MINIMO_BLOQUE), true);
  assert.equal(superaBloque(MINIMO_BLOQUE - 1), false);
  assert.ok(aprueba(MINIMO_BLOQUE, POR_BLOQUE), 'lo que convalida también cuenta como examen aprobado');
  const bl = bloquesNivel(curso, banco, 'redes', rnd);
  assert.equal(puntoDePartida(bl, 0).leccion.id, bl[0].escalon.lecciones[0].id);
  assert.equal(puntoDePartida(bl, 2).n, 3);
  assert.equal(puntoDePartida(bl, bl.length).todo, true);
});

test('escalones convalidados: sus lecciones quedan abiertas y el camino sigue en el siguiente escalón', () => {
  const esc = construirEscalera(curso, 'redes');
  const aprobados = new Set([esc[0].examen, esc[1].examen]);
  const est = estadoEscalera(esc, { leccionHecha: () => false, examenAprobado: k => aprobados.has(k) });
  assert.equal(est.estadoLeccion(esc[0].lecciones[0].id), 'convalidada');
  assert.ok(est.accesible(esc[1].lecciones.at(-1).id), 'se puede repasar');
  assert.equal(est.estadoLeccion(esc[2].lecciones[0].id), 'actual', 'empieza en el escalón 3');
  assert.equal(est.estadoLeccion(esc[2].lecciones[1].id), 'bloqueada');
  assert.equal(est.siguiente.leccion.id, esc[2].lecciones[0].id);
  assert.equal(est.final, 'bloqueado');
  // Sin convalidar, todo sigue igual que antes: solo la primera lección
  const nuevo = estadoEscalera(esc, { leccionHecha: () => false, examenAprobado: () => false });
  assert.equal(nuevo.estadoLeccion(esc[0].lecciones[0].id), 'actual');
  assert.equal(nuevo.estadoLeccion(esc[0].lecciones[1].id), 'bloqueada');
  assert.ok(!nuevo.accesible(esc[2].lecciones[0].id));
  // Todo convalidado: el examen final queda disponible
  const todo = estadoEscalera(esc, { leccionHecha: () => false, examenAprobado: k => k.startsWith('escalon-') });
  assert.equal(todo.final, 'disponible');
});
