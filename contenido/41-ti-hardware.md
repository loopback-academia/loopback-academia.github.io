---
area: ti
id: s2
titulo: Hardware y sistemas operativos
dominio: Soporte técnico
peso: 0
descripcion: Las piezas de una computadora y cómo elegirlas compatibles, armar y actualizar equipos con seguridad, instalar y preparar Windows para un empleado y diagnosticar averías de hardware.
---

=== s2-componentes | Las piezas de una computadora | 16 | 1
Para elegir, actualizar o reparar un equipo hay que saber qué hace cada pieza y cómo encajan entre sí.

## Las piezas

| Pieza | Qué hace | En qué fijarse |
|---|---|---|
| **Procesador (CPU)** | Ejecuta los programas | Núcleos, generación y **zócalo** (socket): LGA1700 de Intel, AM5 de AMD. Algunos traen **gráficos integrados**; los terminados en F (Intel) no |
| **Placa base** | Conecta todas las piezas | Zócalo del procesador, **tipo de memoria** (DDR4 o DDR5), tamaño (ATX, micro-ATX, mini-ITX) y ranuras M.2 |
| **Memoria RAM** | Guarda lo que se está usando ahora | Capacidad (8, 16, 32 GB) y tipo: DDR4 y DDR5 **no son intercambiables** |
| **Almacenamiento** | Guarda los datos aunque se apague | **SSD NVMe** (muy rápido, ranura M.2), SSD SATA o disco duro HDD (barato y lento) |
| **Tarjeta gráfica (GPU)** | Genera la imagen; acelera 3D y vídeo | Solo hace falta si el procesador no tiene gráficos o para diseño y juegos |
| **Fuente de alimentación** | Da corriente a todo | Potencia en vatios con margen (un 40 % más que el consumo) y certificación 80 PLUS |
| **Caja** | Lo contiene y lo ventila | Que admita el tamaño de la placa |

::: nota
Para una oficina, el cambio que más se nota es pasar de disco duro a **SSD**: el equipo arranca en segundos. Lo segundo, tener al menos **16 GB de RAM** si se usan muchos programas a la vez.
:::

## Compatibilidad: las tres reglas

1. El **zócalo** del procesador y de la placa deben coincidir.
2. La **memoria** debe ser del tipo que admite la placa (DDR4 o DDR5).
3. La **placa** debe caber en la **caja**, y la **fuente** debe tener potencia de sobra.

[[pc:oficina]]

::: quiz
? Una placa base es DDR5. ¿Qué memoria puedes ponerle?
+ Solo módulos DDR5
- DDR4 o DDR5, da igual
- Cualquier memoria de 16 GB
= DDR4 y DDR5 tienen muescas y voltajes distintos: no son intercambiables.

? ¿Qué mejora más la velocidad de un PC de oficina con disco duro?
+ Cambiar el disco duro por un SSD
- Cambiar la caja
- Poner una tarjeta gráfica potente
= El SSD reduce muchísimo los tiempos de arranque y de apertura de programas.

? Un procesador Intel terminado en F no tiene gráficos integrados. ¿Qué necesita el equipo?
+ Una tarjeta gráfica dedicada
- Más memoria RAM
- Una fuente más pequeña
= Sin gráficos integrados ni tarjeta gráfica, el equipo no da imagen.

? ¿Qué debe coincidir entre el procesador y la placa base?
+ El zócalo (socket)
- El color
- La marca de la memoria
= Un procesador AM5 solo entra en una placa AM5, por ejemplo.
:::

::: banco
? ¿Para qué sirve la memoria RAM?
+ Para guardar temporalmente lo que el equipo está usando ahora
- Para guardar los archivos cuando se apaga
- Para generar la imagen
= La RAM se borra al apagar; los archivos se guardan en el disco o SSD.

? ¿Qué significa la certificación 80 PLUS de una fuente?
+ Que aprovecha bien la energía (al menos un 80 % de eficiencia)
- Que tiene 80 vatios
- Que dura 80 meses
= Una fuente certificada desperdicia menos energía en calor y suele ser más fiable.

? ¿Qué tipo de almacenamiento es el más rápido?
+ SSD NVMe M.2
- Disco duro HDD de 7200 rpm
- Memoria USB
= Los NVMe usan el bus PCIe y son varias veces más rápidos que un SSD SATA.

? Una placa micro-ATX, ¿cabe en una caja ATX?
+ Sí, las cajas ATX admiten placas más pequeñas
- No, nunca
- Solo con un adaptador
= Las cajas suelen admitir su tamaño y los menores.
:::

=== s2-armar | Armar y actualizar un equipo con seguridad | 16 | 2
Montar o actualizar un equipo es sencillo si se sigue un orden y se toman precauciones.

## Seguridad antes de abrir

- **Apaga y desenchufa** el equipo; en un portátil, desconecta también la batería si se puede.
- **Descarga la electricidad estática** (pulsera antiestática o tocando una parte metálica de la caja). Una descarga puede dañar la memoria o la placa sin que lo notes.
- Trabaja sobre una superficie limpia y guarda los tornillos ordenados.

## Orden de montaje habitual

1. Procesador en la placa (sin forzar: entra en una sola posición) y su disipador con pasta térmica.
2. Memoria RAM en las ranuras que indica el manual (normalmente la 2 y la 4 para dos módulos).
3. SSD M.2 en la placa.
4. Placa dentro de la caja, sobre sus separadores.
5. Fuente, tarjeta gráfica y cables (alimentación de la placa, del procesador y de la gráfica).
6. Primer arranque: entrar en la **UEFI/BIOS** y comprobar que detecta procesador, memoria y disco.

## Actualizar un equipo existente

- Antes de comprar, mira el **modelo exacto** del equipo o de la placa y su manual: memoria máxima, tipo, ranuras libres.
- Haz **copia de seguridad** antes de cambiar el disco.
- Documenta en el inventario qué pieza cambiaste y por qué.

[[pc:diseno]]

::: quiz
? ¿Qué haces antes de tocar las piezas de un equipo abierto?
+ Desenchufarlo y descargar la electricidad estática
- Dejarlo encendido para ver si funciona
- Mojar la placa para limpiarla
= La electricidad estática puede dañar componentes sin que se note.

? Tras montar un equipo, ¿dónde compruebas que detecta la memoria y el disco?
+ En la UEFI/BIOS
- En el Panel de control de Windows antes de instalarlo
- En el router
= La UEFI muestra el hardware detectado antes de instalar el sistema.

? Un equipo de diseño necesita una gráfica de 170 W y un procesador de 105 W. ¿Qué fuente eliges?
+ Una de 650 W certificada
- Una genérica de 300 W
- La que venga con la caja, sin mirar
= Con unos 365 W de consumo, una fuente de 650 W deja margen y la certificación da fiabilidad.

? ¿Qué haces antes de cambiar el disco de un equipo en uso?
+ Una copia de seguridad de los datos
- Nada, los datos se pasan solos
- Formatear el disco viejo
= Cualquier cambio de almacenamiento puede perder datos si no hay copia.
:::

::: banco
? ¿Para qué sirve la pasta térmica?
+ Para transmitir el calor del procesador al disipador
- Para pegar la placa a la caja
- Para aislar la electricidad
= Rellena las imperfecciones entre procesador y disipador.

? Antes de comprar más RAM para un portátil, ¿qué miras?
+ El modelo exacto y su manual: tipo de memoria, máximo y ranuras libres
- Solo el color del portátil
- El sistema operativo
= Muchos portátiles tienen la memoria soldada o un máximo bajo.

? ¿Dónde se anota qué pieza cambiaste en un equipo de la empresa?
+ En el inventario y en el ticket
- En ningún sitio
- En un papel pegado al monitor
= El inventario permite saber garantías, costes y el historial de cada equipo.
:::

=== s2-instalar | Instalar y preparar Windows para un empleado | 16 | 1
Preparar un equipo nuevo para alguien es una de las tareas más habituales de soporte. Hacerlo siempre igual evita olvidos.

## Los pasos

1. **Crear el USB de instalación** con la herramienta oficial de Microsoft.
2. **Arrancar desde el USB**: en la UEFI/BIOS, pon el USB primero en el orden de arranque (o usa el menú de arranque con F12, F11 o Esc, según el fabricante).
3. **Instalar Windows** en el SSD. En un equipo reutilizado, borra las particiones antiguas.
4. **Controladores** del fabricante: chipset, red, vídeo, audio.
5. **Windows Update** hasta que no queden actualizaciones.
6. **Unir al dominio** y mover el equipo a su OU para que reciba las directivas.
7. **Antivirus corporativo y programas** del puesto.
8. **Comprobar con el usuario**: inicio de sesión, correo, impresoras y unidades de red. Entregar y registrar en el inventario.

::: nota
En empresas grandes no se hace a mano: se usa una **imagen** preparada o herramientas como Windows Autopilot o MDT, que instalan todo solas. Pero hay que entender los pasos para saber qué falló cuando algo no sale bien.
:::

[[orden:instalar-windows]]

::: quiz
? ¿Qué necesitas para que el equipo arranque desde el USB de instalación?
+ Ponerlo primero en el orden de arranque de la UEFI/BIOS (o usar el menú de arranque)
- Formatear el SSD desde otro equipo
- Conectarlo a internet
= El equipo arranca del primer dispositivo de la lista de arranque.

? ¿Por qué se une el equipo al dominio?
+ Para que los empleados inicien sesión con su cuenta de AD y reciba las directivas
- Para que vaya más rápido
- Para activar Windows
= Unido al dominio, el equipo se gestiona de forma centralizada.

? ¿Qué se instala justo después de Windows?
+ Los controladores del fabricante
- Los juegos del usuario
- Nada más
= Sin controladores, la red, el vídeo o el audio pueden no funcionar bien.
:::

::: banco
? ¿Qué haces al final, antes de entregar el equipo?
+ Comprobar con el usuario el inicio de sesión, el correo, las impresoras y las unidades, y registrarlo en el inventario
- Apagarlo y dejarlo en su mesa
- Borrar los controladores
= La comprobación final evita llamadas al día siguiente.

? ¿Qué herramienta permite instalar equipos automáticamente en empresas grandes?
+ Una imagen preparada o herramientas como Windows Autopilot o MDT
- El Bloc de notas
- El Visor de eventos
= Se automatiza para que todos los equipos queden iguales.
:::

=== s2-averias | Diagnosticar averías de hardware | 16 | 2
Con el hardware, el método es el mismo que con el software: **de lo simple a lo complejo**, cambiando una sola cosa cada vez.

## Síntomas y primeras pruebas

| Síntoma | Primero mira |
|---|---|
| No enciende nada | Cable, enchufe (prueba otro aparato), interruptor de la fuente |
| Enciende, pitidos y sin imagen | El **código de pitidos** del manual de la placa: suele ser la RAM. Recoloca los módulos |
| Se apaga solo, mucho calor | Temperatura y polvo en ventiladores y rejillas |
| Lento, se congela, errores de disco | Estado **SMART** del disco y **copia de seguridad** ya |
| Portátil sin imagen pero arranca | Monitor externo: separa pantalla de gráfica |
| Pantallazo azul | Anota el código de error; prueba la memoria (Diagnóstico de memoria de Windows) |

::: cuidado
Si un disco da señales de fallo, **lo primero es salvar los datos**, no intentar repararlo. Cada hora de uso puede ser la última.
:::

## Herramientas útiles

- **UEFI/BIOS**: qué hardware se detecta y temperaturas.
- **Diagnósticos del fabricante** (muchos equipos traen uno al arrancar con F12 o F2).
- **Visor de eventos** y el **estado SMART** del disco.
- Un **monitor, un cable y una memoria USB de prueba** para descartar piezas.

[[hw:averias]]

::: quiz
? Un PC no hace nada al pulsar el botón. ¿Qué miras primero?
+ La alimentación: cable, enchufe e interruptor de la fuente
- La placa base
- La versión de Windows
= Se empieza por lo más simple y probable.

? Un disco da errores de sectores defectuosos. ¿Qué es lo primero?
+ Hacer copia de seguridad de los datos
- Desfragmentarlo
- Esperar a ver si mejora
= Un disco que falla puede morir en cualquier momento.

? Un portátil arranca pero no da imagen. ¿Qué prueba separa el problema?
+ Conectar un monitor externo
- Cambiar la batería
- Reinstalar el antivirus
= Si el monitor externo funciona, la avería está en la pantalla o su cable.

? Un equipo se apaga solo al rato y está muy caliente. ¿Qué haces?
+ Revisar temperaturas y limpiar el polvo de ventiladores y rejillas
- Cambiar el teclado
- Subir el brillo de la pantalla
= Es la protección térmica: el equipo se apaga para no dañarse.
:::

::: banco
? ¿Qué indican los pitidos al encender un PC sin imagen?
+ Un código de error de la placa, que se consulta en su manual
- Que el altavoz está roto
- Que falta el antivirus
= La placa avisa con pitidos de fallos que detecta antes de dar imagen.

? ¿Qué es SMART en un disco?
+ Un sistema de autodiagnóstico que avisa de que el disco puede fallar
- Un tipo de conector
- Un programa de limpieza
= SMART registra errores y desgaste del disco.

? Al diagnosticar hardware, ¿por qué se cambia una sola cosa cada vez?
+ Para saber qué cambio resolvió el problema
- Porque es más rápido
- Porque lo exige la garantía
= Si cambias varias cosas a la vez, no sabrás cuál era la avería.
:::
