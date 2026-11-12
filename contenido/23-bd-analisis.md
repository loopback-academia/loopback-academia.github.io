---
area: bd
id: b4
titulo: Análisis de datos
dominio: Bases de datos
peso: 0
descripcion: La ruta de analista junior de datos: qué hace un analista, limpiar datos sucios, calcular KPI e informes con SQL y convertirlos en paneles que se entiendan.
---

=== b4-analista | El trabajo de analista de datos | 12 | 2
Un **analista de datos** convierte datos (ventas, inventario, tickets, visitas) en **respuestas a preguntas de negocio**: ¿qué vendemos más?, ¿qué sucursal va peor?, ¿por qué subieron las devoluciones?

## Un día normal

1. Alguien hace una pregunta, a menudo poco clara: «¿cómo vamos este mes?».
2. El analista la **concreta**: ¿ingresos o unidades?, ¿comparado con qué?, ¿por sucursal o en total?
3. **Busca y limpia** los datos (casi siempre hay errores).
4. **Calcula** con SQL, Excel o Python.
5. **Comunica** el resultado con un gráfico claro y una conclusión de una frase.

## KPI: los indicadores clave

Un **KPI** es una cifra que resume cómo va algo importante. Ejemplos en una tienda:

| KPI | Cómo se calcula |
|---|---|
| Ingresos | Suma de cantidad × precio |
| Ticket medio | Ingresos / número de ventas |
| Crecimiento | (Este mes − mes anterior) / mes anterior |
| Clientes recurrentes | Clientes con compras en varios meses |
| Tasa de devolución | Devoluciones / ventas |

## Herramientas

- **SQL**: la base de todo. Casi todos los datos de una empresa están en bases de datos.
- **Excel o Google Sheets**: tablas dinámicas, BUSCARX, gráficos.
- **Power BI, Looker Studio, Tableau o Metabase**: paneles que se actualizan solos.
- **Python** (pandas) para limpiezas y análisis más grandes.

::: quiz
? ¿Qué es lo primero que hace un buen analista ante «¿cómo vamos este mes?»?
+ Concretar la pregunta: qué medida, comparada con qué y con qué detalle
- Hacer un gráfico de tarta con todo
- Exportar toda la base de datos a Excel
= Una pregunta vaga lleva a un análisis inútil; primero se concreta.

? ¿Cómo se calcula el ticket medio?
+ Ingresos totales divididos entre el número de ventas
- Precio del producto más caro
- Número de clientes por mes
= Es el importe medio de cada venta.

? ¿Qué herramienta es la base del trabajo de un analista en una empresa?
+ SQL, porque los datos están en bases de datos
- Un editor de vídeo
- El correo electrónico
= Saber SQL es el requisito más pedido en ofertas de analista junior.
:::

::: banco
? ¿Qué es un KPI?
+ Un indicador clave que resume cómo va algo importante del negocio
- Un tipo de base de datos
- Un lenguaje de programación
= Key Performance Indicator: ingresos, ticket medio, crecimiento…

? Los ingresos pasan de 100.000 a 120.000. ¿Cuál es el crecimiento?
+ 20 %
- 120 %
- 2 %
= (120.000 − 100.000) / 100.000 = 0,2.

? ¿Para qué sirve un panel (dashboard) en Power BI o Looker Studio?
+ Para mostrar los KPI actualizados sin repetir el análisis a mano
- Para guardar copias de seguridad
- Para programar la base de datos
= Se conecta a los datos y se actualiza solo.
:::

=== b4-limpieza | Limpiar datos antes de analizar | 16 | 2
En la vida real los datos **siempre** vienen sucios. Un análisis con datos sucios da conclusiones falsas, así que limpiar es la mitad del trabajo.

## Problemas típicos y cómo detectarlos con SQL

| Problema | Ejemplo | Detectar o arreglar |
|---|---|---|
| Mayúsculas y espacios | «Santiago», «SANTIAGO», «santiago » | `LOWER(TRIM(ciudad))` |
| Valores vacíos | ciudad = NULL | `WHERE ciudad IS NULL`, `COALESCE(ciudad, 'sin dato')` |
| Duplicados | la misma venta dos veces | `GROUP BY … HAVING COUNT(*) > 1` |
| Formatos distintos | fechas «12/11/2026» y «2026-11-12» | Convertir todo a AAAA-MM-DD |
| Valores imposibles | cantidad negativa, edad 250 | `WHERE cantidad <= 0` |
| Categorías mal escritas | «Redes», «redes», «Red» | Tabla de equivalencias o CASE |

## Reglas de oro

- **No borres los datos originales**: limpia en una consulta, una vista o una copia.
- **Documenta** qué limpiaste y por qué (en el informe o en un comentario).
- **Cuenta antes y después**: si había 160 ventas y quedan 159, explica la diferencia (era un duplicado).
- Si algo no cuadra, **pregunta** a quien genera los datos: muchas veces el error está en el proceso, no en la base de datos.

::: quiz
? ¿Qué expresión unifica «Santiago», «SANTIAGO» y «santiago »?
+ LOWER(TRIM(ciudad))
- UPPER(ciudad)
- COUNT(ciudad)
- ciudad IS NULL
= TRIM quita los espacios de los lados y LOWER pasa todo a minúsculas.

? ¿Cómo encuentras filas duplicadas?
+ Agrupando por las columnas que deberían ser únicas y filtrando con HAVING COUNT(*) > 1
- Con ORDER BY
- Con LIMIT 1
= Los grupos con más de una fila son duplicados.

? ¿Qué haces con los datos originales al limpiar?
+ Conservarlos y limpiar en una consulta, una vista o una copia
- Borrar lo que no sirva directamente en la tabla de producción
- Nada, se analizan tal cual
= Así siempre puedes revisar o repetir la limpieza.
:::

::: banco
? ¿Qué hace COALESCE(canal, 'sin dato')?
+ Devuelve 'sin dato' cuando canal es NULL
- Borra las filas con canal NULL
- Cuenta los canales
= Sustituye el valor nulo por uno por defecto.

? Tras limpiar, tienes una venta menos que al principio. ¿Qué haces?
+ Explicar la diferencia en el informe (por ejemplo, un duplicado eliminado)
- Ocultarlo
- Añadir una venta inventada
= Las diferencias se documentan para que el informe sea fiable.

? Una columna de cantidad tiene valores negativos en una tabla de ventas. ¿Qué indica?
+ Un posible error de datos o devoluciones mal registradas: hay que investigarlo
- Que la empresa va bien
- Nada, es normal siempre
= Los valores imposibles se revisan antes de calcular.
:::

=== b4-kpis | KPI e informes con SQL | 20 | 3
Con lo que ya sabes de SQL (agrupar, unir tablas y funciones de ventana) puedes calcular casi cualquier KPI.

## Las consultas de un informe de ventas

```sql
-- Ingresos por mes
SELECT strftime('%Y-%m', fecha) AS mes, SUM(cantidad * precio_unitario) AS ingresos
FROM ventas GROUP BY mes ORDER BY mes;

-- Top 5 productos
SELECT p.nombre, SUM(v.cantidad * v.precio_unitario) AS total
FROM ventas v JOIN productos p ON p.id = v.producto_id
GROUP BY p.nombre ORDER BY total DESC LIMIT 5;

-- Crecimiento mes a mes con LAG
SELECT mes, ingresos, ingresos - LAG(ingresos) OVER (ORDER BY mes) AS diferencia
FROM (SELECT strftime('%Y-%m', fecha) AS mes, SUM(cantidad * precio_unitario) AS ingresos
      FROM ventas GROUP BY mes);
```

::: nota
En PostgreSQL o MySQL, en lugar de `strftime('%Y-%m', fecha)` se usa `to_char(fecha, 'YYYY-MM')` o `DATE_FORMAT(fecha, '%Y-%m')`. La idea es la misma.
:::

[[sql:analisis]]

::: quiz
? ¿Qué función trae el valor de la fila anterior para calcular el crecimiento?
+ LAG
- LIMIT
- COALESCE
- TRIM
= LAG(valor) OVER (ORDER BY mes) devuelve el valor del mes anterior.

? Para el top 5 de productos por ingresos, ¿qué cláusulas usas al final?
+ ORDER BY total DESC LIMIT 5
- WHERE total = 5
- GROUP BY 5
= Se ordena de mayor a menor y se quedan los cinco primeros.

? ¿Cómo cuentas en cuántos meses distintos compró cada cliente?
+ COUNT(DISTINCT mes) agrupando por cliente
- COUNT(*) sin agrupar
- SUM(mes)
= DISTINCT evita contar varias veces el mismo mes.
:::

::: banco
? ¿Por qué se calcula el ingreso como cantidad × precio_unitario y no con el precio actual del producto?
+ Porque el precio pudo cambiar: el precio de la venta es el que se cobró
- Porque es más rápido
- Porque el precio actual no existe
= Las ventas guardan el precio del momento.

? ¿Qué devuelve LAG en la primera fila?
+ NULL, porque no hay fila anterior
- 0
- Un error
= Por eso la diferencia del primer mes sale vacía.

? ¿Qué cláusula filtra después de agrupar?
+ HAVING
- WHERE
- ORDER BY
= WHERE filtra filas antes de agrupar; HAVING, grupos.
:::

=== b4-paneles | Del SQL al panel: gráficos que se entienden | 14 | 2
Un buen análisis mal presentado no sirve. La regla: **una pregunta, un gráfico, una conclusión**.

## Qué gráfico usar

| Quieres mostrar | Gráfico |
|---|---|
| Evolución en el tiempo | **Líneas** |
| Comparar categorías | **Barras** (mejor horizontales si los nombres son largos) |
| Una cifra clave | **Tarjeta** con el número grande y la comparación (▲ 12 % frente al mes pasado) |
| Detalle para consultar | **Tabla** |
| Partes de un total | Barras apiladas; la tarta solo con 2 o 3 partes |

## Errores que engañan

- **Ejes que no empiezan en 0** en barras: una diferencia del 2 % parece enorme.
- Demasiados colores o categorías: nadie lo entiende.
- Gráficos 3D: deforman las proporciones.
- Sin título ni unidades: ¿son pesos, unidades o porcentajes?

## Un panel útil

1. Arriba, 3 o 4 **KPI** con su comparación.
2. Debajo, la **evolución** (líneas) y el **desglose** (barras).
3. **Filtros** por fecha, sucursal o categoría.
4. Que se **actualice solo** desde la base de datos.

::: quiz
? ¿Qué gráfico es mejor para mostrar los ingresos de los últimos 6 meses?
+ Un gráfico de líneas
- Una tarta
- Un gráfico 3D
= Las líneas muestran bien la evolución en el tiempo.

? ¿Por qué un gráfico de barras debe empezar en 0?
+ Porque si no, las diferencias pequeñas parecen enormes
- Porque lo exige Excel
- Porque así ocupa menos
= La longitud de la barra debe ser proporcional al valor.

? ¿Qué va en la parte de arriba de un buen panel?
+ Los KPI principales con su comparación
- Una tabla con todas las filas
- El logotipo grande
= Lo más importante, primero y de un vistazo.
:::

::: banco
? ¿Cuándo se puede usar una tarta?
+ Con muy pocas partes (2 o 3) de un total
- Siempre que haya categorías
- Para mostrar la evolución en el tiempo
= Con muchas porciones es imposible comparar.

? ¿Qué le falta a un gráfico sin título ni unidades?
+ Contexto: no se sabe qué mide ni en qué unidades
- Colores
- Animación
= Título y unidades son imprescindibles.

? ¿Qué es la regla «una pregunta, un gráfico, una conclusión»?
+ Cada gráfico responde a una pregunta concreta y se acompaña de una conclusión clara
- Hacer un solo gráfico en todo el informe
- Poner una conclusión por cada fila de datos
= Así el informe se entiende sin explicaciones adicionales.
:::
