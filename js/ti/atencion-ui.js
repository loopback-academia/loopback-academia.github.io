// Simulador de atención al usuario: conversación tipo chat con opciones de respuesta y valoración al final.
import { el, toast } from '../core.js';
import { guardarLab, labHecho, cargar } from '../progreso.js';
import { CONVERSACIONES, DIMENSIONES, evaluarConversacion, caraDe } from './atencion.js';

export async function montarAtencion(holder, id) {
  const c = CONVERSACIONES[id];
  if (!c) throw new Error('Conversación desconocida: ' + id);
  await cargar();
  const chat = el('div', { class: 'chat', role: 'log', 'aria-live': 'polite' });
  const opciones = el('div', { class: 'chat-opciones' });
  const cara = el('span', { class: 'chat-cara', title: 'Ánimo del usuario', 'aria-label': 'Ánimo del usuario' });
  const final = el('div', { 'aria-live': 'polite' });
  let elecciones = [], animo = c.animoInicial;
  const burbuja = (quien, texto, cls = '') => { chat.append(el('div', { class: `chat-msg ${quien} ${cls}` }, el('span', { class: 'chat-quien' }, quien === 'usuario' ? c.usuario.split(',')[0] : 'Tú (soporte)'), el('p', {}, texto))); chat.scrollTop = chat.scrollHeight; };

  function paso() {
    const i = elecciones.length;
    cara.textContent = caraDe(animo);
    if (i === c.pasos.length) return terminar();
    burbuja('usuario', c.pasos[i].msg);
    // El orden de las opciones se baraja para que la buena no esté siempre en el mismo sitio.
    const orden = c.pasos[i].opciones.map((o, k) => k).sort(() => Math.random() - 0.5);
    opciones.replaceChildren(el('p', { class: 'small muted' }, '¿Qué respondes?'), ...orden.map(k => {
      const b = el('button', { type: 'button', class: 'btn btn-ghost chat-opcion' }, c.pasos[i].opciones[k].t);
      b.addEventListener('click', () => {
        const o = c.pasos[i].opciones[k];
        elecciones.push(k); animo = Math.max(-3, Math.min(3, animo + o.animo));
        burbuja('tu', o.t);
        chat.append(el('p', { class: 'chat-nota small ' + (o.animo > 0 ? 'ok' : o.animo < 0 ? 'bad' : '') }, (o.animo > 0 ? '👍 ' : o.animo < 0 ? '👎 ' : '➖ ') + o.f));
        opciones.replaceChildren();
        setTimeout(paso, 350);
      });
      return b;
    }));
  }
  function terminar() {
    const r = evaluarConversacion(c, elecciones);
    cara.textContent = caraDe(r.animo);
    if (r.aprobado && !labHecho('atencion-' + id)) { guardarLab('atencion-' + id); toast('Conversación superada.'); }
    final.replaceChildren(el('div', { class: 'alert ' + (r.aprobado ? 'alert-ok' : 'alert-warn') },
      el('p', {}, el('strong', {}, `${r.pct} % · ${r.aprobado ? '¡Buena atención!' : 'Necesitas un 75 %. Repite y prueba otras respuestas.'}`)),
      el('ul', { class: 'small' }, Object.entries(r.dims).filter(([, v]) => v.max).map(([k, v]) => el('li', {}, `${DIMENSIONES[k]}: ${v.p}/${v.max}`))),
      el('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: () => { elecciones = []; animo = c.animoInicial; chat.replaceChildren(); final.replaceChildren(); paso(); } }, 'Repetir la conversación')));
  }
  holder.append(el('section', { class: 'lab', 'aria-label': 'Simulador de atención al usuario' },
    el('div', { class: 'lab-head' }, el('h3', {}, 'Atención al usuario: ' + c.titulo), cara),
    el('p', { class: 'muted small' }, `${c.canal} con ${c.usuario}. Elige la mejor respuesta en cada momento: cuenta la empatía, la claridad, la solución y el cierre.`),
    chat, opciones, final));
  paso();
}
