// Simulador de la consola de Windows (cmd y algunos cmdlets de PowerShell) para prácticas de soporte técnico.
// Sin DOM: se prueba en Node. El estado describe el PC, su red y sus servicios; los comandos lo consultan y cambian.

const ipNum = s => { const p = String(s).split('.'); if (p.length !== 4 || !p.every(x => /^\d{1,3}$/.test(x) && +x < 256)) return null; return p.reduce((n, x) => n * 256 + +x, 0); };
const misma = (a, b, m) => { const x = ipNum(a), y = ipNum(b), k = ipNum(m); if (x == null || y == null || k == null) return false; return (x - (x % (2 ** 32 - k))) === (y - (y % (2 ** 32 - k))); };
const apipa = ip => /^169\.254\./.test(ip || '');
const pad = (t, n) => String(t).padEnd(n);
const puntos = (t, n = 44) => '   ' + (t + ' ').padEnd(n, '. ') .slice(0, n) + ': ';

// ---------------------------------------------------------------- estado inicial
export function nuevoPc(cfg = {}) {
  const base = {
    hostname: 'PC-RECEP-03', usuario: 'mfernandez', dominio: 'EMPRESA', so: 'Microsoft Windows 11 Pro', version: '10.0.22631',
    adaptador: {
      nombre: 'Ethernet', desc: 'Intel(R) Ethernet Connection (16) I219-LM', mac: '3C-52-82-1A-2B-3C',
      cable: true, dhcp: true, ip: '192.168.10.57', mask: '255.255.255.0', gw: '192.168.10.1', dns: ['192.168.10.5'], sufijo: 'empresa.local',
    },
    // La red alrededor del PC.
    red: {
      dhcpServidor: '192.168.10.1', dhcpFunciona: true, poolSiguiente: '192.168.10.57', mask: '255.255.255.0', gw: '192.168.10.1', dnsDhcp: ['192.168.10.5'],
      lan: ['192.168.10.1', '192.168.10.5', '192.168.10.20', '192.168.10.30'], internet: true,
      dnsValidos: ['192.168.10.5', '192.168.10.1', '8.8.8.8', '1.1.1.1'],
      zona: { 'intranet.empresa.local': '192.168.10.20', 'srv-archivos.empresa.local': '192.168.10.30', 'srv-archivos': '192.168.10.30', 'www.google.com': '142.250.78.4', 'google.com': '142.250.78.4', 'outlook.office365.com': '52.96.88.130', 'www.microsoft.com': '23.45.112.17' },
    },
    dnsCache: {},
    procesos: [
      { nombre: 'System', pid: 4, mem: 2, cpu: 1 }, { nombre: 'explorer.exe', pid: 6120, mem: 142, cpu: 1 }, { nombre: 'chrome.exe', pid: 8840, mem: 610, cpu: 3 },
      { nombre: 'OUTLOOK.EXE', pid: 9312, mem: 285, cpu: 1 }, { nombre: 'Teams.exe', pid: 10456, mem: 420, cpu: 2 }, { nombre: 'MsMpEng.exe', pid: 3368, mem: 210, cpu: 1 },
    ],
    servicios: { Spooler: { nombre: 'Cola de impresión', estado: 'RUNNING' }, wuauserv: { nombre: 'Windows Update', estado: 'RUNNING' }, Dnscache: { nombre: 'Cliente DNS', estado: 'RUNNING' }, LanmanWorkstation: { nombre: 'Estación de trabajo', estado: 'RUNNING' } },
    colaImpresion: [],
    disco: { totalGB: 237, libreGB: 96, tempGB: 2.1 },
    sistemaDanado: false,
    grupos: ['EMPRESA\\Usuarios del dominio', 'EMPRESA\\Recepcion'],
    gpo: { aplicadas: ['Directiva de dominio predeterminada', 'Fondo corporativo'], pendientes: [] },
    unidades: {},
    recursos: { '\\\\srv-archivos\\recepcion': 'EMPRESA\\Recepcion', '\\\\srv-archivos\\contabilidad': 'EMPRESA\\Contabilidad', '\\\\srv-archivos\\comun': 'EMPRESA\\Usuarios del dominio' },
    proxy: null,
    eventos: [],
    historial: [], patrones: new Set(), ultimoPing: {}, ultimoNslookup: {},
  };
  const s = { ...base, ...cfg, adaptador: { ...base.adaptador, ...(cfg.adaptador || {}) }, red: { ...base.red, ...(cfg.red || {}) }, disco: { ...base.disco, ...(cfg.disco || {}) } };
  s.patrones = new Set(); s.historial = []; s.ultimoPing = {}; s.ultimoNslookup = {};
  s.servicios = JSON.parse(JSON.stringify(s.servicios));
  s.procesos = s.procesos.map(p => ({ ...p }));
  if (cfg.estadoInicial) cfg.estadoInicial(s);
  return s;
}

export const prompt = s => `C:\\Users\\${s.usuario}>`;

// ---------------------------------------------------------------- red
const tieneIp = s => s.adaptador.cable && s.adaptador.ip && !apipa(s.adaptador.ip);
function alcanzable(s, ip) {
  if (!tieneIp(s)) return false;
  const a = s.adaptador;
  if (ip === a.ip || ip === '127.0.0.1') return true;
  if (misma(ip, a.ip, a.mask)) return s.red.lan.includes(ip);
  if (!a.gw || !misma(a.gw, a.ip, a.mask) || !s.red.lan.includes(a.gw)) return false;
  return s.red.internet || /^192\.168\./.test(ip);
}
const dnsOk = s => s.adaptador.dns.some(d => s.red.dnsValidos.includes(d) && alcanzable(s, d));
function resolver(s, nombre) {
  const n = nombre.toLowerCase();
  if (ipNum(n) != null) return { ip: n };
  if (n === 'localhost') return { ip: '127.0.0.1' };
  if (s.dnsCache[n] !== undefined) return s.dnsCache[n] ? { ip: s.dnsCache[n], cache: true } : { error: true, cache: true };
  if (!dnsOk(s)) return { error: true };
  const ip = s.red.zona[n] || s.red.zona[n.replace(/\.empresa\.local$/, '')];
  return ip ? { ip } : { error: true, noExiste: true };
}

// ---------------------------------------------------------------- comandos
function ipconfig(s, args) {
  const op = (args[0] || '').toLowerCase();
  const a = s.adaptador;
  if (op === '/release') { if (!a.dhcp) return 'Error al liberar la interfaz Ethernet: DHCP no está habilitado en este adaptador.'; a.ip = null; a.gw = null; return 'Configuración IP de Windows\n\n' + mostrar(s, false); }
  if (op === '/renew') {
    if (!a.dhcp) return 'Error al renovar la interfaz Ethernet: DHCP no está habilitado en este adaptador.';
    if (!a.cable) return 'No se puede realizar ninguna operación en Ethernet mientras los medios estén desconectados.';
    if (!s.red.dhcpFunciona) { a.ip = '169.254.' + (a.mac.length % 200 + 20) + '.7'; a.mask = '255.255.0.0'; a.gw = null; return 'Error al renovar la interfaz Ethernet: no se puede contactar con el servidor DHCP. Se agotó el tiempo de espera de la solicitud.'; }
    a.ip = s.red.poolSiguiente; a.mask = s.red.mask; a.gw = s.red.gw; a.dns = [...s.red.dnsDhcp];
    return 'Configuración IP de Windows\n\n' + mostrar(s, false);
  }
  if (op === '/flushdns') { s.dnsCache = {}; return 'Configuración IP de Windows\n\nSe vació correctamente la caché de resolución de DNS.'; }
  if (op === '/displaydns') {
    const e = Object.entries(s.dnsCache);
    return 'Configuración IP de Windows\n\n' + (e.length ? e.map(([n, ip]) => `    ${n}\n    ----------------------------------------\n    Nombre de registro . . . . . : ${n}\n    ${ip ? 'Registro A (Host). . . . . . : ' + ip : 'Nombre no existe.'}\n`).join('\n') : 'No se pudo mostrar la caché de resolución de DNS.');
  }
  if (op && op !== '/all') return `Error: no se reconoce o no está completa la opción de línea de comandos ${args[0]}.\n\nUSO: ipconfig [/all | /release | /renew | /flushdns | /displaydns]`;
  return 'Configuración IP de Windows\n\n' + (op === '/all' ? general(s) : '') + mostrar(s, op === '/all');
}
function general(s) {
  return [puntos('Nombre de host') + s.hostname, puntos('Sufijo DNS principal') + s.adaptador.sufijo, puntos('Tipo de nodo') + 'híbrido', puntos('Enrutamiento IP habilitado') + 'no', ''].join('\n') + '\n';
}
function mostrar(s, todo) {
  const a = s.adaptador;
  const L = [`Adaptador de Ethernet ${a.nombre}:`, ''];
  if (!a.cable) { L.push(puntos('Estado de los medios') + 'medios desconectados', puntos('Sufijo DNS específico para la conexión') + ''); if (todo) L.push(puntos('Descripción') + a.desc, puntos('Dirección física') + a.mac); return L.join('\n'); }
  L.push(puntos('Sufijo DNS específico para la conexión') + (tieneIp(s) ? a.sufijo : ''));
  if (todo) L.push(puntos('Descripción') + a.desc, puntos('Dirección física') + a.mac, puntos('DHCP habilitado') + (a.dhcp ? 'sí' : 'no'), puntos('Configuración automática habilitada') + 'sí');
  L.push(puntos('Vínculo: dirección IPv6 local') + 'fe80::3e52:82ff:fe1a:2b3c%12');
  if (!a.ip) L.push(puntos('Dirección IPv4') + '0.0.0.0');
  else if (apipa(a.ip)) L.push(puntos('Dirección IPv4 de configuración automática') + a.ip + '(Preferido)');
  else L.push(puntos('Dirección IPv4') + a.ip + (todo ? '(Preferido)' : ''));
  L.push(puntos('Máscara de subred') + (a.ip ? a.mask : '0.0.0.0'), puntos('Puerta de enlace predeterminada') + (a.gw || ''));
  if (todo) {
    if (a.dhcp && tieneIp(s)) L.push(puntos('Servidor DHCP') + s.red.dhcpServidor);
    L.push(puntos('Servidores DNS') + (a.dns[0] || ''), ...a.dns.slice(1).map(d => ' '.repeat(47) + d));
    L.push(puntos('NetBIOS sobre TCP/IP') + 'habilitado');
  }
  return L.join('\n');
}

function ping(s, args) {
  const destino = args.find(x => !x.startsWith('-') && !/^\d+$/.test(x)) || args.find(x => ipNum(x) != null);
  if (!destino) return 'Uso: ping [-n cuenta] destino';
  const r = resolver(s, destino);
  if (r.error) { s.ultimoPing[destino.toLowerCase()] = false; return `La solicitud de ping no pudo encontrar el host ${destino}. Compruebe el nombre y vuelva a intentarlo.`; }
  const ok = alcanzable(s, r.ip);
  s.ultimoPing[destino.toLowerCase()] = ok;
  s.ultimoPing[r.ip] = ok;
  const nombre = ipNum(destino) != null ? r.ip : `${destino} [${r.ip}]`;
  const local = misma(r.ip, s.adaptador.ip || '0.0.0.0', s.adaptador.mask || '255.255.255.255');
  const t = local ? '<1m' : '=14m';
  let cuerpo;
  if (ok) cuerpo = Array(4).fill(`Respuesta desde ${r.ip}: bytes=32 tiempo${t}s TTL=${local ? 128 : 117}`).join('\n');
  else if (!tieneIp(s)) cuerpo = Array(4).fill('Error general.').join('\n');
  else if (!local && (!s.adaptador.gw || !s.red.lan.includes(s.adaptador.gw))) cuerpo = Array(4).fill(`Respuesta desde ${s.adaptador.ip}: Host de destino inaccesible.`).join('\n');
  else cuerpo = Array(4).fill('Tiempo de espera agotado para esta solicitud.').join('\n');
  const rec = ok ? 4 : 0;
  return `\nHaciendo ping a ${nombre} con 32 bytes de datos:\n${cuerpo}\n\nEstadísticas de ping para ${r.ip}:\n    Paquetes: enviados = 4, recibidos = ${rec}, perdidos = ${4 - rec}\n    (${(4 - rec) * 25}% perdidos),`;
}
function tracert(s, args) {
  const destino = args[args.length - 1];
  if (!destino) return 'Uso: tracert destino';
  const r = resolver(s, destino);
  if (r.error) return `No se puede resolver el nombre del sistema de destino ${destino}.`;
  const L = [`\nTraza a ${ipNum(destino) != null ? r.ip : destino + ' [' + r.ip + ']'}\nsobre un máximo de 30 saltos:\n`];
  if (!tieneIp(s) || !s.adaptador.gw) L.push('  1     *        *        *     Tiempo de espera agotado para esta solicitud.');
  else if (misma(r.ip, s.adaptador.ip, s.adaptador.mask)) L.push(`  1    <1 ms    <1 ms    <1 ms  ${r.ip}`);
  else {
    L.push(`  1    <1 ms    <1 ms    <1 ms  ${s.adaptador.gw}`);
    if (alcanzable(s, r.ip)) L.push('  2     3 ms     2 ms     3 ms  10.255.0.1', '  3    11 ms    12 ms    11 ms  200.88.12.1', `  4    14 ms    13 ms    14 ms  ${r.ip}`);
    else L.push('  2     *        *        *     Tiempo de espera agotado para esta solicitud.', '  3     *        *        *     Tiempo de espera agotado para esta solicitud.');
  }
  return L.join('\n') + '\n\nTraza completa.';
}
function nslookup(s, args) {
  const nombre = args[0];
  if (!nombre) return 'Uso: nslookup nombre [servidor]';
  const servidor = args[1] || s.adaptador.dns[0] || '';
  const servOk = s.red.dnsValidos.includes(servidor) && alcanzable(s, servidor);
  const cab = `Servidor:  ${servOk ? (servidor === '192.168.10.5' ? 'srv-dc01.empresa.local' : 'dns.servidor') : 'UnKnown'}\nAddress:  ${servidor}\n`;
  if (!servOk) { s.ultimoNslookup[nombre.toLowerCase()] = false; s.nsFallo = true; return `DNS request timed out.\n    timeout was 2 seconds.\n${cab}\n*** Se agotó el tiempo de espera de la solicitud a ${servidor}`; }
  const ip = s.red.zona[nombre.toLowerCase()];
  s.ultimoNslookup[nombre.toLowerCase()] = !!ip;
  if (!ip) s.nsFallo = true;
  if (!ip) return `${cab}\n*** ${servidor} no encuentra ${nombre}: Non-existent domain`;
  return `${cab}\n${/empresa\.local$/i.test(nombre) || !nombre.includes('.') ? '' : 'Respuesta no autoritativa:\n'}Nombre:  ${nombre}\nAddress:  ${ip}`;
}
function netstat(s) {
  const a = s.adaptador.ip || '0.0.0.0';
  return ['\nConexiones activas\n', '  Proto  Dirección local          Dirección remota        Estado           PID',
    `  TCP    0.0.0.0:135            0.0.0.0:0               LISTENING        1104`, `  TCP    0.0.0.0:445            0.0.0.0:0               LISTENING        4`,
    ...(tieneIp(s) && s.red.internet ? [`  TCP    ${pad(a + ':52144', 23)}52.96.88.130:443        ESTABLISHED      9312`, `  TCP    ${pad(a + ':52190', 23)}142.250.78.4:443        ESTABLISHED      8840`] : []),
    ...(tieneIp(s) && s.unidades && Object.keys(s.unidades).length ? [`  TCP    ${pad(a + ':52201', 23)}192.168.10.30:445       ESTABLISHED      4`] : [])].join('\n');
}
function tasklist(s) {
  return ['', 'Nombre de imagen               PID Nombre de sesión  Núm. de ses Uso de memor', '========================= ======== ================ =========== ============',
    ...s.procesos.map(p => pad(p.nombre, 26) + String(p.pid).padStart(8) + ' ' + pad(p.nombre === 'System' ? 'Services' : 'Console', 17) + String(p.nombre === 'System' ? 0 : 1).padStart(11) + ' ' + (p.mem * 1024).toLocaleString('es-ES').padStart(10) + ' KB')].join('\n');
}
function taskkill(s, args) {
  const low = args.map(x => x.toLowerCase());
  const k = low.indexOf('/im'), j = low.indexOf('/pid');
  const victimas = k >= 0 ? s.procesos.filter(p => p.nombre.toLowerCase() === (args[k + 1] || '').toLowerCase()) : j >= 0 ? s.procesos.filter(p => String(p.pid) === args[j + 1]) : null;
  if (!victimas) return 'ERROR: sintaxis no válida. Escriba "TASKKILL /?" para su uso.\nEjemplo: taskkill /im nombre.exe /f';
  if (!victimas.length) return `ERROR: no se encontró el proceso "${args[(k >= 0 ? k : j) + 1] || ''}".`;
  if (victimas.some(p => p.nombre === 'System')) return 'ERROR: el proceso con PID 4 no se pudo terminar.\nMotivo: este es un proceso crítico del sistema.';
  if (victimas.some(p => p.forzar) && !low.includes('/f')) return `ERROR: el proceso "${victimas[0].nombre}" con PID ${victimas[0].pid} no se pudo terminar.\nMotivo: este proceso no responde; solo se puede terminar de forma forzada (opción /F).`;
  s.procesos = s.procesos.filter(p => !victimas.includes(p));
  return victimas.map(p => `CORRECTO: se terminó el proceso "${p.nombre}" con PID ${p.pid}.`).join('\n');
}
function servicio(s, accion, nombre) {
  const clave = Object.keys(s.servicios).find(k => k.toLowerCase() === (nombre || '').toLowerCase());
  if (!clave) return `El nombre del servicio no es válido.\n\nPuede obtener más ayuda con NET HELPMSG 2185.`;
  const sv = s.servicios[clave];
  if (accion === 'stop') { if (sv.estado === 'STOPPED') return `El servicio ${sv.nombre} no se ha iniciado.`; sv.estado = 'STOPPED'; return `El servicio de ${sv.nombre} está deteniéndose.\nEl servicio de ${sv.nombre} se detuvo correctamente.`; }
  if (sv.estado === 'RUNNING' && !sv.colgado) return `El servicio solicitado ya ha sido iniciado.`;
  if (sv.colgado && sv.estado === 'RUNNING') return 'El servicio solicitado ya ha sido iniciado.';
  if (clave === 'Spooler' && s.colaImpresion.some(t => t.danado)) { sv.estado = 'RUNNING'; sv.colgado = true; return `El servicio de ${sv.nombre} está iniciándose.\nEl servicio de ${sv.nombre} se ha iniciado correctamente.`; }
  sv.estado = 'RUNNING'; sv.colgado = false;
  return `El servicio de ${sv.nombre} está iniciándose.\nEl servicio de ${sv.nombre} se ha iniciado correctamente.`;
}
function scQuery(s, nombre) {
  const clave = Object.keys(s.servicios).find(k => k.toLowerCase() === (nombre || '').toLowerCase());
  if (!clave) return '[SC] EnumQueryServicesStatus:OpenService ERROR 1060:\n\nEl servicio especificado no existe como servicio instalado.';
  const sv = s.servicios[clave];
  return `\nNOMBRE_SERVICIO: ${clave}\n        TIPO               : 110  WIN32_OWN_PROCESS\n        ESTADO             : ${sv.estado === 'RUNNING' ? '4  RUNNING' : '1  STOPPED'}\n        CÓD_SALIDA_WIN32   : 0  (0x0)`;
}
function cola(s) {
  if (!s.colaImpresion.length) return 'No hay trabajos en la cola de impresión.';
  return ['Documento                          Propietario   Estado', ...s.colaImpresion.map(t => pad(t.doc, 35) + pad(t.usuario, 14) + (t.danado ? 'Error - Imprimiendo' : s.servicios.Spooler.colgado || s.servicios.Spooler.estado !== 'RUNNING' ? 'En cola' : 'Imprimiendo'))].join('\n');
}
function del(s, args) {
  const ruta = args.filter(x => !x.startsWith('/')).join(' ').toLowerCase();
  if (/spool\\printers/.test(ruta)) {
    if (s.servicios.Spooler.estado === 'RUNNING') return `El proceso no tiene acceso al archivo porque está siendo utilizado por otro proceso.\n(Pista: detén primero el servicio de cola de impresión.)`;
    s.colaImpresion = [];
    return 'Archivos eliminados de C:\\Windows\\System32\\spool\\PRINTERS.';
  }
  if (/%temp%|\\temp/.test(ruta)) {
    const libre = s.disco.tempGB;
    s.disco.libreGB = Math.round((s.disco.libreGB + libre) * 10) / 10; s.disco.tempGB = 0;
    return `Se eliminaron los archivos temporales (${libre.toLocaleString('es-ES')} GB). Algunos archivos en uso no se pudieron eliminar.`;
  }
  return 'No se encuentra el archivo o la ruta indicada.';
}
function dir(s) {
  return ` El volumen de la unidad C no tiene etiqueta.\n El número de serie del volumen es: 4C2E-91A0\n\n Directorio de C:\\Users\\${s.usuario}\n\n12/11/2026  08:15    <DIR>          Desktop\n12/11/2026  08:15    <DIR>          Documents\n12/11/2026  08:15    <DIR>          Downloads\n               0 archivos              0 bytes\n               3 dirs  ${Math.round(s.disco.libreGB * 1073741824).toLocaleString('es-ES')} bytes libres`;
}
function sfc(s, args) {
  if ((args[0] || '').toLowerCase() !== '/scannow') return 'Uso: sfc /scannow';
  if (!s.admin) return 'Debe ser administrador y ejecutar una sesión de consola para\nusar la utilidad SFC.\n(Pista: este simulador ya abre la consola como administrador en los casos que lo necesitan.)';
  const roto = s.sistemaDanado;
  s.sistemaDanado = false; s.sfcHecho = true;
  return 'Iniciando el examen del sistema. Este proceso tardará algún tiempo.\n\nIniciando la fase de comprobación del examen del sistema.\nComprobación 100% completada.\n\n' + (roto ? 'Protección de recursos de Windows encontró archivos dañados y los reparó correctamente.\nPara ver los detalles, consulte CBS.Log en windir\\Logs\\CBS\\CBS.log.' : 'Protección de recursos de Windows no encontró ninguna infracción de integridad.');
}
function gpupdate(s, args) {
  if (!args.map(x => x.toLowerCase()).includes('/force') && args.length) return 'Opción no válida. Uso: gpupdate [/force]';
  if (!tieneIp(s) || !alcanzable(s, '192.168.10.5')) return 'Actualizando directiva...\n\nNo se puede actualizar la directiva del equipo: no se pudo contactar con el controlador de dominio.';
  s.gpo.aplicadas.push(...s.gpo.pendientes); s.gpo.pendientes = [];
  s.grupos = [...new Set([...s.grupos, ...(s.gruposPendientes || [])])]; s.gruposPendientes = [];
  s.gpoActualizada = true;
  return 'Actualizando directiva...\n\nLa actualización de la directiva de equipo se completó correctamente.\nLa actualización de la directiva de usuario se completó correctamente.\n\n(En la vida real, los grupos nuevos de un usuario se aplican del todo al cerrar sesión y volver a entrar; el simulador lo da por hecho.)';
}
function gpresult(s) {
  return `\nCONFIGURACIÓN DE USUARIO\n------------------------\n    Nombre CN: CN=${s.usuario},OU=Usuarios,DC=empresa,DC=local\n    Objetos de directiva de grupo aplicados\n    ---------------------------------------\n${s.gpo.aplicadas.map(g => '        ' + g).join('\n')}\n\n    El usuario es parte de los siguientes grupos de seguridad\n    ---------------------------------------------------------\n${s.grupos.map(g => '        ' + g.replace(/^EMPRESA\\/, '')).join('\n')}`;
}
function whoami(s, args) {
  if ((args[0] || '').toLowerCase() === '/groups') return '\nINFORMACIÓN DE GRUPO\n--------------------\n\nNombre de grupo\n=================================\n' + ['Todos', ...s.grupos].join('\n');
  return `${s.dominio.toLowerCase()}\\${s.usuario}`;
}
function netUse(s, args) {
  if (!args.length) {
    const u = Object.entries(s.unidades);
    return u.length ? 'Se registrarán las nuevas conexiones.\n\nEstado       Local     Remoto                    Red\n-------------------------------------------------------------------------------\n' + u.map(([l, r]) => `OK           ${pad(l, 10)}${pad(r, 26)}Microsoft Windows Network`).join('\n') + '\nSe ha completado el comando correctamente.' : 'Se registrarán las nuevas conexiones.\n\nNo hay entradas en la lista.';
  }
  const letra = args[0].toUpperCase();
  if (args.map(x => x.toLowerCase()).includes('/delete')) { if (!s.unidades[letra]) return 'No se encontró la conexión de red.'; delete s.unidades[letra]; return `${letra} se ha eliminado correctamente.`; }
  const ruta = (args[1] || '').toLowerCase().replace(/\\+$/, '');
  if (!/^[a-z]:$/i.test(letra) || !ruta.startsWith('\\\\')) return 'La sintaxis de este comando es:\n\nNET USE [unidad:] \\\\servidor\\recurso [/persistent:yes]';
  if (s.unidades[letra]) return 'Error de sistema 85.\n\nEl nombre del dispositivo local ya se está usando.';
  const servidor = ruta.split('\\')[2];
  const r = resolver(s, servidor);
  if (r.error || !alcanzable(s, r.ip)) return 'Error de sistema 53.\n\nNo se ha encontrado la ruta de acceso de la red.';
  const grupo = s.recursos[ruta];
  if (!grupo) return 'Error de sistema 67.\n\nNo se encuentra el nombre de la red.';
  if (!s.grupos.includes(grupo)) { s.accesoDenegado = true; return 'Error de sistema 5.\n\nAcceso denegado.'; }
  s.unidades[letra] = ruta.replace(/^\\\\srv-archivos/, '\\\\SRV-ARCHIVOS');
  return 'Se ha completado el comando correctamente.';
}
function netsh(s, args) {
  const t = args.join(' ').toLowerCase();
  const a = s.adaptador;
  let m;
  if (/^interface (ip|ipv4) show config/.test(t)) return `\nConfiguración para la interfaz "${a.nombre}"\n    DHCP habilitado:                         ${a.dhcp ? 'Sí' : 'No'}\n    Dirección IP:                           ${a.ip || ''}\n    Puerta de enlace predeterminada:        ${a.gw || ''}\n    ${a.dnsEstatico ? 'Servidores DNS configurados estáticamente' : 'Servidores DNS configurados a través de DHCP'}:  ${a.dns.join('\n' + ' '.repeat(46))}`;
  if ((m = t.match(/^interface (?:ip|ipv4) set dns(?:servers)? (?:name=)?"?([^"]+?)"? (static|dhcp)(?: (\d+\.\d+\.\d+\.\d+))?/))) {
    if (m[1] !== a.nombre.toLowerCase()) return 'El nombre de la interfaz no es válido. Use "Ethernet".';
    if (m[2] === 'dhcp') { a.dns = [...s.red.dnsDhcp]; a.dnsEstatico = false; return ''; }
    if (!m[3]) return 'Uso: netsh interface ip set dns "Ethernet" static 192.168.10.5';
    a.dns = [m[3]]; a.dnsEstatico = true; return '';
  }
  if (/^winhttp show proxy/.test(t)) return s.proxy ? `\nConfiguración actual de proxy de WinHTTP:\n\n    Servidor(es) proxy:  ${s.proxy}\n    Lista de omisión:    (ninguna)` : '\nConfiguración actual de proxy de WinHTTP:\n\n    Acceso directo (sin servidor proxy).';
  if (/^winhttp reset proxy/.test(t)) { s.proxy = null; return '\nConfiguración actual de proxy de WinHTTP:\n\n    Acceso directo (sin servidor proxy).'; }
  if (/^interface show interface/.test(t)) return `\nEstado de admin  Estado          Tipo             Nombre de interfaz\n-------------------------------------------------------------------------\nHabilitado       ${a.cable ? 'Conectado       ' : 'Desconectado    '}Dedicado         ${a.nombre}`;
  return 'No se encontró el comando siguiente: netsh ' + args.join(' ') + '\nEjemplos: netsh interface ip show config · netsh interface ip set dns "Ethernet" dhcp · netsh winhttp show proxy';
}
function eventos(s) {
  const lista = s.eventos.length ? s.eventos : [{ nivel: 'Información', origen: 'Service Control Manager', id: 7036, texto: 'El servicio Windows Update entró en estado de ejecución.' }];
  return 'Visor de eventos · Registros de Windows > Sistema (más recientes primero)\n\n' + lista.map(e => `${pad(e.nivel, 12)} ${pad(e.origen, 26)} Id. ${pad(e.id, 6)} ${e.texto}`).join('\n');
}
function systeminfo(s) {
  return [`Nombre de host:                            ${s.hostname}`, `Nombre del sistema operativo:              ${s.so}`, `Versión del sistema operativo:             ${s.version} N/D Compilación 22631`,
    'Fabricante del sistema:                    Dell Inc.', 'Modelo el sistema:                         OptiPlex 7010', 'Tipo de sistema:                           x64-based PC',
    'Cantidad total de memoria física:          16.110 MB', `Cantidad de memoria física disponible:     ${Math.max(800, 16110 - s.procesos.reduce((n, p) => n + p.mem, 0) - 3000).toLocaleString('es-ES')} MB`,
    `Dominio:                                   ${s.dominio.toLowerCase()}.local`, `Servidor de inicio de sesión:              \\\\SRV-DC01`].join('\n');
}
function psDrive(s) {
  return `\nName  Used (GB)  Free (GB) Provider  Root\n----  ---------  --------- --------  ----\nC        ${String(Math.round((s.disco.totalGB - s.disco.libreGB) * 10) / 10).padStart(6)}     ${String(s.disco.libreGB).padStart(6)} FileSystem C:\\`;
}
function testNet(s, args) {
  const low = args.map(x => x.toLowerCase());
  const destino = args.find((x, i) => !x.startsWith('-') && low[i - 1] !== '-port');
  const k = low.indexOf('-port');
  const puerto = k >= 0 ? Number(args[k + 1]) : null;
  if (!destino) return 'Uso: Test-NetConnection destino [-Port n]';
  const r = resolver(s, destino);
  if (r.error) return `ADVERTENCIA: Name resolution of ${destino} failed\n\nComputerName   : ${destino}\nRemoteAddress  :\nPingSucceeded  : False`;
  const ok = alcanzable(s, r.ip) && !(puerto && s.puertosBloqueados?.includes(puerto));
  return `\nComputerName     : ${destino}\nRemoteAddress    : ${r.ip}\n${puerto ? `RemotePort       : ${puerto}\n` : ''}InterfaceAlias   : ${s.adaptador.nombre}\nSourceAddress    : ${s.adaptador.ip || ''}\n${puerto ? 'TcpTestSucceeded' : 'PingSucceeded   '} : ${ok ? 'True' : 'False'}`;
}

const AYUDA = `Comandos disponibles en este simulador:
  ipconfig [/all | /release | /renew | /flushdns | /displaydns]
  ping destino · tracert destino · nslookup nombre [servidor] · netstat -ano
  netsh interface ip show config · netsh interface ip set dns "Ethernet" (dhcp | static IP)
  netsh winhttp show proxy · netsh winhttp reset proxy · netsh interface show interface
  hostname · whoami [/groups] · systeminfo · tasklist · taskkill /im nombre.exe /f · taskkill /pid N /f
  sc query servicio · net stop servicio · net start servicio · net use [X: \\\\servidor\\recurso | X: /delete]
  printqueue (ver la cola de impresión) · del C:\\Windows\\System32\\spool\\PRINTERS\\* · del /q %TEMP%\\*
  dir · sfc /scannow · gpupdate /force · gpresult /r · eventvwr · cls
  PowerShell: Test-NetConnection destino [-Port n] · Resolve-DnsName nombre · Get-PSDrive C`;

export function ejecutar(s, linea) {
  const texto = linea.trim();
  if (!texto) return { salida: '', prompt: prompt(s) };
  s.historial.push(texto);
  const args = (texto.match(/"[^"]*"|\S+/g) || []).map(x => x.replace(/^"|"$/g, ''));
  const cmd = args.shift().toLowerCase().replace(/\.exe$/, '');
  const sub = (args[0] || '').toLowerCase();
  s.patrones.add(cmd + (['ipconfig', 'net', 'sc', 'netsh', 'whoami', 'gpresult', 'gpupdate', 'sfc'].includes(cmd) && sub ? ' ' + sub : ''));
  let salida;
  switch (cmd) {
    case 'ipconfig': salida = ipconfig(s, args); break;
    case 'ping': salida = ping(s, args); break;
    case 'tracert': salida = tracert(s, args); break;
    case 'nslookup': salida = nslookup(s, args); break;
    case 'resolve-dnsname': { const r = resolver(s, args[0] || ''); salida = r.error ? `Resolve-DnsName : ${args[0]} : No existe el nombre DNS` : `\nName                         Type   TTL   Section    IPAddress\n----                         ----   ---   -------    ---------\n${pad(args[0], 29)}A      300   Answer     ${r.ip}`; break; }
    case 'netstat': salida = netstat(s); break;
    case 'hostname': salida = s.hostname; break;
    case 'whoami': salida = whoami(s, args); break;
    case 'systeminfo': salida = systeminfo(s); break;
    case 'tasklist': salida = tasklist(s); break;
    case 'taskkill': salida = taskkill(s, args); break;
    case 'sc': salida = sub === 'query' ? scQuery(s, args[1]) : 'Uso: sc query nombre_servicio'; break;
    case 'net':
      if (sub === 'stop' || sub === 'start') salida = servicio(s, sub, args[1]);
      else if (sub === 'use') salida = netUse(s, args.slice(1));
      else salida = 'La sintaxis de este comando es:\n\nNET [ START | STOP | USE ]';
      break;
    case 'netsh': salida = netsh(s, args); break;
    case 'printqueue': case 'get-printjob': salida = cola(s); break;
    case 'del': case 'erase': case 'remove-item': salida = del(s, args); break;
    case 'dir': case 'ls': salida = dir(s); break;
    case 'sfc': salida = sfc(s, args); break;
    case 'dism': salida = 'Herramienta Administración y mantenimiento de imágenes de implementación\n[==========================100.0%==========================]\nLa operación de restauración finalizó correctamente.'; s.dism = true; break;
    case 'chkdsk': salida = 'El tipo del sistema de archivos es NTFS.\n\nAVISO: no se especificó el parámetro /F.\nCHKDSK se está ejecutando en modo de solo lectura.\n\nWindows examinó el sistema de archivos y no encontró problemas.\nNo se requieren más acciones.'; break;
    case 'gpupdate': salida = gpupdate(s, args); break;
    case 'gpresult': salida = gpresult(s); break;
    case 'eventvwr': case 'get-winevent': salida = eventos(s); break;
    case 'get-psdrive': salida = psDrive(s); break;
    case 'test-netconnection': case 'tnc': salida = testNet(s, args); break;
    case 'ver': salida = `\n${s.so} [Versión ${s.version}.4460]`; break;
    case 'cls': case 'clear': return { salida: '', prompt: prompt(s), limpiar: true };
    case 'help': case '?': case '/?': salida = AYUDA; break;
    case 'exit': salida = '(En el simulador la consola no se cierra.)'; break;
    default: salida = `"${cmd}" no se reconoce como un comando interno o externo,\nprograma o archivo por lotes ejecutable.\n(Escribe help para ver los comandos del simulador.)`;
  }
  return { salida, prompt: prompt(s) };
}

const PALABRAS = ['ipconfig', 'ipconfig /all', 'ipconfig /release', 'ipconfig /renew', 'ipconfig /flushdns', 'ipconfig /displaydns', 'ping', 'tracert', 'nslookup', 'netstat -ano', 'netsh interface ip show config', 'netsh interface ip set dns', 'netsh winhttp show proxy', 'netsh winhttp reset proxy', 'hostname', 'whoami', 'whoami /groups', 'systeminfo', 'tasklist', 'taskkill', 'sc query', 'net stop', 'net start', 'net use', 'printqueue', 'sfc /scannow', 'gpupdate /force', 'gpresult /r', 'eventvwr', 'Test-NetConnection', 'Resolve-DnsName', 'Get-PSDrive C', 'help', 'cls'];
export function completar(s, linea) {
  const t = linea.toLowerCase();
  const c = PALABRAS.filter(p => p.toLowerCase().startsWith(t) && p.toLowerCase() !== t);
  if (!t || !c.length) return null;
  let comun = c[0];
  for (const p of c) while (!p.toLowerCase().startsWith(comun.toLowerCase())) comun = comun.slice(0, -1);
  return comun.length > linea.length ? comun + (c.length === 1 ? ' ' : '') : null;
}
