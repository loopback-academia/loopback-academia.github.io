// Hardware: armar un PC compatible para un encargo, diagnosticar averías y ordenar procedimientos.
// Sin DOM: se prueba en Node. Los precios son orientativos y ficticios (pesos dominicanos).

export const CATEGORIAS = { cpu: 'Procesador', placa: 'Placa base', ram: 'Memoria RAM', disco: 'Almacenamiento', gpu: 'Tarjeta gráfica', fuente: 'Fuente de alimentación', caja: 'Caja' };

export const PIEZAS = {
  cpu: [
    { id: 'i3', nombre: 'Intel Core i3-13100 (4 núcleos, gráficos integrados)', socket: 'LGA1700', igpu: true, w: 60, precio: 7800, nivel: 1 },
    { id: 'i5f', nombre: 'Intel Core i5-13400F (10 núcleos, SIN gráficos integrados)', socket: 'LGA1700', igpu: false, w: 65, precio: 11500, nivel: 2 },
    { id: 'r5', nombre: 'AMD Ryzen 5 8600G (6 núcleos, gráficos integrados)', socket: 'AM5', igpu: true, w: 65, precio: 12900, nivel: 2 },
    { id: 'r7', nombre: 'AMD Ryzen 7 7700X (8 núcleos, gráficos básicos)', socket: 'AM5', igpu: true, w: 105, precio: 19800, nivel: 3 },
  ],
  placa: [
    { id: 'h610', nombre: 'Placa H610M (LGA1700, DDR4, micro-ATX, 1 M.2)', socket: 'LGA1700', ram: 'DDR4', formato: 'mATX', m2: 1, precio: 5200 },
    { id: 'b760', nombre: 'Placa B760 (LGA1700, DDR5, ATX, 2 M.2)', socket: 'LGA1700', ram: 'DDR5', formato: 'ATX', m2: 2, precio: 8900 },
    { id: 'b650', nombre: 'Placa B650M (AM5, DDR5, micro-ATX, 2 M.2)', socket: 'AM5', ram: 'DDR5', formato: 'mATX', m2: 2, precio: 9400 },
  ],
  ram: [
    { id: 'ddr4-8', nombre: '8 GB DDR4 3200', tipo: 'DDR4', gb: 8, precio: 1500 },
    { id: 'ddr4-16', nombre: '16 GB DDR4 3200 (2 × 8)', tipo: 'DDR4', gb: 16, precio: 2700 },
    { id: 'ddr5-16', nombre: '16 GB DDR5 5600 (2 × 8)', tipo: 'DDR5', gb: 16, precio: 3900 },
    { id: 'ddr5-32', nombre: '32 GB DDR5 5600 (2 × 16)', tipo: 'DDR5', gb: 32, precio: 6900 },
  ],
  disco: [
    { id: 'hdd1', nombre: 'Disco duro HDD 1 TB (SATA, 7200 rpm)', tipo: 'HDD', gb: 1000, m2: false, precio: 2600 },
    { id: 'ssd500', nombre: 'SSD NVMe M.2 500 GB', tipo: 'SSD', gb: 500, m2: true, precio: 2800 },
    { id: 'ssd1', nombre: 'SSD NVMe M.2 1 TB', tipo: 'SSD', gb: 1000, m2: true, precio: 4700 },
  ],
  gpu: [
    { id: 'ninguna', nombre: 'Sin tarjeta gráfica (usar la integrada)', w: 0, precio: 0, potencia: 0 },
    { id: 'gt', nombre: 'Tarjeta gráfica básica (2 GB, para varias pantallas)', w: 30, precio: 4800, potencia: 1 },
    { id: 'rtx', nombre: 'Tarjeta gráfica media (8 GB, diseño 3D y vídeo)', w: 170, precio: 21500, potencia: 2 },
  ],
  fuente: [
    { id: 'f300', nombre: 'Fuente 300 W genérica (sin certificación)', w: 300, precio: 1400, certificada: false },
    { id: 'f450', nombre: 'Fuente 450 W 80 PLUS Bronze', w: 450, precio: 2900, certificada: true },
    { id: 'f650', nombre: 'Fuente 650 W 80 PLUS Gold', w: 650, precio: 5600, certificada: true },
  ],
  caja: [
    { id: 'mini', nombre: 'Caja compacta (solo mini-ITX)', formatos: ['ITX'], precio: 2500 },
    { id: 'matx', nombre: 'Caja micro-ATX', formatos: ['mATX', 'ITX'], precio: 2900 },
    { id: 'atx', nombre: 'Caja ATX (admite ATX y micro-ATX)', formatos: ['ATX', 'mATX', 'ITX'], precio: 3800 },
  ],
};

export const ENCARGOS = {
  oficina: {
    titulo: 'PC para contabilidad', presupuesto: 30000,
    texto: 'Contabilidad necesita un PC para Excel, el sistema contable en red, correo y videollamadas. Debe arrancar rápido (SSD), tener al menos 16 GB de RAM y no superar RD$30.000.',
    requisitos: { ramMin: 16, ssd: true, gpuPotencia: 0 },
  },
  diseno: {
    titulo: 'Estación de diseño y vídeo', presupuesto: 70000,
    texto: 'Mercadeo necesita un equipo para editar vídeo y diseño 3D: 32 GB de RAM, SSD de 1 TB, tarjeta gráfica media y fuente certificada, por menos de RD$70.000.',
    requisitos: { ramMin: 32, ssd: true, ssdGb: 1000, gpuPotencia: 2, fuenteCertificada: true },
  },
};

export const pieza = (cat, id) => PIEZAS[cat].find(p => p.id === id);

// Comprueba la compatibilidad y los requisitos del encargo. Devuelve los problemas encontrados.
export function validarPc(sel, encargo) {
  const p = Object.fromEntries(Object.keys(CATEGORIAS).map(k => [k, sel[k] ? pieza(k, sel[k]) : null]));
  const problemas = [];
  for (const [k, t] of Object.entries(CATEGORIAS)) if (!p[k]) problemas.push(`Falta elegir: ${t.toLowerCase()}.`);
  const total = Object.values(p).reduce((n, x) => n + (x?.precio || 0), 0);
  const consumo = (p.cpu?.w || 0) + (p.gpu?.w || 0) + 90;
  if (problemas.length) return { ok: false, problemas, total, consumo };
  if (p.cpu.socket !== p.placa.socket) problemas.push(`El procesador (${p.cpu.socket}) no encaja en la placa (${p.placa.socket}).`);
  if (p.ram.tipo !== p.placa.ram) problemas.push(`La placa usa ${p.placa.ram} y la memoria es ${p.ram.tipo}: no son compatibles.`);
  if (!p.caja.formatos.includes(p.placa.formato)) problemas.push(`La placa ${p.placa.formato} no cabe en esa caja.`);
  if (p.disco.m2 && p.placa.m2 < 1) problemas.push('La placa no tiene ranura M.2 para ese SSD.');
  if (!p.cpu.igpu && p.gpu.id === 'ninguna') problemas.push('Ese procesador no tiene gráficos integrados: sin tarjeta gráfica no habrá imagen.');
  if (p.fuente.w < consumo * 1.4) problemas.push(`La fuente (${p.fuente.w} W) va justa para un consumo de unos ${consumo} W: deja un margen de al menos un 40 %.`);
  const r = encargo.requisitos;
  if (p.ram.gb < r.ramMin) problemas.push(`El encargo pide al menos ${r.ramMin} GB de RAM.`);
  if (r.ssd && p.disco.tipo !== 'SSD') problemas.push('El encargo pide un SSD para que el equipo arranque y responda rápido.');
  if (r.ssdGb && p.disco.gb < r.ssdGb) problemas.push(`El encargo pide un SSD de al menos ${r.ssdGb / 1000} TB.`);
  if (p.gpu.potencia < r.gpuPotencia) problemas.push('El encargo necesita una tarjeta gráfica media para 3D y vídeo.');
  if (r.fuenteCertificada && !p.fuente.certificada) problemas.push('Para un equipo de trabajo exigente, usa una fuente certificada 80 PLUS.');
  if (total > encargo.presupuesto) problemas.push(`Te pasas del presupuesto: RD$${total.toLocaleString('es-DO')} de RD$${encargo.presupuesto.toLocaleString('es-DO')}.`);
  return { ok: !problemas.length, problemas, total, consumo };
}

// ---------------------------------------------------------------- averías de hardware (diagnóstico guiado)
export const AVERIAS = [
  { id: 'no-enciende', sintoma: 'Un PC de escritorio no hace nada al pulsar el botón: ni luces ni ventiladores.',
    opciones: [['Comprobar el cable, el enchufe (con otro aparato) y el interruptor trasero de la fuente', true, 'Lo primero es lo más simple y lo más probable: la alimentación.'], ['Cambiar la placa base', false, 'Es caro y prematuro: antes descarta lo sencillo.'], ['Reinstalar Windows', false, 'Si no enciende, el sistema operativo ni siquiera llega a arrancar.']] },
  { id: 'pitidos', sintoma: 'Enciende, los ventiladores giran, no hay imagen y suenan pitidos repetidos.',
    opciones: [['Buscar el significado del código de pitidos en el manual de la placa (suele ser la RAM) y recolocar los módulos de memoria', true, 'Los pitidos son el diagnóstico de la BIOS; los de memoria son los más comunes.'], ['Cambiar el monitor', false, 'Los pitidos indican un fallo que la placa detecta antes de dar imagen.'], ['Formatear el disco', false, 'No tiene relación: el equipo no llega a cargar el sistema.']] },
  { id: 'apagones', sintoma: 'El portátil se apaga solo al rato de usarlo, sobre todo con videollamadas. Está muy caliente y el ventilador suena mucho.',
    opciones: [['Revisar la temperatura y limpiar el polvo de las rejillas y el ventilador', true, 'Es un apagado por sobrecalentamiento: la protección térmica corta para no dañar el procesador.'], ['Cambiar la batería', false, 'La batería no explica el calor ni el ventilador a tope.'], ['Desinstalar el antivirus', false, 'Quitar protección no arregla un problema térmico.']] },
  { id: 'disco', sintoma: 'El PC va muy lento, a veces se congela unos segundos y en el Visor de eventos hay avisos de «disco con sectores defectuosos».',
    opciones: [['Hacer copia de seguridad de los datos cuanto antes y revisar el estado SMART del disco para cambiarlo', true, 'Un disco que falla puede morir en cualquier momento: primero salvar los datos.'], ['Desfragmentar el disco varias veces', false, 'Forzar un disco dañado puede acelerar su fallo y perder los datos.'], ['Instalar más RAM', false, 'No arregla un disco que está fallando.']] },
  { id: 'pantalla', sintoma: 'Un portátil arranca (se oye y las luces se encienden) pero la pantalla está negra.',
    opciones: [['Conectar un monitor externo para saber si falla la pantalla o la gráfica', true, 'Así separas el problema: si el monitor externo funciona, la avería está en la pantalla o en su cable.'], ['Cambiar el disco duro', false, 'El equipo arranca: el disco no tiene que ver con la imagen.'], ['Restablecer la configuración de red', false, 'No tiene relación con la imagen.']] },
];
export const evaluarAverias = elecciones => { const bien = AVERIAS.filter(a => a.opciones[elecciones[a.id]]?.[1]).length; return { bien, total: AVERIAS.length, aprobado: bien >= 4 }; };

// ---------------------------------------------------------------- ordenar procedimientos
export const ORDENES = {
  'instalar-windows': {
    titulo: 'Preparar un PC nuevo para un empleado',
    pasos: [
      'Crear un USB de instalación con la herramienta oficial de Microsoft',
      'Entrar en la UEFI/BIOS y poner el USB como primera opción de arranque',
      'Instalar Windows en el SSD (borrando las particiones antiguas si es un equipo reutilizado)',
      'Instalar los controladores del fabricante (chipset, red, vídeo)',
      'Pasar Windows Update hasta que no queden actualizaciones',
      'Unir el equipo al dominio y moverlo a su unidad organizativa',
      'Instalar el antivirus corporativo y los programas del puesto',
      'Iniciar sesión con el usuario del empleado, comprobar impresoras y correo y entregarlo',
    ],
  },
};
export function evaluarOrden(id, orden) {
  const pasos = ORDENES[id].pasos;
  const bien = orden.filter((p, i) => p === pasos[i]).length;
  return { bien, total: pasos.length, ok: bien === pasos.length };
}
