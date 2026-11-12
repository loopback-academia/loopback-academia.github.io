// Simulador de entrevista: preguntas técnicas por ruta, de comportamiento (método STAR) y situacionales, cada una con
// los puntos clave que espera un entrevistador y una respuesta modelo. Sin DOM: se prueba en Node.

export const RUTAS_ENTREVISTA = {
  soporte: 'Soporte técnico y mesa de ayuda',
  redes: 'Redes (técnico o administrador junior)',
  datos: 'Bases de datos y análisis',
  prog: 'Programación (desarrollador junior)',
};

const P = (id, tipo, ruta, pregunta, claves, modelo) => ({ id, tipo, ruta, pregunta, claves, modelo });

export const PREGUNTAS = [
  // ---------------------------------------------------------------- técnicas: soporte
  P('s-internet', 'tecnica', 'soporte', 'Un usuario dice que no tiene internet. ¿Qué pasos sigues?',
    ['Preguntar y acotar: ¿le pasa solo a él o a más personas?', 'Revisar lo físico: cable, wifi, luces de la tarjeta', 'Mirar la IP con ipconfig (una 169.254 indica fallo de DHCP)', 'Probar por capas: ping a la puerta de enlace, a una IP externa y a un nombre (DNS)', 'Documentar lo hecho en el ticket'],
    'Primero acoto el alcance: si le pasa a toda la oficina, es la red o el proveedor y lo escalo; si solo a él, voy a su equipo. Reviso cable o wifi y miro ipconfig: si tiene una 169.254 no recibió DHCP. Luego pruebo por capas: ping a la puerta de enlace, a 8.8.8.8 y a un nombre. Si la IP responde y el nombre no, es DNS. Todo lo dejo anotado en el ticket.'),
  P('s-incidente', 'tecnica', 'soporte', '¿Qué diferencia hay entre un incidente y un problema?',
    ['Incidente: una interrupción concreta; el objetivo es restaurar el servicio cuanto antes', 'Problema: la causa raíz de uno o varios incidentes', 'Un ejemplo de cada uno', 'Se documenta en la base de conocimiento para resolver más rápido la próxima vez'],
    'Un incidente es una interrupción concreta, por ejemplo «la impresora de contabilidad no imprime», y lo prioritario es que vuelva a funcionar. Un problema es la causa de fondo cuando el incidente se repite, por ejemplo un controlador defectuoso que atasca la cola cada semana. Los incidentes se resuelven rápido; los problemas se investigan, y la solución queda en la base de conocimiento.'),
  P('s-prioridad', 'tecnica', 'soporte', '¿Cómo priorizas los tickets cuando llegan muchos a la vez?',
    ['Impacto: cuántas personas o qué parte del negocio está afectada', 'Urgencia: cuánto tiempo puede esperar', 'Respetar los SLA acordados', 'Un ejemplo: toda una sucursal sin sistema frente a cambiar un fondo de pantalla', 'Comunicar los plazos a cada usuario'],
    'Combino impacto y urgencia según la matriz de prioridades y respeto los SLA. Una sucursal sin sistema de ventas es P1 aunque haya llegado después que diez peticiones de cambiar el fondo de pantalla. A cada usuario le digo cuándo le atenderán, para que nadie se quede sin respuesta.'),
  P('s-contrasena', 'tecnica', 'soporte', 'Un usuario te llama porque olvidó su contraseña. ¿Qué haces?',
    ['Verificar su identidad según el procedimiento (no basta con que diga su nombre)', 'Nunca pedirle ni decirle una contraseña', 'Restablecer con una contraseña temporal que debe cambiar al entrar', 'Recordar o activar el MFA', 'Registrar el ticket'],
    'Primero verifico su identidad con el procedimiento de la empresa, por ejemplo devolviendo la llamada a su extensión o con datos que solo él conoce. Después restablezco la contraseña con una temporal que debe cambiar al entrar. Nunca le pido la contraseña antigua ni le dicto una definitiva. Si tiene MFA, compruebo que siga funcionando, y lo registro todo en el ticket.'),
  P('s-impresora', 'tecnica', 'soporte', 'La impresora de la oficina no imprime para nadie. ¿Cómo lo diagnosticas?',
    ['Confirmar el alcance: le pasa a todos', 'Revisar el equipo físico: papel, atascos, mensajes de error', 'Comprobar la red: ping a la IP de la impresora', 'Revisar la cola y el servicio de impresión (spooler)', 'Escalar al proveedor si es una avería de hardware'],
    'Como le pasa a todos, descarto los PC y voy a la impresora: pantalla, papel y atascos. Luego compruebo que responde por red con un ping a su IP. Si responde, miro la cola de impresión del servidor: un trabajo dañado puede bloquearla, y se arregla deteniendo el spooler, borrando la cola y volviéndolo a arrancar. Si es una pieza, escalo al proveedor con el modelo y el error exacto.'),
  // ---------------------------------------------------------------- técnicas: redes
  P('r-navegador', 'tecnica', 'redes', 'Explica qué pasa cuando escribes una dirección web en el navegador y pulsas Intro.',
    ['DNS traduce el nombre a una IP', 'El equipo envía el tráfico a su puerta de enlace (ARP para la MAC)', 'Se abre una conexión TCP (three-way handshake)', 'Se negocia TLS si es HTTPS', 'Petición y respuesta HTTP'],
    'El navegador pide al DNS la IP del nombre. Como el servidor está en otra red, el equipo manda el tráfico a su puerta de enlace, cuya MAC obtiene con ARP. Se abre una conexión TCP con el handshake SYN, SYN-ACK, ACK al puerto 443, se negocia TLS para cifrar y se envía la petición HTTP. El servidor responde con la página, y el navegador pide el resto de recursos.'),
  P('r-vlan', 'tecnica', 'redes', '¿Para qué sirven las VLAN?',
    ['Separan dominios de broadcast en un mismo switch', 'Aíslan departamentos o tipos de tráfico por seguridad', 'Los trunks 802.1Q las llevan entre switches', 'Para comunicar VLAN distintas hace falta un router o un switch de capa 3'],
    'Una VLAN divide un switch físico en varias redes lógicas: cada una es su propio dominio de broadcast. Sirven para separar, por ejemplo, empleados, invitados, cámaras y voz, por seguridad y orden. Entre switches viajan por enlaces trunk con etiquetas 802.1Q, y para que dos VLAN se comuniquen hace falta enrutar, con un router-on-a-stick o un switch de capa 3.'),
  P('r-tcpudp', 'tecnica', 'redes', '¿Qué diferencia hay entre TCP y UDP? Pon ejemplos.',
    ['TCP es orientado a conexión y fiable (confirma y retransmite)', 'UDP no establece conexión: es más ligero y rápido', 'Ejemplos de TCP: web, correo, transferencia de archivos', 'Ejemplos de UDP: voz, vídeo en directo, DNS, DHCP'],
    'TCP establece la conexión con un handshake, numera los datos, confirma lo recibido y retransmite lo perdido: es fiable y se usa en la web, el correo o la transferencia de archivos. UDP envía sin conexión ni confirmaciones, con menos retardo, y se usa donde importa más la rapidez que recuperar cada paquete, como la voz sobre IP o el vídeo en directo, o en consultas cortas como DNS y DHCP.'),
  P('r-errdisabled', 'tecnica', 'redes', 'Un puerto de switch aparece en err-disabled. ¿Qué haces?',
    ['Verlo con show interfaces status y revisar el registro (show logging)', 'Identificar la causa: port security, BPDU guard, errores', 'Corregir la causa antes de reactivarlo', 'Reactivar con shutdown y no shutdown', 'Documentar el cambio'],
    'Primero miro show interfaces status y el registro para saber por qué se desactivó: suele ser una violación de port security (otro equipo conectado) o BPDU guard (alguien conectó un switch). Corrijo la causa, por ejemplo quito el equipo no autorizado o actualizo la MAC permitida, y después reactivo el puerto con shutdown y no shutdown. Lo dejo documentado en el ticket.'),
  // ---------------------------------------------------------------- técnicas: datos
  P('d-join', 'tecnica', 'datos', '¿Qué diferencia hay entre INNER JOIN y LEFT JOIN?',
    ['INNER JOIN devuelve solo las filas que coinciden en las dos tablas', 'LEFT JOIN devuelve todas las filas de la tabla de la izquierda', 'Donde no hay coincidencia, LEFT JOIN rellena con NULL', 'Un ejemplo: clientes sin pedidos'],
    'INNER JOIN solo devuelve las filas con coincidencia en ambas tablas. LEFT JOIN devuelve todas las filas de la tabla de la izquierda y, si no tienen pareja, rellena las columnas de la derecha con NULL. Por ejemplo, para listar los clientes que nunca han comprado hago un LEFT JOIN con pedidos y filtro donde el pedido es NULL.'),
  P('d-indice', 'tecnica', 'datos', '¿Qué es un índice y cuándo no conviene crearlo?',
    ['Acelera las búsquedas, como el índice de un libro', 'Tiene coste: ocupa espacio y ralentiza INSERT, UPDATE y DELETE', 'No conviene en columnas con muy pocos valores distintos ni en tablas pequeñas', 'Se comprueba su efecto con EXPLAIN o el plan de ejecución'],
    'Un índice es una estructura ordenada que permite encontrar filas sin recorrer toda la tabla, como el índice de un libro. Acelera las lecturas, pero ocupa espacio y hace más lentas las escrituras, porque también hay que actualizarlo. No compensa en tablas pequeñas ni en columnas con pocos valores, como un sí/no. Antes y después miro el plan de ejecución con EXPLAIN.'),
  P('d-normalizar', 'tecnica', 'datos', '¿Qué es la normalización y para qué sirve?',
    ['Organizar las tablas para evitar datos duplicados', 'Evita anomalías al insertar, modificar o borrar', 'Formas normales: 1FN, 2FN y 3FN', 'Relaciones mediante claves foráneas', 'A veces se desnormaliza a propósito por rendimiento'],
    'Normalizar es repartir los datos en tablas para que cada dato esté en un solo sitio, unidas por claves foráneas. Así se evitan anomalías, como cambiar la dirección de un cliente en un pedido y no en los demás. Lo habitual es llegar a tercera forma normal. En informes o almacenes de datos a veces se desnormaliza a propósito para que las consultas sean más rápidas.'),
  P('d-inyeccion', 'tecnica', 'datos', '¿Cómo evitas la inyección SQL?',
    ['Consultas parametrizadas (nunca pegar el texto del usuario en el SQL)', 'Usar un ORM o los marcadores del conector', 'Mínimo privilegio en la cuenta de la aplicación', 'Validar los formatos como capa adicional'],
    'La defensa principal son las consultas parametrizadas: la consulta lleva marcadores y los valores viajan por separado, así que nunca se ejecutan como SQL. Además, la cuenta que usa la aplicación tiene solo los permisos que necesita y valido los formatos esperados. Filtrar palabras o comillas no basta.'),
  // ---------------------------------------------------------------- técnicas: programación
  P('p-depurar', 'tecnica', 'prog', '¿Cómo depuras un error que no entiendes?',
    ['Reproducir el error con un caso concreto', 'Leer el mensaje de error o traceback completo', 'Aislar el problema (print, depurador, casos mínimos)', 'Formular una hipótesis y comprobarla', 'Escribir una prueba para que no vuelva'],
    'Primero consigo reproducirlo siempre con un caso concreto. Leo el traceback entero, de abajo arriba. Luego aíslo: miro los valores con prints o con el depurador y reduzco el caso hasta encontrar la línea. Formulo una hipótesis, la compruebo, lo arreglo y añado una prueba automática que habría detectado el fallo.'),
  P('p-git', 'tecnica', 'prog', '¿Qué es Git y para qué sirven las ramas?',
    ['Control de versiones: historial de cambios y poder volver atrás', 'Las ramas permiten trabajar en algo sin afectar a la rama principal', 'Se integran con merge o pull request', 'La revisión de código se hace en el pull request'],
    'Git guarda el historial de cambios del código: quién cambió qué y cuándo, y permite volver atrás. Una rama es una línea de trabajo aislada: hago una nueva función en su rama sin romper main. Cuando está lista abro un pull request, un compañero la revisa y se fusiona.'),
  P('p-api', 'tecnica', 'prog', 'Explica qué es una API REST.',
    ['Interfaz para que dos programas se comuniquen por HTTP', 'Recursos identificados por URL', 'Métodos GET, POST, PUT y DELETE', 'Datos normalmente en JSON', 'Códigos de estado (200, 404, 500) y autenticación con token'],
    'Una API REST permite que un programa use a otro a través de HTTP. Cada recurso tiene una URL, por ejemplo /clientes/42, y se opera con los métodos GET para leer, POST para crear, PUT o PATCH para modificar y DELETE para borrar. Los datos suelen ir en JSON y la respuesta trae un código de estado: 200 bien, 404 no existe, 500 error del servidor. Normalmente se autentica con un token.'),
  P('p-proyecto', 'tecnica', 'prog', 'Cuéntame un proyecto que hayas programado.',
    ['Qué problema resolvía', 'Qué tecnologías usaste y por qué', 'Cuál fue exactamente tu parte', 'Una dificultad y cómo la resolviste', 'El resultado y dónde se puede ver (GitHub)'],
    'Hice un script en Python que compara las configuraciones de los switches de un día a otro para detectar cambios. Lo programé yo solo con Netmiko y difflib. Lo difícil fue que las líneas con fecha cambiaban siempre, así que las filtré antes de comparar. Ahora se ve en segundos qué cambió, y está en mi GitHub con datos de ejemplo.'),
  // ---------------------------------------------------------------- comportamiento (STAR)
  P('c-dificil', 'comportamiento', null, 'Háblame de una vez que tuviste que tratar con una persona molesta o difícil.',
    ['Situación concreta y real', 'Cuál era tu tarea o responsabilidad', 'Lo que hiciste tú: escuchar, mantener la calma, empatizar', 'El resultado', 'Qué aprendiste'],
    'En la tienda donde trabajaba (situación), un cliente llegó gritando porque su equipo reparado volvía a fallar, y me tocaba atenderle (tarea). Le dejé hablar sin interrumpir, le dije que entendía su enfado y revisé el historial delante de él; vi que era otra pieza y le propuse cambiarla sin coste de mano de obra (acción). Se fue tranquilo y volvió como cliente (resultado). Aprendí que escuchar primero desactiva la mayoría de los conflictos.'),
  P('c-error', 'comportamiento', null, 'Cuéntame un error que hayas cometido y qué hiciste.',
    ['Un error real, no un «defecto» disfrazado de virtud', 'Asumir la responsabilidad', 'Cómo lo arreglaste', 'Qué cambiaste para que no se repita'],
    'En un laboratorio de prácticas borré por error la configuración de un switch sin tener copia. Lo dije en el momento, la reconstruí a partir de la documentación y tardamos una hora más. Desde entonces guardo una copia antes de cualquier cambio y uso una lista de comprobación.'),
  P('c-porque', 'comportamiento', null, '¿Por qué quieres trabajar en tecnología y en este puesto?',
    ['Una motivación concreta, no genérica', 'Lo que has hecho para prepararte (cursos, laboratorios, proyectos)', 'Relación entre el puesto y tus objetivos', 'Algo que sabes de la empresa'],
    'Me gusta resolver problemas y ver el resultado enseguida, y en soporte lo hago todos los días. Me he preparado con un curso completo, laboratorios de redes y de Windows y un portafolio con casos resueltos. Este puesto me permite aprender de un equipo con experiencia, y vi que la empresa está abriendo sucursales, así que habrá mucho trabajo de red y de equipos nuevos.'),
  P('c-presentate', 'comportamiento', null, 'Háblame de ti.',
    ['Presente: qué haces o estudias ahora', 'Experiencia o formación relevante para el puesto', 'Uno o dos logros o proyectos concretos', 'Por qué este puesto', 'Breve: uno o dos minutos'],
    'Soy técnico en formación y llevo un año preparándome en redes y soporte. Completé la ruta de soporte técnico con laboratorios de Windows y Cisco, y armé un pequeño laboratorio en casa con un router y dos PC. Antes trabajé atendiendo clientes en una tienda, lo que me dio paciencia y buena comunicación. Busco mi primer puesto en una mesa de ayuda para seguir creciendo hacia redes.'),
  // ---------------------------------------------------------------- situacionales
  P('x-tarde', 'situacional', null, 'Son las 5:55 p. m., vas a salir y el gerente te dice que su correo no funciona y mañana temprano tiene una reunión importante. ¿Qué haces?',
    ['Evaluar el impacto y la urgencia reales', 'Ofrecer una solución temporal (correo web o móvil)', 'Comunicar con claridad qué vas a hacer y cuándo', 'Registrar el ticket', 'Escalar o pedir apoyo si no se puede resolver hoy'],
    'Le pregunto qué necesita exactamente para mañana. Si es urgente, en diez minutos compruebo si funciona el correo web o el móvil para que tenga una alternativa esta noche. Registro el ticket, le digo claramente qué haré y a qué hora lo reviso mañana, y si hace falta lo escalo al turno o al responsable.'),
  P('x-nosabes', 'situacional', null, 'Un usuario te plantea un problema técnico y no sabes la respuesta. ¿Qué haces?',
    ['Reconocerlo con honestidad, sin inventar', 'Buscar en la base de conocimiento y la documentación', 'Consultar a un compañero o escalar', 'Informar al usuario de los siguientes pasos y plazos', 'Documentar la solución para la próxima vez'],
    'Le digo con honestidad que tengo que comprobarlo y cuándo le daré respuesta. Busco en la base de conocimiento y la documentación del fabricante; si no lo encuentro, consulto a un compañero o lo escalo con todo lo que ya probé. Cuando se resuelve, lo documento para que la próxima vez sea rápido.'),
];

const barajar = (a, rnd) => a.map(x => [rnd(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);

// Una entrevista: 3 técnicas de la ruta, 2 de comportamiento y 1 situacional.
export function nuevaEntrevista(ruta, rnd = Math.random) {
  if (!RUTAS_ENTREVISTA[ruta]) throw new Error('Ruta de entrevista desconocida: ' + ruta);
  const de = (tipo, r) => barajar(PREGUNTAS.filter(p => p.tipo === tipo && (!r || p.ruta === r)), rnd);
  return [...de('tecnica', ruta).slice(0, 3), ...de('comportamiento').slice(0, 2), ...de('situacional').slice(0, 1)];
}

// Puntuación: porcentaje de puntos clave que el alumno marca como incluidos en sus respuestas.
export function puntuar(preguntas, marcadas) {
  const total = preguntas.reduce((n, p) => n + p.claves.length, 0);
  const hechas = preguntas.reduce((n, p) => n + Math.min((marcadas[p.id] || []).length, p.claves.length), 0);
  return { total, hechas, pct: total ? Math.round((hechas / total) * 100) : 0 };
}
