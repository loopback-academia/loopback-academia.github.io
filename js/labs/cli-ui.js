// Interfaz del laboratorio de consola: terminal (historial con flechas, Ctrl+Z, "?") y lista de tareas que se marcan
// solas al cumplirse. Al completar todas, el laboratorio queda guardado en el progreso del alumno.
import { el, toast } from '../core.js';
import { guardarLab, labHecho, cargar } from '../progreso.js';
import { nuevoEquipo, ejecutar, prompt, runningConfig, completar } from './ios.js';
import { LABS } from './ios-labs.js';
import { construirGuia, avanzar, consejoModo, traducirError, NOMBRE_MODO } from './cli-guia.js';

// Cómo repetir el laboratorio en Packet Tracer (modelos con los mismos nombres de interfaz que el simulador).
function cajaPacketTracer(lab) {
  const sw = lab.equipo.tipo === 'switch';
  return el('details', { class: 'pt-box' },
    el('summary', {}, '📦 Hazlo también en tu Packet Tracer'),
    el('ol', {},
      el('li', {}, 'Abre Cisco Packet Tracer. ¿Aún no lo tienes? ', el('a', { href: 'leccion.html?id=m0-packet-tracer' }, 'Instálalo paso a paso'), '.'),
      el('li', {}, sw ? 'Abajo a la izquierda presiona «Network Devices» → «Switches» y arrastra un switch 2960 al área de trabajo.' : 'Abajo a la izquierda presiona «Network Devices» → «Routers» y arrastra un router 2911 al área de trabajo (tiene los puertos Gi0/0, Gi0/1 y Gi0/2, como aquí).'),
      el('li', {}, 'Haz clic sobre el equipo y abre la pestaña «CLI».'),
      el('li', {}, sw ? 'Presiona Enter hasta ver Switch>.' : 'Si pregunta «Would you like to enter the initial configuration dialog?», escribe no y presiona Enter. Después presiona Enter hasta ver Router>.'),
      el('li', {}, 'Escribe los mismos comandos que en este laboratorio y comprueba el resultado con los comandos show.'),
      el('li', {}, 'Guarda el archivo (File → Save As) para enseñarlo en tu portafolio.')));
}

export async function montarCli(holder, id) {
  const lab = LABS[id];
  if (!lab) throw new Error('Laboratorio desconocido: ' + id);
  await cargar();
  let eq, hist = [], pos = 0, completado = labHecho('cli-' + id);

  const salida = el('div', { class: 'terminal', role: 'log', 'aria-live': 'polite', 'aria-label': 'Salida de la consola', tabindex: '0' });
  const promptTxt = el('span');
  const input = el('input', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Escribe un comando de IOS', enterkeyhint: 'send' });
  const lista = el('ul', { class: 'tasks' });
  const progreso = el('span', { class: 'badge badge-accent' });
  const btnReset = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, 'Reiniciar');
  const btnSol = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Ver solución');
  const solucion = el('pre', { class: 'code', hidden: true });
  const NIVEL = { principiante: 'Nivel 1 · Principiante', intermedio: 'Nivel 2 · Intermedio', avanzado: 'Nivel 3 · Avanzado' };
  const pistas = lab.pistas || [];
  let pistasVistas = 0;
  // Modo guiado: solo en laboratorios guiados (en las averías hay que pensar, no copiar).
  const guiable = lab.tipo !== 'averia';
  const guia = guiable ? construirGuia(lab) : [];
  let paso = 0, acompanar = guiable && lab.nivel === 'principiante', fb = null;
  const cajaGuia = el('section', { class: 'guia', 'aria-label': 'Modo guiado: qué escribir en cada paso' });
  function pintarGuia() {
    if (!guiable) return;
    if (!acompanar) {
      const on = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, '🧭 Activar el modo guiado: qué escribir en cada paso y por qué');
      on.addEventListener('click', () => { acompanar = true; pintarGuia(); input.focus(); });
      cajaGuia.className = 'guia guia-off';
      cajaGuia.replaceChildren(on);
      return;
    }
    cajaGuia.className = 'guia';
    const off = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Ocultar guía');
    off.addEventListener('click', () => { acompanar = false; pintarGuia(); });
    const cab = el('div', { class: 'guia-cab' }, el('strong', {}, '🧭 Modo guiado'), el('span', { class: 'badge' }, paso < guia.length ? `Paso ${paso + 1} de ${guia.length}` : 'Terminado'), off);
    const barra = el('div', { class: 'guia-barra', 'aria-hidden': 'true' }, el('span'));
    barra.firstChild.style.setProperty('--p', String(paso / guia.length));
    const feedback = fb ? el('p', { class: 'guia-fb ' + (fb.ok ? 'ok' : 'warn'), role: 'status' }, fb.texto) : null;
    if (paso >= guia.length) {
      cajaGuia.replaceChildren(...[cab, barra, feedback, el('p', {}, 'Has escrito todos los comandos del laboratorio. Mira la lista de tareas: si alguna no está marcada, revisa lo que escribiste con show running-config.')].filter(Boolean));
      return;
    }
    const p = guia[paso];
    const consejo = consejoModo(guia, paso, eq.modo);
    const saltar = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Saltar este paso');
    saltar.addEventListener('click', () => { paso++; fb = null; pintarGuia(); input.focus(); });
    cajaGuia.replaceChildren(...[cab, barra, feedback,
      el('p', { class: 'guia-escribe' }, el('span', {}, 'Escribe:'), el('code', {}, p.linea)),
      p.libre ? el('p', { class: 'small muted' }, 'Puedes elegir tu propia contraseña o texto. En un entorno real, usa una contraseña larga y difícil de adivinar.') : null,
      el('p', {}, el('strong', {}, '¿Qué hace? '), p.que || ''),
      el('p', { class: 'guia-modo ' + (consejo ? 'warn' : 'ok') }, consejo
        ? ['⚠ Ahora estás en ', el('strong', {}, NOMBRE_MODO[eq.modo]), '. Este comando se escribe en ', el('strong', {}, NOMBRE_MODO[p.modo]), ` (el prompt termina en ${p.sufijo}). `, consejo]
        : ['✓ Estás en el sitio correcto: ', el('strong', {}, NOMBRE_MODO[p.modo]), ` (el prompt termina en ${p.sufijo}).`]),
      el('div', { class: 'guia-acciones' }, saltar)].filter(Boolean));
  }
  function guiar(r, antes) {
    if (!guiable) return;
    const err = traducirError(r.salida);
    if (err && acompanar) escribir('💡 ' + err, 'hint');
    const nuevo = avanzar(guia, paso, eq);
    if (nuevo > paso) {
      paso = nuevo;
      const cambio = r.prompt !== antes ? ` Fíjate en el prompt: ahora es ${r.prompt}, es decir, estás en ${NOMBRE_MODO[eq.modo]}.` : '';
      fb = { ok: true, texto: '✓ Correcto.' + cambio };
    } else if (err) fb = { ok: false, texto: 'Ese comando no ha funcionado. ' + err };
    else if (eq.ultimo) fb = { ok: false, texto: 'Ese comando es válido, pero no corresponde a este paso. Escribe el que te indica la guía (o presiona «Saltar este paso» si ya lo hiciste a tu manera).' };
    pintarGuia();
  }
  const listaPistas = el('ol', { class: 'hints' });
  const btnPista = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, 'Dame una pista');
  btnPista.addEventListener('click', () => {
    if (pistasVistas >= pistas.length) return;
    listaPistas.append(el('li', {}, pistas[pistasVistas++]));
    btnPista.textContent = pistasVistas < pistas.length ? `Otra pista (${pistas.length - pistasVistas})` : 'No hay más pistas';
    btnPista.disabled = pistasVistas >= pistas.length;
  });

  function escribir(texto, clase) {
    if (texto == null || texto === '') return;
    salida.append(el('div', { class: clase || null }, texto));
    salida.scrollTop = salida.scrollHeight;
  }
  function revisar() {
    const hechas = lab.tareas.map(t => { try { return !!t.ok(eq, runningConfig); } catch { return false; } });
    lista.replaceChildren(...lab.tareas.map((t, i) => el('li', {}, el('span', { class: 'check' + (hechas[i] ? ' on' : ''), 'aria-hidden': 'true' }, '✓'), el('span', { class: hechas[i] ? 'muted' : null }, (hechas[i] ? '(hecha) ' : '') + t.texto))));
    const n = hechas.filter(Boolean).length;
    progreso.textContent = `${n}/${lab.tareas.length} tareas`;
    if (n === lab.tareas.length && !completado) {
      completado = true;
      guardarLab('cli-' + id);
      escribir('\n*** Laboratorio completado: todas las tareas están hechas. ***', 'ok');
      toast('Laboratorio completado: ' + lab.titulo);
    }
  }
  function reiniciar() {
    eq = nuevoEquipo(lab.equipo);
    salida.replaceChildren();
    escribir(`Simulador de Cisco IOS · ${lab.titulo}\nEscribe "?" para ver los comandos de cada modo. Puedes abreviar (conf t, sh run, int g0/1) y completar con Tab.\n`);
    promptTxt.textContent = prompt(eq);
    hist = []; pos = 0; paso = 0; fb = null;
    revisar();
    pintarGuia();
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const linea = input.value;
      input.value = '';
      const antes = prompt(eq);
      escribir(antes + linea, 'in');
      if (linea.trim()) { hist.push(linea); pos = hist.length; }
      const r = ejecutar(eq, linea);
      escribir(r.salida, /^\s*\^|^% /m.test(r.salida) ? 'err' : null);
      promptTxt.textContent = r.prompt;
      revisar();
      if (linea.trim()) guiar(r, antes);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (pos > 0) { pos--; input.value = hist[pos]; }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (pos < hist.length - 1) { pos++; input.value = hist[pos]; } else { pos = hist.length; input.value = ''; }
    } else if ((e.ctrlKey && (e.key === 'z' || e.key === 'Z')) || (e.ctrlKey && e.key === 'c')) {
      e.preventDefault();
      escribir(prompt(eq) + '^Z', 'in');
      const antes = prompt(eq);
      const r = ejecutar(eq, eq.modo === 'user' || eq.modo === 'priv' ? '' : 'end');
      promptTxt.textContent = r.prompt;
      revisar();
      if (antes !== r.prompt) guiar(r, antes);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const c = completar(eq, input.value);
      if (c) input.value = c;
    }
  });
  salida.addEventListener('click', () => input.focus());
  btnReset.addEventListener('click', reiniciar);
  btnSol.addEventListener('click', () => {
    solucion.hidden = !solucion.hidden;
    btnSol.textContent = solucion.hidden ? 'Ver solución' : 'Ocultar solución';
    solucion.textContent = lab.solucion.join('\n');
  });

  holder.append(el('section', { class: 'lab', 'aria-label': 'Laboratorio: ' + lab.titulo },
    el('div', { class: 'lab-head' }, el('h3', {}, (lab.tipo === 'averia' ? 'Avería: ' : 'Laboratorio: ') + lab.titulo.replace(/^Avería:\s*/, '')), progreso),
    el('div', { class: 'lab-tags' }, lab.nivel && !lab.profesional ? el('span', { class: 'badge level-' + lab.nivel }, NIVEL[lab.nivel]) : null, lab.tipo === 'averia' ? el('span', { class: 'badge badge-warn' }, '🔧 Resolución de problemas') : null, lab.profesional ? el('span', { class: 'badge level-profesional' }, '🎓 Nivel profesional') : null),
    el('p', { class: 'muted' }, lab.intro),
    lab.topologia ? el('pre', { class: 'topology', 'aria-label': 'Topología de red' }, lab.topologia) : null,
    lab.tipo === 'averia' ? el('p', { class: 'small' }, el('strong', {}, 'Método: '), 'primero diagnostica con comandos show (no cambies nada a ciegas), luego arregla y al final verifica.') : null,
    guiable ? cajaGuia : null,
    el('div', { class: 'cli-layout' },
      el('div', {}, salida, el('div', { class: 'term-input' }, promptTxt, input)),
      el('div', {}, el('h4', {}, 'Tareas'), lista, pistas.length ? el('div', { class: 'hints-box' }, btnPista, listaPistas) : null, el('div', { class: 'hero-cta' }, btnReset, btnSol), solucion)),
    guiable ? cajaPacketTracer(lab) : null));
  reiniciar();
}
