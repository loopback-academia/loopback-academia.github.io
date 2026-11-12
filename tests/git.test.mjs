// Git simulado: cada práctica empieza sin resolver y la solución la resuelve; fusiones y errores típicos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nuevoRepo, ejecutar, grafo, completar } from '../js/labs/git.js';
import { GIT_LABS } from '../js/labs/git-labs.js';

for (const [id, lab] of Object.entries(GIT_LABS)) {
  test(`Git «${id}»: empieza sin resolver y la solución lo resuelve`, () => {
    const s = nuevoRepo(lab.equipo);
    assert.ok(!lab.tareas.every(t => t.ok(s)), 'no debe empezar resuelto');
    for (const l of lab.solucion) {
      const r = ejecutar(s, l);
      if (!(id === 'conflicto' && /^git merge/.test(l))) assert.ok(!r.error, `«${l}» → ${r.salida}`);
    }
    lab.tareas.forEach(t => assert.ok(t.ok(s), `${id}: tarea sin completar: ${t.texto}`));
    const g = grafo(s);
    assert.equal(g.nodos.length, s.orden.length);
  });
}

test('Git: errores habituales', () => {
  const s = nuevoRepo();
  assert.match(ejecutar(s, 'git status').salida, /no es un repositorio/);
  ejecutar(s, 'git init');
  assert.match(ejecutar(s, 'git commit -m "x"').salida, /nada para hacer commit/);
  assert.match(ejecutar(s, 'git branch otra').salida, /primer commit/);
  ejecutar(s, 'echo hola > a.txt');
  assert.match(ejecutar(s, 'git status').salida, /sin seguimiento[\s\S]*a\.txt/);
  assert.match(ejecutar(s, 'git commit -m "x"').salida, /git add/);
  ejecutar(s, 'git add .');
  assert.match(ejecutar(s, 'git commit').salida, /Falta el mensaje/);
  assert.match(ejecutar(s, 'git commit -m "Primero"').salida, /commit-raíz/);
  ejecutar(s, 'git switch -c b'); ejecutar(s, 'echo cambio > a.txt'); ejecutar(s, 'git commit -am "En b"');
  ejecutar(s, 'git switch main');
  assert.match(ejecutar(s, 'git branch -d b').salida, /no ha sido fusionada/);
  assert.match(ejecutar(s, 'git push origin main').salida, /origin/);
  assert.equal(completar(s, 'git sta'), 'git status ');
  assert.equal(completar(s, 'git merge '), null);
});
