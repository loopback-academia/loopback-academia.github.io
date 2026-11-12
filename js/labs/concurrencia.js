// Dos sesiones sobre la misma base de datos: transacciones, niveles de aislamiento, bloqueos de fila y deadlocks.
// Modelo simplificado y fiel a lo esencial (similar a PostgreSQL/MySQL). Sin DOM: se prueba en Node.

export const NIVELES = ['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE'];

export function nuevaBdConc(cfg = {}) {
  return {
    filas: { 1: { titular: 'Ana', saldo: 1000 }, 2: { titular: 'Luis', saldo: 500 } },
    version: { 1: 0, 2: 0 },
    bloqueos: {},
    ses: { A: nuevaSesion(cfg.nivelA), B: nuevaSesion(cfg.nivelB) },
    marcas: new Set(), historial: [],
  };
}
const nuevaSesion = (nivel = 'READ COMMITTED') => ({ nivel, tx: null, esperando: null });
const otra = n => (n === 'A' ? 'B' : 'A');

function empezar(s, n, implicita = false) {
  const x = s.ses[n];
  x.tx = { cambios: {}, snapshot: null, versiones: {}, implicita, leidos: {} };
}
function visible(s, n, id) {
  const x = s.ses[n], tx = x.tx;
  if (tx && id in tx.cambios) return tx.cambios[id];
  if (x.nivel === 'READ UNCOMMITTED') { const o = s.ses[otra(n)].tx; if (o && id in o.cambios) { s.marcas.add('lectura-sucia'); return o.cambios[id]; } }
  if (tx && (x.nivel === 'REPEATABLE READ' || x.nivel === 'SERIALIZABLE')) {
    if (!tx.snapshot) { tx.snapshot = JSON.parse(JSON.stringify(s.filas)); tx.versiones = { ...s.version }; }
    return tx.snapshot[id].saldo;
  }
  const o = s.ses[otra(n)].tx;
  if (x.nivel === 'READ COMMITTED' && o && id in o.cambios) s.marcas.add('lectura-limpia');
  return s.filas[id].saldo;
}
function liberar(s, n) {
  for (const [id, quien] of Object.entries(s.bloqueos)) if (quien === n) delete s.bloqueos[id];
}
function terminar(s, n, confirmar) {
  const x = s.ses[n], tx = x.tx;
  if (!tx) return [];
  if (confirmar) for (const [id, v] of Object.entries(tx.cambios)) { s.filas[id].saldo = v; s.version[id]++; if (tx.seguro && id === '1') s.bien = (s.bien || 0) + 1; }
  x.tx = null;
  liberar(s, n);
  // Si la otra sesión esperaba por una de estas filas, continúa ahora.
  const o = otra(n), espera = s.ses[o].esperando;
  if (espera && !s.bloqueos[espera.id]) { s.ses[o].esperando = null; s.marcas.add('desbloqueo'); return [[o, '(la fila se ha liberado: continúa la sentencia pendiente)'], ...ejecutarSentencia(s, o, espera.sql).map(t => [o, t])]; }
  return [];
}
// Escribir o leer FOR UPDATE: hace falta el bloqueo de la fila.
function bloquear(s, n, id, sql) {
  const quien = s.bloqueos[id];
  if (quien && quien !== n) {
    const o = otra(n);
    if (s.ses[o].esperando && s.bloqueos[s.ses[o].esperando.id] === n) {
      s.marcas.add('deadlock');
      const msg = `ERROR: deadlock detectado. La sesión ${n} esperaba la fila ${id} (bloqueada por ${o}) y ${o} esperaba una fila bloqueada por ${n}. Se cancela la transacción de ${n}.`;
      const extra = terminar(s, n, false);
      return { error: msg, extra };
    }
    s.ses[n].esperando = { id, sql };
    s.marcas.add('espera');
    return { espera: `⏳ Esperando… la fila ${id} está bloqueada por la sesión ${quien} hasta que haga COMMIT o ROLLBACK.` };
  }
  s.bloqueos[id] = n;
  return {};
}
// En REPEATABLE READ / SERIALIZABLE no se puede modificar una fila que otra transacción cambió después de tu instantánea.
function conflictoSerial(s, n, id) {
  const x = s.ses[n];
  return (x.nivel === 'REPEATABLE READ' || x.nivel === 'SERIALIZABLE') && x.tx?.snapshot && s.version[id] !== x.tx.versiones[id];
}

const RE = {
  nivel: /^set\s+(?:session\s+)?transaction\s+isolation\s+level\s+(read\s+uncommitted|read\s+committed|repeatable\s+read|serializable)$/i,
  begin: /^(begin|start\s+transaction)$/i, commit: /^commit$/i, rollback: /^rollback$/i,
  select: /^select\s+(saldo|\*)\s+from\s+cuentas(?:\s+where\s+id\s*=\s*(\d+))?(\s+for\s+update)?$/i,
  update: /^update\s+cuentas\s+set\s+saldo\s*=\s*(saldo\s*([+-])\s*(\d+)|(\d+))\s+where\s+id\s*=\s*(\d+)$/i,
};

function ejecutarSentencia(s, n, sqlCrudo) {
  const sql = sqlCrudo.trim().replace(/;\s*$/, '').replace(/\s+/g, ' ');
  const x = s.ses[n];
  let m;
  if ((m = sql.match(RE.nivel))) { if (x.tx) return ['ERROR: el nivel de aislamiento se fija antes de BEGIN.']; x.nivel = m[1].toUpperCase().replace(/\s+/g, ' '); return [`Nivel de aislamiento: ${x.nivel}`]; }
  if (RE.begin.test(sql)) { if (x.tx) return ['AVISO: ya hay una transacción en curso.']; empezar(s, n); return ['BEGIN']; }
  if (RE.commit.test(sql)) { if (!x.tx) return ['AVISO: no hay ninguna transacción en curso.']; s.marcas.add('commit-' + n); const extra = terminar(s, n, true); s.extra = extra; return ['COMMIT']; }
  if (RE.rollback.test(sql)) { if (!x.tx) return ['AVISO: no hay ninguna transacción en curso.']; s.marcas.add('rollback-' + n); const extra = terminar(s, n, false); s.extra = extra; return ['ROLLBACK']; }
  if ((m = sql.match(RE.select))) {
    const implicita = !x.tx; if (implicita) empezar(s, n, true);
    const ids = m[2] ? [m[2]] : Object.keys(s.filas);
    if (ids.some(id => !s.filas[id])) { if (implicita) terminar(s, n, false); return ['(0 filas)']; }
    if (m[3]) {
      for (const id of ids) {
        if (conflictoSerial(s, n, id)) { const extra = terminar(s, n, false); s.extra = extra; s.marcas.add('serializacion'); return ['ERROR: no se pudo serializar el acceso por una actualización concurrente. Se cancela la transacción: repítela.']; }
        const r = bloquear(s, n, id, sqlCrudo); if (r.error) { s.extra = r.extra; return [r.error]; } if (r.espera) return [r.espera];
      }
      s.marcas.add('for-update'); x.tx.seguro = true;
    }
    const out = ids.map(id => { const v = m[3] ? (x.tx.cambios[id] ?? s.filas[id].saldo) : visible(s, n, id); x.tx && (x.tx.leidos[id] = { valor: v, version: s.version[id] }); return m[1] === '*' ? `${id} | ${s.filas[id].titular} | ${v}` : String(v); });
    if (implicita) terminar(s, n, false);
    return [(m[1] === '*' ? 'id | titular | saldo\n' : 'saldo\n') + out.join('\n')];
  }
  if ((m = sql.match(RE.update))) {
    const id = m[5];
    if (!s.filas[id]) return ['UPDATE 0'];
    const implicita = !x.tx; if (implicita) empezar(s, n, true);
    if (conflictoSerial(s, n, id)) { const extra = terminar(s, n, false); s.extra = extra; s.marcas.add('serializacion'); return ['ERROR: no se pudo serializar el acceso por una actualización concurrente. Se cancela la transacción: repítela.']; }
    const r = bloquear(s, n, id, sqlCrudo);
    if (r.error) { s.extra = r.extra; return [r.error]; }
    if (r.espera) { if (implicita) x.tx.implicita = true; return [r.espera]; }
    const actual = x.tx.cambios[id] ?? s.filas[id].saldo;
    let nuevo;
    if (m[4]) {
      nuevo = Number(m[4]);
      // Actualización perdida: se escribe un valor fijo calculado a partir de una lectura que ya no es la última.
      const leido = x.tx.leidos[id];
      if (leido && leido.version !== s.version[id]) s.marcas.add('perdida');
      s.marcas.add('literal');
    } else { nuevo = m[2] === '-' ? actual - Number(m[3]) : actual + Number(m[3]); s.marcas.add('relativo'); x.tx.seguro = true; }
    if (nuevo < 0) { if (implicita) terminar(s, n, false); return ['ERROR: el saldo no puede quedar negativo (restricción CHECK).']; }
    x.tx.cambios[id] = nuevo;
    if (x.tx.implicita) { const extra = terminar(s, n, true); s.extra = extra; }
    return ['UPDATE 1'];
  }
  return ['ERROR: sentencia no reconocida en este simulador. Usa los botones de ejemplo o escribe BEGIN, SELECT saldo FROM cuentas WHERE id = 1, UPDATE cuentas SET saldo = saldo - 100 WHERE id = 1, COMMIT o ROLLBACK.'];
}

// Ejecuta en la sesión n. Devuelve las líneas para cada sesión (una sentencia puede desbloquear a la otra).
export function ejecutarConc(s, n, sql) {
  const salida = { A: [], B: [] };
  if (!sql.trim()) return salida;
  if (s.ses[n].esperando) { salida[n].push('⏳ Esta sesión está esperando un bloqueo: no puede ejecutar nada hasta que la otra termine.'); return salida; }
  s.historial.push(`${n}: ${sql.trim()}`);
  s.extra = [];
  for (const t of ejecutarSentencia(s, n, sql)) salida[n].push(t);
  for (const [k, t] of s.extra || []) salida[k].push(t);
  return salida;
}

// ---------------------------------------------------------------- retos
export const RETOS_CONC = {
  sucia: {
    titulo: 'Lectura sucia', nivel: 'intermedio',
    intro: 'La sesión A empieza a retirar 500 de la cuenta 1 pero aún no ha confirmado. ¿Qué ve la sesión B? Depende de su nivel de aislamiento.',
    tareas: [
      { texto: 'Con B en READ UNCOMMITTED, haz que B lea un saldo que A todavía no ha confirmado.', ok: s => s.marcas.has('lectura-sucia') },
      { texto: 'A deshace su cambio (ROLLBACK): lo que leyó B nunca existió.', ok: s => s.marcas.has('lectura-sucia') && s.marcas.has('rollback-A') },
      { texto: 'Repite con B en READ COMMITTED y comprueba que ya no ve el cambio sin confirmar.', ok: s => s.marcas.has('lectura-limpia') },
    ],
    ejemplos: { A: ['BEGIN', 'UPDATE cuentas SET saldo = saldo - 500 WHERE id = 1', 'ROLLBACK'], B: ['SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED', 'SET TRANSACTION ISOLATION LEVEL READ COMMITTED', 'SELECT saldo FROM cuentas WHERE id = 1'] },
    solucion: [['B', 'SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED'], ['A', 'BEGIN'], ['A', 'UPDATE cuentas SET saldo = saldo - 500 WHERE id = 1'], ['B', 'SELECT saldo FROM cuentas WHERE id = 1'], ['A', 'ROLLBACK'], ['B', 'SET TRANSACTION ISOLATION LEVEL READ COMMITTED'], ['A', 'BEGIN'], ['A', 'UPDATE cuentas SET saldo = saldo - 500 WHERE id = 1'], ['B', 'SELECT saldo FROM cuentas WHERE id = 1'], ['A', 'ROLLBACK']],
  },
  bloqueo: {
    titulo: 'Bloqueos de fila', nivel: 'intermedio',
    intro: 'Dos cajeros cobran a la vez de la misma cuenta. La base de datos no deja que dos transacciones modifiquen la misma fila a la vez: la segunda espera.',
    tareas: [
      { texto: 'A abre una transacción y modifica la cuenta 1 sin confirmar.', ok: s => s.historial.some(h => /^A: update/i.test(h)) },
      { texto: 'B intenta modificar la misma cuenta y se queda esperando.', ok: s => s.marcas.has('espera') },
      { texto: 'A confirma (COMMIT) y la sentencia de B continúa sola.', ok: s => s.marcas.has('desbloqueo') && s.marcas.has('commit-A') },
      { texto: 'B confirma y el saldo final refleja los dos cobros.', ok: s => s.marcas.has('commit-B') && s.filas[1].saldo === 1000 - 300 - 200 },
    ],
    ejemplos: { A: ['BEGIN', 'UPDATE cuentas SET saldo = saldo - 300 WHERE id = 1', 'COMMIT'], B: ['BEGIN', 'UPDATE cuentas SET saldo = saldo - 200 WHERE id = 1', 'COMMIT', 'SELECT * FROM cuentas'] },
    solucion: [['A', 'BEGIN'], ['A', 'UPDATE cuentas SET saldo = saldo - 300 WHERE id = 1'], ['B', 'BEGIN'], ['B', 'UPDATE cuentas SET saldo = saldo - 200 WHERE id = 1'], ['A', 'COMMIT'], ['B', 'COMMIT']],
  },
  perdida: {
    titulo: 'La actualización perdida', nivel: 'avanzado',
    intro: 'Dos programas retiran 100 de la cuenta 1 (saldo 1000) a la vez. Cada uno lee el saldo, calcula el nuevo en su código y lo escribe. El saldo final debería ser 800.',
    tareas: [
      { texto: 'Provoca el error: las dos sesiones leen 1000 y escriben el valor fijo 900 (saldo = 900). Se pierde una retirada.', ok: s => s.marcas.has('perdida') },
      { texto: 'Hazlo bien: usa saldo = saldo - 100 (cálculo dentro de la base de datos) o bloquea la fila al leer con SELECT … FOR UPDATE, y deja el saldo final en el valor correcto.', ok: s => s.marcas.has('perdida') && (s.bien || 0) >= 2 },
    ],
    ejemplos: { A: ['BEGIN', 'SELECT saldo FROM cuentas WHERE id = 1', 'UPDATE cuentas SET saldo = 900 WHERE id = 1', 'UPDATE cuentas SET saldo = saldo - 100 WHERE id = 1', 'SELECT saldo FROM cuentas WHERE id = 1 FOR UPDATE', 'COMMIT'], B: ['BEGIN', 'SELECT saldo FROM cuentas WHERE id = 1', 'UPDATE cuentas SET saldo = 900 WHERE id = 1', 'UPDATE cuentas SET saldo = saldo - 100 WHERE id = 1', 'COMMIT'] },
    solucion: [['A', 'BEGIN'], ['B', 'BEGIN'], ['A', 'SELECT saldo FROM cuentas WHERE id = 1'], ['B', 'SELECT saldo FROM cuentas WHERE id = 1'], ['A', 'UPDATE cuentas SET saldo = 900 WHERE id = 1'], ['A', 'COMMIT'], ['B', 'UPDATE cuentas SET saldo = 900 WHERE id = 1'], ['B', 'COMMIT'], ['A', 'UPDATE cuentas SET saldo = saldo - 100 WHERE id = 1'], ['B', 'UPDATE cuentas SET saldo = saldo - 100 WHERE id = 1']],
  },
  deadlock: {
    titulo: 'Deadlock (interbloqueo)', nivel: 'avanzado',
    intro: 'Una transferencia de la cuenta 1 a la 2 y otra de la 2 a la 1 empiezan a la vez, cada una por su cuenta de origen. Cada una espera a la otra para siempre… salvo que la base de datos lo detecte.',
    tareas: [
      { texto: 'A bloquea la cuenta 1 y B bloquea la cuenta 2 (cada una con un UPDATE dentro de su transacción).', ok: s => s.historial.some(h => /^A: update.*id\s*=\s*1/i.test(h)) && s.historial.some(h => /^B: update.*id\s*=\s*2/i.test(h)) },
      { texto: 'Ahora cada una intenta modificar la cuenta de la otra: provoca el deadlock.', ok: s => s.marcas.has('deadlock') },
      { texto: 'Termina la transacción que sigue viva (COMMIT) y comprueba los saldos.', ok: s => s.marcas.has('deadlock') && !s.ses.A.tx && !s.ses.B.tx && !s.ses.A.esperando && !s.ses.B.esperando },
    ],
    ejemplos: { A: ['BEGIN', 'UPDATE cuentas SET saldo = saldo - 100 WHERE id = 1', 'UPDATE cuentas SET saldo = saldo + 100 WHERE id = 2', 'COMMIT'], B: ['BEGIN', 'UPDATE cuentas SET saldo = saldo - 50 WHERE id = 2', 'UPDATE cuentas SET saldo = saldo + 50 WHERE id = 1', 'COMMIT', 'SELECT * FROM cuentas'] },
    solucion: [['A', 'BEGIN'], ['A', 'UPDATE cuentas SET saldo = saldo - 100 WHERE id = 1'], ['B', 'BEGIN'], ['B', 'UPDATE cuentas SET saldo = saldo - 50 WHERE id = 2'], ['A', 'UPDATE cuentas SET saldo = saldo + 100 WHERE id = 2'], ['B', 'UPDATE cuentas SET saldo = saldo + 50 WHERE id = 1'], ['A', 'COMMIT']],
  },
};
