// Terminal Linux simulada: cada caso empieza sin resolver y su solución lo resuelve; comandos básicos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nuevoLinux, ejecutar, completar } from '../js/labs/linux.js';
import { LINUX_LABS } from '../js/labs/linux-labs.js';

for (const [id, lab] of Object.entries(LINUX_LABS)) {
  test(`Linux «${id}»: empieza sin resolver y la solución lo resuelve`, () => {
    const s = nuevoLinux(lab.equipo);
    assert.ok(!lab.tareas.every(t => t.ok(s)), 'no debe empezar resuelto');
    for (const l of lab.solucion) {
      const r = ejecutar(s, l);
      if (!(id === 'permisos' && l === './backup.sh' && s.historial.length === 1)) assert.ok(!r.error, `«${l}» → ${r.salida}`);
    }
    lab.tareas.forEach(t => assert.ok(t.ok(s), `${id}: tarea sin completar: ${t.texto}`));
  });
}

test('Linux: archivos, permisos, tuberías y redirecciones', () => {
  const s = nuevoLinux();
  assert.equal(ejecutar(s, 'pwd').salida, '/home/alumno');
  ejecutar(s, 'mkdir a'); ejecutar(s, 'cd a');
  assert.match(ejecutar(s, 'pwd').salida, /\/home\/alumno\/a$/);
  ejecutar(s, 'echo hola > x.txt'); ejecutar(s, 'echo adios >> x.txt');
  assert.equal(ejecutar(s, 'cat x.txt').salida, 'hola\nadios');
  assert.equal(ejecutar(s, 'cat x.txt | grep -c o').salida, '2');
  assert.equal(ejecutar(s, 'cat x.txt | wc -l').salida, '2');
  ejecutar(s, 'cd ..');
  assert.match(ejecutar(s, 'touch /etc/prueba').salida, /Permiso denegado/);
  assert.equal(ejecutar(s, 'sudo touch /etc/prueba').error, undefined);
  assert.match(ejecutar(s, 'cat /etc/shadow').salida, /Permiso denegado/);
  assert.match(ejecutar(s, 'ls -l /etc').salida, /nginx/);
  assert.match(ejecutar(s, 'frobnicar').salida, /no se encontró la orden/);
  assert.match(ejecutar(s, 'systemctl restart nginx').salida, /Access denied/);
  assert.match(ejecutar(s, 'ping -c 4 8.8.8.8').salida, /4 recibidos/);
  assert.match(ejecutar(s, 'ping -c 4 10.0.0.99').salida, /0 recibidos/);
  assert.equal(ejecutar(s, 'clear').limpiar, true);
  assert.equal(completar(s, 'cd .ba'), 'cd .bashrc ');
  assert.equal(completar(s, 'cat /etc/hostn'), 'cat /etc/hostname ');
});
