// Planes de pago (sin DOM: se prueba en Node). Los precios se cambian aquí y en src/paginas/precios.html.
export const PLANES = {
  mensual:    { nombre: '1 mes',            corto: '1 mes',    dop: 499,  usd: 9 },
  trimestral: { nombre: '3 meses',          corto: '3 meses',  dop: 1199, usd: 19 },
  anual:      { nombre: '1 año',            corto: '1 año',    dop: 3499, usd: 59 },
  fundador:   { nombre: '1 año de fundador', corto: 'fundador', dop: 2499, usd: 45 },
};
export const NOMBRE_PLAN = {
  mensual: 'Plan de 1 mes', trimestral: 'Plan de 3 meses', anual: 'Plan de 1 año', fundador: 'Plan de fundador (1 año)',
  institucion: 'Plan de tu institución', cortesia: 'Plan de cortesía',
};

export const pesos = n => 'RD$ ' + n.toLocaleString('en-US');
export const dolares = n => 'US$ ' + n;

// Mensaje de WhatsApp ya escrito para pedir los datos de la transferencia.
export function mensajeWhatsApp(plan, correo = '') {
  const p = PLANES[plan];
  if (!p) throw new Error('Plan desconocido: ' + plan);
  return `Hola, quiero el plan de ${p.nombre} de Loopback (${pesos(p.dop)}). ` +
    (correo ? `El correo de mi cuenta es ${correo}. ` : 'El correo de mi cuenta de Loopback es: ') + '¿Me pasas los datos para la transferencia?';
}
export function enlaceWhatsApp(numero, plan, correo = '') {
  if (!/^[1-9][0-9]{7,14}$/.test(String(numero || ''))) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensajeWhatsApp(plan, correo))}`;
}
