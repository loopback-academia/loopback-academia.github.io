// Escalera con prerrequisitos: escalones, desbloqueo paso a paso, exámenes distintos en cada intento y mínimo de 80.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { construirEscalera, estadoEscalera, elegirPreguntas, bancoDe, rutaArea, aprueba, minimoPara, labAccesible, POOL_MIN, APROBADO } from '../js/escalera.js';
import { CATALOGO } from '../js/labs/catalogo.js';

const curso = JSON.parse(readFileSync(new URL('../data/curso.json', import.meta.url)));
curso.lecciones = curso.modulos.flatMap(m => m.lecciones.map(l => ({ ...l, modulo: m })));
const banco = JSON.parse(readFileSync(new URL('../data/examen.json', import.meta.url)));
const AREAS = ['redes', 'bd', 'prog', 'ti', 'en'];

test('el mínimo para aprobar es 80 %', () => {
  assert.equal(APROBADO, 0.8);
  assert.equal(aprueba(8, 10), true);
  assert.equal(aprueba(7, 10), false);
  assert.equal(aprueba(2, 3), false, '2 de 3 es 67 %');
  assert.equal(minimoPara(20), 16);
  assert.equal(minimoPara(12), 10);
});

for (const area of AREAS) {
  test(`${area}: los escalones cubren toda la ruta en orden, sin saltos, y cada examen puede ser distinto en dos intentos seguidos`, () => {
    const esc = construirEscalera(curso, area);
    assert.ok(esc.length >= 2, 'al menos dos escalones');
    assert.deepEqual(esc.flatMap(e => e.lecciones.map(l => l.id)), rutaArea(curso, area).map(l => l.id));
    const niveles = esc.flatMap(e => e.lecciones.map(l => l.nivel));
    assert.deepEqual(niveles, [...niveles].sort(), 'los niveles nunca retroceden');
    for (const e of esc) {
      const pool = bancoDe(banco, e.lecciones);
      assert.equal(pool.length, e.pool, `${e.id}: banco coherente`);
      assert.ok(e.pool >= POOL_MIN, `${e.id}: banco pequeño (${e.pool})`);
      assert.ok(e.tamano * 2 <= e.pool, `${e.id}: el examen (${e.tamano}) cabe dos veces en el banco (${e.pool})`);
    }
  });
}

test('desbloqueo: solo la primera lección está abierta al empezar; cada lección abre la siguiente; el examen abre el escalón siguiente', () => {
  const esc = construirEscalera(curso, 'bd');
  const hechas = new Set(), aprobados = new Set();
  const est = () => estadoEscalera(esc, { leccionHecha: id => hechas.has(id), examenAprobado: k => aprobados.has(k) });
  let s = est();
  const [l0, l1] = esc[0].lecciones;
  assert.equal(s.estadoLeccion(l0.id), 'actual');
  assert.equal(s.estadoLeccion(l1.id), 'bloqueada');
  assert.equal(s.escalones[0].estadoExamen, 'bloqueado');
  assert.equal(s.escalones[1].abierto, false);
  assert.equal(s.siguiente.leccion.id, l0.id);
  hechas.add(l0.id);
  s = est();
  assert.equal(s.estadoLeccion(l1.id), 'actual');
  esc[0].lecciones.forEach(l => hechas.add(l.id));
  s = est();
  assert.equal(s.escalones[0].estadoExamen, 'disponible');
  assert.equal(s.siguiente.tipo, 'examen');
  assert.equal(s.estadoLeccion(esc[1].lecciones[0].id), 'bloqueada', 'sin aprobar el examen no se abre el escalón 2');
  aprobados.add(esc[0].examen);
  s = est();
  assert.equal(s.estadoLeccion(esc[1].lecciones[0].id), 'actual');
  assert.equal(s.final, 'bloqueado');
  esc.forEach(e => { e.lecciones.forEach(l => hechas.add(l.id)); aprobados.add(e.examen); });
  s = est();
  assert.equal(s.final, 'disponible');
  assert.equal(s.siguiente.tipo, 'final');
});

test('una lección completada antes sigue abierta para repasar, pero no abre las siguientes', () => {
  const esc = construirEscalera(curso, 'prog');
  const tercera = esc[0].lecciones[2];
  const s = estadoEscalera(esc, { leccionHecha: id => id === tercera.id, examenAprobado: () => false });
  assert.equal(s.estadoLeccion(tercera.id), 'hecha');
  assert.equal(s.accesible(tercera.id), true);
  assert.equal(s.estadoLeccion(esc[0].lecciones[0].id), 'actual');
  assert.equal(s.estadoLeccion(esc[0].lecciones[3].id), 'bloqueada');
});

test('cada intento de examen tiene preguntas distintas a las del intento anterior', () => {
  for (const area of AREAS) for (const e of construirEscalera(curso, area)) {
    const pool = bancoDe(banco, e.lecciones);
    const a = elegirPreguntas(pool, e.tamano, []);
    assert.equal(new Set(pool.map(q => q.q.trim().toLowerCase())).size, pool.length, `${e.id}: hay enunciados repetidos en el banco`);
    const b = elegirPreguntas(pool, e.tamano, [a.map(q => q.id)]);
    assert.equal(a.length, e.tamano);
    assert.equal(new Set(a.map(q => q.id)).size, a.length, 'sin repetidas dentro del examen');
    assert.equal(b.filter(q => a.some(x => x.id === q.id)).length, 0, `${e.id}: el segundo intento repite preguntas del primero`);
    const c = elegirPreguntas(pool, e.tamano, [a.map(q => q.id), b.map(q => q.id)]);
    assert.equal(c.filter(q => b.some(x => x.id === q.id)).length, 0, `${e.id}: el tercer intento repite preguntas del segundo`);
  }
});

test('las prácticas se abren con la lección donde aparecen', () => {
  const esc = construirEscalera(curso, 'ti');
  const nada = estadoEscalera(esc, { leccionHecha: () => false, examenAprobado: () => false });
  const turno = CATALOGO.find(l => l.clave === 'turno:soporte');
  assert.equal(labAccesible(turno, curso, nada), false, 'el proyecto final no está abierto al empezar');
  const todo = estadoEscalera(esc, { leccionHecha: () => true, examenAprobado: () => true });
  assert.equal(labAccesible(turno, curso, todo), true);
});
