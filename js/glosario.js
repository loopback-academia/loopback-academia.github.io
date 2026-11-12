// Glosario emergente: marca la primera aparición de cada término en una lección y muestra su definición
// al pasar el ratón, al tocarlo o al enfocarlo con el teclado. Los términos están en contenido/glosario.md.
import { el } from './core.js';

let datos = null;
export const cargarGlosario = () => datos || (datos = fetch('data/glosario.json').then(r => r.json()).catch(() => []));
export const slug = t => 't-' + t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Siglas cortas en mayúsculas (AP, AD, DNS) distinguen mayúsculas; el resto, no.
const sensible = f => f.length <= 5 && f === f.toUpperCase() && /[A-Z]/.test(f);
const escapar = f => f.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const BORDE_I = '(?<![\\p{L}\\p{N}])', BORDE_D = '(?![\\p{L}\\p{N}])';

// Términos que se marcan en una lección de un área: los suyos y, en Empleo TI, también los de redes.
export const terminosDeArea = (terminos, area) => terminos.filter(t => t.area === area || (area === 'ti' && t.area === 'redes'));

export function crearBuscadorTerminos(terminos) {
  const formas = terminos.flatMap((t, i) => t.formas.map(f => ({ f, i }))).sort((a, b) => b.f.length - a.f.length);
  const patron = lista => lista.length ? new RegExp(BORDE_I + '(' + lista.map(x => escapar(x.f)).join('|') + ')' + BORDE_D, lista === sens ? 'gu' : 'giu') : null;
  const sens = formas.filter(x => sensible(x.f)), insens = formas.filter(x => !sensible(x.f));
  const re = [patron(sens), patron(insens)].filter(Boolean);
  const indice = new Map(formas.map(x => [sensible(x.f) ? x.f : x.f.toLowerCase(), x.i]));
  // Devuelve la primera coincidencia de un término todavía no usado: { inicio, fin, termino }.
  return (texto, usados) => {
    let mejor = null;
    for (const r of re) {
      r.lastIndex = 0;
      let m;
      while ((m = r.exec(texto))) {
        const i = indice.get(m[1]) ?? indice.get(m[1].toLowerCase());
        if (i !== undefined && !usados.has(i)) { if (!mejor || m.index < mejor.inicio) mejor = { inicio: m.index, fin: m.index + m[1].length, termino: i }; break; }
      }
    }
    return mejor;
  };
}

const SALTAR = 'code, pre, a, button, h1, h2, h3, h4, h5, h6, label, input, textarea, select, svg, .quiz, form, .embed, .lab, .callout-title, .term, .anim, .video, .terminal, table thead';

export function marcarTerminos(raiz, terminos, max = 30) {
  if (!terminos.length) return 0;
  const buscar = crearBuscadorTerminos(terminos);
  const usados = new Set();
  const nodos = [];
  const walker = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.nodeValue.trim() && !n.parentElement.closest(SALTAR) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
  while (walker.nextNode()) nodos.push(walker.currentNode);
  for (let nodo of nodos) {
    let m;
    while (usados.size < max && (m = buscar(nodo.nodeValue, usados))) {
      usados.add(m.termino);
      const t = terminos[m.termino];
      const resto = nodo.splitText(m.inicio);
      const despues = resto.splitText(m.fin - m.inicio);
      const b = el('button', { type: 'button', class: 'term', 'aria-expanded': 'false', dataset: { def: t.d, termino: t.t } }, resto.nodeValue);
      resto.replaceWith(b);
      nodo = despues;
    }
    if (usados.size >= max) break;
  }
  activarVentana(raiz);
  return usados.size;
}

let ventana = null, abierta = null, temporizador = null;
function crearVentana() {
  if (ventana) return ventana;
  ventana = el('div', { class: 'term-pop', role: 'tooltip', id: 'termPop', hidden: true });
  document.body.append(ventana);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrar(); });
  document.addEventListener('click', e => { if (abierta && !e.target.closest('.term, .term-pop')) cerrar(); });
  addEventListener('scroll', () => { if (abierta) colocar(abierta); }, { passive: true });
  addEventListener('resize', () => { if (abierta) colocar(abierta); });
  return ventana;
}
function colocar(b) {
  const r = b.getBoundingClientRect();
  const ancho = Math.min(320, innerWidth - 24);
  ventana.style.width = ancho + 'px';
  ventana.style.left = Math.max(12, Math.min(innerWidth - ancho - 12, r.left + r.width / 2 - ancho / 2)) + scrollX + 'px';
  const alto = ventana.offsetHeight;
  const arriba = r.top - alto - 10 > 0;
  ventana.style.top = (arriba ? r.top - alto - 8 : r.bottom + 8) + scrollY + 'px';
}
function abrir(b) {
  crearVentana();
  if (abierta && abierta !== b) abierta.setAttribute('aria-expanded', 'false');
  abierta = b;
  ventana.replaceChildren(el('strong', {}, b.dataset.termino), el('p', {}, b.dataset.def), el('a', { href: 'glosario.html#' + slug(b.dataset.termino) }, 'Ver en el glosario →'));
  ventana.hidden = false;
  b.setAttribute('aria-expanded', 'true');
  b.setAttribute('aria-describedby', 'termPop');
  colocar(b);
}
function cerrar() {
  clearTimeout(temporizador);
  if (!ventana || !abierta) return;
  ventana.hidden = true;
  abierta.setAttribute('aria-expanded', 'false');
  abierta.removeAttribute('aria-describedby');
  abierta = null;
}
function activarVentana(raiz) {
  if (raiz.dataset.glosario) return;
  raiz.dataset.glosario = '1';
  const puntero = matchMedia('(hover: hover) and (pointer: fine)').matches;
  raiz.addEventListener('click', e => { const b = e.target.closest('.term'); if (!b) return; e.preventDefault(); abierta === b ? cerrar() : abrir(b); });
  raiz.addEventListener('focusin', e => { const b = e.target.closest('.term'); if (b) abrir(b); });
  raiz.addEventListener('focusout', e => { if (e.target.closest('.term') && !e.relatedTarget?.closest?.('.term-pop')) temporizador = setTimeout(cerrar, 150); });
  if (puntero) {
    raiz.addEventListener('pointerover', e => { const b = e.target.closest('.term'); if (!b) return; clearTimeout(temporizador); temporizador = setTimeout(() => abrir(b), 250); });
    raiz.addEventListener('pointerout', e => { if (e.target.closest('.term') && !e.relatedTarget?.closest?.('.term-pop, .term')) { clearTimeout(temporizador); temporizador = setTimeout(cerrar, 250); } });
  }
}
