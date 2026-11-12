// Reto del día: una pregunta al día, la misma para todo el día, de los módulos que el alumno ya ha empezado.
// Se guarda como cuestionario «reto-AAAA-MM-DD» (se sincroniza con la cuenta). Sin DOM: se prueba en Node.

export const fechaLocal = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const resumen = t => { let h = 0x811c9dc5; for (const c of t) { h ^= c.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h; };

// banco: data/examen.json. modulosEmpezados: Set de ids de módulo. respaldo: id de módulo si aún no ha empezado ninguno.
export function retoDelDia(banco, fecha, modulosEmpezados, respaldo) {
  const validas = banco.filter(q => !q.dup && q.options?.length >= 2);
  let pool = validas.filter(q => modulosEmpezados.has(q.modulo));
  if (!pool.length) pool = validas.filter(q => q.modulo === respaldo);
  if (!pool.length) pool = validas;
  return pool[resumen('reto|' + fecha) % pool.length];
}

export const claveReto = fecha => 'reto-' + fecha;

// Días seguidos con el reto respondido (acertado o no), contando hasta hoy o hasta ayer si hoy aún no se ha hecho.
export function rachaRetos(claves, hoy = fechaLocal()) {
  const dias = new Set(claves.filter(k => k.startsWith('quiz:reto-')).map(k => k.slice('quiz:reto-'.length)));
  const d = new Date(hoy + 'T12:00:00');
  if (!dias.has(hoy)) d.setDate(d.getDate() - 1);
  let n = 0;
  while (dias.has(fechaLocal(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export const INSIGNIAS = [[3, '🌱', '3 días seguidos'], [7, '🔥', 'Una semana seguida'], [30, '🏅', 'Un mes seguido'], [100, '🏆', '100 días seguidos']];
export const insigniasDe = racha => INSIGNIAS.filter(([n]) => racha >= n);
