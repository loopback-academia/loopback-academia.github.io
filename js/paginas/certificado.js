// Certificado de finalización de un área: certificado.html?area=redes. Sin área, lista los certificados del alumno.
// Se dibuja como SVG (A4 apaisado) y se descarga como imagen PNG o se imprime / guarda como PDF.
import { iniciarPagina, el, $, local } from '../core.js';
import { cargarCurso } from '../curso.js';
import { cargar, notaQuiz } from '../progreso.js';
import { escaleraDe, estadoArea, pasoSiguiente } from '../escalera-alumno.js';
import { TITULO_AREA, FIRMA, CARGO_FIRMA, AVISO, datosCertificado, datosVerificado, fechaLarga } from '../certificado.js';
import { supabase, cuentasActivas, mensajeError } from '../auth.js';
import { faltaMigracion } from '../profesor.js';
import { CONFIG } from '../config.js';

const usuario = await iniciarPagina();
const [curso] = await Promise.all([cargarCurso(), cargar()]);
const raiz = $('#certificado');
const area = new URLSearchParams(location.search).get('area');
const W = 1123, H = 794;

// Texto partido en líneas (SVG no ajusta solo).
function lineas(texto, max) {
  const out = []; let l = '';
  for (const p of texto.split(' ')) { if ((l + ' ' + p).trim().length > max && l) { out.push(l); l = p; } else l = (l + ' ' + p).trim(); }
  return [...out, l];
}
const t = (x, y, txt, attrs = {}) => el('text', { x, y, 'text-anchor': 'middle', ...attrs }, txt);

function dibujar(d) {
  const LOGO = el('g', { transform: `translate(${W / 2 - 22} 62) scale(1.4)` },
    el('rect', { width: 32, height: 32, rx: 8, fill: '#0b7285' }),
    el('g', { transform: 'translate(16 16) scale(1.14) translate(-16.4 -17.7)', fill: '#fff', stroke: '#fff', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
      el('path', { d: 'M17.5 21.5H12A5.5 5.5 0 0 1 12 10.5H20A5.5 5.5 0 0 1 24.8 18.7', fill: 'none', 'stroke-width': 3 }),
      el('path', { d: 'M17 17.2 23.4 21.5 17 25.8Z', 'stroke-width': 1.2 })));
  const aviso = lineas(AVISO, 150);
  return el('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'cert-svg', role: 'img', 'aria-label': `Certificado de ${d.titulo} para ${d.nombre}` },
    el('rect', { width: W, height: H, fill: '#fbfcfe' }),
    el('rect', { x: 22, y: 22, width: W - 44, height: H - 44, fill: 'none', stroke: '#0b7285', 'stroke-width': 3 }),
    el('rect', { x: 34, y: 34, width: W - 68, height: H - 68, fill: 'none', stroke: '#38bdd3', 'stroke-width': 1 }),
    LOGO,
    t(W / 2, 140, 'LOOPBACK', { 'font-family': 'Inter, system-ui, sans-serif', 'font-size': 22, 'font-weight': 800, 'letter-spacing': 6, fill: '#0b7285' }),
    t(W / 2, 205, 'Certificado de finalización', { 'font-family': 'Georgia, "Times New Roman", serif', 'font-size': 44, fill: '#0d1626' }),
    t(W / 2, 262, 'Se otorga a', { 'font-family': 'Inter, system-ui, sans-serif', 'font-size': 18, fill: '#5b6678' }),
    t(W / 2, 330, d.nombre, { 'font-family': 'Georgia, "Times New Roman", serif', 'font-size': 52, 'font-style': 'italic', fill: '#0d1626' }),
    el('line', { x1: W / 2 - 300, y1: 352, x2: W / 2 + 300, y2: 352, stroke: '#c9d3e0', 'stroke-width': 1 }),
    t(W / 2, 398, 'por completar la escalera de aprendizaje de', { 'font-family': 'Inter, system-ui, sans-serif', 'font-size': 18, fill: '#33405a' }),
    t(W / 2, 436, d.titulo, { 'font-family': 'Inter, system-ui, sans-serif', 'font-size': 28, 'font-weight': 800, fill: '#0b7285' }),
    t(W / 2, 474, d.detalle, { 'font-family': 'Inter, system-ui, sans-serif', 'font-size': 16, fill: '#5b6678' }),
    // Firma
    t(300, 590, FIRMA, { 'font-family': '"Brush Script MT", "Segoe Script", "Snell Roundhand", "URW Chancery L", cursive', 'font-style': 'italic', 'font-size': 46, fill: '#14213d' }),
    el('line', { x1: 170, y1: 606, x2: 430, y2: 606, stroke: '#14213d', 'stroke-width': 1.2 }),
    t(300, 628, `${FIRMA} · ${CARGO_FIRMA}`, { 'font-family': 'Inter, system-ui, sans-serif', 'font-size': 14, fill: '#33405a' }),
    // Fecha y código
    t(W - 300, 590, fechaLarga(d.fecha), { 'font-family': 'Georgia, serif', 'font-size': 22, fill: '#14213d' }),
    el('line', { x1: W - 430, y1: 606, x2: W - 170, y2: 606, stroke: '#14213d', 'stroke-width': 1.2 }),
    t(W - 300, 628, `Fecha · Código ${d.codigo}`, { 'font-family': 'Inter, system-ui, sans-serif', 'font-size': 14, fill: '#33405a' }),
    d.verificar ? t(W - 300, 650, 'Compruébalo en ' + d.verificar.replace(/^https?:\/\//, '').replace(/\?.*$/, ''), { 'font-family': 'Inter, system-ui, sans-serif', 'font-size': 12.5, fill: '#5b6678' }) : null,
    // Aviso
    ...aviso.map((l, i) => t(W / 2, 688 + i * 17, l, { 'font-family': 'Inter, system-ui, sans-serif', 'font-size': 12.5, fill: '#6b7689' })));
}

function nombreAlumno() { return usuario?.nombre || local.get('aula:certificado:nombre', ''); }

function pedirNombre(alGuardar) {
  const entrada = el('input', { type: 'text', maxlength: 60, placeholder: 'Nombre y apellidos', 'aria-label': 'Tu nombre', value: nombreAlumno() });
  const btn = el('button', { type: 'submit', class: 'btn btn-primary' }, 'Generar mi certificado');
  const form = el('form', { class: 'card cert-nombre' }, el('h2', {}, '¿Qué nombre aparece en el certificado?'),
    el('p', { class: 'small muted' }, usuario ? 'Usamos el nombre de tu cuenta; puedes cambiarlo en «Tu cuenta».' : 'Escríbelo tal como quieres que aparezca. Si creas una cuenta, se usará el nombre de tu cuenta.'),
    el('div', { class: 'inline-form' }, entrada, btn));
  form.addEventListener('submit', e => { e.preventDefault(); const n = entrada.value.trim().replace(/\s+/g, ' '); if (n.length < 3) { entrada.focus(); return; } local.set('aula:certificado:nombre', n); alGuardar(n); });
  return form;
}

function descargarPNG(svg, nombreArchivo) {
  const datos = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = W * 2; c.height = H * 2;
    const ctx = c.getContext('2d');
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0, W, H);
    const a = el('a', { href: c.toDataURL('image/png'), download: nombreArchivo });
    document.body.append(a); a.click(); a.remove();
  };
  img.src = datos;
}

function certificado(d) {
  const svg = dibujar(d);
  const png = el('button', { type: 'button', class: 'btn btn-primary' }, '⬇ Descargar imagen (PNG)');
  png.addEventListener('click', () => descargarPNG(svg, `certificado-loopback-${d.area}.png`));
  const pdf = el('button', { type: 'button', class: 'btn btn-ghost' }, '🖨 Imprimir o guardar como PDF');
  pdf.addEventListener('click', () => print());
  const cambiar = usuario || d.verificar ? null : el('button', { type: 'button', class: 'btn btn-quiet' }, 'Cambiar el nombre');
  cambiar?.addEventListener('click', () => raiz.replaceChildren(pedirNombre(n => pintarArea(n))));
  const comprobar = d.verificar ? el('a', { class: 'btn btn-quiet', href: d.verificar, target: '_blank', rel: 'noopener' }, '✓ Comprobar su validez') : null;
  raiz.replaceChildren(
    el('div', { class: 'page-head cert-head' }, el('span', { class: 'eyebrow' }, 'Tu certificado'), el('h1', {}, d.titulo),
      el('p', {}, 'Lo emite Loopback para reconocer tu esfuerzo. No es un título oficial ni está avalado por ninguna institución o empresa, y no influye en conseguir un empleo: lo que cuenta es lo que sabes hacer.')),
    el('div', { class: 'cert-marco' }, svg),
    d.verificar ? el('p', { class: 'small muted cert-verificable' }, `Certificado verificable · código ${d.codigo}. Cualquiera puede comprobarlo en la página de verificación de Loopback.`) : null,
    el('div', { class: 'hero-cta cert-acciones' }, png, pdf, comprobar, cambiar, el('a', { class: 'btn btn-quiet', href: 'certificado.html' }, 'Todos mis certificados')));
}

function pintarArea(nombre) {
  const d = datosCertificado({ area, nombre, escalera: escaleraDe(curso, area), final: notaQuiz('final-' + area) });
  certificado(d);
}

function lista() {
  raiz.replaceChildren(el('div', { class: 'page-head' }, el('h1', {}, 'Tus certificados'), el('p', {}, 'Obtienes el certificado de un área al aprobar su examen final, después de subir toda la escalera.')),
    el('div', { class: 'grid-2' }, Object.entries(TITULO_AREA).map(([a, titulo]) => {
      const ok = estadoArea(curso, a).final === 'aprobado';
      const paso = pasoSiguiente(estadoArea(curso, a));
      return el('article', { class: 'card cert-item' + (ok ? ' ok' : '') }, el('h3', {}, (ok ? '🎓 ' : '🔒 ') + titulo),
        el('p', { class: 'small muted' }, ok ? 'Escalera completada.' : paso ? `Te falta completar la escalera. Siguiente paso: ${paso.texto}.` : ''),
        ok ? el('a', { class: 'btn btn-primary btn-sm', href: 'certificado.html?area=' + a }, 'Ver mi certificado') : el('a', { class: 'btn btn-ghost btn-sm', href: 'curso.html?area=' + a }, 'Ir a la escalera'));
    })));
}

// ------------------------------------------------------------------ certificados verificables (con cuenta)
const sb = cuentasActivas() ? supabase() : null;
const bloqueadoArea = a => {
  const paso = pasoSiguiente(estadoArea(curso, a));
  return el('div', { class: 'locked-screen' }, el('div', { class: 'locked-ico', 'aria-hidden': 'true' }, '🎓'), el('h1', {}, TITULO_AREA[a]),
    el('p', {}, 'El certificado se obtiene al aprobar el examen final oficial del área, después de completar todos los escalones.'),
    paso ? el('p', {}, el('strong', {}, 'Tu siguiente paso: '), paso.texto) : null,
    el('div', { class: 'hero-cta' }, paso ? el('a', { class: 'btn btn-primary', href: paso.href }, 'Ir a mi siguiente paso →') : null, el('a', { class: 'btn btn-ghost', href: 'curso.html?area=' + a }, 'Ver la escalera')));
};

function pedirNombreOficial(alEmitir) {
  const entrada = el('input', { type: 'text', maxlength: 80, placeholder: 'Nombre y apellidos', 'aria-label': 'Tu nombre completo', value: usuario?.nombre || '' });
  const btn = el('button', { type: 'submit', class: 'btn btn-primary' }, 'Emitir mi certificado');
  const msg = el('p', { class: 'alert alert-warn', role: 'alert', hidden: true });
  const form = el('form', { class: 'card cert-nombre' }, el('h2', {}, '¿Qué nombre aparece en el certificado?'),
    el('p', {}, 'Escribe tu nombre completo tal como quieres que aparezca. ', el('strong', {}, 'No se podrá cambiar después'), ': es el nombre que verá quien compruebe tu certificado.'),
    el('div', { class: 'inline-form' }, entrada, btn), msg);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const n = entrada.value.trim().replace(/\s+/g, ' ');
    if (n.length < 3) { entrada.focus(); return; }
    btn.disabled = true;
    const r = await sb.rpc('certificado_emitir', { p_area: area, p_nombre: n });
    btn.disabled = false;
    if (r.error) { msg.hidden = false; msg.textContent = mensajeError(r.error).replace(/^No se pudo completar la operación: /, ''); return; }
    alEmitir(r.data);
  });
  return form;
}

async function areaVerificada() {
  const { data: cert, error } = await sb.from('certificados').select('codigo, area, nombre, nota, emitido').eq('area', area).maybeSingle();
  if (error && faltaMigracion(error)) { areaLocal(); return; }
  const mostrar = c => certificado(datosVerificado({ cert: c, escalera: escaleraDe(curso, area), url: CONFIG.url }));
  if (cert) { mostrar(cert); return; }
  const { data: aprobados } = await sb.from('intentos_final').select('id').eq('area', area).eq('aprobado', true).limit(1);
  if (aprobados?.length) { raiz.replaceChildren(pedirNombreOficial(mostrar)); return; }
  const estado = estadoArea(curso, area).final;
  if (estado === 'bloqueado') { raiz.replaceChildren(bloqueadoArea(area)); return; }
  raiz.replaceChildren(el('div', { class: 'locked-screen' }, el('div', { class: 'locked-ico', 'aria-hidden': 'true' }, '🎓'), el('h1', {}, TITULO_AREA[area]),
    el('p', {}, estado === 'aprobado'
      ? 'Ya completaste la escalera. Los certificados ahora son verificables: para obtener el tuyo, aprueba el examen final oficial, que corrige el servidor.'
      : 'Te queda el examen final oficial del área. Al aprobarlo podrás emitir tu certificado verificable.'),
    el('div', { class: 'hero-cta' }, el('a', { class: 'btn btn-primary', href: 'examen.html?final=' + area }, 'Ir al examen final oficial →'))));
}

async function listaVerificada() {
  const { data, error } = await sb.from('certificados').select('area, codigo');
  if (error && faltaMigracion(error)) { lista(); return; }
  const emitidos = new Map((data || []).map(c => [c.area, c.codigo]));
  raiz.replaceChildren(el('div', { class: 'page-head' }, el('h1', {}, 'Tus certificados'), el('p', {}, 'Obtienes el certificado verificable de un área al aprobar su examen final oficial, después de subir toda la escalera.')),
    el('div', { class: 'grid-2' }, Object.entries(TITULO_AREA).map(([a, titulo]) => {
      const codigo = emitidos.get(a);
      const est = estadoArea(curso, a).final;
      return el('article', { class: 'card cert-item' + (codigo ? ' ok' : '') }, el('h3', {}, (codigo ? '🎓 ' : est === 'bloqueado' ? '🔒 ' : '📝 ') + titulo),
        el('p', { class: 'small muted' }, codigo ? `Certificado verificable · ${codigo}` : est === 'bloqueado' ? 'Te falta completar la escalera.' : 'Te queda el examen final oficial.'),
        codigo ? el('a', { class: 'btn btn-primary btn-sm', href: 'certificado.html?area=' + a }, 'Ver mi certificado')
          : est === 'bloqueado' ? el('a', { class: 'btn btn-ghost btn-sm', href: 'curso.html?area=' + a }, 'Ir a la escalera')
            : el('a', { class: 'btn btn-primary btn-sm', href: 'examen.html?final=' + a }, 'Hacer el examen oficial'));
    })));
}

// Sin cuentas (instalación propia sin Supabase): certificado generado en el navegador, como antes.
function areaLocal() {
  if (estadoArea(curso, area).final !== 'aprobado') raiz.replaceChildren(bloqueadoArea(area));
  else if (!nombreAlumno()) raiz.replaceChildren(pedirNombre(n => pintarArea(n)));
  else pintarArea(nombreAlumno());
}

if (sb && !usuario) {
  raiz.replaceChildren(el('div', { class: 'page-head' }, el('h1', {}, area && TITULO_AREA[area] ? TITULO_AREA[area] : 'Tus certificados'),
    el('p', {}, 'Los certificados de Loopback son verificables: se emiten con tu cuenta después de aprobar el examen final oficial del área.')),
    el('div', { class: 'card' }, el('a', { class: 'btn btn-primary', href: 'cuenta.html' }, 'Entrar o crear cuenta')));
} else if (!area || !TITULO_AREA[area]) {
  if (sb) listaVerificada(); else lista();
} else if (sb) areaVerificada();
else areaLocal();
