// Diseñador entidad-relación: tablas, columnas, claves primarias y foráneas; genera el SQL y comprueba el diseño
// contra un encargo. También ejercicios de formas normales. Sin DOM: se prueba en Node.

export const TIPOS_COL = ['INTEGER', 'TEXT', 'REAL', 'DATE'];
const sinTildes = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export const identificadorValido = n => /^[a-z_][a-z0-9_]{0,40}$/.test(n);
const pkDe = t => t.columnas.find(c => c.pk);

export function generarSql(d) {
  return d.tablas.map(t => {
    const pks = t.columnas.filter(c => c.pk);
    const lineas = t.columnas.map(c => {
      const ref = c.fk && d.tablas.find(x => x.nombre === c.fk);
      return `  ${c.nombre} ${c.tipo}${pks.length === 1 && c.pk ? ' PRIMARY KEY' : ''}${c.nn && !c.pk ? ' NOT NULL' : ''}${ref && pkDe(ref) ? ` REFERENCES ${ref.nombre}(${pkDe(ref).nombre})` : ''}`;
    });
    if (pks.length > 1) lineas.push(`  PRIMARY KEY (${pks.map(c => c.nombre).join(', ')})`);
    return `CREATE TABLE ${t.nombre} (\n${lineas.join(',\n')}\n);`;
  }).join('\n\n');
}

// Problemas generales de cualquier diseño.
export function revisarDiseno(d) {
  const p = [];
  const nombres = d.tablas.map(t => t.nombre);
  for (const t of d.tablas) {
    if (!identificadorValido(t.nombre)) p.push(`El nombre de tabla «${t.nombre}» no es válido: usa minúsculas, números y _, sin espacios ni tildes.`);
    if (nombres.filter(n => n === t.nombre).length > 1) p.push(`Hay dos tablas llamadas «${t.nombre}».`);
    if (!t.columnas.length) p.push(`La tabla ${t.nombre} no tiene columnas.`);
    if (!t.columnas.some(c => c.pk)) p.push(`La tabla ${t.nombre} no tiene clave primaria.`);
    const cols = t.columnas.map(c => c.nombre);
    for (const c of t.columnas) {
      if (!identificadorValido(c.nombre)) p.push(`${t.nombre}: el nombre de columna «${c.nombre}» no es válido.`);
      if (cols.filter(n => n === c.nombre).length > 1) p.push(`${t.nombre}: la columna «${c.nombre}» está repetida.`);
      if (c.fk && !d.tablas.some(x => x.nombre === c.fk)) p.push(`${t.nombre}.${c.nombre} apunta a una tabla que no existe (${c.fk}).`);
      if (c.fk && c.tipo !== 'INTEGER' && pkDe(d.tablas.find(x => x.nombre === c.fk) || { columnas: [] })?.tipo === 'INTEGER') p.push(`${t.nombre}.${c.nombre} debe ser INTEGER, como la clave a la que apunta.`);
    }
    // Primera forma normal: grupos repetidos (producto1, producto2…) o listas en una columna.
    const grupos = cols.filter(n => /\d$/.test(n)).map(n => n.replace(/_?\d+$/, ''));
    if (grupos.some(g => grupos.filter(x => x === g).length > 1)) p.push(`${t.nombre} tiene columnas repetidas numeradas (${cols.filter(n => /\d$/.test(n)).join(', ')}): rompe la primera forma normal. Usa otra tabla con una fila por elemento.`);
    if (cols.some(n => /^(lista_|varios_)|s_lista$/.test(n))) p.push(`${t.nombre} guarda una lista en una columna: rompe la primera forma normal.`);
  }
  return p;
}

const busca = (d, re) => d.tablas.find(t => re.test(sinTildes(t.nombre)));
const fkA = (t, destino) => !!t && !!destino && t.columnas.some(c => c.fk === destino.nombre);
const tieneCol = (t, re) => !!t && t.columnas.some(c => re.test(sinTildes(c.nombre)));

export const RETOS_ER = {
  tienda: {
    titulo: 'Base de datos de la tienda en línea',
    texto: 'Diseña la base de datos de la tienda: los clientes hacen pedidos; cada pedido tiene una fecha y puede incluir varios productos, con la cantidad de cada uno; cada producto tiene nombre y precio.',
    comprobar(d) {
      const p = [];
      const cli = busca(d, /^client/), prod = busca(d, /^product|^articul/), ped = busca(d, /^pedid|^orden|^compra|^venta/);
      if (!cli) p.push('Falta la tabla de clientes.');
      if (!prod) p.push('Falta la tabla de productos.');
      if (!ped) p.push('Falta la tabla de pedidos.');
      if (prod && !tieneCol(prod, /precio/)) p.push('Los productos necesitan una columna de precio.');
      if (ped && !tieneCol(ped, /fecha/)) p.push('Los pedidos necesitan una columna de fecha.');
      if (cli && ped && !fkA(ped, cli)) p.push('Cada pedido debe apuntar a su cliente con una clave foránea (por ejemplo, pedidos.cliente_id → clientes).');
      if (ped && prod) {
        const inter = d.tablas.find(t => t !== ped && t !== prod && fkA(t, ped) && fkA(t, prod));
        if (!inter) p.push('Un pedido tiene muchos productos y un producto está en muchos pedidos (relación N:M): necesitas una tabla intermedia (por ejemplo, detalle_pedido) con claves foráneas a pedidos y a productos.');
        else if (!tieneCol(inter, /cantidad|unidades/)) p.push(`La tabla ${inter.nombre} necesita la cantidad de cada producto.`);
        if (fkA(ped, prod)) p.push('Una clave foránea a productos dentro de pedidos solo permitiría un producto por pedido.');
      }
      return p;
    },
  },
  escuela: {
    titulo: 'Base de datos del instituto',
    texto: 'Un instituto tiene profesores, cursos y estudiantes. Cada curso lo imparte un profesor (un profesor puede dar varios cursos). Los estudiantes se inscriben en varios cursos y en cada inscripción se guarda la nota final.',
    comprobar(d) {
      const p = [];
      const prof = busca(d, /^profesor|^docente/), cur = busca(d, /^curso|^asignatura|^materia/), est = busca(d, /^estudiante|^alumno/);
      if (!prof) p.push('Falta la tabla de profesores.');
      if (!cur) p.push('Falta la tabla de cursos.');
      if (!est) p.push('Falta la tabla de estudiantes.');
      if (cur && prof && !fkA(cur, prof)) p.push('Cada curso debe apuntar a su profesor (relación 1:N): pon la clave foránea en cursos.');
      if (prof && cur && fkA(prof, cur)) p.push('La clave foránea va en el lado «muchos»: en cursos, no en profesores.');
      if (cur && est) {
        const inter = d.tablas.find(t => t !== cur && t !== est && fkA(t, cur) && fkA(t, est));
        if (!inter) p.push('Estudiantes y cursos es una relación N:M: necesitas una tabla intermedia (por ejemplo, inscripciones) con claves foráneas a las dos.');
        else if (!tieneCol(inter, /nota|calificacion/)) p.push(`La nota pertenece a la inscripción: añádela a ${inter.nombre}.`);
        if (tieneCol(est, /nota/)) p.push('La nota no puede ir en estudiantes: depende del curso, no solo del estudiante.');
      }
      return p;
    },
  },
};

export function evaluarReto(id, d) {
  const problemas = [...revisarDiseno(d), ...RETOS_ER[id].comprobar(d)];
  return { ok: !problemas.length && d.tablas.length > 0, problemas };
}

// ---------------------------------------------------------------- formas normales
export const FORMAS = [
  { tabla: 'pedidos', columnas: ['pedido_id', 'cliente', 'productos'], filas: [['1', 'Ana', 'Cable, Switch, Router'], ['2', 'Luis', 'Cable']], respuesta: '1FN', explicacion: 'La columna productos guarda una lista: cada celda debe tener un solo valor (primera forma normal). Va en otra tabla, una fila por producto.' },
  { tabla: 'inscripciones', columnas: ['estudiante_id', 'curso_id', 'nombre_curso', 'nota'], filas: [['10', 'C1', 'Redes I', '9'], ['11', 'C1', 'Redes I', '7']], clave: 'estudiante_id + curso_id', respuesta: '2FN', explicacion: 'nombre_curso depende solo de curso_id, que es una parte de la clave compuesta: rompe la segunda forma normal. Va en la tabla cursos.' },
  { tabla: 'empleados', columnas: ['empleado_id', 'nombre', 'depto_id', 'nombre_depto'], filas: [['1', 'Ana', 'D1', 'Ventas'], ['2', 'Luis', 'D1', 'Ventas']], respuesta: '3FN', explicacion: 'nombre_depto depende de depto_id, no del empleado (dependencia transitiva): rompe la tercera forma normal. Va en la tabla departamentos.' },
  { tabla: 'productos', columnas: ['producto_id', 'nombre', 'precio'], filas: [['1', 'Cable Cat6', '350'], ['2', 'Switch 8 puertos', '2900']], respuesta: 'ninguna', explicacion: 'Cada columna tiene un valor y depende solo de la clave: cumple las tres formas normales.' },
  { tabla: 'clientes', columnas: ['cliente_id', 'nombre', 'telefono1', 'telefono2', 'telefono3'], filas: [['1', 'Ana', '809-555-0101', '809-555-0102', ''], ['2', 'Luis', '829-555-0199', '', '']], respuesta: '1FN', explicacion: 'telefono1, telefono2, telefono3 son un grupo repetido: rompe la primera forma normal. Los teléfonos van en otra tabla (una fila por teléfono).' },
  { tabla: 'facturas', columnas: ['factura_id', 'cliente_id', 'ciudad_cliente', 'total'], filas: [['F1', '7', 'Santiago', '5400'], ['F2', '7', 'Santiago', '1200']], respuesta: '3FN', explicacion: 'ciudad_cliente depende del cliente, no de la factura: si el cliente se muda habría que cambiar todas sus facturas. Va en la tabla clientes.' },
];
export const OPCIONES_FN = ['1FN', '2FN', '3FN', 'ninguna'];
