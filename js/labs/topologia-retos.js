// Retos del simulador de topologías. Cada reto parte de una red (algunos equipos ya colocados o configurados) y tiene
// tareas que se comprueban solas con el motor. Las tareas de ping exigen que el alumno haya lanzado ese ping (h guarda
// 'ok:PC1>PC3' o 'fallo:PC1>PC3') y que siga funcionando con la configuración actual.
import { nuevaTopologia, agregarEquipo, conectar, equipo, conectados, puertoHacia, pingEquipo, buscarRuta, mascaraDe, enRed, ipDeHost, poolValido, interfacesL3 } from './topologia.js';

// '192.168.1.10/24' → { ip, mask }
const ipm = s => { const [ip, p] = s.split('/'); return { ip, mask: mascaraDe(+p) }; };

function construir({ equipos = [], cables = [], puertos = {} }) {
  const t = nuevaTopologia();
  for (const [tipo, nombre, x, y, c = {}] of equipos) {
    const e = agregarEquipo(t, tipo, { nombre, x, y, nota: c.nota, fijo: true });
    if (c.ip) Object.assign(e.ifs.Fa0, ipm(c.ip));
    if (c.gw) e.gw = c.gw;
    if (c.dhcp) e.dhcp = true;
    for (const [p, cfg] of Object.entries(c.ifs || {})) Object.assign(e.ifs[p], cfg.ip ? { ...cfg, ...ipm(cfg.ip) } : cfg);
    if (c.rutas) e.rutas = c.rutas;
  }
  for (const [a, pa, b, pb] of cables) { const r = conectar(t, a, b, pa, pb); if (!r.ok) throw new Error(r.motivo); }
  for (const [sw, cfg] of Object.entries(puertos)) for (const [p, v] of Object.entries(cfg)) Object.assign(equipo(t, sw).ifs[p], typeof v === 'number' ? { vlan: v } : v);
  return t;
}

export const pingHecho = (t, h, a, b) => h.has(`ok:${a}>${b}`) && pingEquipo(t, a, b).ok;
const pingFallido = (t, h, a, b) => h.has(`fallo:${a}>${b}`) && !pingEquipo(t, a, b).ok;
const ifIgual = (t, eq, p, ip, pre) => { const i = equipo(t, eq)?.ifs[p]; return !!i && String(i.ip).trim() === ip && i.mask === mascaraDe(pre); };
const vlanPuerto = (t, sw, pc, v) => { const p = puertoHacia(t, sw, pc); const i = p && equipo(t, sw).ifs[p]; return !!i && i.modo !== 'trunk' && +i.vlan === v; };
const troncal = (t, a, b) => { const p = puertoHacia(t, a, b); return !!p && equipo(t, a).ifs[p].modo === 'trunk'; };
const sub = (t, r, p, vlan, ip, pre) => (equipo(t, r)?.ifs[p]?.subs || []).some(s => +s.vlan === vlan && String(s.ip).trim() === ip && s.mask === mascaraDe(pre));
const rutaS = (t, r, destino, via) => { const x = buscarRuta(t, r, destino); return !!x && x.cod.startsWith('S') && x.via === via; };

const LAN_PCS = ['PC1', 'PC2', 'PC3'];
const T = (texto, ok) => ({ texto, ok });

export const RETOS = {
  lan: {
    titulo: 'Tu primera LAN', nivel: 'principiante',
    intro: 'Tres PC y un switch, todavía sin cables ni direcciones. Conéctalos, dales una IP de la misma red y comprueba que se ven.',
    inicial: () => construir({ equipos: [['switch', 'SW1', 400, 110], ['pc', 'PC1', 170, 330], ['pc', 'PC2', 400, 360], ['pc', 'PC3', 630, 330]] }),
    tareas: [
      T('Conecta PC1, PC2 y PC3 al switch SW1 (herramienta Cable: toca un PC y después el switch).', t => LAN_PCS.every(p => conectados(t, p, 'SW1'))),
      T('Da a cada PC una IP distinta de la red 192.168.1.0/24 con la máscara 255.255.255.0.', t => {
        const ips = LAN_PCS.map(p => equipo(t, p).ifs.Fa0);
        return ips.every(i => enRed(i.ip, '192.168.1.0', '255.255.255.0') && i.mask === '255.255.255.0' && ipDeHost(i.ip, i.mask)) && new Set(ips.map(i => i.ip.trim())).size === 3;
      }),
      T('Haz ping de PC1 a PC3 y comprueba que responde.', (t, h) => pingHecho(t, h, 'PC1', 'PC3')),
    ],
    pistas: ['Pulsa «Cable», toca PC1 y luego SW1. Repite con los otros dos.', 'Selecciona cada PC y escribe, por ejemplo, 192.168.1.10, .11 y .12 con la máscara 255.255.255.0.', 'En «Probar con ping», elige PC1 como origen y PC3 como destino.'],
  },
  gateway: {
    titulo: 'Dos redes unidas por un router', nivel: 'principiante',
    intro: 'La oficina tiene dos LAN: 192.168.1.0/24 (SW1) y 192.168.2.0/24 (SW2). Los PC ya tienen IP, pero no salen de su red. Configura el router y las puertas de enlace.',
    inicial: () => construir({
      equipos: [['router', 'R1', 400, 60], ['switch', 'SW1', 220, 180], ['switch', 'SW2', 580, 180],
        ['pc', 'PC1', 110, 350, { ip: '192.168.1.10/24' }], ['pc', 'PC2', 320, 350, { ip: '192.168.1.11/24' }], ['pc', 'PC3', 580, 350, { ip: '192.168.2.10/24' }]],
      cables: [['PC1', 'Fa0', 'SW1', 'Fa0/1'], ['PC2', 'Fa0', 'SW1', 'Fa0/2'], ['PC3', 'Fa0', 'SW2', 'Fa0/1'], ['SW1', 'Gi0/1', 'R1', 'Gi0/0'], ['SW2', 'Gi0/1', 'R1', 'Gi0/1']],
    }),
    tareas: [
      T('Configura en R1 la IP 192.168.1.1/24 en Gi0/0 y 192.168.2.1/24 en Gi0/1.', t => ifIgual(t, 'R1', 'Gi0/0', '192.168.1.1', 24) && ifIgual(t, 'R1', 'Gi0/1', '192.168.2.1', 24)),
      T('Enciende Gi0/0 y Gi0/1 de R1 (en un router Cisco las interfaces vienen apagadas).', t => ['Gi0/0', 'Gi0/1'].every(p => equipo(t, 'R1').ifs[p].on)),
      T('Pon a cada PC su puerta de enlace: la IP del router en su red.', t => equipo(t, 'PC1').gw.trim() === '192.168.1.1' && equipo(t, 'PC2').gw.trim() === '192.168.1.1' && equipo(t, 'PC3').gw.trim() === '192.168.2.1'),
      T('Haz ping de PC1 a PC3, de una red a la otra.', (t, h) => pingHecho(t, h, 'PC1', 'PC3')),
    ],
    pistas: ['Selecciona R1: cada interfaz tiene su IP, su máscara y la casilla «Encendida».', 'La puerta de enlace de un PC es la IP del router en la red de ese PC.', 'Si el ping falla, lee el motivo: dice en qué equipo se para el paquete.'],
  },
  vlan: {
    titulo: 'Separar departamentos con VLAN', nivel: 'intermedio',
    intro: 'PC1 y PC2 son de Ventas; PC3 y PC4, de Soporte. Todos están en el mismo switch y en la misma red, así que hoy se ven entre todos. Sepáralos con VLAN.',
    inicial: () => construir({
      equipos: [['switch', 'SW1', 400, 110], ['pc', 'PC1', 130, 340, { ip: '192.168.1.11/24', nota: 'Ventas' }], ['pc', 'PC2', 310, 350, { ip: '192.168.1.12/24', nota: 'Ventas' }],
        ['pc', 'PC3', 490, 350, { ip: '192.168.1.13/24', nota: 'Soporte' }], ['pc', 'PC4', 670, 340, { ip: '192.168.1.14/24', nota: 'Soporte' }]],
      cables: [['PC1', 'Fa0', 'SW1', 'Fa0/1'], ['PC2', 'Fa0', 'SW1', 'Fa0/2'], ['PC3', 'Fa0', 'SW1', 'Fa0/3'], ['PC4', 'Fa0', 'SW1', 'Fa0/4']],
    }),
    tareas: [
      T('Pon en la VLAN 10 los puertos de SW1 donde están PC1 y PC2 (Ventas).', t => vlanPuerto(t, 'SW1', 'PC1', 10) && vlanPuerto(t, 'SW1', 'PC2', 10)),
      T('Pon en la VLAN 20 los puertos de PC3 y PC4 (Soporte).', t => vlanPuerto(t, 'SW1', 'PC3', 20) && vlanPuerto(t, 'SW1', 'PC4', 20)),
      T('Comprueba con ping que PC1 llega a PC2 y que PC3 llega a PC4.', (t, h) => pingHecho(t, h, 'PC1', 'PC2') && pingHecho(t, h, 'PC3', 'PC4')),
      T('Comprueba con ping que PC1 ya NO llega a PC3: las VLAN los separan.', (t, h) => vlanPuerto(t, 'SW1', 'PC1', 10) && vlanPuerto(t, 'SW1', 'PC3', 20) && pingFallido(t, h, 'PC1', 'PC3')),
    ],
    pistas: ['Selecciona SW1: la tabla muestra qué equipo hay en cada puerto y su VLAN.', 'Cambia la VLAN de Fa0/1 y Fa0/2 a 10, y la de Fa0/3 y Fa0/4 a 20.', 'Un ping que falla también cuenta: aquí demuestra que el aislamiento funciona.'],
  },
  troncal: {
    titulo: 'Dos switches unidos por un troncal', nivel: 'intermedio',
    intro: 'Ventas (VLAN 10) y Soporte (VLAN 20) tienen un PC en cada switch. Los puertos de los PC ya están en su VLAN, pero el enlace entre SW1 y SW2 es de acceso y solo lleva la VLAN 1.',
    inicial: () => construir({
      equipos: [['switch', 'SW1', 230, 130], ['switch', 'SW2', 570, 130],
        ['pc', 'PC1', 110, 340, { ip: '192.168.10.11/24', nota: 'Ventas' }], ['pc', 'PC2', 330, 350, { ip: '192.168.20.11/24', nota: 'Soporte' }],
        ['pc', 'PC3', 470, 350, { ip: '192.168.10.12/24', nota: 'Ventas' }], ['pc', 'PC4', 690, 340, { ip: '192.168.20.12/24', nota: 'Soporte' }]],
      cables: [['PC1', 'Fa0', 'SW1', 'Fa0/1'], ['PC2', 'Fa0', 'SW1', 'Fa0/2'], ['PC3', 'Fa0', 'SW2', 'Fa0/1'], ['PC4', 'Fa0', 'SW2', 'Fa0/2'], ['SW1', 'Gi0/1', 'SW2', 'Gi0/1']],
      puertos: { SW1: { 'Fa0/1': 10, 'Fa0/2': 20 }, SW2: { 'Fa0/1': 10, 'Fa0/2': 20 } },
    }),
    tareas: [
      T('Configura como troncal (trunk) el enlace entre SW1 y SW2, en los dos extremos.', t => troncal(t, 'SW1', 'SW2') && troncal(t, 'SW2', 'SW1')),
      T('Haz ping de PC1 a PC3 (Ventas, cada uno en un switch).', (t, h) => pingHecho(t, h, 'PC1', 'PC3')),
      T('Haz ping de PC2 a PC4 (Soporte).', (t, h) => pingHecho(t, h, 'PC2', 'PC4')),
    ],
    pistas: ['El enlace entre switches es Gi0/1 en los dos.', 'Un puerto troncal lleva todas las VLAN con su etiqueta 802.1Q.', 'Si solo cambias un lado, el otro sigue siendo de acceso y descarta las tramas etiquetadas.'],
  },
  intervlan: {
    titulo: 'Router-on-a-stick: enrutar entre VLAN', nivel: 'intermedio',
    intro: 'Las VLAN 10 (192.168.10.0/24) y 20 (192.168.20.0/24) ya llegan a los dos switches. Ahora Ventas y Soporte deben poder hablar a través de R1, con un único cable y una subinterfaz por VLAN.',
    inicial: () => construir({
      equipos: [['router', 'R1', 400, 45], ['switch', 'SW1', 230, 170], ['switch', 'SW2', 570, 170],
        ['pc', 'PC1', 110, 360, { ip: '192.168.10.11/24', gw: '192.168.10.1', nota: 'Ventas' }], ['pc', 'PC2', 330, 370, { ip: '192.168.20.11/24', gw: '192.168.20.1', nota: 'Soporte' }],
        ['pc', 'PC3', 470, 370, { ip: '192.168.10.12/24', gw: '192.168.10.1', nota: 'Ventas' }], ['pc', 'PC4', 690, 360, { ip: '192.168.20.12/24', gw: '192.168.20.1', nota: 'Soporte' }]],
      cables: [['PC1', 'Fa0', 'SW1', 'Fa0/1'], ['PC2', 'Fa0', 'SW1', 'Fa0/2'], ['PC3', 'Fa0', 'SW2', 'Fa0/1'], ['PC4', 'Fa0', 'SW2', 'Fa0/2'], ['SW1', 'Gi0/1', 'SW2', 'Gi0/1'], ['SW1', 'Gi0/2', 'R1', 'Gi0/0']],
      puertos: { SW1: { 'Fa0/1': 10, 'Fa0/2': 20, 'Gi0/1': { modo: 'trunk' } }, SW2: { 'Fa0/1': 10, 'Fa0/2': 20, 'Gi0/1': { modo: 'trunk' } } },
    }),
    tareas: [
      T('Pon en modo troncal el puerto de SW1 que va a R1.', t => troncal(t, 'SW1', 'R1')),
      T('En R1, crea la subinterfaz Gi0/0.10 (VLAN 10) con 192.168.10.1/24 y la Gi0/0.20 (VLAN 20) con 192.168.20.1/24.', t => sub(t, 'R1', 'Gi0/0', 10, '192.168.10.1', 24) && sub(t, 'R1', 'Gi0/0', 20, '192.168.20.1', 24)),
      T('Enciende Gi0/0 de R1: las subinterfaces dependen de ella.', t => equipo(t, 'R1').ifs['Gi0/0'].on),
      T('Haz ping de PC1 (Ventas) a PC4 (Soporte): ahora pasa por el router.', (t, h) => pingHecho(t, h, 'PC1', 'PC4')),
    ],
    pistas: ['Selecciona R1 y pulsa «+ Subinterfaz» en Gi0/0.', 'Cada subinterfaz necesita su VLAN, su IP y su máscara; la interfaz física se queda sin IP.', 'La IP de cada subinterfaz es la puerta de enlace que ya tienen los PC de esa VLAN.'],
  },
  estaticas: {
    titulo: 'Rutas estáticas entre dos sedes', nivel: 'intermedio',
    intro: 'La sede A (192.168.1.0/24) y la sede B (192.168.2.0/24) están unidas por el enlace 10.0.12.0/30 entre R1 y R2. Todo está configurado y encendido, pero cada router solo conoce sus redes conectadas.',
    inicial: () => construir({
      equipos: [['pc', 'PC1', 80, 340, { ip: '192.168.1.10/24', gw: '192.168.1.1' }], ['switch', 'SW1', 190, 210],
        ['router', 'R1', 320, 90, { ifs: { 'Gi0/0': { ip: '192.168.1.1/24', on: true }, 'Gi0/1': { ip: '10.0.12.1/30', on: true } } }],
        ['router', 'R2', 480, 90, { ifs: { 'Gi0/0': { ip: '192.168.2.1/24', on: true }, 'Gi0/1': { ip: '10.0.12.2/30', on: true } } }],
        ['switch', 'SW2', 610, 210], ['pc', 'PC2', 720, 340, { ip: '192.168.2.10/24', gw: '192.168.2.1' }]],
      cables: [['PC1', 'Fa0', 'SW1', 'Fa0/1'], ['SW1', 'Gi0/1', 'R1', 'Gi0/0'], ['R1', 'Gi0/1', 'R2', 'Gi0/1'], ['R2', 'Gi0/0', 'SW2', 'Gi0/1'], ['SW2', 'Fa0/1', 'PC2', 'Fa0']],
    }),
    tareas: [
      T('Añade en R1 una ruta estática hacia la red 192.168.2.0/24 por 10.0.12.2.', t => rutaS(t, 'R1', '192.168.2.10', '10.0.12.2')),
      T('Añade en R2 la ruta de vuelta hacia 192.168.1.0/24 por 10.0.12.1.', t => rutaS(t, 'R2', '192.168.1.10', '10.0.12.1')),
      T('Haz ping de PC1 a PC2.', (t, h) => pingHecho(t, h, 'PC1', 'PC2')),
    ],
    pistas: ['Una ruta estática tiene tres datos: red de destino, máscara y siguiente salto.', 'El siguiente salto es la IP del router vecino en el enlace que los une.', 'Si la petición llega pero la respuesta no vuelve, falta la ruta de vuelta.'],
  },
  dhcp: {
    titulo: 'Un servidor DHCP para la oficina', nivel: 'intermedio',
    intro: 'Los tres PC están configurados para pedir su IP por DHCP, pero nadie se la da. Activa el servicio DHCP en SRV1 y haz que cada PC obtenga su dirección.',
    inicial: () => construir({
      equipos: [['router', 'R1', 150, 90, { ifs: { 'Gi0/0': { ip: '192.168.1.1/24', on: true } } }], ['switch', 'SW1', 400, 160],
        ['servidor', 'SRV1', 650, 90, { ip: '192.168.1.5/24', gw: '192.168.1.1' }],
        ['pc', 'PC1', 200, 350, { dhcp: true }], ['pc', 'PC2', 400, 370, { dhcp: true }], ['pc', 'PC3', 600, 350, { dhcp: true }]],
      cables: [['R1', 'Gi0/0', 'SW1', 'Gi0/1'], ['SRV1', 'Fa0', 'SW1', 'Fa0/8'], ['PC1', 'Fa0', 'SW1', 'Fa0/1'], ['PC2', 'Fa0', 'SW1', 'Fa0/2'], ['PC3', 'Fa0', 'SW1', 'Fa0/3']],
    }),
    tareas: [
      T('En SRV1, crea un rango DHCP de la red 192.168.1.0/24 (por ejemplo desde 192.168.1.100) con la puerta de enlace 192.168.1.1.', t => (equipo(t, 'SRV1').pools || []).some(p => poolValido(p) && enRed(p.inicio, '192.168.1.0', '255.255.255.0') && String(p.gw).trim() === '192.168.1.1')),
      T('Haz que PC1, PC2 y PC3 obtengan su IP por DHCP (botón «Pedir IP»).', t => LAN_PCS.every(p => { const e = equipo(t, p); return e.dhcp && e.concedida && enRed(e.ifs.Fa0.ip, '192.168.1.0', '255.255.255.0'); })),
      T('Haz ping de PC1 al servidor SRV1.', (t, h) => pingHecho(t, h, 'PC1', 'SRV1')),
    ],
    pistas: ['Selecciona SRV1 y rellena «Servicio DHCP»: primera IP, cantidad, máscara y puerta de enlace.', 'El rango no debe incluir IP ya usadas: el router es la .1 y el servidor la .5.', 'Después selecciona cada PC y pulsa «Pedir IP».'],
  },
  averias: {
    titulo: 'La red que no funciona', nivel: 'avanzado',
    intro: 'Ayer funcionaba todo. Hoy hay cuatro errores escondidos en esta red: en los PC, en un switch y en el router. Encuéntralos con ping, leyendo dónde se para cada paquete, y arréglalos.',
    inicial: () => construir({
      equipos: [['router', 'R1', 400, 50, { ifs: { 'Gi0/0': { ip: '192.168.1.1/24', on: true }, 'Gi0/1': { ip: '192.168.2.1/24', on: false } } }],
        ['switch', 'SW1', 220, 180], ['switch', 'SW2', 580, 180],
        ['pc', 'PC1', 110, 350, { ip: '192.168.1.10/24', gw: '192.168.1.1' }], ['pc', 'PC2', 310, 360, { ip: '192.168.1.11/24', gw: '192.168.1.254' }],
        ['pc', 'PC3', 490, 360, { ip: '192.168.2.10/16', gw: '192.168.2.1' }], ['pc', 'PC4', 690, 350, { ip: '192.168.2.11/24', gw: '192.168.2.1' }]],
      cables: [['PC1', 'Fa0', 'SW1', 'Fa0/1'], ['PC2', 'Fa0', 'SW1', 'Fa0/2'], ['PC3', 'Fa0', 'SW2', 'Fa0/1'], ['PC4', 'Fa0', 'SW2', 'Fa0/2'], ['SW1', 'Gi0/1', 'R1', 'Gi0/0'], ['SW2', 'Gi0/1', 'R1', 'Gi0/1']],
      puertos: { SW2: { 'Fa0/2': 30 } },
    }),
    tareas: [
      T('Haz ping de PC1 a PC3.', (t, h) => pingHecho(t, h, 'PC1', 'PC3')),
      T('Haz ping de PC2 a PC4.', (t, h) => pingHecho(t, h, 'PC2', 'PC4')),
      T('Haz ping de PC4 a PC1.', (t, h) => pingHecho(t, h, 'PC4', 'PC1')),
    ],
    pistas: ['Empieza por lo más cercano: haz ping del PC a su puerta de enlace.', 'Revisa en cada PC IP, máscara y puerta de enlace; en los switches, la VLAN de cada puerto; en el router, que las interfaces estén encendidas.', 'Si la petición llega pero la respuesta no vuelve, el problema está en el equipo que responde: mira bien su máscara.'],
  },
  libre: {
    titulo: 'Modo libre: diseña tu red', nivel: 'principiante', libre: true,
    intro: 'Un lienzo en blanco. Añade PC, servidores, switches y routers, conéctalos y configúralos como quieras. Ideal para repetir lo que ves en las lecciones o preparar un proyecto.',
    inicial: () => nuevaTopologia(),
    tareas: [
      T('Construye al menos dos redes unidas por un router y consigue un ping que pase de una a otra.', (t, h) => [...h].some(k => {
        if (!k.startsWith('ok:')) return false;
        const [a, b] = k.slice(3).split('>');
        const r = pingEquipo(t, a, b);
        return r.ok && r.ida.some(s => equipo(t, s.a)?.tipo === 'router') && equipo(t, a)?.tipo !== 'router' && equipo(t, b)?.tipo !== 'router';
      })),
    ],
    pistas: ['Empieza con dos PC, dos switches y un router en el medio.', 'Cada lado del router es una red distinta (por ejemplo 10.0.1.0/24 y 10.0.2.0/24).', 'No olvides encender las interfaces del router y poner la puerta de enlace en los PC.'],
  },
};

// Comprueba las tareas de un reto. h: Set de pings lanzados ('ok:A>B' / 'fallo:A>B').
export function revisarReto(reto, t, h) {
  return reto.tareas.map(x => { try { return !!x.ok(t, h); } catch { return false; } });
}
// Etiqueta de un ping para el registro: el nombre del equipo destino si la IP es suya, si no la IP.
export const claveDestino = (t, ip) => t.equipos.find(e => interfacesL3(e).some(x => x.ip === ip))?.nombre || ip;
