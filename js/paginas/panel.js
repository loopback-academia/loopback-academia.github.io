// Panel del curso: progreso global, "continuar donde lo dejaste" y el temario en dos vistas:
// ruta por niveles (principiante → intermedio → avanzado) o por módulos del CCNA.
import { iniciarPagina, el, $, $$, setMeter, plural, pct, local } from '../core.js';
import { cuentasActivas } from '../auth.js';
import { cargarCurso, numeroModulo } from '../curso.js';
import { CATALOGO } from '../labs/catalogo.js';
import { practicasPendientes, temasAReforzar, resumenRepaso } from '../recomendaciones.js';
import { labAccesible, leccionDeLab, minimoPara } from '../escalera.js';
import { estadoArea, pasoSiguiente, urlExamen, urlFinal } from '../escalera-alumno.js';
import { cargar, alCambiar, leccionHecha, notaQuiz, labHecho, examenes, racha, exportar } from '../progreso.js';
import { montarReto } from '../reto-ui.js';

const usuario = await iniciarPagina();
const curso = await cargarCurso().catch(() => null);
const abiertos = new Set();
let vista = local.get('aula:panel:vista', 'niveles');
const pedida = new URLSearchParams(location.search).get('area');
let area = ['redes', 'bd', 'prog', 'ti'].includes(pedida) ? pedida : local.get('aula:panel:area', 'redes');
const NIVEL_INFO = [1, 2, 3].map(n => ({ n, clave: ['principiante', 'intermedio', 'avanzado'][n - 1], titulo: ['Nivel 1 · Principiante', 'Nivel 2 · Intermedio', 'Nivel 3 · Avanzado'][n - 1] }));
// Orden de la ruta: primero todo el nivel 1, luego el 2 y luego el 3 (dentro de cada nivel, en el orden del temario).
const delArea = () => curso.lecciones.filter(l => l.modulo.area === area);
const ruta = () => [...delArea()].sort((a, b) => a.nivel - b.nivel);

function check(hecho, medio) { return el('span', { class: 'check' + (hecho ? ' on' : medio ? ' half' : ''), 'aria-hidden': 'true' }, '✓'); }
function filaLeccion(l, conModulo) {
  const q = notaQuiz(l.id);
  const abierta = estadoArea(curso, area).accesible(l.id);
  const partes = [abierta ? check(leccionHecha(l.id), q) : el('span', { class: 'check', 'aria-hidden': 'true' }, '🔒'),
    el('span', {}, l.titulo, conModulo ? el('span', { class: 'lesson-mod' }, ` · M${numeroModulo(l.modulo)}`) : null),
    el('span', { class: 'small muted' }, q ? `${q.puntos}/${q.total}` : abierta ? l.minutos + ' min' : 'cerrada')];
  return el('li', {}, abierta ? el('a', { class: 'lesson-link', href: 'leccion.html?id=' + l.id }, partes) : el('span', { class: 'lesson-link locked', title: 'Se abre al completar los pasos anteriores de la escalera' }, partes));
}

// ---------------------------------------------------------------- escalera
const ICONO_LAB = l => (l.grupo === 'averias' ? '🔧 ' : l.grupo === 'casos' ? '🎫 ' : l.grupo === 'proyectos' ? '🏗️ ' : l.area === 'prog' ? '▶ ' : '🧪 ');
function pintarEscalera() {
  const est = estadoArea(curso, area);
  const labsArea = CATALOGO.filter(l => l.area === area && !l.libre);
  const escalonDeLab = lab => {
    const lec = leccionDeLab(lab, curso);
    const n = { principiante: 1, intermedio: 2, avanzado: 3 }[lab.nivel] || 1;
    return lec ? est.escalones.find(e => e.lecciones.some(l => l.id === lec.id)) : est.escalones.find(e => e.niveles.some(x => x >= n));
  };
  const items = est.escalones.map((e, k) => {
    const actual = e.pasos.some(p => p.estado === 'actual') || e.estadoExamen === 'disponible';
    const estado = e.completo ? 'completo' : actual ? 'actual' : e.abierto ? 'abierto' : 'cerrado';
    const nodos = e.pasos.map((p, i) => {
      const l = p.leccion;
      const ico = p.estado === 'hecha' ? '✓' : p.estado === 'actual' ? '▶' : '🔒';
      const contenido = [el('span', { class: 'node-dot', 'aria-hidden': 'true' }, ico), el('span', { class: 'node-txt' }, el('strong', {}, l.titulo), el('span', { class: 'small muted' }, p.estado === 'actual' ? 'Tu siguiente paso · ' + l.minutos + ' min' : p.estado === 'hecha' ? 'Completada' : 'Cerrada'))];
      const li = el('li', { class: 'node ' + p.estado },
        p.estado === 'bloqueada' ? el('span', { class: 'node-in' }, contenido) : el('a', { class: 'node-in', href: 'leccion.html?id=' + l.id }, contenido));
      li.style.setProperty('--x', Math.round(Math.sin(i * 0.9) * 36) + 'px'); // CSSOM: permitido por la CSP (style-src 'self')
      return li;
    });
    const labs = labsArea.filter(lab => escalonDeLab(lab) === e);
    const chips = labs.length ? el('div', { class: 'step-labs' }, el('p', { class: 'small' }, el('strong', {}, 'Prácticas de este escalón')),
      el('ul', { class: 'chips' }, labs.map(lab => el('li', {}, labAccesible(lab, curso, est)
        ? el('a', { class: 'chip' + (labHecho(lab.progreso) ? ' done' : ''), href: 'laboratorio.html?l=' + lab.clave }, ICONO_LAB(lab) + lab.titulo)
        : el('span', { class: 'chip locked', title: 'Se abre con su lección' }, '🔒 ' + lab.titulo))))) : null;
    const q = notaQuiz(e.examen);
    const examen = el('div', { class: 'step-exam ' + e.estadoExamen },
      el('span', { class: 'node-dot', 'aria-hidden': 'true' }, e.estadoExamen === 'aprobado' ? '🏅' : e.estadoExamen === 'disponible' ? '🏁' : '🔒'),
      el('div', {}, el('strong', {}, `Examen del escalón ${e.n}`), el('span', { class: 'small muted' }, e.estadoExamen === 'aprobado' ? ` · aprobado con ${pct(q.puntos, q.total)} %` : ` · ${e.tamano} preguntas · mínimo ${minimoPara(e.tamano)} (80 %)`),
        el('p', { class: 'small muted' }, e.estadoExamen === 'bloqueado' ? 'Se abre al completar todas las lecciones de este escalón.' : e.estadoExamen === 'disponible' ? '¡Listo! Apruébalo para abrir el siguiente escalón.' : 'Puedes repetirlo para mejorar: tendrá preguntas nuevas.')),
      e.estadoExamen === 'bloqueado' ? null : el('a', { class: 'btn btn-sm ' + (e.estadoExamen === 'disponible' ? 'btn-primary' : 'btn-ghost'), href: urlExamen(e) }, e.estadoExamen === 'disponible' ? 'Hacer el examen' : 'Repetir'));
    const meter = el('div', { class: 'meter' }, el('span'));
    setMeter(meter, (e.hechas + (e.estadoExamen === 'aprobado' ? 1 : 0)) / (e.pasos.length + 1));
    const clave = 'esc-' + e.id;
    const det = el('details', { class: 'step-card ' + estado, open: abiertos.has(clave) || (actual && !abiertos.size) },
      el('summary', {},
        el('span', { class: 'step-num', 'aria-hidden': 'true' }, e.completo ? '✓' : estado === 'cerrado' ? '🔒' : String(e.n)),
        el('div', {}, el('div', { class: 'module-title' }, `Escalón ${e.n} · ${NIVEL_INFO[e.niveles[0] - 1].titulo.split(' · ')[1]}${e.niveles.length > 1 ? ' a ' + NIVEL_INFO[e.niveles[e.niveles.length - 1] - 1].titulo.split(' · ')[1] : ''}`),
          el('div', { class: 'module-meta' }, `${e.modulos.join(' · ')} · ${e.hechas}/${plural(e.pasos.length, 'lección', 'lecciones')}`)),
        el('div', { class: 'module-progress' }, meter)),
      estado === 'cerrado' ? el('p', { class: 'small muted step-lock' }, `🔒 Se abre al aprobar el examen del escalón ${e.n - 1}.`) : null,
      el('ol', { class: 'ladder-path' }, nodos), chips, examen);
    det.addEventListener('toggle', () => { if (det.open) abiertos.add(clave); else abiertos.delete(clave); });
    const li = el('li', { class: 'ladder-step' }, det);
    li.style.setProperty('--i', String(k));
    return li;
  });
  const qf = notaQuiz('final-' + area);
  const final = el('li', { class: 'ladder-step' }, el('div', { class: 'step-final ' + est.final },
    el('span', { class: 'node-dot', 'aria-hidden': 'true' }, est.final === 'aprobado' ? '🏆' : est.final === 'disponible' ? '🎓' : '🔒'),
    el('div', {}, el('strong', {}, 'Examen final del área'), el('p', { class: 'small muted' }, est.final === 'aprobado' ? `Aprobado con ${pct(qf.puntos, qf.total)} %. ¡Escalera completada!` : est.final === 'disponible' ? 'Último paso: demuestra todo lo aprendido (mínimo 80 %).' : 'Se abre al aprobar el examen de todos los escalones.')),
    est.final === 'bloqueado' ? null : est.final === 'aprobado' ? el('a', { class: 'btn btn-sm btn-primary', href: 'certificado.html?area=' + area }, '🎓 Mi certificado') : el('a', { class: 'btn btn-sm btn-primary', href: urlFinal(area) }, 'Hacer el examen final')));
  return el('div', {}, el('p', { class: 'small muted ladder-help' }, 'Se avanza paso a paso: cada lección se abre al aprobar la anterior con un 80 %, y cada escalón al aprobar el examen del anterior. Lo completado queda abierto para repasar.'),
    el('ol', { class: 'ladder' }, items, final));
}
function bloque(clave, cabecera, desc, lecciones, extra, abrirPorDefecto) {
  const n = lecciones.filter(l => leccionHecha(l.id)).length;
  const meter = el('div', { class: 'meter' }, el('span'));
  setMeter(meter, lecciones.length ? n / lecciones.length : 0);
  const det = el('details', { class: 'module' + (n === lecciones.length ? ' done' : ''), open: abiertos.has(clave) || (abrirPorDefecto && !abiertos.size) },
    el('summary', {}, el('span', { class: 'module-num' }, n === lecciones.length ? '✓' : String(cabecera.num)),
      el('div', {}, el('div', { class: 'module-title' }, cabecera.titulo), el('div', { class: 'module-meta' }, [...cabecera.meta, `${n}/${plural(lecciones.length, 'lección', 'lecciones')}`].join(' · '))),
      el('div', { class: 'module-progress' }, meter)),
    el('p', { class: 'small muted module-desc' }, desc),
    el('ul', { class: 'lesson-list' }, lecciones.map(l => filaLeccion(l, cabecera.conModulo))),
    extra);
  det.addEventListener('toggle', () => { if (det.open) abiertos.add(clave); else abiertos.delete(clave); });
  return det;
}

function pintar() {
  if (!curso) { $('#modulos').replaceChildren(el('div', { class: 'alert alert-warn' }, el('p', {}, 'No se pudo cargar el temario. Recarga la página.'))); return; }
  const todas = delArea();
  const hechas = todas.filter(l => leccionHecha(l.id)).length;
  const labsArea = CATALOGO.filter(l => l.area === area && !l.libre);
  $('#stLecciones').textContent = `${hechas}/${todas.length}`;
  $('#stRacha').textContent = racha();
  $('#stLabs').textContent = `${labsArea.filter(l => labHecho(l.progreso)).length}/${labsArea.length}`;
  $$('#areas button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.area === area)));
  $('#progresoTitulo').textContent = 'TU PROGRESO EN ' + { redes: 'REDES', bd: 'BASES DE DATOS', prog: 'PROGRAMACIÓN', ti: 'EMPLEO TI' }[area];
  $('#vistaModulos').textContent = area === 'redes' ? 'Por módulos del CCNA' : 'Por módulos';
  const [href, texto] = { redes: ['laboratorio.html?l=lab:subnetting', 'Entrenador de subnetting'], bd: ['laboratorio.html?l=sql:select', 'Laboratorio SQL'], prog: ['laboratorio.html?l=code:python-libre', 'Zona libre de Python'], ti: ['rutas.html', 'Rutas de empleo'] }[area];
  $('#practicaArea').setAttribute('href', href);
  $('#practicaArea').textContent = texto;

  const ex = examenes();
  $('#stExamen').textContent = ex.length ? Math.max(...ex.map(e => pct(e.puntos, e.total))) + ' %' : '—';
  setMeter($('#meterTotal'), hechas / todas.length);
  $('#pctTotal').textContent = `Has completado el ${pct(hechas, todas.length)} % de esta área.`;
  $$('#vistas button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.vista === vista)));

  const estE = estadoArea(curso, area);
  const paso = pasoSiguiente(estE);
  const siguiente = estE.siguiente?.tipo === 'leccion' ? estE.siguiente.leccion : null;
  const cont = $('#continuar');
  cont.hidden = false;
  cont.replaceChildren(...(paso
    ? [el('div', {}, el('span', { class: 'eyebrow' }, paso.tipo !== 'Lección' ? 'Te toca examen' : hechas ? 'Continúa donde lo dejaste' : 'Empieza por aquí'), el('h2', {}, paso.texto),
        el('p', { class: 'muted small' }, siguiente ? `Escalón ${paso.escalon.n} · ${NIVEL_INFO[siguiente.nivel - 1].titulo} · ${siguiente.minutos} min` : paso.escalon ? `Escalón ${paso.escalon.n} · ${paso.escalon.tamano} preguntas · mínimo 80 %` : 'Todo el temario del área · mínimo 80 %')),
       el('a', { class: 'btn btn-primary btn-lg', href: paso.href }, paso.tipo !== 'Lección' ? 'Hacer el examen' : hechas ? 'Continuar' : 'Empezar')]
    : [el('div', {}, el('span', { class: 'eyebrow' }, '¡Escalera completada!'), el('h2', {}, 'Has aprobado el examen final del área'), el('p', { class: 'muted small' }, 'Sigue con otra área o con una ruta de empleo.')),
       el('a', { class: 'btn btn-primary btn-lg', href: 'rutas.html' }, 'Rutas de empleo')]));

  pintarContinua();
  pintarGuia();

  if (vista === 'niveles') {
    $('#modulos').replaceChildren(pintarEscalera());
  } else {
    $('#modulos').replaceChildren(...curso.modulos.filter(m => m.area === area).map(m => bloque(m.id, { num: numeroModulo(m), titulo: m.titulo, meta: [m.dominio, m.peso ? m.peso + ' % del examen' : null].filter(Boolean) }, m.descripcion, m.lecciones.map(l => curso.lecciones.find(x => x.id === l.id)), null, siguiente?.modulo.id === m.id)));
  }
}

function elegirArea(id) {
  local.set('aula:guia:area', id);
  if (id === area) { pintar(); return; }
  area = id;
  local.set('aula:panel:area', area);
  abiertos.clear();
  pintar();
}
$('#areas').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (b) elegirArea(b.dataset.area);
});
// "Continúa por aquí": repaso de hoy, prácticas pendientes de lo estudiado y temas a reforzar (del área elegida).
function pintarContinua() {
  const r = resumenRepaso(curso, area);
  const pendientes = practicasPendientes(curso, area, 3);
  const temas = temasAReforzar(curso, area).slice(0, 3);
  const nivelActual = siguienteNivel();
  const estP = estadoArea(curso, area);
  const sugeridas = (pendientes.length ? pendientes : CATALOGO.filter(l => l.area === area && !l.libre && !labHecho(l.progreso) && (!nivelActual || l.nivel === nivelActual))).filter(l => labAccesible(l, curso, estP)).slice(0, 2);

  const repasoCard = el('article', { class: 'card' },
    el('h3', {}, 'Repaso de hoy'),
    r.hoy ? el('div', { class: 'count' }, String(r.hoy)) : null,
    el('p', { class: 'small muted' }, r.hoy ? `${r.hoy === 1 ? 'pregunta fallada te toca' : 'preguntas falladas te tocan'} hoy.` : r.total ? `Nada para hoy. ${r.dominadas} de ${r.total} preguntas dominadas.` : 'Las preguntas que falles aparecerán aquí para repasarlas.'),
    el('a', { class: 'btn ' + (r.hoy ? 'btn-primary' : 'btn-ghost') + ' btn-sm', href: 'repaso.html' }, r.hoy ? 'Repasar ahora' : 'Ver mi repaso'));
  const practicasCard = el('article', { class: 'card' },
    el('h3', {}, pendientes.length ? 'Prácticas pendientes' : 'Prácticas recomendadas'),
    sugeridas.length ? el('ul', {}, sugeridas.map(p => el('li', {}, el('a', { href: 'laboratorio.html?l=' + p.clave }, (p.grupo === 'averias' ? '🔧 ' : p.grupo === 'proyectos' ? '🏗️ ' : '') + p.titulo), p.leccion ? el('small', {}, 'De la lección «' + p.leccion.titulo + '»') : el('small', {}, NIVEL_INFO.find(n => n.clave === p.nivel)?.titulo || '')))) : el('p', { class: 'small muted' }, '¡Tienes todas las prácticas al día!'),
    el('a', { class: 'small', href: 'practica.html#area-' + area }, 'Ver todas las prácticas →'));
  const temasCard = el('article', { class: 'card' },
    el('h3', {}, 'Temas a reforzar'),
    temas.length ? el('ul', {}, temas.map(t => el('li', {}, el('a', { href: 'repaso.html?leccion=' + t.leccion.id }, t.leccion.titulo),
      el('small', {}, [t.enRepaso ? `${t.enRepaso} en repaso` : null, t.suspendido ? `cuestionario ${t.nota.puntos}/${t.nota.total}` : null].filter(Boolean).join(' · '))))) : el('p', { class: 'small muted' }, 'Ningún tema flojo por ahora. Cuando falles preguntas o suspendas un cuestionario, te diremos qué repasar.'));
  $('#continua').replaceChildren(repasoCard, practicasCard, temasCard);
}
function siguienteNivel() {
  const l = ruta().find(x => !leccionHecha(x.id));
  return l ? NIVEL_INFO[l.nivel - 1].clave : null;
}

$('#vistas').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b || b.dataset.vista === vista) return;
  vista = b.dataset.vista;
  local.set('aula:panel:vista', vista);
  abiertos.clear();
  pintar();
});

if (usuario) {
  $('#saludo').textContent = `Hola, ${usuario.nombre || usuario.email.split('@')[0]}`;
} else if (cuentasActivas()) {
  $('#avisoCuenta').replaceChildren(el('div', { class: 'alert alert-info mb' }, el('p', {}, 'Estás como invitado: tu progreso se guarda solo en este navegador. Crea una cuenta gratuita para no perderlo y seguir en cualquier dispositivo.'), el('a', { class: 'btn btn-primary btn-sm', href: 'cuenta.html?siguiente=curso.html' }, 'Crear cuenta')));
}
await cargar();
pintar();
alCambiar(pintar);
if (curso) montarReto($('#retoDia'), { curso, leccionHecha });

// Guía de primeros pasos: una lista que se marca sola con lo que el alumno va haciendo. Sin tutoriales: cada paso
// lleva directamente a donde se hace. Desaparece al completarla o si el alumno la oculta.
function pintarGuia() {
  const OBJETIVOS = [
    ['redes', '🌐', 'Redes', 'Cómo funciona Internet, routers, switches, VLAN y el CCNA'],
    ['ti', '🏢', 'Conseguir empleo en TI', 'Soporte técnico, mesa de ayuda y casos reales de empresa'],
    ['prog', '💻', 'Programación', 'Python y JavaScript desde cero, ejecutando código aquí mismo'],
    ['bd', '🗄️', 'Bases de datos', 'SQL de verdad en tu navegador, de cero a profesional'],
  ];
  const caja = $('#primerosPasos');
  if (!caja || !curso) return;
  if (local.get('aula:guia:oculta', false)) { caja.hidden = true; return; }
  const items = Object.keys(exportar().items || {});
  const hay = pref => items.some(k => k.startsWith(pref) && !k.startsWith('quiz:reto-'));
  const eligio = !!local.get('aula:guia:area', '') || hay('leccion:');
  const primera = ruta()[0];
  const pasos = [
    { ok: eligio, titulo: 'Elige qué quieres aprender', texto: 'Puedes cambiar de área cuando quieras con las pestañas de arriba.' },
    { ok: hay('leccion:'), titulo: 'Haz tu primera lección', texto: 'Lecciones cortas, con ejemplos, animaciones y videos.', accion: primera && ['Empezar la primera lección', 'leccion.html?id=' + primera.id] },
    { ok: hay('quiz:'), titulo: 'Responde un cuestionario', texto: 'Está al final de cada lección. Con un 80 % o más la lección se completa y se abre la siguiente.' },
    { ok: CATALOGO.some(l => labHecho(l.progreso)), titulo: 'Practica en un laboratorio', texto: 'Ejercicios que se corrigen solos: consola, SQL, código o casos de soporte.', accion: ['Ver las prácticas', 'practica.html#area-' + area] },
  ];
  if (cuentasActivas()) pasos.push({ ok: !!usuario, titulo: 'Guarda tu progreso con una cuenta', texto: 'Es gratis y te permite seguir desde el celular o la computadora.', accion: ['Crear mi cuenta', 'cuenta.html'] });
  const hechos = pasos.filter(p => p.ok).length;
  if (hechos === pasos.length) { caja.hidden = true; return; }
  const actual = pasos.findIndex(p => !p.ok);
  const ocultar = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Ocultar guía');
  ocultar.addEventListener('click', () => { local.set('aula:guia:oculta', true); caja.hidden = true; });
  const meter = el('div', { class: 'meter' }, el('span'));
  setMeter(meter, hechos / pasos.length);
  caja.hidden = false;
  caja.replaceChildren(
    el('div', { class: 'guide-head' }, el('div', {}, el('span', { class: 'eyebrow' }, hechos ? `Primeros pasos · ${hechos} de ${pasos.length}` : 'Bienvenido a Loopback'), el('h2', {}, hechos ? 'Sigue así, vas muy bien' : 'Empieza en 1 minuto')), ocultar),
    meter,
    el('ol', { class: 'guide-steps' }, pasos.map((p, i) => el('li', { class: p.ok ? 'done' : i === actual ? 'now' : '' },
      el('span', { class: 'guide-num', 'aria-hidden': 'true' }, p.ok ? '✓' : String(i + 1)),
      el('div', {}, el('strong', {}, p.titulo), el('span', { class: 'small muted' }, p.ok ? ' · hecho' : ''), i === actual ? el('p', { class: 'small muted' }, p.texto) : null,
        i === actual && i === 0 ? el('div', { class: 'goal-grid' }, OBJETIVOS.map(([id, ico, nombre, desc]) => {
          const b = el('button', { type: 'button', class: 'goal' + (id === area ? ' sel' : '') }, el('span', { class: 'goal-ico', 'aria-hidden': 'true' }, ico), el('strong', {}, nombre), el('span', { class: 'small muted' }, desc));
          b.addEventListener('click', () => { local.set('aula:guia:area', id); elegirArea(id); });
          return b;
        })) : null,
        i === actual && p.accion ? el('a', { class: 'btn btn-primary btn-sm', href: p.accion[1] }, p.accion[0] + ' →') : null)))));
}
