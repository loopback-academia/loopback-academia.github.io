// Listas de pasos para marcar (instalar programas, preparar el laboratorio en casa). Lo marcado se recuerda en este
// navegador y, al completar la lista, queda guardado en el progreso del alumno.
import { el, toast, local } from '../core.js';
import { guardarLab, labHecho, cargar } from '../progreso.js';

export const LISTAS = {
  'pt-instalar': {
    titulo: 'Mi Packet Tracer, paso a paso',
    texto: 'Marca cada paso cuando lo hayas hecho. Si un día lo dejas a medias, al volver verás por dónde ibas.',
    pasos: [
      { t: 'He creado mi cuenta gratuita en Cisco Networking Academy y he confirmado el correo.', enlace: ['https://www.netacad.com/', 'Abrir netacad.com'] },
      { t: 'Me he inscrito en el curso gratuito «Getting Started with Cisco Packet Tracer».', enlace: ['https://www.netacad.com/cisco-packet-tracer', 'Página oficial de Packet Tracer'] },
      { t: 'He descargado el instalador para mi sistema (Windows, macOS o Ubuntu).' },
      { t: 'Lo he instalado y abierto por primera vez.' },
      { t: 'He iniciado sesión en Packet Tracer con mi cuenta de Networking Academy.' },
      { t: 'He montado mi primera red: un switch, dos PC conectados y ping entre ellos con respuesta (Reply).' },
      { t: 'He configurado el nombre del switch desde la pestaña CLI (hostname), como en el simulador de la web.' },
    ],
  },
};

export async function montarLista(holder, id) {
  const lista = LISTAS[id];
  if (!lista) throw new Error('Lista desconocida: ' + id);
  await cargar();
  const clave = 'aula:lista:' + id;
  let marcados = new Set(local.get(clave) || []);
  const caja = el('section', { class: 'juego lista-pasos', 'aria-label': lista.titulo });

  function pintar() {
    const n = lista.pasos.filter((_, i) => marcados.has(i)).length;
    const barra = el('div', { class: 'guia-barra', 'aria-hidden': 'true' }, el('span'));
    barra.firstChild.style.setProperty('--p', String(n / lista.pasos.length));
    caja.replaceChildren(...[
      el('div', { class: 'ficha-cab' }, el('h3', {}, '✅ ' + lista.titulo), el('span', { class: 'badge' + (n === lista.pasos.length ? ' badge-ok' : '') }, `${n} / ${lista.pasos.length}`)),
      el('p', { class: 'muted' }, lista.texto),
      barra,
      el('ol', { class: 'lista-ol' }, ...lista.pasos.map((p, i) => {
        const cb = el('input', { type: 'checkbox', id: `${id}-${i}`, checked: marcados.has(i) });
        cb.addEventListener('change', () => {
          if (cb.checked) marcados.add(i); else marcados.delete(i);
          local.set(clave, [...marcados]);
          if (marcados.size === lista.pasos.length && !labHecho('lista-' + id)) { guardarLab('lista-' + id); toast('🎉 ¡Lista completada! Ya tienes tu laboratorio en casa.'); }
          pintar();
          caja.querySelector('#' + CSS.escape(`${id}-${i}`))?.focus();
        });
        return el('li', { class: marcados.has(i) ? 'hecho' : null },
          el('label', { for: `${id}-${i}` }, cb, el('span', {}, p.t)),
          p.enlace ? el('a', { href: p.enlace[0], target: '_blank', rel: 'noopener noreferrer', class: 'small' }, p.enlace[1] + ' ↗') : null);
      })),
      n === lista.pasos.length ? el('p', { class: 'juego-msg ok' }, '🎉 ¡Todo listo! Desde ahora, repite cada laboratorio del curso también en tu Packet Tracer.') : null,
    ].filter(Boolean));
  }
  holder.append(caja);
  pintar();
}
