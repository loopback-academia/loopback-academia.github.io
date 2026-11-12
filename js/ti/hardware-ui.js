// Interfaces de hardware: armar un PC ([[pc:oficina]]), averías ([[hw:averias]]) y ordenar pasos ([[orden:instalar-windows]]).
import { el, toast } from '../core.js';
import { guardarLab, labHecho, cargar } from '../progreso.js';
import { CATEGORIAS, PIEZAS, ENCARGOS, validarPc, AVERIAS, evaluarAverias, ORDENES, evaluarOrden } from './hardware.js';

const dinero = n => 'RD$' + n.toLocaleString('es-DO');

export async function montarPc(holder, id) {
  const encargo = ENCARGOS[id];
  if (!encargo) throw new Error('Encargo desconocido: ' + id);
  await cargar();
  const sel = {};
  const resumen = el('div', { class: 'pc-resumen', 'aria-live': 'polite' });
  const resultado = el('div', { 'aria-live': 'polite' });
  const grupos = Object.entries(CATEGORIAS).map(([cat, titulo]) => el('fieldset', { class: 'pc-cat' }, el('legend', {}, titulo),
    PIEZAS[cat].map(p => {
      const r = el('input', { type: 'radio', name: 'pc-' + id + '-' + cat, value: p.id });
      r.addEventListener('change', () => { sel[cat] = p.id; resultado.replaceChildren(); pintarResumen(); });
      return el('label', { class: 'option' }, r, el('span', {}, p.nombre, el('span', { class: 'small muted' }, ' · ' + (p.precio ? dinero(p.precio) : 'sin coste'))));
    })));
  function pintarResumen() {
    const v = validarPc(sel, encargo);
    resumen.replaceChildren(el('strong', {}, `Total: ${dinero(v.total)}`), el('span', { class: 'small muted' }, ` de ${dinero(encargo.presupuesto)} · consumo estimado ${v.consumo} W`));
  }
  const comprobar = el('button', { type: 'button', class: 'btn btn-primary' }, 'Comprobar el equipo');
  comprobar.addEventListener('click', () => {
    const v = validarPc(sel, encargo);
    if (v.ok && !labHecho('pc-' + id)) { guardarLab('pc-' + id); toast('¡Equipo compatible y dentro del encargo!'); }
    resultado.replaceChildren(el('div', { class: 'alert ' + (v.ok ? 'alert-ok' : 'alert-warn') }, v.ok ? el('p', {}, el('strong', {}, '¡Equipo listo! '), `Todo es compatible, cumple el encargo y cuesta ${dinero(v.total)}.`) : el('div', {}, el('p', {}, el('strong', {}, 'Todavía hay problemas:')), el('ul', {}, v.problemas.map(p => el('li', {}, p))))));
  });
  holder.append(el('section', { class: 'lab', 'aria-label': 'Armar un PC' },
    el('div', { class: 'lab-head' }, el('h3', {}, 'Armar un PC: ' + encargo.titulo)),
    el('p', { class: 'alert alert-info' }, el('span', {}, encargo.texto)),
    el('div', { class: 'pc-grid' }, grupos), resumen, el('div', { class: 'hero-cta' }, comprobar), resultado,
    el('p', { class: 'small muted' }, 'Precios orientativos y ficticios. En la vida real, comprueba siempre la lista de compatibilidad del fabricante de la placa.')));
  pintarResumen();
}

export async function montarAverias(holder) {
  await cargar();
  const elecciones = {};
  const final = el('div', { 'aria-live': 'polite' });
  const casos = AVERIAS.map((a, n) => {
    const fb = el('p', { class: 'small feedback', role: 'status' });
    const botones = a.opciones.map(([t, ok, f], k) => {
      const b = el('button', { type: 'button', class: 'btn btn-ghost btn-sm hw-op' }, t);
      b.addEventListener('click', () => {
        elecciones[a.id] = k;
        botones.forEach(x => { x.disabled = true; }); b.classList.add(ok ? 'ok' : 'bad');
        fb.className = 'small feedback ' + (ok ? 'ok' : 'bad'); fb.textContent = (ok ? 'Bien. ' : 'No es lo primero. ') + f;
        if (Object.keys(elecciones).length === AVERIAS.length) {
          const r = evaluarAverias(elecciones);
          if (r.aprobado && !labHecho('hw-averias')) { guardarLab('hw-averias'); toast('Diagnóstico de averías completado.'); }
          final.replaceChildren(el('div', { class: 'alert ' + (r.aprobado ? 'alert-ok' : 'alert-warn') }, el('p', {}, el('strong', {}, `${r.bien} de ${r.total} bien. `), r.aprobado ? 'Buen método: de lo simple a lo complejo y salvando los datos primero.' : 'Necesitas 4 de 5.'),
            el('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: () => { holder.replaceChildren(); montarAverias(holder); } }, 'Repetir')));
        }
      });
      return b;
    });
    return el('article', { class: 'card hw-caso' }, el('p', {}, el('strong', {}, `Caso ${n + 1}. `), a.sintoma), el('p', { class: 'small muted' }, '¿Qué haces primero?'), el('div', { class: 'hw-ops' }, botones), fb);
  });
  holder.append(el('section', { class: 'lab', 'aria-label': 'Averías de hardware' }, el('div', { class: 'lab-head' }, el('h3', {}, 'Diagnosticar averías de hardware')), ...casos, final));
}

export async function montarOrden(holder, id) {
  const o = ORDENES[id];
  if (!o) throw new Error('Procedimiento desconocido: ' + id);
  await cargar();
  let orden = [...o.pasos].sort(() => Math.random() - 0.5);
  if (orden.every((p, i) => p === o.pasos[i])) orden.reverse();
  const lista = el('ol', { class: 'orden-lista' });
  const fb = el('div', { 'aria-live': 'polite' });
  function pintar() {
    lista.replaceChildren(...orden.map((p, i) => {
      const subir = el('button', { type: 'button', class: 'btn btn-quiet btn-sm', 'aria-label': 'Subir: ' + p, disabled: i === 0 }, '↑');
      const bajar = el('button', { type: 'button', class: 'btn btn-quiet btn-sm', 'aria-label': 'Bajar: ' + p, disabled: i === orden.length - 1 }, '↓');
      subir.addEventListener('click', () => { [orden[i - 1], orden[i]] = [orden[i], orden[i - 1]]; pintar(); lista.querySelectorAll('li')[i - 1]?.querySelector('button')?.focus(); });
      bajar.addEventListener('click', () => { [orden[i + 1], orden[i]] = [orden[i], orden[i + 1]]; pintar(); lista.querySelectorAll('li')[i + 1]?.querySelectorAll('button')[1]?.focus(); });
      return el('li', {}, el('span', {}, p), el('span', { class: 'orden-botones' }, subir, bajar));
    }));
  }
  const comprobar = el('button', { type: 'button', class: 'btn btn-primary' }, 'Comprobar el orden');
  comprobar.addEventListener('click', () => {
    const r = evaluarOrden(id, orden);
    if (r.ok && !labHecho('orden-' + id)) { guardarLab('orden-' + id); toast('¡Procedimiento en el orden correcto!'); }
    fb.replaceChildren(el('p', { class: 'feedback ' + (r.ok ? 'ok' : 'bad') }, r.ok ? '¡Correcto! Ese es el orden profesional.' : `${r.bien} de ${r.total} pasos están en su sitio. Piensa qué necesita cada paso para poder hacerse.`));
  });
  holder.append(el('section', { class: 'lab', 'aria-label': o.titulo }, el('div', { class: 'lab-head' }, el('h3', {}, 'Ordena los pasos: ' + o.titulo)),
    el('p', { class: 'small muted' }, 'Usa las flechas para poner los pasos en el orden en que los harías.'), lista, el('div', { class: 'hero-cta' }, comprobar), fb));
  pintar();
}
