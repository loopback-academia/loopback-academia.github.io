// Constructor de CV: convierte el progreso del alumno en secciones de un CV técnico (sin DOM: se prueba en Node).
// Solo incluye lo que el alumno ha completado de verdad.
import { TITULO_AREA } from '../certificado.js';

const HABILIDAD_GRUPO = {
  numeros: 'Direccionamiento IPv4 e IPv6 y subnetting',
  cli: 'Configuración de switches y routers Cisco IOS',
  averias: 'Resolución de averías de red',
  sql: 'Consultas SQL: filtros, JOIN, agregaciones y subconsultas',
  seguridad: 'Prevención de inyección SQL y consultas parametrizadas',
  python: 'Programación en Python',
  javascript: 'Programación en JavaScript',
  consola: 'Diagnóstico de Windows por consola (ipconfig, netsh, servicios, directivas)',
  casos: 'Gestión de tickets, prioridades y SLA',
  phishing: 'Detección de phishing e ingeniería social',
  vocab: 'Inglés técnico: vocabulario de TI',
  lectura: 'Inglés técnico: lectura de errores y documentación',
  frases: 'Inglés técnico: tickets, llamadas y entrevistas',
  inicio: 'Uso del ordenador: atajos de teclado, archivos y unidades',
  paso: 'Lectura y seguimiento de código paso a paso (variables, pila de llamadas)',
  topologias: 'Diseño y diagnóstico de topologías de red (VLAN, troncales, enrutamiento y DHCP)',
  contrasenas: 'Contraseñas seguras, hashes y sal',
  cripto: 'Criptografía simétrica, asimétrica y firmas digitales',
  firewall: 'Reglas de cortafuegos y segmentación con DMZ',
  logs: 'Análisis de registros y detección de ataques',
  incidentes: 'Respuesta a incidentes de seguridad',
  proyectos: 'Proyectos completos documentados',
};

const PREFIJO = { consola: 'Caso de soporte en Windows: ', cli: 'Cisco IOS: ', averias: 'Avería de red resuelta: ', sql: 'SQL: ', casos: 'Caso de mesa de ayuda: ', python: '', javascript: '' };

export function datosCv({ curso, catalogo, leccionHecha, labHecho, finalAprobado }) {
  const modulos = curso.modulos.filter(m => m.lecciones.length && !/bienvenida|carrera/i.test(m.titulo) && m.lecciones.every(l => leccionHecha(l.id)))
    .map(m => ({ area: m.area, titulo: m.titulo }));
  const practicas = catalogo.filter(l => !l.libre && !l.clave.startsWith('entrevista:') && l.clave !== 'inicio:orientacion' && labHecho(l.progreso)).map(l => ({ area: l.area, titulo: (PREFIJO[l.grupo] || '') + l.titulo, grupo: l.grupo }));
  const certificados = Object.keys(TITULO_AREA).filter(a => finalAprobado(a)).map(a => ({ area: a, titulo: TITULO_AREA[a] }));
  const habilidades = [...new Set(practicas.map(p => HABILIDAD_GRUPO[p.grupo]).filter(Boolean))];
  const lecciones = curso.modulos.reduce((n, m) => n + m.lecciones.filter(l => leccionHecha(l.id)).length, 0);
  return { modulos, practicas, certificados, habilidades, lecciones };
}

// Resumen profesional sugerido a partir de lo completado (el alumno lo edita).
export function resumenSugerido(d, titular = '') {
  if (!d.lecciones) return '';
  const NOMBRE = { base: 'fundamentos de informática', redes: 'redes', bd: 'bases de datos y SQL', prog: 'programación', ti: 'soporte técnico', en: 'inglés técnico', sec: 'ciberseguridad' };
  const areas = [...new Set([...d.modulos.map(m => m.area), ...d.practicas.map(p => p.area)])].map(a => NOMBRE[a]).filter(Boolean);
  const lista = areas.length > 1 ? areas.slice(0, -1).join(', ') + ' y ' + areas[areas.length - 1] : areas[0];
  const partes = [`${titular || 'Profesional de TI en formación'} con formación práctica en ${lista || 'tecnología'}.`];
  if (d.practicas.length) partes.push(`He completado ${d.practicas.length} ${d.practicas.length === 1 ? 'laboratorio práctico' : 'laboratorios prácticos'} con corrección automática${d.habilidades.length ? ', entre ellos ' + d.habilidades.slice(0, 3).map(h => h.charAt(0).toLowerCase() + h.slice(1)).join('; ') : ''}.`);
  partes.push('Busco mi primer puesto para aportar método, buena comunicación y ganas de aprender.');
  return partes.join(' ');
}
