// Planes y precios: rellena los botones de pago de cada plan con la configuración (config.json → pagos).
//  · República Dominicana: WhatsApp con el mensaje ya escrito (los datos de la cuenta se envían por el chat).
//  · Otros países: el enlace de pago de Hotmart de ese plan.
// Si un dato no está configurado, el botón aparece como «Disponible pronto».
import { iniciarPagina, el, $ } from '../core.js';
import { CONFIG } from '../config.js';
import { estadoAcceso } from '../premium.js';
import { PLANES, pesos, dolares, enlaceWhatsApp } from '../planes.js';

const usuario = await iniciarPagina();
const { whatsapp = '', hotmart = {} } = CONFIG.pagos || {};

for (const caja of document.querySelectorAll('.plan-pago')) {
  const plan = caja.dataset.plan;
  const p = PLANES[plan];
  const wa = enlaceWhatsApp(whatsapp, plan, usuario?.email || '');
  const principal = 'btn ' + (caja.dataset.destacado ? 'btn-primary' : 'btn-ghost');
  caja.replaceChildren(
    wa ? el('a', { class: principal, href: wa, target: '_blank', rel: 'noopener' }, `Transferencia · ${pesos(p.dop)}`)
      : el('span', { class: principal + ' desactivado', 'aria-disabled': 'true' }, 'Transferencia · disponible pronto'),
    hotmart[plan] ? el('a', { class: 'btn btn-quiet btn-sm', href: hotmart[plan], target: '_blank', rel: 'noopener' }, `Desde otro país · ${dolares(p.usd)}`)
      : el('span', { class: 'small muted' }, `Desde otro país (${dolares(p.usd)}): disponible pronto`));
}

// Mientras el interruptor esté abierto (todavía no se cobra), todo es gratis con una cuenta: se dice claramente.
const acceso = await estadoAcceso();
if (acceso.abierto) {
  $('#avisoPrecios').replaceChildren(el('div', { class: 'alert alert-info precios-fundador' },
    el('p', {}, el('strong', {}, '🎉 Ahora mismo, el plan completo es gratis con tu cuenta. '),
      'Estos son los precios que tendrá Loopback cuando empiece a cobrar. Quienes ya tengan cuenta se enterarán antes que nadie del precio de fundador.'),
    usuario ? null : el('a', { class: 'btn btn-primary btn-sm', href: 'cuenta.html?modo=registro' }, 'Crear mi cuenta gratis')));
}
