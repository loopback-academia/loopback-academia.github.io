// Prueba de nivel (examen de entrada), sin DOM. Por cada escalón de la escalera de un área hay un bloque de preguntas de
// sus lecciones, del más fácil al más difícil. Cada bloque superado convalida ese escalón (se guarda como su examen
// aprobado) y el primero que no se supera marca el punto de partida del alumno.
import { construirEscalera, bancoDe, elegirPreguntas } from './escalera.js';

export const POR_BLOQUE = 6;
export const MINIMO_BLOQUE = 5; // 5 de 6 ≈ 83 %: un poco más exigente que el 80 % de los exámenes de escalón

export const superaBloque = aciertos => aciertos >= MINIMO_BLOQUE;

function conLecciones(curso) {
  if (curso.lecciones?.[0]?.modulo) return curso;
  return { ...curso, lecciones: curso.modulos.flatMap(m => m.lecciones.map(l => ({ ...l, modulo: m }))) };
}

// [{ n, escalon, preguntas }] con preguntas del banco (sin generadas: se responden con opciones).
export function bloquesNivel(curso, banco, area, rnd = Math.random) {
  return construirEscalera(conLecciones(curso), area).map((e, k) => {
    const pool = bancoDe(banco, e.lecciones).filter(q => q.options?.length >= 2);
    return { n: k + 1, escalon: e, preguntas: elegirPreguntas(pool, Math.min(POR_BLOQUE, pool.length), [], rnd) };
  });
}

// superados: cuántos bloques seguidos se superaron desde el primero. Devuelve dónde empezar.
export function puntoDePartida(bloques, superados) {
  const sig = bloques[superados];
  if (!sig) return { todo: true, superados };
  return { todo: false, superados, escalon: sig.escalon, n: sig.n, leccion: sig.escalon.lecciones[0] };
}

// Opciones de la primera pantalla: quién eres → a dónde te llevamos.
export const PERFILES = [
  { id: 'cero', icono: '🌱', titulo: 'No sé nada de tecnología', texto: 'Nunca he estudiado nada de esto y quiero empezar por lo más básico.' },
  { id: 'usuario', icono: '💻', titulo: 'Uso el ordenador, pero no he estudiado tecnología', texto: 'Me manejo con el ordenador e internet. Quiero comprobar si me salto lo básico.' },
  { id: 'experiencia', icono: '🎯', titulo: 'Ya sé de un área', texto: 'Tengo conocimientos de redes, programación, bases de datos u otra área y quiero empezar en mi nivel.' },
];
