// Simulador de terminal Linux (bash) para prácticas de administración básica. Sin DOM: se prueba en Node.
// Sistema de archivos en memoria con permisos, usuarios, servicios (systemd), registros, red y tuberías (|, >, >>).

const HOME = '/home/alumno';
const ahora = 'nov 12 09:41';

// ---------------------------------------------------------------- sistema de archivos
function nodo(tipo, extra = {}) { return { tipo, modo: tipo === 'dir' ? 0o755 : 0o644, dueno: 'root', grupo: 'root', contenido: '', ...extra }; }
export function nuevoLinux(cfg = {}) {
  const fs = new Map();
  const dir = (p, extra) => fs.set(p, nodo('dir', extra));
  const arch = (p, contenido = '', extra) => fs.set(p, nodo('file', { contenido, ...extra }));
  for (const d of ['/', '/etc', '/etc/nginx', '/etc/ssh', '/home', '/root', '/tmp', '/var', '/var/log', '/var/log/nginx', '/var/www', '/var/www/html', '/usr', '/usr/bin', '/opt']) dir(d);
  dir(HOME, { dueno: 'alumno', grupo: 'alumno' });
  dir('/tmp', { modo: 0o777 });
  arch('/etc/hostname', 'srv-web01\n');
  arch('/etc/hosts', '127.0.0.1 localhost\n10.0.0.10 srv-web01\n');
  arch('/etc/passwd', 'root:x:0:0:root:/root:/bin/bash\nalumno:x:1000:1000:Alumno:/home/alumno:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\n');
  arch('/etc/shadow', 'root:$6$...:19000:0:99999:7:::\n', { modo: 0o640, grupo: 'shadow' });
  arch('/etc/nginx/nginx.conf', 'user www-data;\nworker_processes auto;\nhttp {\n    include /etc/nginx/sites-enabled/*;\n}\n');
  arch('/var/www/html/index.html', '<h1>Bienvenido a la intranet</h1>\n', { dueno: 'www-data', grupo: 'www-data' });
  arch(HOME + '/.bashrc', 'alias ll="ls -l"\n', { dueno: 'alumno', grupo: 'alumno' });
  const s = {
    fs, cwd: HOME, usuario: 'alumno', host: 'srv-web01', historial: [], patrones: new Set(), salidas: [],
    servicios: { ssh: { activo: true, habilitado: true, puerto: 22 }, nginx: { activo: true, habilitado: true, puerto: 80 }, cron: { activo: true, habilitado: true } },
    paquetes: new Set(['bash', 'coreutils', 'openssh-server', 'nginx', 'curl']),
    procesos: [{ pid: 1, usuario: 'root', cpu: 0.0, mem: 0.3, cmd: '/sbin/init' }, { pid: 612, usuario: 'root', cpu: 0.0, mem: 0.2, cmd: '/usr/sbin/sshd -D' }, { pid: 845, usuario: 'www-data', cpu: 0.1, mem: 0.5, cmd: 'nginx: worker process' }, { pid: 1203, usuario: 'alumno', cpu: 0.0, mem: 0.1, cmd: '-bash' }],
    disco: { totalG: 40, usadoBaseG: 12.4 },
    red: { ip: '10.0.0.10/24', gw: '10.0.0.1', alcanzables: ['10.0.0.1', '10.0.0.20', '8.8.8.8', '1.1.1.1'], dns: true },
  };
  if (cfg.estadoInicial) cfg.estadoInicial(s, { dir, arch });
  return s;
}

const normal = partes => { const out = []; for (const p of partes) { if (!p || p === '.') continue; if (p === '..') out.pop(); else out.push(p); } return '/' + out.join('/'); };
export const ruta = (s, p = '.') => normal((p.startsWith('/') ? p : p.startsWith('~') ? HOME + p.slice(1) : s.cwd + '/' + p).split('/'));
const padre = p => p.slice(0, p.lastIndexOf('/')) || '/';
const nombre = p => p.slice(p.lastIndexOf('/') + 1);
const hijos = (s, d) => [...s.fs.keys()].filter(k => k !== d && padre(k) === d).sort();
const tamano = n => (n.tamano != null ? n.tamano : n.contenido.length);
const humano = b => (b >= 1073741824 ? (b / 1073741824).toFixed(1) + 'G' : b >= 1048576 ? (b / 1048576).toFixed(1) + 'M' : b >= 1024 ? Math.round(b / 1024) + 'K' : String(b));
const usadoG = s => s.disco.usadoBaseG + [...s.fs.values()].reduce((n, x) => n + (x.tipo === 'file' ? tamano(x) : 0), 0) / 1073741824;

// Permisos: el dueño usa los bits de usuario; el resto, los de «otros» (el simulador no modela grupos salvo shadow).
function puede(s, n, que, sudo) {
  if (sudo || s.usuario === 'root') return true;
  const bits = n.dueno === s.usuario ? (n.modo >> 6) & 7 : n.grupo === s.usuario ? (n.modo >> 3) & 7 : n.modo & 7;
  return !!(bits & { r: 4, w: 2, x: 1 }[que]);
}
const modoTxt = n => (n.tipo === 'dir' ? 'd' : '-') + [6, 3, 0].map(k => { const b = (n.modo >> k) & 7; return (b & 4 ? 'r' : '-') + (b & 2 ? 'w' : '-') + (b & 1 ? 'x' : '-'); }).join('');

// ---------------------------------------------------------------- comandos
const err = t => ({ error: t });
const C = {};
C.pwd = s => s.cwd;
C.whoami = (s, a, o) => (o.sudo ? 'root' : s.usuario);
C.hostname = s => s.host;
C.id = (s, a, o) => (o.sudo ? 'uid=0(root) gid=0(root) grupos=0(root)' : 'uid=1000(alumno) gid=1000(alumno) grupos=1000(alumno),27(sudo)');
C['uname'] = () => 'Linux srv-web01 6.8.0-45-generic #45-Ubuntu SMP x86_64 GNU/Linux';
C.date = () => 'mié 12 nov 2026 09:41:07 AST';
C.echo = (s, a) => a.filter(x => x !== '-e').join(' ');
C.clear = () => ({ limpiar: true });
C.history = s => s.historial.map((h, i) => `${String(i + 1).padStart(5)}  ${h}`).join('\n');
C.cd = (s, a) => {
  const p = ruta(s, a[0] || '~');
  const n = s.fs.get(p);
  if (!n) return err(`bash: cd: ${a[0]}: No existe el archivo o el directorio`);
  if (n.tipo !== 'dir') return err(`bash: cd: ${a[0]}: No es un directorio`);
  if (!puede(s, n, 'x')) return err(`bash: cd: ${a[0]}: Permiso denegado`);
  s.cwd = p; return '';
};
C.ls = (s, a) => {
  const fl = a.filter(x => x.startsWith('-')).join('');
  const objetivos = a.filter(x => !x.startsWith('-'));
  const largo = fl.includes('l'), todos = fl.includes('a'), hum = fl.includes('h');
  const out = [];
  for (const t of objetivos.length ? objetivos : ['.']) {
    const p = ruta(s, t), n = s.fs.get(p);
    if (!n) { out.push(`ls: no se puede acceder a '${t}': No existe el archivo o el directorio`); continue; }
    if (n.tipo === 'dir' && !puede(s, n, 'r')) { out.push(`ls: no se puede abrir el directorio '${t}': Permiso denegado`); continue; }
    const lista = n.tipo === 'dir' ? hijos(s, p).filter(k => todos || !nombre(k).startsWith('.')) : [p];
    if (objetivos.length > 1) out.push(t + ':');
    if (largo) { out.push('total ' + lista.length * 4); for (const k of lista) { const x = s.fs.get(k); out.push(`${modoTxt(x)} 1 ${x.dueno.padEnd(8)} ${x.grupo.padEnd(8)} ${String(hum ? humano(tamano(x)) : tamano(x)).padStart(hum ? 5 : 10)} ${ahora} ${nombre(k)}`); } }
    else out.push(lista.map(nombre).join('  '));
  }
  return out.join('\n');
};
C.mkdir = (s, a, o) => {
  const p = a.includes('-p');
  for (const t of a.filter(x => x !== '-p')) {
    const r = ruta(s, t);
    if (s.fs.has(r)) { if (!p) return err(`mkdir: no se puede crear el directorio «${t}»: El archivo ya existe`); continue; }
    if (!s.fs.has(padre(r))) { if (!p) return err(`mkdir: no se puede crear el directorio «${t}»: No existe el archivo o el directorio`); C.mkdir(s, ['-p', padre(r)], o); }
    if (!puede(s, s.fs.get(padre(r)), 'w', o.sudo)) return err(`mkdir: no se puede crear el directorio «${t}»: Permiso denegado`);
    s.fs.set(r, nodo('dir', { dueno: o.sudo ? 'root' : s.usuario, grupo: o.sudo ? 'root' : s.usuario }));
  }
  return '';
};
function escribir(s, p, texto, anadir, sudo) {
  const n = s.fs.get(p);
  if (n?.tipo === 'dir') return err(`bash: ${p}: Es un directorio`);
  if (n) { if (!puede(s, n, 'w', sudo)) return err(`bash: ${p}: Permiso denegado`); n.contenido = anadir ? n.contenido + texto : texto; delete n.tamano; return ''; }
  const d = s.fs.get(padre(p));
  if (!d) return err(`bash: ${p}: No existe el archivo o el directorio`);
  if (!puede(s, d, 'w', sudo)) return err(`bash: ${p}: Permiso denegado`);
  s.fs.set(p, nodo('file', { contenido: texto, dueno: sudo ? 'root' : s.usuario, grupo: sudo ? 'root' : s.usuario }));
  return '';
}
C.touch = (s, a, o) => { for (const t of a) { const p = ruta(s, t); if (!s.fs.has(p)) { const r = escribir(s, p, '', false, o.sudo); if (r.error) return err(r.error.replace('bash', 'touch')); } } return ''; };
function leer(s, t, sudo, cmd) {
  const p = ruta(s, t), n = s.fs.get(p);
  if (!n) return err(`${cmd}: ${t}: No existe el archivo o el directorio`);
  if (n.tipo === 'dir') return err(`${cmd}: ${t}: Es un directorio`);
  if (!puede(s, n, 'r', sudo)) return err(`${cmd}: ${t}: Permiso denegado`);
  return { texto: n.contenido };
}
const entradaDe = (s, a, o, cmd) => {
  const archivos = a.filter(x => !x.startsWith('-') || x === '-');
  if (!archivos.length) return { texto: o.entrada ?? '' };
  const partes = [];
  for (const f of archivos) { const r = leer(s, f, o.sudo, cmd); if (r.error) return r; partes.push(r.texto); }
  return { texto: partes.join('') };
};
const sinFinal = t => t.replace(/\n$/, '');
C.cat = (s, a, o) => { const r = entradaDe(s, a, o, 'cat'); return r.error ? r : sinFinal(r.texto); };
const numero = (a, def) => { const k = a.findIndex(x => x === '-n'); if (k >= 0) return Number(a[k + 1]); const m = a.find(x => /^-\d+$/.test(x)); return m ? Number(m.slice(1)) : def; };
const sinNumero = a => a.filter((x, i) => !(x === '-n' || a[i - 1] === '-n' || /^-\d+$/.test(x)));
C.head = (s, a, o) => { const r = entradaDe(s, sinNumero(a), o, 'head'); return r.error ? r : sinFinal(r.texto).split('\n').slice(0, numero(a, 10)).join('\n'); };
C.tail = (s, a, o) => { const r = entradaDe(s, sinNumero(a), o, 'tail'); if (r.error) return r; const l = sinFinal(r.texto).split('\n'); return l.slice(Math.max(0, l.length - numero(a, 10))).join('\n'); };
C.wc = (s, a, o) => { const r = entradaDe(s, a.filter(x => !x.startsWith('-')), o, 'wc'); if (r.error) return r; const t = r.texto; const lineas = t ? sinFinal(t).split('\n').length : 0; return a.includes('-l') ? String(lineas) : `${lineas} ${t.split(/\s+/).filter(Boolean).length} ${t.length}`; };
C.sort = (s, a, o) => { const r = entradaDe(s, a.filter(x => !x.startsWith('-')), o, 'sort'); if (r.error) return r; let l = sinFinal(r.texto).split('\n'); const num = a.some(x => /n/.test(x) && x.startsWith('-')); l.sort(num ? (x, y) => parseFloat(x) - parseFloat(y) : undefined); if (a.some(x => /r/.test(x) && x.startsWith('-'))) l.reverse(); return l.join('\n'); };
C.uniq = (s, a, o) => { const r = entradaDe(s, a.filter(x => !x.startsWith('-')), o, 'uniq'); if (r.error) return r; const out = []; for (const x of sinFinal(r.texto).split('\n')) { const u = out[out.length - 1]; if (u && u.v === x) u.n++; else out.push({ v: x, n: 1 }); } return out.map(x => (a.includes('-c') ? String(x.n).padStart(7) + ' ' : '') + x.v).join('\n'); };
C.cut = (s, a, o) => { const d = (a.find(x => x.startsWith('-d')) || "-d\t").slice(2) || a[a.indexOf('-d') + 1]; const f = Number((a.find(x => x.startsWith('-f')) || '-f1').slice(2) || a[a.indexOf('-f') + 1]); return sinFinal(o.entrada ?? '').split('\n').map(l => l.split(d)[f - 1] ?? '').join('\n'); };
C.awk = (s, a, o) => {
  const prog = a.find(x => x.startsWith('{')) || '';
  const m = prog.match(/^\{\s*print\s+\$(\d+)\s*\}$/);
  if (!m) return err("awk: el simulador solo admite awk '{print $N}'");
  const r = entradaDe(s, a.filter(x => x !== prog), o, 'awk'); if (r.error) return r;
  return sinFinal(r.texto).split('\n').map(l => l.trim().split(/\s+/)[Number(m[1]) - 1] ?? '').join('\n');
};
C.grep = (s, a, o) => {
  const flags = a.filter(x => /^-[a-zA-Z]+$/.test(x)).join('');
  const resto = a.filter(x => !/^-[a-zA-Z]+$/.test(x));
  const patron = resto.shift();
  if (patron == null) return err('Uso: grep [OPCIÓN]... PATRÓN [ARCHIVO]...');
  let re; try { re = new RegExp(patron, flags.includes('i') ? 'i' : ''); } catch { re = { test: t => t.includes(patron) }; }
  const coincide = l => re.test(l) !== flags.includes('v');
  const fuentes = [];
  if (!resto.length) fuentes.push(['', o.entrada ?? '']);
  for (const t of resto) {
    const p = ruta(s, t), n = s.fs.get(p);
    if (!n) return err(`grep: ${t}: No existe el archivo o el directorio`);
    if (n.tipo === 'dir') { if (!flags.includes('r')) return err(`grep: ${t}: Es un directorio`); for (const k of [...s.fs.keys()].filter(k => k.startsWith(p + '/') && s.fs.get(k).tipo === 'file')) if (puede(s, s.fs.get(k), 'r', o.sudo)) fuentes.push([k, s.fs.get(k).contenido]); continue; }
    if (!puede(s, n, 'r', o.sudo)) return err(`grep: ${t}: Permiso denegado`);
    fuentes.push([t, n.contenido]);
  }
  const varios = fuentes.length > 1;
  const out = [];
  for (const [f, txt] of fuentes) {
    const l = sinFinal(txt).split('\n').map((x, i) => [x, i + 1]).filter(([x]) => coincide(x));
    if (flags.includes('c')) out.push((varios ? f + ':' : '') + l.length);
    else out.push(...l.map(([x, i]) => (varios ? f + ':' : '') + (flags.includes('n') ? i + ':' : '') + x));
  }
  return out.join('\n');
};
C.find = (s, a) => {
  const base = ruta(s, a[0] && !a[0].startsWith('-') ? a[0] : '.');
  const k = a.indexOf('-name'), patron = k >= 0 ? a[k + 1] : null;
  const ks = a.indexOf('-size'), min = ks >= 0 ? a[ks + 1] : null;
  const re = patron ? new RegExp('^' + patron.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$') : null;
  const minB = min ? parseFloat(min) * { k: 1024, M: 1048576, G: 1073741824 }[min.slice(-1)] : 0;
  return [...s.fs.keys()].filter(p => (p === base || p.startsWith(base === '/' ? '/' : base + '/')) && (!re || re.test(nombre(p))) && (!minB || (s.fs.get(p).tipo === 'file' && tamano(s.fs.get(p)) > minB))).sort().map(p => (a[0] && !a[0].startsWith('/') && !a[0].startsWith('-') ? p : p)).join('\n');
};
C.rm = (s, a, o) => {
  const rec = a.some(x => /^-[a-z]*r/i.test(x));
  for (const t of a.filter(x => !x.startsWith('-'))) {
    const objetivos = t.includes('*') ? [...s.fs.keys()].filter(p => new RegExp('^' + ruta(s, t).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '$').test(p)) : [ruta(s, t)];
    if (!objetivos.length || !s.fs.has(objetivos[0])) return err(`rm: no se puede borrar '${t}': No existe el archivo o el directorio`);
    for (const p of objetivos) {
      const n = s.fs.get(p);
      if (n.tipo === 'dir' && !rec) return err(`rm: no se puede borrar '${t}': Es un directorio`);
      if (!puede(s, s.fs.get(padre(p)), 'w', o.sudo)) return err(`rm: no se puede borrar '${t}': Permiso denegado`);
      for (const k of [...s.fs.keys()]) if (k === p || k.startsWith(p + '/')) s.fs.delete(k);
    }
  }
  return '';
};
C.cp = (s, a, o) => {
  const [de, a2] = a.filter(x => !x.startsWith('-'));
  const r = leer(s, de || '', o.sudo, 'cp'); if (r.error) return r;
  let p = ruta(s, a2 || ''); if (s.fs.get(p)?.tipo === 'dir') p = p + '/' + nombre(ruta(s, de));
  const w = escribir(s, p, r.texto, false, o.sudo); return w.error ? err(w.error.replace('bash', 'cp')) : '';
};
C.mv = (s, a, o) => {
  const [de, a2] = a; const pd = ruta(s, de || ''); if (!s.fs.has(pd)) return err(`mv: no se puede efectuar 'stat' sobre '${de}': No existe el archivo o el directorio`);
  let p = ruta(s, a2 || ''); if (s.fs.get(p)?.tipo === 'dir') p = p + '/' + nombre(pd);
  if (!puede(s, s.fs.get(padre(pd)), 'w', o.sudo) || !puede(s, s.fs.get(padre(p)) || {}, 'w', o.sudo)) return err(`mv: no se puede mover '${de}': Permiso denegado`);
  for (const k of [...s.fs.keys()].filter(k => k === pd || k.startsWith(pd + '/'))) { s.fs.set(p + k.slice(pd.length), s.fs.get(k)); s.fs.delete(k); }
  return '';
};
C.chmod = (s, a, o) => {
  const [modo, ...ts] = a.filter(x => x !== '-R');
  for (const t of ts) {
    const n = s.fs.get(ruta(s, t)); if (!n) return err(`chmod: no se puede acceder a '${t}': No existe el archivo o el directorio`);
    if (n.dueno !== s.usuario && !o.sudo) return err(`chmod: cambiando los permisos de '${t}': Operación no permitida`);
    if (/^[0-7]{3}$/.test(modo)) n.modo = parseInt(modo, 8);
    else { const m = modo.match(/^([ugoa]*)([+-=])([rwx]+)$/); if (!m) return err(`chmod: modo inválido: «${modo}»`); const quien = m[1] || 'a'; let bits = 0; for (const c of m[3]) bits |= { r: 4, w: 2, x: 1 }[c]; let mask = 0; for (const q of quien.replace('a', 'ugo')) mask |= bits << { u: 6, g: 3, o: 0 }[q]; n.modo = m[2] === '+' ? n.modo | mask : m[2] === '-' ? n.modo & ~mask : (n.modo & ~(quien.includes('a') ? 0o777 : [...quien].reduce((x, q) => x | (7 << { u: 6, g: 3, o: 0 }[q]), 0))) | mask; }
  }
  return '';
};
C.chown = (s, a, o) => {
  if (!o.sudo) return err(`chown: cambiando el propietario de '${a[1]}': Operación no permitida`);
  const [quien, ...ts] = a.filter(x => x !== '-R'); const [u, g] = quien.split(':');
  for (const t of ts) { const p = ruta(s, t); if (!s.fs.has(p)) return err(`chown: no se puede acceder a '${t}': No existe el archivo o el directorio`); for (const k of [...s.fs.keys()].filter(k => k === p || (a.includes('-R') && k.startsWith(p + '/')))) { const n = s.fs.get(k); n.dueno = u; if (g) n.grupo = g; } }
  return '';
};
C.df = (s, a) => { const u = usadoG(s), t = s.disco.totalG; const pct = Math.round((u / t) * 100); return `S.ficheros      Tamaño Usados  Disp Uso% Montado en\n/dev/sda2         ${t}G   ${u.toFixed(1)}G  ${(t - u).toFixed(1)}G  ${pct}% /`; };
C.du = (s, a) => {
  const ts = a.filter(x => !x.startsWith('-'));
  return (ts.length ? ts : ['.']).flatMap(t => (t.includes('*') ? [...s.fs.keys()].filter(p => padre(p) === ruta(s, t.replace(/\/\*$/, ''))) : [ruta(s, t)])).map(p => {
    const b = [...s.fs.entries()].filter(([k, n]) => (k === p || k.startsWith(p + '/')) && n.tipo === 'file').reduce((x, [, n]) => x + tamano(n), 0);
    return `${humano(b).padEnd(7)} ${p}`;
  }).join('\n');
};
C.free = () => '               total        usado        libre\nMem:           3,8Gi        1,1Gi        2,2Gi\nSwap:          2,0Gi          0B        2,0Gi';
C.ps = s => ['USER         PID %CPU %MEM COMMAND', ...s.procesos.map(p => `${p.usuario.padEnd(10)} ${String(p.pid).padStart(5)} ${p.cpu.toFixed(1).padStart(4)} ${p.mem.toFixed(1).padStart(4)} ${p.cmd}`)].join('\n');
C.top = s => C.ps(s) + '\n(Vista instantánea: en un servidor real, top se actualiza cada pocos segundos y se sale con q.)';
C.kill = (s, a, o) => { const pid = Number(a.find(x => /^\d+$/.test(x))); const p = s.procesos.find(x => x.pid === pid); if (!p) return err(`bash: kill: (${a[a.length - 1]}) - No existe el proceso`); if (p.usuario !== s.usuario && !o.sudo) return err(`bash: kill: (${pid}) - Operación no permitida`); s.procesos = s.procesos.filter(x => x !== p); return ''; };
C.ip = (s, a) => (/^a|addr/.test(a[0] || '') ? `1: lo: <LOOPBACK,UP> mtu 65536\n    inet 127.0.0.1/8 scope host lo\n2: ens18: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500\n    link/ether bc:24:11:5e:7a:01 brd ff:ff:ff:ff:ff:ff\n    inet ${s.red.ip} brd 10.0.0.255 scope global ens18` : /^r/.test(a[0] || '') ? `default via ${s.red.gw} dev ens18\n10.0.0.0/24 dev ens18 proto kernel scope link src ${s.red.ip.split('/')[0]}` : 'Uso: ip addr | ip route');
C.ping = (s, a) => {
  const destino = a.filter(x => !x.startsWith('-') && !/^\d+$/.test(x))[0] || a[a.length - 1];
  const ip = /^\d+\.\d+\.\d+\.\d+$/.test(destino) ? destino : (s.red.dns ? { 'google.com': '142.250.78.14', 'srv-db01': '10.0.0.20', localhost: '127.0.0.1' }[destino] : null);
  if (!ip) return err(`ping: ${destino}: Fallo temporal en la resolución del nombre`);
  const ok = ip === '127.0.0.1' || s.red.alcanzables.includes(ip);
  return `PING ${destino} (${ip}) 56(84) bytes de datos.\n` + (ok ? [1, 2, 3, 4].map(k => `64 bytes desde ${ip}: icmp_seq=${k} ttl=${ip.startsWith('10.') ? 64 : 117} tiempo=${ip.startsWith('10.') ? '0.4' : '14.2'} ms`).join('\n') : '') + `\n\n--- estadísticas ping ${destino} ---\n4 paquetes transmitidos, ${ok ? 4 : 0} recibidos, ${ok ? 0 : 100}% paquetes perdidos`;
};
C.ss = s => ['Netid State  Local Address:Port  Process', ...Object.entries(s.servicios).filter(([, v]) => v.activo && v.puerto).map(([k, v]) => `tcp   LISTEN 0.0.0.0:${v.puerto}         users:(("${k === 'ssh' ? 'sshd' : k}"))`)].join('\n');
C.curl = (s, a) => {
  const url = a.find(x => !x.startsWith('-')) || '';
  if (/localhost|127\.0\.0\.1|srv-web01/.test(url)) { const web = Object.entries(s.servicios).find(([, v]) => v.activo && v.puerto === 80); if (!web) return err(`curl: (7) Failed to connect to localhost port 80: Conexión rehusada`); s.curlOk = web[0]; return web[0] === 'nginx' ? s.fs.get('/var/www/html/index.html')?.contenido.trim() || '' : '<h1>Apache2 Default Page</h1>'; }
  return err('curl: (6) El simulador solo permite probar el servidor local: curl http://localhost');
};
function systemctl(s, a, o) {
  const [accion, svcRaw] = a; const svc = (svcRaw || '').replace(/\.service$/, '');
  const v = s.servicios[svc];
  if (!accion) return err('Uso: systemctl (status | start | stop | restart | enable | disable) servicio');
  if (!v) return err(`Unit ${svcRaw || ''}.service could not be found.`);
  if (accion === 'status' || accion === 'is-active') {
    if (accion === 'is-active') return v.activo ? 'active' : v.fallo ? 'failed' : 'inactive';
    return `● ${svc}.service\n     Loaded: loaded (/lib/systemd/system/${svc}.service; ${v.habilitado ? 'enabled' : 'disabled'})\n     Active: ${v.activo ? 'active (running) since mié 2026-11-12 08:02:11 AST' : v.fallo ? 'failed (Result: exit-code) since mié 2026-11-12 09:30:02 AST' : 'inactive (dead)'}` + (v.fallo && !v.activo ? `\n\nnov 12 09:30:02 srv-web01 systemd[1]: ${svc}.service: Failed with result 'exit-code'.\n(Mira el detalle con: journalctl -u ${svc})` : '');
  }
  if (!o.sudo) return err(`Failed to ${accion} ${svc}.service: Access denied\n(Hace falta sudo para gestionar servicios.)`);
  if (accion === 'stop') { v.activo = false; v.fallo = false; return ''; }
  if (accion === 'enable' || accion === 'disable') { v.habilitado = accion === 'enable'; return accion === 'enable' ? `Created symlink /etc/systemd/system/multi-user.target.wants/${svc}.service → /lib/systemd/system/${svc}.service.` : `Removed /etc/systemd/system/multi-user.target.wants/${svc}.service.`; }
  if (accion === 'start' || accion === 'restart') {
    const ocupa = v.puerto && Object.entries(s.servicios).find(([k, x]) => k !== svc && x.activo && x.puerto === v.puerto);
    if (ocupa) { v.activo = false; v.fallo = true; v.motivo = `bind() to 0.0.0.0:${v.puerto} failed (98: Address already in use)`; return err(`Job for ${svc}.service failed because the control process exited with error code.\nSee "systemctl status ${svc}.service" and "journalctl -xeu ${svc}.service" for details.`); }
    v.activo = true; v.fallo = false; return '';
  }
  return err(`Unknown command verb ${accion}.`);
}
C.systemctl = systemctl;
C.journalctl = (s, a) => {
  const k = a.indexOf('-u'); const svc = (k >= 0 ? a[k + 1] : '').replace(/\.service$/, '');
  const v = s.servicios[svc];
  if (!v) return '-- No entries --';
  const L = [`nov 12 08:02:11 srv-web01 systemd[1]: Started ${svc}.service.`];
  if (v.motivo) L.push(`nov 12 09:30:01 srv-web01 ${svc}[2210]: [emerg] ${v.motivo}`, `nov 12 09:30:02 srv-web01 systemd[1]: ${svc}.service: Main process exited, code=exited, status=1/FAILURE`, `nov 12 09:30:02 srv-web01 systemd[1]: Failed to start ${svc}.service.`);
  return L.join('\n');
};
C.apt = (s, a, o) => {
  if (!o.sudo) return err('E: No se pudo abrir el fichero de bloqueo /var/lib/dpkg/lock-frontend - open (13: Permiso denegado)\n¿Es usted root? (usa sudo)');
  if (a[0] === 'update') { s.aptUpdate = true; return 'Obj:1 http://archive.ubuntu.com/ubuntu noble InRelease\nLeyendo lista de paquetes... Hecho'; }
  if (a[0] === 'install') { const p = a.filter(x => !x.startsWith('-')).slice(1); for (const x of p) s.paquetes.add(x); return `Leyendo lista de paquetes... Hecho\nSe instalarán los siguientes paquetes NUEVOS:\n  ${p.join(' ')}\nConfigurando ${p.join(', ')} ...`; }
  return err('Uso: sudo apt update | sudo apt install paquete');
};
C.truncate = (s, a, o) => {
  const k = a.indexOf('-s'); const t = a.filter((x, i) => !x.startsWith('-') && i !== k + 1)[0];
  const n = s.fs.get(ruta(s, t || '')); if (!n) return err(`truncate: no se puede abrir '${t}': No existe el archivo o el directorio`);
  if (!puede(s, n, 'w', o.sudo)) return err(`truncate: no se puede abrir '${t}' para escritura: Permiso denegado`);
  n.contenido = ''; n.tamano = 0; return '';
};
C.man = (s, a) => `${(a[0] || '').toUpperCase()}(1)\n\nEl simulador no incluye las páginas del manual. En un Linux real, «man ${a[0] || 'comando'}» explica todas sus opciones; sal con q.`;
C.help = () => `Comandos del simulador:
  Archivos: pwd ls [-la] cd mkdir [-p] touch cat head tail cp mv rm [-r] find -name -size chmod chown
  Texto: echo grep [-i -c -v -n -r] wc -l sort [-n -r] uniq [-c] cut awk '{print $N}'   (con | > >>)
  Sistema: whoami id hostname uname date df -h du -sh free -h ps aux kill top history clear
  Red: ip addr · ip route · ping -c 4 · ss -tuln · curl http://localhost
  Servicios: systemctl status|start|stop|restart|enable|disable · journalctl -u servicio
  Paquetes: sudo apt update · sudo apt install paquete
  Administrador: antepón sudo (la contraseña del simulador ya está guardada)`;

// ---------------------------------------------------------------- intérprete: sudo, tuberías y redirecciones
function partir(linea) { return (linea.match(/'[^']*'|"[^"]*"|[^\s]+/g) || []).map(t => t.replace(/^'(.*)'$|^"(.*)"$/, (m, a, b) => a ?? b)); }
function segmentos(linea) {
  const out = []; let actual = '', q = null;
  for (const c of linea) { if (q) { if (c === q) q = null; actual += c; } else if (c === '"' || c === "'") { q = c; actual += c; } else if (c === '|') { out.push(actual); actual = ''; } else actual += c; }
  out.push(actual);
  return out.map(x => x.trim());
}
export const prompt = s => `${s.usuario}@${s.host}:${s.cwd === HOME ? '~' : s.cwd.startsWith(HOME + '/') ? '~' + s.cwd.slice(HOME.length) : s.cwd}$ `;

export function ejecutar(s, linea) {
  const texto = linea.trim();
  if (!texto) return { salida: '', prompt: prompt(s) };
  s.historial.push(texto);
  let entrada, salida = '', limpiar = false;
  const segs = segmentos(texto);
  for (let i = 0; i < segs.length; i++) {
    let seg = segs[i], redir = null;
    const m = seg.match(/^(.*?)\s*(>>?)\s*(\S+)\s*$/);
    if (m && i === segs.length - 1) redir = { cmd: m[1], modo: m[2], archivo: m[3] };
    if (redir) seg = redir.cmd;
    let args = partir(seg), sudo = false;
    if (args[0] === 'sudo') { sudo = true; args = args.slice(1); }
    const cmd = (args.shift() || '').toLowerCase();
    s.patrones.add((sudo ? 'sudo ' : '') + cmd + (['systemctl', 'apt', 'ip'].includes(cmd) && args[0] ? ' ' + args[0] : ''));
    let r;
    if (cmd === './backup.sh' || /^\.?\/?[\w/.-]+\.sh$/.test(cmd)) r = ejecutarScript(s, cmd, sudo);
    else if (!C[cmd]) r = err(`${cmd}: no se encontró la orden\n(Escribe help para ver los comandos del simulador.)`);
    else r = C[cmd](s, args, { sudo, entrada });
    if (r && typeof r === 'object' && r.limpiar) { limpiar = true; r = ''; }
    if (r && typeof r === 'object' && r.error) { s.ultimoError = r.error; return { salida: r.error, prompt: prompt(s), error: true, limpiar }; }
    salida = r ?? '';
    if (redir) {
      const w = escribir(s, ruta(s, redir.archivo), salida + (salida ? '\n' : ''), redir.modo === '>>', sudo);
      if (w.error) return { salida: w.error, prompt: prompt(s), error: true };
      salida = '';
    }
    entrada = salida + '\n';
  }
  s.salidas.push(salida);
  return { salida, prompt: prompt(s), limpiar };
}
function ejecutarScript(s, cmd, sudo) {
  const p = ruta(s, cmd), n = s.fs.get(p);
  if (!n) return err(`bash: ${cmd}: No existe el archivo o el directorio`);
  if (!puede(s, n, 'x', sudo)) { s.permisoDenegado = true; return err(`bash: ${cmd}: Permiso denegado`); }
  s.scriptsEjecutados = [...(s.scriptsEjecutados || []), p];
  return n.salidaScript || 'Script ejecutado.';
}

const PALABRAS = ['systemctl status', 'systemctl restart', 'systemctl stop', 'systemctl start', 'systemctl enable', 'systemctl disable', 'journalctl -u', 'sudo', 'chmod', 'chown', 'mkdir', 'touch', 'grep', 'tail', 'head', 'history', 'help', 'clear', 'df -h', 'du -sh', 'ps aux', 'ip addr', 'ping -c 4', 'ss -tuln', 'curl http://localhost', 'find', 'truncate -s 0', 'whoami', 'hostname'];
export function completar(s, linea) {
  const t = linea;
  const partes = t.split(' ');
  const ultima = partes[partes.length - 1];
  // Completa rutas del directorio actual (o de la ruta escrita) como hace bash.
  if (partes.length > 1 || ultima.includes('/')) {
    const base = ultima.includes('/') ? ultima.slice(0, ultima.lastIndexOf('/') + 1) : '';
    const dir = ruta(s, base || '.');
    const pref = ultima.slice(base.length);
    const c = hijos(s, dir).map(nombre).filter(x => x.startsWith(pref));
    if (c.length === 1) { const full = dir === '/' ? '/' + c[0] : dir + '/' + c[0]; return [...partes.slice(0, -1), base + c[0] + (s.fs.get(full)?.tipo === 'dir' ? '/' : ' ')].join(' '); }
    if (partes.length > 1 || c.length) return null;
  }
  const c = PALABRAS.filter(p => p.startsWith(t) && p !== t);
  return c.length === 1 ? c[0] + ' ' : null;
}
