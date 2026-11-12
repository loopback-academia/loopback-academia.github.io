// Empleo TI: detector de phishing, simulador de entrevista y constructor de CV.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CORREOS, SENALES, evaluarCorreo, resumen } from '../js/ti/phishing.js';
import { PREGUNTAS, RUTAS_ENTREVISTA, nuevaEntrevista, puntuar } from '../js/ti/entrevista.js';
import { datosCv, resumenSugerido } from '../js/ti/cv.js';
import { CATALOGO } from '../js/labs/catalogo.js';

test('phishing: bandeja coherente y solo con dominios de ejemplo', () => {
  assert.ok(CORREOS.filter(c => c.phishing).length >= 6 && CORREOS.filter(c => !c.phishing).length >= 5);
  assert.equal(new Set(CORREOS.map(c => c.id)).size, CORREOS.length);
  for (const c of CORREOS) {
    assert.match(c.correo, /@[a-z0-9.-]+\.example$/, c.id);
    for (const l of c.enlaces || []) assert.match(new URL(l.url).hostname, /\.example$/, c.id);
    assert.ok(c.phishing ? c.senales.length >= 2 : c.senales.length === 0, c.id);
    c.senales.forEach(k => assert.ok(SENALES[k], k));
    assert.ok(c.explicacion.length > 40);
  }
});

test('phishing: evaluación y resumen', () => {
  const p = CORREOS.find(c => c.phishing), l = CORREOS.find(c => !c.phishing);
  assert.equal(evaluarCorreo(p, { esPhishing: true, senales: [p.senales[0]] }).ok, true);
  assert.equal(evaluarCorreo(p, { esPhishing: true, senales: [] }).ok, false, 'hay que señalar al menos una pista');
  assert.equal(evaluarCorreo(p, { esPhishing: false }).ok, false);
  assert.equal(evaluarCorreo(l, { esPhishing: false }).ok, true);
  const todas = Object.fromEntries(CORREOS.map(c => [c.id, evaluarCorreo(c, { esPhishing: c.phishing, senales: c.senales })]));
  assert.equal(resumen(todas).aprobado, true);
  delete todas[CORREOS[0].id];
  assert.equal(resumen(todas).aprobado, false, 'faltan correos');
});

test('entrevista: cada ruta da 6 preguntas distintas con puntos clave y respuesta modelo', () => {
  for (const p of PREGUNTAS) assert.ok(p.claves.length >= 3 && p.modelo.length > 80, p.id);
  for (const ruta of Object.keys(RUTAS_ENTREVISTA)) {
    const e = nuevaEntrevista(ruta);
    assert.equal(e.length, 6);
    assert.equal(new Set(e.map(p => p.id)).size, 6);
    assert.equal(e.filter(p => p.tipo === 'tecnica' && p.ruta === ruta).length, 3);
  }
  const e = nuevaEntrevista('soporte');
  const r = puntuar(e, Object.fromEntries(e.map(p => [p.id, p.claves.map((_, k) => String(k))])));
  assert.equal(r.pct, 100);
  assert.equal(puntuar(e, {}).pct, 0);
});

test('CV: solo incluye lo completado', () => {
  const curso = JSON.parse(readFileSync(new URL('../data/curso.json', import.meta.url)));
  const vacio = datosCv({ curso, catalogo: CATALOGO, leccionHecha: () => false, labHecho: () => false, finalAprobado: () => false });
  assert.deepEqual([vacio.modulos.length, vacio.practicas.length, vacio.certificados.length, vacio.lecciones], [0, 0, 0, 0]);
  assert.equal(resumenSugerido(vacio), '');
  const m = curso.modulos.find(x => x.area === 'redes' && !/bienvenida|carrera/i.test(x.titulo));
  const d = datosCv({ curso, catalogo: CATALOGO, leccionHecha: id => m.lecciones.some(l => l.id === id), labHecho: id => id === 'cli-vlan' || id === 'win-dns', finalAprobado: a => a === 'redes' });
  assert.deepEqual(d.modulos.map(x => x.titulo), [m.titulo]);
  assert.equal(d.practicas.length, 2);
  assert.equal(d.certificados[0].area, 'redes');
  assert.ok(d.habilidades.some(h => /Cisco/.test(h)) && d.habilidades.some(h => /Windows/.test(h)));
  assert.match(resumenSugerido(d, 'Técnico de soporte TI'), /^Técnico de soporte TI con formación práctica/);
});
