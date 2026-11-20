// Examen de entrada: pregunta qué sabes y, si ya tienes conocimientos, hace una prueba por bloques (uno por escalón) que
// convalida los escalones que dominas y te deja empezar en tu nivel. Todo se guarda como el progreso normal del curso.
import { iniciarPagina, el, $, local, toast } from '../core.js';
import { cargarCurso } from '../curso.js';
import { cargar, guardarQuiz, notaQuiz, registrarRespuestas } from '../progreso.js';
import { prepararPregunta } from '../quiz.js';
import { escaleraDe } from '../escalera-alumno.js';
import { bloquesNivel, superaBloque, puntoDePartida, POR_BLOQUE, MINIMO_BLOQUE } from '../nivel.js';
import { AREAS } from '../labs/catalogo.js';
import { textoInvisible, protegerCopia } from '../examen/integridad.js';
import { estadoAcceso } from '../premium.js';

await iniciarPagina();
const raiz = $('#nivel');
// Banco propio del examen de entrada (contenido/examen-entrada.md): preguntas técnicas que no salen de las lecciones.
const [curso, banco] = await Promise.all([cargarCurso(), fetch('data/entrada.json').then(r => r.json()), cargar()]);
const ICONO = { redes: '🌐', bd: '🗄️', prog: '💻', sec: '🛡️', ti: '🏢', en: '🇬🇧' };
const DESCR = {
  redes: 'Modelo OSI, subnetting, switching y VLAN, enrutamiento, OSPF, servicios IP, seguridad, nivel profesional y Fortinet.',
  sec: 'Tríada CIA y riesgo, hashes y cifrado, TLS, firewalls y DMZ, vulnerabilidades web, registros, SOC y respuesta a incidentes.',
  bd: 'Modelo relacional, SQL (de SELECT a funciones de ventana), transacciones, diseño, índices, seguridad y NoSQL.',
  prog: 'Ejecución y memoria, Python y JavaScript, colecciones, Git, POO, Linux, APIs, algoritmos y pruebas.',
  ti: 'ITIL y tickets, diagnóstico de Windows, PowerShell, hardware, Active Directory y averías.',
  en: 'Mensajes de error, RFC y documentación, tickets, llamadas y entrevistas en inglés.',
};
const ORDEN = ['redes', 'sec', 'bd', 'prog', 'ti', 'en'];
const NIVEL = ['', 'Fundamentos', 'Intermedio', 'Avanzado', 'Profesional'];
const resumenEsc = e => `${NIVEL[Math.min(...e.niveles)] || ''} · ${e.modulos.slice(0, 2).join(', ')}${e.modulos.length > 2 ? '…' : ''}`;
// Tras el examen de entrada (lo único gratis), quien no tiene plan ve claramente qué necesita para seguir.
const acceso = estadoAcceso();
async function ofertaPlan(texto) {
  const est = await acceso;
  if (est.acceso) return null;
  return el('div', { class: 'alert alert-plan' }, el('p', {}, el('strong', {}, '⭐ Siguiente paso: el plan completo. '), texto, ' Desde RD$ 499 al mes (o US$ 9), con un pago único y sin renovaciones automáticas.'),
    el('div', { class: 'hero-cta' }, el('a', { class: 'btn btn-primary btn-sm', href: 'precios.html' }, 'Ver planes y precios'),
      est.sesion ? el('a', { class: 'btn btn-ghost btn-sm', href: 'cuenta.html#plan' }, 'Tengo un código') : null));
}
const cabecera = (titulo, texto) => el('div', { class: 'page-head' }, el('span', { class: 'eyebrow' }, 'Examen de entrada'), el('h1', {}, titulo), texto ? el('p', {}, texto) : null);

// ------------------------------------------------------------------ 1. Elegir el área
function inicio() {
  raiz.replaceChildren(cabecera('Examen de entrada técnico', 'Una prueba por área, por bloques de dificultad creciente: cada bloque que superas convalida un escalón del curso y te dice desde dónde empezar. Es gratis.'),
    el('div', { class: 'card nivel-requisitos' },
      el('p', {}, el('strong', {}, 'Para quién es Loopback: '), 'personas que ya manejan la computadora a nivel intermedio (archivos, instalar programas, navegador, correo) y quieren formarse en tecnología. Si no conoces un área, su prueba te llevará a su primer escalón: ahí empiezan los fundamentos técnicos.'),
      el('ul', { class: 'plain-list small' },
        el('li', {}, `✓ Bloques de ${POR_BLOQUE} preguntas; hay que acertar ${MINIMO_BLOQUE} para superar cada uno.`),
        el('li', {}, '✓ Preguntas técnicas propias, con casos reales: salidas de consola, subredes, SQL, código y registros.'),
        el('li', {}, '✓ Sin tiempo límite. Si no sabes algo, presiona «No lo sé»: adivinar te llevaría a un nivel que no es el tuyo.'))),
    el('h2', {}, 'Elige el área que quieres estudiar'),
    el('div', { class: 'goal-grid nivel-areas' }, ORDEN.filter(a => AREAS[a]).map(a => el('button', { type: 'button', class: 'goal', onclick: () => explicar(a) },
      el('span', { class: 'goal-ico', 'aria-hidden': 'true' }, ICONO[a]), el('strong', {}, AREAS[a]), el('span', { class: 'small muted' }, DESCR[a])))),
    el('p', { class: 'small muted' }, 'Puedes hacer la prueba de varias áreas y repetirla cuando quieras.'));
  raiz.querySelector('.nivel-areas button')?.focus({ preventScroll: true });
}

// ------------------------------------------------------------------ 2. Explicación y prueba
function explicar(area) {
  const esc = escaleraDe(curso, area);
  const previo = local.get('aula:nivel:' + area, null);
  raiz.replaceChildren(cabecera(`Examen de entrada · ${AREAS[area]}`, `${esc.length} bloques de ${POR_BLOQUE} preguntas, uno por cada escalón del área, de más fácil a más difícil.`),
    el('div', { class: 'card' },
      el('ul', { class: 'plain-list' },
        el('li', {}, `✓ Cada bloque que superes (${MINIMO_BLOQUE} de ${POR_BLOQUE}) convalida ese escalón: sus lecciones quedan abiertas para repasar y pasas directamente al siguiente.`),
        el('li', {}, '✓ En cuanto falles un bloque, la prueba termina: ese es tu punto de partida.'),
        el('li', {}, '✓ Sin tiempo límite. Si no sabes algo, presiona «No lo sé».'),
        el('li', {}, '✓ Lo que ya tengas aprobado no se pierde nunca.')),
      previo ? el('p', { class: 'small muted' }, `La última vez (${new Date(previo.fecha).toLocaleDateString('es')}) superaste ${previo.superados} de ${esc.length} bloques.`) : null,
      el('div', { class: 'hero-cta' }, el('button', { type: 'button', class: 'btn btn-primary', onclick: () => prueba(area) }, 'Empezar la prueba'), el('button', { type: 'button', class: 'btn btn-ghost', onclick: inicio }, '‹ Volver'))));
}

function prueba(area) {
  const bloques = bloquesNivel(curso, banco, area);
  const esc = escaleraDe(curso, area);
  let b = 0, i = 0, aciertos = 0, superados = 0;
  const respuestas = [];
  const pintar = () => {
    const bl = bloques[b], q = prepararPregunta(bl.preguntas[i]);
    const totalPreg = bloques.reduce((n, x) => n + x.preguntas.length, 0), hechas = bloques.slice(0, b).reduce((n, x) => n + x.preguntas.length, 0) + i;
    const sig = el('button', { type: 'submit', class: 'btn btn-primary', disabled: true }, 'Siguiente');
    const noSe = el('button', { type: 'button', class: 'btn btn-ghost' }, 'No lo sé');
    const form = el('form', { class: 'question exam-q nivel-q' },
      el('fieldset', {}, el('legend', {}, q.q, textoInvisible(el), q.multiple ? ` (elige ${q.correct.length})` : ''),
        q.opciones.map((o, k) => el('label', { class: 'option' }, el('input', { type: q.multiple ? 'checkbox' : 'radio', name: 'r', value: String(k) }), el('span', {}, o.texto)))),
      el('div', { class: 'quiz-head' }, noSe, sig));
    form.addEventListener('change', () => { sig.disabled = !form.querySelector('input:checked'); });
    const responder = ok => {
      if (ok) aciertos++;
      respuestas.push({ id: q.id, ok });
      i++;
      if (i < bl.preguntas.length) return pintar();
      finBloque();
    };
    form.addEventListener('submit', e => { e.preventDefault(); const el2 = new Set([...form.querySelectorAll('input:checked')].map(x => +x.value)); responder(q.opciones.every((o, k) => o.correcta === el2.has(k))); });
    noSe.addEventListener('click', () => responder(false));
    raiz.replaceChildren(
      el('div', { class: 'nivel-cab' }, el('span', { class: 'eyebrow' }, `Examen de entrada · ${AREAS[area]}`),
        el('p', { class: 'small' }, el('strong', {}, `Bloque ${bl.n} de ${bloques.length}`), ` · ${resumenEsc(bl.escalon)}`),
        el('div', { class: 'meter' }, el('span', { class: 'nivel-fill' })), el('p', { class: 'small muted' }, `Pregunta ${i + 1} de ${bl.preguntas.length} de este bloque`)),
      form);
    raiz.querySelector('.nivel-fill').style.setProperty('--p', String(hechas / totalPreg));
    protegerCopia(form);
    form.querySelector('input')?.focus({ preventScroll: true });
  };
  const finBloque = async () => {
    const bl = bloques[b];
    const ok = superaBloque(aciertos);
    if (ok) {
      superados++;
      if (!notaQuiz(bl.escalon.examen)?.hecho) await guardarQuiz(bl.escalon.examen, aciertos, bl.preguntas.length);
      if (b + 1 < bloques.length) {
        raiz.replaceChildren(el('div', { class: 'card nivel-entre' }, el('p', { class: 'nivel-ok' }, `✓ Bloque ${bl.n} superado (${aciertos} de ${bl.preguntas.length})`),
          el('p', {}, `Escalón ${bl.n} convalidado. Sigue con el bloque ${bl.n + 1}: un poco más difícil.`),
          el('div', { class: 'hero-cta' }, el('button', { type: 'button', class: 'btn btn-primary', onclick: () => { b++; i = 0; aciertos = 0; pintar(); } }, `Bloque ${bl.n + 1} ›`),
            el('button', { type: 'button', class: 'btn btn-ghost', onclick: () => resultado(area, bloques, superados, respuestas) }, 'Parar aquí y ver mi resultado'))));
        raiz.querySelector('.btn-primary')?.focus({ preventScroll: true });
        return;
      }
    }
    resultado(area, bloques, superados, respuestas, ok ? null : { n: bl.n, aciertos, total: bl.preguntas.length });
  };
  pintar();
}

// ------------------------------------------------------------------ 3. Resultado
function resultado(area, bloques, superados, respuestas, fallo) {
  registrarRespuestas(respuestas, 'nivel');
  local.set('aula:nivel:' + area, { fecha: Date.now(), superados });
  const p = puntoDePartida(bloques, superados);
  // Quien supera todo el temario del CCNA empieza en el Nivel profesional (lecciones de nivel 4).
  const pro = !p.todo && p.leccion?.nivel === 4;
  const lista = el('ol', { class: 'nivel-escalones' }, bloques.map((bl, k) => el('li', { class: k < superados ? 'ok' : k === superados ? 'aqui' : null },
    el('span', {}, el('strong', {}, `Escalón ${bl.n}`), el('span', { class: 'small muted' }, ' · ' + resumenEsc(bl.escalon))), el('span', { class: 'small nivel-estado' }, k < superados ? 'convalidado ✓' : k === superados ? '← empiezas aquí' : ''))));
  const acciones = p.todo
    ? [el('a', { class: 'btn btn-primary', href: 'examen.html?final=' + area }, '🎓 Hacer el examen final del área'), el('a', { class: 'btn btn-ghost', href: 'curso.html?area=' + area }, 'Ver la escalera')]
    : [el('a', { class: 'btn btn-primary', href: 'leccion.html?id=' + p.leccion.id }, pro ? '🎓 Entrar al Nivel profesional ›' : `Empezar: ${p.leccion.titulo} ›`), el('a', { class: 'btn btn-ghost', href: 'curso.html?area=' + area }, 'Ver la escalera')];
  const texto = p.todo ? `Has superado todos los bloques de ${AREAS[area]}. Si apruebas el examen final, consigues el certificado del área.`
      : pro ? `Dominas el temario completo del CCNA: has convalidado los escalones 1 a ${superados}. Te llevamos al Nivel profesional: el día a día del trabajo en redes, con laboratorios de varias averías a la vez, cambios en producción, OSPF multiárea, BGP y automatización.`
      : superados ? `Has convalidado ${superados === 1 ? 'el escalón 1' : `los escalones 1 a ${superados}`}. Tu punto de partida es el escalón ${p.n}.`
        : `Te conviene empezar ${AREAS[area]} por su primer escalón, el de los fundamentos técnicos: así no te faltará ninguna base.`;
  ofertaPlan(p.todo ? 'Para hacer el examen final y conseguir el certificado necesitas el plan completo.' : 'Para seguir justo desde tu punto de partida, con lecciones, laboratorios y exámenes, necesitas el plan completo.')
    .then(o => { if (o) raiz.querySelector('.card')?.before(o); });
  raiz.replaceChildren(...[cabecera(`Tu resultado en ${AREAS[area]}`, texto),
    fallo ? el('p', { class: 'small muted' }, `En el bloque ${fallo.n} acertaste ${fallo.aciertos} de ${fallo.total} (hacían falta ${MINIMO_BLOQUE}). Lo que fallaste pasa a tu repaso.`) : null,
    el('div', { class: 'card' }, lista, el('div', { class: 'hero-cta' }, ...acciones)),
    el('p', { class: 'small muted' }, 'Los escalones convalidados quedan guardados en tu progreso. Puedes repetir esta prueba más adelante para avanzar más escalones.'),
    el('button', { type: 'button', class: 'btn btn-quiet', onclick: inicio }, 'Hacer la prueba de otra área')].filter(Boolean));
  if (superados) toast(`${superados} ${superados === 1 ? 'escalón convalidado' : 'escalones convalidados'}`);
}

const pedida = new URLSearchParams(location.search).get('area');
if (pedida && AREAS[pedida]) explicar(pedida); else inicio();
