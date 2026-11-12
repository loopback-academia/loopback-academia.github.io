// Catálogo de laboratorios para la página de práctica, el panel y la página del laboratorio.
import { LABS } from './ios-labs.js';
import { EJERCICIOS } from './sql-ejercicios.js';
import { EJERCICIOS as CODIGO } from '../codigo/ejercicios.js';
import { PROYECTOS } from '../proyectos/proyectos.js';
import { CASOS, TURNO } from '../casos/casos.js';
import { WIN_LABS } from './windows-labs.js';
import { LINUX_LABS } from './linux-labs.js';
import { GIT_LABS } from './git-labs.js';
import { CAPTURAS } from './capturas.js';
import { RETOS_ER } from './er.js';
import { RETOS_CONC } from './concurrencia.js';
import { VOCAB, LECTURAS, FRASES } from '../en/ingles.js';
import { CONVERSACIONES } from '../ti/atencion.js';
import { ENCARGOS } from '../ti/hardware.js';
import { RUTAS_ENTREVISTA } from '../ti/entrevista.js';

const SQL_INFO = {
  select: ['Consultas SELECT y filtros', 'principiante'],
  join: ['Uniones (JOIN)', 'intermedio'],
  agregacion: ['Agrupar y contar (GROUP BY)', 'intermedio'],
  funciones: ['Funciones de texto, fecha y CASE', 'intermedio'],
  subconsultas: ['Subconsultas y CTE (WITH)', 'intermedio'],
  modificar: ['INSERT, UPDATE y DELETE', 'intermedio'],
  ddl: ['Crear tablas, índices y vistas (DDL)', 'intermedio'],
  ventanas: ['Funciones de ventana (OVER)', 'avanzado'],
  inventario: ['Reto: informes del inventario de red', 'avanzado'],
  detective: ['Caso detective: el apagón de la sucursal', 'intermedio'],
  analisis: ['Análisis de ventas: KPI e informes', 'avanzado'],
};

// Retos del simulador de topologías: [id, título, nivel, tareas, texto]. Se copian aquí para no cargar el motor en cada
// página; tests/topologia.test.mjs comprueba que coinciden con js/labs/topologia-retos.js.
export const TOPO_INFO = [
  ['lan', 'Tu primera LAN', 'principiante', 3, 'Conecta tres PC a un switch, dales IP y comprueba que se ven con ping.'],
  ['gateway', 'Dos redes unidas por un router', 'principiante', 4, 'Configura el router y las puertas de enlace para pasar de una LAN a otra.'],
  ['vlan', 'Separar departamentos con VLAN', 'intermedio', 4, 'Aísla Ventas y Soporte en el mismo switch y demuéstralo con ping.'],
  ['troncal', 'Dos switches unidos por un troncal', 'intermedio', 3, 'Haz que las VLAN crucen de un switch a otro con un enlace 802.1Q.'],
  ['intervlan', 'Router-on-a-stick: enrutar entre VLAN', 'intermedio', 4, 'Subinterfaces en el router para que Ventas y Soporte se comuniquen.'],
  ['estaticas', 'Rutas estáticas entre dos sedes', 'intermedio', 3, 'Añade las rutas de ida y de vuelta entre dos routers.'],
  ['dhcp', 'Un servidor DHCP para la oficina', 'intermedio', 3, 'Activa el DHCP en el servidor y haz que los PC obtengan su IP.'],
  ['averias', 'La red que no funciona', 'avanzado', 3, 'Cuatro errores escondidos: encuéntralos con ping y arréglalos.'],
  ['libre', 'Modo libre: diseña tu red', 'principiante', 1, 'Lienzo en blanco con PC, servidores, switches y routers.'],
];

export const NIVELES = { principiante: 'Nivel 1 · Principiante', intermedio: 'Nivel 2 · Intermedio', avanzado: 'Nivel 3 · Avanzado' };
export const AREAS = { redes: 'Redes', bd: 'Bases de datos', prog: 'Programación', ti: 'Empleo TI', en: 'Inglés técnico' };

export const CATALOGO = [
  ...Object.entries(VOCAB).map(([id, v]) => ({ clave: 'vocab:' + id, area: 'en', grupo: 'vocab', nivel: 'principiante', progreso: 'vocab-' + id, titulo: 'Vocabulario: ' + v.titulo.toLowerCase(), texto: `${v.palabras.length} palabras con ejemplo y pronunciación.`, tareas: v.palabras.length, unidad: 'palabras' })),
  ...Object.entries(LECTURAS).map(([id, l]) => ({ clave: 'lectura:' + id, area: 'en', grupo: 'lectura', nivel: id === 'errores' ? 'principiante' : 'intermedio', progreso: 'lectura-' + id, titulo: 'Lectura: ' + l.titulo.toLowerCase(), texto: 'Textos reales en inglés con preguntas de comprensión.', tareas: l.textos.reduce((n, t) => n + t.preguntas.length, 0), unidad: 'preguntas' })),
  ...Object.entries(FRASES).map(([id, f]) => ({ clave: 'frases:' + id, area: 'en', grupo: 'frases', nivel: id === 'entrevista' ? 'avanzado' : 'intermedio', progreso: 'frases-' + id, titulo: 'Frases: ' + f.titulo.toLowerCase(), texto: 'Elige la forma correcta y profesional de decirlo.', tareas: f.items.length, unidad: 'situaciones' })),
  { clave: 'turno:' + TURNO.id, area: 'ti', grupo: 'proyectos', nivel: TURNO.nivel, progreso: TURNO.progreso, titulo: TURNO.titulo.replace(/^Proyecto: (.)/, (_, c) => c.toUpperCase()), texto: TURNO.resumen, tareas: TURNO.casos.length, unidad: 'tickets' },
  ...Object.entries(GIT_LABS).map(([id, l]) => ({ clave: 'git:' + id, area: 'prog', grupo: 'git', nivel: l.nivel, progreso: 'git-' + id, titulo: 'Git: ' + l.titulo.charAt(0).toLowerCase() + l.titulo.slice(1), texto: l.intro.split('. ')[0] + '.', tareas: l.tareas.length })),
  ...Object.entries(LINUX_LABS).map(([id, l]) => ({ clave: 'linux:' + id, area: 'prog', grupo: 'linux', nivel: l.nivel, progreso: 'linux-' + id, titulo: l.titulo, texto: l.intro.split('. ')[0] + '.', tareas: l.tareas.length })),
  { clave: 'ad:mesa', area: 'ti', grupo: 'consola', nivel: 'intermedio', progreso: 'ad-mesa', titulo: 'Active Directory: la cola de tickets', texto: 'Desbloquear cuentas, restablecer contraseñas, altas, bajas, cambios de departamento y grupos. Siete tickets reales.', tareas: 7, unidad: 'tickets' },
  ...Object.entries(CONVERSACIONES).map(([id, c]) => ({ clave: 'atencion:' + id, area: 'ti', grupo: 'atencion', nivel: c.nivel, progreso: 'atencion-' + id, titulo: c.titulo, texto: `${c.canal} con ${c.usuario}. Elige cómo responder en cada momento.`, tareas: c.pasos.length, unidad: 'respuestas' })),
  ...Object.entries(ENCARGOS).map(([id, e]) => ({ clave: 'pc:' + id, area: 'ti', grupo: 'hardware', nivel: id === 'oficina' ? 'principiante' : 'intermedio', progreso: 'pc-' + id, titulo: 'Armar un PC: ' + e.titulo.toLowerCase(), texto: 'Elige piezas compatibles que cumplan el encargo y el presupuesto.' })),
  { clave: 'hw:averias', area: 'ti', grupo: 'hardware', nivel: 'intermedio', progreso: 'hw-averias', titulo: 'Diagnosticar averías de hardware', texto: 'Cinco equipos con síntomas reales: decide qué haces primero.', tareas: 5, unidad: 'casos' },
  { clave: 'orden:instalar-windows', area: 'ti', grupo: 'hardware', nivel: 'principiante', progreso: 'orden-instalar-windows', titulo: 'Preparar un PC nuevo para un empleado', texto: 'Ordena los pasos: de la memoria USB de instalación a entregar el equipo.' },
  ...Object.entries(WIN_LABS).map(([id, l]) => ({ clave: 'win:' + id, area: 'ti', grupo: 'consola', nivel: l.nivel, progreso: 'win-' + id, titulo: l.titulo, texto: l.intro.split('. ')[0] + '.', tareas: l.tareas.length })),
  { clave: 'phishing:bandeja', area: 'ti', grupo: 'empleo', nivel: 'principiante', progreso: 'phishing-bandeja', titulo: 'Detector de phishing', texto: 'Revisa una bandeja de 14 correos: decide cuáles son trampas y señala lo que las delata.', tareas: 14, unidad: 'correos' },
  ...Object.entries(RUTAS_ENTREVISTA).map(([id, t]) => ({ clave: 'entrevista:' + id, area: 'ti', grupo: 'empleo', nivel: 'intermedio', progreso: 'entrevista-' + id, titulo: 'Entrevista: ' + t.split(' (')[0].toLowerCase().replace(/^./, c => c.toUpperCase()), texto: 'Seis preguntas de entrevista real con puntos clave y respuesta modelo.', tareas: 6, unidad: 'preguntas' })),
  ...Object.values(CASOS).map(c => ({ clave: 'caso:' + c.id, area: 'ti', grupo: 'casos', nivel: c.nivel, progreso: 'caso-' + c.id, titulo: c.titulo, texto: c.resumen, lugar: c.lugar })),
  ...Object.values(PROYECTOS).map(p => ({ clave: 'proyecto:' + p.id, area: p.area, grupo: 'proyectos', nivel: p.nivel, progreso: p.progreso, titulo: p.titulo.replace(/^Proyecto: (.)/, (_, c) => c.toUpperCase()), texto: p.resumen, tareas: p.fases.reduce((n, f) => n + f.requisitos.length, 0) })),
  ...TOPO_INFO.map(([id, titulo, nivel, tareas, texto]) => ({ clave: 'topo:' + id, area: 'redes', grupo: 'topologias', nivel, progreso: 'topo-' + id, titulo, texto, tareas, unidad: tareas === 1 ? 'tarea' : 'tareas' })),
  ...Object.entries(CAPTURAS).map(([id, c]) => ({ clave: 'cap:' + id, area: 'redes', grupo: 'capturas', nivel: 'intermedio', progreso: 'cap-' + id, titulo: 'Captura: ' + c.titulo.charAt(0).toLowerCase() + c.titulo.slice(1), texto: c.intro.split('. ')[0] + '.', tareas: c.preguntas.length, unidad: 'preguntas' })),
  { clave: 'lab:subnetting', area: 'redes', grupo: 'numeros', nivel: 'principiante', progreso: 'subnetting', titulo: 'Entrenador de subnetting', texto: 'Red, broadcast, hosts y máscara de direcciones al azar. Completa 10 aciertos seguidos.' },
  { clave: 'lab:binario', area: 'redes', grupo: 'numeros', nivel: 'principiante', progreso: 'binario', titulo: 'Binario y decimal', texto: 'Convierte octetos de binario a decimal y al revés hasta hacerlo de cabeza.' },
  { clave: 'lab:ipv6', area: 'redes', grupo: 'numeros', nivel: 'intermedio', progreso: 'ipv6', titulo: 'Entrenador IPv6', texto: 'Abreviar y expandir direcciones, EUI-64, tipos de dirección y prefijos. Dos aciertos de cada tipo.' },
  { clave: 'lab:vlsm', area: 'redes', grupo: 'numeros', nivel: 'intermedio', progreso: 'vlsm', titulo: 'Diseño VLSM', texto: 'Reparte un bloque de direcciones entre varias redes de distinto tamaño.' },
  ...Object.entries(LABS).map(([id, l]) => ({ clave: 'cli:' + id, area: 'redes', grupo: l.tipo === 'averia' ? 'averias' : 'cli', nivel: l.nivel, progreso: 'cli-' + id, titulo: l.titulo.replace(/^Avería:\s*/, ''), texto: l.intro.split('. ')[0] + '.', tareas: l.tareas.length })),
  ...Object.entries(RETOS_ER).map(([id, r]) => ({ clave: 'er:' + id, area: 'bd', grupo: 'diseno', nivel: 'intermedio', progreso: 'er-' + id, titulo: 'Diseña: ' + r.titulo.charAt(0).toLowerCase() + r.titulo.slice(1), texto: 'Crea las tablas, claves y relaciones; se dibuja el diagrama y se genera el SQL.' })),
  { clave: 'fn:formas', area: 'bd', grupo: 'diseno', nivel: 'intermedio', progreso: 'fn-formas', titulo: '¿Qué forma normal rompe?', texto: 'Seis tablas reales: decide si rompen la 1FN, la 2FN o la 3FN, o si están bien.', tareas: 6, unidad: 'tablas' },
  ...Object.entries(RETOS_CONC).map(([id, r]) => ({ clave: 'conc:' + id, area: 'bd', grupo: 'transacciones', nivel: r.nivel, progreso: 'conc-' + id, titulo: 'Dos sesiones: ' + r.titulo.toLowerCase(), texto: r.intro.split('. ')[0] + '.', tareas: r.tareas.length })),
  { clave: 'sqli:login', area: 'bd', grupo: 'seguridad', nivel: 'avanzado', progreso: 'sqli-login', titulo: 'Inyección SQL: atacar y defender', texto: 'Entra como administrador sin contraseña, saca datos por un buscador y arregla la aplicación con consultas parametrizadas.', tareas: 3, unidad: 'retos' },
  ...Object.entries(EJERCICIOS).map(([id, l]) => ({ clave: 'sql:' + id, area: 'bd', grupo: 'sql', nivel: SQL_INFO[id]?.[1] || 'intermedio', progreso: 'sql-' + id, titulo: SQL_INFO[id]?.[0] || id, texto: id === 'detective' ? 'Investiga un incidente real con consultas: registros de cambios, VPN, SSH y tarjetas de acceso. Sigue las pistas.' : id === 'analisis' ? 'Ingresos por mes, rankings, ticket medio, crecimiento y limpieza de datos sucios, con gráficos.' : `${l.length} ejercicios sobre la base de datos del inventario de red de una empresa (SQLite en tu navegador).`, tareas: l.length })),
  ...Object.entries(CODIGO).map(([id, c]) => ({ clave: 'code:' + id, area: 'prog', grupo: c.libre ? 'libre' : c.lang, nivel: c.nivel, progreso: 'code-' + id, titulo: c.titulo, texto: c.libre ? `Escribe y ejecuta cualquier programa en ${c.lang === 'python' ? 'Python' : 'JavaScript'}, sin corrección.` : `${c.ejercicios.length} ejercicios en ${c.lang === 'python' ? 'Python' : 'JavaScript'} que se corrigen solos.`, tareas: c.libre ? null : c.ejercicios.length, libre: !!c.libre })),
];
