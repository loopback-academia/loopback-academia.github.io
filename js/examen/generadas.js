// Preguntas de razonamiento generadas en cada intento (sin DOM: se prueban en Node).
// Cada intento crea datos nuevos (direcciones IP, tablas, fragmentos de código, situaciones de soporte), así que no
// hay respuesta que buscar ni que memorizar: hay que razonarla y ESCRIBIRLA. Se corrigen solas y, si se aprueba el
// examen, muestran la resolución paso a paso.
//
// Formato: { id: 'gen:<tipo>', generada: true, q, contexto?: {tabla|codigo}, respuesta, explain, modulo }
// y comprobar(pregunta, texto) → true/false.

import * as Topo from '../labs/topologia.js';

const entero = (rnd, a, b) => a + Math.floor(rnd() * (b - a + 1));
const elegir = (rnd, xs) => xs[Math.floor(rnd() * xs.length)];
const ipTexto = n => [24, 16, 8, 0].map(s => (n >>> s) & 255).join('.');
const mascara = p => (p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0);

const GEN = {
  // ------------------------------------------------------------- redes
  // Con el motor del simulador de topologías: la respuesta sale de la red simulada, no de una tabla escrita a mano.
  'topo-gateway': rnd => {
    const a = entero(rnd, 1, 120), b = a + entero(rnd, 1, 100), x = entero(rnd, 2, 15);
    const t = Topo.nuevaTopologia();
    const r = Topo.agregarEquipo(t, 'router', { nombre: 'R1' });
    const netA = `192.168.${a}`, netB = `10.${x}.${b}`;
    Object.assign(r.ifs['Gi0/0'], { ip: `${netA}.1`, mask: '255.255.255.0', on: true });
    Object.assign(r.ifs['Gi0/1'], { ip: `${netB}.254`, mask: '255.255.255.0', on: true });
    const lado = rnd() < 0.5 ? 'Gi0/0' : 'Gi0/1';
    const host = `${lado === 'Gi0/0' ? netA : netB}.${entero(rnd, 20, 200)}`;
    const gw = r.ifs[lado].ip;
    return { area: 'redes', modulo: 'm1', q: `R1 tiene Gi0/0 = ${netA}.1/24 (LAN de Ventas) y Gi0/1 = ${netB}.254/24 (LAN del almacén). ¿Qué puerta de enlace debe tener un PC con la IP ${host}/24?`, respuesta: gw,
      explain: `${host}/24 pertenece a la red ${Topo.redDe(host, '255.255.255.0')}/24, la misma que la interfaz ${lado} de R1 (${gw}). La puerta de enlace es siempre la IP del router en la red del propio PC.` };
  },
  'topo-ruta': rnd => {
    const a = entero(rnd, 1, 99), b = entero(rnd, 100, 220), k = entero(rnd, 0, 63) * 4;
    const t = Topo.nuevaTopologia();
    const r1 = Topo.agregarEquipo(t, 'router', { nombre: 'R1' }), r2 = Topo.agregarEquipo(t, 'router', { nombre: 'R2' });
    const p1 = Topo.agregarEquipo(t, 'pc', { nombre: 'PC1' }), p2 = Topo.agregarEquipo(t, 'pc', { nombre: 'PC2' });
    const m = '255.255.255.0', enl = `10.0.0.${k}`, ip1 = `10.0.0.${k + 1}`, ip2 = `10.0.0.${k + 2}`;
    Object.assign(p1.ifs.Fa0, { ip: `192.168.${a}.10`, mask: m }); p1.gw = `192.168.${a}.1`;
    Object.assign(p2.ifs.Fa0, { ip: `192.168.${b}.10`, mask: m }); p2.gw = `192.168.${b}.1`;
    Object.assign(r1.ifs['Gi0/0'], { ip: `192.168.${a}.1`, mask: m, on: true }); Object.assign(r1.ifs['Gi0/1'], { ip: ip1, mask: '255.255.255.252', on: true });
    Object.assign(r2.ifs['Gi0/0'], { ip: `192.168.${b}.1`, mask: m, on: true }); Object.assign(r2.ifs['Gi0/1'], { ip: ip2, mask: '255.255.255.252', on: true });
    Topo.conectar(t, 'PC1', 'R1', 'Fa0', 'Gi0/0'); Topo.conectar(t, 'R1', 'R2', 'Gi0/1', 'Gi0/1'); Topo.conectar(t, 'R2', 'PC2', 'Gi0/0', 'Fa0');
    const falta = rnd() < 0.5 ? 'R1' : 'R2';
    if (falta !== 'R1') r1.rutas.push({ red: `192.168.${b}.0`, mask: m, via: ip2 });
    if (falta !== 'R2') r2.rutas.push({ red: `192.168.${a}.0`, mask: m, via: ip1 });
    const res = Topo.pingEquipo(t, 'PC1', 'PC2');
    const red = falta === 'R1' ? `192.168.${b}.0` : `192.168.${a}.0`;
    const cfg = [r1, r2].map(r => `${r.nombre}: Gi0/0 ${r.ifs['Gi0/0'].ip}/24 · Gi0/1 ${r.ifs['Gi0/1'].ip}/30\n  rutas estáticas: ${r.rutas.length ? r.rutas.map(x => `${x.red}/24 por ${x.via}`).join(', ') : 'ninguna'}`).join('\n');
    return { area: 'redes', modulo: 'm3', q: `PC1 (192.168.${a}.10, LAN de R1) hace ping a PC2 (192.168.${b}.10, LAN de R2) y falla. ¿Cuál es la red de destino de la ruta estática que falta? (escribe la dirección de red, por ejemplo 172.16.5.0)`,
      contexto: { codigo: `${cfg}\n\nping 192.168.${b}.10 → ${res.motivo}` }, respuesta: red,
      explain: `${res.motivo} Falta en ${falta} la ruta hacia ${red}/24 por ${falta === 'R1' ? ip2 : ip1}: cada router solo conoce sus redes conectadas y lo que le enseñen las rutas.` };
  },
  'red-de-ip': rnd => {
    const p = entero(rnd, 20, 29);
    const base = elegir(rnd, [[10, entero(rnd, 0, 255)], [172, entero(rnd, 16, 31)], [192, 168]]);
    const ip = ((base[0] << 24) | (base[1] << 16) | (entero(rnd, 0, 255) << 8) | entero(rnd, 1, 254)) >>> 0;
    const red = (ip & mascara(p)) >>> 0;
    const bloque = 2 ** (32 - p);
    return { area: 'redes', modulo: 'm1', q: `¿Cuál es la dirección de red de ${ipTexto(ip)}/${p}?`, respuesta: ipTexto(red),
      explain: `La máscara /${p} es ${ipTexto(mascara(p))}. Bloque de ${bloque} direcciones: la red es el múltiplo del bloque que contiene a la IP → ${ipTexto(red)}.` };
  },
  'broadcast': rnd => {
    const p = entero(rnd, 22, 29);
    const ip = ((192 << 24) | (168 << 16) | (entero(rnd, 0, 255) << 8) | entero(rnd, 1, 254)) >>> 0;
    const red = (ip & mascara(p)) >>> 0;
    const bc = (red | (~mascara(p) >>> 0)) >>> 0;
    return { area: 'redes', modulo: 'm1', q: `¿Cuál es la dirección de broadcast de la red de ${ipTexto(ip)}/${p}?`, respuesta: ipTexto(bc),
      explain: `Red ${ipTexto(red)}/${p}; el broadcast es la última dirección del bloque de ${2 ** (32 - p)}: ${ipTexto(bc)}.` };
  },
  'hosts-utiles': rnd => {
    const p = entero(rnd, 19, 30);
    return { area: 'redes', modulo: 'm1', q: `¿Cuántos hosts utilizables tiene una red /${p}? (escribe solo el número)`, respuesta: String(2 ** (32 - p) - 2),
      explain: `32 − ${p} = ${32 - p} bits de host → 2^${32 - p} − 2 = ${2 ** (32 - p) - 2} (se restan la red y el broadcast).` };
  },
  // ------------------------------------------------------------- bases de datos
  'sql-contar': rnd => {
    const tiendas = ['Los Prados', 'Las Palmas', 'El Centro'];
    const filas = Array.from({ length: 7 }, (_, i) => [100 + i, elegir(rnd, tiendas), entero(rnd, 10, 99) * 10]);
    const umbral = elegir(rnd, [300, 400, 500, 600]);
    const n = filas.filter(f => f[2] > umbral).length;
    return { area: 'bd', modulo: 'b1', q: `¿Cuántas filas devuelve esta consulta? SELECT * FROM ventas WHERE total > ${umbral}; (escribe solo el número)`,
      contexto: { tabla: { titulo: 'ventas', columnas: ['id', 'tienda', 'total'], filas } }, respuesta: String(n),
      explain: `Filas con total mayor que ${umbral}: ${filas.filter(f => f[2] > umbral).map(f => f[0]).join(', ') || 'ninguna'} → ${n}.` };
  },
  'sql-suma': rnd => {
    const tiendas = ['Los Prados', 'Las Palmas', 'El Centro'];
    const filas = Array.from({ length: 6 }, (_, i) => [200 + i, elegir(rnd, tiendas), entero(rnd, 1, 9) * 50]);
    const t = elegir(rnd, [...new Set(filas.map(f => f[1]))]);
    const suma = filas.filter(f => f[1] === t).reduce((s, f) => s + f[2], 0);
    return { area: 'bd', modulo: 'b2', q: `¿Qué devuelve SELECT SUM(total) FROM ventas WHERE tienda = '${t}'; (escribe solo el número)`,
      contexto: { tabla: { titulo: 'ventas', columnas: ['id', 'tienda', 'total'], filas } }, respuesta: String(suma),
      explain: `Se suman los totales de ${t}: ${filas.filter(f => f[1] === t).map(f => f[2]).join(' + ')} = ${suma}.` };
  },
  // ------------------------------------------------------------- programación
  'py-bucle': rnd => {
    const a = entero(rnd, 1, 20), n = entero(rnd, 3, 7);
    const r = a + (n * (n - 1)) / 2;
    return { area: 'prog', modulo: 'p1', q: '¿Qué imprime este programa de Python? (escribe solo el resultado)',
      contexto: { codigo: `total = ${a}\nfor i in range(${n}):\n    total = total + i\nprint(total)` }, respuesta: String(r),
      explain: `range(${n}) da 0…${n - 1}; su suma es ${(n * (n - 1)) / 2}. ${a} + ${(n * (n - 1)) / 2} = ${r}.` };
  },
  'py-condicion': rnd => {
    const x = entero(rnd, 5, 60);
    const r = x % 2 === 0 ? x / 2 : x * 3 + 1;
    return { area: 'prog', modulo: 'p1', q: '¿Qué imprime este programa de Python? (escribe solo el resultado)',
      contexto: { codigo: `x = ${x}\nif x % 2 == 0:\n    x = x // 2\nelse:\n    x = x * 3 + 1\nprint(x)` }, respuesta: String(r),
      explain: `${x} es ${x % 2 === 0 ? 'par' : 'impar'}, así que ${x % 2 === 0 ? `${x} // 2 = ${r}` : `${x} * 3 + 1 = ${r}`}.` };
  },
  'py-lista': rnd => {
    const datos = Array.from({ length: 5 }, () => entero(rnd, 1, 30));
    const k = entero(rnd, 0, 3);
    const r = datos[k] + datos[4];
    return { area: 'prog', modulo: 'p1', q: '¿Qué imprime este programa de Python? (escribe solo el resultado)',
      contexto: { codigo: `datos = [${datos.join(', ')}]\nprint(datos[${k}] + datos[-1])` }, respuesta: String(r),
      explain: `datos[${k}] es ${datos[k]} (se cuenta desde 0) y datos[-1] es el último, ${datos[4]}: ${datos[k]} + ${datos[4]} = ${r}.` };
  },
  // ------------------------------------------------------------- empleo TI
  'prioridad': rnd => {
    const sedes = ['Tienda Los Prados', 'Tienda Las Palmas', 'el centro de distribución', 'la oficina central'];
    const imp = elegir(rnd, [
      ['alto', s => `Toda ${s} está sin sistema y no se puede vender.`],
      ['medio', s => `El área de facturación de ${s} no puede imprimir (las demás áreas trabajan).`],
      ['bajo', () => 'A una persona le falla el ratón, pero tiene otro de repuesto.'],
    ]);
    const urg = elegir(rnd, [['alta', 'Hay clientes esperando en este momento.'], ['media', 'Debe quedar resuelto hoy.'], ['baja', 'Puede planificarse para la próxima semana.']]);
    const M = { alto: { alta: 'P1', media: 'P2', baja: 'P3' }, medio: { alta: 'P2', media: 'P3', baja: 'P4' }, bajo: { alta: 'P3', media: 'P4', baja: 'P4' } };
    const p = M[imp[0]][urg[0]];
    return { area: 'ti', modulo: 's1', q: `${imp[1](elegir(rnd, sedes))} ${urg[1]} ¿Qué prioridad le asignas según la matriz impacto × urgencia? (escribe P1, P2, P3 o P4)`, respuesta: p,
      explain: `Impacto ${imp[0]} y urgencia ${urg[0]} → ${p}.` };
  },
  // ------------------------------------------------------------- inglés técnico
  'leer-aviso': rnd => {
    const n = entero(rnd, 2, 14), p = entero(rnd, 81, 99), h = entero(rnd, 1, 11), u = entero(rnd, 2, 9);
    const t = elegir(rnd, [
      [`Your password will expire in ${n} days. Change it now to avoid losing access.`, '¿En cuántos días caduca la contraseña? (escribe solo el número)', n, `«will expire in ${n} days» = caducará dentro de ${n} días.`],
      [`Low disk space: drive C: is ${p}% full. Free up space to avoid performance issues.`, '¿Qué porcentaje del disco C: está lleno? (solo el número)', p, `«is ${p}% full» = está lleno al ${p} %.`],
      [`The nightly backup failed at ${h}:00 a.m. because the destination drive was full.`, '¿A qué hora falló la copia de seguridad? (solo el número de la hora)', h, `«failed at ${h}:00 a.m.» = falló a las ${h} de la madrugada.`],
      [`${u} updates are ready to install. Your device will restart automatically tonight.`, '¿Cuántas actualizaciones están listas para instalar? (solo el número)', u, `«${u} updates are ready to install» = hay ${u} actualizaciones listas.`],
    ]);
    return { area: 'en', modulo: 's11', q: `Lee el aviso: «${t[0]}» ${t[1]}`, respuesta: String(t[2]), explain: t[3] };
  },
};

export const TIPOS_POR_AREA = {
  redes: ['red-de-ip', 'broadcast', 'hosts-utiles', 'topo-gateway', 'topo-ruta'],
  bd: ['sql-contar', 'sql-suma'],
  prog: ['py-bucle', 'py-condicion', 'py-lista'],
  ti: ['prioridad'],
  en: ['leer-aviso'],
};

// n preguntas de razonamiento para un área, de tipos variados.
export function generarPreguntas(area, n, rnd = Math.random) {
  const tipos = TIPOS_POR_AREA[area] || [];
  if (!tipos.length) return [];
  const orden = [...tipos].sort(() => rnd() - 0.5);
  return Array.from({ length: n }, (_, i) => {
    const tipo = orden[i % orden.length];
    return { id: 'gen:' + tipo, tipo, generada: true, ...GEN[tipo](rnd) };
  });
}

const normalizar = s => String(s || '').trim().toUpperCase().replace(/\s+/g, '').replace(/\/\d+$/, '').replace(/[.,]$/, '');
export const comprobar = (pregunta, texto) => normalizar(texto) !== '' && normalizar(texto) === normalizar(pregunta.respuesta);
