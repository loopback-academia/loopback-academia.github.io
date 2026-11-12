// Simulador de atención al usuario: conversaciones con usuarios difíciles. En cada paso el alumno elige qué responder;
// cada respuesta puntúa empatía, claridad, solución y cierre, y cambia el ánimo del usuario. Sin DOM: se prueba en Node.

export const DIMENSIONES = { empatia: 'Empatía', claridad: 'Claridad', solucion: 'Solución', cierre: 'Cierre y seguimiento' };
const O = (t, p, f, animo = 0) => ({ t, p, f, animo });

export const CONVERSACIONES = {
  enfadado: {
    titulo: 'El gerente sin correo antes de una reunión', usuario: 'Ramón Herrera, gerente general', canal: 'Llamada', animoInicial: -2, nivel: 'principiante',
    pasos: [
      { msg: '¡Esto es increíble! Llevo media hora sin correo y en 20 minutos tengo una reunión con un cliente. ¡Siempre fallan los sistemas!',
        opciones: [
          O('Entiendo la urgencia, señor Herrera: tiene una reunión en 20 minutos y necesita el correo. Vamos a resolverlo ya. ¿Qué mensaje le aparece exactamente?', { empatia: 2, claridad: 2, solucion: 1 }, 'Reconoces su situación sin discutir y pasas a la acción con una pregunta concreta.', 1),
          O('Los sistemas no fallan siempre. Seguramente es algo de su computadora.', { empatia: 0, claridad: 1, solucion: 0 }, 'Discutir o culpar al usuario aumenta el enfado y no ayuda a resolver.', -1),
          O('Tiene que abrir un ticket en el portal y lo atenderemos por orden de llegada.', { empatia: 0, claridad: 1, solucion: 0 }, 'El procedimiento existe, pero aquí hay urgencia e impacto: puedes registrar tú el ticket mientras ayudas.', -1),
        ] },
      { msg: 'Dice «No se puede conectar al servidor». ¡Y el cliente me va a mandar el contrato por correo!',
        opciones: [
          O('Mientras lo reviso, abra el correo web desde el navegador en correo.laceiba.example: así puede recibir el contrato ahora mismo. Yo me encargo de Outlook.', { empatia: 1, claridad: 2, solucion: 2 }, 'Das una solución temporal que cubre su necesidad real (recibir el contrato) mientras investigas.', 1),
          O('Hay que reinstalar Outlook; tardaré una hora más o menos.', { empatia: 0, claridad: 1, solucion: 0 }, 'Saltas a una solución drástica sin diagnosticar y que no llega a tiempo para su reunión.', -1),
          O('Es un error de MAPI sobre HTTP con el autodiscover; tengo que revisar el perfil.', { empatia: 0, claridad: 0, solucion: 1 }, 'Puede ser cierto, pero la jerga técnica no le dice nada y aumenta su ansiedad.', 0),
        ] },
      { msg: 'Vale, en la web sí veo el correo. Pero quiero que Outlook funcione.',
        opciones: [
          O('Perfecto. Con su permiso me conecto en remoto a su equipo durante la reunión, sin tocar nada abierto, y le aviso cuando Outlook esté listo.', { empatia: 2, claridad: 2, solucion: 2 }, 'Pides permiso, ajustas el trabajo a su agenda y dices qué harás y cuándo avisarás.', 1),
          O('Ahora no puedo, tengo otros tickets.', { empatia: 0, claridad: 1, solucion: 0 }, 'Aunque haya cola, hay que dar un plazo concreto, no un «no».', -1),
          O('Me conecto ya a su equipo y reinicio Outlook.', { empatia: 0, claridad: 1, solucion: 1 }, 'Conectarte sin pedir permiso y con la reunión empezando puede interrumpirle.', 0),
        ] },
      { msg: 'De acuerdo. Avíseme cuando esté.',
        opciones: [
          O('Registro todo en el ticket 5120 y le escribo por Teams en cuanto funcione, como muy tarde a las 11:00. ¡Suerte en la reunión!', { cierre: 2, claridad: 2, empatia: 1 }, 'Cierras con número de ticket, canal y hora concretos.', 1),
          O('Ok, ya veremos.', { cierre: 0, claridad: 0 }, 'Un cierre vago deja al usuario sin saber qué esperar.', -1),
          O('Listo, adiós.', { cierre: 0, claridad: 1 }, 'Falta decir cuándo y cómo le avisarás, y registrar el caso.', 0),
        ] },
    ],
  },
  'no-tecnica': {
    titulo: 'Una usuaria que no es técnica', usuario: 'Doña Carmen, contabilidad (lleva 30 años en la empresa)', canal: 'Llamada', animoInicial: -1, nivel: 'principiante',
    pasos: [
      { msg: 'Mijo, el internet se me borró. Ya no está el iconito de siempre y no sé hacer nada.',
        opciones: [
          O('No se preocupe, doña Carmen, vamos a encontrarlo juntos. ¿Me dice qué ve en la parte de abajo de la pantalla, en la barra con los dibujitos?', { empatia: 2, claridad: 2, solucion: 1 }, 'Tranquilizas y usas su mismo lenguaje para guiarla.', 1),
          O('El internet no se borra. Abra el navegador predeterminado.', { empatia: 0, claridad: 0, solucion: 0 }, 'Corregirla y usar palabras técnicas la confunde y la hace sentir mal.', -1),
          O('Le reinstalo el sistema y se arregla todo.', { empatia: 0, claridad: 1, solucion: 0 }, 'Desproporcionado: probablemente solo falta un acceso directo.', -1),
        ] },
      { msg: 'Veo una ventanita de Windows, una carpeta amarilla y un dibujo de un sobre.',
        opciones: [
          O('Muy bien. Pulse la tecla con el dibujo de Windows del teclado y escriba «Chrome», así, despacio. ¿Le aparece un círculo de colores?', { empatia: 1, claridad: 2, solucion: 2 }, 'Pasos cortos, de uno en uno, describiendo lo que va a ver.', 1),
          O('Busque Chrome en el menú Inicio, ancle el acceso directo a la barra de tareas y ábralo.', { empatia: 0, claridad: 0, solucion: 1 }, 'Tres instrucciones con jerga de golpe: es fácil que se pierda.', -1),
          O('Le mando un manual en PDF.', { empatia: 0, claridad: 1, solucion: 0 }, 'Para alguien con poca soltura, un manual largo no resuelve en el momento.', 0),
        ] },
      { msg: '¡Sí! Ahí está, ya se abrió mi internet.',
        opciones: [
          O('¡Perfecto! Ahora haga clic derecho sobre el círculo de abajo y elija «Anclar a la barra de tareas». Así se queda siempre ahí.', { claridad: 2, solucion: 2, empatia: 1 }, 'Resuelves la causa (el acceso directo) para que no vuelva a pasar.', 1),
          O('Bien, ya está. La próxima vez búsquelo usted.', { empatia: 0, solucion: 1, claridad: 1 }, 'Resuelve hoy, pero el problema volverá.', 0),
          O('Ve, era una tontería.', { empatia: 0, solucion: 1, claridad: 1 }, 'Restar importancia a su problema la hace sentir torpe.', -1),
        ] },
      { msg: 'Ay, muchas gracias, qué paciencia.',
        opciones: [
          O('Con gusto, doña Carmen. Le dejo anotado en el ticket cómo abrirlo. Si vuelve a pasar, llame a la extensión 2200 sin pena.', { cierre: 2, empatia: 2, claridad: 1 }, 'Cierras con amabilidad, documentas y le dices cómo volver a pedir ayuda.', 1),
          O('De nada.', { cierre: 1, empatia: 1 }, 'Correcto, pero sin documentar ni dejar el camino para la próxima vez.', 0),
          O('Para la próxima, tome un curso de informática.', { cierre: 0, empatia: 0 }, 'Comentario condescendiente: daña la relación con el usuario.', -1),
        ] },
    ],
  },
  fuera: {
    titulo: 'Una petición fuera de política', usuario: 'Kevin, ventas', canal: 'Chat', animoInicial: 0, nivel: 'intermedio',
    pasos: [
      { msg: 'Oye, ¿me das la contraseña de administrador un momento? Quiero instalar un programa para descargar música, es rápido.',
        opciones: [
          O('No puedo darte la contraseña de administrador: es política de seguridad de la empresa. Cuéntame qué necesitas hacer y vemos una alternativa.', { claridad: 2, solucion: 1, empatia: 1 }, 'Dices que no con claridad, explicas por qué y abres la puerta a ayudar.', 0),
          O('Vale, es «Admin2024». No se lo digas a nadie.', { claridad: 1, solucion: 0, empatia: 0 }, '¡Nunca! Compartir credenciales de administrador es una falta grave de seguridad.', 1),
          O('Ni loco. Eso está prohibido.', { claridad: 1, solucion: 0, empatia: 0 }, 'El fondo es correcto, pero el tono cierra la conversación y genera rechazo.', -1),
        ] },
      { msg: 'Es para poner música mientras trabajo. Todo el mundo lo hace.',
        opciones: [
          O('Entiendo que quieras música. Los programas de descarga pueden traer malware y no están permitidos, pero el navegador ya te deja usar los servicios de streaming autorizados.', { empatia: 2, claridad: 2, solucion: 2 }, 'Validas la necesidad, explicas el riesgo sin sermón y das una alternativa permitida.', 1),
          O('Si todo el mundo lo hace, voy a revisar los equipos de todos.', { empatia: 0, claridad: 1, solucion: 0 }, 'Suena a amenaza y no resuelve su necesidad.', -1),
          O('Bueno, instálalo y si pasa algo, borras el programa.', { empatia: 1, claridad: 0, solucion: 0 }, 'Dejas pasar un riesgo de seguridad para evitar el conflicto.', 0),
        ] },
      { msg: 'Bueno... ¿y si mi jefe lo aprueba?',
        opciones: [
          O('Si es un programa que necesitas para trabajar, tu jefe puede pedirlo por el portal de solicitudes; seguridad lo revisa y, si se aprueba, lo instalamos nosotros.', { claridad: 2, solucion: 2, cierre: 1 }, 'Le indicas el procedimiento correcto, sin prometer el resultado.', 1),
          O('Con que tu jefe diga que sí por chat, te lo instalo.', { claridad: 1, solucion: 0 }, 'Saltarse el procedimiento de solicitudes y revisión de seguridad es un riesgo.', 0),
          O('No va a aprobarse nunca.', { claridad: 0, solucion: 0, empatia: 0 }, 'No te corresponde decidirlo; explica el proceso.', -1),
        ] },
      { msg: 'Vale, entendido.',
        opciones: [
          O('Gracias por entenderlo, Kevin. Dejo constancia en el ticket. Si necesitas algo más, escríbeme.', { cierre: 2, empatia: 1, claridad: 1 }, 'Cierras en buen tono y documentas la petición denegada.', 1),
          O('Ya sabes, nada de programas raros o te reporto.', { cierre: 0, empatia: 0 }, 'Terminar con una amenaza deja mala relación.', -1),
          O('(Cerrar el chat sin responder.)', { cierre: 0 }, 'Un cierre sin despedida ni registro es poco profesional.', -1),
        ] },
    ],
  },
  telefono: {
    titulo: 'Guiar por teléfono: sin internet en la sucursal', usuario: 'Yaneisy, encargada de la sucursal este', canal: 'Llamada', animoInicial: -1, nivel: 'intermedio',
    pasos: [
      { msg: 'Buenas, en la sucursal no tenemos internet desde hace un rato y no podemos cobrar con tarjeta. Hay clientes esperando.',
        opciones: [
          O('Entiendo, Yaneisy, con clientes esperando es urgente. ¿Le pasa a todas las computadoras y al datáfono, o solo a una?', { empatia: 2, claridad: 2, solucion: 2 }, 'Reconoces el impacto y lo primero que haces es acotar el alcance.', 1),
          O('¿Ha probado a apagar y encender?', { empatia: 0, claridad: 1, solucion: 1 }, 'Es un paso válido, pero sin entender el alcance puedes perder tiempo.', 0),
          O('Seguro que es el proveedor. Llámelos a ellos.', { empatia: 0, claridad: 1, solucion: 0 }, 'Le pasas el problema sin diagnosticar; el soporte lo debes coordinar tú.', -1),
        ] },
      { msg: 'Todas, también el datáfono. En el aparato del internet hay una luz roja.',
        opciones: [
          O('Gracias, eso ayuda mucho. ¿Me lee qué pone junto a la luz roja? Suele poner WAN, Internet o un dibujo de un globo.', { claridad: 2, solucion: 2, empatia: 1 }, 'Pides un dato concreto y le dices dónde mirar.', 1),
          O('Desconecte todos los cables y vuelva a conectarlos.', { claridad: 0, solucion: 0 }, 'Sin indicar cuáles ni cómo, puede dejarlo peor.', -1),
          O('Vale, entonces el problema es del router.', { claridad: 1, solucion: 1 }, 'Es una pista, pero falta confirmarla antes de actuar.', 0),
        ] },
      { msg: 'Pone «Internet». Y la luz está roja fija.',
        opciones: [
          O('Desconecte solo el cable de corriente de ese aparato, cuente 30 segundos y vuelva a conectarlo. Las luces tardarán unos 2 minutos en ponerse verdes; yo sigo en línea con usted.', { claridad: 2, solucion: 2, empatia: 2 }, 'Instrucción única y precisa, con tiempos, y no la dejas sola.', 1),
          O('Reinicie el router.', { claridad: 1, solucion: 1 }, 'Correcto, pero para alguien no técnico conviene decir exactamente cómo y cuánto esperar.', 0),
          O('Abra la configuración del router en 192.168.1.1 y revise la WAN.', { claridad: 0, solucion: 0 }, 'Demasiado técnico para hacerlo por teléfono con una usuaria con clientes esperando.', -1),
        ] },
      { msg: 'Ya se puso verde y el datáfono cobra. ¡Gracias!',
        opciones: [
          O('¡Excelente! Lo dejo registrado y aviso al proveedor para que revise la línea por si vuelve a caerse. Si pasa de nuevo, llame al 2200 y lo atendemos con prioridad.', { cierre: 2, solucion: 2, empatia: 1 }, 'Además de cerrar, das seguimiento a la causa (la línea) y un camino rápido si se repite.', 1),
          O('Perfecto, adiós.', { cierre: 1 }, 'Resuelto, pero sin registrar ni hacer seguimiento de la causa.', 0),
          O('Para la próxima, haga eso usted sola antes de llamar.', { cierre: 0, empatia: 0 }, 'Enseñar está bien, pero el tono suena a reproche.', -1),
        ] },
    ],
  },
};

const total = p => Object.values(p).reduce((a, b) => a + b, 0);
export const maximo = c => c.pasos.reduce((n, paso) => n + Math.max(...paso.opciones.map(o => total(o.p))), 0);
export const APROBADO = 0.75;

// elecciones: índice elegido en cada paso. Devuelve puntos, porcentaje, ánimo final y puntuación por dimensión.
export function evaluarConversacion(c, elecciones) {
  const dims = Object.fromEntries(Object.keys(DIMENSIONES).map(k => [k, { p: 0, max: 0 }]));
  let puntos = 0, animo = c.animoInicial;
  c.pasos.forEach((paso, i) => {
    const o = paso.opciones[elecciones[i]];
    const mejor = paso.opciones.reduce((a, b) => (total(b.p) > total(a.p) ? b : a));
    for (const [k, v] of Object.entries(mejor.p)) dims[k].max += v;
    if (!o) return;
    puntos += total(o.p);
    for (const [k, v] of Object.entries(o.p)) dims[k].p += v;
    animo = Math.max(-3, Math.min(3, animo + o.animo));
  });
  const pct = Math.round((puntos / maximo(c)) * 100);
  return { puntos, pct, animo, dims, aprobado: pct >= APROBADO * 100 };
}
export const caraDe = animo => (animo <= -2 ? '😠' : animo === -1 ? '😟' : animo === 0 ? '😐' : animo === 1 ? '🙂' : '😄');
