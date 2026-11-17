// Planes de pago: precios coherentes y enlaces de WhatsApp bien formados.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLANES, NOMBRE_PLAN, mensajeWhatsApp, enlaceWhatsApp, pesos } from '../js/planes.js';
import { readFileSync } from 'node:fs';

test('los planes más largos salen más baratos por mes y todos tienen nombre', () => {
  const porMes = k => PLANES[k].dop / { mensual: 1, trimestral: 3, anual: 12, fundador: 12 }[k];
  assert.ok(porMes('trimestral') < porMes('mensual'));
  assert.ok(porMes('anual') < porMes('trimestral'));
  assert.ok(PLANES.fundador.dop < PLANES.anual.dop);
  for (const k of Object.keys(PLANES)) assert.ok(NOMBRE_PLAN[k], k);
});

test('la página de precios muestra los mismos precios que planes.js', () => {
  const html = readFileSync(new URL('../src/paginas/precios.html', import.meta.url), 'utf8');
  for (const p of Object.values(PLANES)) {
    assert.ok(html.includes(pesos(p.dop)), `falta ${pesos(p.dop)} en precios.html`);
    assert.ok(html.includes('US$ ' + p.usd), `falta US$ ${p.usd} en precios.html`);
  }
});

test('el enlace de WhatsApp lleva el plan, el precio y el correo', () => {
  const url = enlaceWhatsApp('18095551234', 'trimestral', 'ana@example.com');
  assert.match(url, /^https:\/\/wa\.me\/18095551234\?text=/);
  const texto = decodeURIComponent(url.split('text=')[1]);
  assert.match(texto, /3 meses/); assert.match(texto, /RD\$ 1,199/); assert.match(texto, /ana@example\.com/);
  assert.equal(enlaceWhatsApp('', 'mensual'), null, 'sin número no hay enlace');
  assert.equal(enlaceWhatsApp('809-555-1234', 'mensual'), null, 'solo dígitos');
  assert.throws(() => mensajeWhatsApp('vitalicio'));
});
