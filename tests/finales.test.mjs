// Exámenes finales verificados: preparación de preguntas y respuestas, resultados y códigos de certificado.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepararPregunta, respuestasParaServidor, temasOrdenados, finLocal, normalizarCodigo, mensajeFinal } from '../js/finales.js';

const semilla = s => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;

test('las opciones se barajan pero conservan su índice original', () => {
  const p = prepararPregunta({ id: 'red-1', dominio: 'Conmutación', pregunta: '¿?', opciones: ['A', 'B', 'C', 'D'], elige: 2 }, semilla(7));
  assert.deepEqual(p.opciones.map(o => o.texto).sort(), ['A', 'B', 'C', 'D']);
  for (const o of p.opciones) assert.equal(o.texto, 'ABCD'[o.i]);
  assert.equal(p.elige, 2);
  assert.equal(p.texto, '¿?');
});

test('las respuestas se envían como índices originales, únicos y ordenados', () => {
  assert.deepEqual(respuestasParaServidor({ 'red-1': new Set([2, 0]), 'red-2': [1, 1, '3'], 'red-3': [], 'red-4': [-1, 99, 'x'] }),
    { 'red-1': [0, 2], 'red-2': [1, 3] });
});

test('los temas se ordenan del más flojo al más fuerte', () => {
  const t = temasOrdenados({ Conmutación: { p: 5, t: 6 }, Enrutamiento: { p: 2, t: 6 }, Seguridad: { p: 0, t: 0 } });
  assert.deepEqual(t.map(x => x.tema), ['Seguridad', 'Enrutamiento', 'Conmutación']);
  assert.equal(t[1].pct, 33);
});

test('el cronómetro usa la hora límite del servidor aunque el reloj del equipo esté mal', () => {
  const servidor = { ahora: '2026-11-16T10:00:00Z', limite: '2026-11-16T10:40:00Z' };
  const localAdelantado = Date.parse('2026-11-16T10:05:00Z'); // el equipo va 5 minutos adelantado
  assert.equal(finLocal(servidor, localAdelantado) - localAdelantado, 40 * 60000);
});

test('el código del certificado se acepta con o sin prefijo, espacios y minúsculas', () => {
  assert.equal(normalizarCodigo('LB-ABCDEFGH23'), 'LB-ABCDEFGH23');
  assert.equal(normalizarCodigo(' lb abcd efgh 23 '), 'LB-ABCDEFGH23');
  assert.equal(normalizarCodigo('abcdefgh23'), 'LB-ABCDEFGH23');
  assert.equal(normalizarCodigo('LB-ABCDEFGH1O'), null, 'sin I, O, 0 ni 1');
  assert.equal(normalizarCodigo('LB-ABC'), null);
  assert.equal(normalizarCodigo(''), null);
});

test('los errores del servidor se traducen a mensajes claros', () => {
  assert.match(mensajeFinal({ message: 'Ya hiciste 2 intentos de este examen en las últimas 24 horas. Repasa…' }), /2 intentos/);
  assert.match(mensajeFinal({ message: 'Verifica tu segundo factor' }), /verificación en dos pasos/);
  assert.match(mensajeFinal(new Error('Failed to fetch')), /tus respuestas se conservan/);
  assert.match(mensajeFinal({ message: 'algo raro' }), /No se pudo completar/);
});
