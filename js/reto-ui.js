// Tarjeta del reto del día en el panel del curso.
import { el } from './core.js';
import { notaQuiz, guardarQuiz, exportar } from './progreso.js';
import { retoDelDia, claveReto, fechaLocal, rachaRetos, insigniasDe, INSIGNIAS } from './reto.js';

let banco = null;
const cargarBanco = () => banco || (banco = fetch('data/examen.json').then(r => r.json()));

export async function montarReto(caja, { curso, leccionHecha }) {
  const preguntas = await cargarBanco().catch(() => null);
  if (!preguntas || !caja) return;
  const hoy = fechaLocal();
  const empezados = new Set(curso.modulos.filter(m => m.lecciones.some(l => leccionHecha(l.id))).map(m => m.id));
  const q = retoDelDia(preguntas, hoy, empezados, curso.modulos[0]?.id);
  const multiple = q.correct.length > 1;

  function pintar() {
    const hecho = notaQuiz(claveReto(hoy));
    const racha = rachaRetos(Object.keys(exportar().items || {}), hoy);
    const insignias = insigniasDe(racha);
    const proxima = INSIGNIAS.find(([n]) => racha < n);
    const cab = el('div', { class: 'reto-cab' },
      el('div', {}, el('span', { class: 'eyebrow' }, 'Reto del día'), el('h2', {}, hecho ? (hecho.hecho ? '¡Acertaste el reto de hoy!' : 'Reto de hoy respondido') : 'Una pregunta, un minuto')),
      el('div', { class: 'reto-racha', title: 'Días seguidos respondiendo el reto' }, el('strong', {}, String(racha)), el('span', { class: 'small' }, racha === 1 ? 'día seguido' : 'días seguidos')));
    const pie = el('p', { class: 'small muted' }, insignias.length ? 'Insignias: ' + insignias.map(([, i, t]) => `${i} ${t}`).join(' · ') + '. ' : '', proxima ? `Próxima insignia: ${proxima[1]} ${proxima[2]}.` : '¡Tienes todas las insignias!');
    if (hecho) {
      caja.replaceChildren(cab, el('p', {}, q.q), el('p', { class: 'small' }, el('strong', {}, 'Respuesta: '), q.correct.map(i => q.options[i]).join(' · ')), el('p', { class: 'small muted' }, q.explain || ''), el('p', { class: 'small' }, 'Vuelve mañana para mantener la racha.'), pie);
      return;
    }
    const opciones = q.options.map((o, i) => el('label', { class: 'option' }, el('input', { type: multiple ? 'checkbox' : 'radio', name: 'reto', value: String(i) }), el('span', {}, o)));
    const form = el('form', { class: 'reto-form', novalidate: true }, el('fieldset', {}, el('legend', {}, q.q + (multiple ? ' (elige ' + q.correct.length + ')' : '')), opciones), el('button', { type: 'submit', class: 'btn btn-primary btn-sm' }, 'Responder'));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const elegidas = [...form.querySelectorAll('input:checked')].map(i => Number(i.value)).sort();
      if (!elegidas.length) return;
      const ok = JSON.stringify(elegidas) === JSON.stringify([...q.correct].sort());
      await guardarQuiz(claveReto(hoy), ok ? 1 : 0, 1);
      pintar();
    });
    caja.replaceChildren(cab, form, pie);
  }
  caja.hidden = false;
  pintar();
}
