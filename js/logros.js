// Niveles (experiencia, XP) e insignias del alumno, calculados a partir de su progreso (sin DOM). Dan una meta
// pequeña y cercana en cada sesión: subir de nivel, completar la racha, conseguir la siguiente insignia.
const items = st => Object.entries(st.items || {});
const hechos = (st, pref) => items(st).filter(([k, v]) => k.startsWith(pref) && v.hecho);
const AREA_POR_LETRA = { m: 'redes', b: 'bd', p: 'prog', t: 'ti', e: 'en', c: 'sec', i: 'base' };

export const XP = { leccion: 20, quiz: 10, lab: 30, escalon: 50, final: 150, simulacro: 25, dia: 5 };

export function xpDe(st) {
  let xp = 0;
  for (const [k, v] of items(st)) {
    if (!v.hecho) continue;
    if (k.startsWith('leccion:')) xp += XP.leccion;
    else if (k.startsWith('lab:')) xp += XP.lab;
    else if (k.startsWith('quiz:escalon-')) xp += XP.escalon;
    else if (k.startsWith('quiz:final-')) xp += XP.final;
    else if (k.startsWith('quiz:')) xp += XP.quiz;
  }
  return xp + (st.examenes || []).length * XP.simulacro + (st.dias || []).length * XP.dia;
}

export const NIVELES = [
  { n: 1, nombre: 'Iniciado', xp: 0 },
  { n: 2, nombre: 'Aprendiz', xp: 100 },
  { n: 3, nombre: 'Practicante', xp: 300 },
  { n: 4, nombre: 'Técnico junior', xp: 700 },
  { n: 5, nombre: 'Técnico', xp: 1300 },
  { n: 6, nombre: 'Administrador', xp: 2200 },
  { n: 7, nombre: 'Ingeniero', xp: 3500 },
  { n: 8, nombre: 'Arquitecto', xp: 5200 },
];

export function nivelDe(xp) {
  let k = 0;
  while (k + 1 < NIVELES.length && xp >= NIVELES[k + 1].xp) k++;
  const actual = NIVELES[k], siguiente = NIVELES[k + 1] || null;
  const progreso = siguiente ? (xp - actual.xp) / (siguiente.xp - actual.xp) : 1;
  return { actual, siguiente, progreso, faltan: siguiente ? siguiente.xp - xp : 0 };
}

const cuenta = (st, pref) => hechos(st, pref).length;
const tiene = (st, id) => !!st.items?.[id]?.hecho;

// ok(st, racha) → ¿conseguida? Las pistas dicen qué hacer para conseguirla.
export const LOGROS = [
  { id: 'primera-leccion', icono: '🌱', titulo: 'Primera lección', texto: 'Completa tu primera lección.', ok: st => cuenta(st, 'leccion:') >= 1 },
  { id: 'cinco-lecciones', icono: '📚', titulo: '5 lecciones', texto: 'Completa 5 lecciones.', ok: st => cuenta(st, 'leccion:') >= 5 },
  { id: 'veinte-lecciones', icono: '🎒', titulo: '20 lecciones', texto: 'Completa 20 lecciones.', ok: st => cuenta(st, 'leccion:') >= 20 },
  { id: 'cincuenta-lecciones', icono: '🧠', titulo: '50 lecciones', texto: 'Completa 50 lecciones.', ok: st => cuenta(st, 'leccion:') >= 50 },
  { id: 'primer-lab', icono: '🧪', titulo: 'Primer laboratorio', texto: 'Termina tu primer laboratorio o práctica.', ok: st => cuenta(st, 'lab:') >= 1 },
  { id: 'diez-labs', icono: '🛠️', titulo: '10 laboratorios', texto: 'Termina 10 laboratorios o prácticas.', ok: st => cuenta(st, 'lab:') >= 10 },
  { id: 'modos', icono: '🧭', titulo: 'Modos de Cisco IOS', texto: 'Supera el ejercicio «¿En qué modo estoy?» de Cisco IOS.', ok: st => tiene(st, 'lab:modos-ios') },
  { id: 'ordena', icono: '🧩', titulo: 'Secuencia de comandos', texto: 'Supera un ejercicio de «Ordena los comandos».', ok: st => cuenta(st, 'lab:ordena-') >= 1 },
  { id: 'switch', icono: '🔌', titulo: 'Primer switch configurado', texto: 'Completa el laboratorio de configuración inicial de un switch.', ok: st => tiene(st, 'lab:cli-basico') },
  { id: 'router', icono: '📡', titulo: 'Primer router configurado', texto: 'Completa el laboratorio del router de la oficina.', ok: st => tiene(st, 'lab:cli-router') },
  { id: 'packet-tracer', icono: '📦', titulo: 'Packet Tracer instalado', texto: 'Completa la lista para instalar Packet Tracer.', ok: st => tiene(st, 'lab:lista-pt-instalar') },
  { id: 'averia', icono: '🔧', titulo: 'Primera avería resuelta', texto: 'Resuelve un laboratorio de avería.', ok: st => cuenta(st, 'lab:cli-averia-') >= 1 },
  { id: 'escalon', icono: '🪜', titulo: 'Primer escalón aprobado', texto: 'Aprueba tu primer examen de escalón.', ok: st => cuenta(st, 'quiz:escalon-') >= 1 },
  { id: 'cinco-escalones', icono: '🏔️', titulo: '5 escalones aprobados', texto: 'Aprueba 5 exámenes de escalón.', ok: st => cuenta(st, 'quiz:escalon-') >= 5 },
  { id: 'final', icono: '🎓', titulo: 'Área completada', texto: 'Aprueba el examen final de un área.', ok: st => cuenta(st, 'quiz:final-') >= 1 },
  { id: 'simulacro', icono: '⏱️', titulo: 'Primer simulacro', texto: 'Haz un simulacro de examen.', ok: st => (st.examenes || []).length >= 1 },
  { id: 'repaso', icono: '🔁', titulo: 'Repaso consolidado', texto: 'Domina 10 preguntas en el repaso de errores.', ok: st => cuenta(st, 'repaso:') >= 10 },
  { id: 'racha-3', icono: '🔥', titulo: '3 días consecutivos', texto: 'Estudia 3 días consecutivos.', ok: (st, r) => r >= 3 },
  { id: 'racha-7', icono: '🏅', titulo: '7 días consecutivos', texto: 'Estudia 7 días consecutivos.', ok: (st, r) => r >= 7 },
  { id: 'racha-30', icono: '👑', titulo: '30 días consecutivos', texto: 'Estudia 30 días consecutivos.', ok: (st, r) => r >= 30 },
  { id: 'tres-areas', icono: '🌍', titulo: 'Tres áreas', texto: 'Completa lecciones de 3 áreas distintas.', ok: st => new Set(hechos(st, 'leccion:').map(([k]) => AREA_POR_LETRA[k[8]]).filter(Boolean)).size >= 3 },
];

export function logrosDe(st, racha = 0) {
  return LOGROS.map(l => ({ ...l, conseguido: !!l.ok(st, racha) }));
}
