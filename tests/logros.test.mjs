// Niveles (XP) e insignias.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { xpDe, nivelDe, logrosDe, NIVELES, LOGROS, XP } from '../js/logros.js';

const st = items => ({ items, examenes: [], dias: [] });

test('la experiencia suma lecciones, laboratorios, exámenes y días de estudio', () => {
  const e = st({ 'leccion:m0-curso': { hecho: true }, 'leccion:m0-x': { hecho: false }, 'lab:cli-basico': { hecho: true }, 'quiz:escalon-redes-1': { hecho: true }, 'quiz:final-base': { hecho: true }, 'quiz:m0-curso': { hecho: true } });
  e.examenes = [{}]; e.dias = ['2026-11-13', '2026-11-14'];
  assert.equal(xpDe(e), XP.leccion + XP.lab + XP.escalon + XP.final + XP.quiz + XP.simulacro + 2 * XP.dia);
  assert.equal(xpDe(st({})), 0);
});

test('los niveles suben con la experiencia y dicen cuánto falta', () => {
  assert.equal(nivelDe(0).actual.nombre, 'Iniciado');
  assert.equal(nivelDe(99).faltan, 1);
  assert.equal(nivelDe(100).actual.n, 2);
  const max = nivelDe(999999);
  assert.equal(max.actual.n, NIVELES.length);
  assert.equal(max.siguiente, null);
  assert.equal(max.progreso, 1);
  for (let i = 1; i < NIVELES.length; i++) assert.ok(NIVELES[i].xp > NIVELES[i - 1].xp);
});

test('las insignias se consiguen con el progreso y la racha', () => {
  const vacio = logrosDe(st({}), 0);
  assert.equal(vacio.filter(l => l.conseguido).length, 0);
  const e = st({ 'leccion:m0-curso': { hecho: true }, 'leccion:b1-intro': { hecho: true }, 'leccion:c1-que-es': { hecho: true }, 'lab:cli-basico': { hecho: true }, 'lab:modos-ios': { hecho: true }, 'lab:ordena-vlan': { hecho: true }, 'lab:lista-pt-instalar': { hecho: true } });
  const ok = new Set(logrosDe(e, 3).filter(l => l.conseguido).map(l => l.id));
  for (const id of ['primera-leccion', 'primer-lab', 'switch', 'modos', 'ordena', 'packet-tracer', 'racha-3', 'tres-areas']) assert.ok(ok.has(id), id);
  assert.ok(!ok.has('racha-7'));
  assert.equal(new Set(LOGROS.map(l => l.id)).size, LOGROS.length);
});
