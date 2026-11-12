// Certificado de finalización de un área (sin DOM: se prueba en Node). Lo emite Loopback, no está avalado por nadie
// y no influye en conseguir un empleo; así lo dice el propio certificado.

export const TITULO_AREA = {
  redes: 'Redes de computadoras',
  bd: 'Bases de datos y SQL',
  prog: 'Programación',
  ti: 'Empleo TI: soporte técnico y mesa de ayuda',
  en: 'Inglés técnico para TI',
  sec: 'Ciberseguridad: fundamentos, defensa y operaciones',
};

export const FIRMA = 'Gabriel PD';
export const CARGO_FIRMA = 'Fundador de Loopback';
export const AVISO = 'Certificado emitido por Loopback, plataforma de aprendizaje independiente. No es un título oficial, no está avalado por ninguna institución, empresa ni entidad certificadora (no equivale a certificaciones como Cisco CCNA) y no garantiza ni influye en la obtención de un empleo. Solo acredita que su titular completó este recorrido de aprendizaje.';

// Código del certificado: resumen corto de nombre, área, fecha y nota (FNV-1a), para identificarlo.
export function codigo({ nombre, area, fecha, nota }) {
  let h = 0x811c9dc5;
  for (const ch of `${nombre.trim().toLowerCase()}|${area}|${fecha}|${nota}`) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return `LB-${area.toUpperCase()}-${h.toString(36).toUpperCase().padStart(7, '0')}`;
}

// Datos del certificado a partir del progreso. Devuelve null si el área no está terminada (examen final aprobado).
export function datosCertificado({ area, nombre, escalera, final }) {
  if (!final?.hecho || !TITULO_AREA[area]) return null;
  const fecha = new Date(final.t || Date.now()).toISOString().slice(0, 10);
  const nota = Math.round((final.puntos / final.total) * 100);
  const lecciones = escalera.reduce((n, e) => n + e.lecciones.length, 0);
  return {
    area, nombre: nombre.trim(), fecha, nota, lecciones, escalones: escalera.length,
    titulo: TITULO_AREA[area],
    detalle: `${lecciones} lecciones · ${escalera.length} exámenes de escalón · examen final aprobado con ${nota} %`,
    codigo: codigo({ nombre, area, fecha, nota }),
  };
}

export const fechaLarga = iso => new Date(iso + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
