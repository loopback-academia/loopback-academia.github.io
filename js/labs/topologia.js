// Simulador de topologías: equipos, cables, VLAN, troncales, subinterfaces, rutas estáticas, DHCP y ping.
// Sin DOM: la interfaz (topologia-ui.js), las pruebas y las preguntas generadas del examen usan este motor.
//
// Modelo:
//   topo = { equipos: [equipo], cables: [{ a: { eq, p }, b: { eq, p } }], sig: n }
//   equipo = { id, tipo: 'pc'|'servidor'|'switch'|'router', nombre, x, y, nota?, fijo?, ifs: { puerto: iface },
//              gw?, dhcp? (PC cliente), concedida?, rutas? [{ red, mask, via }], pools? [{ inicio, cantidad, mask, gw, dns }] }
//   iface PC/servidor: { ip, mask } · switch: { modo: 'access'|'trunk', vlan, on } · router: { ip, mask, on, subs: [{ vlan, ip, mask }] }
//
// La capa 2 se recorre por VLAN (los troncales llevan todas las VLAN; la nativa es la 1 y va sin etiqueta) y la capa 3
// salto a salto con la tabla de rutas de cada equipo y ARP dentro del dominio de difusión. Un ping solo funciona si
// también vuelve la respuesta, como en la realidad.
import { ipNum, ipStr } from './ios.js';

export const PUERTOS = {
  pc: ['Fa0'],
  servidor: ['Fa0'],
  switch: ['Fa0/1', 'Fa0/2', 'Fa0/3', 'Fa0/4', 'Fa0/5', 'Fa0/6', 'Fa0/7', 'Fa0/8', 'Gi0/1', 'Gi0/2'],
  router: ['Gi0/0', 'Gi0/1', 'Gi0/2'],
};
export const NOMBRE_TIPO = { pc: 'PC', servidor: 'Servidor', switch: 'Switch', router: 'Router' };
const PREFIJO = { pc: 'PC', servidor: 'SRV', switch: 'SW', router: 'R' };
export const MAX_EQUIPOS = 16;

// ------------------------------------------------------------------ direcciones
const mascaraNum = p => (p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0);
export const mascaraDe = p => ipStr(mascaraNum(p));
// Acepta «255.255.255.0», «/24» o «24». Devuelve el prefijo (0-32) o null si no es una máscara válida.
export function prefijo(m) {
  const t = String(m ?? '').trim();
  if (/^\/?\d{1,2}$/.test(t)) { const p = +t.replace('/', ''); return p <= 32 ? p : null; }
  const n = ipNum(t);
  if (n == null) return null;
  for (let p = 0; p <= 32; p++) if (mascaraNum(p) === n) return p;
  return null;
}
export const normalizarMascara = m => { const p = prefijo(m); return p == null ? null : mascaraDe(p); };
export const ipValida = ip => ipNum(String(ip ?? '').trim()) != null;
export const redDe = (ip, mask) => ipStr((ipNum(ip) & mascaraNum(prefijo(mask))) >>> 0);
export const broadcastDe = (ip, mask) => ipStr(((ipNum(ip) & mascaraNum(prefijo(mask))) | (~mascaraNum(prefijo(mask)) >>> 0)) >>> 0);
export const enRed = (ip, red, mask) => ipValida(ip) && ipValida(red) && prefijo(mask) != null && redDe(ip, mask) === redDe(red, mask);
// Una IP de host válida para su máscara (ni la dirección de red ni la de broadcast, salvo /31 y /32).
export function ipDeHost(ip, mask) {
  const p = prefijo(mask);
  if (!ipValida(ip) || p == null || p === 0) return false;
  if (p >= 31) return true;
  return ip !== redDe(ip, mask) && ip !== broadcastDe(ip, mask);
}

// ------------------------------------------------------------------ construir
export const nuevaTopologia = () => ({ equipos: [], cables: [], sig: 1 });
export const equipo = (t, ref) => (ref && typeof ref === 'object' ? (t.equipos.includes(ref) ? ref : null) : null) || t.equipos.find(e => e.id === ref) || t.equipos.find(e => e.nombre.toLowerCase() === String(ref).toLowerCase()) || null;

function ifaceNueva(tipo) {
  if (tipo === 'switch') return { modo: 'access', vlan: 1, on: true };
  if (tipo === 'router') return { ip: '', mask: '', on: false, subs: [] };
  return { ip: '', mask: '' };
}
export function nombreLibre(t, tipo) {
  for (let n = 1; ; n++) if (!t.equipos.some(e => e.nombre.toLowerCase() === (PREFIJO[tipo] + n).toLowerCase())) return PREFIJO[tipo] + n;
}
export function agregarEquipo(t, tipo, { nombre, x = 100, y = 100, nota, fijo } = {}) {
  if (!PUERTOS[tipo]) throw new Error('Tipo de equipo desconocido: ' + tipo);
  const e = { id: 'e' + t.sig++, tipo, nombre: nombre || nombreLibre(t, tipo), x, y, ifs: Object.fromEntries(PUERTOS[tipo].map(p => [p, ifaceNueva(tipo)])) };
  if (nota) e.nota = nota;
  if (fijo) e.fijo = true;
  if (tipo === 'pc' || tipo === 'servidor') { e.gw = ''; e.dns = ''; }
  if (tipo === 'pc') e.dhcp = false;
  if (tipo === 'router') e.rutas = [];
  if (tipo === 'servidor') e.pools = [];
  t.equipos.push(e);
  return e;
}
export function quitarEquipo(t, ref) {
  const e = equipo(t, ref);
  if (!e) return false;
  t.cables = t.cables.filter(c => c.a.eq !== e.id && c.b.eq !== e.id);
  t.equipos = t.equipos.filter(x => x !== e);
  return true;
}
export const cableEn = (t, eq, p) => t.cables.find(c => (c.a.eq === eq && c.a.p === p) || (c.b.eq === eq && c.b.p === p)) || null;
export function otroExtremo(t, eq, p) {
  const c = cableEn(t, eq, p);
  if (!c) return null;
  return c.a.eq === eq && c.a.p === p ? c.b : c.a;
}
// Primer puerto libre: entre switches y routers se prefieren los Gigabit; hacia PC, los FastEthernet.
function puertoLibre(t, e, otro) {
  const lista = e.tipo === 'switch' && (otro.tipo === 'switch' || otro.tipo === 'router')
    ? [...PUERTOS.switch.filter(p => p.startsWith('Gi')), ...PUERTOS.switch.filter(p => p.startsWith('Fa'))]
    : PUERTOS[e.tipo];
  return lista.find(p => !cableEn(t, e.id, p)) || null;
}
export function conectar(t, refA, refB, pa, pb) {
  const a = equipo(t, refA), b = equipo(t, refB);
  if (!a || !b) return { ok: false, motivo: 'Equipo desconocido.' };
  if (a === b) return { ok: false, motivo: 'Un cable necesita dos equipos distintos.' };
  pa = pa || puertoLibre(t, a, b);
  pb = pb || puertoLibre(t, b, a);
  if (!pa || !a.ifs[pa]) return { ok: false, motivo: `${a.nombre} no tiene puertos libres.` };
  if (!pb || !b.ifs[pb]) return { ok: false, motivo: `${b.nombre} no tiene puertos libres.` };
  if (cableEn(t, a.id, pa)) return { ok: false, motivo: `${pa} de ${a.nombre} ya tiene un cable.` };
  if (cableEn(t, b.id, pb)) return { ok: false, motivo: `${pb} de ${b.nombre} ya tiene un cable.` };
  const c = { a: { eq: a.id, p: pa }, b: { eq: b.id, p: pb } };
  t.cables.push(c);
  return { ok: true, cable: c };
}
export function desconectar(t, c) { const n = t.cables.length; t.cables = t.cables.filter(x => x !== c); return t.cables.length < n; }
export const conectados = (t, refA, refB) => { const a = equipo(t, refA), b = equipo(t, refB); return !!a && !!b && t.cables.some(c => (c.a.eq === a.id && c.b.eq === b.id) || (c.a.eq === b.id && c.b.eq === a.id)); };
// Puerto de «e» que va hacia el equipo «otro» (el primero, si hay varios).
export function puertoHacia(t, ref, refOtro) {
  const e = equipo(t, ref), o = equipo(t, refOtro);
  if (!e || !o) return null;
  return Object.keys(e.ifs).find(p => otroExtremo(t, e.id, p)?.eq === o.id) || null;
}

// ------------------------------------------------------------------ capa 2
const fisicoOn = (e, p) => e.ifs[p] && e.ifs[p].on !== false;
// Enlace activo: hay cable y los dos extremos están encendidos.
export function enlaceUp(t, eq, p) {
  const e = equipo(t, eq), o = otroExtremo(t, eq, p);
  if (!e || !o || !fisicoOn(e, p)) return false;
  return fisicoOn(equipo(t, o.eq), o.p);
}
// Recorre el dominio de difusión de una trama que sale de (eq, p) con etiqueta «tag» (null = sin etiqueta).
// Devuelve los extremos de capa 3 alcanzados (PC, servidores y routers) con el camino de equipos, y si hay bucles.
export function alcanceL2(t, eq, p, tag) {
  const extremos = [], vistos = new Set();
  let bucle = false;
  const cola = [{ eq, p, tag, camino: [eq] }];
  while (cola.length) {
    const f = cola.shift();
    if (!enlaceUp(t, f.eq, f.p)) continue;
    const o = otroExtremo(t, f.eq, f.p);
    const d = equipo(t, o.eq), i = d.ifs[o.p];
    const camino = [...f.camino, d.id];
    if (d.tipo !== 'switch') { extremos.push({ eq: d.id, p: o.p, tag: f.tag, camino }); continue; }
    let v;
    if (i.modo === 'trunk') v = f.tag == null ? 1 : f.tag;
    else { if (f.tag != null) continue; v = +i.vlan || 1; } // un puerto de acceso descarta las tramas etiquetadas
    const k = d.id + '|' + v;
    if (vistos.has(k)) { bucle = true; continue; }
    vistos.add(k);
    for (const [p2, i2] of Object.entries(d.ifs)) {
      if (p2 === o.p || i2.on === false) continue;
      if (i2.modo === 'trunk') cola.push({ eq: d.id, p: p2, tag: v === 1 ? null : v, camino });
      else if ((+i2.vlan || 1) === v) cola.push({ eq: d.id, p: p2, tag: null, camino });
    }
  }
  return { extremos, bucle };
}
// ¿Hay algún bucle de capa 2 entre switches? (En una red real, STP bloquearía un puerto.)
export function hayBucle(t) {
  return t.equipos.filter(e => e.tipo !== 'switch').some(e => Object.keys(e.ifs).some(p => alcanceL2(t, e.id, p, null).bucle));
}

// ------------------------------------------------------------------ capa 3
// Interfaces con IP de un equipo (las subinterfaces de router llevan su VLAN).
export function interfacesL3(e) {
  if (!e || e.tipo === 'switch') return [];
  const out = [];
  for (const [p, i] of Object.entries(e.ifs)) {
    if (ipValida(i.ip) && prefijo(i.mask) != null) out.push({ eq: e.id, p, vlan: null, nombre: p, ip: i.ip.trim(), mask: normalizarMascara(i.mask), on: i.on !== false });
    for (const s of i.subs || []) if (+s.vlan && ipValida(s.ip) && prefijo(s.mask) != null) out.push({ eq: e.id, p, vlan: +s.vlan, nombre: `${p}.${s.vlan}`, ip: s.ip.trim(), mask: normalizarMascara(s.mask), on: i.on !== false });
  }
  return out;
}
export const ipsDe = e => interfacesL3(e).map(x => x.ip);
export const duenoDeIp = (t, ip) => t.equipos.find(e => ipsDe(e).includes(String(ip).trim())) || null;
export function ipsDuplicadas(t) {
  const vistas = new Map(), dup = new Set();
  for (const e of t.equipos) for (const ip of ipsDe(e)) { if (vistas.has(ip) && vistas.get(ip) !== e.id) dup.add(ip); vistas.set(ip, e.id); }
  return [...dup];
}

// Tabla de rutas: redes conectadas (interfaces con IP y enlace activo), rutas estáticas válidas y, en PC y servidores,
// la ruta por defecto hacia su puerta de enlace.
export function tablaRutas(t, ref) {
  const e = equipo(t, ref);
  if (!e || e.tipo === 'switch') return [];
  const conectadas = interfacesL3(e).filter(x => x.on && enlaceUp(t, e.id, x.p))
    .map(x => ({ cod: 'C', red: redDe(x.ip, x.mask), mask: x.mask, sal: x.nombre, l3: x }));
  const resolubles = via => conectadas.some(c => enRed(via, c.red, c.mask));
  const estaticas = [];
  if (e.tipo === 'router') {
    for (const r of e.rutas || []) {
      const m = normalizarMascara(r.mask);
      if (ipValida(r.red) && m && ipValida(r.via) && resolubles(r.via)) estaticas.push({ cod: r.red === '0.0.0.0' && m === '0.0.0.0' ? 'S*' : 'S', red: redDe(r.red, m), mask: m, via: r.via.trim() });
    }
  } else if (ipValida(e.gw) && resolubles(e.gw)) estaticas.push({ cod: 'S*', red: '0.0.0.0', mask: '0.0.0.0', via: e.gw.trim() });
  return [...conectadas, ...estaticas];
}
const mejor = (rutas, ip) => rutas.filter(r => enRed(ip, r.red, r.mask)).sort((a, b) => prefijo(b.mask) - prefijo(a.mask) || (a.cod === 'C' ? -1 : 1))[0] || null;
export const buscarRuta = (t, ref, ip) => mejor(tablaRutas(t, ref), ip);

function siguienteSalto(t, e, destino) {
  const rutas = tablaRutas(t, e);
  const r = mejor(rutas, destino);
  if (!r) {
    if (e.tipo === 'router') return { error: `${e.nombre} no tiene ninguna ruta hacia ${destino}: descarta el paquete.` };
    const l3 = interfacesL3(e)[0];
    if (!l3) return { error: `${e.nombre} no tiene dirección IP.` };
    if (!cableEn(t, e.id, l3.p)) return { error: `${e.nombre} no tiene cable conectado.` };
    if (!enlaceUp(t, e.id, l3.p)) return { error: `El enlace de ${e.nombre} está caído: el puerto del otro extremo está apagado.` };
    if (!String(e.gw || '').trim()) return { error: `${e.nombre} no tiene puerta de enlace y ${destino} está en otra red.` };
    if (!ipValida(e.gw)) return { error: `La puerta de enlace de ${e.nombre} (${e.gw}) no es una IP válida.` };
    return { error: `La puerta de enlace de ${e.nombre} (${e.gw}) no está en su red (${l3.ip} ${l3.mask}).` };
  }
  if (r.cod === 'C') return { l3: r.l3, nh: destino };
  const c = mejor(rutas.filter(x => x.cod === 'C'), r.via);
  return { l3: c.l3, nh: r.via };
}

// Explica por qué nadie respondió al ARP de «nh» por la interfaz «l3».
function porQueNoArp(t, e, l3, nh) {
  const nom = `${l3.nombre} de ${e.nombre}`;
  const dueno = duenoDeIp(t, nh);
  if (!dueno) return `${e.nombre} pregunta por ARP quién tiene ${nh}, pero ningún equipo tiene esa IP.`;
  const suya = interfacesL3(dueno).find(x => x.ip === nh);
  if (!suya.on) return `${e.nombre} pregunta por ARP quién tiene ${nh}, pero esa interfaz de ${dueno.nombre} (${suya.nombre}) está apagada (shutdown).`;
  return `${e.nombre} pregunta por ARP quién tiene ${nh} por ${nom}, pero ${dueno.nombre} no está en el mismo dominio de difusión: revisa cables, VLAN y troncales.`;
}

// Lleva un paquete desde el equipo «desde» hasta la IP «destino», salto a salto.
function viajar(t, desde, destino) {
  const saltos = [];
  let e = desde;
  for (let ttl = 0; ttl < 16; ttl++) {
    if (ipsDe(e).includes(destino)) return { ok: true, saltos };
    if (e.tipo !== 'router' && saltos.length) return { ok: false, saltos, motivo: `El paquete llega a ${e.nombre}, pero no es para él y no es un router: lo descarta. ¿Alguna puerta de enlace o ruta apunta a ${e.nombre}?` };
    const s = siguienteSalto(t, e, destino);
    if (s.error) return { ok: false, saltos, motivo: s.error, en: e.id };
    if (!s.l3.on) return { ok: false, saltos, motivo: `${s.l3.nombre} de ${e.nombre} está apagada (shutdown).`, en: e.id };
    const { extremos } = alcanceL2(t, e.id, s.l3.p, s.l3.vlan);
    let hallado = null;
    for (const x of extremos) {
      const d = equipo(t, x.eq);
      const l3 = interfacesL3(d).find(i => i.p === x.p && i.vlan === x.tag && i.ip === s.nh && i.on);
      if (l3) { hallado = { d, l3, camino: x.camino }; break; }
    }
    if (!hallado) return { ok: false, saltos, motivo: porQueNoArp(t, e, s.l3, s.nh), en: e.id };
    saltos.push({ de: e.id, a: hallado.d.id, camino: hallado.camino, sal: s.l3.nombre, ent: hallado.l3.nombre, nh: s.nh });
    e = hallado.d;
  }
  return { ok: false, saltos, motivo: 'El paquete da vueltas entre routers hasta agotar su TTL: hay un bucle de enrutamiento.' };
}

// ping desde un equipo hacia una IP. Devuelve { ok, motivo, ida: [saltos], vuelta: [saltos], origen, destino }.
export function ping(t, ref, destino) {
  const e = equipo(t, ref);
  destino = String(destino ?? '').trim();
  if (!e) return { ok: false, motivo: 'Equipo desconocido.', ida: [], vuelta: [] };
  if (e.tipo === 'switch') return { ok: false, motivo: 'En este simulador los switches no tienen IP: haz ping desde un PC, un servidor o un router.', ida: [], vuelta: [] };
  if (!ipValida(destino)) return { ok: false, motivo: `«${destino}» no es una dirección IP válida.`, ida: [], vuelta: [] };
  if (!interfacesL3(e).length) return { ok: false, motivo: `${e.nombre} no tiene dirección IP${e.dhcp ? ': pídela por DHCP' : ''}.`, ida: [], vuelta: [] };
  if (ipsDe(e).includes(destino)) return { ok: true, motivo: `${destino} es la propia IP de ${e.nombre}.`, ida: [], vuelta: [] };
  const ida = viajar(t, e, destino);
  if (!ida.ok) return { ok: false, motivo: ida.motivo, ida: ida.saltos, vuelta: [], fase: 'ida' };
  const dst = equipo(t, ida.saltos[ida.saltos.length - 1].a);
  const primera = ida.saltos[0];
  const origenIp = interfacesL3(e).find(x => x.nombre === primera.sal).ip;
  const vuelta = viajar(t, dst, origenIp);
  if (!vuelta.ok) return { ok: false, motivo: `La petición llega a ${dst.nombre}, pero la respuesta no vuelve: ${vuelta.motivo}`, ida: ida.saltos, vuelta: vuelta.saltos, fase: 'vuelta' };
  return { ok: true, motivo: `Respuesta de ${destino}: ${ida.saltos.length + vuelta.saltos.length} saltos de capa 3 entre ida y vuelta.`, ida: ida.saltos, vuelta: vuelta.saltos, origenIp };
}
// ping de un equipo a otro (a la primera IP del destino).
export const pingEquipo = (t, a, b) => { const d = equipo(t, b); return ping(t, a, d ? ipsDe(d)[0] || '' : ''); };

// ------------------------------------------------------------------ DHCP
export function poolValido(pool) {
  const m = normalizarMascara(pool.mask);
  return !!m && ipValida(pool.inicio) && +pool.cantidad > 0 && (!String(pool.gw || '').trim() || enRed(pool.gw, pool.inicio, m));
}
// Un PC en modo DHCP pide su IP: necesita un servidor con un rango de su red en el mismo dominio de difusión.
export function pedirDhcp(t, ref) {
  const pc = equipo(t, ref);
  if (!pc || pc.tipo !== 'pc') return { ok: false, motivo: 'Solo los PC piden IP por DHCP.' };
  pc.dhcp = true;
  Object.assign(pc.ifs.Fa0, { ip: '', mask: '' }); pc.gw = ''; pc.dns = ''; pc.concedida = false;
  if (!cableEn(t, pc.id, 'Fa0')) return { ok: false, motivo: `${pc.nombre} no tiene cable: el DHCPDISCOVER no sale.` };
  if (!enlaceUp(t, pc.id, 'Fa0')) return { ok: false, motivo: `El enlace de ${pc.nombre} está caído.` };
  const { extremos, } = alcanceL2(t, pc.id, 'Fa0', null);
  for (const x of extremos) {
    const s = equipo(t, x.eq);
    if (s.tipo !== 'servidor' || x.tag != null) continue;
    const suya = interfacesL3(s).find(i => i.p === x.p);
    if (!suya) continue;
    const pool = (s.pools || []).find(pl => poolValido(pl) && enRed(pl.inicio, suya.ip, suya.mask));
    if (!pool) continue;
    const m = normalizarMascara(pool.mask), ocupadas = new Set(t.equipos.flatMap(ipsDe));
    for (let k = 0; k < +pool.cantidad; k++) {
      const ip = ipStr((ipNum(pool.inicio) + k) >>> 0);
      if (!enRed(ip, pool.inicio, m)) break;
      if (ocupadas.has(ip) || !ipDeHost(ip, m)) continue;
      Object.assign(pc.ifs.Fa0, { ip, mask: m });
      pc.gw = String(pool.gw || '').trim(); pc.dns = String(pool.dns || '').trim(); pc.concedida = true;
      return { ok: true, ip, mask: m, gw: pc.gw, servidor: s.nombre, motivo: `${s.nombre} concede ${ip} ${m}${pc.gw ? ' con puerta de enlace ' + pc.gw : ''}.` };
    }
    return { ok: false, motivo: `${s.nombre} responde, pero su rango no tiene direcciones libres.` };
  }
  return { ok: false, motivo: `Ningún servidor DHCP con un rango de esta red responde en el dominio de difusión de ${pc.nombre}.` };
}

// ------------------------------------------------------------------ guardar y cargar
export const clonar = t => JSON.parse(JSON.stringify(t));
export function validarTopologia(t) {
  return !!t && Array.isArray(t.equipos) && Array.isArray(t.cables) && t.equipos.every(e => PUERTOS[e.tipo] && e.ifs && typeof e.nombre === 'string' && Number.isFinite(e.x) && Number.isFinite(e.y))
    && t.cables.every(c => equipo(t, c.a?.eq) && equipo(t, c.b?.eq));
}
