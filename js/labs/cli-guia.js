// Modo guiado del simulador de IOS (sin DOM). A partir de la solución de un laboratorio guiado construye los
// pasos: qué escribir, qué hace cada comando explicado para principiantes, en qué modo se escribe y cómo llegar a él.
// Un paso se da por hecho cuando el alumno escribe un comando equivalente (abreviado o con el nombre completo de la
// interfaz cuenta igual) porque se compara lo que entendió el intérprete, no el texto.
import { nuevoEquipo, ejecutar, prompt } from './ios.js';

export const NOMBRE_MODO = {
  user: 'modo usuario', priv: 'modo privilegiado', config: 'configuración global', if: 'configuración de interfaz',
  line: 'configuración de línea', vlan: 'configuración de VLAN', router: 'configuración de OSPF', dhcp: 'configuración del DHCP',
  'acl-std': 'configuración de la ACL', 'acl-ext': 'configuración de la ACL',
};

// Explicaciones para principiantes. Se usa la primera expresión que encaje con la línea de la solución.
export const EXPLICA = [
  [/^enable$/, 'Pasa del modo usuario (>) al modo privilegiado (#). Es como «abrir la puerta» del equipo: desde ahí puedes ver todo y entrar a configurar.'],
  [/^configure terminal$/, 'Entra en el modo de configuración global: a partir de aquí lo que escribas cambia la configuración del equipo. Se abrevia «conf t».'],
  [/^hostname /, 'Cambia el nombre del equipo. El nombre nuevo aparece en el prompt al instante, así siempre sabes en qué equipo estás.'],
  [/^enable secret /, 'Pone contraseña al modo privilegiado y la guarda cifrada. Quien no la sepa no podrá pasar de > a #.'],
  [/^service password-encryption$/, 'Oculta las contraseñas que se guardan en texto plano (como la de la consola) para que no se lean al mirar la configuración.'],
  [/^banner motd /, 'Mensaje que verá cualquiera que se conecte al equipo. El texto va entre dos # (el símbolo marca dónde empieza y acaba).'],
  [/^line console 0$/, 'Entra a configurar el puerto de consola: el puerto físico donde se conecta un cable directamente al equipo.'],
  [/^line vty 0 15$/, 'Entra a configurar las líneas de acceso remoto (VTY): las 16 «puertas» por las que se entra por red con SSH o Telnet.'],
  [/^password /, 'Define la contraseña de esta línea. Sola no basta: hace falta también el comando login.'],
  [/^login$/, 'Obliga a pedir la contraseña al entrar por esta línea. Sin login, la contraseña existe pero nadie la pide.'],
  [/^login local$/, 'Al entrar en remoto se pedirá usuario y contraseña de la lista de usuarios locales del equipo (los creados con username).'],
  [/^exec-timeout /, 'Cierra la sesión si nadie escribe nada durante ese tiempo (minutos y segundos). Evita dejar el equipo abierto si te vas.'],
  [/^transport input ssh$/, 'Solo se permite entrar en remoto por SSH, que va cifrado. Telnet queda bloqueado porque envía todo, contraseñas incluidas, sin cifrar.'],
  [/^end$/, 'Sale de la configuración y vuelve directo al modo privilegiado (#). Equivale a presionar Ctrl+Z.'],
  [/^exit$/, 'Sube un nivel: por ejemplo, de la configuración de una interfaz a la configuración global.'],
  [/^copy running-config startup-config$/, 'Guarda la configuración. La que estás usando vive en la RAM y se borra al apagar; este comando la copia a la NVRAM para que sobreviva a un reinicio.'],
  [/^vlan \d+$/, 'Crea la VLAN con ese número (o entra en ella si ya existe). Una VLAN es una red separada dentro del mismo switch.'],
  [/^name /, 'Le pone un nombre a la VLAN para reconocerla fácilmente (VENTAS, SOPORTE…).'],
  [/^interface range /, 'Entra a configurar varios puertos a la vez. Todo lo que escribas a continuación se aplica a todos los del rango.'],
  [/^interface vlan /, 'Entra en la interfaz virtual (SVI) de esa VLAN: es la «IP del switch» para poder administrarlo por red.'],
  [/^interface \S+\.\d+$/, 'Crea una subinterfaz: una interfaz lógica dentro de la física. Se usa una por cada VLAN cuando un solo cable lleva varias VLAN al router.'],
  [/^interface /, 'Entra a configurar ese puerto concreto. g0/1 es GigabitEthernet0/1 y fa0/5 es FastEthernet0/5.'],
  [/^switchport mode access$/, 'Convierte el puerto en puerto de acceso: el que se usa para conectar una computadora, una impresora o un teléfono. Pertenece a una sola VLAN.'],
  [/^switchport access vlan /, 'Mete el puerto en esa VLAN. El equipo conectado ahí formará parte de esa red.'],
  [/^switchport mode trunk$/, 'Convierte el puerto en trunk (troncal): un enlace entre switches que transporta varias VLAN a la vez, cada trama con su etiqueta.'],
  [/^switchport trunk native vlan /, 'Cambia la VLAN nativa: la que viaja sin etiqueta por el trunk. Por seguridad se usa una VLAN que no tenga usuarios.'],
  [/^switchport trunk allowed vlan /, 'Indica qué VLAN pueden pasar por el trunk. Las que no estén en la lista quedan bloqueadas en ese enlace.'],
  [/^switchport nonegotiate$/, 'Apaga DTP, la negociación automática de trunks. Así nadie puede convertir el puerto en trunk conectando su propio equipo.'],
  [/^switchport port-security$/, 'Activa la seguridad de puerto: el switch vigilará qué equipos (MAC) se conectan a este puerto.'],
  [/^switchport port-security maximum /, 'Número máximo de equipos (direcciones MAC) que se permiten en el puerto.'],
  [/^switchport port-security mac-address sticky$/, 'El switch aprende solo las MAC de los equipos conectados y las «pega» en la configuración como permitidas.'],
  [/^switchport port-security violation /, 'Qué hacer si se conecta un equipo de más: restrict descarta su tráfico y lo apunta en el registro, sin apagar el puerto.'],
  [/^shutdown$/, 'Apaga el puerto. Los puertos que no se usan se apagan para que nadie pueda enchufarse a ellos.'],
  [/^no shutdown$/, 'Enciende la interfaz. En los routers vienen apagadas de fábrica: sin este comando no funcionan aunque tengan IP.'],
  [/^description /, 'Pone una etiqueta a la interfaz (a qué está conectada). No cambia el funcionamiento, pero te ahorra mucho tiempo al buscar averías.'],
  [/^ip address \S+ \S+$/, 'Da a la interfaz su dirección IP y su máscara. Será la dirección del equipo en esa red (en un router, la puerta de enlace de los PC).'],
  [/^ip default-gateway /, 'Puerta de enlace del switch: a dónde enviar lo que va a otras redes, para poder administrarlo desde fuera de su red.'],
  [/^ip route 0\.0\.0\.0 0\.0\.0\.0 /, 'Ruta por defecto: «todo lo que no sepas a dónde enviar, mándalo a este router» (normalmente el del proveedor de Internet).'],
  [/^ip route \S+ \S+ \S+ \d+$/, 'Ruta flotante de respaldo: el número del final (distancia administrativa) es mayor, así que solo se usa si falla la ruta principal.'],
  [/^ip route /, 'Ruta estática: le dice al router «para llegar a esta red, envía los paquetes a este otro router».'],
  [/^show ip interface brief$/, 'Resumen de todas las interfaces: su IP y si están encendidas (up) o apagadas (down). Es el comando que más vas a usar.'],
  [/^show ip route$/, 'Muestra la tabla de rutas: todas las redes que el router conoce y por dónde llega a cada una.'],
  [/^show vlan brief$/, 'Lista las VLAN del switch y qué puertos hay en cada una. Sirve para comprobar que lo has hecho bien.'],
  [/^show interfaces trunk$/, 'Muestra los puertos trunk, su VLAN nativa y qué VLAN dejan pasar.'],
  [/^show ip ospf neighbor$/, 'Muestra los routers vecinos de OSPF. Si el estado es FULL, se entienden y comparten rutas.'],
  [/^show access-lists$/, 'Muestra las listas de acceso (ACL) con sus reglas y cuántos paquetes ha atrapado cada una.'],
  [/^show port-security interface /, 'Muestra la seguridad del puerto: cuántas MAC permite, cuántas ha aprendido y si ha habido violaciones.'],
  [/^show ip dhcp binding$/, 'Lista las IP que el servidor DHCP ha repartido y a qué equipo (MAC) se la dio.'],
  [/^show ip nat translations$/, 'Muestra las traducciones NAT activas: qué IP privada sale a Internet con qué IP pública.'],
  [/^show ip dhcp snooping$/, 'Muestra si DHCP snooping está activo, en qué VLAN y qué puertos son de confianza.'],
  [/^show ipv6 interface brief$/, 'Resumen de las interfaces con sus direcciones IPv6 (primero la link-local y después las globales).'],
  [/^show ipv6 route$/, 'Tabla de rutas IPv6 del router.'],
  [/^ping /, 'Comprueba si hay conexión: envía paquetes al destino y espera respuesta. Cada ! es una respuesta recibida; cada . es una que no llegó.'],
  [/^router ospf /, 'Arranca el protocolo OSPF: los routers se descubren entre ellos y se cuentan qué redes conoce cada uno. El número es solo local.'],
  [/^router-id /, 'Fija el identificador del router dentro de OSPF. Tiene forma de IP, pero es solo un nombre único.'],
  [/^network \S+ \S+ area /, 'Activa OSPF en las interfaces que estén en esa red y la anuncia a los vecinos. La wildcard es la máscara «al revés».'],
  [/^passive-interface /, 'No busca vecinos OSPF por esa interfaz (es la LAN de los usuarios), pero sigue anunciando su red.'],
  [/^access-list \d+ deny /, 'Regla de la ACL que bloquea el tráfico que viene de esa red.'],
  [/^access-list \d+ permit any$/, 'Regla que deja pasar todo lo demás. Toda ACL acaba con un «deny» invisible: sin esta línea se bloquearía todo.'],
  [/^access-list \d+ permit /, 'Regla de la ACL que permite el tráfico de esa red. Aquí se usa para elegir qué direcciones se traducen con NAT.'],
  [/^ip access-group /, 'Aplica la ACL a la interfaz en un sentido (in = lo que entra, out = lo que sale). Una ACL que no se aplica no hace nada.'],
  [/^ip domain-name /, 'Pone un dominio al equipo. Junto con el hostname, hace falta para crear las claves de SSH.'],
  [/^crypto key generate rsa/, 'Genera las claves de cifrado RSA y activa SSH. 2048 bits es un tamaño seguro.'],
  [/^ip ssh version 2$/, 'Obliga a usar SSH versión 2, la segura.'],
  [/^username /, 'Crea un usuario local con privilegio 15 (administrador completo) y su contraseña cifrada.'],
  [/^encapsulation dot1q \d+ native$/, 'Esta subinterfaz atiende a la VLAN nativa: la que llega sin etiqueta por el trunk.'],
  [/^encapsulation dot1q /, 'Indica a qué VLAN pertenece la subinterfaz: atenderá las tramas que lleguen con esa etiqueta.'],
  [/^ip dhcp excluded-address /, 'Reserva direcciones para que el DHCP no las reparta (router, impresoras, servidores con IP fija).'],
  [/^ip dhcp pool /, 'Crea un grupo de direcciones DHCP con ese nombre y entra a configurarlo.'],
  [/^network \S+ \S+$/, 'Red de la que el DHCP repartirá direcciones a los equipos.'],
  [/^default-router /, 'Puerta de enlace que el DHCP entregará a los equipos (la IP del router en esa red).'],
  [/^dns-server /, 'Servidor DNS que el DHCP entregará a los equipos para traducir nombres (google.com) a direcciones IP.'],
  [/^ip helper-address /, 'Reenvía las peticiones DHCP de esta red al servidor DHCP, que está en otra red.'],
  [/^ip nat inside$/, 'Marca esta interfaz como el lado de dentro (la red privada de la empresa).'],
  [/^ip nat outside$/, 'Marca esta interfaz como el lado de fuera (Internet).'],
  [/^ip nat inside source list \S+ interface \S+ overload$/, 'PAT: todos los equipos de la ACL salen a Internet compartiendo la IP pública de esa interfaz.'],
  [/^ip nat inside source static /, 'NAT estática: un servidor interno tendrá siempre la misma IP pública, para que se le pueda llegar desde Internet.'],
  [/^ip dhcp snooping$/, 'Activa DHCP snooping: protege contra servidores DHCP falsos que podrían enviar a los usuarios a un atacante.'],
  [/^ip dhcp snooping vlan /, 'Indica en qué VLAN actúa DHCP snooping.'],
  [/^ip dhcp snooping trust$/, 'Marca este puerto como de confianza: por aquí sí pueden llegar respuestas DHCP (va hacia el servidor legítimo).'],
  [/^ip arp inspection trust$/, 'Puerto de confianza para la inspección ARP: no se revisan los ARP que llegan por él.'],
  [/^ip arp inspection vlan /, 'Activa la inspección ARP en esa VLAN: descarta ARP falsos usados para espiar el tráfico.'],
  [/^ip dhcp snooping limit rate /, 'Limita cuántos mensajes DHCP por segundo acepta el puerto, para frenar ataques que agotan las direcciones.'],
  [/^spanning-tree portfast$/, 'PortFast: el puerto de un PC empieza a funcionar al instante, sin esperar los 30 segundos de Spanning Tree.'],
  [/^spanning-tree bpduguard enable$/, 'BPDU Guard: si alguien conecta un switch en este puerto, se apaga para evitar bucles.'],
  [/^ipv6 unicast-routing$/, 'Activa el enrutamiento IPv6. Sin él, el router no reenvía paquetes IPv6.'],
  [/^ipv6 address \S+ link-local$/, 'Fija la dirección link-local (fe80::), la que se usa para hablar solo con los vecinos del mismo enlace.'],
  [/^ipv6 address \S+ eui-64$/, 'El router completa la dirección IPv6 a partir de su MAC (EUI-64).'],
  [/^ipv6 address /, 'Da a la interfaz una dirección IPv6 global con su prefijo.'],
  [/^ipv6 route ::\/0 /, 'Ruta por defecto IPv6: todo lo desconocido va a ese router.'],
  [/^ipv6 route /, 'Ruta estática IPv6 hacia esa red.'],
];

export function explicar(linea) {
  const l = String(linea).trim().replace(/\s+/g, ' ');
  return EXPLICA.find(([re]) => re.test(l))?.[1] || null;
}

const LIBRES = ['p', 't', 'd']; // contraseña, texto del banner, descripción: el alumno puede escribir lo que quiera

// Pasos de la guía de un laboratorio: [{ linea, que, modo, sufijo, modoDespues, p, args, ctx, libre }]
export function construirGuia(lab) {
  const eq = nuevoEquipo(lab.equipo);
  return lab.solucion.map(linea => {
    const modo = eq.modo, antes = prompt(eq), sufijo = antes.slice(eq.hostname.length);
    ejecutar(eq, linea);
    const u = eq.ultimo || { p: null, args: {} };
    const libres = [...u.p?.matchAll(/<(\w+):rest>/g) || []].map(m => m[1]).filter(n => LIBRES.includes(n));
    return {
      linea, que: explicar(linea), modo, sufijo, prompt: antes, promptDespues: prompt(eq), modoDespues: eq.modo, sufijoDespues: prompt(eq).slice(eq.hostname.length),
      p: u.p, args: u.args, ctx: /ifrange/.test(u.p || '') ? JSON.stringify(eq.ctx) : null, libre: libres.length > 0, libres,
    };
  });
}

// ¿El último comando que ejecutó el alumno equivale al de este paso?
export function coincide(paso, eq) {
  const u = eq.ultimo;
  if (!u || !paso.p || u.p !== paso.p) return false;
  if (paso.ctx && JSON.stringify(eq.ctx) !== paso.ctx) return false;
  return Object.entries(paso.args).every(([k, v]) => paso.libres.includes(k) || /ifrange/.test(paso.p) || String(u.args[k]) === String(v));
}

// Busca el paso que acaba de hacer el alumno entre el actual y unos pocos más adelante (por si se adelanta).
export function avanzar(guia, i, eq, margen = 3) {
  for (let k = i; k < Math.min(guia.length, i + margen); k++) if (coincide(guia[k], eq)) return k + 1;
  return i;
}

const esConfig = m => m && m !== 'user' && m !== 'priv';

// Si el alumno no está en el modo que pide el paso, cómo llegar. null si ya está en el sitio correcto.
export function consejoModo(guia, i, actual) {
  const paso = guia[i];
  if (!paso || paso.modo === actual) return null;
  const objetivo = paso.modo;
  if (objetivo === 'priv') return actual === 'user' ? 'Escribe primero enable para pasar al modo privilegiado (#).' : 'Escribe end (o presiona Ctrl+Z) para volver al modo privilegiado (#).';
  if (objetivo === 'config') {
    if (actual === 'user') return 'Escribe primero enable y después configure terminal.';
    if (actual === 'priv') return 'Escribe primero configure terminal para entrar en la configuración global.';
    return 'Escribe exit para volver a la configuración global, (config)#.';
  }
  if (objetivo === 'user') return 'Escribe disable para volver al modo usuario (>).';
  let entrada = null;
  for (let j = i - 1; j >= 0; j--) if (guia[j].modoDespues === objetivo && guia[j].modo !== objetivo) { entrada = guia[j].linea; break; }
  const previo = actual === 'user' ? 'Escribe enable y configure terminal, y después ' : actual === 'priv' ? 'Escribe configure terminal y después ' : esConfig(actual) && actual !== 'config' ? 'Sal con exit y después ' : '';
  return entrada ? `${previo}${previo ? 'entra' : 'Entra'} con «${entrada}».` : `Este comando va en ${NOMBRE_MODO[objetivo]}.`;
}

// Traduce al español los mensajes de error de IOS para quien empieza.
export function traducirError(salida) {
  if (/% Ambiguous command/.test(salida)) return 'La abreviatura es demasiado corta y vale para varios comandos: escribe alguna letra más.';
  if (/% Incomplete command/.test(salida)) return 'Al comando le falta algo al final (un número, un nombre o una dirección). Escribe ? después de un espacio para ver qué espera.';
  if (/% Invalid input/.test(salida)) return 'IOS no entiende ese comando en este modo. Revisa que esté bien escrito y que el prompt sea el correcto: la marca ^ señala dónde está el fallo.';
  return null;
}

// Comandos distintos de un laboratorio, en orden, para la ficha del cuaderno.
export function fichaComandos(lab) {
  const vistos = new Set(), out = [];
  for (const p of construirGuia(lab)) {
    const clave = p.que || p.linea;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    out.push(p);
  }
  return out;
}

// «Ordena los comandos»: la secuencia del ejercicio (pasos seguidos de la guía, sin repetir el mismo comando).
export function secuenciaOrdenar(lab, max = 7) {
  const out = [], vistos = new Set();
  for (const p of construirGuia(lab)) {
    if (out.length >= max) break;
    if (vistos.has(p.linea)) continue;
    vistos.add(p.linea);
    out.push(p);
  }
  return out;
}

// ¿Se puede colocar ahora este paso? Vale el siguiente de la solución o cualquiera intercambiable con él: varios
// comandos seguidos del mismo modo que no cambian de modo pueden ir en cualquier orden (hostname y enable secret, p. ej.).
export function puedeIr(restantes, paso) {
  const k = restantes.indexOf(paso);
  if (k === 0) return true;
  if (k < 0) return false;
  const quieto = p => p.modo === p.modoDespues && p.modo === restantes[0].modo;
  return restantes.slice(0, k + 1).every(quieto);
}

// «¿En qué modo estoy?»: rondas a partir de los prompts de los laboratorios guiados.
export function rondasModos(labs, n = 8, rnd = Math.random) {
  const porModo = new Map();
  for (const lab of labs) for (const p of construirGuia(lab)) {
    if (!porModo.has(p.modo)) porModo.set(p.modo, []);
    porModo.get(p.modo).push(p);
  }
  const modos = [...porModo.keys()].filter(m => m !== 'acl-ext');
  const rondas = [];
  for (let i = 0; i < n; i++) {
    const modo = modos[i % modos.length];
    const lista = porModo.get(modo);
    const p = lista[Math.floor(rnd() * lista.length)];
    const otros = modos.filter(m => m !== modo && NOMBRE_MODO[m] !== NOMBRE_MODO[modo]).sort(() => rnd() - 0.5).slice(0, 3);
    const opciones = [modo, ...otros].sort(() => rnd() - 0.5);
    rondas.push(i % 2 === 0
      ? { tipo: 'prompt', pregunta: p.prompt, correcta: modo, opciones, paso: p }
      : { tipo: 'comando', pregunta: p.linea, correcta: modo, opciones, paso: p });
  }
  return rondas.sort(() => rnd() - 0.5);
}
