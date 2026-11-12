// Consola de Windows simulada: cada caso empieza sin resolver y su solución completa todas las tareas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nuevoPc, ejecutar, completar } from '../js/labs/windows.js';
import { WIN_LABS } from '../js/labs/windows-labs.js';

for (const [id, lab] of Object.entries(WIN_LABS)) {
  test(`Windows «${id}»: empieza sin resolver y la solución lo resuelve`, () => {
    const s = nuevoPc(lab.equipo);
    assert.ok(!lab.tareas.every(t => t.ok(s)), 'no debe empezar resuelto');
    assert.ok(lab.pistas.length >= 2 && lab.intro && lab.titulo);
    for (const linea of lab.solucion) {
      const r = ejecutar(s, linea);
      assert.doesNotMatch(r.salida, /no se reconoce como un comando|sintaxis no válida|no se encontró el comando/i, `«${linea}» → ${r.salida}`);
    }
    lab.tareas.forEach(t => assert.ok(t.ok(s), `${id}: tarea sin completar: ${t.texto}`));
  });
}

test('Windows: comportamiento de red', () => {
  const s = nuevoPc({ adaptador: { ip: '169.254.1.1', mask: '255.255.0.0', gw: null } });
  assert.match(ejecutar(s, 'ipconfig').salida, /configuración automática.*169\.254/);
  assert.match(ejecutar(s, 'ping 8.8.8.8').salida, /Error general|inaccesible|agotado/);
  ejecutar(s, 'ipconfig /renew');
  assert.match(ejecutar(s, 'ping 192.168.10.1').salida, /recibidos = 4/);
  assert.match(ejecutar(s, 'ping 192.168.10.99').salida, /agotado/);
  assert.match(ejecutar(s, 'ping noexiste.empresa.local').salida, /no pudo encontrar el host/);
  assert.match(ejecutar(s, 'nslookup intranet.empresa.local').salida, /192\.168\.10\.20/);
  assert.match(ejecutar(s, 'tracert www.google.com').salida, /192\.168\.10\.1[\s\S]*142\.250\.78\.4/);
  assert.match(ejecutar(s, 'frobnicar').salida, /no se reconoce/);
  assert.match(ejecutar(s, 'taskkill /im System /f').salida, /crítico/);
  assert.equal(ejecutar(s, 'cls').limpiar, true);
  assert.equal(completar(s, 'ipconfig /fl'), 'ipconfig /flushdns ');
  // net use sin permiso
  assert.match(ejecutar(s, 'net use Z: \\\\srv-archivos\\contabilidad').salida, /Acceso denegado/);
  assert.match(ejecutar(s, 'net use Z: \\\\srv-archivos\\comun').salida, /correctamente/);
});
