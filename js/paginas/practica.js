// Índice de laboratorios por área (Redes, Bases de datos, Programación), con su estado y filtro por nivel.
import { iniciarPagina, el, $, $$, local } from '../core.js';
import { CATALOGO, NIVELES } from '../labs/catalogo.js';
import { cargar, alCambiar, labHecho } from '../progreso.js';
import { cargarCurso } from '../curso.js';
import { labAccesible, leccionDeLab } from '../escalera.js';
import { estadoArea } from '../escalera-alumno.js';

iniciarPagina();
const [curso] = await Promise.all([cargarCurso(), cargar()]);
let nivel = local.get('aula:practica:nivel', '');
const pedida = (location.hash.match(/^#area-(redes|bd|prog|ti|en|sec)$/) || [])[1];
let area = pedida || local.get('aula:practica:area', 'redes');

function tarjeta(l) {
  // Las prácticas se abren con su lección de la escalera: no se puede saltar a lo que aún no has estudiado.
  if (!labAccesible(l, curso, estadoArea(curso, l.area))) {
    const lec = leccionDeLab(l, curso);
    return el('div', { class: 'card lab-card locked', 'aria-disabled': 'true' },
      el('div', { class: 'lab-card-head' }, el('h3', {}, l.titulo), el('span', { class: 'badge' }, '🔒 Cerrada')),
      l.nivel ? el('span', { class: 'badge level-' + l.nivel }, NIVELES[l.nivel]) : null,
      el('p', { class: 'muted small' }, lec ? `Se abre al llegar a la lección «${lec.titulo}» en la escalera.` : 'Se abre al llegar a su nivel en la escalera.'));
  }
  return el('a', { class: 'card lab-card', href: 'laboratorio.html?l=' + l.clave },
    el('div', { class: 'lab-card-head' }, el('h3', {}, l.titulo), labHecho(l.progreso) ? el('span', { class: 'badge badge-ok' }, '✓ Hecho') : l.tareas ? el('span', { class: 'badge' }, l.tareas + ' ' + (l.unidad || (l.grupo === 'proyectos' ? 'requisitos' : l.area === 'redes' ? 'tareas' : 'ejercicios'))) : null),
    l.nivel ? el('span', { class: 'badge level-' + l.nivel }, NIVELES[l.nivel]) : null,
    el('p', { class: 'muted small' }, l.texto));
}
function pintar() {
  $$('#filtroNivel button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.nivel === nivel)));
  $$('#filtroArea button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.area === area)));
  $$('.area-section').forEach(s => { s.hidden = s.dataset.area !== area; });
  for (const caja of $$(`#area-${area} [data-grupo]`)) {
    const labs = CATALOGO.filter(l => l.area === area && l.grupo === caja.dataset.grupo && (!nivel || l.nivel === nivel));
    caja.replaceChildren(...(labs.length ? labs.map(tarjeta) : [el('p', { class: 'muted small' }, 'No hay laboratorios de este nivel en esta sección.')]));
  }
}
$('#filtroNivel').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  nivel = b.dataset.nivel;
  local.set('aula:practica:nivel', nivel);
  pintar();
});
$('#filtroArea').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  area = b.dataset.area;
  local.set('aula:practica:area', area);
  history.replaceState(null, '', '#area-' + area);
  pintar();
});
pintar();
alCambiar(pintar);
