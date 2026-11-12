// Práctica de Git: terminal + gráfico de commits y ramas que se redibuja con cada comando.
import { el } from '../core.js';
import { montarTerminal } from './terminal-ui.js';
import { nuevoRepo, ejecutar, prompt, completar, grafo } from './git.js';
import { GIT_LABS } from './git-labs.js';

const COLORES = ['#0b7285', '#7048e8', '#e8590c', '#2b8a3e', '#c2255c'];
const FILA = 34, COL = 26, X0 = 18, Y0 = 20;

function dibujar(s) {
  const g = grafo(s);
  if (!g.nodos.length) return el('p', { class: 'small muted git-vacio' }, s.iniciado ? 'Repositorio vacío: el gráfico aparecerá con el primer commit.' : 'Todavía no hay repositorio (git init).');
  const pos = Object.fromEntries(g.nodos.map(n => [n.id, { x: X0 + n.carril * COL, y: Y0 + (g.nodos.length - 1 - n.fila) * FILA, c: COLORES[n.carril % COLORES.length] }]));
  const ancho = 520, alto = Y0 * 2 + (g.nodos.length - 1) * FILA;
  const xTexto = X0 + g.carriles * COL + 6;
  const lineas = g.nodos.flatMap(n => n.padres.filter(p => pos[p]).map(p => {
    const a = pos[n.id], b = pos[p];
    const d = a.x === b.x ? `M${a.x} ${a.y} L${b.x} ${b.y}` : `M${a.x} ${a.y} C${a.x} ${a.y + FILA / 2} ${b.x} ${b.y - FILA / 2} ${b.x} ${b.y}`;
    return el('path', { d, fill: 'none', stroke: a.x === b.x ? a.c : pos[n.id].c, 'stroke-width': 2.5 });
  }));
  const nodos = g.nodos.map(n => {
    const p = pos[n.id];
    const etiquetas = (g.etiquetas[n.id] || []);
    let x = xTexto;
    const chips = etiquetas.map(e => { const w = e.texto.length * 6.6 + 14; const grupo = el('g', {}, el('rect', { x, y: p.y - 9, width: w, height: 18, rx: 9, class: 'git-chip' + (e.head ? ' head' : e.remoto ? ' remoto' : '') }), el('text', { x: x + 7, y: p.y + 4, class: 'git-chip-txt' }, e.texto)); x += w + 4; return grupo; });
    return el('g', {}, el('circle', { cx: p.x, cy: p.y, r: 7, fill: p.c, stroke: 'var(--surface)', 'stroke-width': 2 }),
      ...chips, el('text', { x: x + 2, y: p.y + 4, class: 'git-msg' }, `${n.id} ${n.msg}`));
  });
  return el('figure', { class: 'git-grafo' },
    el('svg', { viewBox: `0 0 ${ancho} ${alto}`, width: ancho, height: alto, role: 'img', 'aria-label': 'Gráfico de commits y ramas' }, ...lineas, ...nodos),
    el('figcaption', { class: 'small muted' }, `Rama actual: ${s.head}${s.conflicto ? ' · fusión en curso con conflicto' : ''}`));
}

export function montarGit(holder, id) {
  const lab = GIT_LABS[id];
  if (!lab) throw new Error('Práctica de Git desconocida: ' + id);
  return montarTerminal(holder, {
    lab, progreso: 'git-' + id, nombre: 'Git', clase: 'terminal-linux', panel: dibujar,
    motor: { nuevo: nuevoRepo, ejecutar, prompt, completar, esError: t => /^(fatal|error|CONFLICTO|Auto-fusionando| ! \[rejected\])/m.test(t) },
    bienvenida: 'Terminal con Git. Escribe git help para ver los comandos. Para editar archivos usa echo "texto" > archivo (o >> para añadir).\n',
  });
}
