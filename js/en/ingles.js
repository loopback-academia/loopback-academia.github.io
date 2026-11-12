// Inglés técnico para TI: vocabulario, lecturas de mensajes y documentación reales y frases para tickets, llamadas y
// entrevistas. Sin DOM: se prueba en Node.

// [inglés, español, ejemplo en inglés]
export const VOCAB = {
  basico: {
    titulo: 'Hardware, software y redes',
    palabras: [
      ['motherboard', 'placa base', 'The motherboard supports DDR5 memory.'],
      ['hard drive', 'disco duro', 'The hard drive is making a clicking noise.'],
      ['power supply', 'fuente de alimentación', 'Replace the power supply if the PC does not turn on.'],
      ['screen', 'pantalla', 'The screen stays black after startup.'],
      ['keyboard', 'teclado', 'The keyboard is not responding.'],
      ['printer', 'impresora', 'The printer is out of paper.'],
      ['cable', 'cable', 'Check that the network cable is plugged in.'],
      ['switch', 'switch (conmutador)', 'Connect the PC to port 5 on the switch.'],
      ['router', 'router (enrutador)', 'Restart the router and wait two minutes.'],
      ['firewall', 'cortafuegos', 'The firewall is blocking port 443.'],
      ['gateway', 'puerta de enlace', 'The default gateway is 192.168.1.1.'],
      ['subnet', 'subred', 'Each department has its own subnet.'],
      ['bandwidth', 'ancho de banda', 'Video calls use a lot of bandwidth.'],
      ['update', 'actualización / actualizar', 'Please install the latest update.'],
      ['install', 'instalar', 'You need admin rights to install this software.'],
      ['uninstall', 'desinstalar', 'Uninstall the old version first.'],
      ['restart', 'reiniciar', 'Restart your computer to finish the update.'],
      ['shut down', 'apagar', 'Do not shut down the server during the backup.'],
      ['log in', 'iniciar sesión', 'Log in with your company account.'],
      ['password', 'contraseña', 'Your password must have at least 12 characters.'],
      ['account', 'cuenta', 'Your account has been locked.'],
      ['backup', 'copia de seguridad', 'The backup runs every night at 2 a.m.'],
      ['troubleshoot', 'diagnosticar y resolver problemas', 'Let me troubleshoot the issue remotely.'],
      ['issue', 'problema / incidencia', 'I have an issue with my email.'],
      ['ticket', 'ticket (solicitud de soporte)', 'Please open a ticket with the help desk.'],
      ['outage', 'caída del servicio', 'There is an internet outage in the north office.'],
      ['setting', 'ajuste / configuración', 'Change this setting in the control panel.'],
      ['driver', 'controlador', 'Download the latest printer driver.'],
      ['device', 'dispositivo', 'This device is not recognized.'],
      ['storage', 'almacenamiento', 'The laptop is running out of storage.'],
    ],
  },
};

// Lecturas: textos reales en inglés con preguntas de comprensión en español.
export const LECTURAS = {
  errores: {
    titulo: 'Mensajes de error y avisos',
    textos: [
      { texto: 'Windows could not automatically detect this network\'s proxy settings.', preguntas: [{ q: '¿Qué no pudo hacer Windows?', opciones: ['Detectar automáticamente la configuración del proxy de la red', 'Conectarse al wifi', 'Instalar el controlador de red', 'Encontrar la impresora'], c: 0, e: '«could not automatically detect» = no pudo detectar automáticamente; «proxy settings» = configuración del proxy.' }] },
      { texto: 'The trust relationship between this workstation and the primary domain failed.', preguntas: [{ q: '¿Qué ha fallado?', opciones: ['La relación de confianza entre el equipo y el dominio', 'La contraseña del usuario', 'El disco duro', 'La conexión a internet'], c: 0, e: 'Es un error típico: el equipo perdió su relación con el dominio y hay que volver a unirlo. «Workstation» = equipo de trabajo.' }] },
      { texto: 'Your password will expire in 3 days. Press Ctrl+Alt+Delete and select "Change a password" to change it now.', preguntas: [{ q: '¿Qué indica el aviso?', opciones: ['Que la contraseña caduca en 3 días y cómo cambiarla', 'Que la contraseña ya caducó', 'Que la cuenta está bloqueada durante 3 días', 'Que hay que reiniciar el equipo'], c: 0, e: '«will expire in 3 days» = caducará dentro de 3 días.' }] },
      { texto: 'The printer is offline. Make sure it is turned on and connected to the network.', preguntas: [{ q: '¿Qué le pide comprobar?', opciones: ['Que la impresora esté encendida y conectada a la red', 'Que haya papel', 'Que el usuario tenga permisos', 'Que el controlador esté actualizado'], c: 0, e: '«offline» = sin conexión; «turned on» = encendida.' }] },
      { texto: 'There is not enough space on the disk. Free up some space and try again.', preguntas: [{ q: '¿Qué hay que hacer?', opciones: ['Liberar espacio en el disco y volver a intentarlo', 'Comprar más memoria RAM', 'Formatear el disco', 'Reinstalar el programa'], c: 0, e: '«free up some space» = liberar espacio; «try again» = intentarlo de nuevo.' }] },
      { texto: 'Access denied. You do not have permission to access \\\\fileserver\\finance. Contact your network administrator to request access.', preguntas: [{ q: '¿Cuál es el problema?', opciones: ['El usuario no tiene permiso para acceder a esa carpeta compartida', 'El servidor está apagado', 'La carpeta no existe', 'La contraseña es incorrecta'], c: 0, e: '«Access denied» = acceso denegado; «permission» = permiso; «request access» = solicitar acceso.' }] },
    ],
  },
  docs: {
    titulo: 'Documentación técnica',
    textos: [
      { texto: 'To reset the device to factory defaults, press and hold the RESET button for 10 seconds while the device is powered on. All custom settings will be lost.',
        preguntas: [{ q: '¿Cómo se restablece el equipo de fábrica?', opciones: ['Manteniendo pulsado el botón RESET 10 segundos con el equipo encendido', 'Desenchufándolo 10 segundos', 'Pulsando RESET con el equipo apagado', 'Desde la web del fabricante'], c: 0, e: '«press and hold» = mantener pulsado; «while the device is powered on» = mientras está encendido.' },
          { q: '¿Qué advertencia da?', opciones: ['Que se perderá toda la configuración personalizada', 'Que se anula la garantía', 'Que hace falta internet', 'Que tarda una hora'], c: 0, e: '«All custom settings will be lost» = se perderán todos los ajustes personalizados.' }] },
      { texto: 'Before upgrading the firmware, back up the current configuration. Do not power off the switch during the upgrade, as this may render the device unusable.',
        preguntas: [{ q: '¿Qué hay que hacer antes de actualizar el firmware?', opciones: ['Hacer una copia de seguridad de la configuración', 'Apagar el switch', 'Desconectar todos los cables', 'Llamar al fabricante'], c: 0, e: '«back up the current configuration» = haz una copia de la configuración actual.' },
          { q: '¿Qué puede pasar si se apaga durante la actualización?', opciones: ['Que el equipo quede inutilizable', 'Que la actualización vaya más rápido', 'Nada', 'Que se reinicie solo'], c: 0, e: '«render the device unusable» = dejar el equipo inutilizable.' }] },
      { texto: 'Known issue: users may be unable to print after installing update KB5040001. Workaround: roll back the update or install the latest driver from the manufacturer\'s website.',
        preguntas: [{ q: '¿Qué es un «workaround»?', opciones: ['Una solución temporal mientras se arregla el problema de fondo', 'Un error grave', 'Una actualización obligatoria', 'Un manual de usuario'], c: 0, e: 'Workaround = solución alternativa o provisional. «Roll back» = deshacer (desinstalar) la actualización.' }] },
      { texto: 'The service level agreement (SLA) guarantees a response within 1 hour for priority 1 incidents and within 8 business hours for priority 3 incidents.',
        preguntas: [{ q: '¿En cuánto tiempo hay que responder a un incidente de prioridad 3?', opciones: ['En 8 horas laborables', 'En 1 hora', 'En 3 horas', 'En 8 días'], c: 0, e: '«within 8 business hours» = en un plazo de 8 horas laborables.' }] },
    ],
  },
};

// Frases: elige la mejor forma de decirlo en inglés.
export const FRASES = {
  tickets: {
    titulo: 'Tickets y correos',
    items: [
      { situacion: 'Abres un ticket: el portátil de una usuaria no se conecta al wifi desde esta mañana.', opciones: ['The user\'s laptop has been unable to connect to Wi-Fi since this morning.', 'The laptop of the user no connect the wifi from the morning.', 'Laptop wifi broken.', 'The user is connecting to the laptop with wifi since morning.'], c: 0, e: '«has been unable to … since …» expresa algo que empezó en el pasado y sigue ocurriendo.' },
      { situacion: 'Cierras el ticket explicando lo que hiciste: reinstalaste el controlador y ya funciona.', opciones: ['I reinstalled the driver and the issue is now resolved.', 'I am reinstall the driver and now is work.', 'Driver reinstalled, finish.', 'I will reinstalled the driver.'], c: 0, e: 'Pasado simple (reinstalled) para lo que hiciste; «the issue is now resolved» es la fórmula habitual.' },
      { situacion: 'Pides al usuario más información: el mensaje de error exacto.', opciones: ['Could you please send me the exact error message?', 'Give me the error now.', 'You send error exact message please.', 'What error you have?'], c: 0, e: '«Could you please…?» es la forma educada de pedir algo.' },
      { situacion: 'Escalas el caso al equipo de redes.', opciones: ['I am escalating this ticket to the network team for further investigation.', 'I give this to network people.', 'Network team, fix it.', 'I am escalate to network.'], c: 0, e: '«escalate» = escalar; «for further investigation» = para que lo investiguen más a fondo.' },
      { situacion: 'Avisas de un mantenimiento: el correo no estará disponible el sábado de 10 p. m. a 11 p. m.', opciones: ['Email will be unavailable on Saturday from 10 p.m. to 11 p.m. due to scheduled maintenance.', 'Saturday the email is no working 10 to 11.', 'Email broken Saturday night.', 'The maintenance will email on Saturday.'], c: 0, e: '«will be unavailable» = no estará disponible; «due to scheduled maintenance» = por un mantenimiento programado.' },
    ],
  },
  llamadas: {
    titulo: 'Soporte por teléfono y chat',
    items: [
      { situacion: 'Contestas el teléfono de la mesa de ayuda.', opciones: ['IT help desk, this is Ana speaking. How can I help you?', 'Hello, what do you want?', 'Yes? Help desk.', 'Ana is here, say your problem.'], c: 0, e: 'Saludo profesional: departamento, tu nombre («this is … speaking») y una oferta de ayuda.' },
      { situacion: 'Necesitas que el usuario repita algo que no entendiste.', opciones: ['Sorry, could you repeat that, please?', 'What? Again.', 'I no understand you.', 'Repeat.'], c: 0, e: 'Pedir que repitan con educación es normal y profesional.' },
      { situacion: 'Le pides que reinicie el equipo.', opciones: ['Could you restart your computer, please? I\'ll wait.', 'Restart now the computer.', 'You must to restart.', 'Computer restart you.'], c: 0, e: '«I\'ll wait» tranquiliza al usuario: no lo dejas solo.' },
      { situacion: 'Necesitas conectarte en remoto y pides permiso.', opciones: ['May I connect to your computer remotely to take a look?', 'I enter your computer now.', 'Give me your computer.', 'I am going in your PC.'], c: 0, e: '«May I…?» pide permiso de forma educada; «take a look» = echar un vistazo.' },
      { situacion: 'Necesitas un momento para consultar algo.', opciones: ['Please bear with me for a moment while I check that.', 'Wait.', 'Stop, I check.', 'One moment I am checking is.'], c: 0, e: '«Bear with me» = tenga un poco de paciencia conmigo: muy usado en soporte.' },
      { situacion: 'Cierras la llamada.', opciones: ['Is there anything else I can help you with today?', 'Bye, finished.', 'Okay, go.', 'Problem fixed, goodbye now.'], c: 0, e: 'Antes de cerrar se pregunta si necesita algo más.' },
    ],
  },
  entrevista: {
    titulo: 'La entrevista en inglés',
    items: [
      { situacion: '«Tell me about yourself.» Empiezas tu respuesta.', opciones: ['I\'m an IT support technician with hands-on experience in Windows, networking and help desk tickets.', 'My name is Ana and I was born in 1999 in a small town.', 'I am a person very responsible and hard worker.', 'I don\'t know, what do you want to know?'], c: 0, e: 'Empieza por tu perfil profesional y tu experiencia relevante, no por tu biografía.' },
      { situacion: '«Why do you want to work here?»', opciones: ['I\'m interested in your company because you are growing and I want to support your users while I keep learning.', 'Because I need money.', 'Because my friend works here.', 'I want any job.'], c: 0, e: 'Relaciona tu motivación con la empresa y con lo que aportas.' },
      { situacion: 'Te preguntan algo técnico que no sabes.', opciones: ['I\'m not sure, but I would check the documentation and ask a senior colleague.', 'I know everything about it.', 'Next question.', 'That is not important.'], c: 0, e: 'La honestidad y un plan para averiguarlo valen más que inventar.' },
      { situacion: 'Describes un logro con un dato concreto.', opciones: ['I reduced the average ticket resolution time by 20% by writing knowledge base articles.', 'I was very good in my job.', 'I made many tickets.', 'My boss liked me.'], c: 0, e: 'Un logro con cifra y con lo que hiciste tú (método STAR).' },
      { situacion: 'Al final, el entrevistador pregunta: «Do you have any questions for us?»', opciones: ['Yes. What does a typical day look like for someone in this role?', 'No.', 'How much vacation do I get?', 'When can I leave?'], c: 0, e: 'Preguntar por el trabajo real demuestra interés.' },
    ],
  },
};

export const APROBADO = 0.8;
// Mezcla las opciones de forma determinista para una semilla dada y devuelve [opciones, índiceCorrecto].
export function barajarOpciones(opciones, correcta, rnd = Math.random) {
  const orden = opciones.map((o, i) => [rnd(), i]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  return [orden.map(i => opciones[i]), orden.indexOf(correcta)];
}
// Distractores para el vocabulario: tres traducciones de otras palabras del mismo conjunto.
export function preguntaVocab(set, k, rnd = Math.random, inversa = false) {
  const p = VOCAB[set].palabras;
  const [en, es] = p[k];
  const otras = p.filter((_, i) => i !== k).map(([e2, s2]) => (inversa ? e2 : s2)).sort(() => rnd() - 0.5).slice(0, 3);
  const [opciones, c] = barajarOpciones([inversa ? en : es, ...otras], 0, rnd);
  return { pregunta: inversa ? es : en, ejemplo: p[k][2], opciones, c, en };
}
