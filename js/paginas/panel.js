// Panel del curso: progreso global, "continuar donde lo dejaste" y el temario en dos vistas:
// ruta por niveles (principiante → intermedio → avanzado) o por módulos del CCNA.
import { iniciarPagina, el, $, $$, setMeter, plural, pct, local } from '../core.js';
import { cuentasActivas } from '../auth.js';
import { CONFIG } from '../config.js';
import { cargarCurso, numeroModulo } from '../curso.js';
import { CATALOGO } from '../labs/catalogo.js';
import { practicasPendientes, temasAReforzar, resumenRepaso } from '../recomendaciones.js';
import { cargar, alCambiar, leccionHecha, notaQuiz, labHecho, examenes, racha, exportar } from '../progreso.js';

const usuario = await iniciarPagina();
const curso = await cargarCurso().catch(() => null);
const abiertos = new Set();
let vista = local.get('aula:panel:vista', 'niveles');
const pedida = new URLSearchParams(location.search).get('area');
let area = ['redes', 'bd', 'prog', 'ti'].includes(pedida) ? pedida : local.get('aula:panel:area', 'redes');

const TEXTOS = {
  redes: ['Los cimientos: qué es una red, cómo viajan los datos (OSI, Ethernet, ARP), direcciones IP, tus primeros comandos en un Cisco y las VLAN.',
    'Ya configuras redes: subnetting, trunks, enrutamiento entre VLAN, rutas estáticas, DHCP, NAT, SSH, ACL y resolución de averías.',
    'Nivel de empleo y de examen: OSPF, EtherChannel, redundancia, seguridad de capa 2, IPv6, QoS, wireless y automatización.'],
  bd: ['Qué es una base de datos, el modelo relacional, los tipos de datos y tus primeras consultas SQL.',
    'SQL a fondo: JOIN, agregados, subconsultas, funciones, modificar datos, crear tablas y diseñar bien una base de datos.',
    'Como un profesional: índices y rendimiento, transacciones, seguridad, copias, NoSQL, escalado y administración.'],
  prog: ['Programar desde cero: variables, condiciones, bucles, funciones, listas y cómo pensar un algoritmo.',
    'Los lenguajes más usados y las herramientas del día a día: Git, depuración, errores, archivos, JSON, APIs y POO.',
    'Nivel profesional: algoritmos y estructuras de datos, pruebas, código seguro, arquitectura, web, automatización de redes y tu carrera.'],
  ti: ['Lo básico del trabajo de soporte: método de diagnóstico, Windows, programas, acceso remoto, tickets y atención al usuario.',
    'Casos de oficinas, tiendas, almacenes y sucursales: impresoras de etiquetas, sucursales sin conexión, ingresos de personal y el turno de mesa de ayuda.',
    'Mejora continua: gestión de problemas, causa raíz y base de conocimiento.'],
};
const NIVEL_INFO = [1, 2, 3].map(n => ({ n, clave: ['principiante', 'intermedio', 'avanzado'][n - 1], titulo: ['Nivel 1 · Principiante', 'Nivel 2 · Intermedio', 'Nivel 3 · Avanzado'][n - 1] }));
// Orden de la ruta: primero todo el nivel 1, luego el 2 y luego el 3 (dentro de cada nivel, en el orden del temario).
const delArea = () => curso.lecciones.filter(l => l.modulo.area === area);
const ruta = () => [...delArea()].sort((a, b) => a.nivel - b.nivel);

function check(hecho, medio) { return el('span', { class: 'check' + (hecho ? ' on' : medio ? ' half' : ''), 'aria-hidden': 'true' }, '✓'); }
function filaLeccion(l, conModulo) {
  const q = notaQuiz(l.id);
  return el('li', {}, el('a', { class: 'lesson-link', href: 'leccion.html?id=' + l.id },
    check(leccionHecha(l.id), q),
    el('span', {}, l.titulo, conModulo ? el('span', { class: 'lesson-mod' }, ` · M${numeroModulo(l.modulo)}`) : null),
    el('span', { class: 'small muted' }, q ? `${q.puntos}/${q.total}` : l.minutos + ' min')));
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
  $('a[href^="examen.html"]', $('.dashboard'))?.setAttribute('href', 'examen.html?area=' + area);
  const ex = examenes();
  $('#stExamen').textContent = ex.length ? Math.max(...ex.map(e => pct(e.puntos, e.total))) + ' %' : '—';
  setMeter($('#meterTotal'), hechas / todas.length);
  $('#pctTotal').textContent = `Has completado el ${pct(hechas, todas.length)} % de esta área.`;
  $$('#vistas button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.vista === vista)));

  const siguiente = (vista === 'niveles' ? ruta() : todas).find(l => !leccionHecha(l.id));
  const cont = $('#continuar');
  cont.hidden = false;
  cont.replaceChildren(...(siguiente
    ? [el('div', {}, el('span', { class: 'eyebrow' }, hechas ? 'Continúa donde lo dejaste' : 'Empieza por aquí'), el('h2', {}, siguiente.titulo),
        el('p', { class: 'muted small' }, `${NIVEL_INFO[siguiente.nivel - 1].titulo} · Módulo ${numeroModulo(siguiente.modulo)} · ${siguiente.minutos} min`)),
       el('a', { class: 'btn btn-primary btn-lg', href: 'leccion.html?id=' + siguiente.id }, hechas ? 'Continuar' : 'Empezar')]
    : [el('div', {}, el('span', { class: 'eyebrow' }, '¡Curso completado!'), el('h2', {}, 'Ahora, a por el examen'), el('p', { class: 'muted small' }, 'Haz simulacros de 100 preguntas hasta superar el 85 % de forma constante.')),
       el('a', { class: 'btn btn-primary btn-lg', href: 'examen.html?area=' + area }, 'Simulacro')]));

  pintarContinua();
  pintarGuia();

  if (vista === 'niveles') {
    $('#modulos').replaceChildren(...NIVEL_INFO.map(nv => {
      const lecciones = todas.filter(l => l.nivel === nv.n);
      if (!lecciones.length) return null;
      const labs = CATALOGO.filter(l => l.area === area && l.nivel === nv.clave);
      const extra = el('div', { class: 'level-labs' }, el('p', { class: 'small' }, el('strong', {}, `Prácticas de este nivel (${labs.filter(l => labHecho(l.progreso)).length}/${labs.length} hechas)`)),
        el('ul', { class: 'chips' }, labs.map(l => el('li', {}, el('a', { class: 'chip' + (labHecho(l.progreso) ? ' done' : ''), href: 'laboratorio.html?l=' + l.clave }, (l.grupo === 'averias' ? '🔧 ' : l.grupo === 'casos' ? '🎫 ' : l.area === 'prog' ? '▶ ' : '') + l.titulo)))));
      return bloque(area + 'n' + nv.n, { num: nv.n, titulo: nv.titulo, meta: [plural(labs.length, 'práctica', 'prácticas')], conModulo: true }, TEXTOS[area][nv.n - 1], lecciones, extra, siguiente?.nivel === nv.n);
    }).filter(Boolean));
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
  const sugeridas = pendientes.length ? pendientes : CATALOGO.filter(l => l.area === area && !l.libre && !labHecho(l.progreso) && (!nivelActual || l.nivel === nivelActual)).slice(0, 2);

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
  $('#avisoCuenta').replaceChildren(el('div', { class: 'alert alert-info mb' }, el('p', {}, 'Estás como invitado: tu progreso se guarda solo en este navegador. Crea una cuenta gratuita para no perderlo' + (CONFIG.tutorIA ? ' y usar el tutor con IA.' : ' y seguir en cualquier dispositivo.')), el('a', { class: 'btn btn-primary btn-sm', href: 'cuenta.html?siguiente=curso.html' }, 'Crear cuenta')));
}
await cargar();
pintar();
alCambiar(pintar);

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
  const hay = pref => items.some(k => k.startsWith(pref));
  const eligio = !!local.get('aula:guia:area', '') || hay('leccion:');
  const primera = ruta()[0];
  const pasos = [
    { ok: eligio, titulo: 'Elige qué quieres aprender', texto: 'Puedes cambiar de área cuando quieras con las pestañas de arriba.' },
    { ok: hay('leccion:'), titulo: 'Haz tu primera lección', texto: 'Lecciones cortas, con ejemplos, animaciones y videos.', accion: primera && ['Empezar la primera lección', 'leccion.html?id=' + primera.id] },
    { ok: hay('quiz:'), titulo: 'Responde un cuestionario', texto: 'Está al final de cada lección. Con el 70 % la lección se completa sola.' },
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
