// Constructor de CV técnico: formulario + vista previa en vivo. Los datos personales se guardan solo en este navegador.
import { iniciarPagina, el, $, local } from '../core.js';
import { cargarCurso } from '../curso.js';
import { cargar, leccionHecha, labHecho } from '../progreso.js';
import { CATALOGO } from '../labs/catalogo.js';
import { estadoArea } from '../escalera-alumno.js';
import { datosCv, resumenSugerido } from '../ti/cv.js';
import { TITULO_AREA } from '../certificado.js';

const usuario = await iniciarPagina();
const [curso] = await Promise.all([cargarCurso(), cargar()]);
const raiz = $('#cv');
const CLAVE = 'aula:cv';
const datos = datosCv({ curso, catalogo: CATALOGO, leccionHecha, labHecho, finalAprobado: a => estadoArea(curso, a).final === 'aprobado' });
const guardado = local.get(CLAVE, {});
const v = {
  nombre: usuario?.nombre || '', titular: 'Técnico de soporte TI', ciudad: '', telefono: '', correo: usuario?.email || '', enlace: '',
  resumen: '', experiencia: '', estudios: '', idiomas: 'Español (nativo)', extra: '', practicas: true, formacion: true,
  ...guardado,
};
if (!v.resumen) v.resumen = resumenSugerido(datos, v.titular);

const CAMPOS = [
  ['nombre', 'Nombre y apellidos', 'input'], ['titular', 'Puesto al que aspiras', 'input'], ['ciudad', 'Ciudad', 'input'], ['telefono', 'Teléfono', 'input'],
  ['correo', 'Correo', 'input'], ['enlace', 'LinkedIn o GitHub (opcional)', 'input'],
  ['resumen', 'Resumen profesional (3-4 líneas)', 'textarea'],
  ['experiencia', 'Experiencia: una línea por puesto (Puesto — Empresa, fechas: lo que lograste)', 'textarea'],
  ['estudios', 'Estudios: una línea por título o curso', 'textarea'],
  ['idiomas', 'Idiomas', 'input'], ['extra', 'Otras habilidades (separadas por comas)', 'input'],
];

const hoja = el('article', { class: 'cv-hoja', 'aria-label': 'Vista previa del CV' });
const lineas = t => String(t || '').split('\n').map(x => x.trim()).filter(Boolean);
function pintarHoja() {
  const seccion = (titulo, ...hijos) => el('section', { class: 'cv-sec' }, el('h3', {}, titulo), ...hijos);
  const habilidades = [...datos.habilidades, ...String(v.extra || '').split(',').map(x => x.trim()).filter(Boolean)];
  const contacto = [v.ciudad, v.telefono, v.correo, v.enlace].filter(Boolean).join(' · ');
  hoja.replaceChildren(...[
    el('header', { class: 'cv-cab' }, el('h2', {}, v.nombre || 'Tu nombre'), el('p', { class: 'cv-titular' }, v.titular), contacto ? el('p', { class: 'small' }, contacto) : null),
    v.resumen ? seccion('Perfil', el('p', {}, v.resumen)) : null,
    habilidades.length ? seccion('Habilidades técnicas', el('ul', { class: 'cv-chips' }, habilidades.map(h => el('li', {}, h)))) : null,
    lineas(v.experiencia).length ? seccion('Experiencia', el('ul', {}, lineas(v.experiencia).map(l => el('li', {}, l)))) : null,
    v.practicas && datos.practicas.length ? seccion('Prácticas y laboratorios', el('ul', {}, datos.practicas.slice(0, 10).map(p => el('li', {}, p.titulo))), datos.practicas.length > 10 ? el('p', { class: 'small' }, `Y ${datos.practicas.length - 10} laboratorios más.`) : null) : null,
    lineas(v.estudios).length || (v.formacion && (datos.modulos.length || datos.certificados.length)) ? seccion('Formación',
      el('ul', {}, lineas(v.estudios).map(l => el('li', {}, l)),
        v.formacion ? datos.certificados.map(c => el('li', {}, `Certificado de finalización de Loopback: ${c.titulo} (formación en línea no oficial)`)) : null,
        v.formacion ? Object.entries(datos.modulos.reduce((g, m) => ((g[m.area] ||= []).push(m), g), {})).map(([a, ms]) => el('li', {}, `Loopback, ${TITULO_AREA[a]} (formación en línea): ${ms.map(m => m.titulo).join(', ')}`)) : null)) : null,
    v.idiomas ? seccion('Idiomas', el('p', {}, v.idiomas)) : null].filter(Boolean));
}

function formulario() {
  const campos = CAMPOS.map(([k, t, tipo]) => {
    const id = 'cv-' + k;
    const c = tipo === 'textarea' ? el('textarea', { id, rows: k === 'resumen' ? 4 : 3 }) : el('input', { id, type: k === 'correo' ? 'email' : k === 'telefono' ? 'tel' : 'text', autocomplete: { nombre: 'name', correo: 'email', telefono: 'tel', ciudad: 'address-level2' }[k] || 'off' });
    c.value = v[k] || '';
    c.addEventListener('input', () => { v[k] = c.value; local.set(CLAVE, v); pintarHoja(); });
    return el('div', { class: 'field' }, el('label', { for: id }, t), c);
  });
  const casilla = (k, texto) => { const i = el('input', { type: 'checkbox' }); i.checked = !!v[k]; i.addEventListener('change', () => { v[k] = i.checked; local.set(CLAVE, v); pintarHoja(); }); return el('label', { class: 'option' }, i, el('span', {}, texto)); };
  const sugerir = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Sugerir un resumen con mi progreso');
  sugerir.addEventListener('click', () => { const t = $('#cv-resumen'); t.value = v.resumen = resumenSugerido(datos, v.titular); local.set(CLAVE, v); pintarHoja(); });
  const borrar = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Borrar mis datos del CV');
  borrar.addEventListener('click', () => { if (confirm('¿Borrar los datos del CV guardados en este navegador?')) { local.del(CLAVE); location.reload(); } });
  return el('form', { class: 'card cv-form', novalidate: true, onsubmit: e => e.preventDefault() },
    el('h2', {}, 'Tus datos'), el('p', { class: 'small muted' }, 'Se guardan solo en este navegador; no se envían a ningún servidor.'),
    ...campos, sugerir, casilla('practicas', 'Incluir mis laboratorios completados'), casilla('formacion', 'Incluir mi formación y certificados de Loopback'),
    el('div', { class: 'hero-cta' }, el('button', { type: 'button', class: 'btn btn-primary', onclick: () => print() }, '🖨 Imprimir o guardar como PDF'), borrar));
}

raiz.replaceChildren(...[
  el('div', { class: 'page-head cv-head' }, el('span', { class: 'eyebrow' }, 'Empleo'), el('h1', {}, 'Tu CV técnico'),
    el('p', {}, 'Rellena tus datos y el CV se completa solo con lo que has hecho en Loopback: laboratorios, módulos y certificados. Pon solo lo que sabes hacer y puedes demostrar en una entrevista.')),
  datos.lecciones ? null : el('p', { class: 'alert alert-info' }, el('span', {}, 'Todavía no has completado lecciones. Puedes crear tu CV igualmente; se irá llenando a medida que avances.')),
  el('div', { class: 'cv-layout' }, formulario(), el('div', { class: 'cv-marco' }, hoja))].filter(Boolean));
pintarHoja();
