// Área «Empieza aquí»: prácticas para quien empieza de cero (sin DOM: las pruebas y la interfaz usan estos datos).
// [[inicio:atajos]] atajos de teclado · [[inicio:archivos]] tipos de archivo · [[inicio:partes]] piezas del ordenador ·
// [[inicio:unidades]] bits, bytes y velocidad · [[inicio:orientacion]] test para elegir área.

export const APROBADO = 0.8;
export const POR_RONDA = 10;

// ------------------------------------------------------------------ atajos de teclado
// tecla: combinación que se puede pulsar en el navegador (las que el navegador o el sistema no dejan capturar no la llevan).
export const ATAJOS = [
  { accion: 'Copiar lo que tienes seleccionado', combo: 'Ctrl + C', mac: 'Cmd + C', tecla: { ctrl: true, key: 'c' }, e: 'Copia sin quitar el original. Después lo pegas donde quieras.' },
  { accion: 'Pegar lo que copiaste', combo: 'Ctrl + V', mac: 'Cmd + V', tecla: { ctrl: true, key: 'v' }, e: 'Pega lo último que copiaste o cortaste.' },
  { accion: 'Cortar (quitar de un sitio para ponerlo en otro)', combo: 'Ctrl + X', mac: 'Cmd + X', tecla: { ctrl: true, key: 'x' }, e: 'Como copiar, pero quita el original al pegarlo.' },
  { accion: 'Deshacer lo último que hiciste', combo: 'Ctrl + Z', mac: 'Cmd + Z', tecla: { ctrl: true, key: 'z' }, e: 'El atajo más útil: si borras algo sin querer, lo recuperas.' },
  { accion: 'Seleccionar todo', combo: 'Ctrl + A', mac: 'Cmd + A', tecla: { ctrl: true, key: 'a' }, e: 'Selecciona todo el texto de un documento o todos los archivos de una carpeta.' },
  { accion: 'Guardar el documento', combo: 'Ctrl + S', mac: 'Cmd + S', tecla: { ctrl: true, key: 's' }, e: 'Guarda a menudo: si se va la luz, no pierdes el trabajo.' },
  { accion: 'Buscar una palabra en la página o el documento', combo: 'Ctrl + F', mac: 'Cmd + F', tecla: { ctrl: true, key: 'f' }, e: 'Funciona en el navegador, en Word, en PDF… La F es de «find» (buscar).' },
  { accion: 'Imprimir', combo: 'Ctrl + P', mac: 'Cmd + P', tecla: { ctrl: true, key: 'p' }, e: 'También sirve para «imprimir» a PDF y guardar una copia.' },
  { accion: 'Cambiar el nombre de un archivo seleccionado', combo: 'F2', mac: 'Intro', tecla: { key: 'F2' }, e: 'En Windows, F2; en Mac, se selecciona el archivo y se pulsa Intro.' },
  { accion: 'Cambiar entre las ventanas abiertas', combo: 'Alt + Tab', mac: 'Cmd + Tab', e: 'Mantén Alt y pulsa Tab varias veces para elegir la ventana.' },
  { accion: 'Bloquear el ordenador al levantarte', combo: 'Windows + L', mac: 'Ctrl + Cmd + Q', e: 'Así nadie usa tu sesión mientras no estás. Es un hábito básico de seguridad.' },
  { accion: 'Abrir el Explorador de archivos', combo: 'Windows + E', mac: 'Cmd + Espacio y escribir «Finder»', e: 'Abre tus carpetas directamente.' },
  { accion: 'Abrir el Administrador de tareas (ver qué programa se ha colgado)', combo: 'Ctrl + Shift + Esc', mac: 'Cmd + Opción + Esc', e: 'Permite cerrar un programa que no responde.' },
  { accion: 'Abrir una pestaña nueva en el navegador', combo: 'Ctrl + T', mac: 'Cmd + T', e: 'La T es de «tab» (pestaña).' },
  { accion: 'Cerrar la pestaña actual del navegador', combo: 'Ctrl + W', mac: 'Cmd + W', e: '¿La cerraste sin querer? Ctrl + Shift + T la vuelve a abrir.' },
  { accion: 'Hacer una captura de una parte de la pantalla', combo: 'Windows + Shift + S', mac: 'Cmd + Shift + 4', e: 'Muy útil para enviar a soporte una foto del error.' },
];
// ¿La pulsación (de un evento de teclado) corresponde al atajo? En Mac se acepta Cmd en lugar de Ctrl.
export function coincideTecla(atajo, ev) {
  const t = atajo.tecla;
  if (!t) return false;
  const ctrl = !!(ev.ctrlKey || ev.metaKey);
  if (!!t.ctrl !== ctrl || !!t.shift !== !!ev.shiftKey || ev.altKey) return false;
  return String(ev.key).toLowerCase() === t.key.toLowerCase();
}

// ------------------------------------------------------------------ tipos de archivo
export const TIPOS = {
  texto: 'Documento de texto', hoja: 'Hoja de cálculo', presentacion: 'Presentación', pdf: 'Documento PDF', imagen: 'Imagen', audio: 'Audio',
  video: 'Vídeo', comprimido: 'Archivo comprimido', programa: 'Programa (se ejecuta)', web: 'Página web',
};
export const ARCHIVOS = [
  { nombre: 'informe.docx', t: 'texto', e: '.docx es un documento de Word (o compatible, como LibreOffice Writer).' },
  { nombre: 'notas.txt', t: 'texto', e: '.txt es texto sin formato: se abre con el Bloc de notas.' },
  { nombre: 'ventas-marzo.xlsx', t: 'hoja', e: '.xlsx es una hoja de cálculo de Excel: filas, columnas y fórmulas.' },
  { nombre: 'clientes.csv', t: 'hoja', e: '.csv son datos separados por comas: se abre con Excel o Google Sheets.' },
  { nombre: 'clase-1.pptx', t: 'presentacion', e: '.pptx es una presentación de PowerPoint (diapositivas).' },
  { nombre: 'contrato.pdf', t: 'pdf', e: 'Un PDF se ve igual en cualquier equipo: ideal para enviar documentos finales.' },
  { nombre: 'vacaciones.jpg', t: 'imagen', e: '.jpg (o .jpeg) es el formato típico de las fotos.' },
  { nombre: 'captura.png', t: 'imagen', e: '.png es una imagen sin pérdida de calidad: muy usado en capturas de pantalla.' },
  { nombre: 'cancion.mp3', t: 'audio', e: '.mp3 es audio comprimido: música, notas de voz…' },
  { nombre: 'tutorial.mp4', t: 'video', e: '.mp4 es el formato de vídeo más común.' },
  { nombre: 'fotos-boda.zip', t: 'comprimido', e: 'Un .zip junta varios archivos en uno y ocupa menos. Hay que «extraerlo» para usarlos.' },
  { nombre: 'instalar-programa.exe', t: 'programa', e: '.exe es un programa de Windows: al abrirlo se EJECUTA. Ábrelo solo si viene de una fuente de confianza.' },
  { nombre: 'factura.pdf.exe', t: 'programa', e: '¡Trampa! La extensión real es la última: .exe. Es un programa disfrazado de PDF, típico de virus.' },
  { nombre: 'index.html', t: 'web', e: '.html es una página web: se abre con el navegador.' },
  { nombre: 'copia.rar', t: 'comprimido', e: '.rar es otro formato comprimido, como .zip o .7z.' },
  { nombre: 'logo.svg', t: 'imagen', e: '.svg es una imagen hecha con formas (vectorial): se amplía sin perder calidad.' },
];
export const extension = nombre => (nombre.includes('.') ? nombre.slice(nombre.lastIndexOf('.')).toLowerCase() : '');

// ------------------------------------------------------------------ piezas del ordenador
export const PIEZAS = {
  cpu: 'Procesador (CPU)', ram: 'Memoria RAM', disco: 'Disco (SSD o HDD)', placa: 'Placa base', fuente: 'Fuente de alimentación', grafica: 'Tarjeta gráfica',
  monitor: 'Monitor', teclado: 'Teclado', usb: 'Puerto USB', red: 'Tarjeta de red (Wi-Fi o Ethernet)', ventilador: 'Ventilador y disipador', bateria: 'Batería',
};
export const PREGUNTAS_PIEZAS = [
  { q: 'Es el «cerebro»: ejecuta las instrucciones de los programas.', r: 'cpu', e: 'El procesador hace los cálculos. Intel y AMD son los fabricantes más conocidos.' },
  { q: 'Guarda lo que estás usando AHORA; se borra al apagar el equipo.', r: 'ram', e: 'La RAM es la «mesa de trabajo»: cuanta más, más programas abiertos a la vez sin que vaya lento.' },
  { q: 'Guarda tus archivos y programas aunque apagues el equipo.', r: 'disco', e: 'El disco es el «armario». Un SSD es mucho más rápido que un disco duro tradicional (HDD).' },
  { q: 'La placa grande donde se conectan todas las demás piezas.', r: 'placa', e: 'La placa base comunica el procesador, la memoria, los discos y los puertos.' },
  { q: 'Convierte la corriente del enchufe en la que necesitan las piezas.', r: 'fuente', e: 'Si una torre no enciende nada de nada, la fuente es de lo primero que se revisa.' },
  { q: 'Dibuja la imagen en pantalla y acelera los juegos y el vídeo.', r: 'grafica', e: 'Puede venir dentro del procesador (integrada) o ser una tarjeta aparte (dedicada).' },
  { q: 'Por aquí se conectan memorias, ratones, impresoras y móviles.', r: 'usb', e: 'USB es el conector universal. Los más nuevos son de tipo C (reversibles).' },
  { q: 'Permite conectarse a internet por cable o por Wi-Fi.', r: 'red', e: 'Cada tarjeta de red tiene una dirección única llamada MAC.' },
  { q: 'Saca el calor del procesador para que no se queme.', r: 'ventilador', e: 'Si el equipo se apaga solo o hace mucho ruido, puede estar sucio por dentro.' },
  { q: 'Muestra la imagen: es un dispositivo de SALIDA.', r: 'monitor', e: 'Los dispositivos de salida muestran información (monitor, altavoz, impresora).' },
  { q: 'Sirve para escribir: es un dispositivo de ENTRADA.', r: 'teclado', e: 'Los dispositivos de entrada meten información (teclado, ratón, micrófono, cámara).' },
  { q: 'Da energía a un portátil cuando no está enchufado y se desgasta con los años.', r: 'bateria', e: 'Si un portátil solo funciona enchufado, normalmente toca cambiar la batería.' },
];

// ------------------------------------------------------------------ unidades (preguntas generadas)
const entero = (rnd, a, b) => a + Math.floor(rnd() * (b - a + 1));
const elegir = (rnd, xs) => xs[Math.floor(rnd() * xs.length)];
export const ORDEN_UNIDADES = ['bit', 'byte', 'KB', 'MB', 'GB', 'TB'];
const GEN = {
  bytes: rnd => { const b = entero(rnd, 2, 16); return { q: `¿Cuántos bytes son ${b * 8} bits?`, respuesta: String(b), e: `1 byte = 8 bits. ${b * 8} ÷ 8 = ${b} bytes.` }; },
  bits: rnd => { const b = entero(rnd, 2, 12); return { q: `¿Cuántos bits son ${b} bytes?`, respuesta: String(b * 8), e: `Cada byte tiene 8 bits: ${b} × 8 = ${b * 8} bits.` }; },
  velocidad: rnd => { const mb = elegir(rnd, [2, 5, 10, 12, 25, 50, 75, 125]); return { q: `Tu internet es de ${mb * 8} Mbps (megabits por segundo). ¿Cuántos MB (megabytes) por segundo descargas como máximo?`, respuesta: String(mb), e: `Las velocidades se dan en bits; los archivos, en bytes. Divide entre 8: ${mb * 8} ÷ 8 = ${mb} MB/s.` }; },
  tiempo: rnd => { const v = elegir(rnd, [8, 16, 40, 80, 160, 200, 240]); const s = elegir(rnd, [2, 3, 4, 5, 6, 10]); const mb = (v / 8) * s; return { q: `Un archivo de ${mb} MB y una conexión de ${v} Mbps. ¿Cuántos segundos tarda como mínimo en descargarse?`, respuesta: String(s), e: `${v} Mbps ÷ 8 = ${v / 8} MB por segundo. ${mb} MB ÷ ${v / 8} = ${s} segundos.` }; },
  mayor: rnd => {
    let i = entero(rnd, 0, ORDEN_UNIDADES.length - 1), j = entero(rnd, 0, ORDEN_UNIDADES.length - 1);
    while (j === i) j = entero(rnd, 0, ORDEN_UNIDADES.length - 1);
    const ops = [ORDEN_UNIDADES[i], ORDEN_UNIDADES[j]];
    return { q: `¿Qué es más grande: 1 ${ops[0]} o 1 ${ops[1]}?`, opciones: ops, c: i > j ? 0 : 1, respuesta: ORDEN_UNIDADES[Math.max(i, j)], e: `De menor a mayor: bit < byte < KB < MB < GB < TB.` };
  },
};
export const TIPOS_UNIDADES = Object.keys(GEN);
export function preguntasUnidades(n = 8, rnd = Math.random) {
  const orden = [...TIPOS_UNIDADES].sort(() => rnd() - 0.5);
  return Array.from({ length: n }, (_, i) => ({ tipo: orden[i % orden.length], ...GEN[orden[i % orden.length]](rnd) }));
}
export const comprobarUnidad = (p, r) => (p.opciones ? +r === p.c : String(r).trim().replace(',', '.').replace(/\.0+$/, '') === p.respuesta);

// ------------------------------------------------------------------ preguntas de opción múltiple a partir de un conjunto
// Devuelve { q, opciones, c } con la buena y 3 distractores al azar de la misma lista.
export function conOpciones(enunciado, buena, todas, rnd = Math.random) {
  const otras = [...new Set(todas.filter(x => x !== buena))].sort(() => rnd() - 0.5).slice(0, 3);
  const opciones = [buena, ...otras].sort(() => rnd() - 0.5);
  return { q: enunciado, opciones, c: opciones.indexOf(buena) };
}
export function ronda(id, rnd = Math.random) {
  const baraja = xs => [...xs].sort(() => rnd() - 0.5).slice(0, POR_RONDA);
  if (id === 'atajos') return baraja(ATAJOS).map(a => ({ ...conOpciones(a.accion, a.combo, ATAJOS.map(x => x.combo), rnd), e: a.e, mac: a.mac, atajo: a }));
  if (id === 'archivos') return baraja(ARCHIVOS).map(a => ({ ...conOpciones(a.nombre, TIPOS[a.t], Object.values(TIPOS), rnd), e: a.e, archivo: true }));
  if (id === 'partes') return baraja(PREGUNTAS_PIEZAS).map(p => ({ ...conOpciones(p.q, PIEZAS[p.r], Object.values(PIEZAS), rnd), e: p.e }));
  throw new Error('Ronda desconocida: ' + id);
}

// ------------------------------------------------------------------ test de orientación
export const AREAS_ORIENTACION = {
  ti: ['Soporte técnico (Empleo TI)', 'Ayudar a personas a resolver problemas con sus equipos. Es la puerta de entrada más rápida a un empleo en tecnología.'],
  redes: ['Redes', 'Conectar oficinas, configurar routers y switches y que internet funcione. Camino hacia la certificación CCNA.'],
  prog: ['Programación', 'Crear programas, webs y automatizaciones escribiendo código.'],
  bd: ['Bases de datos y análisis', 'Ordenar información y sacar conclusiones de los datos con SQL.'],
  sec: ['Ciberseguridad', 'Proteger sistemas y personas frente a ataques, y responder cuando algo pasa.'],
};
// Cada opción suma puntos a una o varias áreas.
export const PREGUNTAS_ORIENTACION = [
  { q: 'Un familiar no consigue imprimir. ¿Qué haces?', o: [['Le ayudo encantado, con paciencia, hasta que funcione', { ti: 2 }], ['Miro si la impresora está conectada a la red Wi-Fi', { redes: 2 }], ['Busco si hay una forma de automatizarlo para que no vuelva a pasar', { prog: 2 }], ['Prefiero que lo resuelva otra persona', {}]] },
  { q: '¿Qué te gustaría construir o lograr?', o: [['Una aplicación o una página web', { prog: 2 }], ['Una red que conecte varias oficinas', { redes: 2 }], ['Un informe que explique por qué bajan las ventas', { bd: 2 }], ['Que nadie pueda robar los datos de una empresa', { sec: 2 }]] },
  { q: '¿Con qué disfrutas más?', o: [['Hablando con gente y ayudando', { ti: 2 }], ['Resolviendo acertijos y retos de lógica', { prog: 1, sec: 1 }], ['Con números, tablas y gráficos', { bd: 2 }], ['Montando y desmontando aparatos', { redes: 1, ti: 1 }]] },
  { q: 'Te llega un correo raro que pide tu contraseña. ¿Qué piensas?', o: [['Me da curiosidad saber cómo funciona ese engaño', { sec: 2 }], ['Lo borro y sigo con lo mío', {}], ['Aviso a los demás para que no caigan', { ti: 1, sec: 1 }]] },
  { q: '¿Cómo te gustaría trabajar?', o: [['Delante del ordenador, concentrado en algo mío', { prog: 1, bd: 1 }], ['Moviéndome, visitando oficinas y tiendas', { redes: 1, ti: 1 }], ['En equipo, atento a alertas y a lo que pasa', { sec: 2 }], ['Atendiendo a usuarios por teléfono o chat', { ti: 2 }]] },
  { q: '¿Qué asignatura se te daba mejor (o te gustaba más)?', o: [['Matemáticas', { bd: 1, prog: 1 }], ['Tecnología o física', { redes: 2 }], ['Lengua o idiomas', { ti: 1 }], ['Ninguna en especial, aprendo haciendo', { ti: 1, prog: 1 }]] },
  { q: '¿Qué prefieres?', o: [['Encontrar trabajo cuanto antes', { ti: 2 }], ['Una especialidad muy demandada, aunque cueste más', { sec: 1, redes: 1 }], ['Algo creativo', { prog: 2 }], ['Entender un negocio con sus datos', { bd: 2 }]] },
  { q: 'Cuando algo no funciona…', o: [['Pruebo cosas hasta dar con la causa', { redes: 1, ti: 1 }], ['Leo y busco información con calma', { sec: 1, bd: 1 }], ['Me pongo a escribir una solución', { prog: 2 }], ['Pregunto a quien sepa más', { ti: 1 }]] },
];
// respuestas: índice de la opción elegida en cada pregunta. Devuelve las áreas ordenadas por puntos [[area, puntos], …].
export function resultadoOrientacion(respuestas) {
  const p = Object.fromEntries(Object.keys(AREAS_ORIENTACION).map(a => [a, 0]));
  respuestas.forEach((r, i) => { const o = PREGUNTAS_ORIENTACION[i]?.o[r]; if (o) for (const [a, n] of Object.entries(o[1])) p[a] += n; });
  const orden = ['ti', 'redes', 'prog', 'bd', 'sec'];
  return Object.entries(p).sort((a, b) => b[1] - a[1] || orden.indexOf(a[0]) - orden.indexOf(b[0]));
}
