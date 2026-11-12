// La escalera aplicada al progreso del alumno (lecciones completadas y exámenes aprobados), más enlaces y textos
// comunes a las páginas que la muestran.
import { construirEscalera, estadoEscalera, rutaArea } from './escalera.js';
import { leccionHecha, notaQuiz } from './progreso.js';

const cache = new Map();
export function escaleraDe(curso, area) {
  if (!cache.has(area)) cache.set(area, construirEscalera(curso, area));
  return cache.get(area);
}
export const examenAprobado = clave => !!notaQuiz(clave)?.hecho;
export const estadoArea = (curso, area) => estadoEscalera(escaleraDe(curso, area), { leccionHecha, examenAprobado });

export const urlExamen = e => 'examen.html?escalon=' + e.id;
export const urlFinal = area => 'examen.html?final=' + area;

// Enlace y texto del siguiente paso de un área.
export function pasoSiguiente(est) {
  const s = est.siguiente;
  if (!s) return null;
  if (s.tipo === 'leccion') return { href: 'leccion.html?id=' + s.leccion.id, texto: s.leccion.titulo, tipo: 'Lección', escalon: s.escalon };
  if (s.tipo === 'examen') return { href: urlExamen(s.escalon), texto: `Examen del escalón ${s.escalon.n}`, tipo: 'Examen', escalon: s.escalon };
  return { href: urlFinal(s.area), texto: 'Examen final del área', tipo: 'Examen final' };
}

// Lo que viene después de una lección en la ruta (otra lección o el examen de su escalón).
export function despuesDe(curso, leccion) {
  const esc = escaleraDe(curso, leccion.modulo.area);
  const e = esc.find(x => x.lecciones.some(l => l.id === leccion.id));
  const i = e.lecciones.findIndex(l => l.id === leccion.id);
  if (i < e.lecciones.length - 1) return { tipo: 'leccion', leccion: e.lecciones[i + 1] };
  return { tipo: 'examen', escalon: e };
}
export const escalonDe = (curso, leccion) => escaleraDe(curso, leccion.modulo.area).find(x => x.lecciones.some(l => l.id === leccion.id));
export { rutaArea };
