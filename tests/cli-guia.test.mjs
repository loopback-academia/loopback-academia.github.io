// Modo «Te acompaño» del simulador de IOS: explicaciones, modos y reconocimiento de comandos abreviados.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LABS } from '../js/labs/ios-labs.js';
import { nuevoEquipo, ejecutar } from '../js/labs/ios.js';
import { construirGuia, avanzar, consejoModo, traducirError, explicar, fichaComandos } from '../js/labs/cli-guia.js';

const guiados = Object.entries(LABS).filter(([, l]) => l.tipo !== 'averia');

test('cada comando de cada laboratorio guiado tiene explicación para principiantes y lo entiende el simulador', () => {
  for (const [id, lab] of guiados) {
    for (const p of construirGuia(lab)) {
      assert.ok(p.que, `${id}: falta explicación para «${p.linea}»`);
      assert.ok(p.p, `${id}: el simulador no entiende «${p.linea}»`);
    }
  }
});

test('seguir la guía al pie de la letra completa todas las tareas del laboratorio', () => {
  for (const [id, lab] of guiados) {
    const guia = construirGuia(lab), eq = nuevoEquipo(lab.equipo);
    let i = 0;
    for (const p of guia) { ejecutar(eq, p.linea); i = avanzar(guia, i, eq); }
    assert.equal(i, guia.length, id);
  }
});

test('reconoce comandos abreviados y contraseñas inventadas por el alumno', () => {
  const lab = LABS.basico, guia = construirGuia(lab), eq = nuevoEquipo(lab.equipo);
  let i = 0;
  for (const t of ['en', 'conf t', 'hostname SW-OFICINA', 'enable secret MiClave', 'serv pass', 'banner motd #Hola#', 'line con 0', 'pass otra', 'login', 'exec-t 5 0', 'end', 'copy run start']) {
    ejecutar(eq, t); i = avanzar(guia, i, eq);
  }
  assert.equal(i, guia.length);
  const v = LABS.vlan, gv = construirGuia(v), e2 = nuevoEquipo(v.equipo);
  i = 0;
  for (const t of ['conf t', 'vlan 10', 'name VENTAS', 'vlan 20', 'name SOPORTE', 'exit', 'int range FastEthernet0/1-10']) { ejecutar(e2, t); i = avanzar(gv, i, e2); }
  assert.equal(i, 7);
});

test('no avanza con un nombre distinto al pedido', () => {
  const lab = LABS.basico, guia = construirGuia(lab), eq = nuevoEquipo(lab.equipo);
  ejecutar(eq, 'enable'); ejecutar(eq, 'conf t');
  ejecutar(eq, 'hostname OTRO');
  assert.equal(avanzar(guia, 2, eq), 2);
});

test('explica cómo llegar al modo correcto', () => {
  const guia = construirGuia(LABS.basico);
  assert.match(consejoModo(guia, 2, 'user'), /enable y después configure terminal/);
  assert.match(consejoModo(guia, 2, 'priv'), /configure terminal/);
  assert.equal(consejoModo(guia, 2, 'config'), null);
  assert.match(consejoModo(guia, 7, 'config'), /line console 0/);
  assert.match(consejoModo(guia, 11, 'line'), /end/);
});

test('traduce los errores de IOS y explica comandos sueltos', () => {
  assert.match(traducirError('% Invalid input detected'), /no entiende/);
  assert.match(traducirError('% Incomplete command.'), /falta/);
  assert.match(traducirError('% Ambiguous command:  "s"'), /abreviatura/);
  assert.equal(traducirError(''), null);
  assert.match(explicar('hostname R1'), /nombre/);
});

test('la ficha del cuaderno no repite comandos', () => {
  const f = fichaComandos(LABS.vlan);
  const textos = f.map(p => p.que);
  assert.equal(new Set(textos).size, textos.length);
  assert.ok(f.length >= 8);
});
