// Visor de capturas: barra de filtro, lista de paquetes, detalle por capas y preguntas de diagnóstico.
import { el, toast } from '../core.js';
import { guardarLab, labHecho, cargar } from '../progreso.js';
import { CAPTURAS, fila, detalle, filtrar, corregirPregunta } from './capturas.js';

const COLOR = { ARP: 'arp', DHCP: 'dhcp', DNS: 'dns', HTTP: 'http', 'TLSv1.3': 'tls', ICMP: 'icmp', TCP: 'tcp' };

export async function montarCaptura(holder, id) {
  const cap = CAPTURAS[id];
  if (!cap) throw new Error('Captura desconocida: ' + id);
  await cargar();
  let sel = cap.paquetes[0].n;
  const filtro = el('input', { type: 'text', class: 'mono cap-filtro', placeholder: 'Filtro de visualización… (ej.: dhcp, tcp.port == 80, ip.addr == 192.168.10.20)', 'aria-label': 'Filtro de visualización', spellcheck: 'false', autocapitalize: 'off' });
  const errorFiltro = el('p', { class: 'small feedback', role: 'status' });
  const tabla = el('div', { class: 'cap-tabla', role: 'region', 'aria-label': 'Lista de paquetes', tabindex: '0' });
  const det = el('div', { class: 'cap-detalle', 'aria-live': 'polite' });
  const bien = new Set();
  const marcador = el('span', { class: 'badge badge-accent' });

  function pintar() {
    let lista;
    try { lista = filtrar(cap.paquetes, filtro.value); filtro.classList.remove('mal'); filtro.classList.toggle('bien', !!filtro.value.trim()); errorFiltro.textContent = ''; }
    catch (e) { lista = cap.paquetes; filtro.classList.add('mal'); filtro.classList.remove('bien'); errorFiltro.className = 'small feedback bad'; errorFiltro.textContent = e.message; }
    tabla.replaceChildren(el('table', { class: 'result-table cap' },
      el('thead', {}, el('tr', {}, ['No.', 'Tiempo', 'Origen', 'Destino', 'Protocolo', 'Long.', 'Info'].map(h => el('th', { scope: 'col' }, h)))),
      el('tbody', {}, lista.map(p => {
        const f = fila(p);
        const tr = el('tr', { class: `cap-${COLOR[f.proto] || 'otro'}${p.n === sel ? ' sel' : ''}`, tabindex: '0' }, el('td', {}, f.n), el('td', {}, f.t), el('td', {}, f.src), el('td', {}, f.dst), el('td', {}, f.proto), el('td', {}, f.len), el('td', {}, f.info));
        const elegir = () => { sel = p.n; pintar(); };
        tr.addEventListener('click', elegir); tr.addEventListener('keydown', e => { if (e.key === 'Enter') elegir(); });
        return tr;
      }))));
    const p = cap.paquetes.find(x => x.n === sel);
    det.replaceChildren(...(p ? detalle(p).map(([t, hijos], k) => el('details', { open: k > 0 }, el('summary', {}, t), el('ul', {}, hijos.map(h => el('li', {}, h))))) : []));
    marcador.textContent = `${bien.size}/${cap.preguntas.length} respuestas`;
  }
  filtro.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); pintar(); } });
  const aplicar = el('button', { type: 'button', class: 'btn btn-primary btn-sm' }, 'Aplicar');
  aplicar.addEventListener('click', pintar);
  const limpiar = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Quitar filtro');
  limpiar.addEventListener('click', () => { filtro.value = ''; pintar(); });

  const preguntas = cap.preguntas.map((q, k) => {
    const fb = el('p', { class: 'small feedback', role: 'status' });
    let control;
    if (q.tipo === 'opcion') control = el('div', { class: 'cap-opciones' }, q.opciones.map((o, i) => el('label', { class: 'option' }, el('input', { type: 'radio', name: `cap-${id}-${k}`, value: String(i) }), el('span', {}, o))));
    else control = el('input', { type: 'text', class: 'mono', 'aria-label': 'Tu respuesta', spellcheck: 'false', autocapitalize: 'off' });
    const btn = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, 'Comprobar');
    btn.addEventListener('click', () => {
      const v = q.tipo === 'opcion' ? control.querySelector('input:checked')?.value : control.value;
      if (v == null || v === '') return;
      const ok = corregirPregunta(q, v);
      fb.className = 'small feedback ' + (ok ? 'ok' : 'bad');
      fb.textContent = ok ? '¡Correcto! ' + q.explicacion : 'No es eso. Usa los filtros y mira el detalle de los paquetes.';
      if (ok) { bien.add(k); pintar(); if (bien.size === cap.preguntas.length && !labHecho('cap-' + id)) { guardarLab('cap-' + id); toast('Captura analizada: laboratorio completado.'); } }
    });
    return el('li', {}, el('p', {}, q.texto), control, el('div', { class: 'hero-cta' }, btn), fb);
  });

  holder.append(el('section', { class: 'lab', 'aria-label': 'Visor de capturas: ' + cap.titulo },
    el('div', { class: 'lab-head' }, el('h3', {}, 'Captura: ' + cap.titulo), marcador),
    el('p', { class: 'muted' }, cap.intro),
    el('div', { class: 'cap-barra' }, filtro, aplicar, limpiar), errorFiltro,
    tabla, el('h4', {}, 'Detalle del paquete seleccionado'), det,
    el('h4', {}, 'Preguntas'), el('ol', { class: 'cap-preguntas' }, preguntas),
    el('p', { class: 'small muted' }, 'Filtros admitidos: protocolos (arp, ip, icmp, tcp, udp, dhcp, dns, http, tls), campos con == o != (ip.addr, ip.src, ip.dst, eth.addr, tcp.port, udp.port, tcp.flags.syn, arp.opcode, dhcp.type), dns.qry.name contains texto, y &&, ||, ! con paréntesis.')));
  pintar();
}
