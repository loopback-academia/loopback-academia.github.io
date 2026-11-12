// Dos sesiones lado a lado sobre la tabla cuentas, con los datos confirmados en medio y las tareas del reto.
import { el, toast } from '../core.js';
import { guardarLab, labHecho, cargar } from '../progreso.js';
import { nuevaBdConc, ejecutarConc, RETOS_CONC } from './concurrencia.js';

export async function montarConc(holder, id) {
  const reto = RETOS_CONC[id];
  if (!reto) throw new Error('Reto de concurrencia desconocido: ' + id);
  await cargar();
  let s = nuevaBdConc(), completado = labHecho('conc-' + id);
  const tabla = el('div', { class: 'conc-datos', 'aria-live': 'polite' });
  const tareas = el('ul', { class: 'tasks' });
  const marcador = el('span', { class: 'badge badge-accent' });
  const paneles = {};

  function pintarDatos() {
    tabla.replaceChildren(el('p', { class: 'small muted' }, 'Datos confirmados en la base de datos'),
      el('table', { class: 'result-table' }, el('thead', {}, el('tr', {}, ['id', 'titular', 'saldo', 'bloqueo'].map(h => el('th', { scope: 'col' }, h)))),
        el('tbody', {}, Object.entries(s.filas).map(([k, f]) => el('tr', {}, el('td', {}, k), el('td', {}, f.titular), el('td', {}, String(f.saldo)), el('td', {}, s.bloqueos[k] ? '🔒 sesión ' + s.bloqueos[k] : '—'))))));
    for (const n of ['A', 'B']) {
      const x = s.ses[n];
      paneles[n].estado.textContent = `${x.nivel} · ${x.esperando ? '⏳ esperando' : x.tx ? 'transacción abierta' : 'sin transacción'}`;
      paneles[n].estado.className = 'badge ' + (x.esperando ? 'badge-warn' : x.tx ? 'badge-accent' : '');
    }
    const hechas = reto.tareas.map(t => { try { return !!t.ok(s); } catch { return false; } });
    tareas.replaceChildren(...reto.tareas.map((t, i) => el('li', {}, el('span', { class: 'check' + (hechas[i] ? ' on' : ''), 'aria-hidden': 'true' }, '✓'), el('span', { class: hechas[i] ? 'muted' : null }, (hechas[i] ? '(hecha) ' : '') + t.texto))));
    marcador.textContent = `${hechas.filter(Boolean).length}/${reto.tareas.length} tareas`;
    if (hechas.every(Boolean) && !completado) { completado = true; guardarLab('conc-' + id); toast('Reto completado: ' + reto.titulo); }
  }
  function ejecutar(n, sql) {
    const r = ejecutarConc(s, n, sql);
    for (const k of ['A', 'B']) {
      if (k === n) paneles[k].log.append(el('div', { class: 'in' }, `${k}> ${sql}`));
      for (const t of r[k]) paneles[k].log.append(el('div', { class: /^ERROR/.test(t) ? 'err' : /Esperando|esperando/.test(t) ? 'warn' : null }, t));
      paneles[k].log.scrollTop = paneles[k].log.scrollHeight;
    }
    pintarDatos();
  }
  function panel(n) {
    const log = el('div', { class: 'terminal conc-log', role: 'log', 'aria-live': 'polite', 'aria-label': 'Sesión ' + n });
    const estado = el('span', { class: 'badge' });
    const input = el('input', { type: 'text', class: 'mono', 'aria-label': 'Sentencia SQL de la sesión ' + n, placeholder: 'Escribe SQL y pulsa Intro', spellcheck: 'false', autocapitalize: 'off' });
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && input.value.trim()) { e.preventDefault(); ejecutar(n, input.value); input.value = ''; } });
    const chips = el('div', { class: 'conc-chips' }, reto.ejemplos[n].map(t => { const b = el('button', { type: 'button', class: 'btn btn-quiet btn-sm mono' }, t); b.addEventListener('click', () => ejecutar(n, t)); return b; }));
    paneles[n] = { log, estado };
    return el('div', { class: 'conc-panel' }, el('div', { class: 'conc-cab' }, el('strong', {}, 'Sesión ' + n), estado), log, input, el('p', { class: 'small muted' }, 'Pulsa una sentencia para ejecutarla:'), chips);
  }
  const reiniciar = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, 'Reiniciar la base de datos');
  reiniciar.addEventListener('click', () => { const marcasPrevias = s.marcas, bien = s.bien; s = nuevaBdConc(); s.marcas = marcasPrevias; s.bien = bien; for (const n of ['A', 'B']) paneles[n].log.replaceChildren(); pintarDatos(); });
  holder.append(el('section', { class: 'lab', 'aria-label': 'Dos sesiones: ' + reto.titulo },
    el('div', { class: 'lab-head' }, el('h3', {}, 'Dos sesiones a la vez: ' + reto.titulo), marcador),
    el('p', { class: 'muted' }, reto.intro),
    el('div', { class: 'conc-layout' }, panel('A'), tabla, panel('B')),
    el('h4', {}, 'Tareas'), tareas, el('div', { class: 'hero-cta' }, reiniciar)));
  pintarDatos();
}
