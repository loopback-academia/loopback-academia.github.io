// Laboratorio de inyección SQL: atacar una aplicación vulnerable (en tu navegador, con SQLite) y después arreglarla
// con consultas parametrizadas. La lógica está en inyeccion-logica.js.
import { el, toast } from '../core.js';
import { guardarLab, labHecho, cargar } from '../progreso.js';
import { nuevaBaseDesde } from './sql-lab.js';
import { ESQUEMA_TIENDA, DATOS_TIENDA, consultaLogin, consultaBusqueda, retoLogin, retoBusqueda, retoArreglo } from './inyeccion-logica.js';

// ---------------------------------------------------------------- interfaz
export async function montarInyeccion(holder) {
  await cargar();
  const db = await nuevaBaseDesde(ESQUEMA_TIENDA, DATOS_TIENDA);
  const hechos = [false, false, false];
  const marcador = el('span', { class: 'badge badge-accent' });
  const final = el('div', { 'aria-live': 'polite' });
  const contar = () => {
    marcador.textContent = `${hechos.filter(Boolean).length}/3 retos`;
    if (hechos.every(Boolean)) {
      final.replaceChildren(el('div', { class: 'alert alert-ok' }, el('p', {}, el('strong', {}, '¡Laboratorio completado! '), 'Has visto el ataque desde dentro y has aplicado la defensa que usan las aplicaciones profesionales: consultas parametrizadas.')));
      if (!labHecho('sqli-login')) { guardarLab('sqli-login'); toast('Laboratorio de inyección SQL completado.'); }
    }
  };
  const tabla = r => r.error ? el('p', { class: 'feedback bad' }, 'Error de SQL: ' + r.error)
    : !r.filas.length ? el('p', { class: 'muted small' }, 'La consulta no devolvió filas.')
      : el('div', { class: 'result-wrap' }, el('table', { class: 'result-table' }, el('tbody', {}, r.filas.map(f => el('tr', {}, f.map(v => el('td', {}, String(v))))))));
  const verSql = () => el('pre', { class: 'code sqli-sql', 'aria-live': 'polite' });

  // Reto 1
  const u1 = el('input', { type: 'text', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Usuario', placeholder: 'Usuario' });
  const c1 = el('input', { type: 'text', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Contraseña', placeholder: 'Contraseña' });
  const sql1 = verSql(), res1 = el('div'), fb1 = el('div', { class: 'feedback', role: 'status' });
  const pinta1 = () => { sql1.textContent = consultaLogin(u1.value, c1.value); };
  [u1, c1].forEach(i => i.addEventListener('input', pinta1));
  const f1 = el('form', { class: 'inline-form sqli-form', novalidate: true }, u1, c1, el('button', { type: 'submit', class: 'btn btn-primary' }, 'Entrar'));
  f1.addEventListener('submit', e => {
    e.preventDefault();
    const r = retoLogin(db, u1.value, c1.value);
    res1.replaceChildren(tabla(r));
    if (r.ok) { hechos[0] = true; fb1.className = 'feedback ok'; fb1.textContent = '¡Entraste como administrador sin saber la contraseña! Lo que escribiste cambió la lógica de la consulta.'; contar(); }
    else { fb1.className = 'feedback bad'; fb1.textContent = r.filas?.length ? 'Has entrado, pero no como admin.' : 'Acceso denegado. Mira cómo queda la consulta con lo que escribes.'; }
  });

  // Reto 2
  const t2 = el('input', { type: 'text', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Buscar producto', placeholder: 'Buscar producto' });
  const sql2 = verSql(), res2 = el('div'), fb2 = el('div', { class: 'feedback', role: 'status' });
  t2.addEventListener('input', () => { sql2.textContent = consultaBusqueda(t2.value); });
  const f2 = el('form', { class: 'inline-form sqli-form', novalidate: true }, t2, el('button', { type: 'submit', class: 'btn btn-primary' }, 'Buscar'));
  f2.addEventListener('submit', e => {
    e.preventDefault();
    const r = retoBusqueda(db, t2.value);
    res2.replaceChildren(tabla(r));
    if (r.ok) { hechos[1] = true; fb2.className = 'feedback ok'; fb2.textContent = '¡Has sacado los usuarios y sus contraseñas por un buscador de productos! Y además estaban guardadas sin cifrar.'; contar(); }
    else { fb2.className = 'feedback' + (r.error ? ' bad' : ''); fb2.textContent = r.error ? 'La consulta se rompió: ajusta las comillas o el número de columnas.' : 'Todavía no aparece la contraseña del administrador.'; }
  });

  // Reto 3
  const ed = el('textarea', { class: 'sql-editor', rows: 3, spellcheck: 'false', autocapitalize: 'off', 'aria-label': 'Consulta parametrizada' });
  ed.value = "SELECT usuario, rol FROM usuarios WHERE usuario = '' AND clave = ''";
  const fb3 = el('div', { class: 'feedback', role: 'status' });
  const b3 = el('button', { type: 'button', class: 'btn btn-primary' }, 'Probar los ataques');
  b3.addEventListener('click', () => {
    const r = retoArreglo(db, ed.value);
    if (r.ok) { hechos[2] = true; fb3.className = 'feedback ok'; fb3.textContent = '¡Arreglado! El inicio de sesión normal funciona y los tres ataques fallan: el texto del usuario ya nunca se interpreta como SQL.'; contar(); }
    else { fb3.className = 'feedback bad'; fb3.textContent = r.motivo; }
  });

  const pistas = (...t) => el('details', {}, el('summary', { class: 'small' }, 'Ver pistas'), el('ul', { class: 'small' }, t.map(x => el('li', {}, x))));
  holder.append(el('section', { class: 'lab', 'aria-label': 'Laboratorio de inyección SQL' },
    el('div', { class: 'lab-head' }, el('h3', {}, 'Inyección SQL: atacar y defender'), marcador),
    el('p', { class: 'alert alert-info' }, el('span', {}, 'Esta tienda de prueba vive solo en tu navegador. Practica estas técnicas únicamente en sistemas propios o con permiso por escrito: atacar sistemas ajenos es un delito.')),
    el('h4', {}, 'Reto 1 · Entra como admin sin saber su contraseña'),
    el('p', { class: 'small' }, 'La aplicación pega lo que escribes dentro de la consulta. Mírala cambiar mientras escribes:'), sql1, f1, fb1, res1,
    pistas('La comilla simple \' cierra el texto del usuario antes de tiempo.', 'En SQL, -- convierte en comentario todo lo que sigue.', 'Prueba como usuario: admin\' --'),
    el('h4', {}, 'Reto 2 · Saca las contraseñas usando el buscador de productos'), sql2, f2, fb2, res2,
    pistas('UNION SELECT añade filas de otra tabla al resultado, con el mismo número de columnas (aquí, 2).', 'Cierra la comilla, añade UNION SELECT usuario, clave FROM usuarios y comenta el resto con --', "Ejemplo: x' UNION SELECT usuario, clave FROM usuarios --"),
    el('h4', {}, 'Reto 3 · Arregla la aplicación con una consulta parametrizada'),
    el('p', { class: 'small' }, 'Reescribe la consulta del inicio de sesión usando ? en lugar de pegar el texto. Se probará con el usuario correcto y con tres ataques.'), ed,
    el('div', { class: 'hero-cta' }, b3), fb3,
    pistas('Cambia cada \'\' por ? (sin comillas): WHERE usuario = ? AND clave = ?', 'El motor envía los valores por separado: aunque contengan comillas, nunca se ejecutan como SQL.'),
    final));
  pinta1(); sql2.textContent = consultaBusqueda('');
  contar();
}
