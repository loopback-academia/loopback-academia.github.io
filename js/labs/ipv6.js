// Cálculo IPv6 (sin DOM: se prueba en Node): expandir y abreviar direcciones, EUI-64, tipo de dirección y prefijos.
// Las direcciones se manejan como BigInt de 128 bits.

const HEX = /^[0-9a-f]{1,4}$/i;

// Devuelve los 8 grupos (números) o null si la dirección no es válida.
function grupos(txt) {
  const s = String(txt || '').trim().toLowerCase();
  if (!s || /[^0-9a-f:]/.test(s) || s.includes(':::')) return null;
  const partes = s.split('::');
  if (partes.length > 2) return null;
  const lado = p => (p === '' ? [] : p.split(':'));
  const izq = lado(partes[0]), der = partes.length === 2 ? lado(partes[1]) : [];
  if (![...izq, ...der].every(g => HEX.test(g))) return null;
  const faltan = 8 - izq.length - der.length;
  if (partes.length === 1 ? faltan !== 0 : faltan < 1) return null;
  return [...izq, ...Array(partes.length === 2 ? faltan : 0).fill('0'), ...der].map(g => parseInt(g, 16));
}

export const valida = txt => grupos(txt) !== null;

export function aNumero(txt) {
  const g = grupos(txt);
  if (!g) return null;
  return g.reduce((n, x) => (n << 16n) | BigInt(x), 0n);
}
const aGrupos = n => Array.from({ length: 8 }, (_, k) => Number((n >> BigInt(16 * (7 - k))) & 0xffffn));

// Forma completa: 8 grupos de 4 dígitos.
export function expandir(txt) {
  const g = grupos(txt);
  return g ? g.map(x => x.toString(16).padStart(4, '0')).join(':') : null;
}

// Forma corta (RFC 5952): sin ceros a la izquierda y la secuencia más larga de grupos a cero (2 o más) como "::".
export function abreviar(entrada) {
  const g = typeof entrada === 'bigint' ? aGrupos(entrada) : grupos(entrada);
  if (!g) return null;
  let ini = -1, largo = 0;
  for (let k = 0; k < 8;) {
    if (g[k] !== 0) { k++; continue; }
    let j = k;
    while (j < 8 && g[j] === 0) j++;
    if (j - k > largo) { ini = k; largo = j - k; }
    k = j;
  }
  const h = g.map(x => x.toString(16));
  if (largo < 2) return h.join(':');
  return h.slice(0, ini).join(':') + '::' + h.slice(ini + largo).join(':');
}

export const iguales = (a, b) => { const x = aNumero(a), y = aNumero(b); return x !== null && x === y; };

// "2001:db8::1/64" → { dir, len }
export function cidr(txt) {
  const m = String(txt || '').trim().match(/^([0-9a-f:]+)\/(\d{1,3})$/i);
  if (!m || !valida(m[1]) || +m[2] > 128) return null;
  return { dir: m[1].toLowerCase(), len: +m[2] };
}

const mascara = len => (len === 0 ? 0n : ((1n << 128n) - 1n) ^ ((1n << BigInt(128 - len)) - 1n));
export const redDe = (dir, len) => abreviar(aNumero(dir) & mascara(len));
export const enPrefijo = (dir, red, len) => (aNumero(dir) & mascara(len)) === (aNumero(red) & mascara(len));

// Identificador de interfaz EUI-64 a partir de una MAC (cualquier formato): FFFE en medio e invertir el 7.º bit.
export function eui64(mac) {
  const h = String(mac || '').toLowerCase().replace(/[^0-9a-f]/g, '');
  if (h.length !== 12) return null;
  const b = h.match(/../g).map(x => parseInt(x, 16));
  b[0] ^= 0x02;
  const bytes = [...b.slice(0, 3), 0xff, 0xfe, ...b.slice(3)];
  return [0, 2, 4, 6].map(k => ((bytes[k] << 8) | bytes[k + 1]).toString(16).padStart(4, '0')).join(':');
}
// Prefijo /64 + EUI-64 → dirección completa.
export function direccionEui64(prefijo, mac) {
  const id = eui64(mac);
  const red = aNumero(prefijo);
  if (!id || red === null) return null;
  return abreviar((red & mascara(64)) | aNumero('::' + id));
}
export const linkLocal = mac => abreviar(aNumero('fe80::') | aNumero('::' + eui64(mac)));

export const TIPOS = {
  global: 'Global unicast (GUA)', ula: 'Unique local (ULA)', 'link-local': 'Link-local', multicast: 'Multicast',
  loopback: 'Loopback', 'no-especificada': 'No especificada',
};
export function tipo(txt) {
  const n = aNumero(txt);
  if (n === null) return null;
  if (n === 0n) return 'no-especificada';
  if (n === 1n) return 'loopback';
  const g0 = Number(n >> 112n);
  if ((g0 & 0xff00) === 0xff00) return 'multicast';
  if ((g0 & 0xffc0) === 0xfe80) return 'link-local';
  if ((g0 & 0xfe00) === 0xfc00) return 'ula';
  if ((g0 & 0xe000) === 0x2000) return 'global';
  return null;
}

// ---------------------------------------------------------------- generador de ejercicios
const azar = (rnd, n) => Math.floor(rnd() * n);
const grupoAzar = rnd => { const r = rnd(); return r < 0.45 ? 0 : r < 0.6 ? azar(rnd, 0x100) : azar(rnd, 0x10000); };
function dirAzar(rnd, base = [0x2001, 0x0db8]) {
  const g = [...base];
  while (g.length < 8) g.push(grupoAzar(rnd));
  // Garantiza al menos una secuencia de dos ceros para que haya "::".
  const k = 2 + azar(rnd, 5);
  g[k] = 0; g[k + 1] = 0;
  return g.map(x => x.toString(16).padStart(4, '0')).join(':');
}
const macAzar = rnd => Array.from({ length: 6 }, () => azar(rnd, 256).toString(16).padStart(2, '0')).join(':');

export const MODOS = {
  abreviar: 'Abreviar',
  expandir: 'Expandir',
  eui64: 'EUI-64',
  tipo: 'Tipo de dirección',
  prefijo: 'Prefijo de red',
};

export function generarIpv6(modo, rnd = Math.random) {
  if (modo === 'abreviar') { const d = dirAzar(rnd); return { modo, pregunta: d.toUpperCase(), respuesta: abreviar(d), texto: 'Escribe la forma más corta de esta dirección:' }; }
  if (modo === 'expandir') { const d = dirAzar(rnd); return { modo, pregunta: abreviar(d).toUpperCase(), respuesta: expandir(d), texto: 'Escribe la dirección completa (8 grupos de 4 dígitos):' }; }
  if (modo === 'eui64') {
    const mac = macAzar(rnd);
    const pref = abreviar([0x2001, 0x0db8, azar(rnd, 0x10000), azar(rnd, 0x100), 0, 0, 0, 0].map(x => x.toString(16)).join(':'));
    return { modo, pregunta: `${pref}/64 · MAC ${mac.toUpperCase()}`, respuesta: direccionEui64(pref, mac), mac, texto: 'Calcula la dirección que crea el equipo con SLAAC y EUI-64:' };
  }
  if (modo === 'tipo') {
    const opciones = [
      () => dirAzar(rnd, [0x2001, 0x0db8]), () => dirAzar(rnd, [0x2800 + azar(rnd, 0x800), azar(rnd, 0x10000)]),
      () => dirAzar(rnd, [0xfd00 + azar(rnd, 0x100), azar(rnd, 0x10000)]), () => dirAzar(rnd, [0xfe80, 0]),
      () => ['ff02::1', 'ff02::2', 'ff02::1:ff00:1', 'ff05::2'][azar(rnd, 4)], () => '::1', () => '::',
    ];
    const d = opciones[azar(rnd, opciones.length)]();
    return { modo, pregunta: abreviar(d).toUpperCase(), respuesta: tipo(d), texto: '¿De qué tipo es esta dirección?', opciones: Object.keys(TIPOS) };
  }
  if (modo === 'prefijo') {
    const d = dirAzar(rnd);
    const len = [48, 56, 64, 64, 64][azar(rnd, 5)];
    // Evita prefijos triviales: el identificador de interfaz no puede ser cero.
    const n = aNumero(d) | 0x1n;
    return { modo, pregunta: `${abreviar(n).toUpperCase()}/${len}`, respuesta: redDe(abreviar(n), len) + '/' + len, texto: 'Escribe el prefijo de red (forma corta y con /longitud):' };
  }
  throw new Error('Modo IPv6 desconocido: ' + modo);
}

// Corrige la respuesta del alumno: cualquier forma válida de la misma dirección vale, salvo en "abreviar" y "expandir",
// donde se pide una forma concreta.
export function corregirIpv6(ej, txt) {
  const r = String(txt || '').trim().toLowerCase().replace(/\s+/g, '');
  if (!r) return false;
  if (ej.modo === 'tipo') return r === ej.respuesta;
  if (ej.modo === 'abreviar') return r === ej.respuesta;
  if (ej.modo === 'expandir') return r === ej.respuesta;
  if (ej.modo === 'prefijo') { const c = cidr(r), e = cidr(ej.respuesta); return !!c && c.len === e.len && iguales(c.dir, e.dir); }
  return iguales(r, ej.respuesta);
}

export function explicarIpv6(ej) {
  if (ej.modo === 'abreviar') return ['Quita los ceros a la izquierda de cada grupo.', 'Sustituye la secuencia más larga de grupos 0 por "::" (solo una vez; si empatan, la primera).', `Resultado: ${ej.respuesta}`];
  if (ej.modo === 'expandir') return ['Cuenta los grupos escritos: "::" ocupa los que faltan hasta 8.', 'Completa cada grupo con ceros a la izquierda hasta 4 dígitos.', `Resultado: ${ej.respuesta}`];
  if (ej.modo === 'eui64') {
    const h = ej.mac.replace(/:/g, '');
    return [`Parte la MAC por la mitad: ${h.slice(0, 6)} | ${h.slice(6)}`, `Inserta FFFE en medio: ${h.slice(0, 6)}fffe${h.slice(6)}`,
      `Invierte el 7.º bit del primer byte: ${h.slice(0, 2)} → ${(parseInt(h.slice(0, 2), 16) ^ 2).toString(16).padStart(2, '0')}`, `Identificador: ${eui64(ej.mac)}`, `Dirección: ${ej.respuesta}`];
  }
  if (ej.modo === 'tipo') return ['2000::/3 → global · FC00::/7 (FD..) → ULA · FE80::/10 → link-local · FF00::/8 → multicast · ::1 → loopback · :: → no especificada.', `Respuesta: ${TIPOS[ej.respuesta]}`];
  return ['Conserva los primeros bits que indica la longitud y pon a cero el resto.', 'Con /64 se quedan los 4 primeros grupos; con /48, los 3 primeros; con /56, 3 grupos y medio.', `Resultado: ${ej.respuesta}`];
}
