// Prácticas de Git con gráfico de ramas. Cada tarea se comprueba sobre el estado del repositorio simulado.
const ultimo = (s, rama) => s.commits[s.ramas[rama]];
const enRama = (s, rama, archivo) => !!ultimo(s, rama)?.arbol[archivo];

export const GIT_LABS = {
  primeros: {
    nivel: 'principiante',
    titulo: 'Tus primeros commits',
    intro: 'Vas a empezar a versionar la web de la tienda. La carpeta todavía no es un repositorio. Crea el repositorio, un README y dos commits con mensajes claros.',
    equipo: {},
    tareas: [
      { texto: 'Convierte la carpeta en un repositorio (git init).', ok: s => s.iniciado },
      { texto: 'Crea README.md con el texto «# Tienda web» y mira el estado (git status).', ok: s => !!s.trabajo['README.md'] && s.patrones.has('git status') },
      { texto: 'Prepara el archivo y haz el primer commit.', ok: s => s.orden.length >= 1 && !!s.commits[s.orden[0]].arbol['README.md'] },
      { texto: 'Añade una línea al README y haz un segundo commit.', ok: s => s.orden.length >= 2 && (ultimo(s, 'main')?.arbol['README.md'] || '').split('\n').filter(Boolean).length >= 2 },
      { texto: 'Mira el historial (git log --oneline).', ok: s => s.patrones.has('git log') && s.orden.length >= 2 },
    ],
    pistas: ['echo "# Tienda web" > README.md crea el archivo.', 'git add README.md lo prepara (o git add . para todo) y git commit -m "mensaje" lo guarda en el historial.', 'echo "texto" >> README.md añade una línea al final.'],
    solucion: ['git init', 'echo "# Tienda web" > README.md', 'git status', 'git add README.md', 'git commit -m "Añade README"', 'echo "Catálogo de productos de La Ceiba" >> README.md', 'git add .', 'git commit -m "Describe el proyecto"', 'git log --oneline'],
  },
  ramas: {
    nivel: 'intermedio',
    titulo: 'Trabajar en una rama y fusionarla',
    intro: 'Te piden un formulario de contacto. Para no romper la versión que funciona (main), trabajas en una rama aparte y la fusionas cuando está lista.',
    equipo: {
      estadoInicial: (s, h) => { h.init(); h.commit('Primera versión de la tienda', { 'index.html': '<h1>Tienda</h1>\n', 'app.js': '// carrito\n' }, 'main'); h.commit('Añade estilos', { 'estilos.css': 'h1 { color: black; }\n' }); },
    },
    tareas: [
      { texto: 'Crea la rama formulario y cámbiate a ella (en un solo comando).', ok: s => !!s.ramas.formulario || (s.borradas || []).includes('formulario') },
      { texto: 'En formulario, crea contacto.html y haz commit.', ok: s => s.orden.some(id => s.commits[id].rama === 'formulario' && s.commits[id].arbol['contacto.html']) },
      { texto: 'Vuelve a main y fusiona la rama formulario.', ok: s => enRama(s, 'main', 'contacto.html') },
      { texto: 'Borra la rama formulario, que ya está fusionada.', ok: s => !s.ramas.formulario && (s.borradas || []).includes('formulario') },
      { texto: 'Mira el historial con el gráfico (git log --oneline --graph).', ok: s => s.historial.some(h => /git log.*--graph/.test(h)) },
    ],
    pistas: ['git switch -c nombre crea la rama y te cambia a ella (también vale git checkout -b nombre).', 'Para fusionar, colócate en la rama que recibe los cambios (main) y ejecuta git merge formulario.', 'Si main no cambió mientras tanto, la fusión es «fast-forward»: main avanza hasta el último commit de la rama.'],
    solucion: ['git switch -c formulario', 'echo "<form>Escríbenos</form>" > contacto.html', 'git add contacto.html', 'git commit -m "Añade formulario de contacto"', 'git switch main', 'git merge formulario', 'git branch -d formulario', 'git log --oneline --graph'],
  },
  conflicto: {
    nivel: 'intermedio',
    titulo: 'Resolver un conflicto de fusión',
    intro: 'Dos personas cambiaron la misma línea de estilos.css: en main el título quedó verde y en la rama tema-azul, azul. El equipo decidió que el título sea azul. Fusiona tema-azul en main y resuelve el conflicto.',
    equipo: {
      estadoInicial: (s, h) => {
        h.init();
        h.commit('Estilos base', { 'index.html': '<h1>Tienda</h1>\n', 'estilos.css': 'h1 { color: black; }\n' }, 'main');
        h.rama('tema-azul'); h.cambiar('tema-azul');
        h.commit('Título en azul', { 'estilos.css': 'h1 { color: blue; }\n' });
        h.cambiar('main');
        h.commit('Título en verde', { 'estilos.css': 'h1 { color: green; }\n' });
      },
    },
    tareas: [
      { texto: 'Desde main, intenta fusionar la rama tema-azul.', ok: s => !!s.huboConflicto },
      { texto: 'Mira el archivo en conflicto (cat estilos.css) y las marcas <<<<<<<, ======= y >>>>>>>.', ok: s => s.patrones.has('cat') && !!s.huboConflicto },
      { texto: 'Deja estilos.css con la versión acordada (azul) y sin marcas de conflicto.', ok: s => /blue/.test(s.trabajo['estilos.css'] || '') && !/<<<<<<<|=======|>>>>>>>/.test(s.trabajo['estilos.css'] || '') },
      { texto: 'Marca el conflicto como resuelto (git add) y termina la fusión con un commit.', ok: s => !s.conflicto && ultimo(s, 'main')?.padres.length === 2 && /blue/.test(ultimo(s, 'main').arbol['estilos.css']) },
    ],
    pistas: ['Entre <<<<<<< HEAD y ======= está tu versión (main); entre ======= y >>>>>>> la de la otra rama.', 'Escribe el archivo como debe quedar: echo "h1 { color: blue; }" > estilos.css', 'Después: git add estilos.css y git commit -m "mensaje". Si te equivocas, git merge --abort vuelve atrás.'],
    solucion: ['git merge tema-azul', 'cat estilos.css', 'echo "h1 { color: blue; }" > estilos.css', 'git add estilos.css', 'git commit -m "Fusiona tema-azul: el título queda en azul"', 'git log --oneline --graph'],
  },
  remoto: {
    nivel: 'intermedio',
    titulo: 'Subir cambios y preparar un pull request',
    intro: 'El repositorio está conectado a un servidor remoto (origin). Tienes un commit en main que todavía no has subido. Súbelo y después prepara un arreglo en una rama para que el equipo lo revise.',
    equipo: {
      estadoInicial: (s, h) => {
        h.init(); h.remoto();
        h.commit('Primera versión', { 'index.html': '<h1>Tienda</h1>\n', 'precios.txt': 'precio = 1000\n' }, 'main');
        s.remotoRamas.main = s.ramas.main;
        h.commit('Añade el pie de página', { 'index.html': '<h1>Tienda</h1>\n<footer>La Ceiba</footer>\n' });
      },
    },
    tareas: [
      { texto: 'Comprueba a qué servidor remoto está conectado (git remote -v).', ok: s => s.patrones.has('git remote') },
      { texto: 'Sube main al remoto.', ok: s => s.remotoRamas.main === s.ramas.main },
      { texto: 'Crea la rama arreglo-precios, cambia precios.txt a «precio = 1200» y haz commit.', ok: s => /1200/.test(s.ramas['arreglo-precios'] ? s.commits[s.ramas['arreglo-precios']].arbol['precios.txt'] : '') },
      { texto: 'Sube la rama arreglo-precios para abrir un pull request.', ok: s => !!s.remotoRamas['arreglo-precios'] && s.remotoRamas['arreglo-precios'] === s.ramas['arreglo-precios'] },
    ],
    pistas: ['git push origin main sube la rama main.', 'Los arreglos no van directos a main: se hacen en una rama, se suben y se revisan en un pull request.', 'git push origin arreglo-precios sube la rama nueva; el servidor te da el enlace del pull request.'],
    solucion: ['git remote -v', 'git push origin main', 'git switch -c arreglo-precios', 'echo "precio = 1200" > precios.txt', 'git add .', 'git commit -m "Corrige el precio"', 'git push origin arreglo-precios'],
  },
};
