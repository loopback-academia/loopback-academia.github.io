// Verificación pública de certificados: verificar.html?c=LB-XXXXXXXXXX. Llama a certificado_verificar (permitida a
// cualquiera, sin cuenta), que solo devuelve lo que ya figura en el certificado: nombre, área, nota y fecha.
import { iniciarPagina, el, $ } from '../core.js';
import { supabase, cuentasActivas } from '../auth.js';
import { TITULO_AREA, fechaLarga } from '../certificado.js';
import { normalizarCodigo } from '../finales.js';

await iniciarPagina();
const raiz = $('#verificar');
const entrada = el('input', { type: 'text', id: 'codigo', maxlength: 20, placeholder: 'LB-XXXXXXXXXX', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', 'aria-describedby': 'ayuda-codigo' });
const btn = el('button', { type: 'submit', class: 'btn btn-primary' }, 'Comprobar');
const resultado = el('div', { 'aria-live': 'polite' });
const form = el('form', { class: 'card' }, el('label', { for: 'codigo' }, 'Código del certificado'),
  el('div', { class: 'inline-form' }, entrada, btn),
  el('p', { class: 'small muted', id: 'ayuda-codigo' }, 'Está en la parte inferior derecha del certificado, junto a la fecha.'));

raiz.replaceChildren(el('div', { class: 'page-head' }, el('span', { class: 'eyebrow' }, 'Certificados'), el('h1', {}, 'Verificar un certificado'),
  el('p', {}, 'Comprueba si un certificado de Loopback es auténtico. Los certificados verificables se emiten solo cuando el alumno aprueba el examen final oficial, corregido por el servidor.')),
  form, resultado);

async function comprobar(texto) {
  const codigo = normalizarCodigo(texto);
  if (!codigo) { resultado.replaceChildren(el('p', { class: 'alert alert-warn' }, 'El código no tiene el formato correcto: LB- seguido de 10 letras y números.')); return; }
  if (!cuentasActivas()) { resultado.replaceChildren(el('p', { class: 'alert alert-warn' }, 'La verificación no está disponible en esta instalación de Loopback.')); return; }
  btn.disabled = true;
  resultado.replaceChildren(el('p', { class: 'muted' }, 'Comprobando…'));
  const { data, error } = await supabase().rpc('certificado_verificar', { p_codigo: codigo });
  btn.disabled = false;
  history.replaceState(null, '', '?c=' + codigo);
  if (error) { resultado.replaceChildren(el('p', { class: 'alert alert-warn' }, 'No se pudo comprobar ahora mismo. Inténtalo de nuevo en unos minutos.')); return; }
  const c = data?.[0];
  resultado.replaceChildren(c
    ? el('section', { class: 'card verif-ok' }, el('h2', {}, '✓ Certificado válido'),
        el('dl', { class: 'verif-datos' },
          el('dt', {}, 'Nombre'), el('dd', {}, c.nombre),
          el('dt', {}, 'Área'), el('dd', {}, TITULO_AREA[c.area] || c.area),
          el('dt', {}, 'Nota del examen final'), el('dd', {}, `${c.nota} %`),
          el('dt', {}, 'Fecha de emisión'), el('dd', {}, fechaLarga(c.emitido)),
          el('dt', {}, 'Código'), el('dd', {}, el('code', {}, codigo))),
        el('p', { class: 'small muted' }, 'Loopback es una plataforma de aprendizaje independiente: este certificado acredita que su titular completó el recorrido y aprobó el examen final oficial. No es un título oficial ni está avalado por ninguna institución o empresa.'))
    : el('section', { class: 'card verif-mal' }, el('h2', {}, '✗ No existe ningún certificado con ese código'),
        el('p', {}, 'Revisa que esté bien escrito. Si lo está, el certificado no fue emitido por Loopback o se eliminó junto con la cuenta de su titular.')));
}

form.addEventListener('submit', e => { e.preventDefault(); comprobar(entrada.value); });
const inicial = new URLSearchParams(location.search).get('c');
if (inicial) { entrada.value = inicial; comprobar(inicial); }
