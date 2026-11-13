// Página del glosario: búsqueda, filtro por área y anclas por término (glosario.html#t-vlan).
import { iniciarPagina, el, $, $$ } from '../core.js';
import { cargarGlosario, slug } from '../glosario.js';

iniciarPagina();
const terminos = await cargarGlosario();
const AREA = { base: 'Empieza aquí', redes: 'Redes', bd: 'Bases de datos', prog: 'Programación', ti: 'Empleo TI', en: 'Inglés técnico', sec: 'Ciberseguridad' };
let area = '';
const sinTildes = t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function pintar() {
  const q = sinTildes($('#buscarTermino').value.trim());
  const lista = terminos.filter(t => (!area || t.area === area) && (!q || sinTildes(t.formas.join(' ') + ' ' + t.d).includes(q)));
  $('#cuentaGlosario').textContent = `${lista.length} ${lista.length === 1 ? 'término' : 'términos'}`;
  const grupos = new Map();
  for (const t of lista) { const l = sinTildes(t.t[0]).toUpperCase(); if (!grupos.has(l)) grupos.set(l, []); grupos.get(l).push(t); }
  $('#glosario').replaceChildren(...(lista.length ? [...grupos].map(([letra, ts]) => el('section', { class: 'glosario-letra' }, el('h2', {}, letra),
    el('dl', {}, ts.map(t => [el('dt', { id: slug(t.t) }, t.t, t.formas.length > 1 ? el('span', { class: 'small muted' }, ' · ' + t.formas.slice(1).join(', ')) : null, ' ', el('span', { class: 'badge' }, AREA[t.area])), el('dd', {}, t.d)])))) : [el('p', { class: 'muted' }, 'No hay ningún término con esa búsqueda.')]));
}
$('#buscarTermino').addEventListener('input', pintar);
$('#filtroGlosario').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  area = b.dataset.area;
  $$('#filtroGlosario button').forEach(x => x.setAttribute('aria-selected', String(x === b)));
  pintar();
});
pintar();
if (location.hash) { const d = document.getElementById(location.hash.slice(1)); if (d) { d.classList.add('resaltado'); d.scrollIntoView({ block: 'center' }); } }
