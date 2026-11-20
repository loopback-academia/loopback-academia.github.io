---
area: ti
id: s2
titulo: Equipos, Windows y administración corporativa
dominio: Soporte técnico
peso: 0
descripcion: Las piezas de una computadora y cómo elegirlas compatibles, armar y diagnosticar equipos, instalar y preparar Windows, la consola de Windows para soporte y la administración de usuarios, grupos y permisos con Active Directory.
---

=== s2-consola | La consola de Windows para soporte | 20 | 1
Las herramientas gráficas están bien, pero un técnico de soporte resuelve más rápido con la **consola** (`cmd` o PowerShell): da la información exacta, se puede copiar en el ticket y funciona también por acceso remoto.

## Los comandos imprescindibles

| Comando | Para qué |
|---|---|
| `ipconfig` / `ipconfig /all` | IP, máscara, puerta de enlace, DNS, MAC y servidor DHCP |
| `ipconfig /release` y `/renew` | Soltar la dirección y pedir otra al servidor DHCP |
| `ipconfig /flushdns` | Vaciar la caché de nombres (también guarda los fallos) |
| `ping` | ¿Hay respuesta? Prueba por capas: puerta de enlace, IP externa, nombre |
| `tracert` | Por qué routers pasa el tráfico y dónde se corta |
| `nslookup` | Pregunta directamente al servidor DNS |
| `netsh interface ip set dns "Ethernet" dhcp` | Devolver el DNS a automático |
| `tasklist` / `taskkill /im programa.exe /f` | Ver procesos y terminar uno que no responde |
| `sc query spooler`, `net stop` / `net start` | Estado de un servicio, detenerlo e iniciarlo |
| `sfc /scannow` | Reparar archivos del sistema dañados (como administrador) |
| `gpupdate /force` / `gpresult /r` | Aplicar las directivas de grupo y ver cuáles están aplicadas |
| `whoami /groups` | A qué grupos pertenece la sesión |
| `net use Z: \\servidor\recurso` | Conectar una unidad de red |
| `Test-NetConnection servidor -Port 443` | (PowerShell) ¿Responde ese puerto? |

## Cómo leer ipconfig

- **169.254.x.x** (APIPA): el equipo **no recibió respuesta del DHCP**. Revisa cable o wifi y después `ipconfig /renew`.
- **Sin puerta de enlace**: puede hablar con su red local, pero no salir de ella.
- **DNS raro** (una IP que no es la de la empresa): alguien lo cambió a mano. Las páginas no cargan aunque haya conexión.

::: practica
Cinco casos reales, de menos a más. Lee el caso, diagnostica con comandos antes de cambiar nada, arréglalo y verifica. Escribe `help` para ver los comandos del simulador.
:::

[[win:apipa]]

[[win:dns]]

[[win:impresora]]

[[win:lento]]

[[win:unidad-red]]

::: quiz
? Un PC tiene la dirección 169.254.23.7. ¿Qué significa?
- Que tiene una IP pública
+ Que no recibió respuesta del servidor DHCP
- Que el DNS está mal configurado
- Que la tarjeta de red está averiada
= Windows se asigna una dirección APIPA (169.254.x.x) cuando ningún servidor DHCP le responde.

? ping 8.8.8.8 funciona, pero ping www.google.com dice «no pudo encontrar el host». ¿Dónde está el problema?
- En el cable de red
- En la puerta de enlace
+ En la resolución de nombres (DNS)
- En el servidor DHCP
= Si una IP de internet responde y un nombre no, la red funciona y falla el DNS.

? La cola de impresión está bloqueada por un trabajo dañado. ¿En qué orden actúas?
+ Detener el servicio Spooler, borrar los trabajos de la carpeta PRINTERS y volver a iniciar el servicio
- Reiniciar la impresora tres veces
- Borrar los trabajos con el servicio en marcha
= Con el servicio en marcha los archivos están bloqueados; primero se detiene.

? A un usuario lo añadieron ayer a un grupo, pero sigue sin acceso a la carpeta. ¿Qué haces primero?
+ gpupdate /force o cerrar sesión y volver a entrar, para que su sesión reciba el grupo nuevo
- Reinstalar Windows
- Darle permisos de administrador
= Los cambios de grupo no llegan a una sesión ya abierta hasta que se actualiza.
:::

::: banco
? ¿Qué comando muestra el servidor DHCP y los servidores DNS de un PC?
+ ipconfig /all
- ipconfig
- ping
= ipconfig sin opciones no muestra DHCP ni DNS; /all sí.

? ¿Qué hace taskkill /im programa.exe /f?
+ Termina por la fuerza el proceso con ese nombre
- Reinicia el equipo
- Desinstala el programa
= /im indica el nombre de la imagen y /f fuerza el cierre aunque no responda.

? ¿Para qué sirve sfc /scannow?
+ Comprueba y repara los archivos protegidos del sistema
- Busca virus
- Desfragmenta el disco
= El comprobador de archivos de sistema restaura los que estén dañados.

? «Error de sistema 5: Acceso denegado» al conectar una unidad de red indica que…
+ La ruta existe, pero el usuario no tiene permiso
- El servidor está apagado
- El nombre del recurso está mal escrito
= El error 53 indica que no encuentra la ruta; el 5, falta de permisos.

? Has corregido el DNS de un PC y las páginas siguen sin cargar. ¿Qué te falta?
+ Vaciar la caché DNS con ipconfig /flushdns
- Renovar la licencia de Windows
- Cambiar la puerta de enlace
= Windows guarda en caché también las respuestas fallidas durante un tiempo.

? ¿Qué cmdlet de PowerShell comprueba si un puerto concreto de un servidor responde?
+ Test-NetConnection
- Get-Process
- Get-ChildItem
= Test-NetConnection servidor -Port 443 devuelve TcpTestSucceeded True o False.
:::

=== s2-ad | Active Directory: usuarios, grupos y permisos | 20 | 2
En casi todas las empresas con Windows, las cuentas de los empleados viven en **Active Directory (AD)**: un directorio central con usuarios, equipos y grupos. Gran parte del trabajo de una mesa de ayuda es gestionarlo.

## Conceptos

- **Dominio**: el conjunto que administra AD, por ejemplo `laceiba.local`. Los equipos «se unen al dominio».
- **Controlador de dominio**: el servidor que guarda el directorio y comprueba las contraseñas.
- **Unidad organizativa (OU)**: carpeta para ordenar usuarios y equipos (Ventas, Contabilidad, Bajas…). A cada OU se le aplican directivas distintas.
- **Grupo**: conjunto de usuarios al que se dan permisos (carpetas, VPN, impresoras). **Los permisos se dan a grupos, no a personas**: así, cuando alguien cambia de puesto, basta con cambiar sus grupos.
- **Directiva de grupo (GPO)**: configuración que se aplica sola a los usuarios y equipos de una OU (unidades de red, fondo, seguridad).

## Las tareas de cada día

| Petición | Qué se hace |
|---|---|
| «Mi cuenta está bloqueada» | Desbloquear. Si recuerda la contraseña, **no** se cambia |
| «Olvidé mi contraseña» | **Verificar la identidad**, poner una temporal y marcar «debe cambiarla al iniciar sesión» |
| Alta de un empleado | Crear el usuario en su OU, con sus grupos y una contraseña temporal |
| Cambio de puesto | Mover de OU, añadir los grupos nuevos y **quitar los viejos** |
| Baja | **Deshabilitar** (no borrar), mover a Bajas y quitar accesos como la VPN |

::: cuidado
**Verifica siempre la identidad** antes de restablecer una contraseña: devuelve la llamada a la extensión registrada o sigue el procedimiento de la empresa. Hacerse pasar por un empleado para pedir una contraseña nueva es uno de los ataques más comunes.
:::

## Mínimo privilegio

Cada persona debe tener **solo los permisos que necesita** para su trabajo. Por eso nunca se mete a un usuario en «Admins. del dominio» para que «instale sus programas»: si su cuenta cae en un phishing, el atacante tendría el control de toda la empresa. La respuesta correcta es instalarle el programa tú (o por el procedimiento de software).

[[ad:mesa]]

::: quiz
? Un usuario dice que su cuenta está bloqueada y recuerda su contraseña. ¿Qué haces?
+ Desbloquear la cuenta sin cambiar la contraseña
- Restablecer la contraseña a una nueva
- Borrar la cuenta y crearla de nuevo
= El bloqueo es por intentos fallidos; si sabe su contraseña, solo hay que desbloquear.

? ¿Qué se hace con la cuenta de un empleado que deja la empresa?
+ Deshabilitarla, moverla a la OU de bajas y quitarle accesos
- Borrarla en el momento
- Dejarla igual por si vuelve
= Deshabilitar corta el acceso sin perder su buzón ni sus archivos.

? ¿Por qué se dan los permisos a grupos y no a cada usuario?
+ Porque así basta con cambiar los grupos cuando alguien cambia de puesto
- Porque AD no permite dar permisos a usuarios
- Porque los grupos son más rápidos de escribir
= Gestionar permisos por grupos es más ordenado y evita olvidos.

? Antes de restablecer la contraseña de alguien que llama por teléfono, ¿qué es imprescindible?
+ Verificar su identidad según el procedimiento
- Preguntarle su contraseña antigua
- Nada, si dice su nombre completo
= Sin verificación, cualquiera podría robar una cuenta llamando a soporte.
:::

::: banco
? ¿Qué es una unidad organizativa (OU)?
+ Una carpeta del directorio para ordenar usuarios y equipos y aplicarles directivas
- Un tipo de contraseña
- Un servidor de correo
= Las OU organizan el directorio y reciben directivas de grupo.

? Un empleado pasa de Ventas a Contabilidad. ¿Qué te falta si solo lo añades al grupo de Contabilidad?
+ Quitarlo de los grupos de Ventas
- Cambiarle el nombre
- Reinstalar su PC
= Si no se quitan los grupos viejos, acumula permisos que ya no necesita.

? Una usuaria pide ser administradora del dominio para instalar programas. ¿Qué haces?
+ Rechazarlo y ofrecer instalarle el programa por el procedimiento
- Añadirla a Admins. del dominio
- Darle tu contraseña de administrador
= El principio de mínimo privilegio impide dar control total del dominio a un usuario.

? ¿Qué opción se marca al poner una contraseña temporal?
+ El usuario debe cambiar la contraseña al iniciar sesión
- La contraseña nunca expira
- El usuario no puede cambiar la contraseña
= Así solo el usuario conoce su contraseña definitiva.

? ¿Qué es una directiva de grupo (GPO)?
+ Una configuración que AD aplica automáticamente a usuarios y equipos
- Un grupo de seguridad con muchos usuarios
- Un tipo de controlador de dominio
= Las GPO aplican unidades de red, fondos, seguridad y más sin tocar cada PC.

? ¿Qué servidor comprueba las contraseñas en un dominio de Windows?
+ El controlador de dominio
- El servidor DHCP
- El servidor de impresión
= El controlador de dominio guarda el directorio y valida los inicios de sesión.
:::

=== s2-componentes | Arquitectura del PC: CPU, memoria, buses y firmware | 18 | 1
Para diagnosticar, comprar o actualizar equipos hay que saber qué hace cada pieza y cómo se comunican entre sí.

[[pc:oficina]]

## Procesador (CPU)

- **Núcleos e hilos:** cada núcleo ejecuta instrucciones; con *hyper-threading* (SMT), un núcleo atiende dos hilos. Muchos procesadores actuales mezclan núcleos de rendimiento (P) y de eficiencia (E): por ejemplo, 6 P + 4 E con 16 hilos.
- **Caché L1, L2 y L3:** memoria muy rápida dentro del procesador. Cuanto más cerca del núcleo, más rápida y más pequeña.
- **TDP:** el calor que debe disipar la refrigeración. Un portátil fino limita su potencia cuando se calienta (*thermal throttling*): por eso un equipo sucio va lento.

## Memoria (RAM)

- **DDR4 y DDR5** no son compatibles entre sí: la placa base admite una u otra.
- **Doble canal:** dos módulos iguales en las ranuras correctas casi duplican el ancho de banda frente a uno solo.
- **ECC:** corrige errores de memoria; se usa en servidores.
- Con poca RAM, el sistema usa el disco como memoria (archivo de paginación) y todo se vuelve lento: en el Administrador de tareas se ve la memoria al 90 % o más y el disco muy ocupado.

## Almacenamiento

| Tipo | Interfaz | Velocidad aproximada | Nota |
| --- | --- | --- | --- |
| HDD | SATA | 100–200 MB/s | Barato y grande; lento en accesos aleatorios |
| SSD SATA | SATA III | Hasta ~550 MB/s | Limitado por la interfaz SATA |
| SSD NVMe | PCIe (formato M.2) | 3.500–7.000 MB/s o más | Muchísimas más **IOPS** (operaciones por segundo) |

Cuidado: un M.2 puede ser SATA o NVMe, y no todas las ranuras M.2 admiten los dos.

## Buses: PCI Express

Las tarjetas gráficas, los SSD NVMe y muchas tarjetas de red usan **PCIe**, organizado en **carriles** (x1, x4, x16). Cada generación duplica la velocidad por carril: Gen3 ≈ 1 GB/s, Gen4 ≈ 2 GB/s, Gen5 ≈ 4 GB/s. Un NVMe Gen4 x4 rinde a la mitad en una ranura Gen3.

## Firmware y arranque

- **UEFI** sustituyó a la BIOS clásica: arranque más rápido, interfaz gráfica y discos con tabla **GPT** (la BIOS usaba **MBR**, limitada a 2 TB).
- **POST:** la autocomprobación al encender. Si falla, el equipo avisa con pitidos o luces de diagnóstico (consulta el manual de la placa).
- **Secure Boot:** solo arranca software firmado; dificulta los *bootkits*.
- **TPM 2.0:** chip que guarda claves de forma segura (BitLocker, Windows Hello). Windows 11 exige TPM 2.0 y Secure Boot.

::: quiz
? Un portátil va lento solo cuando lleva un rato encendido y el ventilador suena mucho. ¿Qué es lo más probable?
+ Thermal throttling: el procesador baja su potencia por calor
- Le falta RAM
- El disco es GPT
= Limpiar el polvo y revisar la pasta térmica suele resolverlo.

? ¿Por qué conviene instalar dos módulos de RAM iguales en lugar de uno?
+ Para trabajar en doble canal y casi duplicar el ancho de banda de la memoria
- Porque un solo módulo no arranca
- Para activar Secure Boot
= Con un solo módulo, la memoria trabaja en un canal.

? ¿Qué interfaz limita un SSD SATA a unos 550 MB/s?
+ SATA III
- PCIe Gen4
- USB-C
= Los SSD NVMe usan PCIe y superan con mucho ese límite.

? ¿Qué exige Windows 11 además de un procesador compatible?
- Un disco HDD
+ TPM 2.0 y Secure Boot
- Una tarjeta gráfica dedicada
= Son requisitos de seguridad del arranque y del cifrado.

? ¿Qué tabla de particiones usa UEFI y admite discos de más de 2 TB?
+ GPT
- MBR
- FAT32
= MBR era la de la BIOS clásica y tiene el límite de 2 TB.

? Un SSD NVMe Gen4 x4 se instala en una ranura PCIe Gen3 x4. ¿Qué pasa?
+ Funciona, pero a la velocidad de Gen3 (aproximadamente la mitad)
- No arranca
- Funciona más rápido
= PCIe es compatible entre generaciones; la velocidad la marca la más lenta.
:::

::: banco
? ¿Qué es el POST?
+ La autocomprobación del hardware al encender el equipo
- El sistema operativo
- Un tipo de memoria
= Si falla, la placa avisa con pitidos o luces de diagnóstico.

? ¿Para qué sirve el TPM?
+ Para guardar claves de cifrado de forma segura, por ejemplo las de BitLocker
- Para enfriar el procesador
- Para conectar monitores
= Es un chip criptográfico en la placa o integrado en el procesador.
:::

=== s2-armar | Armar y actualizar un equipo con seguridad | 16 | 2
Montar o actualizar un equipo es sencillo si se sigue un orden y se toman precauciones.

## Seguridad antes de abrir

- **Apaga y desenchufa** el equipo; en una laptop, desconecta también la batería si se puede.
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

? Antes de comprar más RAM para una laptop, ¿qué miras?
+ El modelo exacto y su manual: tipo de memoria, máximo y ranuras libres
- Solo el color de la laptop
- El sistema operativo
= Muchas laptops tienen la memoria soldada o un máximo bajo.

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
4. **Controladores** del fabricante: chipset, red, video, audio.
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
= Sin controladores, la red, el video o el audio pueden no funcionar bien.
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
| Laptop sin imagen pero arranca | Monitor externo: separa pantalla de gráfica |
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
? Un PC no hace nada al presionar el botón. ¿Qué miras primero?
+ La alimentación: cable, enchufe e interruptor de la fuente
- La placa base
- La versión de Windows
= Se empieza por lo más simple y probable.

? Un disco da errores de sectores defectuosos. ¿Qué es lo primero?
+ Hacer copia de seguridad de los datos
- Desfragmentarlo
- Esperar a ver si mejora
= Un disco que falla puede morir en cualquier momento.

? Una laptop arranca pero no da imagen. ¿Qué prueba separa el problema?
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
