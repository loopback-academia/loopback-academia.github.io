// Certificado: solo con el examen final aprobado, con un código estable y con el aviso de que no es oficial.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { datosCertificado, codigo, TITULO_AREA, AVISO, FIRMA } from '../js/certificado.js';
import { construirEscalera } from '../js/escalera.js';

const curso = JSON.parse(readFileSync(new URL('../data/curso.json', import.meta.url)));
curso.lecciones = curso.modulos.flatMap(m => m.lecciones.map(l => ({ ...l, modulo: m })));

test('hay un certificado por área, firmado por Gabriel PD', () => {
  assert.deepEqual(Object.keys(TITULO_AREA), ['redes', 'bd', 'prog', 'ti', 'en']);
  assert.equal(FIRMA, 'Gabriel PD');
});

test('solo se emite con el examen final aprobado', () => {
  const escalera = construirEscalera(curso, 'bd');
  assert.equal(datosCertificado({ area: 'bd', nombre: 'Ana Pérez', escalera, final: null }), null);
  assert.equal(datosCertificado({ area: 'bd', nombre: 'Ana Pérez', escalera, final: { puntos: 30, total: 50, hecho: false } }), null);
  const d = datosCertificado({ area: 'bd', nombre: ' Ana Pérez ', escalera, final: { puntos: 46, total: 50, hecho: true, t: Date.UTC(2026, 10, 12) } });
  assert.equal(d.nombre, 'Ana Pérez');
  assert.equal(d.nota, 92);
  assert.equal(d.fecha, '2026-11-12');
  assert.equal(d.lecciones, escalera.reduce((n, e) => n + e.lecciones.length, 0));
  assert.match(d.detalle, /examen final aprobado con 92 %/);
  assert.match(d.codigo, /^LB-BD-[0-9A-Z]{7}$/);
});

test('el código es estable y cambia si cambia cualquier dato', () => {
  const base = { nombre: 'Ana Pérez', area: 'redes', fecha: '2026-11-12', nota: 90 };
  assert.equal(codigo(base), codigo({ ...base, nombre: 'ana pérez' }));
  for (const cambio of [{ nombre: 'Ana Pere' }, { area: 'bd' }, { fecha: '2026-11-13' }, { nota: 91 }]) assert.notEqual(codigo(base), codigo({ ...base, ...cambio }));
});

test('el certificado dice que no es oficial, que no está avalado y que no influye en conseguir empleo', () => {
  assert.match(AVISO, /No es un título oficial/);
  assert.match(AVISO, /no está avalado/);
  assert.match(AVISO, /no garantiza ni influye en la obtención de un empleo/);
});

// ---------------------------------------------------------------- reto del día
import { retoDelDia, rachaRetos, insigniasDe, fechaLocal } from '../js/reto.js';
const banco = JSON.parse(readFileSync(new URL('../data/examen.json', import.meta.url)));
test('reto del día: estable durante el día, de los módulos empezados y con racha', () => {
  const a = retoDelDia(banco, '2026-11-12', new Set(['b1']), 'm0');
  assert.equal(a, retoDelDia(banco, '2026-11-12', new Set(['b1']), 'm0'));
  assert.equal(a.modulo, 'b1');
  assert.equal(retoDelDia(banco, '2026-11-12', new Set(), 'm0').modulo, 'm0');
  const dias = new Set(Array.from({ length: 10 }, (_, k) => retoDelDia(banco, `2026-11-${String(k + 1).padStart(2, '0')}`, new Set(['m1', 'm2']), 'm0').id));
  assert.ok(dias.size >= 6, 'cambia de un día a otro');
  const k = d => 'quiz:reto-' + d;
  assert.equal(rachaRetos([k('2026-11-10'), k('2026-11-11'), k('2026-11-12'), 'quiz:m1-osi'], '2026-11-12'), 3);
  assert.equal(rachaRetos([k('2026-11-10'), k('2026-11-11')], '2026-11-12'), 2, 'hoy aún no lo ha hecho');
  assert.equal(rachaRetos([k('2026-11-09'), k('2026-11-11')], '2026-11-12'), 1);
  assert.equal(rachaRetos([], '2026-11-12'), 0);
  assert.equal(rachaRetos([k('2026-02-28'), k('2026-03-01')], '2026-03-01'), 2, 'cambio de mes');
  assert.deepEqual(insigniasDe(7).map(x => x[0]), [3, 7]);
  assert.match(fechaLocal(), /^\d{4}-\d{2}-\d{2}$/);
});
