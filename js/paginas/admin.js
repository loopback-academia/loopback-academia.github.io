// Panel de administración: cifras agregadas de toda la plataforma, ventas y, solo para las cuentas con actividad rara
// (posible copia del curso, cuenta compartida o prueba de códigos), su correo para poder bloquearlas.
// La seguridad está en el servidor: admin_estadisticas() exige estar en la tabla administradores y una sesión con la
// verificación en dos pasos completada (aal2). Esta página solo muestra lo que devuelve.
import { iniciarPagina, el, $, setMeter } from '../core.js';
import { supabase, cuentasActivas } from '../auth.js';
import { faltaMigracion } from '../profesor.js';
import { CONFIG } from '../config.js';
import { PLANES, NOMBRE_PLAN, pesos, dolares } from '../planes.js';

const usuario = await iniciarPagina();
const raiz = $('#admin');
const AREAS = { redes: 'Redes', bd: 'Bases de datos', prog: 'Programación', ti: 'Empleo TI', en: 'Inglés técnico', sec: 'Ciberseguridad' };
const num = n => (n ?? 0).toLocaleString('es');
const pctTxt = (a, b) => (b ? Math.round((a / b) * 100) + ' %' : '—');
const cabecera = (...extra) => el('div', { class: 'page-head' }, el('span', { class: 'eyebrow' }, 'Administración'), el('h1', {}, 'Estadísticas de Loopback'), ...extra);
const aviso = (clase, ...t) => el('div', { class: 'alert ' + clase }, el('p', {}, ...t));

function tile(valor, etiqueta, nota) {
  return el('div', { class: 'card stat admin-tile' }, el('strong', {}, typeof valor === 'string' ? valor : num(valor)), el('span', {}, etiqueta), nota ? el('span', { class: 'small muted' }, nota) : null);
}

// Barras verticales de una sola serie (altas por semana): un único color, sin leyenda; el valor aparece al pasar el
// cursor o al enfocar cada barra, y hay una tabla equivalente para lectores de pantalla.
function barrasSemana(filas) {
  if (!filas.length) return el('p', { class: 'muted' }, 'Todavía no hay registros en las últimas 12 semanas.');
  const max = Math.max(...filas.map(f => f.n), 1);
  const fecha = d => new Date(d + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' });
  const grafico = el('div', { class: 'admin-barras', role: 'img', 'aria-label': 'Altas por semana: ' + filas.map(f => `${fecha(f.semana)}, ${f.n}`).join('; ') },
    filas.map(f => {
      const barra = el('span', { class: 'admin-barra', tabindex: '0', 'data-valor': `${num(f.n)} altas · semana del ${fecha(f.semana)}` });
      barra.style.setProperty('--h', String(f.n / max));
      return el('div', { class: 'admin-col' }, barra, el('span', { class: 'admin-eje' }, fecha(f.semana)));
    }));
  const tabla = el('details', { class: 'small mt' }, el('summary', {}, 'Ver como tabla'),
    el('table', {}, el('thead', {}, el('tr', {}, el('th', { scope: 'col' }, 'Semana'), el('th', { scope: 'col' }, 'Altas'))),
      el('tbody', {}, filas.map(f => el('tr', {}, el('td', {}, fecha(f.semana)), el('td', {}, num(f.n)))))));
  return el('div', {}, grafico, tabla);
}

function barraCelda(valor, max, texto) {
  const m = el('div', { class: 'meter admin-meter' }, el('span'));
  setMeter(m, max ? valor / max : 0);
  return el('td', {}, el('span', {}, texto ?? num(valor)), m);
}

function pintar(e) {
  const u = e.usuarios || {};
  const areas = Object.keys(AREAS);
  const maxLec = Math.max(1, ...areas.map(a => e.areas?.[a]?.lecciones || 0));
  const banco = e.banco || {};
  const pocas = areas.filter(a => (banco[a] || 0) < 25);
  const actualizar = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, '↻ Actualizar');
  actualizar.addEventListener('click', cargar);
  raiz.replaceChildren(...[
    cabecera(el('p', {}, 'Cifras agregadas de toda la plataforma. No se muestra ningún dato que identifique a un alumno.'),
      el('p', { class: 'small muted' }, `Actualizado: ${new Date(e.generado).toLocaleString('es')} `, actualizar)),
    el('div', { class: 'admin-tiles' },
      tile(u.total, 'alumnos registrados'), tile(u.nuevos_7, 'altas en 7 días', `${num(u.nuevos_30)} en 30 días`),
      tile(u.activos_7, 'activos en 7 días', `${num(u.activos_30)} en 30 días`), tile(u.con_mfa, 'con verificación en dos pasos', pctTxt(u.con_mfa, u.total) + ' del total')),
    el('section', { class: 'card mt' }, el('h2', {}, 'Altas por semana'), el('p', { class: 'small muted' }, 'Últimas 12 semanas.'), barrasSemana(e.registros_semana || [])),
    el('section', { class: 'card mt' }, el('h2', {}, 'Áreas y exámenes finales oficiales'),
      el('div', { class: 'table-wrap' }, el('table', { class: 'admin-tabla' },
        el('thead', {}, el('tr', {}, ['Área', 'Lecciones completadas', 'Alumnos', 'Intentos del final', 'Aprobados', 'Nota media', 'Certificados', 'Preguntas en el banco'].map(t => el('th', { scope: 'col' }, t)))),
        el('tbody', {}, areas.map(a => {
          const f = e.finales?.[a] || {};
          return el('tr', {}, el('th', { scope: 'row' }, AREAS[a]), barraCelda(e.areas?.[a]?.lecciones || 0, maxLec), el('td', {}, num(e.areas?.[a]?.alumnos)),
            el('td', {}, num(f.intentos)), el('td', {}, f.intentos ? `${num(f.aprobados)} (${pctTxt(f.aprobados, f.intentos)})` : '—'),
            el('td', {}, f.nota_media != null ? f.nota_media + ' %' : '—'), el('td', {}, num(e.certificados?.[a])),
            el('td', { class: (banco[a] || 0) < 25 ? 'admin-falta' : null }, num(banco[a])));
        })))),
      pocas.length ? aviso('alert-warn', `Áreas con menos de 25 preguntas activas en el banco privado (cada examen usa 25): ${pocas.map(a => AREAS[a]).join(', ')}. Carga el archivo de preguntas en Supabase.`) : null),
    el('div', { class: 'grid-2 mt' },
      el('section', { class: 'card' }, el('h2', {}, 'Simulacros de examen'),
        el('p', {}, `${num(e.simulacros?.total)} simulacros de ${num(e.simulacros?.alumnos)} alumnos. Nota media: ${e.simulacros?.nota_media != null ? e.simulacros.nota_media + ' %' : '—'}.`)),
      el('section', { class: 'card' }, el('h2', {}, 'Clases'),
        el('p', {}, `${num(e.clases?.total)} clases creadas por profesores, con ${num(e.clases?.alumnos)} alumnos inscritos.`))),
    el('section', { class: 'card mt' }, el('h2', {}, 'Preguntas del examen final que más se fallan'),
      el('p', { class: 'small muted' }, 'Solo preguntas con 5 respuestas o más. Si una se falla casi siempre, revisa si está bien redactada o si falta explicar ese tema en las lecciones.'),
      (e.preguntas_dificiles || []).length
        ? el('ol', { class: 'admin-dificiles' }, e.preguntas_dificiles.map(p => el('li', {},
            el('p', {}, p.pregunta), el('p', { class: 'small muted' }, `${AREAS[p.area] || p.area} · ${p.id} · falla el ${pctTxt(p.fallos, p.respuestas)} (${num(p.fallos)} de ${num(p.respuestas)})`))))
        : el('p', { class: 'muted' }, 'Aún no hay suficientes respuestas.')),
  ].filter(Boolean));
}

async function cargar() {
  const { data, error } = await supabase().rpc('admin_estadisticas');
  if (error) {
    const m = error.message || '';
    if (faltaMigracion(error)) raiz.replaceChildren(cabecera(), aviso('alert-warn', 'El panel aún no está activado: ejecuta ', el('code', {}, 'supabase/migrations/20261116000000_finales.sql'), ' en Supabase → SQL Editor.'));
    else if (/dos pasos/i.test(m)) raiz.replaceChildren(cabecera(), aviso('alert-warn', m.replace(/^.*?El panel/, 'El panel'), ' ', el('a', { href: 'cuenta.html' }, 'Ir a Tu cuenta')));
    else if (/No autorizado/i.test(m)) raiz.replaceChildren(cabecera(), aviso('alert-info', 'Esta página es solo para la administración de Loopback.'));
    else raiz.replaceChildren(cabecera(), aviso('alert-warn', 'No se pudieron cargar las estadísticas. Recarga la página.'));
    return;
  }
  pintar(data);
  const ventas = el('section', { class: 'card mt', id: 'ventas' });
  raiz.firstChild.after(ventas); // justo debajo de la cabecera: es lo que más se usa
  pintarVentas(ventas);
  const alertas = el('section', { class: 'card mt', id: 'alertas' });
  ventas.after(alertas);
  pintarAlertas(alertas);
}

// ---------------------------------------------------------------- vigilancia: cuentas con actividad rara
async function pintarAlertas(caja) {
  const { data, error } = await supabase().rpc('admin_alertas');
  const titulo = el('h2', {}, '🛡️ Seguridad: cuentas con actividad rara');
  if (error) {
    caja.replaceChildren(titulo, aviso('alert-warn', faltaMigracion(error)
      ? ['Para activar la vigilancia y los límites, ejecuta ', el('code', {}, 'supabase/migrations/20261119000000_blindaje.sql'), ' en Supabase → SQL Editor.']
      : 'No se pudieron cargar las alertas. Recarga la página.'));
    return;
  }
  const explicacion = el('p', { class: 'small muted' }, 'Aparecen las cuentas que en las últimas 24 horas abrieron 100 lecciones o más, que leyeron desde 6 sesiones distintas o más en una semana (cuenta compartida) o que fallaron 10 códigos o más; y las que tienes bloqueadas. Bloquear quita el acceso al momento; se puede deshacer.');
  if (!data.length) { caja.replaceChildren(titulo, explicacion, el('p', { class: 'muted' }, '✓ Ninguna cuenta con actividad rara.')); return; }
  caja.replaceChildren(titulo, explicacion, el('div', { class: 'table-wrap mt' }, el('table', { class: 'admin-tabla' },
    el('thead', {}, el('tr', {}, ['Correo', 'Motivo', 'Lecturas 24 h', 'Sesiones 7 días', 'Fallos de código', ''].map(t => el('th', { scope: 'col' }, t)))),
    el('tbody', {}, data.map(a => {
      const boton = el('button', { type: 'button', class: 'btn btn-sm ' + (a.bloqueada ? 'btn-ghost' : 'btn-primary') }, a.bloqueada ? 'Desbloquear' : 'Bloquear');
      boton.addEventListener('click', async () => {
        if (!a.bloqueada && !confirm(`¿Bloquear la cuenta ${a.correo}? Perderá el acceso al curso al momento.`)) return;
        const r = a.bloqueada ? await supabase().rpc('admin_desbloquear', { p_user: a.user_id }) : await supabase().rpc('admin_bloquear', { p_user: a.user_id, p_motivo: a.motivo });
        if (r.error) alert(r.error.message); else pintarAlertas(caja);
      });
      return el('tr', {}, el('td', {}, a.correo), el('td', {}, a.bloqueada ? el('span', { class: 'badge' }, 'Bloqueada') : a.motivo),
        el('td', {}, num(a.lecturas_24h)), el('td', {}, num(a.sesiones_7d)), el('td', {}, num(a.fallos_canje_24h)), el('td', {}, boton));
    })))));
}

// ---------------------------------------------------------------- ventas y códigos de acceso
// Se genera un código por cada pago recibido (transferencia o PayPal) y se le envía al alumno, que lo canjea en «Tu
// cuenta». El código solo se ve una vez: el servidor guarda su resumen, no el código.
const METODOS = { transferencia: 'Transferencia (RD$)', paypal: 'PayPal (US$)', cortesia: 'Cortesía (gratis)', otro: 'Otro' };
const fechaCorta = iso => new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
const importe = (monto, moneda) => (moneda === 'USD' ? dolares : pesos)(Number(monto));

async function pintarVentas(caja) {
  const { data, error } = await supabase().rpc('admin_ventas', { p_limite: 100 });
  if (error) {
    caja.replaceChildren(el('h2', {}, 'Ventas y códigos'), aviso('alert-warn', faltaMigracion(error)
      ? ['Para vender con códigos de acceso, ejecuta ', el('code', {}, 'supabase/migrations/20261118000000_codigos.sql'), ' en Supabase → SQL Editor.']
      : 'No se pudieron cargar las ventas. Recarga la página.'));
    return;
  }
  const plan = el('select', { id: 'vPlan' }, [...Object.entries(PLANES).map(([k, p]) => el('option', { value: k }, `${p.nombre} · ${pesos(p.dop)} / ${dolares(p.usd)}`)),
    el('option', { value: 'cortesia' }, 'Cortesía (días a elegir)')]);
  const metodo = el('select', { id: 'vMetodo' }, Object.entries(METODOS).map(([k, t]) => el('option', { value: k }, t)));
  const monto = el('input', { id: 'vMonto', type: 'number', min: 0, step: 1, inputmode: 'numeric' });
  const dias = el('input', { id: 'vDias', type: 'number', min: 1, max: 400, value: 30 });
  const nota = el('input', { id: 'vNota', type: 'text', maxlength: 120, placeholder: 'Ej.: Ana Pérez · WhatsApp 809…', autocomplete: 'off' });
  const correo = el('input', { id: 'vCorreo', type: 'email', maxlength: 254, placeholder: 'correo@delalumno.com', autocomplete: 'off' });
  const campoDias = el('div', { class: 'field', hidden: true }, el('label', { for: 'vDias' }, 'Días de acceso'), dias);
  const moneda = () => (metodo.value === 'paypal' ? 'USD' : 'DOP');
  const sugerir = () => {
    const p = PLANES[plan.value];
    if (plan.value === 'cortesia' || metodo.value === 'cortesia') { monto.value = 0; } else if (p) monto.value = moneda() === 'USD' ? p.usd : p.dop;
    campoDias.hidden = plan.value !== 'cortesia';
    monto.previousElementSibling.textContent = `Importe recibido (${moneda()})`;
  };
  plan.addEventListener('change', sugerir); metodo.addEventListener('change', sugerir);
  const resultado = el('div', { 'aria-live': 'polite' });
  const crear = el('button', { type: 'submit', class: 'btn btn-primary' }, 'Generar código');
  const form = el('form', { class: 'ventas-form' },
    el('div', { class: 'field' }, el('label', { for: 'vPlan' }, 'Plan'), plan),
    el('div', { class: 'field' }, el('label', { for: 'vMetodo' }, 'Cómo pagó'), metodo),
    el('div', { class: 'field' }, el('label', { for: 'vMonto' }, 'Importe recibido'), monto),
    campoDias,
    el('div', { class: 'field ventas-nota' }, el('label', { for: 'vCorreo' }, 'Correo de la cuenta del alumno (recomendado: el código solo le servirá a esa cuenta)'), correo),
    el('div', { class: 'field ventas-nota' }, el('label', { for: 'vNota' }, 'Nota (para reconocer la venta)'), nota),
    el('div', { class: 'hero-cta' }, crear));
  form.addEventListener('submit', async e => {
    e.preventDefault();
    crear.disabled = true;
    const datos = { p_plan: plan.value, p_metodo: metodo.value, p_monto: Number(monto.value) || 0,
      p_moneda: moneda(), p_nota: nota.value, p_dias: plan.value === 'cortesia' ? Number(dias.value) : null };
    let r = await supabase().rpc('admin_crear_codigo', { ...datos, p_correo: correo.value.trim() || null });
    // Sin la migración del blindaje, la función aún no acepta el correo: se crea sin él.
    if (r.error && faltaMigracion(r.error) && !correo.value.trim()) r = await supabase().rpc('admin_crear_codigo', datos);
    crear.disabled = false;
    if (r.error) { resultado.replaceChildren(aviso('alert-warn', 'No se pudo crear el código: ' + (r.error.message || 'inténtalo de nuevo'))); return; }
    const conCorreo = correo.value.trim() ? ` con la cuenta de ${correo.value.trim().toLowerCase()}` : '';
    const mensaje = `¡Gracias por tu pago! Tu código de acceso a Loopback es ${r.data}. Actívalo${conCorreo} en ${CONFIG.url}/cuenta.html (sección «Tu plan») antes de 30 días. Cualquier duda, escríbeme por aquí.`;
    const copiar = (texto, boton) => navigator.clipboard?.writeText(texto).then(() => { boton.textContent = '✓ Copiado'; });
    const bCodigo = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, 'Copiar código');
    const bMensaje = el('button', { type: 'button', class: 'btn btn-primary btn-sm' }, 'Copiar mensaje para el alumno');
    bCodigo.addEventListener('click', () => copiar(r.data, bCodigo));
    bMensaje.addEventListener('click', () => copiar(mensaje, bMensaje));
    resultado.replaceChildren(el('div', { class: 'alert alert-ok codigo-nuevo' },
      el('p', {}, 'Código creado. ', el('strong', {}, 'Cópialo ahora: por seguridad no se puede volver a ver.')),
      el('p', { class: 'codigo-grande' }, el('code', {}, r.data)),
      el('p', { class: 'small' }, mensaje),
      el('div', { class: 'hero-cta' }, bMensaje, bCodigo)));
    nota.value = ''; correo.value = '';
    pintarLista(); // actualiza totales y lista sin borrar el código recién creado
  });
  const lista = el('div');
  async function pintarLista() {
    const { data: d } = await supabase().rpc('admin_ventas', { p_limite: 100 });
    if (!d) return;
    const tot = d.totales || {};
    lista.replaceChildren(
      el('div', { class: 'admin-tiles mt' },
        tile(pesos(Number(tot.DOP?.mes || 0)), 'ingresos este mes', `y ${dolares(Number(tot.USD?.mes || 0))} por PayPal`),
        tile((tot.DOP?.ventas || 0) + (tot.USD?.ventas || 0), 'ventas en total', `${pesos(Number(tot.DOP?.total || 0))} · ${dolares(Number(tot.USD?.total || 0))}`),
        tile(d.suscripciones_activas, 'planes activos'), tile(d.pendientes, 'códigos sin canjear')),
      d.codigos.length ? el('div', { class: 'table-wrap mt' }, el('table', { class: 'admin-tabla' },
        el('thead', {}, el('tr', {}, ['Fecha', 'Código', 'Plan', 'Pago', 'Importe', 'Nota', 'Estado', ''].map(t => el('th', { scope: 'col' }, t)))),
        el('tbody', {}, d.codigos.map(c => {
          const anular = !c.canjeado && !c.anulado && !(c.caduca && new Date(c.caduca) <= new Date()) ? el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Anular') : null;
          anular?.addEventListener('click', async () => {
            if (!confirm(`¿Anular el código ${c.pista}…? Ya no se podrá usar.`)) return;
            const r = await supabase().rpc('admin_anular_codigo', { p_id: c.id });
            if (r.error) alert(r.error.message); else pintarLista();
          });
          return el('tr', { class: c.anulado ? 'anulado' : null }, el('td', {}, fechaCorta(c.creado)), el('td', {}, el('code', {}, c.pista + '…')),
            el('td', {}, NOMBRE_PLAN[c.plan] || c.plan), el('td', {}, METODOS[c.metodo] || c.metodo), el('td', {}, importe(c.monto, c.moneda)),
            el('td', { class: 'ventas-nota-celda' }, c.nota || '—', c.para_correo ? el('div', { class: 'small muted' }, 'Para ' + c.para_correo) : null),
            el('td', {}, c.anulado ? el('span', { class: 'badge' }, 'Anulado') : c.canjeado ? el('span', { class: 'badge badge-ok' }, '✓ Canjeado ' + fechaCorta(c.canjeado))
              : c.caduca && new Date(c.caduca) <= new Date() ? el('span', { class: 'badge' }, 'Caducado') : el('span', { class: 'badge badge-accent' }, 'Pendiente')),
            el('td', {}, anular));
        }))))
        : el('p', { class: 'muted mt' }, 'Todavía no hay ventas. Cuando recibas un pago, genera aquí su código.'));
  }
  caja.replaceChildren(el('h2', {}, 'Ventas y códigos de acceso'),
    el('p', { class: 'small muted' }, 'Cuando recibas un pago, genera el código del plan y envíaselo al alumno por WhatsApp o por correo. Lo activa en «Tu cuenta».'),
    form, resultado, lista);
  sugerir();
  pintarLista();
}

if (!cuentasActivas()) raiz.replaceChildren(cabecera(), aviso('alert-info', 'Las cuentas no están activadas en esta instalación.'));
else if (!usuario) raiz.replaceChildren(cabecera(), el('div', { class: 'card' }, el('p', {}, 'Entra con tu cuenta de administración.'), el('a', { class: 'btn btn-primary', href: 'cuenta.html' }, 'Entrar')));
else cargar();
