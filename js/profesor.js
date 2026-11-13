// Panel del profesor (sin DOM): convierte las filas de progreso_de_clase() en un resumen por alumno y área, y lo exporta a CSV.
import { construirEscalera } from './escalera.js';

export const AREAS = { base: 'Empieza aquí', redes: 'Redes', bd: 'Bases de datos', prog: 'Programación', sec: 'Ciberseguridad', ti: 'Empleo TI', en: 'Inglés técnico' };
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

function conLecciones(curso) {
  if (curso.lecciones?.[0]?.modulo) return curso;
  return { ...curso, lecciones: curso.modulos.flatMap(m => m.lecciones.map(l => ({ ...l, modulo: m }))) };
}

export function totalesCurso(curso, catalogo) {
  const c = conLecciones(curso);
  return Object.fromEntries(Object.keys(AREAS).map(a => [a, {
    lecciones: c.lecciones.filter(l => l.modulo.area === a).length,
    labs: new Set(catalogo.filter(l => l.area === a).map(l => l.progreso)).size,
    escalones: construirEscalera(c, a).length,
  }]));
}

// filas: [{ user_id, alias, unida, item_id, tipo, puntos, total, hecho, datos, actualizado }] (un alumno sin progreso trae
// una fila con item_id null). Devuelve { alumnos, totales }.
export function resumenClase(curso, catalogo, filas) {
  const c = conLecciones(curso);
  const areaLeccion = new Map(c.lecciones.map(l => [l.id, l.modulo.area]));
  const areaLab = new Map(catalogo.map(l => [l.progreso, l.area]));
  const totales = totalesCurso(c, catalogo);
  const alumnos = new Map();
  for (const f of filas) {
    if (!alumnos.has(f.user_id)) {
      alumnos.set(f.user_id, { id: f.user_id, alias: f.alias, unida: f.unida, ultima: null, dias: 0,
        areas: Object.fromEntries(Object.keys(AREAS).map(a => [a, { lecciones: 0, labs: 0, escalones: 0, final: false, notaFinal: null }])) });
    }
    const al = alumnos.get(f.user_id);
    if (!f.item_id) continue;
    if (f.actualizado && (!al.ultima || f.actualizado > al.ultima)) al.ultima = f.actualizado;
    const [tipo, clave] = [f.item_id.split(':')[0], f.item_id.slice(f.item_id.indexOf(':') + 1)];
    if (f.item_id === 'actividad') { al.dias = Array.isArray(f.datos?.dias) ? f.datos.dias.length : 0; continue; }
    if (tipo === 'leccion' && f.hecho && areaLeccion.has(clave)) al.areas[areaLeccion.get(clave)].lecciones++;
    else if (tipo === 'lab' && f.hecho && areaLab.has(clave)) al.areas[areaLab.get(clave)].labs++;
    else if (tipo === 'quiz') {
      const esc = clave.match(/^escalon-([a-z]+)-\d+$/), fin = clave.match(/^final-([a-z]+)$/);
      if (esc && f.hecho && al.areas[esc[1]]) al.areas[esc[1]].escalones++;
      if (fin && al.areas[fin[1]]) { al.areas[fin[1]].final = !!f.hecho; al.areas[fin[1]].notaFinal = pct(f.puntos || 0, f.total || 0); }
    }
  }
  for (const al of alumnos.values()) {
    for (const [a, t] of Object.entries(totales)) {
      const x = al.areas[a];
      x.lecciones = Math.min(x.lecciones, t.lecciones); x.labs = Math.min(x.labs, t.labs); x.escalones = Math.min(x.escalones, t.escalones);
      x.pct = pct(x.lecciones, t.lecciones);
    }
    al.leccionesTotal = Object.values(al.areas).reduce((n, x) => n + x.lecciones, 0);
  }
  return { alumnos: [...alumnos.values()].sort((a, b) => a.alias.localeCompare(b.alias, 'es')), totales };
}

// Una celda de CSV segura: entre comillas y sin fórmulas (un alias como «=HYPERLINK(...)» no se ejecuta en Excel).
export function celdaCsv(v) {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}
export function csvClase({ alumnos, totales }) {
  const areas = Object.keys(AREAS);
  const cab = ['Alumno', 'Se unió', 'Última actividad', 'Días con actividad', ...areas.flatMap(a => [`${AREAS[a]}: lecciones (de ${totales[a].lecciones})`, `${AREAS[a]}: prácticas (de ${totales[a].labs})`, `${AREAS[a]}: escalones (de ${totales[a].escalones})`, `${AREAS[a]}: examen final`])];
  const filas = alumnos.map(al => [al.alias, al.unida?.slice(0, 10), al.ultima?.slice(0, 10) || '', al.dias,
    ...areas.flatMap(a => { const x = al.areas[a]; return [x.lecciones, x.labs, x.escalones, x.final ? `aprobado (${x.notaFinal} %)` : x.notaFinal != null ? `suspenso (${x.notaFinal} %)` : '']; })]);
  return '﻿' + [cab, ...filas].map(f => f.map(celdaCsv).join(';')).join('\r\n') + '\r\n';
}

// Errores de la API cuando la migración del panel no se ha aplicado todavía.
export const faltaMigracion = err => /PGRST202|PGRST205|42P01|42883|could not find the function|relation .* does not exist|schema cache/i.test(`${err?.code || ''} ${err?.message || ''}`);
