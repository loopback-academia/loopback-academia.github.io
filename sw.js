// Generado por scripts/paginas.mjs: permite usar Loopback sin conexión. No editar a mano.
const CACHE = 'loopback-a2c69ea8b71a';
const PRECARGA = ["./","./404.html","./certificado.html","./comandos.html","./css/aula.css","./cuenta.html","./curso.html","./cv.html","./data/buscar.json","./data/curso.json","./data/examen.json","./data/glosario.json","./examen.html","./glosario.html","./img/icono.svg","./index.html","./js/anim/escenas.js","./js/anim/motor.js","./js/auth.js","./js/buscador.js","./js/casos/caso-ui.js","./js/casos/casos.js","./js/certificado.js","./js/codigo/codigo-ui.js","./js/codigo/ejercicios.js","./js/codigo/runner.js","./js/codigo/sandbox.js","./js/comandos-datos.js","./js/config.js","./js/core.js","./js/curso.js","./js/escalera-alumno.js","./js/escalera.js","./js/examen/generadas.js","./js/examen/integridad.js","./js/glosario.js","./js/labs/capturas-ui.js","./js/labs/capturas.js","./js/labs/catalogo.js","./js/labs/cli-ui.js","./js/labs/git-labs.js","./js/labs/git-ui.js","./js/labs/git.js","./js/labs/inyeccion-logica.js","./js/labs/inyeccion.js","./js/labs/ios-labs.js","./js/labs/ios.js","./js/labs/ipv4.js","./js/labs/ipv6.js","./js/labs/linux-labs.js","./js/labs/linux-ui.js","./js/labs/linux.js","./js/labs/numeros.js","./js/labs/sql-datos.js","./js/labs/sql-ejercicios.js","./js/labs/sql-lab.js","./js/labs/terminal-ui.js","./js/labs/windows-labs.js","./js/labs/windows-ui.js","./js/labs/windows.js","./js/paginas/certificado.js","./js/paginas/comandos.js","./js/paginas/cuenta.js","./js/paginas/cv.js","./js/paginas/examen.js","./js/paginas/glosario.js","./js/paginas/inicio.js","./js/paginas/laboratorio.js","./js/paginas/leccion.js","./js/paginas/panel.js","./js/paginas/practica.js","./js/paginas/repaso.js","./js/paginas/rutas.js","./js/paginas/simple.js","./js/paginas/tutor-pagina.js","./js/paginas/videos.js","./js/progreso.js","./js/proteccion.js","./js/proyectos/proyecto-ui.js","./js/proyectos/proyectos.js","./js/quiz.js","./js/recomendaciones.js","./js/render.js","./js/reto-ui.js","./js/reto.js","./js/rutas.js","./js/ti/ad-ui.js","./js/ti/ad.js","./js/ti/atencion-ui.js","./js/ti/atencion.js","./js/ti/cv.js","./js/ti/entrevista-ui.js","./js/ti/entrevista.js","./js/ti/hardware-ui.js","./js/ti/hardware.js","./js/ti/phishing-ui.js","./js/ti/phishing.js","./js/video/reproductor.js","./js/video/videos.js","./laboratorio.html","./leccion.html","./manifest.webmanifest","./practica.html","./privacidad.html","./repaso.html","./rutas.html","./sandbox.html","./terminos.html","./tutor.html","./vendor/sql-wasm.js","./vendor/sql-wasm.wasm","./vendor/supabase.js","./videos.html"];

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
