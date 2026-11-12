// Diseñador entidad-relación ([[er:tienda]]) y ejercicio de formas normales ([[fn:formas]]).
import { el, toast, local } from '../core.js';
import { guardarLab, labHecho, cargar } from '../progreso.js';
import { TIPOS_COL, RETOS_ER, generarSql, evaluarReto, FORMAS, OPCIONES_FN } from './er.js';
import { nuevaBaseDesde } from './sql-lab.js';

const FILA = 20, CAB = 26, SEP_X = 60, SEP_Y = 40;
const textoCol = c => `${c.pk || c.fk ? 'XX ' : ''}${c.nombre} · ${c.tipo}${c.fk ? ' → ' + c.fk : ''}`;

function diagrama(d) {
  if (!d.tablas.length) return el('p', { class: 'small muted' }, 'Añade una tabla para empezar.');
  const ANCHO = Math.max(170, ...d.tablas.flatMap(t => [t.nombre.length * 8.2 + 24, ...t.columnas.map(c => textoCol(c).length * 7 + 24)]));
  const cols = Math.min(3, d.tablas.length);
  const alturas = d.tablas.map(t => CAB + Math.max(1, t.columnas.length) * FILA + 8);
  const filas = Math.ceil(d.tablas.length / cols);
  const altoFila = r => Math.max(...d.tablas.map((t, k) => (Math.floor(k / cols) === r ? alturas[k] : 0)));
  const pos = d.tablas.map((t, k) => { const r = Math.floor(k / cols), c = k % cols; let y = 10; for (let i = 0; i < r; i++) y += altoFila(i) + SEP_Y; return { x: 10 + c * (ANCHO + SEP_X), y, h: alturas[k] }; });
  const ancho = 20 + cols * ANCHO + (cols - 1) * SEP_X, alto = pos.reduce((m, p) => Math.max(m, p.y + p.h), 0) + 10;
  const lineas = [];
  d.tablas.forEach((t, k) => t.columnas.forEach((c, j) => {
    const dest = d.tablas.findIndex(x => x.nombre === c.fk);
    if (!c.fk || dest < 0) return;
    const a = pos[k], b = pos[dest];
    const y1 = a.y + CAB + j * FILA + FILA / 2, y2 = b.y + CAB / 2;
    const x1 = b.x > a.x ? a.x + ANCHO : a.x, x2 = b.x > a.x ? b.x : b.x + (b.x === a.x ? 0 : ANCHO);
    const xm = b.x === a.x ? a.x - 25 : (x1 + x2) / 2;
    lineas.push(el('path', { d: `M${x1} ${y1} C${xm} ${y1} ${xm} ${y2} ${x2} ${y2}`, class: 'er-linea' }), el('circle', { cx: x2, cy: y2, r: 3.5, class: 'er-punta' }));
  }));
  const cajas = d.tablas.map((t, k) => { const p = pos[k]; return el('g', {},
    el('rect', { x: p.x, y: p.y, width: ANCHO, height: p.h, rx: 6, class: 'er-caja' }),
    el('rect', { x: p.x, y: p.y, width: ANCHO, height: CAB, rx: 6, class: 'er-cab' }),
    el('text', { x: p.x + 10, y: p.y + 17, class: 'er-nombre' }, t.nombre || '(sin nombre)'),
    ...t.columnas.map((c, j) => el('text', { x: p.x + 10, y: p.y + CAB + 14 + j * FILA, class: 'er-col' + (c.pk ? ' pk' : '') }, `${c.pk ? '🔑 ' : c.fk ? '🔗 ' : ''}${c.nombre} · ${c.tipo}${c.fk ? ' → ' + c.fk : ''}`))); });
  return el('svg', { viewBox: `0 0 ${ancho} ${alto}`, width: ancho, height: alto, role: 'img', 'aria-label': 'Diagrama entidad-relación', class: 'er-svg' }, ...lineas, ...cajas);
}

export async function montarEr(holder, id) {
  const reto = RETOS_ER[id];
  if (!reto) throw new Error('Reto de diseño desconocido: ' + id);
  await cargar();
  const CLAVE = 'aula:er:' + id;
  let d = local.get(CLAVE, null) || { tablas: [{ nombre: 'clientes', columnas: [{ nombre: 'cliente_id', tipo: 'INTEGER', pk: true }, { nombre: 'nombre', tipo: 'TEXT', nn: true }] }] };
  const editor = el('div', { class: 'er-editor' });
  const dib = el('div', { class: 'er-dibujo' });
  const sql = el('pre', { class: 'code er-sql' });
  const resultado = el('div', { 'aria-live': 'polite' });
  const guardar = () => { local.set(CLAVE, d); dib.replaceChildren(diagrama(d)); sql.textContent = generarSql(d) || '-- Sin tablas'; };

  function pintarEditor() {
    editor.replaceChildren(...d.tablas.map((t, k) => {
      const nombre = el('input', { type: 'text', class: 'mono', value: t.nombre, 'aria-label': 'Nombre de la tabla', spellcheck: 'false', autocapitalize: 'off' });
      nombre.addEventListener('change', () => { const viejo = t.nombre; t.nombre = nombre.value.trim().toLowerCase(); d.tablas.forEach(x => x.columnas.forEach(c => { if (c.fk === viejo) c.fk = t.nombre; })); guardar(); pintarEditor(); });
      const borrarT = el('button', { type: 'button', class: 'btn btn-quiet btn-sm', 'aria-label': 'Borrar la tabla ' + t.nombre }, '🗑');
      borrarT.addEventListener('click', () => { d.tablas.splice(k, 1); d.tablas.forEach(x => x.columnas.forEach(c => { if (c.fk === t.nombre) c.fk = null; })); guardar(); pintarEditor(); });
      const filas = t.columnas.map((c, j) => {
        const n = el('input', { type: 'text', class: 'mono', value: c.nombre, 'aria-label': 'Nombre de la columna', spellcheck: 'false', autocapitalize: 'off' });
        n.addEventListener('change', () => { c.nombre = n.value.trim().toLowerCase(); guardar(); });
        const tipo = el('select', { 'aria-label': 'Tipo' }, TIPOS_COL.map(x => el('option', { value: x, selected: x === c.tipo }, x)));
        tipo.addEventListener('change', () => { c.tipo = tipo.value; guardar(); });
        const pk = el('input', { type: 'checkbox', 'aria-label': 'Clave primaria' }); pk.checked = !!c.pk;
        pk.addEventListener('change', () => { c.pk = pk.checked; guardar(); });
        const fk = el('select', { 'aria-label': 'Clave foránea hacia' }, el('option', { value: '' }, '—'), d.tablas.filter(x => x !== t).map(x => el('option', { value: x.nombre, selected: x.nombre === c.fk }, '→ ' + x.nombre)));
        fk.addEventListener('change', () => { c.fk = fk.value || null; if (c.fk) c.tipo = 'INTEGER'; guardar(); pintarEditor(); });
        const quitar = el('button', { type: 'button', class: 'btn btn-quiet btn-sm', 'aria-label': 'Quitar la columna ' + c.nombre }, '✕');
        quitar.addEventListener('click', () => { t.columnas.splice(j, 1); guardar(); pintarEditor(); });
        return el('div', { class: 'er-fila' }, n, tipo, el('label', { class: 'er-pk' }, pk, 'PK'), fk, quitar);
      });
      const nuevaCol = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, '+ Columna');
      nuevaCol.addEventListener('click', () => { t.columnas.push({ nombre: 'columna' + (t.columnas.length + 1), tipo: 'TEXT' }); guardar(); pintarEditor(); editor.querySelectorAll('.er-tabla')[k].querySelectorAll('.er-fila input[type=text]').forEach((x, i, a) => { if (i === a.length - 1) { x.focus(); x.select(); } }); });
      return el('fieldset', { class: 'er-tabla' }, el('legend', {}, 'Tabla'), el('div', { class: 'er-fila er-tabla-cab' }, nombre, borrarT), el('div', { class: 'er-cols small muted' }, el('span', {}, 'Columna'), el('span', {}, 'Tipo'), el('span', {}, 'Clave'), el('span', {}, 'Referencia')), ...filas, nuevaCol);
    }));
  }
  const nuevaTabla = el('button', { type: 'button', class: 'btn btn-ghost' }, '+ Nueva tabla');
  nuevaTabla.addEventListener('click', () => { const n = 'tabla' + (d.tablas.length + 1); d.tablas.push({ nombre: n, columnas: [{ nombre: 'id', tipo: 'INTEGER', pk: true }] }); guardar(); pintarEditor(); });
  const probar = el('button', { type: 'button', class: 'btn btn-ghost' }, 'Probar el SQL en SQLite');
  probar.addEventListener('click', async () => {
    try { const db = await nuevaBaseDesde(generarSql(d) || 'SELECT 1;', ''); db.close(); resultado.replaceChildren(el('p', { class: 'feedback ok' }, 'SQLite ha creado todas las tablas sin errores.')); }
    catch (e) { resultado.replaceChildren(el('p', { class: 'feedback bad' }, 'Error de SQLite: ' + e.message)); }
  });
  const comprobar = el('button', { type: 'button', class: 'btn btn-primary' }, 'Comprobar el diseño');
  comprobar.addEventListener('click', () => {
    const r = evaluarReto(id, d);
    if (r.ok && !labHecho('er-' + id)) { guardarLab('er-' + id); toast('¡Diseño correcto!'); }
    resultado.replaceChildren(el('div', { class: 'alert ' + (r.ok ? 'alert-ok' : 'alert-warn') }, r.ok ? el('p', {}, el('strong', {}, '¡Diseño correcto! '), 'Cada dato está en su sitio y las relaciones son las adecuadas.') : el('div', {}, el('p', {}, el('strong', {}, 'Revisa esto:')), el('ul', {}, r.problemas.map(x => el('li', {}, x))))));
  });
  const reiniciar = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Empezar de cero');
  reiniciar.addEventListener('click', () => { if (!confirm('¿Borrar el diseño y empezar de cero?')) return; d = { tablas: [] }; guardar(); pintarEditor(); resultado.replaceChildren(); });
  holder.append(el('section', { class: 'lab', 'aria-label': 'Diseñador entidad-relación' },
    el('div', { class: 'lab-head' }, el('h3', {}, 'Diseña: ' + reto.titulo)),
    el('p', { class: 'alert alert-info' }, el('span', {}, reto.texto)),
    el('div', { class: 'er-layout' }, el('div', {}, editor, el('div', { class: 'hero-cta' }, nuevaTabla)), el('div', {}, el('h4', {}, 'Diagrama'), dib, el('details', {}, el('summary', { class: 'small' }, 'Ver el SQL generado'), sql))),
    el('div', { class: 'hero-cta' }, comprobar, probar, reiniciar), resultado,
    el('p', { class: 'small muted' }, 'Tu diseño se guarda en este navegador. 🔑 = clave primaria · 🔗 = clave foránea.')));
  pintarEditor(); guardar();
}

export async function montarFormas(holder) {
  await cargar();
  const bien = new Set();
  const marcador = el('span', { class: 'badge badge-accent' });
  const contar = () => { marcador.textContent = `${bien.size}/${FORMAS.length}`; if (bien.size >= FORMAS.length - 1 && !labHecho('fn-formas')) { guardarLab('fn-formas'); toast('Formas normales: laboratorio completado.'); } };
  const items = FORMAS.map((f, k) => {
    const fb = el('p', { class: 'small feedback', role: 'status' });
    const botones = OPCIONES_FN.map(o => {
      const b = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, o === 'ninguna' ? 'Está bien normalizada' : 'Rompe la ' + o);
      b.addEventListener('click', () => {
        const ok = o === f.respuesta;
        fb.className = 'small feedback ' + (ok ? 'ok' : 'bad'); fb.textContent = (ok ? '¡Correcto! ' : 'No. ') + f.explicacion;
        if (ok) bien.add(k); else bien.delete(k);
        contar();
      });
      return b;
    });
    return el('article', { class: 'card fn-item' }, el('p', {}, el('strong', {}, `Tabla ${f.tabla}`), f.clave ? el('span', { class: 'small muted' }, ` · clave: ${f.clave}`) : null),
      el('div', { class: 'result-wrap' }, el('table', { class: 'result-table' }, el('thead', {}, el('tr', {}, f.columnas.map(c => el('th', { scope: 'col' }, c)))), el('tbody', {}, f.filas.map(r => el('tr', {}, r.map(v => el('td', {}, v))))))),
      el('div', { class: 'hero-cta' }, botones), fb);
  });
  holder.append(el('section', { class: 'lab', 'aria-label': 'Formas normales' }, el('div', { class: 'lab-head' }, el('h3', {}, '¿Qué forma normal rompe?'), marcador),
    el('p', { class: 'small muted' }, 'Para cada tabla, decide si rompe la primera, la segunda o la tercera forma normal, o si está bien. Se completa con 5 de 6 aciertos.'), ...items));
  contar();
}
