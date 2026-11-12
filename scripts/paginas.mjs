// Monta las páginas HTML a partir de src/paginas/*.html y genera js/config.js desde config.json.
// Cada página empieza con un comentario JSON: <!--{"title": "...", "description": "...", "script": "x.js", ...}-->
// La política de seguridad (CSP) se calcula aquí: solo se permite conectar con este sitio y con el proyecto de Supabase.
// Uso: node scripts/paginas.mjs [--check]
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const check = process.argv.includes('--check');
const config = JSON.parse(await readFile('config.json', 'utf8'));
const supa = config.supabaseUrl ? new URL(config.supabaseUrl).origin : '';
if (supa && !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(supa)) throw new Error('supabaseUrl no parece un proyecto de Supabase: ' + supa);
if (config.supabaseKey && /service_role|sb_secret_/.test(config.supabaseKey + atobSafe(config.supabaseKey))) throw new Error('¡Esa es una clave secreta! En config.json solo va la clave publishable/anon.');
function atobSafe(k) { try { return Buffer.from(k.split('.')[1] || '', 'base64').toString(); } catch { return ''; } }

const connect = ["'self'", supa, supa && supa.replace('https://', 'wss://')].filter(Boolean).join(' ');
const CSP = `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src ${connect}; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests`;

const LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="var(--accent)"/><path d="M22.5 10.5A8.5 8.5 0 1 1 9.5 10.5" fill="none" stroke="var(--accent-ink)" stroke-width="2.6" stroke-linecap="round"/><path d="M12.6 6.9 12.1 12.9 6.9 8.6Z" fill="var(--accent-ink)" stroke="var(--accent-ink)" stroke-width="1" stroke-linejoin="round"/><circle cx="16" cy="16" r="3.4" fill="var(--accent-ink)"/></svg>';
const ICON = {
  cv: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>',
  certificado: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 8 5-3 5 3-1.5-8"/></svg>',
  salir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></svg>',
  luces: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z"/></svg>',
  curso: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2.5Z"/><path d="M8 7h7M8 11h5"/></svg>',
  practica: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="m7 9 3 2-3 2M12 14h5"/></svg>',
  buscar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  tutor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/><path d="M9 10h.01M12 10h.01M15 10h.01"/></svg>',
  examen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg>',
  cuenta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  tema: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>',
};
const NAV = [['curso.html', 'Curso', 'curso'], ['practica.html', 'Práctica', 'practica'], ['comandos.html', 'Comandos', 'comandos'], ['examen.html', 'Examen', 'examen'], ['repaso.html', 'Repaso', 'repaso'], ['rutas.html', 'Rutas', 'rutas'], ['tutor.html', 'Buscar', 'buscar']];
// Qué hay en cada sección (se muestra al pasar el ratón): así nadie tiene que adivinar.
const DESCRIPCION = {
  'curso.html': 'Tus lecciones por niveles y tu progreso',
  'practica.html': 'Laboratorios y ejercicios que se corrigen solos',
  'comandos.html': 'Guía de comandos Cisco explicados',
  'examen.html': 'Examen de cada escalón y examen final de cada área',
  'repaso.html': 'Las preguntas que fallaste, para dominarlas',
  'rutas.html': 'Rutas para conseguir empleo en TI',
  'tutor.html': 'Busca cualquier tema del curso',
};

function header(active) {
  const links = NAV.map(([href, label]) => `<a href="${href}" title="${DESCRIPCION[href]}"${active === href ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  return `<header class="site-header"><div class="container">
  <a class="brand" href="./">${LOGO}<span>Loopback</span></a>
  <nav class="nav" aria-label="Principal">${links}</nav>
  <div class="header-actions">
    <button type="button" class="btn btn-quiet theme-toggle luces-toggle" id="lucesToggle" aria-pressed="true" aria-label="Luces LED de la interfaz" title="Encender o apagar las luces LED">${ICON.luces}</button>
    <button type="button" class="btn btn-quiet theme-toggle" id="themeToggle" aria-label="Cambiar entre tema claro y oscuro" title="Tema claro u oscuro">${ICON.tema}</button>
    <a class="btn btn-ghost btn-sm" href="cuenta.html" data-auth="out" title="Entra o crea tu cuenta gratis para guardar tu progreso">Entrar</a>
    <div class="cuenta-menu" data-auth="in" hidden>
      <button type="button" class="avatar" id="menuCuenta" aria-haspopup="menu" aria-expanded="false" aria-controls="menuCuentaPop" title="Tu cuenta"><span data-user="initials">?</span><span class="sr-only">Abrir el menú de tu cuenta</span></button>
      <div class="menu-pop" id="menuCuentaPop" role="menu" hidden>
        <p class="menu-user"><strong data-user="name"></strong><span>Tu progreso se guarda en tu cuenta</span></p>
        <a role="menuitem" href="curso.html">${ICON.curso}<span>Mi progreso</span></a>
        <a role="menuitem" href="certificado.html">${ICON.certificado}<span>Mis certificados</span></a>
        <a role="menuitem" href="cv.html">${ICON.cv}<span>Mi CV técnico</span></a>
        <a role="menuitem" href="cuenta.html">${ICON.cuenta}<span>Mi cuenta y seguridad</span></a>
        <button type="button" role="menuitem" class="menu-salir" id="cerrarSesion">${ICON.salir}<span>Cerrar sesión</span></button>
      </div>
    </div>
  </div>
</div></header>`;
}
function mobileNav(active) {
  return `<nav class="mobile-nav" aria-label="Navegación móvil">${[...NAV.filter(([h]) => h !== 'comandos.html' && h !== 'repaso.html' && h !== 'rutas.html'), ['cuenta.html', 'Cuenta', 'cuenta']].map(([href, label, icon]) => `<a href="${href}"${active === href ? ' aria-current="page"' : ''}>${ICON[icon]}<span>${label}</span></a>`).join('')}</nav>`;
}
const footer = `<footer class="site-footer"><div class="container">
  <span>Loopback · Redes, bases de datos, programación, empleo en TI e inglés técnico desde cero. El temario de redes sigue el Cisco CCNA 200-301; no es un curso oficial de Cisco.</span>
  <span><a href="glosario.html">Glosario</a> · <a href="cv.html">Mi CV</a> · <a href="privacidad.html">Privacidad</a> · <a href="terminos.html">Términos</a></span>
</div></footer>`;

function page(meta, body) {
  const url = config.url + '/' + (meta.file === 'index.html' ? '' : meta.file);
  const scripts = [
    '<script src="js/proteccion.js"></script>',
    meta.supabase !== false ? '<script src="vendor/supabase.js" defer></script>' : '',
    `<script type="module" src="js/paginas/${meta.script}"></script>`,
  ].filter(Boolean).join('\n');
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${meta.title}</title>
<meta name="description" content="${meta.description}">
${meta.private ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`}
<meta property="og:title" content="${meta.title}">
<meta property="og:description" content="${meta.description}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#0b7285">
<link rel="icon" href="img/icono.svg" type="image/svg+xml">
<link rel="manifest" href="manifest.webmanifest">
<link rel="stylesheet" href="css/aula.css">
${scripts}
</head>
<body${meta.bodyClass ? ` class="${meta.bodyClass}"` : ''}>
<a class="skip" href="#main">Saltar al contenido</a>
${header(meta.file)}
<main id="main">
${body.trim()}
</main>
${meta.noFooter ? '' : footer}
${mobileNav(meta.file)}
</body>
</html>
`;
}

const outputs = new Map();
for (const name of (await readdir('src/paginas')).filter(n => n.endsWith('.html')).sort()) {
  const src = await readFile('src/paginas/' + name, 'utf8');
  const m = src.match(/^<!--(\{[\s\S]*?\})-->\s*/);
  if (!m) throw new Error(name + ': falta la cabecera JSON');
  const meta = JSON.parse(m[1]);
  outputs.set(name, page({ ...meta, file: name }, src.slice(m[0].length)));
}
outputs.set('js/config.js', `// Generado por scripts/paginas.mjs a partir de config.json. No editar a mano.
export const CONFIG = Object.freeze(${JSON.stringify({ nombre: config.nombre, url: config.url, supabaseUrl: supa, supabaseKey: config.supabaseKey || '' }, null, 2)});
`);

// ---------------------------------------------------------------- funcionar sin conexión (service worker)
// Precarga las páginas, el código, los estilos, los datos y las imágenes. La versión es un resumen del contenido:
// cada despliegue con cambios crea una caché nueva y borra la anterior.
async function listar(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const ruta = dir + '/' + e.name;
    if (e.isDirectory()) out.push(...await listar(ruta)); else out.push(ruta);
  }
  return out;
}
const precarga = [...[...outputs.keys()].filter(f => f.endsWith('.html')),
  ...(await Promise.all(['js', 'css', 'data', 'img'].map(listar))).flat().filter(f => !/(^|\/)\./.test(f)),
  'manifest.webmanifest', 'sandbox.html', 'vendor/supabase.js', 'vendor/sql-wasm.js', 'vendor/sql-wasm.wasm'].sort();
const resumen = createHash('sha256');
for (const f of precarga) resumen.update(f + '\0' + (outputs.get(f) ?? await readFile(f)) + '\0');
const VERSION = resumen.digest('hex').slice(0, 12);
outputs.set('sw.js', `// Generado por scripts/paginas.mjs: permite usar Loopback sin conexión. No editar a mano.
const CACHE = 'loopback-${VERSION}';
const PRECARGA = ${JSON.stringify(['./', ...precarga.map(f => './' + f)])};

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECARGA)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('loopback-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Con conexión, siempre la versión nueva (y se actualiza la copia); sin conexión, la copia guardada.
// Pyodide (versionado y pesado) se guarda la primera vez que se usa y después se sirve desde la caché.
self.addEventListener('fetch', e => {
  const r = e.request;
  const url = new URL(r.url);
  if (r.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.includes('/vendor/pyodide/')) {
    e.respondWith(caches.match(r).then(c => c || fetch(r).then(res => { if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(k => k.put(r, copia)); } return res; })));
    return;
  }
  e.respondWith(fetch(r).then(res => {
    if (res.ok && res.type === 'basic') { const copia = res.clone(); caches.open(CACHE).then(k => k.put(r, copia)); }
    return res;
  }).catch(() => caches.match(r, { ignoreSearch: r.mode === 'navigate' }).then(c => c || (r.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
`);

const stale = [];
for (const [file, content] of outputs) {
  if (check) { if ((await readFile(file, 'utf8').catch(() => '')) !== content) stale.push(file); }
  else await writeFile(file, content);
}
if (stale.length) { console.error('Sin regenerar (ejecuta node scripts/paginas.mjs): ' + stale.join(', ')); process.exit(1); }
console.log(check ? 'Páginas al día.' : 'Páginas generadas: ' + (outputs.size - 2) + ', js/config.js y sw.js.');
