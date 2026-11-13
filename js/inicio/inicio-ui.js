// Prácticas del área «Empieza aquí» ([[inicio:<id>]]): una pregunta cada vez, con explicación al responder.
import { el, toast } from '../core.js';
import { guardarLab, labHecho, cargar } from '../progreso.js';
import * as I from './inicio.js';

const TITULOS = {
  atajos: 'Atajos de teclado', archivos: '¿Qué tipo de archivo es?', partes: 'Las piezas del ordenador', unidades: 'Bits, bytes y velocidad', orientacion: '¿Por qué área empiezo?',
};
const INTRO = {
  atajos: 'Los atajos ahorran mucho tiempo. Elige la combinación correcta para cada acción.',
  archivos: 'La extensión (lo que va después del último punto) dice qué tipo de archivo es y con qué programa se abre.',
  partes: 'Lee la descripción y elige de qué pieza se trata.',
  unidades: 'Cálculos sencillos que usarás siempre: tamaños de archivo y velocidad de internet. Puedes usar la calculadora.',
  orientacion: 'Ocho preguntas rápidas sobre lo que te gusta. No hay respuestas buenas ni malas: al final te recomendamos por qué área empezar.',
};
const tactil = () => window.matchMedia?.('(pointer: coarse)').matches;

export async function montarInicio(holder, id) {
  if (!TITULOS[id]) throw new Error('Práctica desconocida: ' + id);
  await cargar();
  const marcador = el('span', { class: 'badge badge-accent' });
  const caja = el('div', { class: 'ini-caja', tabindex: -1 });
  holder.append(el('section', { class: 'lab ini-lab', 'aria-label': TITULOS[id] },
    el('div', { class: 'lab-head' }, el('h3', {}, TITULOS[id]), marcador),
    el('p', { class: 'muted' }, INTRO[id]), caja));
  if (id === 'orientacion') orientacion(caja, marcador); else preguntas(id, caja, marcador);
}

function preguntas(id, caja, marcador) {
  const lista = id === 'unidades' ? I.preguntasUnidades(8) : I.ronda(id);
  let i = 0, bien = 0, quitar = null;
  const siguiente = () => {
    quitar?.(); quitar = null;
    if (i === lista.length) return fin();
    const p = lista[i];
    marcador.textContent = `${i + 1} de ${lista.length} · ${bien} bien`;
    const fb = el('p', { class: 'small feedback', role: 'status' });
    const btnSig = el('button', { type: 'button', class: 'btn btn-primary btn-sm', hidden: true }, i === lista.length - 1 ? 'Ver el resultado' : 'Siguiente ›');
    btnSig.addEventListener('click', () => { i++; siguiente(); });
    let respondida = false;
    const responder = (ok, txt) => {
      if (respondida) return;
      respondida = true;
      if (ok) bien++;
      fb.className = 'small feedback ' + (ok ? 'ok' : 'bad');
      fb.textContent = (ok ? '✓ ¡Bien! ' : `✗ Era: ${txt}. `) + p.e + (p.mac ? ` En Mac: ${p.mac}.` : '');
      marcador.textContent = `${i + 1} de ${lista.length} · ${bien} bien`;
      btnSig.hidden = false; btnSig.focus({ preventScroll: true });
    };
    let control;
    if (p.opciones) {
      const bs = p.opciones.map((o, k) => {
        const b = el('button', { type: 'button', class: 'btn btn-ghost ini-op' + (p.atajo ? ' mono' : '') }, o);
        b.addEventListener('click', () => { if (respondida) return; bs.forEach(x => { x.disabled = true; }); bs[p.c].classList.add('ok'); if (k !== p.c) b.classList.add('bad'); responder(k === p.c, p.opciones[p.c]); });
        return b;
      });
      control = el('div', { class: 'ini-ops' }, bs);
      if (p.atajo?.tecla) {
        const onKey = ev => {
          if (respondida || ev.repeat || /^(Control|Shift|Alt|Meta)$/.test(ev.key)) return;
          if (I.coincideTecla(p.atajo, ev)) { ev.preventDefault(); bs.forEach(x => { x.disabled = true; }); bs[p.c].classList.add('ok'); responder(true, p.opciones[p.c]); }
          else if (ev.ctrlKey || ev.metaKey || ev.key === 'F2') ev.preventDefault();
        };
        document.addEventListener('keydown', onKey);
        quitar = () => document.removeEventListener('keydown', onKey);
      }
    } else {
      const input = el('input', { type: 'text', inputmode: 'decimal', class: 'input ini-num', autocomplete: 'off', 'aria-label': 'Tu respuesta' });
      const go = () => { if (input.value.trim() && !respondida) { input.disabled = true; responder(I.comprobarUnidad(p, input.value), p.respuesta); } };
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
      control = el('div', { class: 'sec-resp' }, input, el('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: go }, 'Comprobar'));
      requestAnimationFrame(() => input.focus({ preventScroll: true }));
    }
    caja.replaceChildren(
      el('p', { class: 'ini-preg' + (p.archivo ? ' mono' : '') }, p.q),
      p.atajo?.tecla && !tactil() ? el('p', { class: 'small muted' }, 'Truco: también puedes pulsar la combinación en tu teclado.') : null,
      control, fb, btnSig);
  };
  const fin = () => {
    const ok = bien / lista.length >= I.APROBADO;
    if (ok && !labHecho('inicio-' + id)) { guardarLab('inicio-' + id); toast('¡Práctica superada: ' + TITULOS[id] + '!'); }
    marcador.textContent = `${bien} de ${lista.length}`;
    caja.replaceChildren(el('div', { class: 'alert ' + (ok ? 'alert-ok' : 'alert-warn') },
      el('p', {}, el('strong', {}, `${bien} de ${lista.length} (${Math.round((bien / lista.length) * 100)} %). `), ok ? '¡Muy bien! Ya dominas esto.' : `Para superarla hace falta un ${I.APROBADO * 100} %. Repasa las explicaciones e inténtalo otra vez: cada ronda trae preguntas distintas.`),
      el('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: () => montarDeNuevo() }, 'Otra ronda')));
  };
  const montarDeNuevo = () => { const nuevo = id === 'unidades' ? I.preguntasUnidades(8) : I.ronda(id); lista.splice(0, lista.length, ...nuevo); i = 0; bien = 0; siguiente(); };
  siguiente();
}

function orientacion(caja, marcador) {
  const resp = [];
  const paso = i => {
    if (i === I.PREGUNTAS_ORIENTACION.length) return resultado();
    const p = I.PREGUNTAS_ORIENTACION[i];
    marcador.textContent = `${i + 1} de ${I.PREGUNTAS_ORIENTACION.length}`;
    caja.replaceChildren(el('p', { class: 'ini-preg' }, p.q),
      el('div', { class: 'ini-ops una' }, p.o.map(([txt], k) => el('button', { type: 'button', class: 'btn btn-ghost ini-op', onclick: () => { resp[i] = k; paso(i + 1); } }, txt))),
      i > 0 ? el('button', { type: 'button', class: 'btn btn-quiet btn-sm', onclick: () => paso(i - 1) }, '‹ Anterior') : null);
    caja.querySelector('button')?.focus({ preventScroll: true });
  };
  const resultado = () => {
    const r = I.resultadoOrientacion(resp);
    const max = Math.max(1, r[0][1]);
    const [prim] = r[0];
    if (!labHecho('inicio-orientacion')) guardarLab('inicio-orientacion');
    marcador.textContent = 'Resultado';
    caja.replaceChildren(
      el('div', { class: 'alert alert-ok' }, el('p', {}, el('strong', {}, `Te recomendamos empezar por: ${I.AREAS_ORIENTACION[prim][0]}. `), I.AREAS_ORIENTACION[prim][1])),
      el('ul', { class: 'ini-ranking' }, r.map(([a, n]) => el('li', {}, el('span', {}, I.AREAS_ORIENTACION[a][0]),
        el('div', { class: 'meter' }, el('span', { class: 'ini-fill', dataset: { p: String(n / max) } })), el('a', { class: 'small', href: 'curso.html?area=' + a }, 'Ver el área')))),
      el('p', { class: 'small muted' }, 'Es solo una orientación: puedes estudiar varias áreas, y todas empiezan desde el nivel 1. Si no lo tienes claro, Soporte técnico es la puerta de entrada más rápida a un empleo y te da la base para todo lo demás.'),
      el('div', { class: 'hero-cta' }, el('a', { class: 'btn btn-primary btn-sm', href: 'curso.html?area=' + prim }, 'Empezar ' + I.AREAS_ORIENTACION[prim][0]), el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => { resp.length = 0; paso(0); } }, 'Repetir el test')));
    caja.querySelectorAll('.ini-fill').forEach(f => f.style.setProperty('--p', f.dataset.p));
  };
  paso(0);
}
