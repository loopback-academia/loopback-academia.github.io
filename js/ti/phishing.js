// Detector de phishing: bandeja de correos de Comercial La Ceiba (empresa ficticia). Todos los dominios usan .example,
// reservado para ejemplos: ningún dominio real aparece como malicioso. Sin DOM: se prueba en Node.

export const SENALES = {
  remitente: 'El remitente no es de la empresa o imita su dominio',
  enlace: 'El enlace lleva a un sitio distinto del que aparenta',
  urgencia: 'Mete prisa, amenaza o exige secreto',
  datos: 'Pide contraseñas, códigos o datos de tarjeta',
  adjunto: 'Adjunto peligroso o inesperado (ejecutable, comprimido, macros)',
  generico: 'Saludo genérico o detalles que no cuadran',
  oferta: 'Premio u oferta demasiado buena',
  proceso: 'Pide saltarse el procedimiento habitual (pagos, tarjetas regalo)',
};

export const CORREOS = [
  { id: 'buzon', phishing: true, de: 'Soporte TI', correo: 'soporte@laceiba-soporte.example', asunto: 'Su buzón está lleno: acción requerida en 24 horas', fecha: 'Hoy, 7:42',
    cuerpo: ['Estimado usuario:', 'Su buzón de correo ha superado el límite de almacenamiento. Si no amplía su cuota en las próximas 24 horas, sus mensajes nuevos serán rechazados y su cuenta será desactivada.', 'Para ampliar su cuota gratuitamente, inicie sesión en el siguiente enlace con su usuario y contraseña de la empresa:'],
    enlaces: [{ texto: 'https://correo.laceiba.example/ampliar-cuota', url: 'https://laceiba-correo.example.login-seguro.example/cuota' }], firma: 'Departamento de TI',
    senales: ['remitente', 'enlace', 'urgencia', 'datos', 'generico'], explicacion: 'El dominio real de la empresa es laceiba.example; este es laceiba-soporte.example. El texto del enlace dice una dirección y el enlace lleva a otra. Y TI nunca pide tu contraseña por correo.' },
  { id: 'director', phishing: true, de: 'Ramón Herrera (Director General)', correo: 'rherrera.director@correo-personal.example', asunto: '¿Estás disponible? Favor urgente y confidencial', fecha: 'Hoy, 9:15',
    cuerpo: ['Hola, estoy en una reunión y no puedo hablar por teléfono.', 'Necesito que compres 10 tarjetas regalo de RD$5.000 para unos clientes. Es urgente y confidencial, no lo comentes con nadie todavía. Rasca el código de cada una y envíame una foto por este correo.', 'Te lo reembolso hoy mismo. Gracias.'],
    enlaces: [], firma: 'Ramón Herrera — Enviado desde mi móvil',
    senales: ['remitente', 'urgencia', 'proceso'], explicacion: 'Es el «fraude del director»: usa un correo personal, pide secreto y prisa, y un pago fuera del procedimiento (tarjetas regalo). Siempre se confirma por otro canal (llamando al número de la agenda interna).' },
  { id: 'factura-zip', phishing: true, de: 'Facturación Distribuidora Norte', correo: 'facturas@distribuidoranorte-facturas.example', asunto: 'Factura pendiente de pago - evite recargos', fecha: 'Ayer, 18:03',
    cuerpo: ['Estimado cliente:', 'Adjuntamos la factura pendiente correspondiente al mes de noviembre. Le rogamos que la revise hoy para evitar recargos por mora del 15 %.', 'Para ver la factura, descomprima el archivo y ábralo.'],
    enlaces: [], adjuntos: ['Factura_Noviembre.zip'], firma: 'Departamento de cobros',
    senales: ['remitente', 'adjunto', 'generico', 'urgencia'], explicacion: 'El proveedor real escribe desde distribuidoranorte.example. Un .zip con una «factura» suele esconder un ejecutable. Saludo genérico y amenaza de recargo para que lo abras sin pensar.' },
  { id: 'paquete', phishing: true, de: 'Mensajería Express', correo: 'avisos@mensajeria-envios.example', asunto: 'No pudimos entregar su paquete', fecha: 'Ayer, 11:27',
    cuerpo: ['Hola cliente,', 'Su paquete está retenido en aduanas. Para liberarlo debe pagar una tasa de RD$95 antes de 48 horas o será devuelto al remitente.', 'Pague con su tarjeta de forma segura aquí:'],
    enlaces: [{ texto: 'Pagar tasa de aduanas', url: 'http://pago-aduanas-envios.example/tarjeta' }], firma: 'Mensajería Express',
    senales: ['enlace', 'datos', 'generico', 'urgencia'], explicacion: 'No esperabas ningún paquete, el saludo es genérico y el enlace lleva a una web cualquiera que pide los datos de la tarjeta. Una tasa pequeña es el anzuelo para robar la tarjeta.' },
  { id: 'banco', phishing: true, de: 'Banco Arrecife (ficticio)', correo: 'seguridad@bancoarrecife-alertas.example', asunto: 'Hemos bloqueado su cuenta por actividad sospechosa', fecha: 'Lunes, 6:58',
    cuerpo: ['Detectamos un intento de acceso no autorizado y bloqueamos temporalmente su cuenta.', 'Para desbloquearla, confirme su identidad introduciendo el número de su tarjeta, la fecha de vencimiento y su PIN en el siguiente formulario. Si no lo hace hoy, la cuenta se cerrará definitivamente.'],
    enlaces: [{ texto: 'Desbloquear mi cuenta', url: 'https://bancoarrecife-verificacion.example/desbloqueo' }], firma: 'Equipo de seguridad',
    senales: ['remitente', 'enlace', 'urgencia', 'datos'], explicacion: 'Ningún banco pide el PIN por correo ni por teléfono. Amenaza con cerrar la cuenta para que actúes rápido. Si dudas, entra tú escribiendo la dirección del banco o llama al número de tu tarjeta.' },
  { id: 'bono', phishing: true, de: 'Recursos Humanos', correo: 'rrhh@laceiba-beneficios.example', asunto: '¡Ganaste un bono de Navidad de RD$25.000!', fecha: 'Lunes, 10:12',
    cuerpo: ['¡Felicidades! Fuiste seleccionado en el sorteo anual de bonos de Navidad.', 'Para recibir el depósito, entra con tu usuario y contraseña de la empresa en el portal de beneficios antes del viernes.'],
    enlaces: [{ texto: 'Portal de beneficios', url: 'https://laceiba-beneficios.example/login' }], firma: 'RR. HH.',
    senales: ['remitente', 'oferta', 'datos', 'enlace'], explicacion: 'Un premio por un sorteo en el que no participaste es el gancho. El dominio imita al de la empresa (laceiba-beneficios.example) y pide tus credenciales.' },
  { id: 'documento', phishing: true, de: 'Ana Batista vía Documentos', correo: 'noreply@docs-compartidos.example', asunto: 'Ana Batista compartió «Nómina_2026.xlsx» contigo', fecha: 'Martes, 15:40',
    cuerpo: ['Ana Batista compartió un archivo contigo.', 'Para verlo, inicia sesión con tu cuenta de correo de la empresa.'],
    enlaces: [{ texto: 'Abrir Nómina_2026.xlsx', url: 'https://docs-compartidos.example/microsoft365/inicio-sesion' }], firma: 'Servicio de documentos compartidos',
    senales: ['remitente', 'enlace', 'datos'], explicacion: 'Usa el nombre de una compañera real y un archivo tentador (la nómina). Pero la empresa comparte archivos desde su propio sistema, no desde docs-compartidos.example, y la página pide tu contraseña.' },
  { id: 'parche', phishing: true, de: 'Departamento de TI', correo: 'it@1aceiba.example', asunto: 'Actualización obligatoria de seguridad', fecha: 'Martes, 8:01',
    cuerpo: ['Por un fallo crítico de seguridad, todos los empleados deben instalar hoy el parche adjunto.', 'Ejecute el archivo y acepte los permisos de administrador. Los equipos sin actualizar serán desconectados de la red a las 17:00.'],
    enlaces: [], adjuntos: ['Parche_seguridad.exe'], firma: 'TI',
    senales: ['remitente', 'adjunto', 'urgencia'], explicacion: 'Fíjate bien: 1aceiba con un «1» en lugar de la «l». TI instala las actualizaciones de forma centralizada; nunca te envía un .exe por correo para que lo ejecutes tú.' },

  { id: 'mantenimiento', phishing: false, de: 'Mesa de ayuda TI', correo: 'mesadeayuda@laceiba.example', asunto: 'Mantenimiento programado del correo: sábado de 22:00 a 23:00', fecha: 'Hoy, 8:30',
    cuerpo: ['Hola a todos:', 'Este sábado, de 22:00 a 23:00, actualizaremos el servidor de correo. Durante ese tiempo no podrás enviar ni recibir mensajes. No tienes que hacer nada.', 'Recuerda: TI nunca te pedirá tu contraseña por correo ni por teléfono. Si recibes un mensaje así, repórtalo.'],
    enlaces: [], firma: 'Mesa de ayuda · Extensión 2200',
    senales: [], explicacion: 'Viene del dominio real (laceiba.example), informa sin pedir nada, no tiene enlaces ni adjuntos y da un contacto interno verificable.' },
  { id: 'conciliacion', phishing: false, de: 'Rosa Valdez', correo: 'rvaldez@laceiba.example', asunto: 'RE: Conciliación de octubre', fecha: 'Hoy, 10:05',
    cuerpo: ['Hola,', 'Como hablamos en la reunión de ayer, te adjunto la conciliación de octubre con las correcciones de las facturas 0457 y 0461.', 'Cualquier duda, me dices. ¡Gracias!'],
    enlaces: [], adjuntos: ['Conciliacion_octubre.xlsx'], firma: 'Rosa Valdez · Contabilidad · Ext. 2315',
    senales: [], explicacion: 'Es una respuesta (RE:) a una conversación real, de una compañera con el dominio correcto y un adjunto que esperabas. Aun así, si el Excel te pidiera «habilitar macros», desconfía y pregúntale.' },
  { id: 'evaluaciones', phishing: false, de: 'Recursos Humanos', correo: 'rrhh@laceiba.example', asunto: 'Recordatorio: evaluaciones de desempeño antes del 30 de noviembre', fecha: 'Ayer, 9:00',
    cuerpo: ['Hola,', 'Te recordamos que el plazo para completar la evaluación de desempeño termina el 30 de noviembre. Puedes hacerla desde la intranet, con tu sesión habitual.'],
    enlaces: [{ texto: 'https://intranet.laceiba.example/evaluaciones', url: 'https://intranet.laceiba.example/evaluaciones' }], firma: 'Recursos Humanos · Ext. 2100',
    senales: [], explicacion: 'Dominio correcto, el enlace va exactamente a donde dice (la intranet de la empresa), plazo razonable y nada de premios ni amenazas.' },
  { id: 'ticket', phishing: false, de: 'Notificaciones de tickets', correo: 'tickets@laceiba.example', asunto: 'Ticket #4821 resuelto: impresora de contabilidad', fecha: 'Ayer, 16:44',
    cuerpo: ['Tu ticket #4821 («La impresora de contabilidad no imprime») se ha marcado como resuelto.', 'Solución: se vació la cola de impresión y se reinició el servicio. Si el problema vuelve, responde a este correo para reabrirlo.'],
    enlaces: [{ texto: 'Ver el ticket #4821', url: 'https://soporte.laceiba.example/tickets/4821' }], firma: 'Sistema de tickets de TI',
    senales: [], explicacion: 'Corresponde a un ticket que abriste tú, del dominio de la empresa, y el enlace lleva al sistema de tickets interno.' },
  { id: 'cotizacion', phishing: false, de: 'Luis Peralta · Distribuidora Norte', correo: 'lperalta@distribuidoranorte.example', asunto: 'Cotización solicitada: 2 switches de 24 puertos', fecha: 'Lunes, 12:20',
    cuerpo: ['Buenas tardes, Jorge:', 'Según lo que nos pediste por teléfono el viernes, te envío la cotización n.º 2291 de dos switches de 24 puertos con PoE. Los precios son válidos durante 30 días.', 'Si quieres seguir adelante, el pedido se tramita por el portal de compras de La Ceiba como siempre.'],
    enlaces: [], adjuntos: ['Cotizacion_2291.pdf'], firma: 'Luis Peralta · Ventas · (809) 555-0142',
    senales: [], explicacion: 'Es el dominio habitual del proveedor, saluda por tu nombre, menciona una petición real, adjunta un PDF esperado y remite al procedimiento normal de compras.' },
  { id: 'wifi', phishing: false, de: 'Jorge Martínez', correo: 'jmartinez@laceiba.example', asunto: 'Nueva contraseña del wifi de invitados', fecha: 'Martes, 9:30',
    cuerpo: ['Hola equipo:', 'Hoy cambiamos la contraseña del wifi de invitados, como cada mes. La nueva está en la tarjeta impresa de recepción. No la compartáis por correo ni por WhatsApp.', 'La red de empleados no cambia.'],
    enlaces: [], firma: 'Jorge Martínez · Redes · Ext. 2240',
    senales: [], explicacion: 'Informa de un procedimiento conocido, desde el dominio correcto, y no pide ni envía datos sensibles por correo.' },
];

export const APROBADO = 0.8;

// Evalúa la respuesta a un correo: clasificación y, si es phishing, señales detectadas.
export function evaluarCorreo(correo, { esPhishing, senales = [] }) {
  const clasificacion = esPhishing === correo.phishing;
  const acertadas = senales.filter(x => correo.senales.includes(x));
  const falsas = senales.filter(x => !correo.senales.includes(x));
  // Un phishing cuenta como bien detectado si se clasifica bien y se señala al menos una pista real.
  const ok = clasificacion && (!correo.phishing || acertadas.length > 0);
  return { ok, clasificacion, acertadas, falsas, faltan: correo.senales.filter(x => !senales.includes(x)) };
}

export function resumen(respuestas) {
  const vals = Object.values(respuestas);
  const bien = vals.filter(r => r.ok).length;
  return { respondidos: vals.length, bien, total: CORREOS.length, aprobado: vals.length === CORREOS.length && bien / CORREOS.length >= APROBADO };
}
