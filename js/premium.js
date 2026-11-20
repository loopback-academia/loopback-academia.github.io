// Contenido de pago: las lecciones y preguntas de los módulos de pago no están en la web publicada; se piden a
// Supabase, que solo las entrega a quien tiene acceso (ver supabase/migrations/20261117000000_premium.sql).
// Lo descargado se guarda en este navegador para poder repasarlo sin conexión; se borra al cerrar sesión.
import { el, local } from './core.js';
import { supabase, cuentasActivas, usuarioActual } from './auth.js';
import { faltaMigracion } from './profesor.js';

const CLAVE_LECCION = id => 'aula:premium:l:' + id;
const CLAVE_PREGUNTAS = 'aula:premium:preguntas';
const sinConexion = err => /Failed to fetch|NetworkError|network|fetch/i.test(String(err?.message || err || '')) || !navigator.onLine;

// {acceso, abierto, plan, hasta, sesion, error?}  error: 'migracion' (falta activarlo en Supabase) o 'red'.
let estado = null;
export function estadoAcceso() {
  return estado || (estado = (async () => {
    if (!cuentasActivas()) return { acceso: false, abierto: false, sesion: false, error: 'sin-cuentas' };
    const usuario = await usuarioActual().catch(() => null);
    const { data, error } = await supabase().rpc('mi_acceso');
    if (error) return { acceso: false, abierto: false, sesion: !!usuario, error: faltaMigracion(error) ? 'migracion' : 'red' };
    return { ...data, sesion: !!usuario };
  })());
}

// Lección de pago: {ok: true, blocks, quiz, cache?} o {ok: false, motivo, estado}.
// Se pide de una en una a leer_leccion() (con límite por hora y registro de lecturas). Si esa función todavía no está
// instalada en Supabase, se usa la lectura directa de la tabla de antes.
async function pedirLeccion(id) {
  const { data, error } = await supabase().rpc('leer_leccion', { p_id: id });
  if (error && faltaMigracion(error)) return supabase().from('lecciones_premium').select('blocks, quiz').eq('id', id).maybeSingle();
  if (error) return { data: null, error };
  if (data?.error) return { data: null, error: null, motivo: data.error };
  return { data, error: null };
}
export async function leccionPremium(id) {
  const est = await estadoAcceso();
  const guardada = local.get(CLAVE_LECCION(id));
  if (est.acceso) {
    const { data, error, motivo } = await pedirLeccion(id);
    if (data) { local.set(CLAVE_LECCION(id), data); return { ok: true, ...data }; }
    if (motivo === 'limite' && guardada) return { ok: true, ...guardada, cache: true };
    if (error && guardada && sinConexion(error)) return { ok: true, ...guardada, cache: true };
    return { ok: false, motivo: motivo === 'limite' ? 'limite' : motivo === 'sin_acceso' ? motivoAcceso(est) : error ? 'red' : 'pendiente', estado: est };
  }
  // Sin conexión con el servidor: lo que ya se abrió antes sigue disponible en este navegador.
  if (est.error === 'red' && est.sesion && guardada) return { ok: true, ...guardada, cache: true };
  return { ok: false, motivo: motivoAcceso(est), estado: est };
}

export const motivoAcceso = est => est.error === 'migracion' ? 'pendiente' : !est.sesion ? 'sesion' : est.error === 'red' ? 'red' : est.abierto ? 'verificar' : 'plan';

// Banco de preguntas público + las de pago si hay acceso (o, sin conexión, las guardadas en este navegador).
export async function bancoCompleto(publico) {
  const est = await estadoAcceso();
  let extra = null;
  // El banco cambia poco: si se descargó hace menos de 6 horas, se usa el guardado (el servidor limita las descargas).
  const reciente = Date.now() - (local.get(CLAVE_PREGUNTAS + ':t', 0) || 0) < 6 * 3600e3 && local.get(CLAVE_PREGUNTAS)?.length;
  if (est.acceso && !reciente) {
    const { data, error } = await supabase().rpc('banco_premium');
    if (Array.isArray(data) && data.length) extra = data;
    else if (error && faltaMigracion(error)) { // instalación anterior: lectura directa por páginas
      const filas = [];
      for (let desde = 0; ; desde += 1000) {
        const r = await supabase().from('preguntas_premium').select('datos').order('id').range(desde, desde + 999);
        if (r.error) { filas.length = 0; break; }
        filas.push(...r.data);
        if (r.data.length < 1000) break;
      }
      if (filas.length) extra = filas.map(f => f.datos);
    }
    if (extra) { local.set(CLAVE_PREGUNTAS, extra); local.set(CLAVE_PREGUNTAS + ':t', Date.now()); }
  }
  if (!extra && est.sesion && (est.acceso || est.error === 'red')) extra = local.get(CLAVE_PREGUNTAS); // límite diario o sin conexión
  if (!extra?.length) return publico;
  const ids = new Set(extra.map(q => q.id));
  return [...publico.filter(q => !ids.has(q.id)), ...extra];
}

// ¿Hace falta el contenido de pago para esto? (lecciones marcadas como premium en el temario público)
export const requierePremium = lecciones => lecciones.some(l => l.premium);

const PRECIO = 'Desde RD$ 499 al mes (o US$ 9), con un pago único y sin renovaciones automáticas.';

// Pantalla para cuando no se puede mostrar el contenido de pago.
export function pantallaPremium({ titulo, motivo, estado = {} }) {
  const texto = {
    sesion: 'Esta parte de Loopback es del plan completo. Si ya tienes un plan, entra con tu cuenta. Si no, elige el tuyo: ' + PRECIO,
    plan: 'Esta parte de Loopback es del plan completo y tu cuenta todavía no lo tiene activo. ' + PRECIO,
    verificar: 'Tu cuenta tiene la verificación en dos pasos activada: vuelve a entrar e introduce el código de tu app para ver este contenido.',
    red: 'No hay conexión con el servidor y todavía no habías abierto este contenido con internet. Conéctate y vuelve a intentarlo.',
    pendiente: 'Este contenido se está preparando en el servidor. Vuelve a intentarlo en unos minutos.',
    limite: 'Has abierto muchas lecciones en poco tiempo. Para proteger el curso hay un límite por hora: descansa un rato y vuelve a intentarlo. Lo que ya abriste sigue disponible.',
  }[motivo] || 'No se pudo cargar este contenido. Vuelve a intentarlo en unos minutos.';
  const botones = motivo === 'sesion' ? [el('a', { class: 'btn btn-primary', href: 'precios.html' }, 'Ver planes y precios'), el('a', { class: 'btn btn-ghost', href: 'cuenta.html?siguiente=' + encodeURIComponent(location.pathname.split('/').pop() + location.search) }, 'Ya tengo plan: entrar')]
    : motivo === 'plan' ? [el('a', { class: 'btn btn-primary', href: 'precios.html' }, 'Ver planes y precios'), el('a', { class: 'btn btn-ghost', href: 'cuenta.html#plan' }, 'Tengo un código')]
      : motivo === 'verificar' ? [el('a', { class: 'btn btn-primary', href: 'cuenta.html' }, 'Ir a mi cuenta')]
        : [el('button', { type: 'button', class: 'btn btn-primary', onclick: () => location.reload() }, 'Reintentar')];
  const venta = motivo === 'sesion' || motivo === 'plan';
  return el('div', { class: 'locked-screen premium-screen' }, el('div', { class: 'locked-ico', 'aria-hidden': 'true' }, motivo === 'red' ? '📡' : '🔒'),
    venta ? el('span', { class: 'badge badge-accent' }, '⭐ Plan completo') : null,
    el('h1', {}, titulo), el('p', {}, texto),
    venta ? el('ul', { class: 'ticks premium-incluye' }, ['Las 6 áreas, hasta el nivel profesional', 'Laboratorios y simuladores', 'Exámenes y certificado verificable'].map(t => el('li', {}, t))) : null,
    el('div', { class: 'hero-cta' }, ...botones),
    venta ? el('p', { class: 'small muted' }, '¿No sabes si es para ti? El ', el('a', { href: 'nivel.html' }, 'examen de entrada'), ' es gratis y te dice por dónde empezar.') : null);
}

// Aviso para el panel del curso cuando no hay acceso: el temario se puede ver, las lecciones son del plan completo.
export function avisoPlan(est) {
  if (est.acceso) return null;
  return el('div', { class: 'alert alert-plan mb' },
    el('p', {}, el('strong', {}, '🔒 Estás viendo el temario. '), 'Para abrir las lecciones, los laboratorios y los exámenes necesitas el plan completo. ' + PRECIO),
    el('div', { class: 'hero-cta' }, el('a', { class: 'btn btn-primary btn-sm', href: 'precios.html' }, 'Ver planes'),
      est.sesion ? el('a', { class: 'btn btn-ghost btn-sm', href: 'cuenta.html#plan' }, 'Tengo un código')
        : el('a', { class: 'btn btn-ghost btn-sm', href: 'cuenta.html?siguiente=curso.html' }, 'Ya tengo plan: entrar')));
}

// Páginas enteras del plan completo (prácticas, comandos, glosario, videos…): <body data-plan>. Sin acceso se muestra la
// pantalla de planes. Sin conexión con el servidor, quien ya tiene sesión puede seguir usando lo que funciona sin red.
export async function exigirPlan() {
  const est = await estadoAcceso();
  if (est.acceso || (est.error === 'red' && est.sesion)) return true;
  const titulo = document.querySelector('main h1')?.textContent?.trim() || 'Plan completo';
  const main = document.getElementById('main');
  main.replaceChildren(el('section', { class: 'page' }, el('div', { class: 'narrow' }, pantallaPremium({ titulo, motivo: motivoAcceso(est), estado: est }))));
  return false;
}
