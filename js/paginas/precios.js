// Planes y precios: rellena los botones de pago de cada plan con la configuración (config.json → pagos).
//  · República Dominicana: WhatsApp con el mensaje ya escrito (los datos de la cuenta se envían por el chat).
//  · Otros países: PayPal.me con el importe en dólares del plan.
// Si un dato no está configurado, el botón aparece como «Disponible pronto».
import { iniciarPagina, el } from '../core.js';
import { CONFIG } from '../config.js';
import { PLANES, pesos, dolares, enlaceWhatsApp, enlacePayPal } from '../planes.js';

const usuario = await iniciarPagina();
const { whatsapp = '', paypal = '' } = CONFIG.pagos || {};

for (const caja of document.querySelectorAll('.plan-pago')) {
  const plan = caja.dataset.plan;
  const p = PLANES[plan];
  const wa = enlaceWhatsApp(whatsapp, plan, usuario?.email || '');
  const pp = enlacePayPal(paypal, plan);
  const principal = 'btn ' + (caja.dataset.destacado ? 'btn-primary' : 'btn-ghost');
  caja.replaceChildren(
    wa ? el('a', { class: principal, href: wa, target: '_blank', rel: 'noopener' }, `Transferencia · ${pesos(p.dop)}`)
      : el('span', { class: principal + ' desactivado', 'aria-disabled': 'true' }, 'Transferencia · disponible pronto'),
    pp ? el('a', { class: 'btn btn-quiet btn-sm', href: pp, target: '_blank', rel: 'noopener' }, `PayPal (otros países) · ${dolares(p.usd)}`)
      : el('span', { class: 'small muted' }, `PayPal (${dolares(p.usd)}): disponible pronto`));
}
