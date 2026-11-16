// Exámenes finales verificados y certificados (sin DOM: se prueba en Node). La corrección, la nota y los certificados
// viven en el servidor (supabase/migrations/20261116000000_finales.sql); aquí solo se preparan los datos para mostrarlos
// y para enviarlos.

export const AREAS_FINAL = { base: 'Empieza aquí', redes: 'Redes', bd: 'Bases de datos', prog: 'Programación', ti: 'Empleo TI', en: 'Inglés técnico', sec: 'Ciberseguridad' };
export const MINIMO = 80;
export const INTENTOS_DIA = 2;

// Baraja las opciones de una pregunta del servidor, recordando el índice original de cada una (el servidor corrige
// por índice original). rnd permite pruebas deterministas.
export function prepararPregunta(p, rnd = Math.random) {
  const opciones = p.opciones.map((texto, i) => ({ texto, i }));
  for (let k = opciones.length - 1; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)); [opciones[k], opciones[j]] = [opciones[j], opciones[k]]; }
  return { id: p.id, dominio: p.dominio, texto: p.pregunta, opciones, elige: p.elige || 1 };
}

// {id: Set|Array de índices originales} → {id: [índices ordenados]} para final_entregar.
export function respuestasParaServidor(respuestas) {
  const out = {};
  for (const [id, v] of Object.entries(respuestas || {})) {
    const lista = [...new Set([...(v || [])].map(Number).filter(n => Number.isInteger(n) && n >= 0 && n < 10))].sort((a, b) => a - b);
    if (lista.length) out[id] = lista;
  }
  return out;
}

// Resultado por tema del servidor ({tema: {p, t}}) → lista ordenada de peor a mejor, con el porcentaje.
export function temasOrdenados(temas) {
  return Object.entries(temas || {}).map(([tema, { p, t }]) => ({ tema, p, t, pct: t ? Math.round((p / t) * 100) : 0 }))
    .sort((a, b) => a.pct - b.pct || a.tema.localeCompare(b.tema, 'es'));
}

// Diferencia entre el reloj del servidor y el del navegador, para que el cronómetro use la hora límite del servidor
// aunque la hora del equipo esté mal.
export function finLocal({ limite, ahora }, ahoraLocal = Date.now()) {
  return Date.parse(limite) - (Date.parse(ahora) - ahoraLocal);
}

// Código de certificado escrito por una persona («lb-abcd efgh 23», con o sin LB-) → «LB-ABCDEFGH23», o null.
export function normalizarCodigo(texto) {
  const s = String(texto || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cuerpo = s.length === 12 && s.startsWith('LB') ? s.slice(2) : s;
  return /^[A-HJ-NP-Z2-9]{10}$/.test(cuerpo) ? 'LB-' + cuerpo : null;
}

// Mensaje entendible a partir de un error de las funciones del servidor.
export function mensajeFinal(err) {
  const m = String(err?.message || err || '');
  if (/intentos de este examen/i.test(m)) return m;
  if (/segundo factor/i.test(m)) return 'Tu cuenta tiene la verificación en dos pasos activada: vuelve a entrar e introduce el código de tu app para hacer el examen.';
  if (/todavía no está disponible/i.test(m)) return 'El examen final de esta área todavía no está disponible. Vuelve a intentarlo más adelante.';
  if (/ya se entregó/i.test(m)) return 'Este intento ya se entregó.';
  if (/Sin sesión|JWT|token/i.test(m)) return 'Tu sesión ha caducado. Vuelve a entrar en tu cuenta.';
  if (/Failed to fetch|NetworkError|network/i.test(m)) return 'No hay conexión con el servidor. Comprueba tu internet y vuelve a intentarlo: tus respuestas se conservan.';
  return 'No se pudo completar la operación. Inténtalo de nuevo en unos minutos.';
}
