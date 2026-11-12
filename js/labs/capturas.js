// Visor de capturas de paquetes (al estilo de Wireshark): capturas de ejemplo, filtros de visualización y detalle por
// capas. Sin DOM: se prueba en Node.

// ---------------------------------------------------------------- construcción de paquetes
const MAC = { pc: '3c:52:82:1a:2b:3c', gw: '00:1e:7a:4c:10:01', bc: 'ff:ff:ff:ff:ff:ff', srv: '00:50:56:a1:22:33', pc2: '3c:52:82:99:00:11', rogue: 'b8:27:eb:12:34:56' };
const P = (n, t, o) => ({ n, t, ...o });

function longitud(p) { return 14 + (p.arp ? 28 : 20 + (p.tcp ? 20 : p.udp ? 8 : p.icmp ? 8 : 0) + (p.payload || 0)); }
function protocolo(p) { return p.arp ? 'ARP' : p.dhcp ? 'DHCP' : p.dns ? 'DNS' : p.http ? 'HTTP' : p.tls ? 'TLSv1.3' : p.icmp ? 'ICMP' : p.tcp ? 'TCP' : p.udp ? 'UDP' : 'IPv4'; }
const FLAGS = f => f.split('').map(c => ({ S: 'SYN', A: 'ACK', F: 'FIN', R: 'RST', P: 'PSH' }[c])).join(', ');
function info(p) {
  if (p.arp) return p.arp.op === 1 ? `Who has ${p.arp.tpa}? Tell ${p.arp.spa}` : `${p.arp.spa} is at ${p.arp.sha}`;
  if (p.dhcp) return `DHCP ${p.dhcp.tipo} - Transaction ID 0x${p.dhcp.xid}${p.dhcp.ip ? ' · IP ofrecida ' + p.dhcp.ip : ''}`;
  if (p.dns) return p.dns.resp ? `Standard query response ${p.dns.id} A ${p.dns.nombre}${p.dns.ip ? ' A ' + p.dns.ip : ' No such name'}` : `Standard query ${p.dns.id} A ${p.dns.nombre}`;
  if (p.http) return p.http;
  if (p.tls) return p.tls;
  if (p.icmp) return `Echo (ping) ${p.icmp.tipo === 8 ? 'request' : 'reply'}  id=0x0001, seq=${p.icmp.seq}/${p.icmp.seq * 256}, ttl=${p.ip.ttl}`;
  if (p.tcp) return `${p.tcp.sport} → ${p.tcp.dport} [${FLAGS(p.tcp.flags)}] Seq=${p.tcp.seq} ${p.tcp.flags.includes('A') ? 'Ack=' + p.tcp.ack + ' ' : ''}Win=${p.tcp.win || 64240} Len=${p.payload || 0}`;
  return '';
}
export function fila(p) {
  return { n: p.n, t: p.t.toFixed(6), src: p.ip?.src || p.eth.src, dst: p.ip?.dst || p.eth.dst, proto: protocolo(p), len: longitud(p), info: info(p) };
}

// Árbol de detalle por capas, como el panel central de Wireshark.
export function detalle(p) {
  const capas = [[`Frame ${p.n}: ${longitud(p)} bytes`, [`Tiempo desde el inicio: ${p.t.toFixed(6)} s`]]];
  capas.push([`Ethernet II, Src: ${p.eth.src}, Dst: ${p.eth.dst}`, [`Destino: ${p.eth.dst}${p.eth.dst === MAC.bc ? ' (broadcast)' : ''}`, `Origen: ${p.eth.src}`, `Tipo: ${p.arp ? 'ARP (0x0806)' : 'IPv4 (0x0800)'}`]]);
  if (p.arp) capas.push([`Address Resolution Protocol (${p.arp.op === 1 ? 'request' : 'reply'})`, [`Opcode: ${p.arp.op === 1 ? 'request (1)' : 'reply (2)'}`, `Sender MAC address: ${p.arp.sha}`, `Sender IP address: ${p.arp.spa}`, `Target MAC address: ${p.arp.tha}`, `Target IP address: ${p.arp.tpa}`]]);
  if (p.ip) capas.push([`Internet Protocol Version 4, Src: ${p.ip.src}, Dst: ${p.ip.dst}`, [`Time to Live: ${p.ip.ttl}`, `Protocol: ${p.tcp ? 'TCP (6)' : p.udp ? 'UDP (17)' : 'ICMP (1)'}`, `Source Address: ${p.ip.src}`, `Destination Address: ${p.ip.dst}`]]);
  if (p.icmp) capas.push(['Internet Control Message Protocol', [`Type: ${p.icmp.tipo} (${p.icmp.tipo === 8 ? 'Echo (ping) request' : 'Echo (ping) reply'})`, `Sequence Number: ${p.icmp.seq}`]]);
  if (p.udp) capas.push([`User Datagram Protocol, Src Port: ${p.udp.sport}, Dst Port: ${p.udp.dport}`, [`Source Port: ${p.udp.sport}`, `Destination Port: ${p.udp.dport}`]]);
  if (p.tcp) capas.push([`Transmission Control Protocol, Src Port: ${p.tcp.sport}, Dst Port: ${p.tcp.dport}, Seq: ${p.tcp.seq}`, [`Source Port: ${p.tcp.sport}`, `Destination Port: ${p.tcp.dport}`, `Sequence Number: ${p.tcp.seq}`, `Acknowledgment Number: ${p.tcp.ack ?? 0}`, `Flags: ${FLAGS(p.tcp.flags)}`, `Window: ${p.tcp.win || 64240}`]]);
  if (p.dhcp) capas.push(['Dynamic Host Configuration Protocol (' + p.dhcp.tipo + ')', [`Transaction ID: 0x${p.dhcp.xid}`, `Client MAC address: ${p.dhcp.cliente}`, ...(p.dhcp.ip ? [`Your (client) IP address: ${p.dhcp.ip}`, `Option: (54) DHCP Server Identifier: ${p.ip.src}`, `Option: (3) Router: ${p.dhcp.gw}`, `Option: (6) Domain Name Server: ${p.dhcp.dns}`] : [])]]);
  if (p.dns) capas.push(['Domain Name System (' + (p.dns.resp ? 'response' : 'query') + ')', [`Transaction ID: 0x${p.dns.id}`, `Queries: ${p.dns.nombre}: type A, class IN`, ...(p.dns.resp ? [p.dns.ip ? `Answers: ${p.dns.nombre}: type A, addr ${p.dns.ip}` : 'Reply code: No such name (3)'] : [])]]);
  if (p.http) capas.push(['Hypertext Transfer Protocol', [p.http, ...(p.cabeceras || [])]]);
  if (p.tls) capas.push(['Transport Layer Security', [p.tls, 'El contenido va cifrado: no se puede leer']]);
  return capas;
}

// ---------------------------------------------------------------- filtros de visualización
const CAMPO = {
  'ip.addr': p => [p.ip?.src, p.ip?.dst], 'ip.src': p => [p.ip?.src], 'ip.dst': p => [p.ip?.dst],
  'eth.addr': p => [p.eth.src, p.eth.dst], 'eth.src': p => [p.eth.src], 'eth.dst': p => [p.eth.dst],
  'tcp.port': p => [p.tcp?.sport, p.tcp?.dport].map(x => x && String(x)), 'udp.port': p => [p.udp?.sport, p.udp?.dport].map(x => x && String(x)),
  'tcp.srcport': p => [p.tcp && String(p.tcp.sport)], 'tcp.dstport': p => [p.tcp && String(p.tcp.dport)],
  'tcp.flags.syn': p => [p.tcp ? (p.tcp.flags.includes('S') ? '1' : '0') : undefined], 'tcp.flags.reset': p => [p.tcp ? (p.tcp.flags.includes('R') ? '1' : '0') : undefined],
  'arp.opcode': p => [p.arp && String(p.arp.op)], 'dns.qry.name': p => [p.dns?.nombre], 'dhcp.type': p => [p.dhcp?.tipo?.toLowerCase()],
  'icmp.type': p => [p.icmp && String(p.icmp.tipo)],
};
const PROTO = { eth: () => true, arp: p => !!p.arp, ip: p => !!p.ip, ipv4: p => !!p.ip, icmp: p => !!p.icmp, tcp: p => !!p.tcp, udp: p => !!p.udp, dhcp: p => !!p.dhcp, bootp: p => !!p.dhcp, dns: p => !!p.dns, http: p => !!p.http, tls: p => !!p.tls };

export function compilarFiltro(texto) {
  const toks = String(texto || '').match(/\(|\)|&&|\|\||==|!=|!|\bcontains\b|"[^"]*"|[^\s()!=&|"]+/g) || [];
  let i = 0;
  const ver = () => toks[i], tomar = () => toks[i++];
  function primario() {
    const t = tomar();
    if (t === undefined) throw new Error('Filtro incompleto');
    if (t === '(') { const e = o(); if (tomar() !== ')') throw new Error('Falta cerrar el paréntesis'); return e; }
    if (t === '!' || t === 'not') { const e = primario(); return p => !e(p); }
    const k = t.toLowerCase();
    if (CAMPO[k]) {
      const op = tomar();
      if (!['==', '!=', 'contains'].includes(op)) throw new Error(`Falta el operador después de ${t} (por ejemplo ${t} == valor)`);
      const v = (tomar() || '').replace(/^"|"$/g, '').toLowerCase();
      if (!v) throw new Error('Falta el valor que comparar');
      return op === 'contains' ? p => CAMPO[k](p).some(x => x && String(x).toLowerCase().includes(v)) : op === '==' ? p => CAMPO[k](p).some(x => x && String(x).toLowerCase() === v) : p => !CAMPO[k](p).some(x => x && String(x).toLowerCase() === v);
    }
    if (PROTO[k]) return PROTO[k];
    throw new Error(`«${t}» no es un protocolo ni un campo conocido`);
  }
  function y() { let e = primario(); while (ver() === '&&' || ver() === 'and') { tomar(); const a = e, b = primario(); e = p => a(p) && b(p); } return e; }
  function o() { let e = y(); while (ver() === '||' || ver() === 'or') { tomar(); const a = e, b = y(); e = p => a(p) || b(p); } return e; }
  if (!toks.length) return () => true;
  const f = o();
  if (i < toks.length) throw new Error(`Sobra «${toks[i]}» en el filtro`);
  return f;
}
export function filtrar(paquetes, texto) { const f = compilarFiltro(texto); return paquetes.filter(p => f(p)); }

// ---------------------------------------------------------------- capturas de ejemplo
const dhcp = (n, t, tipo, de, extra = {}) => P(n, t, { eth: { src: de === 'pc' ? MAC.pc : de === 'rogue' ? MAC.rogue : MAC.gw, dst: de === 'pc' ? MAC.bc : MAC.pc }, ip: { src: de === 'pc' ? '0.0.0.0' : de === 'rogue' ? '192.168.0.1' : '192.168.10.1', dst: de === 'pc' ? '255.255.255.255' : '192.168.10.57', ttl: de === 'pc' ? 128 : 64 }, udp: { sport: de === 'pc' ? 68 : 67, dport: de === 'pc' ? 67 : 68 }, dhcp: { tipo, xid: '5d2a71c3', cliente: MAC.pc, ...extra }, payload: 300 });
const tcp = (n, t, src, dst, sport, dport, flags, seq, ack, payload = 0, extra = {}) => P(n, t, { eth: { src: src.startsWith('192.168') ? MAC.pc : MAC.gw, dst: src.startsWith('192.168') ? MAC.gw : MAC.pc }, ip: { src, dst, ttl: src.startsWith('192.168') ? 128 : 54 }, tcp: { sport, dport, flags, seq, ack }, payload, ...extra });
const udpDns = (n, t, src, dst, sport, dns) => P(n, t, { eth: { src: src.startsWith('192.168') ? MAC.pc : MAC.gw, dst: src.startsWith('192.168') ? MAC.gw : MAC.pc }, ip: { src, dst, ttl: src.startsWith('192.168') ? 128 : 54 }, udp: { sport: dns.resp ? 53 : sport, dport: dns.resp ? sport : 53 }, dns, payload: 40 });

export const CAPTURAS = {
  dhcp: {
    titulo: '¿Por qué este PC no recibe IP?',
    intro: 'Un PC nuevo de recepción tiene una dirección 169.254.x.x. Has capturado el tráfico de su tarjeta de red al conectarlo. Investiga qué pasa con DHCP.',
    paquetes: [
      dhcp(1, 0.000000, 'Discover', 'pc'),
      P(2, 0.412500, { eth: { src: MAC.pc2, dst: MAC.bc }, arp: { op: 1, sha: MAC.pc2, spa: '192.168.10.31', tha: '00:00:00:00:00:00', tpa: '192.168.10.1' } }),
      dhcp(3, 0.020311, 'Offer', 'rogue', { ip: '192.168.0.23', gw: '192.168.0.1', dns: '192.168.0.1' }),
      dhcp(4, 4.003118, 'Discover', 'pc'),
      dhcp(5, 4.021920, 'Offer', 'rogue', { ip: '192.168.0.23', gw: '192.168.0.1', dns: '192.168.0.1' }),
      dhcp(6, 4.030004, 'Request', 'pc'),
      dhcp(7, 4.041332, 'ACK', 'rogue', { ip: '192.168.0.23', gw: '192.168.0.1', dns: '192.168.0.1' }),
    ].sort((a, b) => a.t - b.t).map((p, k) => ({ ...p, n: k + 1 })),
    preguntas: [
      { texto: '¿Qué filtro muestra solo el tráfico DHCP?', tipo: 'texto', respuesta: ['dhcp', 'bootp', 'udp.port == 67', 'udp.port == 68'], explicacion: 'El filtro dhcp (o bootp, su nombre antiguo) muestra los paquetes DHCP, que usan los puertos UDP 67 y 68.' },
      { texto: '¿Qué dirección IP tiene el servidor que responde a las peticiones DHCP?', tipo: 'texto', respuesta: ['192.168.0.1'], explicacion: 'Las Offer y el ACK vienen de 192.168.0.1, pero la red de la empresa es 192.168.10.0/24 y su router es 192.168.10.1.' },
      { texto: '¿Cuál es la causa más probable?', tipo: 'opcion', opciones: ['Un servidor DHCP no autorizado (por ejemplo, un router doméstico conectado a la red) está respondiendo', 'El cable del PC está roto', 'El servidor DNS está caído', 'El PC tiene la IP configurada a mano'], respuesta: 0, explicacion: 'Un router doméstico conectado por error (MAC de Raspberry/consumo, red 192.168.0.x) reparte direcciones que no sirven. La defensa en el switch es DHCP snooping.' },
    ],
  },
  web: {
    titulo: 'Qué pasa al abrir una web',
    intro: 'Has capturado el tráfico de un PC mientras el usuario abría intranet.laceiba.example y después un sitio con HTTPS. Sigue la conversación paso a paso.',
    paquetes: [
      udpDns(1, 0.000000, '192.168.10.57', '192.168.10.5', 51344, { id: '8f21', nombre: 'intranet.laceiba.example' }),
      udpDns(2, 0.001820, '192.168.10.5', '192.168.10.57', 51344, { id: '8f21', nombre: 'intranet.laceiba.example', ip: '192.168.10.20', resp: true }),
      tcp(3, 0.002410, '192.168.10.57', '192.168.10.20', 52100, 80, 'S', 0, undefined),
      tcp(4, 0.002901, '192.168.10.20', '192.168.10.57', 80, 52100, 'SA', 0, 1),
      tcp(5, 0.002950, '192.168.10.57', '192.168.10.20', 52100, 80, 'A', 1, 1),
      tcp(6, 0.003120, '192.168.10.57', '192.168.10.20', 52100, 80, 'PA', 1, 1, 412, { http: 'GET /login HTTP/1.1', cabeceras: ['Host: intranet.laceiba.example', 'User-Agent: Mozilla/5.0'] }),
      tcp(7, 0.009880, '192.168.10.20', '192.168.10.57', 80, 52100, 'PA', 1, 413, 1180, { http: 'HTTP/1.1 200 OK  (text/html)', cabeceras: ['Content-Type: text/html'] }),
      tcp(8, 0.050210, '192.168.10.57', '192.168.10.20', 52100, 80, 'PA', 413, 1181, 98, { http: 'POST /login HTTP/1.1  (usuario=mfernandez&clave=Verano2026)', cabeceras: ['Content-Type: application/x-www-form-urlencoded'] }),
      udpDns(9, 1.204100, '192.168.10.57', '192.168.10.5', 50211, { id: '1c07', nombre: 'portal.proveedor.example' }),
      udpDns(10, 1.230500, '192.168.10.5', '192.168.10.57', 50211, { id: '1c07', nombre: 'portal.proveedor.example', ip: '203.0.113.80', resp: true }),
      tcp(11, 1.231000, '192.168.10.57', '203.0.113.80', 52140, 443, 'S', 0, undefined),
      tcp(12, 1.262300, '203.0.113.80', '192.168.10.57', 443, 52140, 'SA', 0, 1),
      tcp(13, 1.262400, '192.168.10.57', '203.0.113.80', 52140, 443, 'A', 1, 1),
      tcp(14, 1.263000, '192.168.10.57', '203.0.113.80', 52140, 443, 'PA', 1, 1, 517, { tls: 'Client Hello (SNI=portal.proveedor.example)' }),
      tcp(15, 1.295100, '203.0.113.80', '192.168.10.57', 443, 52140, 'PA', 1, 518, 1400, { tls: 'Server Hello, Change Cipher Spec, Application Data' }),
      tcp(16, 1.301000, '192.168.10.57', '203.0.113.80', 52140, 443, 'PA', 518, 1401, 380, { tls: 'Application Data' }),
    ],
    preguntas: [
      { texto: '¿Qué dirección IP devolvió el DNS para intranet.laceiba.example?', tipo: 'texto', respuesta: ['192.168.10.20'], explicacion: 'La respuesta DNS (paquete 2) dice que intranet.laceiba.example es 192.168.10.20.' },
      { texto: '¿Qué números de paquete forman el saludo de tres vías (three-way handshake) hacia la intranet? Escríbelos separados por comas.', tipo: 'lista', respuesta: ['3', '4', '5'], explicacion: 'SYN (3), SYN-ACK (4) y ACK (5) abren la conexión TCP al puerto 80.' },
      { texto: 'Filtra con http. ¿Qué problema de seguridad ves?', tipo: 'opcion', opciones: ['El usuario y la contraseña viajan sin cifrar porque la intranet usa HTTP', 'El DNS responde demasiado lento', 'El servidor rechaza la conexión', 'No hay ningún problema'], respuesta: 0, explicacion: 'El POST del paquete 8 lleva la contraseña en claro: cualquiera que capture el tráfico la ve. Con HTTPS (paquetes 14-16) el contenido va cifrado.' },
    ],
  },
  ping: {
    titulo: 'Un ping que no llega',
    intro: 'Desde el PC 192.168.10.57 se hace ping a la impresora 192.168.10.45 y no responde. Observa qué ocurre en la red local.',
    paquetes: [
      P(1, 0.000000, { eth: { src: MAC.pc, dst: MAC.bc }, arp: { op: 1, sha: MAC.pc, spa: '192.168.10.57', tha: '00:00:00:00:00:00', tpa: '192.168.10.45' } }),
      P(2, 1.001200, { eth: { src: MAC.pc, dst: MAC.bc }, arp: { op: 1, sha: MAC.pc, spa: '192.168.10.57', tha: '00:00:00:00:00:00', tpa: '192.168.10.45' } }),
      P(3, 2.002400, { eth: { src: MAC.pc, dst: MAC.bc }, arp: { op: 1, sha: MAC.pc, spa: '192.168.10.57', tha: '00:00:00:00:00:00', tpa: '192.168.10.45' } }),
      P(4, 5.100000, { eth: { src: MAC.pc, dst: MAC.bc }, arp: { op: 1, sha: MAC.pc, spa: '192.168.10.57', tha: '00:00:00:00:00:00', tpa: '192.168.10.1' } }),
      P(5, 5.100410, { eth: { src: MAC.gw, dst: MAC.pc }, arp: { op: 2, sha: MAC.gw, spa: '192.168.10.1', tha: MAC.pc, tpa: '192.168.10.57' } }),
      P(6, 5.100500, { eth: { src: MAC.pc, dst: MAC.gw }, ip: { src: '192.168.10.57', dst: '192.168.10.1', ttl: 128 }, icmp: { tipo: 8, seq: 1 }, payload: 32 }),
      P(7, 5.100980, { eth: { src: MAC.gw, dst: MAC.pc }, ip: { src: '192.168.10.1', dst: '192.168.10.57', ttl: 255 }, icmp: { tipo: 0, seq: 1 }, payload: 32 }),
    ],
    preguntas: [
      { texto: '¿Qué filtro muestra solo las peticiones ARP (no las respuestas)?', tipo: 'texto', respuesta: ['arp.opcode == 1'], explicacion: 'El código de operación 1 es request y el 2 es reply.' },
      { texto: '¿Cuál es la dirección MAC de la puerta de enlace 192.168.10.1?', tipo: 'texto', respuesta: [MAC.gw], explicacion: 'La respuesta ARP (paquete 5) dice que 192.168.10.1 está en ' + MAC.gw + '.' },
      { texto: '¿Qué indica que nadie responda al ARP de 192.168.10.45?', tipo: 'opcion', opciones: ['Que la impresora está apagada, desconectada o en otra VLAN: no llega ni a la capa 2', 'Que el DNS no funciona', 'Que el router bloquea el ping', 'Que falta la puerta de enlace'], respuesta: 0, explicacion: 'Sin respuesta ARP el PC ni siquiera conoce la MAC: el problema está en la impresora o en su conexión, no en el router.' },
    ],
  },
};

// Corrige una respuesta del alumno.
export function corregirPregunta(q, valor) {
  if (q.tipo === 'opcion') return Number(valor) === q.respuesta;
  const v = String(valor || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (q.tipo === 'lista') { const a = v.split(/[,\s]+/).filter(Boolean).sort(); return JSON.stringify(a) === JSON.stringify([...q.respuesta].sort()); }
  return q.respuesta.some(r => r.toLowerCase() === v || r.toLowerCase().replace(/\s/g, '') === v.replace(/\s/g, ''));
}
