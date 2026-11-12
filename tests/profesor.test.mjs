// Panel del profesor: resumen por alumno y área, CSV seguro y detección de la migración pendiente.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resumenClase, csvClase, celdaCsv, totalesCurso, faltaMigracion } from '../js/profesor.js';
import { CATALOGO } from '../js/labs/catalogo.js';

const curso = JSON.parse(readFileSync(new URL('../data/curso.json', import.meta.url)));
const lec = a => curso.modulos.filter(m => m.area === a).flatMap(m => m.lecciones.map(l => l.id));
const ana = '22222222-2222-2222-2222-222222222222', luis = '33333333-3333-3333-3333-333333333333';
const fila = (user_id, alias, item_id, extra = {}) => ({ user_id, alias, unida: '2026-11-01T10:00:00Z', item_id, tipo: item_id?.split(':')[0] || null, puntos: null, total: null, hecho: true, datos: {}, actualizado: '2026-11-10T09:00:00Z', ...extra });

test('totales por área coinciden con el temario y el catálogo', () => {
  const t = totalesCurso(curso, CATALOGO);
  assert.equal(t.redes.lecciones, lec('redes').length);
  assert.equal(t.sec.labs, CATALOGO.filter(l => l.area === 'sec').length);
  assert.ok(Object.values(t).every(x => x.escalones >= 2));
});

test('resumen: cuenta lecciones, prácticas, escalones y final por área; un alumno sin progreso también aparece', () => {
  const filas = [
    fila(ana, 'Ana', 'leccion:' + lec('redes')[0]), fila(ana, 'Ana', 'leccion:' + lec('redes')[1]), fila(ana, 'Ana', 'leccion:' + lec('sec')[0]),
    fila(ana, 'Ana', 'leccion:' + lec('redes')[2], { hecho: false }),
    fila(ana, 'Ana', 'lab:topo-lan'), fila(ana, 'Ana', 'lab:pass-fuerza'),
    fila(ana, 'Ana', 'quiz:escalon-redes-1', { puntos: 18, total: 20 }), fila(ana, 'Ana', 'quiz:escalon-redes-2', { puntos: 10, total: 20, hecho: false }),
    fila(ana, 'Ana', 'quiz:final-sec', { puntos: 15, total: 20, hecho: false }),
    fila(ana, 'Ana', 'actividad', { datos: { dias: ['2026-11-09', '2026-11-10'] }, actualizado: '2026-11-11T08:00:00Z' }),
    fila(ana, 'Ana', 'leccion:no-existe'),
    fila(luis, 'Luis', null),
  ];
  const r = resumenClase(curso, CATALOGO, filas);
  assert.deepEqual(r.alumnos.map(a => a.alias), ['Ana', 'Luis']);
  const a = r.alumnos[0];
  assert.equal(a.areas.redes.lecciones, 2);
  assert.equal(a.areas.sec.lecciones, 1);
  assert.equal(a.areas.redes.labs, 1);
  assert.equal(a.areas.sec.labs, 1);
  assert.equal(a.areas.redes.escalones, 1);
  assert.deepEqual([a.areas.sec.final, a.areas.sec.notaFinal], [false, 75]);
  assert.equal(a.dias, 2);
  assert.equal(a.ultima, '2026-11-11T08:00:00Z');
  assert.equal(a.leccionesTotal, 3);
  assert.equal(r.alumnos[1].leccionesTotal, 0);
});

test('CSV: separado por punto y coma, con BOM, y sin fórmulas ejecutables', () => {
  assert.equal(celdaCsv('=HYPERLINK("http://x")'), `"'=HYPERLINK(""http://x"")"`);
  assert.equal(celdaCsv('+34 600'), `"'+34 600"`);
  assert.equal(celdaCsv('Ana; "la mejor"'), '"Ana; ""la mejor"""');
  const csv = csvClase(resumenClase(curso, CATALOGO, [fila(ana, '@malo', 'quiz:final-redes', { puntos: 17, total: 20 })]));
  assert.ok(csv.startsWith('﻿"Alumno";'));
  assert.match(csv, /"'@malo"/);
  assert.match(csv, /"aprobado \(85 %\)"/);
  assert.equal(csv.trim().split('\r\n').length, 2);
});

test('reconoce el error de la API cuando falta la migración', () => {
  assert.ok(faltaMigracion({ code: 'PGRST202', message: 'Could not find the function public.crear_clase(p_nombre) in the schema cache' }));
  assert.ok(faltaMigracion({ code: '42P01', message: 'relation "public.clases" does not exist' }));
  assert.ok(!faltaMigracion({ code: 'P0001', message: 'No hay ninguna clase con ese código' }));
});

test('la migración del panel mantiene RLS forzada y no deja insertar directamente', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20261112000000_profesor.sql', import.meta.url), 'utf8');
  for (const t of ['clases', 'clase_miembros']) {
    assert.match(sql, new RegExp(`alter table public\\.${t}\\s+force row level security`));
    assert.match(sql, new RegExp(`create policy \\w+_mfa\\s+on public\\.${t} as restrictive`));
  }
  assert.doesNotMatch(sql, /grant [^;]*insert[^;]*on public\.(clases|clase_miembros)/i);
  assert.equal((sql.match(/security definer set search_path = ''/g) || []).length, (sql.match(/security definer/g) || []).length, 'toda función SECURITY DEFINER fija search_path');
  for (const f of ['crear_clase', 'unirse_a_clase', 'progreso_de_clase']) assert.match(sql, new RegExp(`revoke all on function public\\.${f}\\([^)]*\\) from public, anon`));
});
