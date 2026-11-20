// Glosario: datos bien formados, sin formas repetidas, y búsqueda de términos con límites de palabra.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { crearBuscadorTerminos, terminosDeArea, slug } from '../js/glosario.js';

const g = JSON.parse(readFileSync(new URL('../data/glosario.json', import.meta.url)));

test('glosario: más de 100 términos, con definición, área y anclas únicas', () => {
  assert.ok(g.length >= 100);
  assert.equal(new Set(g.map(t => slug(t.t))).size, g.length);
  for (const t of g) assert.ok(t.d.length > 20 && ['redes', 'bd', 'prog', 'ti', 'en', 'sec'].includes(t.area) && t.formas[0] === t.t, t.t);
});

test('glosario: encuentra términos completos, respeta siglas y no repite', () => {
  const redes = terminosDeArea(g, 'redes');
  const buscar = crearBuscadorTerminos(redes);
  const usados = new Set();
  const m1 = buscar('Las VLANs separan el tráfico.', usados);
  assert.equal(redes[m1.termino].t, 'VLAN');
  assert.equal('Las VLANs separan el tráfico.'.slice(m1.inicio, m1.fin), 'VLANs');
  assert.equal(buscar('pasaporte y apuntes', new Set()), null, 'no marca trozos de palabras');
  usados.add(m1.termino);
  assert.equal(buscar('Otra VLAN más', usados), null, 'cada término una sola vez');
  const ap = crearBuscadorTerminos(terminosDeArea(g, 'redes'));
  assert.equal(ap('el ap de la sala', new Set()), null, 'las siglas cortas distinguen mayúsculas');
  assert.ok(ap('el AP de la sala', new Set()));
  assert.ok(terminosDeArea(g, 'ti').some(t => t.t === 'DHCP'), 'Empleo TI usa también los de redes');
  assert.ok(!terminosDeArea(g, 'bd').some(t => t.t === 'VLAN'));
});

test('sin conexión: sw.js precarga archivos que existen', () => {
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const lista = JSON.parse(sw.match(/const PRECARGA = (\[.*\]);/)[1]);
  assert.ok(lista.length > 60);
  for (const f of lista.filter(f => f !== './')) assert.ok(existsSync(new URL('../' + f.slice(2), import.meta.url)), f);
  assert.ok(lista.includes('./glosario.html') && lista.includes('./data/glosario.json'));
});
