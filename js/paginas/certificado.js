// Certificado de finalización de un área: certificado.html?area=redes. Sin área, lista los certificados del alumno.
// Se dibuja como SVG (A4 apaisado) y se descarga como imagen PNG o se imprime / guarda como PDF.
import { iniciarPagina, el, $, local } from '../core.js';
import { cargarCurso } from '../curso.js';
import { cargar, notaQuiz } from '../progreso.js';
import { escaleraDe, estadoArea, pasoSiguiente } from '../escalera-alumno.js';
import { TITULO_AREA, FIRMA, CARGO_FIRMA, AVISO, datosCertificado, fechaLarga } from '../certificado.js';

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
    el('path', { d: 'M22.5 10.5A8.5 8.5 0 1 1 9.5 10.5', fill: 'none', stroke: '#fff', 'stroke-width': 2.6, 'stroke-linecap': 'round' }),
    el('path', { d: 'M12.6 6.9 12.1 12.9 6.9 8.6Z', fill: '#fff', stroke: '#fff', 'stroke-width': 1, 'stroke-linejoin': 'round' }),
    el('circle', { cx: 16, cy: 16, r: 3.4, fill: '#fff' }));
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
  const cambiar = usuario ? null : el('button', { type: 'button', class: 'btn btn-quiet' }, 'Cambiar el nombre');
  cambiar?.addEventListener('click', () => raiz.replaceChildren(pedirNombre(n => pintarArea(n))));
  raiz.replaceChildren(
    el('div', { class: 'page-head cert-head' }, el('span', { class: 'eyebrow' }, 'Tu certificado'), el('h1', {}, d.titulo),
      el('p', {}, 'Lo emite Loopback para reconocer tu esfuerzo. No es un título oficial ni está avalado por ninguna institución o empresa, y no influye en conseguir un empleo: lo que cuenta es lo que sabes hacer.')),
    el('div', { class: 'cert-marco' }, svg),
    el('div', { class: 'hero-cta cert-acciones' }, png, pdf, cambiar, el('a', { class: 'btn btn-quiet', href: 'certificado.html' }, 'Todos mis certificados')));
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

if (!area || !TITULO_AREA[area]) lista();
else if (estadoArea(curso, area).final !== 'aprobado') {
  const paso = pasoSiguiente(estadoArea(curso, area));
  raiz.replaceChildren(el('div', { class: 'locked-screen' }, el('div', { class: 'locked-ico', 'aria-hidden': 'true' }, '🎓'), el('h1', {}, TITULO_AREA[area]),
    el('p', {}, 'El certificado se obtiene al aprobar el examen final del área, después de completar todos los escalones.'),
    paso ? el('p', {}, el('strong', {}, 'Tu siguiente paso: '), paso.texto) : null,
    el('div', { class: 'hero-cta' }, paso ? el('a', { class: 'btn btn-primary', href: paso.href }, 'Ir a mi siguiente paso →') : null, el('a', { class: 'btn btn-ghost', href: 'curso.html?area=' + area }, 'Ver la escalera'))));
} else if (!nombreAlumno()) raiz.replaceChildren(pedirNombre(n => pintarArea(n)));
else pintarArea(nombreAlumno());
