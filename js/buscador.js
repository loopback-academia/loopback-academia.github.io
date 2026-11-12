// Buscador del curso: escribes una duda con tus palabras y muestra las lecciones donde se explica, con un extracto.
// Funciona sin servidor: busca en data/buscar.json. Se usa como panel flotante en las lecciones y a página completa.
import { el } from './core.js';

let indice = null;
const fold = s => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const VACIAS = new Set('el la los las un una unos unas de del al a en y o u que es son por para con sin como qué cual cuál cómo se lo le les mi tu su sus me te nos más muy ya hay este esta esto eso ese entre sobre cuando donde dónde porque pero si no'.split(' '));
const palabras = t => fold(t).split(/[^a-z0-9.\/-]+/).filter(w => w.length > 2 && !VACIAS.has(w));

export async function buscarEnCurso(pregunta, n = 3) {
  if (!indice) indice = fetch('data/buscar.json').then(r => r.json()).then(lista => lista.map(l => ({ ...l, bolsa: fold(l.titulo + ' ' + l.texto) })));
  const lista = await indice;
  const q = [...new Set(palabras(pregunta))];
  if (!q.length) return [];
  return lista.map(l => {
    let p = 0;
    for (const w of q) { if (fold(l.titulo).includes(w)) p += 5; p += Math.min(l.bolsa.split(w).length - 1, 6); }
    return { l, p };
  }).filter(x => x.p > 2).sort((a, b) => b.p - a.p).slice(0, n).map(x => x.l);
}

// El trozo del texto con más palabras de la pregunta.
function extracto(texto, pregunta, max) {
  if (texto.length <= max) return texto;
  const q = palabras(pregunta);
  const f = fold(texto);
  let pos = 0, mejor = 0;
  for (const w of q) {
    for (let i = f.indexOf(w); i >= 0; i = f.indexOf(w, i + 1)) {
      const ventana = f.slice(i, i + Math.max(120, max / 2));
      const n = q.filter(x => ventana.includes(x)).length;
      if (n > mejor || (n === mejor && i < pos)) { mejor = n; pos = i; }
    }
  }
  const ini = Math.max(0, pos - Math.floor(max / 3));
  return (ini ? '…' : '') + texto.slice(ini, ini + max) + '…';
}

const SUGERENCIAS = ['¿Cómo se calcula una subred?', 'VLAN nativa en un trunk', '¿Qué es un JOIN?', 'Cómo priorizar un ticket'];

// opciones: { leccion: {id} (para dar prioridad a la lección actual), paginaCompleta }
export function crearBuscador({ leccion = null, paginaCompleta = false } = {}) {
  const resultados = el('div', { class: 'tutor-messages', role: 'log', 'aria-live': 'polite', 'aria-label': 'Resultados de la búsqueda' });
  const entrada = el('textarea', { rows: 2, placeholder: 'Escribe tu duda, por ejemplo: ¿qué es la VLAN nativa?', 'aria-label': 'Tu duda', maxlength: 500 });
  const form = el('form', { class: 'tutor-form', novalidate: true }, entrada, el('button', { type: 'submit', class: 'btn btn-primary' }, 'Buscar'));
  const limpiar = el('button', { type: 'button', class: 'btn btn-quiet btn-sm', title: 'Limpiar la búsqueda' }, 'Limpiar');
  const cerrar = el('button', { type: 'button', class: 'btn btn-quiet btn-sm', 'aria-label': 'Cerrar el buscador' }, '✕');
  const titulo = el('h2', { id: 'tutorTitle' }, 'Buscar en el curso');
  titulo.style.flex = '1';
  const head = el('div', { class: 'tutor-head' }, titulo, limpiar, paginaCompleta ? null : cerrar);
  const panel = paginaCompleta
    ? el('section', { class: 'tutor-page', 'aria-labelledby': 'tutorTitle' }, head, resultados, form)
    : el('aside', { class: 'tutor-panel', 'aria-labelledby': 'tutorTitle', 'data-closed': '', role: 'dialog', 'aria-modal': 'false' }, head, resultados, form);

  function bienvenida() {
    resultados.replaceChildren(el('div', { class: 'msg msg-ai' }, el('p', {}, 'Escribe una duda con tus palabras y te muestro las lecciones del curso donde se explica.')),
      el('div', { class: 'suggestions' }, SUGERENCIAS.map(s => el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => { entrada.value = s; form.requestSubmit(); } }, s))));
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const pregunta = entrada.value.trim();
    if (!pregunta) return;
    resultados.querySelector('.suggestions')?.remove();
    resultados.append(el('div', { class: 'msg msg-user' }, pregunta));
    entrada.value = '';
    const rel = await buscarEnCurso(pregunta, 5);
    const orden = leccion && rel.some(l => l.id === leccion.id) ? [rel.find(l => l.id === leccion.id), ...rel.filter(l => l.id !== leccion.id)] : rel;
    resultados.append(rel.length
      ? el('div', { class: 'msg msg-ai' }, el('p', {}, rel.length === 1 ? 'Esto lo explica esta lección:' : 'Esto lo explican estas lecciones:'),
          el('ul', { class: 'search-results' }, orden.map(l => el('li', {}, el('a', { href: 'leccion.html?id=' + l.id }, l.titulo), el('p', { class: 'small muted' }, extracto(l.texto, pregunta, 220))))))
      : el('div', { class: 'msg msg-ai' }, el('p', {}, 'No encontré esa duda en el curso. Prueba con otras palabras o con el nombre del tema (por ejemplo «NAT», «JOIN» o «subnetting»).')));
    resultados.scrollTop = resultados.scrollHeight;
    entrada.focus();
  });
  entrada.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
  limpiar.addEventListener('click', bienvenida);

  let boton = null;
  const abrir = () => { panel.removeAttribute('data-closed'); entrada.focus({ preventScroll: true }); };
  const cerrarPanel = () => { panel.setAttribute('data-closed', ''); boton?.focus(); };
  cerrar.addEventListener('click', cerrarPanel);
  panel.addEventListener('keydown', e => { if (e.key === 'Escape' && !paginaCompleta) cerrarPanel(); });
  if (!paginaCompleta) {
    boton = el('button', { type: 'button', class: 'btn btn-primary tutor-fab', 'aria-haspopup': 'dialog' }, '🔎 Buscar en el curso');
    boton.addEventListener('click', abrir);
    document.body.append(boton, panel);
  }
  bienvenida();
  return { panel, abrir };
}
