// Panel de administración: solo cifras agregadas de toda la plataforma (nunca correos ni datos de un alumno concreto).
// La seguridad está en el servidor: admin_estadisticas() exige estar en la tabla administradores y una sesión con la
// verificación en dos pasos completada (aal2). Esta página solo muestra lo que devuelve.
import { iniciarPagina, el, $, setMeter } from '../core.js';
import { supabase, cuentasActivas } from '../auth.js';
import { faltaMigracion } from '../profesor.js';

const usuario = await iniciarPagina();
const raiz = $('#admin');
const AREAS = { base: 'Empieza aquí', redes: 'Redes', bd: 'Bases de datos', prog: 'Programación', ti: 'Empleo TI', en: 'Inglés técnico', sec: 'Ciberseguridad' };
const num = n => (n ?? 0).toLocaleString('es');
const pctTxt = (a, b) => (b ? Math.round((a / b) * 100) + ' %' : '—');
const cabecera = (...extra) => el('div', { class: 'page-head' }, el('span', { class: 'eyebrow' }, 'Administración'), el('h1', {}, 'Estadísticas de Loopback'), ...extra);
const aviso = (clase, ...t) => el('div', { class: 'alert ' + clase }, el('p', {}, ...t));

function tile(valor, etiqueta, nota) {
  return el('div', { class: 'card stat admin-tile' }, el('strong', {}, num(valor)), el('span', {}, etiqueta), nota ? el('span', { class: 'small muted' }, nota) : null);
}

// Barras verticales de una sola serie (altas por semana): un único color, sin leyenda; el valor aparece al pasar el
// cursor o al enfocar cada barra, y hay una tabla equivalente para lectores de pantalla.
function barrasSemana(filas) {
  if (!filas.length) return el('p', { class: 'muted' }, 'Todavía no hay registros en las últimas 12 semanas.');
  const max = Math.max(...filas.map(f => f.n), 1);
  const fecha = d => new Date(d + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' });
  const grafico = el('div', { class: 'admin-barras', role: 'img', 'aria-label': 'Altas por semana: ' + filas.map(f => `${fecha(f.semana)}, ${f.n}`).join('; ') },
    filas.map(f => {
      const barra = el('span', { class: 'admin-barra', tabindex: '0', 'data-valor': `${num(f.n)} altas · semana del ${fecha(f.semana)}` });
      barra.style.setProperty('--h', String(f.n / max));
      return el('div', { class: 'admin-col' }, barra, el('span', { class: 'admin-eje' }, fecha(f.semana)));
    }));
  const tabla = el('details', { class: 'small mt' }, el('summary', {}, 'Ver como tabla'),
    el('table', {}, el('thead', {}, el('tr', {}, el('th', { scope: 'col' }, 'Semana'), el('th', { scope: 'col' }, 'Altas'))),
      el('tbody', {}, filas.map(f => el('tr', {}, el('td', {}, fecha(f.semana)), el('td', {}, num(f.n)))))));
  return el('div', {}, grafico, tabla);
}

function barraCelda(valor, max, texto) {
  const m = el('div', { class: 'meter admin-meter' }, el('span'));
  setMeter(m, max ? valor / max : 0);
  return el('td', {}, el('span', {}, texto ?? num(valor)), m);
}

function pintar(e) {
  const u = e.usuarios || {};
  const areas = Object.keys(AREAS);
  const maxLec = Math.max(1, ...areas.map(a => e.areas?.[a]?.lecciones || 0));
  const banco = e.banco || {};
  const pocas = areas.filter(a => (banco[a] || 0) < 25);
  const actualizar = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, '↻ Actualizar');
  actualizar.addEventListener('click', cargar);
  raiz.replaceChildren(...[
    cabecera(el('p', {}, 'Cifras agregadas de toda la plataforma. No se muestra ningún dato que identifique a un alumno.'),
      el('p', { class: 'small muted' }, `Actualizado: ${new Date(e.generado).toLocaleString('es')} `, actualizar)),
    el('div', { class: 'admin-tiles' },
      tile(u.total, 'alumnos registrados'), tile(u.nuevos_7, 'altas en 7 días', `${num(u.nuevos_30)} en 30 días`),
      tile(u.activos_7, 'activos en 7 días', `${num(u.activos_30)} en 30 días`), tile(u.con_mfa, 'con verificación en dos pasos', pctTxt(u.con_mfa, u.total) + ' del total')),
    el('section', { class: 'card mt' }, el('h2', {}, 'Altas por semana'), el('p', { class: 'small muted' }, 'Últimas 12 semanas.'), barrasSemana(e.registros_semana || [])),
    el('section', { class: 'card mt' }, el('h2', {}, 'Áreas y exámenes finales oficiales'),
      el('div', { class: 'table-wrap' }, el('table', { class: 'admin-tabla' },
        el('thead', {}, el('tr', {}, ['Área', 'Lecciones completadas', 'Alumnos', 'Intentos del final', 'Aprobados', 'Nota media', 'Certificados', 'Preguntas en el banco'].map(t => el('th', { scope: 'col' }, t)))),
        el('tbody', {}, areas.map(a => {
          const f = e.finales?.[a] || {};
          return el('tr', {}, el('th', { scope: 'row' }, AREAS[a]), barraCelda(e.areas?.[a]?.lecciones || 0, maxLec), el('td', {}, num(e.areas?.[a]?.alumnos)),
            el('td', {}, num(f.intentos)), el('td', {}, f.intentos ? `${num(f.aprobados)} (${pctTxt(f.aprobados, f.intentos)})` : '—'),
            el('td', {}, f.nota_media != null ? f.nota_media + ' %' : '—'), el('td', {}, num(e.certificados?.[a])),
            el('td', { class: (banco[a] || 0) < 25 ? 'admin-falta' : null }, num(banco[a])));
        })))),
      pocas.length ? aviso('alert-warn', `Áreas con menos de 25 preguntas activas en el banco privado (cada examen usa 25): ${pocas.map(a => AREAS[a]).join(', ')}. Carga el archivo de preguntas en Supabase.`) : null),
    el('div', { class: 'grid-2 mt' },
      el('section', { class: 'card' }, el('h2', {}, 'Simulacros de examen'),
        el('p', {}, `${num(e.simulacros?.total)} simulacros de ${num(e.simulacros?.alumnos)} alumnos. Nota media: ${e.simulacros?.nota_media != null ? e.simulacros.nota_media + ' %' : '—'}.`)),
      el('section', { class: 'card' }, el('h2', {}, 'Clases'),
        el('p', {}, `${num(e.clases?.total)} clases creadas por profesores, con ${num(e.clases?.alumnos)} alumnos inscritos.`))),
    el('section', { class: 'card mt' }, el('h2', {}, 'Preguntas del examen final que más se fallan'),
      el('p', { class: 'small muted' }, 'Solo preguntas con 5 respuestas o más. Si una se falla casi siempre, revisa si está bien redactada o si falta explicar ese tema en las lecciones.'),
      (e.preguntas_dificiles || []).length
        ? el('ol', { class: 'admin-dificiles' }, e.preguntas_dificiles.map(p => el('li', {},
            el('p', {}, p.pregunta), el('p', { class: 'small muted' }, `${AREAS[p.area] || p.area} · ${p.id} · falla el ${pctTxt(p.fallos, p.respuestas)} (${num(p.fallos)} de ${num(p.respuestas)})`))))
        : el('p', { class: 'muted' }, 'Aún no hay suficientes respuestas.')),
  ].filter(Boolean));
}

async function cargar() {
  const { data, error } = await supabase().rpc('admin_estadisticas');
  if (error) {
    const m = error.message || '';
    if (faltaMigracion(error)) raiz.replaceChildren(cabecera(), aviso('alert-warn', 'El panel aún no está activado: ejecuta ', el('code', {}, 'supabase/migrations/20261116000000_finales.sql'), ' en Supabase → SQL Editor.'));
    else if (/dos pasos/i.test(m)) raiz.replaceChildren(cabecera(), aviso('alert-warn', m.replace(/^.*?El panel/, 'El panel'), ' ', el('a', { href: 'cuenta.html' }, 'Ir a Tu cuenta')));
    else if (/No autorizado/i.test(m)) raiz.replaceChildren(cabecera(), aviso('alert-info', 'Esta página es solo para la administración de Loopback.'));
    else raiz.replaceChildren(cabecera(), aviso('alert-warn', 'No se pudieron cargar las estadísticas. Recarga la página.'));
    return;
  }
  pintar(data);
}

if (!cuentasActivas()) raiz.replaceChildren(cabecera(), aviso('alert-info', 'Las cuentas no están activadas en esta instalación.'));
else if (!usuario) raiz.replaceChildren(cabecera(), el('div', { class: 'card' }, el('p', {}, 'Entra con tu cuenta de administración.'), el('a', { class: 'btn btn-primary', href: 'cuenta.html' }, 'Entrar')));
else cargar();
