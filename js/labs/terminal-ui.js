// Terminal genérica para laboratorios de consola (Windows, Linux…): historial con flechas, Tab para completar,
// lista de tareas que se marcan solas, pistas y solución. El motor aporta nuevo(), ejecutar(), prompt() y completar().
import { el, toast } from '../core.js';
import { guardarLab, labHecho, cargar } from '../progreso.js';

const NIVEL = { principiante: 'Nivel 1 · Principiante', intermedio: 'Nivel 2 · Intermedio', avanzado: 'Nivel 3 · Avanzado' };

export async function montarTerminal(holder, { lab, motor, progreso, nombre, bienvenida, clase = '' }) {
  await cargar();
  let s, hist = [], pos = 0, completado = labHecho(progreso);
  const salida = el('div', { class: 'terminal ' + clase, role: 'log', 'aria-live': 'polite', 'aria-label': 'Salida de la consola', tabindex: '0' });
  const promptTxt = el('span');
  const input = el('input', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Escribe un comando', enterkeyhint: 'send' });
  const lista = el('ul', { class: 'tasks' });
  const marcador = el('span', { class: 'badge badge-accent' });
  const btnReset = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, 'Reiniciar');
  const btnSol = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Ver solución');
  const solucion = el('pre', { class: 'code', hidden: true });
  const listaPistas = el('ol', { class: 'hints' });
  const btnPista = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, 'Dame una pista');
  let vistas = 0;
  btnPista.addEventListener('click', () => {
    if (vistas >= lab.pistas.length) return;
    listaPistas.append(el('li', {}, lab.pistas[vistas++]));
    btnPista.textContent = vistas < lab.pistas.length ? `Otra pista (${lab.pistas.length - vistas})` : 'No hay más pistas';
    btnPista.disabled = vistas >= lab.pistas.length;
  });

  const escribir = (texto, c) => { if (texto == null || texto === '') return; salida.append(el('div', { class: c || null }, texto)); salida.scrollTop = salida.scrollHeight; };
  function revisar() {
    const hechas = lab.tareas.map(t => { try { return !!t.ok(s); } catch { return false; } });
    lista.replaceChildren(...lab.tareas.map((t, i) => el('li', {}, el('span', { class: 'check' + (hechas[i] ? ' on' : ''), 'aria-hidden': 'true' }, '✓'), el('span', { class: hechas[i] ? 'muted' : null }, (hechas[i] ? '(hecha) ' : '') + t.texto))));
    const n = hechas.filter(Boolean).length;
    marcador.textContent = `${n}/${lab.tareas.length} tareas`;
    if (n === lab.tareas.length && !completado) {
      completado = true;
      guardarLab(progreso);
      escribir('\n*** ¡Caso resuelto! Todas las tareas están hechas. ***', 'ok');
      toast('Laboratorio completado: ' + lab.titulo);
    }
  }
  function reiniciar() {
    s = motor.nuevo(lab.equipo);
    salida.replaceChildren();
    escribir(bienvenida);
    promptTxt.textContent = motor.prompt(s);
    hist = []; pos = 0;
    revisar();
  }
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const linea = input.value;
      input.value = '';
      escribir(motor.prompt(s) + linea, 'in');
      if (linea.trim()) { hist.push(linea); pos = hist.length; }
      const r = motor.ejecutar(s, linea);
      if (r.limpiar) salida.replaceChildren();
      escribir(r.salida, motor.esError?.(r.salida) ? 'err' : null);
      promptTxt.textContent = r.prompt;
      revisar();
    } else if (e.key === 'ArrowUp') { e.preventDefault(); if (pos > 0) { pos--; input.value = hist[pos]; } }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (pos < hist.length - 1) { pos++; input.value = hist[pos]; } else { pos = hist.length; input.value = ''; } }
    else if (e.key === 'Tab') { e.preventDefault(); const c = motor.completar?.(s, input.value); if (c) input.value = c; }
    else if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) { e.preventDefault(); salida.replaceChildren(); }
  });
  salida.addEventListener('click', () => { if (!getSelection().toString()) input.focus(); });
  btnReset.addEventListener('click', reiniciar);
  btnSol.addEventListener('click', () => {
    solucion.hidden = !solucion.hidden;
    btnSol.textContent = solucion.hidden ? 'Ver solución' : 'Ocultar solución';
    solucion.textContent = lab.solucion.join('\n');
  });

  holder.append(el('section', { class: 'lab', 'aria-label': `${nombre}: ${lab.titulo}` },
    el('div', { class: 'lab-head' }, el('h3', {}, `${nombre}: ${lab.titulo}`), marcador),
    el('div', { class: 'lab-tags' }, lab.nivel ? el('span', { class: 'badge level-' + lab.nivel }, NIVEL[lab.nivel]) : null),
    el('p', { class: 'muted' }, lab.intro),
    el('div', { class: 'cli-layout' },
      el('div', {}, salida, el('div', { class: 'term-input' }, promptTxt, input)),
      el('div', {}, el('h4', {}, 'Tareas'), lista, lab.pistas?.length ? el('div', { class: 'hints-box' }, btnPista, listaPistas) : null, el('div', { class: 'hero-cta' }, btnReset, btnSol), solucion))));
  reiniciar();
}
