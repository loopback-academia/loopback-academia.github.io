// Actividades de inglés técnico: vocabulario ([[vocab:basico]]), lectura ([[lectura:errores]]) y frases ([[frases:tickets]]).
// Los textos en inglés se pueden escuchar con la voz del navegador (si la tiene).
import { el, toast } from '../core.js';
import { guardarLab, labHecho, cargar } from '../progreso.js';
import { VOCAB, LECTURAS, FRASES, APROBADO, preguntaVocab, barajarOpciones } from './ingles.js';

const puedeHablar = () => typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
function hablar(texto) {
  if (!puedeHablar()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = 'en-US'; u.rate = 0.9;
  const voz = speechSynthesis.getVoices().find(v => /^en(-|_)US/i.test(v.lang)) || speechSynthesis.getVoices().find(v => /^en/i.test(v.lang));
  if (voz) u.voice = voz;
  speechSynthesis.speak(u);
}
const altavoz = texto => {
  if (!puedeHablar()) return null;
  const b = el('button', { type: 'button', class: 'btn btn-quiet btn-sm en-oir', 'aria-label': 'Escuchar en inglés: ' + texto, title: 'Escuchar' }, '🔊');
  b.addEventListener('click', () => hablar(texto));
  return b;
};

function finalizar(caja, bien, total, progreso, repetir) {
  const ok = bien / total >= APROBADO;
  if (ok && !labHecho(progreso)) { guardarLab(progreso); toast('¡Actividad de inglés completada!'); }
  caja.replaceChildren(el('div', { class: 'alert ' + (ok ? 'alert-ok' : 'alert-warn') }, el('p', {}, el('strong', {}, `${bien} de ${total} (${Math.round((bien / total) * 100)} %). `), ok ? 'Great job!' : `Necesitas un ${APROBADO * 100} %. Try again!`),
    el('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: repetir }, 'Repetir')));
}

export async function montarVocab(holder, id) {
  const set = VOCAB[id];
  if (!set) throw new Error('Vocabulario desconocido: ' + id);
  await cargar();
  const caja = el('div');
  const marcador = el('span', { class: 'badge badge-accent' });
  function ronda() {
    const orden = set.palabras.map((_, i) => i).sort(() => Math.random() - 0.5);
    let i = 0, bien = 0;
    const siguiente = () => {
      if (i === orden.length) return finalizar(caja, bien, orden.length, 'vocab-' + id, ronda);
      const inversa = i % 3 === 2;
      const q = preguntaVocab(id, orden[i], Math.random, inversa);
      marcador.textContent = `${i + 1}/${orden.length} · ${bien} bien`;
      const fb = el('p', { class: 'small feedback', role: 'status' });
      const ops = q.opciones.map((o, k) => {
        const b = el('button', { type: 'button', class: 'btn btn-ghost en-op' }, o);
        b.addEventListener('click', () => {
          ops.forEach(x => { x.disabled = true; }); ops[q.c].classList.add('ok');
          if (k === q.c) { bien++; fb.className = 'small feedback ok'; fb.textContent = 'Correct!'; } else { b.classList.add('bad'); fb.className = 'small feedback bad'; fb.textContent = `No: «${q.en}» → ${set.palabras.find(p => p[0] === q.en)[1]}.`; }
          hablar(q.en);
          i++; setTimeout(siguiente, 1100);
        });
        return b;
      });
      caja.replaceChildren(el('p', { class: 'small muted' }, inversa ? '¿Cómo se dice en inglés?' : '¿Qué significa?'),
        el('p', { class: 'en-palabra' }, q.pregunta, inversa ? null : altavoz(q.en)),
        inversa ? null : el('p', { class: 'small en-ejemplo' }, '«' + q.ejemplo + '» ', altavoz(q.ejemplo)),
        el('div', { class: 'en-ops' }, ops), fb);
    };
    siguiente();
  }
  holder.append(el('section', { class: 'lab', 'aria-label': 'Vocabulario' }, el('div', { class: 'lab-head' }, el('h3', {}, 'Vocabulario: ' + set.titulo), marcador),
    el('p', { class: 'small muted' }, `${set.palabras.length} palabras. Escucha cada una con 🔊. Se supera con un ${APROBADO * 100} % de aciertos.`), caja));
  ronda();
}

export async function montarLectura(holder, id) {
  const l = LECTURAS[id];
  if (!l) throw new Error('Lectura desconocida: ' + id);
  await cargar();
  const caja = el('div');
  function ronda() {
    let bien = 0, respondidas = 0;
    const total = l.textos.reduce((n, t) => n + t.preguntas.length, 0);
    caja.replaceChildren(...l.textos.map(t => el('article', { class: 'card en-texto' },
      el('p', { class: 'en-ingles mono' }, t.texto, ' ', altavoz(t.texto)),
      ...t.preguntas.map(q => {
        const [opciones, c] = barajarOpciones(q.opciones, q.c);
        const fb = el('p', { class: 'small feedback', role: 'status' });
        const ops = opciones.map((o, k) => {
          const b = el('button', { type: 'button', class: 'btn btn-ghost btn-sm en-op' }, o);
          b.addEventListener('click', () => {
            ops.forEach(x => { x.disabled = true; }); ops[c].classList.add('ok');
            if (k === c) bien++; else b.classList.add('bad');
            fb.className = 'small feedback ' + (k === c ? 'ok' : 'bad'); fb.textContent = (k === c ? 'Correct! ' : 'No. ') + q.e;
            if (++respondidas === total) { const fin = el('div'); caja.append(fin); finalizar(fin, bien, total, 'lectura-' + id, ronda); }
          });
          return b;
        });
        return el('div', {}, el('p', { class: 'small' }, el('strong', {}, q.q)), el('div', { class: 'en-ops' }, ops), fb);
      }))));
  }
  holder.append(el('section', { class: 'lab', 'aria-label': 'Lectura' }, el('div', { class: 'lab-head' }, el('h3', {}, 'Lectura: ' + l.titulo)),
    el('p', { class: 'small muted' }, 'Lee cada texto en inglés (puedes escucharlo con 🔊) y responde.'), caja));
  ronda();
}

export async function montarFrases(holder, id) {
  const f = FRASES[id];
  if (!f) throw new Error('Frases desconocidas: ' + id);
  await cargar();
  const caja = el('div');
  function ronda() {
    let bien = 0, respondidas = 0;
    caja.replaceChildren(...f.items.map(it => {
      const [opciones, c] = barajarOpciones(it.opciones, it.c);
      const fb = el('p', { class: 'small feedback', role: 'status' });
      const ops = opciones.map((o, k) => {
        const b = el('button', { type: 'button', class: 'btn btn-ghost btn-sm en-op' }, o);
        b.addEventListener('click', () => {
          ops.forEach(x => { x.disabled = true; }); ops[c].classList.add('ok');
          if (k === c) bien++; else b.classList.add('bad');
          fb.className = 'small feedback ' + (k === c ? 'ok' : 'bad'); fb.replaceChildren((k === c ? 'Correct! ' : 'No. ') + it.e + ' ', altavoz(it.opciones[it.c]) || '');
          if (++respondidas === f.items.length) { const fin = el('div'); caja.append(fin); finalizar(fin, bien, f.items.length, 'frases-' + id, ronda); }
        });
        return b;
      });
      return el('article', { class: 'card en-texto' }, el('p', {}, el('strong', {}, it.situacion)), el('div', { class: 'en-ops' }, ops), fb);
    }));
  }
  holder.append(el('section', { class: 'lab', 'aria-label': 'Frases' }, el('div', { class: 'lab-head' }, el('h3', {}, 'Frases útiles: ' + f.titulo)),
    el('p', { class: 'small muted' }, 'Elige la forma más correcta y profesional de decirlo en inglés. Al responder puedes escuchar la frase buena.'), caja));
  ronda();
}
