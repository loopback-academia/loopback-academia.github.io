// Simulador de Git: repositorio en memoria con área de preparación, commits, ramas, fusiones (con conflictos) y un
// remoto «origin». Sin DOM: se prueba en Node. El gráfico lo dibuja git-ui.js a partir de grafo(s).

const hex = n => ((Math.imul(n + 7, 2654435761) >>> 0).toString(16) + '0000000').slice(0, 7);

export function nuevoRepo(cfg = {}) {
  const s = { iniciado: false, commits: {}, orden: [], ramas: {}, head: 'main', index: {}, trabajo: {}, remoto: null, remotoRamas: {}, conflicto: null, n: 0, historial: [], patrones: new Set(), cwd: '~/tienda-web' };
  if (cfg.estadoInicial) cfg.estadoInicial(s, ayudantes(s));
  return s;
}
// Para preparar escenarios: crea commits directamente.
function ayudantes(s) {
  return {
    init() { s.iniciado = true; },
    commit(msg, cambios, rama = s.head) { s.head = rama; Object.assign(s.trabajo, cambios); s.index = { ...arbolActual(s), ...cambios }; return hacerCommit(s, msg); },
    rama(nombre, desde = s.ramas[s.head]) { s.ramas[nombre] = desde; },
    cambiar(nombre) { s.head = nombre; s.trabajo = { ...arbolDe(s, s.ramas[nombre]) }; s.index = { ...s.trabajo }; },
    remoto() { s.remoto = 'https://git.ejemplo.dev/laceiba/tienda-web.git'; },
  };
}
const arbolDe = (s, id) => (id ? s.commits[id].arbol : {});
const arbolActual = s => arbolDe(s, s.ramas[s.head]);
function hacerCommit(s, msg, padres = s.ramas[s.head] ? [s.ramas[s.head]] : []) {
  const id = hex(++s.n);
  s.commits[id] = { id, msg, padres, arbol: { ...s.index }, rama: s.head };
  s.orden.push(id);
  s.ramas[s.head] = id;
  return id;
}
const esAncestro = (s, a, b) => { const pila = [b]; const vistos = new Set(); while (pila.length) { const x = pila.pop(); if (x === a) return true; if (!x || vistos.has(x)) continue; vistos.add(x); pila.push(...s.commits[x].padres); } return false; };
const cambiosSinPreparar = s => [...new Set([...Object.keys(s.trabajo), ...Object.keys(s.index)])].filter(f => s.trabajo[f] !== s.index[f]);
const preparados = s => { const a = arbolActual(s); return [...new Set([...Object.keys(a), ...Object.keys(s.index)])].filter(f => s.index[f] !== a[f]); };

// ---------------------------------------------------------------- comandos de git
function status(s) {
  const L = [`En la rama ${s.head}`];
  if (s.conflicto) L.push(`Tienes rutas no fusionadas.\n  (arregla los conflictos y ejecuta "git commit")\n\nRutas no fusionadas:\n${s.conflicto.archivos.filter(f => /<<<<<<</.test(s.trabajo[f] || '') || s.index[f] !== s.trabajo[f]).map(f => '\tmodificados por ambos:  ' + f).join('\n')}`);
  if (!s.ramas[s.head]) L.push('\nNo hay commits todavía');
  const p = preparados(s), sp = cambiosSinPreparar(s);
  if (p.length) L.push('\nCambios a ser confirmados:\n  (usa "git restore --staged <archivo>..." para sacar del área de preparación)\n' + p.map(f => `\t${s.index[f] === undefined ? 'borrado' : arbolActual(s)[f] === undefined ? 'nuevo archivo' : 'modificado'}:  ${f}`).join('\n'));
  const nuevos = sp.filter(f => s.index[f] === undefined && s.trabajo[f] !== undefined), mod = sp.filter(f => !nuevos.includes(f));
  if (mod.length && !s.conflicto) L.push('\nCambios no preparados para el commit:\n  (usa "git add <archivo>..." para actualizar lo que será confirmado)\n' + mod.map(f => '\tmodificado:  ' + f).join('\n'));
  if (nuevos.length) L.push('\nArchivos sin seguimiento:\n  (usa "git add <archivo>..." para incluirlo a lo que será confirmado)\n' + nuevos.map(f => '\t' + f).join('\n'));
  if (!p.length && !sp.length && !s.conflicto) L.push('nada para hacer commit, el árbol de trabajo está limpio');
  return L.join('\n');
}
function add(s, args) {
  const archivos = args.includes('.') || args.includes('-A') ? [...new Set([...Object.keys(s.trabajo), ...Object.keys(s.index)])] : args;
  if (!archivos.length) return { error: 'Nada especificado, nada agregado.\n(Usa git add archivo o git add .)' };
  for (const f of archivos) {
    if (!(f in s.trabajo) && !(f in s.index)) return { error: `fatal: ruta especificada '${f}' no concordó con ningún archivo` };
    if (f in s.trabajo) s.index[f] = s.trabajo[f]; else delete s.index[f];
  }
  return '';
}
function commit(s, args) {
  const k = args.findIndex(a => a === '-m' || a === '-am');
  if (args.includes('-am')) add(s, ['.']);
  if (k < 0 || !args[k + 1]) return { error: 'Falta el mensaje. Usa: git commit -m "mensaje que explique el cambio"' };
  if (s.conflicto) {
    const sinResolver = s.conflicto.archivos.filter(f => /<<<<<<<|>>>>>>>/.test(s.index[f] || ''));
    if (sinResolver.length) return { error: `error: no es posible hacer commit porque tienes archivos sin fusionar.\n${sinResolver.map(f => 'U\t' + f).join('\n')}\nhint: arregla el archivo, márcalo con git add y haz commit.` };
    const id = hacerCommit(s, args[k + 1], [s.ramas[s.head], s.conflicto.de]);
    s.conflicto = null;
    return `[${s.head} ${id}] ${args[k + 1]}`;
  }
  const p = preparados(s);
  if (!p.length) return { error: `En la rama ${s.head}\nnada para hacer commit${cambiosSinPreparar(s).length ? ' (hay cambios sin preparar: usa git add)' : ', el árbol de trabajo está limpio'}` };
  const id = hacerCommit(s, args[k + 1]);
  return `[${s.head}${s.commits[id].padres.length ? '' : ' (commit-raíz)'} ${id}] ${args[k + 1]}\n ${p.length} archivo${p.length === 1 ? '' : 's'} cambiado${p.length === 1 ? '' : 's'}`;
}
function log(s, args) {
  const ids = []; const vistos = new Set(); const pila = [s.ramas[s.head]];
  while (pila.length) { const x = pila.shift(); if (!x || vistos.has(x)) continue; vistos.add(x); ids.push(x); pila.push(...s.commits[x].padres); }
  ids.sort((a, b) => s.orden.indexOf(b) - s.orden.indexOf(a));
  if (!ids.length) return { error: `fatal: tu rama actual '${s.head}' no tiene ningún commit todavía` };
  const etiquetas = id => { const r = Object.entries(s.ramas).filter(([, v]) => v === id).map(([k]) => (k === s.head ? 'HEAD -> ' + k : k)); const o = Object.entries(s.remotoRamas).filter(([, v]) => v === id).map(([k]) => 'origin/' + k); return r.length || o.length ? ` (${[...r, ...o].join(', ')})` : ''; };
  if (args.includes('--oneline')) return ids.map(id => `${args.includes('--graph') ? (s.commits[id].padres.length > 1 ? '*   ' : '* ') : ''}${id}${etiquetas(id)} ${s.commits[id].msg}`).join('\n');
  return ids.map(id => `commit ${id}${etiquetas(id)}\n${s.commits[id].padres.length > 1 ? 'Merge: ' + s.commits[id].padres.join(' ') + '\n' : ''}Author: Alumno <alumno@laceiba.example>\n\n    ${s.commits[id].msg}\n`).join('\n');
}
function rama(s, args) {
  if (!args.length) return Object.keys(s.ramas).sort().map(r => (r === s.head ? '* ' : '  ') + r).join('\n');
  if (args[0] === '-d' || args[0] === '-D') {
    const r = args[1];
    if (!s.ramas[r]) return { error: `error: rama '${r}' no encontrada.` };
    if (r === s.head) return { error: `error: no se puede borrar la rama '${r}' en la que estás.` };
    if (args[0] === '-d' && !esAncestro(s, s.ramas[r], s.ramas[s.head])) return { error: `error: la rama '${r}' no ha sido fusionada completamente.\nSi estás seguro de querer borrarla, ejecuta 'git branch -D ${r}'.` };
    const id = s.ramas[r]; delete s.ramas[r]; s.borradas = [...(s.borradas || []), r];
    return `Eliminada la rama ${r} (era ${id}).`;
  }
  if (args[0] === '-a') return rama(s, []) + Object.keys(s.remotoRamas).map(r => '\n  remotes/origin/' + r).join('');
  const nombre = args[0];
  if (!/^[\w./-]+$/.test(nombre)) return { error: `fatal: '${nombre}' no es un nombre de rama válido.` };
  if (s.ramas[nombre]) return { error: `fatal: ya existe una rama llamada '${nombre}'.` };
  if (!s.ramas[s.head]) return { error: `fatal: no es un nombre de objeto válido: '${s.head}'. (Haz un primer commit antes de crear ramas.)` };
  s.ramas[nombre] = s.ramas[s.head];
  return '';
}
function cambiar(s, args, crear) {
  const nombre = args.filter(a => !a.startsWith('-'))[0];
  if (crear) { const r = rama(s, [nombre]); if (r?.error) return r; }
  if (!s.ramas[nombre]) return { error: `error: ruta especificada '${nombre}' no concordó con ningún archivo conocido por git.\n(¿Querías crearla? Usa git switch -c ${nombre})` };
  if (s.conflicto) return { error: 'error: no puedes cambiar de rama en medio de una fusión. Resuelve el conflicto o usa git merge --abort.' };
  if (preparados(s).length || cambiosSinPreparar(s).filter(f => s.index[f] !== undefined).length) return { error: 'error: tus cambios locales serían sobrescritos al cambiar de rama.\nHaz commit de tus cambios (o guárdalos con git stash) antes de cambiar.' };
  s.head = nombre;
  const nuevos = Object.fromEntries(Object.entries(s.trabajo).filter(([f]) => s.index[f] === undefined));
  s.trabajo = { ...arbolActual(s), ...nuevos }; s.index = { ...arbolActual(s) };
  return crear ? `Cambiado a nueva rama '${nombre}'` : `Cambiado a rama '${nombre}'`;
}
function merge(s, args) {
  if (args[0] === '--abort') { if (!s.conflicto) return { error: 'fatal: no hay una fusión en curso.' }; s.trabajo = { ...arbolActual(s) }; s.index = { ...arbolActual(s) }; s.conflicto = null; return ''; }
  const otra = args[0];
  const idOtra = s.ramas[otra] || (otra?.startsWith('origin/') ? s.remotoRamas[otra.slice(7)] : null);
  if (!idOtra) return { error: `merge: ${otra} - no es algo que podamos fusionar` };
  const idAqui = s.ramas[s.head];
  if (esAncestro(s, idOtra, idAqui)) return 'Ya está actualizado.';
  if (esAncestro(s, idAqui, idOtra)) {
    s.ramas[s.head] = idOtra; s.trabajo = { ...arbolActual(s) }; s.index = { ...arbolActual(s) };
    return `Actualizando ${idAqui}..${idOtra}\nFast-forward`;
  }
  // Fusión de tres vías: base común = primer ancestro común.
  const ancestros = new Set(); const pila = [idAqui]; while (pila.length) { const x = pila.pop(); if (!x || ancestros.has(x)) continue; ancestros.add(x); pila.push(...s.commits[x].padres); }
  let base = null; const cola = [idOtra]; const vistos = new Set(); while (cola.length) { const x = cola.shift(); if (!x || vistos.has(x)) continue; vistos.add(x); if (ancestros.has(x)) { base = x; break; } cola.push(...s.commits[x].padres); }
  const A = arbolDe(s, idAqui), B = arbolDe(s, idOtra), O = arbolDe(s, base);
  const res = {}, conflictos = [];
  for (const f of new Set([...Object.keys(A), ...Object.keys(B), ...Object.keys(O)])) {
    if (A[f] === B[f]) { if (A[f] !== undefined) res[f] = A[f]; }
    else if (A[f] === O[f]) { if (B[f] !== undefined) res[f] = B[f]; }
    else if (B[f] === O[f]) { if (A[f] !== undefined) res[f] = A[f]; }
    else { conflictos.push(f); res[f] = `<<<<<<< HEAD\n${A[f] ?? ''}=======\n${B[f] ?? ''}>>>>>>> ${otra}\n`; }
  }
  s.trabajo = { ...res }; s.index = { ...res };
  if (conflictos.length) { s.huboConflicto = true; s.conflicto = { de: idOtra, rama: otra, archivos: conflictos }; for (const f of conflictos) s.index[f] = res[f]; return { error: `Auto-fusionando ${conflictos.join(', ')}\nCONFLICTO (contenido): Conflicto de fusión en ${conflictos.join(', ')}\nFusión automática falló; arregla los conflictos y luego haz commit del resultado.` }; }
  const id = hacerCommit(s, `Merge branch '${otra}'`, [idAqui, idOtra]);
  return `Merge made by the 'ort' strategy.\n[${s.head} ${id}] Merge branch '${otra}'`;
}
function push(s, args) {
  if (!s.remoto) return { error: "fatal: 'origin' no parece ser un repositorio git\n(Este repositorio no tiene remoto configurado.)" };
  const r = args.filter(a => !a.startsWith('-'))[1] || s.head;
  if (!s.ramas[r]) return { error: `error: src refspec ${r} no concuerda con ninguno` };
  const antes = s.remotoRamas[r];
  if (antes && !esAncestro(s, antes, s.ramas[r])) return { error: ` ! [rejected]        ${r} -> ${r} (non-fast-forward)\nerror: falló el push. Haz git pull primero.` };
  s.remotoRamas[r] = s.ramas[r];
  return `To ${s.remoto}\n   ${antes ? antes + '..' + s.ramas[r] : ' * [new branch]     '} ${r} -> ${r}` + (antes ? '' : `\n\nremote: Crea un pull request para '${r}' en:\nremote:   ${s.remoto.replace(/\.git$/, '')}/pull/new/${r}`);
}

// ---------------------------------------------------------------- intérprete
const partir = l => (l.match(/"[^"]*"|'[^']*'|\S+/g) || []).map(t => t.replace(/^"(.*)"$|^'(.*)'$/, (m, a, b) => a ?? b));
export const prompt = s => `alumno@pc:${s.cwd}${s.iniciado ? ` (${s.head}${s.conflicto ? '|MERGING' : ''})` : ''}$ `;

export function ejecutar(s, linea) {
  const texto = linea.trim();
  if (!texto) return { salida: '', prompt: prompt(s) };
  s.historial.push(texto);
  let r;
  const red = texto.match(/^echo\s+(.+?)\s*(>>?)\s*(\S+)$/);
  if (red) {
    const [, t, modo, f] = red;
    const valor = partir(t).join(' ') + '\n';
    s.trabajo[f] = modo === '>>' ? (s.trabajo[f] || '') + valor : valor;
    s.patrones.add('echo');
    r = '';
  } else {
    const a = partir(texto);
    const cmd = a.shift();
    if (cmd === 'git') {
      const sub = a.shift() || '';
      s.patrones.add('git ' + sub);
      if (sub !== 'init' && sub !== 'help' && !s.iniciado) r = { error: 'fatal: no es un repositorio git (ni ninguno de los directorios superiores): .git\n(Empieza con git init)' };
      else switch (sub) {
        case 'init': r = s.iniciado ? 'Reinicializado el repositorio Git existente' : (s.iniciado = true, `Inicializado repositorio Git vacío en /home/alumno/tienda-web/.git/`); break;
        case 'status': r = status(s); break;
        case 'add': r = add(s, a); break;
        case 'commit': r = commit(s, a); break;
        case 'log': r = log(s, a); break;
        case 'branch': r = rama(s, a); break;
        case 'switch': r = cambiar(s, a, a[0] === '-c'); break;
        case 'checkout': r = cambiar(s, a, a[0] === '-b'); break;
        case 'merge': r = merge(s, a); break;
        case 'push': r = push(s, a); break;
        case 'remote': r = s.remoto ? `origin\t${s.remoto} (fetch)\norigin\t${s.remoto} (push)` : ''; break;
        case 'diff': { const f = cambiosSinPreparar(s); r = f.length ? f.map(x => `diff --git a/${x} b/${x}\n--- a/${x}\n+++ b/${x}\n${(s.index[x] || '').split('\n').filter(Boolean).map(l => '-' + l).join('\n')}\n${(s.trabajo[x] || '').split('\n').filter(Boolean).map(l => '+' + l).join('\n')}`).join('\n') : ''; break; }
        case 'restore': { const st = a.includes('--staged'); for (const f of a.filter(x => !x.startsWith('-'))) { if (st) { if (arbolActual(s)[f] === undefined) delete s.index[f]; else s.index[f] = arbolActual(s)[f]; } else if (s.index[f] !== undefined) s.trabajo[f] = s.index[f]; } r = ''; break; }
        case 'help': case '': r = 'Comandos: git init · status · add · commit -m · log --oneline --graph · branch · switch [-c] · checkout [-b] · merge · push origin rama · remote -v · diff · restore'; break;
        default: r = { error: `git: '${sub}' no es un comando de git. Mira 'git help'.` };
      }
    } else if (cmd === 'ls') { r = Object.keys(s.trabajo).sort().join('  '); s.patrones.add('ls'); }
    else if (cmd === 'cat') { const f = a[0]; r = f in s.trabajo ? s.trabajo[f].replace(/\n$/, '') : { error: `cat: ${f}: No existe el archivo o el directorio` }; s.patrones.add('cat'); }
    else if (cmd === 'rm') { const f = a[0]; if (!(f in s.trabajo)) r = { error: `rm: no se puede borrar '${f}': No existe el archivo` }; else { delete s.trabajo[f]; r = ''; } }
    else if (cmd === 'clear') return { salida: '', prompt: prompt(s), limpiar: true };
    else if (cmd === 'help') r = 'Comandos: git … (escribe git help) · echo "texto" > archivo · echo "texto" >> archivo · cat archivo · ls · rm archivo · clear';
    else r = { error: `${cmd}: no se encontró la orden (escribe help)` };
  }
  if (r && typeof r === 'object') return { salida: r.error, prompt: prompt(s), error: true };
  return { salida: r, prompt: prompt(s) };
}

const PALABRAS = ['git init', 'git status', 'git add .', 'git commit -m "', 'git log --oneline --graph', 'git branch', 'git switch', 'git switch -c', 'git checkout -b', 'git merge', 'git push origin', 'git remote -v', 'git diff', 'git restore', 'git branch -d'];
export function completar(s, linea) {
  const c = PALABRAS.filter(p => p.startsWith(linea) && p !== linea);
  if (c.length === 1) return c[0] + (c[0].endsWith('"') ? '' : ' ');
  const partes = linea.split(' ');
  const ult = partes[partes.length - 1];
  if (/^git (switch|checkout|merge|branch -d|push origin)/.test(linea)) { const r = Object.keys(s.ramas).filter(x => x.startsWith(ult)); if (r.length === 1) return [...partes.slice(0, -1), r[0]].join(' ') + ' '; }
  if (/^(git add|git restore|cat|rm)/.test(linea)) { const f = Object.keys(s.trabajo).filter(x => x.startsWith(ult)); if (f.length === 1) return [...partes.slice(0, -1), f[0]].join(' ') + ' '; }
  return null;
}

// Datos del gráfico: commits en orden, carril (columna) de cada uno y etiquetas.
export function grafo(s) {
  const carriles = {}; let siguiente = 0;
  const carrilDe = r => (r in carriles ? carriles[r] : (carriles[r] = siguiente++));
  carrilDe('main');
  const nodos = s.orden.map((id, fila) => ({ id, fila, msg: s.commits[id].msg, padres: s.commits[id].padres, carril: carrilDe(s.commits[id].rama) }));
  const etiquetas = {};
  for (const [r, id] of Object.entries(s.ramas)) (etiquetas[id] ||= []).push({ texto: r, head: r === s.head });
  for (const [r, id] of Object.entries(s.remotoRamas)) (etiquetas[id] ||= []).push({ texto: 'origin/' + r, remoto: true });
  return { nodos, etiquetas, carriles: Math.max(1, siguiente) };
}
