// Lógica del laboratorio de inyección SQL (sin DOM: se prueba en Node). db es una base de sql.js.
export const ESQUEMA_TIENDA = `
CREATE TABLE usuarios (id INTEGER PRIMARY KEY, usuario TEXT NOT NULL UNIQUE, clave TEXT NOT NULL, rol TEXT NOT NULL);
CREATE TABLE productos (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, precio REAL NOT NULL);`;
export const DATOS_TIENDA = `
INSERT INTO usuarios VALUES (1,'admin','Tr0pical!2026','administrador'),(2,'mfernandez','soporte123','soporte'),(3,'psantos','Ventas#55','ventas');
INSERT INTO productos VALUES (1,'Cable de red Cat6 (3 m)',350),(2,'Switch de 8 puertos',2900),(3,'Router Wi-Fi 6',5400),(4,'Adaptador USB-C a RJ45',1100);`;

// Lo que hace la aplicación vulnerable: pega el texto del usuario dentro de la consulta.
export const consultaLogin = (u, c) => `SELECT usuario, rol FROM usuarios WHERE usuario = '${u}' AND clave = '${c}'`;
export const consultaBusqueda = t => `SELECT nombre, precio FROM productos WHERE nombre LIKE '%${t}%'`;

function filas(db, sql, params) {
  try {
    const st = db.prepare(sql);
    if (params) st.bind(params);
    const out = [];
    while (st.step()) out.push(st.get());
    st.free();
    return { filas: out };
  } catch (e) { return { error: e.message }; }
}

// Paso 1: ¿entró como admin sin la contraseña real?
export function retoLogin(db, u, c) {
  const sql = consultaLogin(u, c);
  const r = filas(db, sql);
  const comoAdmin = !r.error && r.filas.length > 0 && r.filas[0][0] === 'admin';
  return { sql, ...r, ok: comoAdmin && c !== 'Tr0pical!2026' };
}
// Paso 2: ¿consiguió sacar la contraseña del administrador por el buscador?
export function retoBusqueda(db, t) {
  const sql = consultaBusqueda(t);
  const r = filas(db, sql);
  return { sql, ...r, ok: !r.error && r.filas.some(f => f.some(v => v === 'Tr0pical!2026')) };
}
// Paso 3: la consulta del alumno debe usar parámetros (?) y resistir los ataques sin romper el inicio de sesión normal.
export const ATAQUES = [["admin' --", 'x'], ["' OR '1'='1", "' OR '1'='1"], ['admin', "' OR 1=1 --"]];
export function retoArreglo(db, sql) {
  const t = String(sql || '').trim().replace(/;+\s*$/, '');
  if ((t.match(/\?/g) || []).length !== 2) return { ok: false, motivo: 'La consulta debe tener exactamente dos marcadores ?: uno para el usuario y otro para la clave.' };
  if (/'\s*\?\s*'|"\s*\?\s*"/.test(t)) return { ok: false, motivo: 'No pongas comillas alrededor de ?. El motor las añade solo al enlazar el valor.' };
  if (!/^select\b/i.test(t)) return { ok: false, motivo: 'La consulta debe ser un SELECT sobre la tabla usuarios.' };
  const legit = filas(db, t, ['admin', 'Tr0pical!2026']);
  if (legit.error) return { ok: false, motivo: 'Error de SQL: ' + legit.error };
  if (legit.filas.length !== 1) return { ok: false, motivo: 'Con el usuario y la clave correctos (admin / Tr0pical!2026) debería devolver exactamente una fila.' };
  const mala = filas(db, t, ['admin', 'otra-clave']);
  if (mala.filas?.length) return { ok: false, motivo: 'Con una clave incorrecta no debería devolver nada: comprueba que filtras por usuario Y por clave.' };
  for (const [u, c] of ATAQUES) {
    const r = filas(db, t, [u, c]);
    if (r.error || r.filas.length) return { ok: false, motivo: `El ataque usuario=${u} / clave=${c} todavía entra.` };
  }
  return { ok: true };
}
