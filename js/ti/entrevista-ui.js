// Simulador de entrevista: una pregunta cada vez, con cronómetro orientativo; el alumno responde por escrito, compara
// con los puntos clave, se autoevalúa y al final ve su resultado y la respuesta modelo de cada pregunta.
import { el, toast } from '../core.js';
import { guardarLab, labHecho, cargar } from '../progreso.js';
import { RUTAS_ENTREVISTA, nuevaEntrevista, puntuar } from './entrevista.js';

const TIPO = { tecnica: 'Técnica', comportamiento: 'Comportamiento (método STAR)', situacional: 'Situacional' };

export async function montarEntrevista(holder, ruta) {
  await cargar();
  const caja = el('div');
  holder.append(el('section', { class: 'lab', 'aria-label': 'Simulador de entrevista' },
    el('div', { class: 'lab-head' }, el('h3', {}, 'Simulador de entrevista: ' + (RUTAS_ENTREVISTA[ruta] || ruta))), caja));

  function portada() {
    caja.replaceChildren(
      el('p', {}, 'Seis preguntas como las de una entrevista real: tres técnicas, dos de comportamiento y una situacional. Responde por escrito como si hablaras (unos dos minutos por pregunta). Después compara tu respuesta con lo que espera el entrevistador.'),
      el('p', { class: 'small muted' }, 'Consejo: en las de comportamiento usa el método STAR: Situación, Tarea, Acción y Resultado. Tus respuestas se quedan en tu navegador.'),
      el('div', { class: 'hero-cta' }, el('button', { type: 'button', class: 'btn btn-primary', onclick: empezar }, 'Empezar la entrevista')));
  }
  function empezar() {
    const preguntas = nuevaEntrevista(ruta);
    const marcadas = {}, textos = {};
    let i = 0, reloj = null;
    const cerrarReloj = () => { clearInterval(reloj); reloj = null; };
    function pregunta() {
      cerrarReloj();
      const p = preguntas[i];
      const inicio = Date.now();
      const tiempo = el('span', { class: 'badge' }, '0:00');
      reloj = setInterval(() => { const s = Math.floor((Date.now() - inicio) / 1000); tiempo.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; tiempo.classList.toggle('badge-warn', s > 150); }, 1000);
      const resp = el('textarea', { rows: 6, class: 'sql-editor', 'aria-label': 'Tu respuesta', placeholder: 'Escribe tu respuesta como la dirías en voz alta…' });
      resp.value = textos[p.id] || '';
      const evaluar = el('div', { hidden: true });
      const btn = el('button', { type: 'button', class: 'btn btn-primary' }, 'Ver lo que espera el entrevistador');
      btn.addEventListener('click', () => {
        if (resp.value.trim().length < 20) { resp.focus(); toast('Escribe tu respuesta antes de compararla.'); return; }
        textos[p.id] = resp.value; cerrarReloj(); btn.hidden = true; resp.readOnly = true;
        const casillas = p.claves.map((c, k) => el('label', { class: 'option' }, el('input', { type: 'checkbox', value: String(k) }), el('span', {}, c)));
        const sig = el('button', { type: 'button', class: 'btn btn-primary' }, i < preguntas.length - 1 ? 'Siguiente pregunta →' : 'Ver mi resultado');
        sig.addEventListener('click', () => { marcadas[p.id] = casillas.map(c => c.querySelector('input')).filter(x => x.checked).map(x => x.value); i++; if (i < preguntas.length) pregunta(); else resultado(); });
        evaluar.replaceChildren(el('fieldset', { class: 'mail-senales' }, el('legend', {}, 'Marca con sinceridad los puntos que SÍ incluiste:'), casillas),
          el('details', {}, el('summary', { class: 'small' }, 'Ver una respuesta modelo'), el('p', { class: 'small' }, p.modelo)), el('div', { class: 'hero-cta' }, sig));
        evaluar.hidden = false;
      });
      caja.replaceChildren(el('div', { class: 'lab-tags' }, el('span', { class: 'badge badge-accent' }, `Pregunta ${i + 1} de ${preguntas.length}`), el('span', { class: 'badge' }, TIPO[p.tipo]), tiempo),
        el('p', { class: 'entrevista-pregunta' }, '«' + p.pregunta + '»'), resp, el('div', { class: 'hero-cta' }, btn), evaluar);
      resp.focus({ preventScroll: true });
    }
    function resultado() {
      cerrarReloj();
      const r = puntuar(preguntas, marcadas);
      const nivel = r.pct >= 75 ? '¡Muy buena entrevista!' : r.pct >= 50 ? 'Vas bien: completa más tus respuestas.' : 'Practica más: tus respuestas se quedan cortas.';
      if (!labHecho('entrevista-' + ruta)) { guardarLab('entrevista-' + ruta); toast('Simulador de entrevista completado.'); }
      caja.replaceChildren(
        el('div', { class: 'alert ' + (r.pct >= 50 ? 'alert-ok' : 'alert-warn') }, el('p', {}, el('strong', {}, `${r.pct} % de los puntos clave. `), nivel)),
        el('ul', { class: 'small' }, preguntas.map(p => el('li', {}, `${p.pregunta} — ${(marcadas[p.id] || []).length}/${p.claves.length}`))),
        el('p', { class: 'small muted' }, 'Consejos: practica en voz alta, con tiempo; prepara 3 o 4 historias STAR que sirvan para varias preguntas; y lleva ejemplos concretos de tus laboratorios y proyectos.'),
        el('div', { class: 'hero-cta' }, el('button', { type: 'button', class: 'btn btn-primary', onclick: empezar }, 'Otra entrevista (preguntas nuevas)'), el('a', { class: 'btn btn-ghost', href: 'cv.html' }, 'Preparar mi CV')));
    }
    pregunta();
  }
  portada();
}
