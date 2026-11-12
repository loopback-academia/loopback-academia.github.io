// Atención al usuario y hardware: hay una forma correcta de superar cada práctica y los errores típicos se detectan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONVERSACIONES, evaluarConversacion, maximo } from '../js/ti/atencion.js';
import { PIEZAS, ENCARGOS, validarPc, AVERIAS, evaluarAverias, ORDENES, evaluarOrden } from '../js/ti/hardware.js';

const total = p => Object.values(p).reduce((a, b) => a + b, 0);
for (const [id, c] of Object.entries(CONVERSACIONES)) {
  test(`atención «${id}»: la mejor respuesta aprueba y la peor no`, () => {
    for (const paso of c.pasos) assert.equal(paso.opciones.length, 3);
    const mejores = c.pasos.map(p => p.opciones.map((o, k) => [total(o.p), k]).sort((a, b) => b[0] - a[0])[0][1]);
    const peores = c.pasos.map(p => p.opciones.map((o, k) => [total(o.p), k]).sort((a, b) => a[0] - b[0])[0][1]);
    const r = evaluarConversacion(c, mejores);
    assert.equal(r.pct, 100); assert.ok(r.aprobado && r.animo > c.animoInicial);
    assert.equal(evaluarConversacion(c, peores).aprobado, false);
    assert.ok(maximo(c) > 0);
  });
}

function combinaciones(encargo) {
  const cats = Object.keys(PIEZAS); const out = [];
  (function rec(i, sel) { if (i === cats.length) { out.push(validarPc(sel, encargo)); return; } for (const p of PIEZAS[cats[i]]) rec(i + 1, { ...sel, [cats[i]]: p.id }); })(0, {});
  return out;
}
for (const [id, e] of Object.entries(ENCARGOS)) {
  test(`armar PC «${id}»: existe al menos una configuración válida y la mayoría no lo son`, () => {
    const r = combinaciones(e);
    const validas = r.filter(x => x.ok).length;
    assert.ok(validas >= 1, 'debe haber solución');
    assert.ok(validas < r.length / 10, 'no debe ser trivial');
  });
}
test('armar PC: detecta incompatibilidades', () => {
  const e = ENCARGOS.oficina;
  const v = validarPc({ cpu: 'r5', placa: 'h610', ram: 'ddr5-16', disco: 'hdd1', gpu: 'ninguna', fuente: 'f300', caja: 'mini' }, e);
  assert.ok(v.problemas.some(p => /no encaja/.test(p)) && v.problemas.some(p => /DDR4/.test(p)) && v.problemas.some(p => /no cabe/.test(p)) && v.problemas.some(p => /SSD/.test(p)));
  assert.ok(validarPc({ cpu: 'i5f', placa: 'h610', ram: 'ddr4-16', disco: 'ssd500', gpu: 'ninguna', fuente: 'f450', caja: 'matx' }, e).problemas.some(p => /gráficos integrados/.test(p)));
  assert.ok(validarPc({ cpu: 'i3', placa: 'h610', ram: 'ddr4-16', disco: 'ssd500', gpu: 'ninguna', fuente: 'f450', caja: 'matx' }, e).ok);
});
test('averías y procedimientos', () => {
  const bien = Object.fromEntries(AVERIAS.map(a => [a.id, a.opciones.findIndex(o => o[1])]));
  assert.ok(AVERIAS.every(a => a.opciones.filter(o => o[1]).length === 1));
  assert.equal(evaluarAverias(bien).aprobado, true);
  assert.equal(evaluarAverias({}).aprobado, false);
  const o = ORDENES['instalar-windows'];
  assert.ok(evaluarOrden('instalar-windows', o.pasos).ok);
  assert.equal(evaluarOrden('instalar-windows', [...o.pasos].reverse()).ok, false);
});
