// Área «Empieza aquí»: datos de las prácticas, rondas, unidades, atajos y test de orientación.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as I from '../js/inicio/inicio.js';
import { INICIO_INFO, CATALOGO } from '../js/labs/catalogo.js';

let s = 11; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);

test('cada ronda tiene 10 preguntas con 4 opciones distintas y la buena entre ellas', () => {
  for (const id of ['atajos', 'archivos', 'partes']) {
    for (let k = 0; k < 20; k++) {
      const r = I.ronda(id, rnd);
      assert.equal(r.length, I.POR_RONDA, id);
      for (const p of r) {
        assert.equal(p.opciones.length, 4, p.q);
        assert.equal(new Set(p.opciones).size, 4, p.q);
        assert.ok(p.c >= 0 && p.c < 4 && p.e, p.q);
      }
    }
  }
  assert.ok(I.ATAJOS.length >= I.POR_RONDA && I.ARCHIVOS.length >= I.POR_RONDA && I.PREGUNTAS_PIEZAS.length >= I.POR_RONDA);
  assert.ok(I.ARCHIVOS.every(a => I.TIPOS[a.t]) && I.PREGUNTAS_PIEZAS.every(p => I.PIEZAS[p.r]));
  assert.equal(new Set(I.ATAJOS.map(a => a.combo)).size, I.ATAJOS.length, 'combinaciones únicas');
});

test('la extensión real es la última: factura.pdf.exe es un programa', () => {
  assert.equal(I.extension('factura.pdf.exe'), '.exe');
  assert.equal(I.ARCHIVOS.find(a => a.nombre === 'factura.pdf.exe').t, 'programa');
});

test('atajos: se reconoce la pulsación (Ctrl o Cmd) y no otra', () => {
  const copiar = I.ATAJOS.find(a => a.combo === 'Ctrl + C');
  assert.ok(I.coincideTecla(copiar, { ctrlKey: true, key: 'c' }));
  assert.ok(I.coincideTecla(copiar, { metaKey: true, key: 'C' }));
  assert.ok(!I.coincideTecla(copiar, { ctrlKey: true, key: 'v' }));
  assert.ok(!I.coincideTecla(copiar, { ctrlKey: true, shiftKey: true, key: 'c' }));
  assert.ok(!I.coincideTecla(copiar, { key: 'c' }));
  assert.ok(I.coincideTecla(I.ATAJOS.find(a => a.combo === 'F2'), { key: 'F2' }));
  assert.ok(!I.coincideTecla(I.ATAJOS.find(a => a.combo === 'Alt + Tab'), { altKey: true, key: 'Tab' }), 'los que no se pueden capturar no se comprueban');
});

test('unidades: respuestas enteras, correctas y aceptadas con formatos razonables', () => {
  for (let k = 0; k < 200; k++) {
    for (const p of I.preguntasUnidades(8, rnd)) {
      assert.ok(I.comprobarUnidad(p, p.opciones ? p.c : p.respuesta), p.q);
      if (p.tipo === 'velocidad') { const v = +p.q.match(/de (\d+) Mbps/)[1]; assert.equal(+p.respuesta, v / 8); }
      if (p.tipo === 'tiempo') { const [, mb, v] = p.q.match(/de ([\d.]+) MB y una conexión de (\d+) Mbps/); assert.equal(+p.respuesta, (+mb * 8) / +v); assert.ok(Number.isInteger(+mb), p.q); }
      if (p.tipo === 'bytes') assert.equal(+p.respuesta * 8, +p.q.match(/(\d+) bits/)[1]);
      if (p.tipo === 'mayor') assert.equal(p.opciones[p.c], p.respuesta);
    }
  }
  assert.ok(I.comprobarUnidad({ respuesta: '5' }, ' 5,0 '));
});

test('orientación: cada pregunta suma a alguna área y el resultado ordena sin empates raros', () => {
  assert.equal(I.PREGUNTAS_ORIENTACION.length, 8);
  for (const a of Object.keys(I.AREAS_ORIENTACION)) assert.ok(I.PREGUNTAS_ORIENTACION.some(p => p.o.some(o => o[1][a] > 0)), a + ' tiene opciones');
  const todo = (k, area) => I.PREGUNTAS_ORIENTACION.map(p => { const i = p.o.findIndex(o => (o[1][area] || 0) >= 1); return i >= 0 ? i : k; });
  for (const a of Object.keys(I.AREAS_ORIENTACION)) assert.equal(I.resultadoOrientacion(todo(0, a))[0][0], a, 'quien elige siempre ' + a + ' recibe ' + a);
  assert.equal(I.resultadoOrientacion([3, 1, 3, 1, 0, 3, 0, 3])[0][0] !== undefined, true);
  assert.equal(I.resultadoOrientacion([])[0][0], 'ti', 'sin respuestas, empieza por soporte');
});

test('el catálogo describe las mismas prácticas', () => {
  const n = { partes: I.POR_RONDA, atajos: I.POR_RONDA, archivos: I.POR_RONDA, unidades: 8, orientacion: I.PREGUNTAS_ORIENTACION.length };
  assert.deepEqual(Object.fromEntries(INICIO_INFO.map(x => [x[0], x[3]])), n);
  assert.equal(CATALOGO.filter(l => l.area === 'base').length, INICIO_INFO.length);
});
