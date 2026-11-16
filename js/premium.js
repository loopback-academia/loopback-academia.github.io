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
export async function leccionPremium(id) {
  const est = await estadoAcceso();
  const guardada = local.get(CLAVE_LECCION(id));
  if (est.acceso) {
    const { data, error } = await supabase().from('lecciones_premium').select('blocks, quiz').eq('id', id).maybeSingle();
    if (data) { local.set(CLAVE_LECCION(id), data); return { ok: true, ...data }; }
    if (error && guardada && sinConexion(error)) return { ok: true, ...guardada, cache: true };
    return { ok: false, motivo: error ? 'red' : 'pendiente', estado: est };
  }
  // Sin conexión con el servidor: lo que ya se abrió antes sigue disponible en este navegador.
  if (est.error === 'red' && est.sesion && guardada) return { ok: true, ...guardada, cache: true };
  return { ok: false, motivo: motivoAcceso(est), estado: est };
}

export const motivoAcceso = est => est.error === 'migracion' ? 'pendiente' : est.error === 'red' ? 'red' : !est.sesion ? 'sesion' : est.abierto ? 'verificar' : 'plan';

// Banco de preguntas público + las de pago si hay acceso (o, sin conexión, las guardadas en este navegador).
export async function bancoCompleto(publico) {
  const est = await estadoAcceso();
  let extra = null;
  if (est.acceso) {
    const filas = [];
    for (let desde = 0; ; desde += 1000) {
      const { data, error } = await supabase().from('preguntas_premium').select('datos').order('id').range(desde, desde + 999);
      if (error) { filas.length = 0; break; }
      filas.push(...data);
      if (data.length < 1000) break;
    }
    if (filas.length) { extra = filas.map(f => f.datos); local.set(CLAVE_PREGUNTAS, extra); }
  }
  if (!extra && est.sesion && (est.acceso || est.error === 'red')) extra = local.get(CLAVE_PREGUNTAS);
  if (!extra?.length) return publico;
  const ids = new Set(extra.map(q => q.id));
  return [...publico.filter(q => !ids.has(q.id)), ...extra];
}

// ¿Hace falta el contenido de pago para esto? (lecciones marcadas como premium en el temario público)
export const requierePremium = lecciones => lecciones.some(l => l.premium);

// Pantalla para cuando no se puede mostrar el contenido de pago.
export function pantallaPremium({ titulo, motivo, estado = {} }) {
  const texto = {
    sesion: estado.abierto
      ? 'Esta parte del curso es gratis con tu cuenta. Crea tu cuenta gratuita (o entra) y sigue aprendiendo justo donde lo dejaste.'
      : 'Esta parte del curso forma parte del plan completo de Loopback. Entra en tu cuenta o crea una para activarlo.',
    plan: 'Esta parte del curso forma parte del plan completo de Loopback y tu cuenta todavía no lo tiene activo. Desde tu cuenta puedes ver cómo activarlo.',
    verificar: 'Tu cuenta tiene la verificación en dos pasos activada: vuelve a entrar e introduce el código de tu app para ver este contenido.',
    red: 'No hay conexión con el servidor y todavía no habías abierto este contenido con internet. Conéctate y vuelve a intentarlo.',
    pendiente: 'Este contenido se está preparando en el servidor. Vuelve a intentarlo en unos minutos.',
  }[motivo] || 'No se pudo cargar este contenido. Vuelve a intentarlo en unos minutos.';
  const boton = motivo === 'sesion' ? el('a', { class: 'btn btn-primary', href: 'cuenta.html?modo=registro' }, estado.abierto ? 'Crear mi cuenta gratis' : 'Entrar o crear cuenta')
    : motivo === 'plan' || motivo === 'verificar' ? el('a', { class: 'btn btn-primary', href: 'cuenta.html' }, 'Ir a mi cuenta')
      : el('button', { type: 'button', class: 'btn btn-primary', onclick: () => location.reload() }, 'Reintentar');
  return el('div', { class: 'locked-screen premium-screen' }, el('div', { class: 'locked-ico', 'aria-hidden': 'true' }, motivo === 'red' ? '📡' : '⭐'),
    el('h1', {}, titulo), el('p', {}, texto),
    motivo === 'sesion' ? el('p', { class: 'small muted' }, 'Lo gratuito sigue abierto para todos: «Empieza aquí», el primer módulo de cada área, el examen de entrada y el glosario.') : null,
    el('div', { class: 'hero-cta' }, boton, el('a', { class: 'btn btn-ghost', href: 'curso.html' }, 'Volver al curso')));
}
