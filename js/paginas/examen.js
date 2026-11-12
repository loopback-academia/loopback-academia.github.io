// Exámenes: el de cada escalón de la escalera (abre el escalón siguiente) y el examen final de cada área.
// Reglas: mínimo 80 %; cada intento elige preguntas que no salieron en los intentos anteriores y baraja las opciones;
// sin volver atrás y con cronómetro; si no se aprueba, NO se muestran las respuestas correctas (solo qué lecciones
// repasar), para que repetir el examen no sea copiar las respuestas.
import { iniciarPagina, el, $, setMeter, pct, plural, local } from '../core.js';
import { cargarCurso } from '../curso.js';
import { barajar, prepararPregunta, repartir } from '../quiz.js';
import { cargar, guardarExamen, guardarQuiz, registrarRespuestas, notaQuiz } from '../progreso.js';
import { aprueba, minimoPara, elegirPreguntas, bancoDe } from '../escalera.js';
import { escaleraDe, estadoArea, urlExamen, urlFinal, pasoSiguiente } from '../escalera-alumno.js';

iniciarPagina();
const raiz = $('#examen');
const [banco, curso] = await Promise.all([fetch('data/examen.json').then(r => r.json()), cargarCurso(), cargar()]);
const leccionDe = id => curso.lecciones.find(l => l.id === id.split('#')[0]);
const AREAS = { redes: 'Redes', bd: 'Bases de datos', prog: 'Programación', ti: 'Empleo TI' };
const ICONO = { redes: '🌐', bd: '🗄️', prog: '💻', ti: '🏢' };
const params = new URLSearchParams(location.search);

// Intentos anteriores de cada examen (ids de sus preguntas), para no repetirlas en el siguiente.
const intentos = clave => local.get('aula:intentos:' + clave, []);
const anotarIntento = (clave, ids) => local.set('aula:intentos:' + clave, [...intentos(clave), ids].slice(-2));
const minutos = n => Math.max(10, Math.ceil(n * 1.25));
const cabecera = (ceja, titulo, texto) => el('div', { class: 'page-head' }, el('span', { class: 'eyebrow' }, ceja), el('h1', {}, titulo), texto ? el('p', {}, texto) : null);

// ---------------------------------------------------------------- centro de exámenes
function centro() {
  const bloques = Object.entries(AREAS).map(([area, nombre]) => {
    const est = estadoArea(curso, area);
    const fila = (titulo, estado, href, nota) => el('li', { class: 'exam-row ' + estado },
      el('span', { class: 'exam-ico', 'aria-hidden': 'true' }, estado === 'aprobado' ? '✓' : estado === 'disponible' ? '▶' : '🔒'),
      el('span', {}, titulo, nota ? el('span', { class: 'small muted' }, ' · ' + nota) : null),
      estado === 'bloqueado' ? el('span', { class: 'small muted' }, 'Cerrado') : el('a', { class: 'btn btn-sm ' + (estado === 'disponible' ? 'btn-primary' : 'btn-ghost'), href }, estado === 'disponible' ? 'Hacer el examen' : 'Repetir'));
    const paso = pasoSiguiente(est);
    return el('section', { class: 'card mb' }, el('h2', {}, `${ICONO[area]} ${nombre}`),
      paso && paso.tipo === 'Lección' ? el('p', { class: 'small muted' }, 'Para llegar al próximo examen te faltan lecciones. Siguiente: ', el('a', { href: paso.href }, paso.texto), '.') : null,
      el('ul', { class: 'exam-list' },
        est.escalones.map(e => { const q = notaQuiz(e.examen); return fila(`Examen del escalón ${e.n}`, e.estadoExamen, urlExamen(e), q ? `mejor nota ${pct(q.puntos, q.total)} %` : `${e.tamano} preguntas`); }),
        (() => { const q = notaQuiz('final-' + area); return fila('Examen final del área', est.final, urlFinal(area), q ? `mejor nota ${pct(q.puntos, q.total)} %` : 'al terminar todos los escalones'); })()));
  });
  raiz.replaceChildren(cabecera('Exámenes', 'Tus exámenes', 'Cada examen se abre al completar el escalón anterior. Se aprueban con un 80 % y cada intento tiene preguntas distintas.'), ...bloques);
}

// ---------------------------------------------------------------- examen cerrado
function bloqueado(titulo, area) {
  const paso = pasoSiguiente(estadoArea(curso, area));
  raiz.replaceChildren(el('div', { class: 'locked-screen' }, el('div', { class: 'locked-ico', 'aria-hidden': 'true' }, '🔒'), el('h1', {}, titulo),
    el('p', {}, 'Este examen todavía está cerrado: se abre cuando completas todas las lecciones del escalón (y los escalones anteriores).'),
    paso ? el('p', {}, el('strong', {}, 'Tu siguiente paso: '), `${paso.tipo} · ${paso.texto}`) : null,
    el('div', { class: 'hero-cta' }, paso ? el('a', { class: 'btn btn-primary', href: paso.href }, 'Ir a mi siguiente paso →') : null, el('a', { class: 'btn btn-ghost', href: 'curso.html?area=' + area }, 'Ver la escalera'))));
}

// ---------------------------------------------------------------- portada del examen
function inicio({ titulo, ceja, descripcion, clave, tamanos, generar, alAprobar, area }) {
  const q = notaQuiz(clave);
  let n = tamanos[0];
  const lista = () => [el('li', {}, `${n} preguntas y ${minutos(n)} minutos. No se puede volver atrás.`), el('li', {}, `Apruebas con ${minimoPara(n)} correctas o más (80 %).`),
    el('li', {}, 'Cada intento tiene preguntas distintas a las del anterior.'), el('li', {}, 'Si no apruebas, no se muestran las respuestas: verás qué lecciones repasar.')];
  const reglas = el('ul', { class: 'exam-rules' }, lista());
  const selector = tamanos.length > 1 ? el('div', { class: 'field' }, el('label', { for: 'nPreg' }, 'Número de preguntas'),
    el('select', { id: 'nPreg' }, tamanos.map(t => el('option', { value: String(t) }, `${t} preguntas · ${minutos(t)} minutos`)))) : null;
  selector?.querySelector('select').addEventListener('change', e => { n = Number(e.target.value); reglas.replaceChildren(...lista()); });
  const btn = el('button', { type: 'button', class: 'btn btn-primary btn-lg' }, q ? 'Hacer el examen otra vez' : 'Empezar el examen');
  btn.addEventListener('click', () => jugar({ titulo, clave, preguntas: generar(n), alAprobar, area }));
  raiz.replaceChildren(cabecera(ceja, titulo, descripcion),
    el('div', { class: 'card' }, q ? el('p', { class: 'alert ' + (q.hecho ? 'alert-ok' : 'alert-info') + ' mb' }, el('span', {}, q.hecho ? `✓ Ya lo aprobaste (mejor nota ${pct(q.puntos, q.total)} %). Puedes repetirlo para mejorar: tendrá otras preguntas.` : `Tu mejor nota hasta ahora: ${pct(q.puntos, q.total)} %. Necesitas un 80 %.`)) : null,
      selector, reglas, btn));
}

// ---------------------------------------------------------------- el examen
function jugar({ titulo, clave, preguntas, alAprobar, area }) {
  anotarIntento(clave, preguntas.map(q => q.id)); // se anota al empezar: recargar la página no repite el examen
  const limite = minutos(preguntas.length) * 60;
  const inicioT = Date.now();
  const respuestas = [];
  let i = 0, terminado = false;
  const timer = el('span', { class: 'timer', 'aria-label': 'Tiempo restante' });
  const meter = el('div', { class: 'meter' }, el('span'));
  const contador = el('span', { class: 'small muted' });
  const caja = el('div', { class: 'card' });
  const salirAviso = e => { e.preventDefault(); e.returnValue = ''; };
  addEventListener('beforeunload', salirAviso);
  raiz.replaceChildren(el('p', { class: 'small muted' }, titulo), el('div', { class: 'exam-bar' }, contador, meter, timer), caja);
  const reloj = setInterval(tic, 1000);
  function tic() {
    const quedan = Math.max(0, limite - Math.floor((Date.now() - inicioT) / 1000));
    timer.textContent = `${Math.floor(quedan / 60)}:${String(quedan % 60).padStart(2, '0')}`;
    timer.classList.toggle('low', quedan < 120);
    if (!quedan) terminar();
  }
  tic();

  function pregunta() {
    const q = preguntas[i];
    contador.textContent = `Pregunta ${i + 1} de ${preguntas.length}`;
    setMeter(meter, i / preguntas.length);
    const siguiente = el('button', { type: 'submit', class: 'btn btn-primary', disabled: true }, i === preguntas.length - 1 ? 'Terminar' : 'Siguiente');
    const form = el('form', { class: 'question exam-q' }, el('fieldset', {},
      el('legend', {}, q.q + (q.multiple ? ` (elige ${q.correct.length})` : '')),
      q.opciones.map((o, k) => el('label', { class: 'option' }, el('input', { type: q.multiple ? 'checkbox' : 'radio', name: 'r', value: String(k) }), el('span', {}, o.texto)))),
      el('div', { class: 'quiz-head' }, el('span', { class: 'small muted' }, leccionDe(q.id)?.modulo.titulo || ''), siguiente));
    form.addEventListener('change', () => { siguiente.disabled = !form.querySelector('input:checked'); });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const elegidas = new Set([...form.querySelectorAll('input:checked')].map(x => Number(x.value)));
      respuestas[i] = q.opciones.every((o, k) => o.correcta === elegidas.has(k));
      i++;
      if (i < preguntas.length) pregunta(); else terminar();
    });
    caja.replaceChildren(form);
    form.querySelector('input').focus({ preventScroll: true });
  }

  async function terminar() {
    if (terminado) return;
    terminado = true;
    clearInterval(reloj);
    removeEventListener('beforeunload', salirAviso);
    const segundos = Math.round((Date.now() - inicioT) / 1000);
    const total = preguntas.length;
    const puntos = respuestas.filter(Boolean).length;
    const nota = pct(puntos, total);
    const ok = aprueba(puntos, total);
    const dominios = {};
    preguntas.forEach((q, k) => { const d = (dominios[q.modulo] ||= { p: 0, t: 0 }); d.t++; if (respuestas[k]) d.p++; });
    await guardarQuiz(clave, puntos, total);
    await guardarExamen({ puntos, total, dominios, segundos });
    registrarRespuestas(preguntas.map((q, k) => ({ id: q.id, ok: respuestas[k] })).filter((r, k) => k < respuestas.length), 'examen');
    // Lecciones con fallos (sin decir qué preguntas ni cuáles eran las respuestas si no se aprueba).
    const porLeccion = new Map();
    preguntas.forEach((q, k) => { if (!respuestas[k]) { const l = leccionDe(q.id); if (l) porLeccion.set(l.id, { l, n: (porLeccion.get(l.id)?.n || 0) + 1 }); } });
    const repasar = [...porLeccion.values()].sort((a, b) => b.n - a.n);
    const fallos = preguntas.map((q, k) => ({ q, ok: respuestas[k] })).filter(x => !x.ok);
    const despues = ok ? alAprobar?.() : null;
    raiz.replaceChildren(...[
      el('div', { class: 'page-head exam-result ' + (ok ? 'ok' : 'bad') }, el('span', { class: 'eyebrow' }, titulo), el('h1', {}, `${nota} %`),
        el('p', {}, `${puntos} de ${total} correctas (mínimo ${minimoPara(total)}) en ${plural(Math.max(1, Math.round(segundos / 60)), 'minuto', 'minutos')}. `,
          el('strong', {}, ok ? '¡Aprobado!' : 'No aprobado todavía.'))),
      ok
        ? el('div', { class: 'card' }, el('h2', {}, '¡Lo lograste!'), el('p', {}, despues?.texto || 'Has demostrado que dominas este tramo.'),
            despues ? el('a', { class: 'btn btn-primary', href: despues.href }, despues.boton) : null)
        : el('div', { class: 'card' }, el('h2', {}, 'Qué repasar antes del próximo intento'),
            el('p', { class: 'small muted' }, 'No mostramos las respuestas para que el próximo intento mida lo que sabes de verdad. El siguiente examen tendrá preguntas distintas.'),
            el('ul', { class: 'plain-list' }, repasar.map(({ l, n }) => el('li', {}, el('a', { href: 'leccion.html?id=' + l.id }, l.titulo), el('span', { class: 'small muted' }, ` · ${plural(n, 'fallo', 'fallos')}`))))),
      ok && fallos.length ? el('div', { class: 'card mt' }, el('h2', {}, 'Revisa lo que fallaste'), fallos.map(({ q }) => el('div', { class: 'question' },
        el('p', {}, el('strong', {}, q.q)),
        el('p', { class: 'small' }, 'Correcta: ', q.opciones.filter(o => o.correcta).map(o => o.texto).join(' · ')),
        el('p', { class: 'small muted' }, q.explain)))) : null,
      el('div', { class: 'hero-cta' }, ok ? null : el('a', { class: 'btn btn-primary', href: location.pathname + location.search }, 'Intentar de nuevo (preguntas nuevas)'),
        el('a', { class: 'btn btn-ghost', href: 'curso.html?area=' + area }, 'Volver a la escalera'), el('a', { class: 'btn btn-ghost', href: 'examen.html' }, 'Todos mis exámenes'))].filter(Boolean)); // replaceChildren escribiría «null» como texto
    scrollTo({ top: 0 });
  }
  pregunta();
}

// ---------------------------------------------------------------- modos
const escId = params.get('escalon');
const finalArea = params.get('final');
if (escId && AREAS[escId.split('-')[0]] && escaleraDe(curso, escId.split('-')[0]).some(e => e.id === escId)) {
  const area = escId.split('-')[0];
  const escalera = escaleraDe(curso, area);
  const esc = escalera.find(e => e.id === escId);
  const titulo = `Examen del escalón ${esc.n} · ${AREAS[area]}`;
  if (estadoArea(curso, area).escalones[esc.n - 1].estadoExamen === 'bloqueado') bloqueado(titulo, area);
  else {
    const pool = bancoDe(banco, esc.lecciones);
    const siguiente = escalera[esc.n];
    inicio({ titulo, ceja: `Escalón ${esc.n} de ${escalera.length}`, area, clave: esc.examen,
      descripcion: `Preguntas de las ${esc.lecciones.length} lecciones de este escalón (${esc.modulos.join(', ')}). Al aprobarlo se abre ${siguiente ? 'el escalón ' + siguiente.n : 'el examen final del área'}.`,
      tamanos: [esc.tamano],
      generar: n => elegirPreguntas(pool, n, intentos(esc.examen)).map(prepararPregunta),
      alAprobar: () => siguiente
        ? { texto: `Se ha abierto el escalón ${siguiente.n}. Sigue con su primera lección.`, href: 'leccion.html?id=' + siguiente.lecciones[0].id, boton: `Empezar el escalón ${siguiente.n} →` }
        : { texto: 'Has terminado todos los escalones del área. Te queda el examen final.', href: urlFinal(area), boton: 'Ir al examen final →' } });
  }
} else if (finalArea && AREAS[finalArea]) {
  const area = finalArea;
  const titulo = `Examen final · ${AREAS[area]}`;
  if (estadoArea(curso, area).final === 'bloqueado') bloqueado(titulo, area);
  else {
    const pool = banco.filter(q => q.area === area && !q.dup);
    const tope = Math.floor(pool.length / 2);
    const tamanos = [...new Set([20, 50, 100].filter(t => t <= tope).concat(tope < 50 ? [tope] : []))].sort((a, b) => a - b);
    // Redes: reparto según el peso de cada dominio del CCNA. Otras áreas: todos los módulos por igual.
    const pesos = Object.fromEntries(curso.modulos.filter(m => m.area === area && (area !== 'redes' || m.peso > 0)).map(m => [m.id, area === 'redes' ? m.peso : 1]));
    const porModulo = {};
    for (const q of pool) if (pesos[q.modulo]) (porModulo[q.modulo] ||= []).push(q);
    inicio({ titulo, ceja: 'Examen final del área', area, clave: 'final-' + area,
      descripcion: area === 'redes' ? 'Preguntas de todo el temario, repartidas con el peso de cada dominio del CCNA real.' : 'Preguntas de todos los módulos del área.',
      tamanos,
      generar: n => {
        const cupo = repartir(n, pesos, Object.fromEntries(Object.entries(porModulo).map(([k, v]) => [k, v.length])));
        const prev = intentos('final-' + area);
        return barajar(Object.entries(cupo).flatMap(([id, k]) => elegirPreguntas(porModulo[id], k, prev))).map(prepararPregunta);
      },
      alAprobar: () => ({ texto: '¡Has completado la escalera entera de esta área! Añádelo a tu portafolio y sigue con otra área o con una ruta de empleo.', href: 'rutas.html', boton: 'Ver las rutas de empleo →' }) });
  }
} else centro();
