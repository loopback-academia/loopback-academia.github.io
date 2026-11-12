// Ejecución paso a paso de Python ([[paso:<id>]] y botón «Paso a paso» del laboratorio de código).
// El programa se ejecuta de verdad en el entorno aislado con un trazador (sys.settrace) y aquí se recorre: línea actual,
// pila de llamadas con sus variables (resaltando lo que cambia) y la salida hasta ese momento.
import { el, toast } from '../core.js';
import { guardarLab, labHecho, cargar } from '../progreso.js';
import { ejecutarCodigo } from './runner.js';
import { PASOS, comprobarPaso } from './pasos.js';

const NIVEL = { principiante: 'Nivel 1 · Principiante', intermedio: 'Nivel 2 · Intermedio', avanzado: 'Nivel 3 · Avanzado' };

export async function trazar(codigo, alEstado) {
  const r = await ejecutarCodigo({ lang: 'python-traza', code: codigo, timeout: 8000, alEstado });
  if (!r.ok) return { pasos: [], error: r.error || 'No se pudo ejecutar.' };
  try { return JSON.parse(r.traza); } catch { return { pasos: [], error: 'No se pudo leer la ejecución.' }; }
}

function describir(p, prev) {
  const f = p.pila[p.pila.length - 1]?.f || '';
  if (p.e === 'call') return `Entra en la función ${f}: se crea un marco nuevo con sus parámetros.`;
  if (p.e === 'return' && prev?.e === 'exception') return f === 'programa principal' ? `El error de la línea ${prev.l} no se ha capturado: el programa se detiene aquí.` : `El error sale de ${f} sin capturar y su marco desaparece.`;
  if (p.e === 'return') return f === 'programa principal' ? 'Fin del programa.' : `${f} devuelve ${p.r} y su marco desaparece.`;
  if (p.e === 'exception') return `Error en la línea ${p.l}: ${p.x}`;
  return `La flecha marca la línea ${p.l}, que se va a ejecutar ahora.${prev && prev.e === 'return' && prev.pila.length > p.pila.length ? ' (Se acaba de volver de una función.)' : ''}`;
}

// Crea el visor para una traza ya calculada. Devuelve { nodo, ir(i), total }.
export function visor(codigo, traza, alCambiar) {
  const lineas = codigo.replace(/\n$/, '').split('\n');
  const pasos = traza.pasos;
  let i = 0;
  const lista = el('ol', { class: 'paso-codigo', 'aria-label': 'Código' }, lineas.map(t => el('li', {}, el('code', {}, t || ' '))));
  const pila = el('div', { class: 'paso-pila', 'aria-live': 'polite' });
  const salida = el('pre', { class: 'terminal paso-salida' });
  const texto = el('p', { class: 'small paso-texto', role: 'status' });
  const contador = el('span', { class: 'badge' });
  const rango = el('input', { type: 'range', min: 0, max: Math.max(0, pasos.length - 1), value: 0, 'aria-label': 'Paso' });
  const boton = (txt, etq, f) => el('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'aria-label': etq, onclick: f }, txt);
  const bIni = boton('⏮', 'Ir al principio', () => ir(0)), bAtras = boton('◀ Atrás', 'Paso anterior', () => ir(i - 1));
  const bSig = boton('Siguiente ▶', 'Paso siguiente', () => ir(i + 1)), bFin = boton('⏭', 'Ir al final', () => ir(pasos.length - 1));
  rango.addEventListener('input', () => ir(+rango.value));

  function ir(n) {
    if (!pasos.length) return;
    i = Math.max(0, Math.min(pasos.length - 1, n));
    const p = pasos[i], prev = pasos[i - 1];
    [...lista.children].forEach((li, k) => { li.classList.toggle('actual', k === p.l - 1); li.classList.toggle('previa', !!prev && k === prev.l - 1 && prev.l !== p.l); });
    const li = lista.children[p.l - 1];
    if (li && (li.offsetTop < lista.scrollTop || li.offsetTop > lista.scrollTop + lista.clientHeight - 28)) lista.scrollTop = Math.max(0, li.offsetTop - 40);
    const marcoPrev = idx => prev?.pila[idx]?.f === p.pila[idx]?.f ? prev.pila[idx].v : null;
    pila.replaceChildren(...p.pila.map((m, k) => {
      const antes = marcoPrev(k);
      const filas = Object.entries(m.v).map(([nombre, [val, obj]]) => {
        const cambio = antes && (!antes[nombre] || antes[nombre][0] !== val);
        return el('tr', { class: cambio ? 'cambio' : null }, el('th', { scope: 'row' }, nombre), el('td', {}, el('code', {}, val), obj ? el('span', { class: 'badge paso-obj', title: 'Mismo número = mismo objeto en memoria' }, 'obj ' + obj) : null));
      });
      return el('div', { class: 'paso-marco' + (k === p.pila.length - 1 ? ' activo' : '') },
        el('p', { class: 'small paso-marco-tit' }, k === 0 ? m.f : `${m.f}()`),
        filas.length ? el('table', { class: 'table paso-vars' }, el('tbody', {}, filas)) : el('p', { class: 'small muted' }, 'Sin variables todavía.'));
    }));
    salida.textContent = p.out || ' ';
    texto.textContent = describir(p, prev);
    texto.className = 'small paso-texto' + (p.e === 'exception' ? ' err' : '');
    contador.textContent = `Paso ${i + 1} de ${pasos.length}`;
    rango.value = String(i);
    bIni.disabled = bAtras.disabled = i === 0; bSig.disabled = bFin.disabled = i === pasos.length - 1;
    alCambiar?.(i, p);
  }
  const nodo = el('div', { class: 'paso', tabindex: 0, 'aria-label': 'Ejecución paso a paso. Usa las flechas izquierda y derecha para avanzar.' },
    el('div', { class: 'paso-controles' }, bIni, bAtras, bSig, bFin, contador), rango, texto,
    el('div', { class: 'paso-layout' },
      el('div', {}, el('h5', { class: 'small muted' }, 'CÓDIGO'), lista),
      el('div', {}, el('h5', { class: 'small muted' }, 'VARIABLES (pila de llamadas)'), pila, el('h5', { class: 'small muted' }, 'SALIDA'), salida)),
    traza.error ? el('p', { class: 'alert alert-warn small' }, traza.error) : null);
  nodo.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); ir(i + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); ir(i - 1); }
  });
  if (pasos.length) ir(0); else texto.textContent = 'No hay pasos que mostrar.';
  return { nodo, ir, total: pasos.length };
}

export async function montarPaso(holder, id) {
  const ej = PASOS[id];
  if (!ej) throw new Error('Programa paso a paso desconocido: ' + id);
  await cargar();
  const progreso = 'paso-' + id;
  const marcador = el('span', { class: 'badge badge-accent' });
  const zona = el('div', {}, el('p', { class: 'muted small' }, 'Pulsa «Ejecutar paso a paso». La primera vez se descarga Python en tu navegador (unos segundos).'));
  const btn = el('button', { type: 'button', class: 'btn btn-primary' }, '▶ Ejecutar paso a paso');
  const estado = el('span', { class: 'small muted', role: 'status' });
  let resueltas = 0;
  const preguntas = ej.preguntas.map(p => {
    const fb = el('p', { class: 'small feedback', role: 'status' });
    let hecha = false;
    const marcar = ok => {
      fb.className = 'small feedback ' + (ok ? 'ok' : 'bad');
      fb.textContent = ok ? '✓ ' + p.e : 'No es eso. Recorre los pasos otra vez y fíjate bien.';
      if (ok && !hecha) {
        hecha = true; resueltas++;
        marcador.textContent = `${resueltas}/${ej.preguntas.length} preguntas`;
        if (resueltas === ej.preguntas.length && !labHecho(progreso)) { guardarLab(progreso); toast('¡Completado: ' + ej.titulo + '!'); }
      }
    };
    let control;
    if (p.opciones) {
      const bs = p.opciones.map((o, k) => el('button', { type: 'button', class: 'btn btn-ghost btn-sm sec-op', onclick: ev => { const ok = comprobarPaso(p, k); ev.currentTarget.classList.add(ok ? 'ok' : 'bad'); marcar(ok); } }, o));
      control = el('div', { class: 'sec-ops' }, bs);
    } else {
      const input = el('input', { type: 'text', class: 'input', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Tu respuesta' });
      const go = () => { if (input.value.trim()) marcar(comprobarPaso(p, input.value)); };
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
      control = el('div', { class: 'sec-resp' }, input, el('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: go }, 'Comprobar'));
    }
    return el('div', { class: 'sec-preg' }, el('p', {}, el('strong', {}, p.q)), control, fb);
  });
  marcador.textContent = `0/${ej.preguntas.length} preguntas`;
  btn.addEventListener('click', async () => {
    btn.disabled = true; estado.textContent = 'Ejecutando…';
    try {
      const t = await trazar(ej.codigo, s => { if (s === 'loading') estado.textContent = 'Descargando Python en tu navegador (solo la primera vez)…'; });
      const v = visor(ej.codigo, t);
      zona.replaceChildren(v.nodo);
      estado.textContent = `${v.total} pasos. Avanza con los botones o con las flechas del teclado.`;
      btn.textContent = '↻ Volver a ejecutar';
    } catch (e) { estado.textContent = e.message; }
    finally { btn.disabled = false; }
  });
  holder.append(el('section', { class: 'lab paso-lab', 'aria-label': 'Paso a paso: ' + ej.titulo },
    el('div', { class: 'lab-head' }, el('h3', {}, 'Paso a paso: ' + ej.titulo), marcador),
    el('div', { class: 'lab-tags' }, el('span', { class: 'badge level-' + ej.nivel }, NIVEL[ej.nivel]), el('span', { class: 'badge lang-python' }, 'Python')),
    el('p', { class: 'muted' }, ej.intro),
    el('div', { class: 'hero-cta' }, btn, estado), zona,
    el('h4', {}, 'Responde mirando la ejecución'), ...preguntas));
}
