// Página de lección: contenido, elementos interactivos, cuestionario, navegación y buscador del curso.
import { iniciarPagina, el, $, toast } from '../core.js';
import { cargarCurso, buscarLeccion, numeroModulo } from '../curso.js';
import { renderBlocks } from '../render.js';
import { cargarGlosario, marcarTerminos, terminosDeArea } from '../glosario.js';
import { montarQuiz } from '../quiz.js';
import { crearBuscador } from '../buscador.js';
import { cargar, alCambiar, completarLeccion, guardarQuiz, leccionHecha, notaQuiz, registrarRespuestas } from '../progreso.js';
import { aprueba } from '../escalera.js';
import { estadoArea, pasoSiguiente, despuesDe, escalonDe, urlExamen, rutaArea } from '../escalera-alumno.js';

iniciarPagina();
const box = $('#leccion');
const id = new URLSearchParams(location.search).get('id') || 'm0-curso';
const curso = await cargarCurso().catch(() => null);
const r = curso && buscarLeccion(curso, id);
await cargar();


function nav() {
  const m = r.leccion.modulo;
  $('#nav').replaceChildren(
    el('p', { class: 'small' }, el('a', { href: 'curso.html' }, '‹ Todo el curso')),
    el('h2', {}, `Módulo ${numeroModulo(m)} · ${m.titulo}`),
    el('ul', { class: 'lesson-list' }, m.lecciones.map(l => {
      const abierta = estadoArea(curso, m.area).accesible(l.id);
      const marca = el('span', { class: 'check' + (leccionHecha(l.id) ? ' on' : notaQuiz(l.id) ? ' half' : ''), 'aria-hidden': 'true' }, abierta ? '✓' : '🔒');
      return el('li', {}, abierta
        ? el('a', { class: 'lesson-link', href: 'leccion.html?id=' + l.id, 'aria-current': l.id === id ? 'page' : null }, marca, el('span', {}, l.titulo))
        : el('span', { class: 'lesson-link locked', title: 'Se abre al completar los pasos anteriores' }, marca, el('span', {}, l.titulo)));
    })));
}

if (!r) {
  box.replaceChildren(el('h1', {}, 'Lección no encontrada'), el('p', { class: 'muted' }, 'Puede que el enlace esté mal.'), el('a', { class: 'btn btn-primary', href: 'curso.html' }, 'Ir al curso'));
} else if (!estadoArea(curso, r.leccion.modulo.area).accesible(r.leccion.id)) {
  // Lección todavía cerrada: se explica por qué y se lleva al paso que toca.
  const est = estadoArea(curso, r.leccion.modulo.area);
  const paso = pasoSiguiente(est);
  const e = escalonDe(curso, r.leccion);
  nav();
  document.title = `${r.leccion.titulo} · Loopback`;
  box.replaceChildren(el('div', { class: 'locked-screen' },
    el('div', { class: 'locked-ico', 'aria-hidden': 'true' }, '🔒'),
    el('h1', {}, r.leccion.titulo),
    el('p', {}, `Esta lección está en el escalón ${e.n} de la escalera y todavía está cerrada. En Loopback se avanza paso a paso: cada lección se abre al aprobar la anterior con un 80 %, y cada escalón al aprobar el examen del escalón anterior.`),
    paso ? el('p', {}, el('strong', {}, 'Tu siguiente paso: '), `${paso.tipo} · ${paso.texto}`) : null,
    el('div', { class: 'hero-cta' }, paso ? el('a', { class: 'btn btn-primary', href: paso.href }, 'Ir a mi siguiente paso →') : null, el('a', { class: 'btn btn-ghost', href: 'curso.html?area=' + r.leccion.modulo.area }, 'Ver la escalera'))));
} else {
  const { leccion } = r;
  const ruta = rutaArea(curso, leccion.modulo.area);
  const anterior = ruta[ruta.findIndex(l => l.id === leccion.id) - 1] || null;
  // Lo siguiente en la escalera: la próxima lección del escalón o su examen.
  const despues = despuesDe(curso, leccion);
  const siguiente = despues.tipo === 'leccion' ? despues.leccion : null;
  document.title = `${leccion.titulo} · Loopback`;
  nav();
  alCambiar(nav);
  const hecha = () => leccionHecha(leccion.id);
  const btnHecha = el('button', { type: 'button', class: 'btn btn-ghost' });
  // Una lección solo se completa aprobando su cuestionario (no hay botón para saltárselo).
  const pintarBoton = () => { btnHecha.textContent = hecha() ? '✓ Lección completada' : 'Aprueba el cuestionario para completarla'; btnHecha.disabled = true; };
  pintarBoton();

  const prose = el('div', { class: 'prose' });
  prose.append(renderBlocks(leccion.blocks, { leccion }));
  cargarGlosario().then(g => marcarTerminos(prose, terminosDeArea(g, leccion.modulo.area)));
  const quizBox = el('div');
  box.replaceChildren(...[
    el('header', { class: 'lesson-head' },
      el('div', { class: 'crumbs' }, `Módulo ${numeroModulo(leccion.modulo)} · ${leccion.modulo.titulo}`),
      el('h1', {}, leccion.titulo),
      el('div', { class: 'meta' }, el('span', { class: 'badge level-' + ['principiante', 'intermedio', 'avanzado'][leccion.nivel - 1] }, 'Nivel ' + leccion.nivel + ' · ' + ['Principiante', 'Intermedio', 'Avanzado'][leccion.nivel - 1]), el('span', { class: 'badge' }, leccion.minutos + ' min'), leccion.modulo.peso ? el('span', { class: 'badge badge-accent' }, 'CCNA ' + leccion.modulo.dominio.split(' ')[0]) : null, hecha() ? el('span', { class: 'badge badge-ok' }, 'Completada') : null)),
    hecha() ? null : el('p', { class: 'lesson-hint' }, el('span', { 'aria-hidden': 'true' }, '💡 '), 'Lee la lección con calma y responde el ', el('strong', {}, 'cuestionario del final'), ': con un 80 % o más la lección queda completada y se abre la siguiente.'),
    prose, quizBox,
    el('nav', { class: 'lesson-actions', 'aria-label': 'Lecciones' },
      anterior ? el('a', { class: 'btn btn-quiet', href: 'leccion.html?id=' + anterior.id }, '‹ ' + anterior.titulo) : el('span'),
      btnHecha,
      siguiente ? el('a', { class: 'btn btn-primary', href: 'leccion.html?id=' + siguiente.id }, siguiente.titulo + ' ›') : el('a', { class: 'btn btn-primary', href: urlExamen(despues.escalon) }, `Examen del escalón ${despues.escalon.n} ›`))].filter(Boolean));

  if (leccion.quiz?.length) {
    montarQuiz(quizBox, leccion.quiz.map((q, i) => ({ ...q, id: `${leccion.id}#${i}` })), {
      anterior: notaQuiz(leccion.id),
      alTerminar: async (aciertos, total, detalle) => {
        registrarRespuestas(detalle, 'leccion');
        const falladas = detalle.filter(d => !d.ok).length;
        if (falladas) quizBox.querySelector('.quiz-result')?.append(' ', el('a', { href: 'repaso.html?leccion=' + leccion.id }, `${falladas === 1 ? 'La que has fallado se ha añadido' : `Las ${falladas} que has fallado se han añadido`} a tu repaso →`));
        await guardarQuiz(leccion.id, aciertos, total);
        if (aprueba(aciertos, total) && !hecha()) { await completarLeccion(leccion.id); pintarBoton(); toast('¡Aprobado! Lección completada.'); }
        if (aprueba(aciertos, total)) quizBox.querySelector('.quiz-result')?.after(el('div', { class: 'next-step' }, el('span', {}, el('strong', {}, '¡Bien hecho! '), 'Siguiente paso:'),
          siguiente ? el('a', { class: 'btn btn-primary', href: 'leccion.html?id=' + siguiente.id }, siguiente.titulo + ' →') : el('a', { class: 'btn btn-primary', href: urlExamen(despues.escalon) }, `Examen del escalón ${despues.escalon.n} →`)));
      },
    });
  }
  crearBuscador({ leccion: { id: leccion.id } });
}
