// Laboratorio SQL en el navegador con SQLite (sql.js, WebAssembly). Nada sale del equipo del alumno.
import { el, toast } from '../core.js';
import { guardarLab, labHecho, cargar } from '../progreso.js';
import { ESQUEMA, DATOS, ESQUEMA_DETECTIVE, DATOS_DETECTIVE, ESQUEMA_VENTAS, DATOS_VENTAS } from './sql-datos.js';
import { EJERCICIOS, CONJUNTOS } from './sql-ejercicios.js';

export const BASES = {
  inventario: { titulo: 'Laboratorio SQL: inventario de red', esquema: ESQUEMA, datos: DATOS },
  detective: { titulo: 'Caso detective: registros de la empresa', esquema: ESQUEMA_DETECTIVE, datos: DATOS_DETECTIVE },
  ventas: { titulo: 'Análisis de ventas', esquema: ESQUEMA_VENTAS, datos: DATOS_VENTAS },
};
export const baseDe = id => CONJUNTOS[id]?.base || 'inventario';

let motor = null;
function cargarMotor() {
  return motor || (motor = new Promise((resolve, reject) => {
    if (window.initSqlJs) return resolve(window.initSqlJs);
    const s = document.createElement('script');
    s.src = new URL('../../vendor/sql-wasm.js', import.meta.url).href;
    s.onload = () => resolve(window.initSqlJs);
    s.onerror = () => reject(new Error('No se pudo cargar el motor SQL.'));
    document.head.append(s);
  }).then(init => init({ locateFile: f => new URL('../../vendor/' + f, import.meta.url).href })));
}

export async function nuevaBaseDesde(esquema, datos) {
  const SQL = await cargarMotor();
  const db = new SQL.Database();
  db.run(esquema);
  db.run(datos);
  return db;
}

export async function nuevaBase(base = 'inventario') {
  const SQL = await cargarMotor();
  const db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON;');
  db.run(BASES[base].esquema);
  db.run(BASES[base].datos);
  return db;
}

// Ejecuta y devuelve el último conjunto de resultados (o null si la sentencia no devuelve filas).
export function ejecutarSql(db, sql) {
  const res = db.exec(sql);
  return res.length ? res[res.length - 1] : null;
}

const firma = (filas, ordenado) => { const f = filas.map(r => JSON.stringify(r.map(v => (typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v)))); return ordenado ? f : f.sort(); };
export async function corregir(ej, sqlAlumno, base = 'inventario') {
  const [dbA, dbB] = await Promise.all([nuevaBase(base), nuevaBase(base)]);
  try {
    let rA, rB;
    try { rA = ejecutarSql(dbA, sqlAlumno); } catch (e) { return { ok: false, error: 'Error de SQL: ' + e.message }; }
    rB = ejecutarSql(dbB, ej.solucion);
    if (ej.verificar) { rA = ejecutarSql(dbA, ej.verificar); rB = ejecutarSql(dbB, ej.verificar); }
    const fa = rA ? rA.values : [], fb = rB ? rB.values : [];
    if ((rA?.columns.length || 0) !== (rB?.columns.length || 0) && !ej.verificar) return { ok: false, resultado: rA, motivo: `Tu consulta devuelve ${rA?.columns.length || 0} columnas y se esperaban ${rB?.columns.length || 0}.` };
    const ok = JSON.stringify(firma(fa, ej.ordenado)) === JSON.stringify(firma(fb, ej.ordenado));
    let motivo = '';
    if (!ok) motivo = fa.length !== fb.length ? `Tu consulta devuelve ${fa.length} ${fa.length === 1 ? 'fila' : 'filas'} y se esperaban ${fb.length}.` : ej.ordenado ? 'Las filas no coinciden o no están en el orden pedido.' : 'Las filas no coinciden con las esperadas.';
    return { ok, resultado: ej.verificar ? null : rA, motivo };
  } finally { dbA.close(); dbB.close(); }
}

// Gráfico sencillo (barras o líneas) a partir de un resultado de dos columnas: etiqueta y valor.
export function grafico(r, tipo) {
  if (!r || r.columns.length < 2) return null;
  const datos = r.values.map(f => [String(f[0]), Number(f[1])]).filter(([, v]) => Number.isFinite(v));
  if (!datos.length) return null;
  const W = 560, H = 240, M = { i: 70, d: 16, s: 16, a: 46 };
  const max = Math.max(...datos.map(d => d[1]), 0) || 1;
  const x = i => M.i + (i + 0.5) * ((W - M.i - M.d) / datos.length);
  const y = v => H - M.a - (v / max) * (H - M.a - M.s);
  const fmt = v => Math.round(v).toLocaleString('es-DO');
  const ejes = [0, 0.5, 1].map(k => el('g', {}, el('line', { x1: M.i, x2: W - M.d, y1: y(max * k), y2: y(max * k), class: 'graf-rejilla' }), el('text', { x: M.i - 6, y: y(max * k) + 4, class: 'graf-eje', 'text-anchor': 'end' }, fmt(max * k))));
  const ancho = Math.min(46, ((W - M.i - M.d) / datos.length) * 0.6);
  const marcas = tipo === 'lineas'
    ? [el('polyline', { points: datos.map((d, i) => `${x(i)},${y(d[1])}`).join(' '), class: 'graf-linea' }), ...datos.map((d, i) => el('circle', { cx: x(i), cy: y(d[1]), r: 4, class: 'graf-punto' }, el('title', {}, `${d[0]}: ${fmt(d[1])}`)))]
    : datos.map((d, i) => el('rect', { x: x(i) - ancho / 2, y: y(d[1]), width: ancho, height: H - M.a - y(d[1]), rx: 3, class: 'graf-barra' }, el('title', {}, `${d[0]}: ${fmt(d[1])}`)));
  const etiquetas = datos.map((d, i) => el('text', { x: x(i), y: H - M.a + 16, class: 'graf-eje', 'text-anchor': 'middle' }, d[0].length > 12 ? d[0].slice(0, 11) + '…' : d[0]));
  return el('figure', { class: 'graf' }, el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `Gráfico de ${tipo === 'lineas' ? 'líneas' : 'barras'}: ${r.columns[1]} por ${r.columns[0]}` }, ...ejes, ...marcas, ...etiquetas),
    el('figcaption', { class: 'small muted' }, `${r.columns[1]} por ${r.columns[0]}`));
}

function tablaResultado(r) {
  if (!r) return el('p', { class: 'muted small' }, 'La sentencia se ejecutó y no devuelve filas.');
  return el('div', { class: 'result-wrap' }, el('table', { class: 'result-table' },
    el('thead', {}, el('tr', {}, r.columns.map(c => el('th', { scope: 'col' }, c)))),
    el('tbody', {}, r.values.slice(0, 200).map(f => el('tr', {}, f.map(v => el('td', {}, v === null ? 'NULL' : String(v))))))));
}

export async function montarSql(holder, id) {
  const lista = EJERCICIOS[id];
  if (!lista) throw new Error('Ejercicios SQL desconocidos: ' + id);
  await cargar();
  const conjunto = CONJUNTOS[id] || null;
  const base = baseDe(id);
  let n = 0;
  const hechos = new Set();
  const titulo = el('h3', {});
  const enunciado = el('p', {});
  const editor = el('textarea', { class: 'sql-editor', spellcheck: 'false', autocapitalize: 'off', 'aria-label': 'Escribe tu consulta SQL', rows: 5 });
  const salida = el('div', { 'aria-live': 'polite' });
  const feedback = el('div', { class: 'feedback', role: 'status' });
  const marcador = el('span', { class: 'badge badge-accent' });
  const btnRun = el('button', { type: 'button', class: 'btn btn-ghost' }, 'Ejecutar');
  const btnCheck = el('button', { type: 'button', class: 'btn btn-primary' }, 'Comprobar');
  const btnPrev = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, '‹ Anterior');
  const btnNext = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Siguiente ›');
  const btnSol = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Ver solución');
  const esquema = el('details', {}, el('summary', { class: 'small' }, 'Ver las tablas de la base de datos'), el('pre', { class: 'code' }, BASES[base].esquema.trim()));
  const historia = el('div', { 'aria-live': 'polite' });

  function pintar() {
    const ej = lista[n];
    titulo.textContent = `Ejercicio ${n + 1} de ${lista.length}`;
    enunciado.textContent = ej.enunciado + (ej.pista ? ' Pista: ' + ej.pista : '');
    editor.value = '';
    salida.replaceChildren(); feedback.textContent = ''; feedback.className = 'feedback';
    marcador.textContent = `${hechos.size}/${lista.length} resueltos`;
    btnPrev.disabled = n === 0; btnNext.disabled = n === lista.length - 1;
  }
  btnRun.addEventListener('click', async () => {
    const db = await nuevaBase(base);
    try { salida.replaceChildren(tablaResultado(ejecutarSql(db, editor.value))); feedback.textContent = ''; }
    catch (e) { feedback.className = 'feedback bad'; feedback.textContent = 'Error de SQL: ' + e.message; }
    finally { db.close(); }
  });
  btnCheck.addEventListener('click', async () => {
    if (!editor.value.trim()) { feedback.className = 'feedback bad'; feedback.textContent = 'Escribe una consulta primero.'; return; }
    const r = await corregir(lista[n], editor.value, base);
    if (r.resultado !== undefined) salida.replaceChildren(tablaResultado(r.resultado));
    if (r.ok) {
      hechos.add(n);
      feedback.className = 'feedback ok'; feedback.textContent = '¡Correcto!' + (lista[n].descubre ? ' Pista descubierta: ' + lista[n].descubre : '') + (n < lista.length - 1 ? ' Pasa al siguiente ejercicio.' : '');
      if (lista[n].grafico) { const g = grafico(r.resultado, lista[n].grafico); if (g) salida.append(g); }
      if (conjunto && hechos.size === lista.length) historia.replaceChildren(el('div', { class: 'alert alert-ok' }, el('p', {}, el('strong', {}, '🔎 ' + conjunto.final))));
      marcador.textContent = `${hechos.size}/${lista.length} resueltos`;
      if (hechos.size === lista.length && !labHecho('sql-' + id)) { guardarLab('sql-' + id); toast('Laboratorio SQL completado.'); }
    } else { feedback.className = 'feedback bad'; feedback.textContent = r.error || r.motivo; }
  });
  editor.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); btnCheck.click(); } });
  btnPrev.addEventListener('click', () => { n--; pintar(); });
  btnNext.addEventListener('click', () => { n++; pintar(); });
  btnSol.addEventListener('click', () => { editor.value = lista[n].solucion; editor.focus(); });

  holder.append(el('section', { class: 'lab', 'aria-label': 'Laboratorio SQL' },
    el('div', { class: 'lab-head' }, el('h3', {}, conjunto ? conjunto.titulo : BASES[base].titulo), marcador),
    conjunto ? el('p', { class: 'alert alert-info' }, el('span', {}, conjunto.intro)) : null, esquema, titulo, enunciado, editor, el('p', { class: 'hint' }, 'Ctrl + Intro para comprobar. La base de datos se reinicia en cada ejecución.'),
    el('div', { class: 'hero-cta' }, btnRun, btnCheck, btnPrev, btnNext, btnSol), feedback, historia, salida));
  pintar();
  salida.replaceChildren(el('p', { class: 'muted small' }, 'Preparando SQLite en tu navegador…'));
  await cargarMotor();
  salida.replaceChildren();
}
