// Diseñador entidad-relación y formas normales.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { generarSql, revisarDiseno, evaluarReto, FORMAS, OPCIONES_FN } from '../js/labs/er.js';

const C = (nombre, tipo, extra = {}) => ({ nombre, tipo, ...extra });
const tienda = { tablas: [
  { nombre: 'clientes', columnas: [C('cliente_id', 'INTEGER', { pk: true }), C('nombre', 'TEXT', { nn: true })] },
  { nombre: 'productos', columnas: [C('producto_id', 'INTEGER', { pk: true }), C('nombre', 'TEXT'), C('precio', 'REAL')] },
  { nombre: 'pedidos', columnas: [C('pedido_id', 'INTEGER', { pk: true }), C('fecha', 'DATE'), C('cliente_id', 'INTEGER', { fk: 'clientes' })] },
  { nombre: 'detalle_pedido', columnas: [C('pedido_id', 'INTEGER', { pk: true, fk: 'pedidos' }), C('producto_id', 'INTEGER', { pk: true, fk: 'productos' }), C('cantidad', 'INTEGER')] },
] };

test('ER: un buen diseño de la tienda aprueba y su SQL funciona en SQLite', async () => {
  assert.deepEqual(evaluarReto('tienda', tienda).problemas, []);
  const sql = generarSql(tienda);
  assert.match(sql, /PRIMARY KEY \(pedido_id, producto_id\)/);
  assert.match(sql, /cliente_id INTEGER REFERENCES clientes\(cliente_id\)/);
  const require = createRequire(import.meta.url);
  const SQL = await require('../vendor/sql-wasm.js')({ locateFile: f => new URL('../vendor/' + f, import.meta.url).pathname });
  const db = new SQL.Database(); db.run(sql); db.close();
});

test('ER: detecta los errores típicos', () => {
  const malo = { tablas: [
    { nombre: 'clientes', columnas: [C('nombre', 'TEXT')] },
    { nombre: 'pedidos', columnas: [C('pedido_id', 'INTEGER', { pk: true }), C('producto1', 'TEXT'), C('producto2', 'TEXT'), C('fecha', 'DATE')] },
  ] };
  const p = evaluarReto('tienda', malo).problemas.join(' | ');
  assert.match(p, /clientes no tiene clave primaria/);
  assert.match(p, /primera forma normal/);
  assert.match(p, /Falta la tabla de productos/);
  assert.match(revisarDiseno({ tablas: [{ nombre: 'Mi Tabla', columnas: [C('id', 'INTEGER', { pk: true })] }] }).join(), /no es válido/);
  const sinInter = { tablas: tienda.tablas.slice(0, 3).map(t => t.nombre === 'pedidos' ? { ...t, columnas: [...t.columnas, C('producto_id', 'INTEGER', { fk: 'productos' })] } : t) };
  assert.match(evaluarReto('tienda', sinInter).problemas.join(), /N:M/);
});

test('ER: instituto', () => {
  const bien = { tablas: [
    { nombre: 'profesores', columnas: [C('profesor_id', 'INTEGER', { pk: true }), C('nombre', 'TEXT')] },
    { nombre: 'cursos', columnas: [C('curso_id', 'INTEGER', { pk: true }), C('titulo', 'TEXT'), C('profesor_id', 'INTEGER', { fk: 'profesores' })] },
    { nombre: 'estudiantes', columnas: [C('estudiante_id', 'INTEGER', { pk: true }), C('nombre', 'TEXT')] },
    { nombre: 'inscripciones', columnas: [C('estudiante_id', 'INTEGER', { pk: true, fk: 'estudiantes' }), C('curso_id', 'INTEGER', { pk: true, fk: 'cursos' }), C('nota', 'REAL')] },
  ] };
  assert.deepEqual(evaluarReto('escuela', bien).problemas, []);
  const notaMal = { tablas: bien.tablas.map(t => t.nombre === 'estudiantes' ? { ...t, columnas: [...t.columnas, C('nota', 'REAL')] } : t) };
  assert.match(evaluarReto('escuela', notaMal).problemas.join(), /nota no puede ir en estudiantes/);
});

test('formas normales: cada ejemplo tiene una respuesta válida', () => {
  for (const f of FORMAS) { assert.ok(OPCIONES_FN.includes(f.respuesta)); assert.ok(f.explicacion.length > 40); assert.ok(f.filas.every(r => r.length === f.columnas.length)); }
});

// ---------------------------------------------------------------- dos sesiones
import { nuevaBdConc, ejecutarConc, RETOS_CONC } from '../js/labs/concurrencia.js';
for (const [id, r] of Object.entries(RETOS_CONC)) {
  test(`concurrencia «${id}»: la secuencia de ejemplo completa el reto`, () => {
    const s = nuevaBdConc();
    assert.ok(!r.tareas.every(t => t.ok(s)));
    for (const [n, sql] of r.solucion) ejecutarConc(s, n, sql);
    r.tareas.forEach(t => assert.ok(t.ok(s), `${id}: ${t.texto}`));
  });
}
test('concurrencia: comportamiento de los niveles y bloqueos', () => {
  const s = nuevaBdConc();
  ejecutarConc(s, 'A', 'BEGIN'); ejecutarConc(s, 'A', 'UPDATE cuentas SET saldo = saldo - 500 WHERE id = 1');
  assert.match(ejecutarConc(s, 'B', 'SELECT saldo FROM cuentas WHERE id = 1').B[0], /1000/, 'READ COMMITTED no ve lo no confirmado');
  const espera = ejecutarConc(s, 'B', 'UPDATE cuentas SET saldo = saldo - 100 WHERE id = 1');
  assert.match(espera.B[0], /Esperando/);
  assert.match(ejecutarConc(s, 'B', 'SELECT saldo FROM cuentas').B[0], /esperando un bloqueo/);
  const fin = ejecutarConc(s, 'A', 'COMMIT');
  assert.ok(fin.B.some(t => /UPDATE 1/.test(t)));
  assert.equal(s.filas[1].saldo, 400);
  // REPEATABLE READ: lectura estable y error de serialización al escribir algo cambiado
  const r = nuevaBdConc({ nivelB: 'REPEATABLE READ' });
  ejecutarConc(r, 'B', 'BEGIN'); ejecutarConc(r, 'B', 'SELECT saldo FROM cuentas WHERE id = 2');
  ejecutarConc(r, 'A', 'UPDATE cuentas SET saldo = saldo + 100 WHERE id = 2');
  assert.match(ejecutarConc(r, 'B', 'SELECT saldo FROM cuentas WHERE id = 2').B[0], /500/);
  assert.match(ejecutarConc(r, 'B', 'UPDATE cuentas SET saldo = saldo - 10 WHERE id = 2').B[0], /serializar/);
  assert.match(ejecutarConc(r, 'A', 'UPDATE cuentas SET saldo = 999999 WHERE id = 9').A[0], /UPDATE 0/);
  assert.match(ejecutarConc(r, 'A', 'DROP TABLE cuentas').A[0], /no reconocida/);
  assert.match(ejecutarConc(r, 'A', 'UPDATE cuentas SET saldo = saldo - 5000 WHERE id = 1').A[0], /negativo/);
});
