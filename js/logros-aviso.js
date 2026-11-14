// Avisa al alumno cuando consigue una insignia o sube de nivel. Lo ya celebrado se recuerda en este navegador para no
// repetir el aviso; la primera vez solo se toma nota de lo que ya tenía (sin avisos de golpe).
import { toast, local } from './core.js';
import { logrosDe, xpDe, nivelDe } from './logros.js';

const VISTOS = 'aula:logros:vistos', NIVEL = 'aula:logros:nivel';
let temporizador = null;

export function avisarLogros(estado, racha, { semilla = false } = {}) {
  const conseguidos = logrosDe(estado, racha).filter(l => l.conseguido);
  const nivel = nivelDe(xpDe(estado)).actual;
  const vistos = local.get(VISTOS);
  if (!vistos || semilla) {
    if (!vistos) { local.set(VISTOS, conseguidos.map(l => l.id)); local.set(NIVEL, nivel.n); }
    return [];
  }
  const nuevos = conseguidos.filter(l => !vistos.includes(l.id));
  const sube = nivel.n > (local.get(NIVEL, 1) || 1);
  if (!nuevos.length && !sube) return [];
  local.set(VISTOS, [...new Set([...vistos, ...conseguidos.map(l => l.id)])]);
  if (sube) local.set(NIVEL, nivel.n);
  const partes = [];
  if (nuevos.length === 1) partes.push(`${nuevos[0].icono} ¡Insignia nueva: «${nuevos[0].titulo}»!`);
  else if (nuevos.length > 1) partes.push(`🏅 ¡${nuevos.length} insignias nuevas! (${nuevos.map(l => l.icono).join(' ')})`);
  if (sube) partes.push(`⬆️ ¡Subes al nivel ${nivel.n}: ${nivel.nombre}!`);
  // Un momento después del aviso de la propia actividad («Laboratorio completado»…), para que se lean los dos.
  if (typeof document !== 'undefined') {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => toast(partes.join(' '), 5200), 1600);
  }
  return nuevos;
}
