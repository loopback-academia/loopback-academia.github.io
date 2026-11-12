// Panel del profesor: crear clases con un código, ver el progreso de los alumnos que se unen y exportarlo; y, para los
// alumnos, unirse a una clase o salir de ella. Toda la seguridad está en la base de datos (RLS y funciones que comprueban
// que quien pide los datos es el profesor de esa clase); aquí solo se muestra lo que la API devuelve.
import { iniciarPagina, el, $, toast } from '../core.js';
import { supabase, cuentasActivas, mensajeError } from '../auth.js';
import { cargarCurso } from '../curso.js';
import { CATALOGO } from '../labs/catalogo.js';
import { AREAS, resumenClase, csvClase, faltaMigracion } from '../profesor.js';

const usuario = await iniciarPagina();
const raiz = $('#profesor');
const sb = supabase();
let curso = null;

const fecha = iso => (iso ? new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const aviso = (clase, ...t) => el('div', { class: 'alert ' + clase }, el('p', {}, ...t));
function errorApi(err) {
  if (faltaMigracion(err)) {
    pintarSinMigracion();
    return true;
  }
  toast(mensajeError(err).replace(/^No se pudo completar la operación: /, ''));
  return false;
}
function pintarSinMigracion() {
  raiz.replaceChildren(el('div', { class: 'page-head' }, el('h1', {}, 'Panel del profesor')),
    aviso('alert-warn', el('strong', {}, 'El panel del profesor aún no está activado en esta instalación. '),
      'Quien administra Loopback debe ejecutar una vez el archivo ', el('code', {}, 'supabase/migrations/20261112000000_profesor.sql'),
      ' en Supabase → SQL Editor (los pasos están en docs/CONFIGURAR.md).'));
}

if (!cuentasActivas()) {
  raiz.replaceChildren(el('div', { class: 'page-head' }, el('h1', {}, 'Panel del profesor')), aviso('alert-info', 'Las cuentas no están activadas en esta instalación de Loopback, así que no se pueden crear clases.'));
} else if (!usuario) {
  raiz.replaceChildren(el('div', { class: 'page-head' }, el('h1', {}, 'Panel del profesor'), el('p', {}, 'Crea una clase, comparte su código y sigue el progreso de tus alumnos: lecciones, prácticas y exámenes de cada área.')),
    el('div', { class: 'card' }, el('p', {}, 'Para crear una clase o unirte a una necesitas una cuenta gratuita.'), el('a', { class: 'btn btn-primary', href: 'cuenta.html' }, 'Entrar o crear cuenta')));
} else {
  inicio();
}

// ------------------------------------------------------------------ página principal
async function inicio() {
  const [mias, unidas] = await Promise.all([
    sb.from('clases').select('id, nombre, codigo, creada').eq('profesor', usuario.id).order('creada', { ascending: true }),
    sb.from('clase_miembros').select('clase_id, alias, unida').eq('user_id', usuario.id),
  ]);
  if (mias.error || unidas.error) { if (!errorApi(mias.error || unidas.error)) raiz.replaceChildren(aviso('alert-warn', 'No se pudieron cargar tus clases. Recarga la página.')); return; }
  let nombres = new Map();
  if (unidas.data.length) {
    const r = await sb.from('clases').select('id, nombre').in('id', unidas.data.map(m => m.clase_id));
    if (!r.error) nombres = new Map(r.data.map(c => [c.id, c.nombre]));
  }
  const cuenta = new Map();
  if (mias.data.length) {
    const r = await sb.from('clase_miembros').select('clase_id').in('clase_id', mias.data.map(c => c.id));
    if (!r.error) r.data.forEach(m => cuenta.set(m.clase_id, (cuenta.get(m.clase_id) || 0) + 1));
  }

  // Profesor: crear y listar clases
  const idNombre = 'nueva-clase';
  const inNombre = el('input', { id: idNombre, type: 'text', class: 'input', maxlength: 80, placeholder: 'Ej.: 2.º de Redes · turno de tarde', autocomplete: 'off' });
  const btnCrear = el('button', { type: 'submit', class: 'btn btn-primary' }, 'Crear clase');
  const formCrear = el('form', { class: 'prof-form' }, el('label', { for: idNombre, class: 'small' }, 'Nombre de la clase'), el('div', { class: 'prof-fila' }, inNombre, btnCrear));
  formCrear.addEventListener('submit', async e => {
    e.preventDefault();
    if (!inNombre.value.trim()) { inNombre.focus(); return; }
    btnCrear.disabled = true;
    const { data, error } = await sb.rpc('crear_clase', { p_nombre: inNombre.value.trim() });
    btnCrear.disabled = false;
    if (error) { errorApi(error); return; }
    toast(`Clase creada. Código: ${data.codigo}`);
    inicio();
  });
  const tarjetas = mias.data.map(c => {
    const copiar = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, 'Copiar código');
    copiar.addEventListener('click', async () => { try { await navigator.clipboard.writeText(c.codigo); toast('Código copiado'); } catch { toast('Cópialo a mano: ' + c.codigo); } });
    const borrar = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Borrar');
    borrar.addEventListener('click', async () => {
      if (!confirm(`¿Borrar la clase «${c.nombre}»? Sus alumnos dejarán de estar en ella (su progreso no se borra).`)) return;
      const { error } = await sb.from('clases').delete().eq('id', c.id);
      if (error) errorApi(error); else { toast('Clase borrada'); inicio(); }
    });
    const n = cuenta.get(c.id) || 0;
    return el('article', { class: 'card prof-clase' },
      el('div', { class: 'prof-clase-cab' }, el('h3', {}, c.nombre), el('span', { class: 'badge' }, n === 1 ? '1 alumno' : `${n} alumnos`)),
      el('p', { class: 'small muted' }, 'Código para tus alumnos:'), el('p', { class: 'prof-codigo', 'aria-label': 'Código ' + c.codigo.split('').join(' ') }, c.codigo.slice(0, 5) + '-' + c.codigo.slice(5)),
      el('div', { class: 'hero-cta' }, el('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: () => abrirClase(c) }, 'Ver el progreso'), copiar, borrar));
  });

  // Alumno: unirse y listar
  const ids = ['cod-clase', 'alias-clase', 'acepto-clase'];
  const inCodigo = el('input', { id: ids[0], type: 'text', class: 'input mono', maxlength: 14, placeholder: 'ABCDE-FGHJK', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false' });
  const inAlias = el('input', { id: ids[1], type: 'text', class: 'input', maxlength: 40, value: usuario.nombre || '', autocomplete: 'name' });
  const acepto = el('input', { id: ids[2], type: 'checkbox' });
  const btnUnir = el('button', { type: 'submit', class: 'btn btn-primary' }, 'Unirme');
  const formUnir = el('form', { class: 'prof-form' },
    el('div', { class: 'prof-grid2' },
      el('div', {}, el('label', { for: ids[0], class: 'small' }, 'Código de la clase'), inCodigo),
      el('div', {}, el('label', { for: ids[1], class: 'small' }, 'Tu nombre para el profesor'), inAlias)),
    el('label', { class: 'prof-acepto small', for: ids[2] }, acepto, ' Entiendo que el profesor de esta clase verá mi progreso en Loopback (lecciones, prácticas, notas de los exámenes y días de actividad) junto al nombre que he escrito. No verá mi correo. Puedo salir de la clase cuando quiera.'),
    btnUnir);
  formUnir.addEventListener('submit', async e => {
    e.preventDefault();
    if (!inCodigo.value.trim()) { inCodigo.focus(); return; }
    if (!inAlias.value.trim()) { inAlias.focus(); return; }
    if (!acepto.checked) { toast('Marca la casilla para confirmar que lo entiendes.'); acepto.focus(); return; }
    btnUnir.disabled = true;
    const { data, error } = await sb.rpc('unirse_a_clase', { p_codigo: inCodigo.value, p_alias: inAlias.value.trim() });
    btnUnir.disabled = false;
    if (error) { errorApi(error); return; }
    toast(`Te has unido a «${data?.[0]?.nombre || 'la clase'}».`);
    inicio();
  });
  const misClases = unidas.data.map(m => {
    const salirB = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Salir de la clase');
    salirB.addEventListener('click', async () => {
      if (!confirm('¿Salir de esta clase? El profesor dejará de ver tu progreso.')) return;
      const { error } = await sb.from('clase_miembros').delete().eq('clase_id', m.clase_id).eq('user_id', usuario.id);
      if (error) errorApi(error); else { toast('Has salido de la clase'); inicio(); }
    });
    return el('li', { class: 'prof-mia' }, el('span', {}, el('strong', {}, nombres.get(m.clase_id) || 'Clase'), el('span', { class: 'small muted' }, ` · como «${m.alias}» desde el ${fecha(m.unida)}`)), salirB);
  });

  raiz.replaceChildren(
    el('div', { class: 'page-head' }, el('h1', {}, 'Clases'), el('p', {}, 'Si enseñas, crea una clase y comparte su código: verás el progreso de cada alumno por área. Si estudias con un profesor, únete con el código que te dé.')),
    el('section', { class: 'prof-seccion', 'aria-labelledby': 'tit-prof' }, el('h2', { id: 'tit-prof' }, 'Soy profesor'), formCrear,
      tarjetas.length ? el('div', { class: 'grid-3 prof-clases' }, tarjetas) : el('p', { class: 'muted' }, 'Todavía no has creado ninguna clase.')),
    el('section', { class: 'prof-seccion', 'aria-labelledby': 'tit-alumno' }, el('h2', { id: 'tit-alumno' }, 'Soy alumno'), formUnir,
      misClases.length ? el('ul', { class: 'prof-mias' }, misClases) : el('p', { class: 'muted small' }, 'No estás en ninguna clase.')));
}

// ------------------------------------------------------------------ progreso de una clase
async function abrirClase(c) {
  raiz.replaceChildren(el('p', { class: 'muted' }, 'Cargando el progreso de la clase…'));
  const [cur, r] = await Promise.all([curso || cargarCurso(), sb.rpc('progreso_de_clase', { p_clase: c.id })]);
  curso = cur;
  if (r.error) { if (!errorApi(r.error)) inicio(); return; }
  const resumen = resumenClase(curso, CATALOGO, r.data || []);
  let area = 'redes';
  const tabla = el('div', { class: 'table-wrap' });
  const selArea = el('select', { id: 'area-clase', 'aria-label': 'Área' }, Object.entries(AREAS).map(([k, v]) => el('option', { value: k }, v)));
  selArea.addEventListener('change', () => { area = selArea.value; pintar(); });
  const barra = (n, t) => el('div', { class: 'prof-barra', title: `${n} de ${t}` }, el('div', { class: 'meter' }, el('span', { class: 'meter-fill', dataset: { p: String(t ? n / t : 0) } })), el('span', { class: 'small' }, `${n}/${t}`));
  function pintar() {
    const t = resumen.totales[area];
    const filas = resumen.alumnos.map(al => {
      const x = al.areas[area];
      const quitar = el('button', { type: 'button', class: 'btn btn-quiet btn-sm', 'aria-label': `Quitar a ${al.alias} de la clase` }, 'Quitar');
      quitar.addEventListener('click', async () => {
        if (!confirm(`¿Quitar a «${al.alias}» de la clase? Su progreso no se borra.`)) return;
        const { error } = await sb.from('clase_miembros').delete().eq('clase_id', c.id).eq('user_id', al.id);
        if (error) errorApi(error); else { toast('Alumno quitado'); abrirClase(c); }
      });
      return el('tr', {},
        el('th', { scope: 'row' }, al.alias, el('span', { class: 'small muted prof-sub' }, `desde ${fecha(al.unida)}`)),
        el('td', {}, barra(x.lecciones, t.lecciones)), el('td', {}, barra(x.labs, t.labs)), el('td', {}, `${x.escalones}/${t.escalones}`),
        el('td', {}, x.final ? el('span', { class: 'badge badge-ok' }, `✓ ${x.notaFinal} %`) : x.notaFinal != null ? el('span', { class: 'badge' }, `${x.notaFinal} %`) : '—'),
        el('td', {}, al.ultima ? fecha(al.ultima) : 'sin actividad', el('span', { class: 'small muted prof-sub' }, al.dias ? `${al.dias} días activos` : '')),
        el('td', {}, quitar));
    });
    tabla.replaceChildren(resumen.alumnos.length
      ? el('table', { class: 'table prof-tabla' },
        el('thead', {}, el('tr', {}, el('th', {}, 'Alumno'), el('th', {}, 'Lecciones'), el('th', {}, 'Prácticas'), el('th', {}, 'Escalones'), el('th', {}, 'Examen final'), el('th', {}, 'Última actividad'), el('th', {}, el('span', { class: 'sr-only' }, 'Acciones')))),
        el('tbody', {}, filas))
      : el('p', { class: 'muted prof-vacio' }, `Todavía no se ha unido nadie. Comparte el código ${c.codigo.slice(0, 5)}-${c.codigo.slice(5)} con tus alumnos.`));
    tabla.querySelectorAll('.meter-fill').forEach(m => m.style.setProperty('--p', m.dataset.p));
  }
  const exportar = el('button', { type: 'button', class: 'btn btn-ghost btn-sm', disabled: !resumen.alumnos.length }, 'Descargar CSV');
  exportar.addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([csvClase(resumen)], { type: 'text/csv;charset=utf-8' }));
    const a = el('a', { href: url, download: `clase-${c.nombre.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'loopback'}.csv` });
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  const medias = Object.keys(AREAS).map(a => { const t = resumen.totales[a]; const n = resumen.alumnos.length; const m = n ? resumen.alumnos.reduce((s, al) => s + al.areas[a].lecciones, 0) / n : 0; return [a, t.lecciones ? Math.round((m / t.lecciones) * 100) : 0]; });
  raiz.replaceChildren(
    el('p', { class: 'small' }, el('a', { href: '#', onclick: e => { e.preventDefault(); inicio(); } }, '‹ Todas las clases')),
    el('div', { class: 'page-head' }, el('h1', {}, c.nombre), el('p', {}, `${resumen.alumnos.length === 1 ? '1 alumno' : resumen.alumnos.length + ' alumnos'} · código `, el('strong', { class: 'mono' }, c.codigo.slice(0, 5) + '-' + c.codigo.slice(5)))),
    el('div', { class: 'prof-medias' }, medias.map(([a, p]) => el('div', { class: 'card prof-media' }, el('span', { class: 'small muted' }, AREAS[a]), el('strong', {}, `${p} %`), el('span', { class: 'small muted' }, 'de lecciones de media')))),
    el('div', { class: 'prof-herr' }, el('label', { for: 'area-clase', class: 'small' }, 'Área: '), selArea, exportar),
    tabla,
    el('p', { class: 'small muted' }, 'Solo ves a quien se ha unido con el código y ha aceptado compartir su progreso. Cualquiera puede salir de la clase cuando quiera.'));
  pintar();
}
