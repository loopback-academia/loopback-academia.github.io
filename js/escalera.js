// Escalera de aprendizaje con prerrequisitos (sin DOM: se prueba en Node).
//
// Cada área es una escalera de escalones. Un escalón agrupa lecciones consecutivas de la ruta por niveles (nivel 1,
// luego 2, luego 3) y termina con un examen. Reglas:
//   - Dentro de un escalón, cada lección se abre al completar la anterior (cuestionario con un 80 % o más).
//   - El examen del escalón se abre al completar todas sus lecciones y hay que aprobarlo (80 %) para abrir el
//     siguiente escalón. Al final de la escalera está el examen final del área.
//   - Lo ya completado sigue abierto para repasar.
// Los exámenes eligen preguntas que no salieron en los intentos anteriores, así cada intento es distinto: el tamaño
// del examen es como mucho la mitad del banco del escalón, de modo que dos intentos seguidos no comparten preguntas.

export const APROBADO = 0.8;
export const POOL_MIN = 16;      // preguntas mínimas en el banco de un escalón
export const MAX_LECCIONES = 12; // lecciones máximas por escalón (si el banco ya es suficiente)
export const MAX_EXAMEN = 20;

export const aprueba = (puntos, total) => total > 0 && puntos / total >= APROBADO;
export const minimoPara = total => Math.ceil(total * APROBADO - 1e-9);

// Lecciones del área en el orden de la ruta: todo el nivel 1, después el 2 y el 3 (dentro de cada nivel, en el
// orden del temario).
export function rutaArea(curso, area) {
  return curso.lecciones.filter(l => l.modulo.area === area).map((l, i) => ({ l, i })).sort((a, b) => a.l.nivel - b.l.nivel || a.i - b.i).map(x => x.l);
}

const preguntasDe = l => l.preguntas ?? (l.quiz || []).length;

export function construirEscalera(curso, area) {
  const ruta = rutaArea(curso, area);
  const grupos = [];
  let cur = null;
  for (const l of ruta) {
    const ultimo = cur?.lecciones[cur.lecciones.length - 1];
    if (cur && cur.pool >= POOL_MIN && (l.nivel !== ultimo.nivel || cur.lecciones.length >= MAX_LECCIONES)) cur = null;
    if (!cur) { cur = { lecciones: [], pool: 0 }; grupos.push(cur); }
    cur.lecciones.push(l);
    cur.pool += preguntasDe(l);
  }
  // Un último grupo con pocas preguntas se une al anterior.
  if (grupos.length > 1 && grupos[grupos.length - 1].pool < POOL_MIN) {
    const ult = grupos.pop();
    grupos[grupos.length - 1].lecciones.push(...ult.lecciones);
    grupos[grupos.length - 1].pool += ult.pool;
  }
  return grupos.map((g, k) => {
    const niveles = [...new Set(g.lecciones.map(l => l.nivel))];
    const modulos = [...new Map(g.lecciones.map(l => [l.modulo.id, l.modulo.titulo])).values()];
    return {
      id: `${area}-${k + 1}`, n: k + 1, area, lecciones: g.lecciones, pool: g.pool, niveles, modulos,
      examen: 'escalon-' + area + '-' + (k + 1),
      tamano: Math.max(5, Math.min(MAX_EXAMEN, Math.floor(g.pool / 2))),
    };
  });
}

// Estado de cada paso. leccionHecha(id) y examenAprobado(clave) vienen del progreso del alumno.
export function estadoEscalera(escalera, { leccionHecha, examenAprobado }) {
  let libre = true;
  let siguiente = null;
  const lecciones = new Map();
  const escalones = escalera.map(e => {
    const ls = e.lecciones.map(l => {
      let estado;
      if (leccionHecha(l.id)) estado = 'hecha';
      else if (libre) { estado = 'actual'; libre = false; siguiente ||= { tipo: 'leccion', leccion: l, escalon: e }; }
      else estado = 'bloqueada';
      lecciones.set(l.id, estado);
      return { leccion: l, estado };
    });
    let examen;
    if (examenAprobado(e.examen)) examen = 'aprobado';
    else if (libre) { examen = 'disponible'; libre = false; siguiente ||= { tipo: 'examen', escalon: e }; }
    else examen = 'bloqueado';
    const hechas = ls.filter(x => x.estado === 'hecha').length;
    const abierto = ls.some(x => x.estado !== 'bloqueada') || examen !== 'bloqueado';
    return { ...e, pasos: ls, estadoExamen: examen, hechas, abierto, completo: examen === 'aprobado' && hechas === ls.length };
  });
  const area = escalera[0]?.area;
  const final = !escalera.length ? 'bloqueado' : examenAprobado('final-' + area) ? 'aprobado' : libre ? 'disponible' : 'bloqueado';
  if (final === 'disponible') siguiente ||= { tipo: 'final', area };
  return {
    escalones, final, siguiente,
    estadoLeccion: id => lecciones.get(id) || 'bloqueada',
    accesible: id => ['hecha', 'actual'].includes(lecciones.get(id)),
  };
}

// Un laboratorio está abierto si lo está la lección donde aparece. Si no aparece en ninguna lección, se abre al
// llegar a alguna lección de su nivel o superior en su área.
const NIVEL_NUM = { principiante: 1, intermedio: 2, avanzado: 3 };
export function labAccesible(lab, curso, estado) {
  const dentro = curso.lecciones.filter(l => l.modulo.area === lab.area && (l.blocks || []).some(b => b.t === 'embed' && `${b.kind}:${b.id}` === lab.clave));
  if (dentro.length) return dentro.some(l => estado.accesible(l.id));
  const n = NIVEL_NUM[lab.nivel] || 1;
  return curso.lecciones.some(l => l.modulo.area === lab.area && l.nivel >= n && estado.accesible(l.id));
}
export function leccionDeLab(lab, curso) {
  return curso.lecciones.find(l => l.modulo.area === lab.area && (l.blocks || []).some(b => b.t === 'embed' && `${b.kind}:${b.id}` === lab.clave)) || null;
}

// Elige n preguntas evitando las de los intentos anteriores: primero las que no salieron en ninguno de los dos
// últimos intentos, después las que solo salieron en el penúltimo y, como último recurso, las del último.
export function elegirPreguntas(banco, n, intentos = [], rnd = Math.random) {
  const ultimo = new Set(intentos[intentos.length - 1] || []);
  const penultimo = new Set(intentos[intentos.length - 2] || []);
  const peso = q => (ultimo.has(q.id) ? 2 : penultimo.has(q.id) ? 1 : 0);
  return banco.map(q => ({ q, p: peso(q), r: rnd() })).sort((a, b) => a.p - b.p || a.r - b.r).slice(0, n).map(x => x.q);
}

// Preguntas del banco que pertenecen a unas lecciones.
// Las preguntas marcadas como duplicadas (mismo enunciado que otra) no cuentan para los exámenes.
export const bancoDe = (banco, lecciones) => { const ids = new Set(lecciones.map(l => l.id)); return banco.filter(q => !q.dup && ids.has(q.id.split('#')[0])); };
