// Un laboratorio a pantalla completa: ?l=lab:subnetting | cli:vlan | sql:join …
import { iniciarPagina, el, $ } from '../core.js';
import { CATALOGO } from '../labs/catalogo.js';
import { cargarCurso } from '../curso.js';
import { cargar } from '../progreso.js';
import { labAccesible, leccionDeLab } from '../escalera.js';
import { estadoArea } from '../escalera-alumno.js';

iniciarPagina();
const [curso] = await Promise.all([cargarCurso().catch(() => null), cargar()]);
const clave = new URLSearchParams(location.search).get('l') || 'lab:subnetting';
const info = CATALOGO.find(l => l.clave === clave);
const box = $('#lab');
const MONTAR = {
  lab: () => import('../labs/numeros.js').then(m => m.montarLab),
  cli: () => import('../labs/cli-ui.js').then(m => m.montarCli),
  sql: () => import('../labs/sql-lab.js').then(m => m.montarSql),
  code: () => import('../codigo/codigo-ui.js').then(m => m.montarCodigo),
  proyecto: () => import('../proyectos/proyecto-ui.js').then(m => m.montarProyecto),
  caso: () => import('../casos/caso-ui.js').then(m => m.montarCaso),
  turno: () => import('../casos/caso-ui.js').then(m => m.montarTurno),
};
if (!info) {
  box.replaceChildren(el('h1', {}, 'Laboratorio no encontrado'), el('a', { class: 'btn btn-primary', href: 'practica.html' }, 'Ver los laboratorios'));
} else if (curso && !labAccesible(info, curso, estadoArea(curso, info.area))) {
  const lec = leccionDeLab(info, curso);
  document.title = `${info.titulo} · Loopback`;
  box.replaceChildren(el('div', { class: 'locked-screen' }, el('div', { class: 'locked-ico', 'aria-hidden': 'true' }, '🔒'), el('h1', {}, info.titulo),
    el('p', {}, lec ? `Esta práctica se abre cuando llegas a la lección «${lec.titulo}» en la escalera. Así practicas justo después de aprenderlo.` : 'Esta práctica se abre cuando llegas a su nivel en la escalera.'),
    el('div', { class: 'hero-cta' }, el('a', { class: 'btn btn-primary', href: 'curso.html?area=' + info.area }, 'Ver la escalera'), el('a', { class: 'btn btn-ghost', href: 'practica.html#area-' + info.area }, 'Prácticas abiertas'))));
} else {
  document.title = `${info.titulo} · Loopback`;
  const [tipo, id] = clave.split(':');
  const holder = el('div');
  box.replaceChildren(el('div', { class: 'page-head' }, el('h1', {}, info.titulo), tipo === 'lab' ? el('p', {}, info.texto) : null), holder);
  $('p.small a[href="practica.html"]')?.setAttribute('href', 'practica.html#area-' + info.area);
  try { await (await MONTAR[tipo]())(holder, id); }
  catch (e) { console.error(e); holder.replaceChildren(el('div', { class: 'alert alert-warn' }, el('p', {}, 'No se pudo cargar el laboratorio. Recarga la página.'))); }
}
