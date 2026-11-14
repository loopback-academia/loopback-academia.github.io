---
area: redes
id: m9
titulo: Nivel profesional: las redes en el trabajo real
dominio: Nivel profesional
peso: 0
descripcion: Para quien ya domina el CCNA: el día a día de un ingeniero de redes. Método de resolución de averías, cambios en producción sin cortes, OSPF multiárea, BGP con el proveedor, alta disponibilidad, seguridad de equipos, automatización y un incidente real de principio a fin.
---

=== m9-dia | Un día de trabajo de un ingeniero de redes | 14 | 4
Saber configurar VLAN y OSPF es la base. Lo que distingue a un profesional es **cómo trabaja**: con método, con documentación y sin romper lo que funciona. Este módulo es para quien ya domina el temario del CCNA (si llegaste desde el examen de entrada, felicitaciones por tu resultado).

::: nota
**Cómo está hecho este módulo:** menos teoría de libro y más situaciones reales. Los laboratorios tienen **varias averías a la vez**, sin modo guiado, como en una guardia de verdad.
:::

## Las cuatro grandes tareas

| Tarea | Qué supone | Herramientas típicas |
|---|---|---|
| **Operación (run)** | Atender incidencias, monitorizar, revisar alertas | Sistema de tickets (ServiceNow, Jira), NMS (PRTG, Zabbix, LibreNMS), Syslog |
| **Cambios** | Altas de sedes, VLAN nuevas, migraciones, parches de IOS | Gestión de cambios (RFC), ventanas de mantenimiento, plantillas |
| **Proyectos** | Diseñar e implantar redes nuevas | Diagramas (draw.io, Visio), IPAM (NetBox, phpIPAM), presupuestos |
| **Mejora continua** | Automatizar, documentar, endurecer la seguridad | Python, Ansible, Git, wiki interna |

## Prioridades y SLA

Las incidencias se clasifican por **impacto** (a cuánta gente afecta) y **urgencia** (cuánto corre prisa):

| Prioridad | Ejemplo | Respuesta habitual |
|---|---|---|
| **P1 crítica** | Una sede entera o el centro de datos sin servicio | Inmediata, 24×7, se avisa a los responsables |
| **P2 alta** | Un servicio importante degradado (wifi de una planta caída) | En menos de 1 hora |
| **P3 media** | Un usuario o un puerto sin servicio | En el día |
| **P4 baja** | Peticiones y consultas | Planificada |

El **SLA** (acuerdo de nivel de servicio) fija esos tiempos por contrato. Incumplirlos tiene consecuencias económicas, por eso los tickets se actualizan con cada paso.

## La documentación que se espera de ti

- **Diagramas** físico (qué cable va a qué puerto) y lógico (VLAN, subredes, enrutamiento) **actualizados**.
- **IPAM:** qué subred y qué IP tiene cada cosa. Nada de «la IP me la invento».
- **Inventario/CMDB:** modelo, número de serie, versión de IOS, garantía y contrato de soporte de cada equipo.
- **Runbooks:** procedimientos paso a paso para tareas repetidas (dar de alta un puerto, cambiar un AP).
- **Copias de la configuración** de todos los equipos, idealmente automáticas y en Git.

::: cuidado
El error más caro de un técnico junior no suele ser técnico: es **tocar producción sin plan ni permiso**. En una empresa, todo cambio pasa por la gestión de cambios (lo verás en la lección de cambios).
:::

::: quiz
? Una sucursal de 40 personas se queda sin red en horario laboral. ¿Qué prioridad tiene?
+ P1 crítica
- P3 media
- P4 baja
= Afecta a una sede entera y para el negocio: máxima prioridad.

? ¿Para qué sirve un IPAM como NetBox?
- Para monitorizar el consumo de CPU
+ Para documentar subredes, direcciones IP, VLAN y equipos de forma centralizada
- Para cifrar el tráfico
= El IPAM es la fuente de verdad de direccionamiento: evita IP duplicadas y redes solapadas.

? ¿Qué es un runbook?
+ Un procedimiento paso a paso para una tarea repetida
- Un tipo de cable
- Un protocolo de enrutamiento
= Los runbooks permiten que cualquiera del equipo haga la tarea igual y sin olvidos.

? ¿Qué indica el SLA de un servicio?
- La versión de IOS de los equipos
+ Los tiempos de respuesta y resolución comprometidos por contrato
- El número de VLAN
= Service Level Agreement: lo que se ha prometido al cliente, normalmente por prioridad.

? ¿Qué copia de la configuración es la más útil en una avería?
- La que hizo el técnico anterior hace dos años
+ Una copia reciente y automática, con historial de cambios (por ejemplo, en Git)
- Ninguna: se reconfigura de memoria
= Con historial puedes comparar «cómo estaba ayer» con «cómo está hoy» y ver qué cambió.
:::

::: banco
? ¿Qué herramienta se usa para monitorizar el estado de los equipos y recibir alertas?
+ Un NMS como Zabbix, PRTG o LibreNMS
- Un procesador de textos
- Un switch de acceso
= El sistema de gestión de red (NMS) sondea los equipos (SNMP, ICMP) y alerta cuando algo cae.

? ¿Qué diferencia hay entre el diagrama físico y el lógico?
+ El físico muestra cables y puertos; el lógico, VLAN, subredes y enrutamiento
- Son lo mismo
- El lógico solo se usa en wifi
= Los dos hacen falta: uno para encontrar el cable, otro para entender el tráfico.

? ¿Qué se guarda en una CMDB?
+ El inventario de equipos con sus datos (modelo, serie, versión, contrato)
- Las contraseñas de los usuarios
- Los paquetes capturados
= La CMDB (base de datos de configuración) relaciona equipos, servicios y responsables.

? Un usuario no puede imprimir en su puesto. ¿Qué prioridad suele tener?
- P1
+ P3
- Ninguna, se ignora
= Afecta a una persona y hay alternativas: prioridad media.
:::

=== m9-troubleshooting | Resolución de averías profesional: método y evidencias | 22 | 4
Cuando la red cae, todo el mundo mira al de redes. Un profesional no prueba cosas al azar: sigue un **método**, reúne **evidencias** y deja escrito lo que encontró.

## Los métodos

| Método | Cómo se aplica | Cuándo |
|---|---|---|
| **De abajo arriba** (capa 1 → 7) | Cable, luces, interfaz, VLAN, IP, ruta, aplicación | Síntomas confusos o equipos nuevos |
| **De arriba abajo** | Empiezas por la aplicación y bajas | Cuando la red «parece» bien y falla un servicio |
| **Divide y vencerás** | Empiezas por la capa 3 (ping): si funciona, el fallo está arriba; si no, abajo | El más rápido en la práctica |
| **Seguir el camino** | Saltas equipo a equipo por donde pasa el paquete (traceroute, tablas MAC/ARP/rutas) | Redes grandes, varios saltos |
| **Comparar** | Comparas con la configuración que funcionaba (o con una sede gemela) | Tras un cambio |

## Las preguntas que haces siempre primero

1. **¿Qué ha cambiado?** (cambios recientes, ventanas de mantenimiento, cortes de luz). La mayoría de averías vienen de un cambio.
2. **¿A quién afecta?** ¿Un usuario, una VLAN, una sede, todo? El alcance señala el punto de fallo.
3. **¿Desde cuándo?** Mira Syslog y el NMS para encontrar la hora exacta.
4. **¿Se puede reproducir?** Un fallo intermitente necesita pruebas continuas (ping extendido, monitorización).

## Los comandos por capas (tu kit de guardia)

```ios
! Capa 1-2: ¿está vivo el enlace y en qué VLAN?
show interfaces status
show interfaces g0/1        ! errores CRC, colisiones tardías, drops
show mac address-table interface fa0/7
show interfaces trunk
show spanning-tree vlan 10
! Capa 3: ¿hay direcciones y caminos?
show ip interface brief
show ip route 10.10.0.10    ! qué ruta se usaría para ese destino
show ip ospf neighbor
show ip protocols
show arp
! Servicios
show ip dhcp binding
show ip nat translations
show access-lists           ! contadores de coincidencias
show logging | include %LINK|%OSPF|%SEC
```

## debug, con cuidado

`debug` muestra en tiempo real lo que hace un proceso, pero **consume CPU** y en un equipo cargado puede tumbarlo.

- Antes de `debug`: `show processes cpu sorted` (que no esté ya al límite).
- Hazlo lo más concreto posible (`debug ip ospf adj`, no `debug all`).
- Por SSH necesitas `terminal monitor` para ver la salida.
- Al acabar: **`undebug all`** (o `u all`). Siempre.

## Evidencias y causa raíz

Copia la salida de los comandos **antes y después** del arreglo en el ticket. Cuando se resuelve, se escribe la **causa raíz (RCA)**: qué pasó, por qué, cómo se arregló y **qué se hará para que no se repita** (por ejemplo, una plantilla, una alerta nueva o una revisión de cambios).

::: practica
El laboratorio de abajo tiene **cuatro averías a la vez** en el router de una sucursal. No hay guía: diagnostica con show, apunta lo que encuentres y arregla en orden de capas. Después, escribe en tu cuaderno la causa raíz como si fuera para el ticket.
:::

[[cli:averia-sucursal]]

::: quiz
? Una sede entera dejó de funcionar a las 02:00. ¿Cuál es la primera pregunta que haces?
+ ¿Qué cambió anoche? (cambios programados, cortes, alertas)
- ¿Qué marca de cable usan?
- ¿Cuántas VLAN hay?
= La mayoría de averías llegan tras un cambio. Revisar cambios y registros acota la búsqueda.

? En el método «divide y vencerás», ¿por dónde empiezas?
- Por la capa 1
+ Por la capa 3, con un ping
- Por la capa 7
= Si el ping funciona, el fallo está en capas superiores; si no, en las inferiores. Así se descarta la mitad.

? ¿Qué debes hacer siempre al terminar de usar debug?
+ undebug all
- reload
- write erase
= Un debug olvidado sigue consumiendo CPU y llenando el registro.

? show interfaces muestra muchos errores CRC y colisiones tardías en un puerto. ¿Qué sospechas?
+ Un problema físico o de dúplex (cable dañado o dúplex distinto en cada extremo)
- Una ruta estática mal puesta
- Un error de DNS
= CRC y late collisions apuntan a capa 1 (cable) o a un desajuste de dúplex.

? ¿Qué incluye un buen análisis de causa raíz (RCA)?
- Solo el comando que lo arregló
+ Qué pasó, por qué, cómo se arregló y qué se hará para que no se repita
- El nombre de quien tuvo la culpa
= La RCA busca evitar que se repita, no culpables.
:::

::: banco
? ¿Para qué sirve show ip route 10.10.0.10 (con una IP concreta)?
+ Muestra qué entrada de la tabla se usaría para llegar a ese destino
- Borra la ruta
- Hace ping
= Es la forma más rápida de comprobar la decisión de enrutamiento para un destino concreto.

? Por SSH ejecutas un debug y no ves nada. ¿Qué te falta?
+ terminal monitor
- service password-encryption
- ip routing
= Por defecto los mensajes de debug y log solo salen por la consola; terminal monitor los envía a tu sesión.

? Un usuario de la VLAN 10 no tiene red. ¿Qué comando te dice en qué puerto y VLAN aprendió el switch su MAC?
+ show mac address-table
- show ip route
- show version
= Si la MAC no aparece, el problema está en el puerto, el cable o la VLAN de acceso.

? ¿Qué método usas en una red grande con varios saltos donde el tráfico se pierde por el camino?
+ Seguir el camino (salto a salto con traceroute y las tablas de cada equipo)
- Reiniciar todos los routers
- De arriba abajo empezando por el navegador
= Seguir el camino del paquete encuentra el salto exacto donde se pierde.

? ¿Por qué hay que copiar la salida de los comandos en el ticket?
+ Para dejar evidencias del estado antes y después y poder analizarlo luego
- Porque lo exige IOS
- Para ocupar espacio
= Sin evidencias no hay análisis de causa raíz fiable.
:::

=== m9-cambios | Cambios en producción sin interrumpir el servicio | 18 | 4
En una empresa, **ningún cambio se hace «en caliente» ni sin planificación**. Se planifica, se aprueba, se ejecuta en una ventana y siempre hay un plan de vuelta atrás.

## El ciclo de un cambio

1. **Solicitud (RFC):** qué se quiere cambiar, por qué, riesgo e impacto.
2. **Aprobación:** el comité de cambios (CAB) o el responsable lo revisan.
3. **MOP (método de procedimiento):** el guion exacto, con cuatro partes:
   - **Comprobaciones previas** (pre-checks): guardar el estado actual (`show ip route`, `show ip ospf neighbor`, `show interfaces status`…).
   - **Implementación:** los comandos exactos, ya escritos y revisados por un compañero.
   - **Comprobaciones posteriores** (post-checks): repetir los show y comparar.
   - **Vuelta atrás (rollback):** los comandos para dejarlo como estaba si algo falla.
4. **Ventana de mantenimiento:** a una hora de poco uso, avisando a los afectados.
5. **Cierre:** resultado, incidencias y documentación actualizada.

## La red de seguridad: reload in

Si vas a tocar algo que puede dejarte **sin acceso remoto** (ACL de las VTY, la interfaz de gestión, una ruta), programa antes un reinicio:

```ios
R1# reload in 10
! Haz el cambio. Si pierdes la conexión, en 10 minutos el equipo se reinicia
! con la startup-config (la de antes del cambio) y recuperas el acceso.
R1# reload cancel
! Si todo ha ido bien, cancelas el reinicio... y solo entonces guardas.
R1# copy running-config startup-config
```

## Copias y vuelta atrás con archive

```ios
R1(config)# archive
R1(config-archive)# path flash:backup-
R1(config-archive)# write-memory           ! guarda una copia cada vez que se hace write
R1# show archive
R1# configure replace flash:backup-1 list  ! vuelve EXACTAMENTE a esa configuración
```

`configure replace` compara la configuración actual con la del archivo y aplica solo las diferencias: es el rollback limpio. Antes de un cambio grande, guarda también una copia fuera del equipo (`copy running-config scp:` o tftp).

## Buenas prácticas que se esperan de ti

- **Escribe los comandos antes**, en un archivo, y que otra persona los revise (*peer review*).
- **Un cambio cada vez.** Si cambias tres cosas y falla, no sabrás cuál fue.
- Ten **acceso por consola** o fuera de banda (OOB) cuando el riesgo es alto.
- **Comunica:** aviso antes, durante (si se alarga) y al terminar.
- Actualiza **diagramas e IPAM** el mismo día.

::: cuidado
El clásico: aplicar una ACL a las líneas VTY sin incluir tu propia IP. Te quedas fuera de todos los equipos remotos. Con `reload in 10` habrías vuelto en diez minutos.
:::

::: quiz
? ¿Qué cuatro partes tiene un buen MOP?
+ Comprobaciones previas, implementación, comprobaciones posteriores y vuelta atrás
- Solo los comandos
- Compra, instalación, factura y garantía
= Sin pre-checks no puedes comparar y sin rollback no puedes volver.

? Vas a cambiar la ACL que protege las VTY de un router remoto. ¿Qué haces antes?
+ reload in 10 (y reload cancel si todo va bien)
- erase startup-config
- shutdown en la interfaz de gestión
= Si te quedas sin acceso, el equipo se reinicia con la configuración guardada y vuelves a entrar.

? ¿Qué hace configure replace flash:backup-1?
- Borra la flash
+ Sustituye la configuración actual por la del archivo, aplicando solo las diferencias
- Reinicia el equipo
= Es la forma limpia de volver a una configuración conocida.

? ¿Por qué se hace un solo cambio cada vez?
+ Para saber exactamente qué cambio causa un problema si algo falla
- Porque IOS no permite más
- Para cobrar más horas
= Varios cambios a la vez convierten una avería sencilla en un rompecabezas.

? ¿Cuándo se guarda la configuración (copy run start) si usaste reload in?
- Antes de hacer el cambio
+ Después de comprobar que todo va bien y cancelar el reinicio con reload cancel
- Nunca
= Si guardas antes, el reinicio de seguridad cargaría la configuración rota.
:::

::: banco
? ¿Qué es la ventana de mantenimiento?
+ El periodo acordado, de poco uso, en el que se permiten cambios con posible impacto
- Una ventana de Windows
- El tiempo que tarda un equipo en arrancar
= Se elige para molestar lo mínimo y se avisa a los afectados.

? ¿Qué es el CAB?
+ El comité que revisa y aprueba los cambios
- Un tipo de cable
- Un protocolo de copia de seguridad
= Change Advisory Board: evalúa riesgo, impacto y coordinación entre equipos.

? ¿Qué acceso conviene tener preparado para un cambio de alto riesgo en un equipo remoto?
+ Acceso por consola o fuera de banda (OOB)
- Solo Telnet
- Ninguno, se hace por SSH y ya está
= Si el cambio corta la red, el acceso fuera de banda te permite arreglarlo.

? ¿Qué comando programa un reinicio en 10 minutos?
+ reload in 10
- reload 10
- shutdown 10
= Y reload cancel lo anula.
:::

=== m9-ospf-pro | OSPF en redes grandes: multiárea, LSA y averías | 22 | 4
En la empresa real OSPF no tiene un área: tiene un **área 0 (backbone)** y varias áreas conectadas a ella. Así las tablas son más pequeñas y un fallo en una sede no hace recalcular a toda la red.

## Tipos de router

| Router | Qué es |
|---|---|
| **Interno** | Todas sus interfaces en la misma área |
| **ABR** (Area Border Router) | Une un área con el área 0. Resume y propaga rutas entre áreas |
| **ASBR** | Inyecta en OSPF rutas externas (estáticas, de BGP, de otro protocolo) |
| **Backbone** | Tiene al menos una interfaz en el área 0 |

Regla de oro: **toda área debe tocar el área 0**.

## Los LSA que tienes que reconocer

| Tipo | Lo genera | Qué describe | En la tabla de rutas |
|---|---|---|---|
| 1 Router | Cada router | Sus enlaces dentro del área | O |
| 2 Network | El DR | Los routers de un segmento multiacceso | O |
| 3 Summary | El ABR | Redes de otras áreas | **O IA** |
| 5 External | El ASBR | Rutas externas | **O E1 / O E2** |
| 7 NSSA External | ASBR dentro de una NSSA | Externas en un área NSSA | **O N1 / O N2** |

## Áreas especiales: tablas más pequeñas

| Área | Qué bloquea | Las sustituye por |
|---|---|---|
| **Stub** | LSA 5 (externas) | Una ruta por defecto del ABR |
| **Totally stubby** (Cisco) | LSA 3 y 5 | Solo la ruta por defecto |
| **NSSA** | LSA 5, pero permite un ASBR local (LSA 7) | El ABR convierte 7 en 5 |

## Resumir rutas en el ABR

```ios
router ospf 1
 area 10 range 10.10.0.0 255.255.0.0   ! el ABR anuncia un /16 en lugar de 256 redes /24
 area 20 stub                           ! (en todos los routers del área 20)
```

Resumir **reduce el tamaño de las tablas y aísla la inestabilidad**: si cae una /24 dentro del resumen, el resto de la red ni se entera.

## Averías típicas de vecindad (y qué ves)

| Síntoma | Causa probable | Comprobación |
|---|---|---|
| No aparece el vecino | Áreas distintas, subred distinta, interfaz pasiva, ACL que bloquea 224.0.0.5 | `show ip ospf interface`, `show ip protocols` |
| Se queda en **EXSTART/EXCHANGE** | **MTU distinta** en cada extremo | `show interfaces` (MTU) |
| Se queda en **INIT** | Solo llegan hellos en un sentido (ACL, enlace unidireccional) | `debug ip ospf adj` |
| Aparece y desaparece | Timers hello/dead distintos, enlace inestable | `show ip ospf interface` |
| Vecino pero faltan rutas | Área no conectada al área 0, filtros, resumen mal hecho | `show ip ospf database` |
| Mensaje *duplicate router-id* | Dos routers con el mismo RID | `show ip ospf` |

[[cli:averia-ospf]]

::: quiz
? ¿Qué router conecta un área con el área 0 y genera LSA de tipo 3?
- ASBR
+ ABR
- DR
= El ABR (Area Border Router) resume las redes de un área hacia las demás.

? ¿Cómo aparece en show ip route una red aprendida de otra área OSPF?
- O E2
+ O IA
- C
= IA = inter-area, aprendida mediante LSA de tipo 3.

? Dos routers OSPF se quedan en EXSTART y nunca llegan a FULL. ¿Causa más probable?
+ MTU distinta en los dos extremos
- Contraseña de enable distinta
- VLAN nativa distinta
= El intercambio de bases de datos falla si los paquetes DBD no caben por la MTU del otro lado.

? ¿Qué hace un área stub?
+ Bloquea las rutas externas (LSA 5) y las sustituye por una ruta por defecto
- Bloquea todo el tráfico
- Convierte OSPF en RIP
= Así los routers del área tienen tablas más pequeñas.

? ¿Qué comando resume en el ABR las redes del área 10 en 10.10.0.0/16?
+ area 10 range 10.10.0.0 255.255.0.0
- summary-address 10.10.0.0 area 10
- ip route 10.10.0.0 255.255.0.0 null0
= area range resume rutas internas en un ABR (summary-address es para externas en el ASBR).
:::

::: banco
? ¿Qué LSA genera el DR en un segmento multiacceso?
+ Tipo 2 (Network)
- Tipo 5
- Tipo 7
= El LSA 2 describe qué routers comparten ese segmento.

? ¿Qué router inyecta en OSPF rutas que vienen de BGP o de rutas estáticas?
+ El ASBR
- El ABR
- El BDR
= Autonomous System Boundary Router.

? Un vecino OSPF se queda en INIT. ¿Qué significa?
+ El router recibe hellos del vecino pero el vecino no le ve a él (comunicación en un solo sentido)
- Todo está bien
- La MTU es distinta
= En INIT el hello recibido aún no incluye nuestro router ID: algo bloquea un sentido.

? ¿Qué tipo de área permite un ASBR dentro aunque bloquee las LSA 5?
+ NSSA
- Stub
- Backbone
= Not-So-Stubby Area: las externas locales viajan como LSA 7.

? ¿Por qué se divide OSPF en varias áreas?
+ Para reducir el tamaño de las tablas y limitar el impacto de los cambios a cada área
- Porque un área solo admite 10 routers
- Para cifrar el tráfico
= El SPF se recalcula dentro del área afectada; el resto solo ve resúmenes.
:::

=== m9-bgp | BGP con tu proveedor de Internet | 20 | 4
**BGP** es el protocolo que une los sistemas autónomos de Internet. En una empresa lo usarás sobre todo para **conectarte a uno o dos proveedores (multihoming)** y anunciar tus direcciones públicas.

## Conceptos básicos

- **Sistema autónomo (AS):** red bajo una sola administración, con un número (ASN). Los privados van de 64512 a 65534.
- **eBGP:** sesión entre AS distintos (tú y tu proveedor). **iBGP:** dentro del mismo AS.
- BGP **no descubre vecinos**: se configuran a mano y hablan por **TCP 179**.
- Elige el camino por **atributos**, no por velocidad de los enlaces.

## Una configuración típica con el proveedor

```ios
router bgp 65010
 bgp router-id 1.1.1.1
 neighbor 203.0.113.1 remote-as 64500          ! sesión eBGP con el ISP
 neighbor 203.0.113.1 description ISP-A
 network 198.51.100.0 mask 255.255.255.0       ! tu bloque público
 neighbor 203.0.113.1 prefix-list SOLO-MIOS out
!
ip prefix-list SOLO-MIOS seq 10 permit 198.51.100.0/24
ip route 198.51.100.0 255.255.255.0 Null0      ! network solo anuncia lo que está en la tabla
```

::: cuidado
Filtra **siempre lo que anuncias** (prefix-list de salida). Anunciar por error las rutas de un proveedor a otro te convierte en tránsito de Internet y provoca incidentes que salen en las noticias.
:::

## Atributos para elegir la salida (y la entrada)

| Atributo | Ámbito | Para qué lo usas | Gana |
|---|---|---|---|
| **Weight** (Cisco) | Solo en ese router | Preferir una salida en un router concreto | Mayor |
| **Local preference** | Todo tu AS | Elegir el proveedor principal de salida | Mayor |
| **AS-path** | Lo ven los demás | Hacer menos atractiva una entrada (*AS-path prepend*) | Más corto |
| **MED** | Sugerencia al vecino | Indicar por cuál de tus enlaces con el mismo ISP entrar | Menor |

Con dos proveedores: **local preference** alta en el principal para la salida y **prepend** en el secundario para que el tráfico de entrada prefiera el principal.

## Verificar

```ios
show ip bgp summary          ! vecinos: si State/PfxRcd muestra un número, la sesión está establecida
show ip bgp                  ! tabla BGP (> = mejor camino)
show ip bgp neighbors 203.0.113.1 advertised-routes
```

Estados que verás: **Idle** (no lo intenta, revisa la configuración), **Active** (intenta conectar sin éxito: IP, ruta o ACL), **Established** (bien).

::: quiz
? ¿Qué puerto y protocolo usa BGP para la sesión entre vecinos?
- UDP 520
+ TCP 179
- OSPF multicast 224.0.0.5
= BGP usa TCP, por eso los vecinos se configuran a mano y deben alcanzarse por IP.

? Tienes dos proveedores y quieres que TODO tu AS salga por el principal. ¿Qué atributo usas?
- Weight
+ Local preference
- MED
= Local preference se propaga dentro de tu AS; weight solo afecta a un router.

? ¿Para qué sirve el AS-path prepend?
+ Para alargar artificialmente el camino y que los demás prefieran entrar por otro enlace
- Para cifrar BGP
- Para resumir rutas
= Se usa para controlar el tráfico de entrada en el enlace secundario.

? Un vecino BGP está en estado Active. ¿Qué significa?
- La sesión funciona
+ Está intentando conectar sin conseguirlo (revisa IP, alcance o ACL)
- Está apagado por el administrador
= Active es engañoso: no está activo, está reintentando.

? ¿Por qué se pone una prefix-list de salida hacia el proveedor?
+ Para anunciar solo tus redes y no convertirte por error en tránsito de otros
- Para acelerar la sesión
- Porque BGP no funciona sin ella
= Es la protección básica contra fugas de rutas.
:::

::: banco
? ¿Qué rango de ASN es privado (para uso interno)?
+ 64512 a 65534
- 1 a 1000
- 0 a 100
= Como las IP privadas, no se anuncian a Internet.

? En show ip bgp, ¿qué marca el mejor camino?
+ El símbolo >
- La letra C
- Un asterisco doble
= El > indica la ruta elegida que se instala en la tabla.

? ¿Qué diferencia hay entre eBGP e iBGP?
+ eBGP es entre AS distintos; iBGP, dentro del mismo AS
- Son lo mismo
- iBGP solo funciona en IPv6
= Con tu proveedor usas eBGP.

? network 198.51.100.0 mask 255.255.255.0 no anuncia nada. ¿Qué falta?
+ Que esa red exista exactamente en la tabla de rutas (por ejemplo, con una ruta a Null0)
- Reiniciar el router
- Un trunk
= BGP solo anuncia con network lo que ya está en la tabla de enrutamiento.
:::

=== m9-alta-disponibilidad | Diseño de campus y alta disponibilidad | 20 | 4
Una red profesional se diseña para que **un fallo no se note**: dos de todo lo importante y que el cambio sea automático.

## El modelo jerárquico

| Capa | Función | Equipos |
|---|---|---|
| **Acceso** | Conectar usuarios, teléfonos, AP. Seguridad de puerto | Switches de acceso (PoE) |
| **Distribución** | Enrutamiento entre VLAN, políticas, agregación | Pareja de switches de capa 3 |
| **Núcleo (core)** | Transportar rápido entre edificios y el CPD | Switches de alta capacidad |

En sedes medianas se usa el **núcleo colapsado**: distribución y núcleo en la misma pareja de switches.

## Las piezas de la redundancia

- **Enlaces dobles agrupados con LACP** (EtherChannel): más ancho de banda y sin bucles.
- **Spanning Tree bien pensado:** el **root** de cada VLAN en el switch de distribución que es su puerta de enlace activa.
- **FHRP (HSRP/VRRP):** una IP virtual de puerta de enlace compartida por los dos switches de distribución.
- **Stacking o VSS/StackWise Virtual:** dos switches que funcionan como uno.
- Fuentes de alimentación dobles, SAI y dos proveedores de Internet.

## HSRP alineado con STP

```ios
! DIST-1: activo para la VLAN 10 y root de la VLAN 10
spanning-tree vlan 10 root primary
interface vlan 10
 ip address 10.1.10.2 255.255.255.0
 standby 10 ip 10.1.10.1
 standby 10 priority 110
 standby 10 preempt
 standby 10 track GigabitEthernet1/0/48 20   ! si cae su uplink, baja a 90 y cede
! DIST-2: standby (prioridad 100 por defecto) y root secundario
spanning-tree vlan 10 root secondary
interface vlan 10
 ip address 10.1.10.3 255.255.255.0
 standby 10 ip 10.1.10.1
 standby 10 preempt
```

Si el root de STP está en un switch y la puerta de enlace activa en el otro, el tráfico da una vuelta innecesaria por el enlace entre ellos. **Alinea siempre los dos.**

## Mide la disponibilidad

| Disponibilidad | Caída máxima al año |
|---|---|
| 99 % | ~3,65 días |
| 99,9 % | ~8,8 horas |
| 99,99 % | ~53 minutos |
| 99,999 % | ~5 minutos |

Cada «nueve» extra cuesta mucho más dinero: se diseña según lo que el negocio necesita.

::: quiz
? ¿Qué capa del modelo jerárquico hace el enrutamiento entre VLAN y aplica políticas?
- Acceso
+ Distribución
- Núcleo
= La distribución agrega los switches de acceso y enruta entre VLAN.

? ¿Por qué se alinea el root de STP de una VLAN con el router HSRP activo de esa VLAN?
+ Para que el tráfico vaya directo a la puerta de enlace sin cruzar innecesariamente el enlace entre switches
- Porque HSRP no funciona sin STP
- Para cifrar el tráfico
= Si no coinciden, cada trama hace un salto de más.

? ¿Para qué sirve standby 10 track Gi1/0/48 20?
+ Si cae ese uplink, baja la prioridad HSRP en 20 y el otro switch pasa a ser el activo (con preempt)
- Para limitar la velocidad
- Para crear la VLAN 20
= Así el activo cede el papel si pierde su salida.

? ¿Qué es un núcleo colapsado?
+ Distribución y núcleo en la misma pareja de switches
- Un núcleo averiado
- Una red sin switches
= Es el diseño habitual en sedes medianas.

? ¿Cuánto tiempo de caída al año permite una disponibilidad del 99,99 %?
- 3,65 días
- 8,8 horas
+ Unos 53 minutos
= Cada nueve adicional divide por diez el tiempo de caída permitido.
:::

::: banco
? ¿Qué hace preempt en HSRP?
+ Permite que el router con mayor prioridad recupere el papel de activo al volver
- Desactiva HSRP
- Cambia la IP virtual
= Sin preempt, el que es activo lo sigue siendo aunque vuelva otro con más prioridad.

? ¿Qué protocolo estándar agrupa enlaces en un EtherChannel?
+ LACP (802.3ad)
- PAgP
- CDP
= PAgP es propietario de Cisco; LACP es el estándar.

? ¿Qué ventaja da el stacking de switches?
+ Varios switches se gestionan y funcionan como uno solo
- Duplica la velocidad del wifi
- Elimina la necesidad de VLAN
= Simplifica la gestión y permite EtherChannel entre miembros del stack.

? ¿Qué protocolo de puerta de enlace redundante es estándar (no propietario de Cisco)?
+ VRRP
- HSRP
- GLBP
= HSRP y GLBP son de Cisco; VRRP es el estándar del IETF.
:::

=== m9-hardening | Seguridad de los equipos en producción (hardening) | 20 | 4
Los equipos de red son objetivo de ataques: si alguien entra en un switch de núcleo, ve y controla todo el tráfico. **Endurecer** (*hardening*) es aplicar una lista de controles a todos los equipos, igual en todos.

## La lista mínima que piden las auditorías

| Área | Control | Comando de ejemplo |
|---|---|---|
| Acceso | Solo SSH v2, nada de Telnet ni HTTP | `transport input ssh`, `no ip http server` |
| Acceso | Usuarios individuales, no contraseñas compartidas | `username …` o, mejor, **AAA con TACACS+/RADIUS** |
| Acceso | Limitar desde dónde se gestiona | `access-class GESTION in` en las VTY |
| Acceso | Cerrar sesiones abandonadas | `exec-timeout 10 0` |
| Contraseñas | Hash fuerte | `enable algorithm-type scrypt secret …` (tipo 9) |
| Registro | Hora exacta y registro central | `ntp server …`, `service timestamps log datetime msec`, `logging host …` |
| Monitorización | SNMPv3 con autenticación y cifrado | `snmp-server group … v3 priv` |
| Servicios | Apagar lo que no se usa | `no cdp run` hacia fuera, `no ip source-route` |
| Puertos | Puertos libres apagados y en una VLAN sin uso | `shutdown`, `switchport access vlan 999` |
| Capa 2 | Protecciones contra suplantación | port security, DHCP snooping, DAI, BPDU guard |
| Trunks | VLAN nativa sin uso y sin DTP | `switchport trunk native vlan 99`, `switchport nonegotiate` |
| Aviso legal | Banner | `banner motd` |

## AAA con TACACS+: el estándar en empresas

```ios
aaa new-model
tacacs server ISE
 address ipv4 10.10.0.20
 key 7 <clave>
aaa authentication login default group tacacs+ local   ! si cae TACACS+, usuario local de emergencia
aaa authorization exec default group tacacs+ local
aaa accounting commands 15 default start-stop group tacacs+   ! registra quién ejecutó cada comando
```

Con AAA cada técnico entra con **su usuario**, se controla **qué puede hacer** y queda **registro de cada comando**. Es lo que piden las normas (ISO 27001, PCI-DSS).

## Verificar en bloque

Repasa siempre con `show running-config` (busca `password` en claro, `transport input all`, `telnet`) y con `show ip ssh`, `show users` y `show logging`.

::: practica
Ahora realizarás una auditoría real: el switch del laboratorio tiene **siete hallazgos**. Corrígelos todos sin cortar a los usuarios que están conectados. No hay guía: usa el informe (las tareas) y tu cuaderno.
:::

[[cli:auditoria]]

::: quiz
? ¿Qué aporta AAA con TACACS+ frente a una contraseña compartida en las VTY?
+ Cada técnico entra con su usuario, se controla qué puede hacer y queda registro de cada comando
- Más velocidad de conexión
- Nada, es lo mismo
= Autenticación, autorización y registro (accounting) individuales.

? ¿Por qué se configura NTP en todos los equipos?
+ Para que los registros de todos los equipos tengan la hora exacta y se puedan correlacionar
- Para que el wifi vaya más rápido
- Para cifrar SSH
= Sin hora sincronizada, reconstruir un incidente con los logs es casi imposible.

? ¿Qué versión de SNMP se recomienda?
- SNMPv1
- SNMPv2c
+ SNMPv3 con autenticación y cifrado
= v1 y v2c envían la comunidad en claro.

? ¿Qué hace access-class GESTION in en las líneas VTY?
+ Limita desde qué direcciones se puede abrir una sesión remota de gestión
- Cifra la sesión
- Crea la VLAN de gestión
= Solo la red de administración debería poder llegar a las VTY.

? ¿Qué se hace con los puertos de switch que no se usan?
+ Apagarlos y dejarlos en una VLAN sin uso
- Dejarlos en la VLAN 1 encendidos
- Ponerlos en modo trunk
= Así nadie puede conectarse a ellos y acceder a la red.
:::

::: banco
? ¿Qué añade aaa accounting commands 15?
+ Registra en el servidor qué comandos de privilegio 15 ejecuta cada usuario
- Cuenta los paquetes
- Limita el ancho de banda
= Es la trazabilidad que exigen las auditorías.

? ¿Por qué se deja un usuario local además de TACACS+ (group tacacs+ local)?
+ Para poder entrar si el servidor TACACS+ no responde
- Porque TACACS+ no admite contraseñas
- No hace falta nunca
= Es la cuenta de emergencia (break-glass), guardada en un sitio seguro.

? ¿Qué tipo de hash de contraseña es el más robusto en IOS moderno?
+ Tipo 9 (scrypt)
- Tipo 7
- Tipo 0
= El tipo 7 se descifra en segundos y el 0 es texto plano.

? ¿Qué comando añade fecha y hora con milisegundos a los mensajes de log?
+ service timestamps log datetime msec
- logging on
- clock set
= Imprescindible para ordenar los eventos de un incidente.
:::

=== m9-automatizar | Automatización en el día a día: Python, Netmiko y Ansible | 20 | 4
Hacer copias de 200 switches a mano lleva un día. Con un script, dos minutos y sin errores. La automatización ya no es opcional en los puestos de nivel medio.

## Copia de seguridad diaria con Python y Netmiko

```python
from datetime import date
from netmiko import ConnectHandler

equipos = ["10.0.0.11", "10.0.0.12", "10.0.0.13"]
for ip in equipos:
    conexion = ConnectHandler(device_type="cisco_ios", host=ip,
                              username="backup", password=leer_secreto("backup"))
    config = conexion.send_command("show running-config")
    with open(f"backups/{ip}-{date.today()}.cfg", "w") as f:
        f.write(config)
    conexion.disconnect()
```

- Las contraseñas **nunca en el código**: se leen de un gestor de secretos o de variables de entorno.
- Guarda los backups en **Git**: cada día queda un historial y `git diff` te dice qué cambió.

## Auditoría automática: buscar incumplimientos

```python
reglas = {"transport input telnet": "Telnet permitido",
          "no service password-encryption": "Contraseñas en claro",
          "snmp-server community public": "Comunidad SNMP por defecto"}
for linea, problema in reglas.items():
    if linea in config:
        print(f"{ip}: {problema}")
```

## El mismo cambio en 50 equipos con Ansible

```yaml
- name: Configurar NTP y banner en los switches de acceso
  hosts: acceso
  gather_facts: false
  tasks:
    - name: NTP y banner
      cisco.ios.ios_config:
        lines:
          - ntp server 10.10.0.123
          - banner motd # Acceso solo para personal autorizado #
        save_when: modified
```

Ansible es **idempotente**: si el equipo ya tiene la configuración, no cambia nada. Puedes lanzarlo cada noche para corregir desviaciones.

## Buenas prácticas

- Empieza con tareas **de solo lectura** (backups, auditorías) antes de cambiar nada.
- Prueba siempre en el laboratorio (Packet Tracer no sirve para esto; usa CML, EVE-NG o GNS3) y después en **un** equipo de producción.
- Una **fuente de verdad** (NetBox) con los datos, plantillas con los comandos y Git para el historial.

::: quiz
? ¿Dónde deben estar las contraseñas que usa un script de automatización?
- Escritas en el propio script
+ En un gestor de secretos o variables de entorno, nunca en el código
- En un comentario del script
= Un script con contraseñas acaba en un repositorio o en un correo tarde o temprano.

? ¿Qué significa que Ansible es idempotente?
+ Que aplicar dos veces la misma tarea deja el equipo igual: solo cambia lo que falta
- Que solo funciona una vez
- Que no necesita SSH
= Por eso puede ejecutarse a diario para corregir desviaciones.

? ¿Qué ventaja tiene guardar los backups de configuración en Git?
+ Tienes el historial y puedes ver exactamente qué cambió entre dos días
- Ocupan menos que en la flash
- Git cifra la red
= git diff entre dos copias es una herramienta de diagnóstico muy potente.

? ¿Con qué conviene empezar a automatizar?
+ Con tareas de solo lectura, como backups y auditorías
- Cambiando el enrutamiento de toda la red
- Borrando configuraciones antiguas
= Leer no rompe nada y ya aporta mucho valor.

? ¿Qué biblioteca de Python se usa mucho para conectarse por SSH a equipos de red?
+ Netmiko
- Pandas
- Django
= Netmiko simplifica la conexión y el envío de comandos a equipos de muchos fabricantes.
:::

::: banco
? ¿Qué módulo de Ansible aplica líneas de configuración en Cisco IOS?
+ cisco.ios.ios_config
- ansible.builtin.copy
- cisco.ios.ping
= ios_config envía líneas de configuración y puede guardar si hubo cambios.

? ¿Qué es una fuente de verdad (source of truth) en automatización de redes?
+ El sistema donde están los datos correctos de la red (por ejemplo, NetBox), del que se generan las configuraciones
- El último equipo configurado
- Un archivo de texto en el escritorio
= La configuración deseada se genera a partir de datos fiables, no de memoria.

? ¿Dónde se prueba un script de automatización antes de usarlo en producción?
+ En un laboratorio con emuladores (CML, EVE-NG, GNS3) y después en un solo equipo
- Directamente en todos los equipos a la vez
- No hace falta probarlo
= Un error automatizado se repite en todos los equipos a la vez.

? ¿Qué comando de Git muestra las diferencias entre dos versiones de un backup?
+ git diff
- git push
- git clone
= Así ves qué líneas se añadieron o quitaron.
:::

=== m9-caso | Caso real: el incidente de la sucursal, de principio a fin | 18 | 4
A continuación se presenta un incidente completo tal como lo vive un ingeniero de guardia. Léelo despacio: la forma de trabajar es lo que se evalúa en las entrevistas de nivel medio.

## 08:05 · Llega el ticket

> **P1** · «En la sucursal de Santiago nadie tiene red desde primera hora.»

Primeras acciones (en 5 minutos):

1. **Confirmas el alcance** en el NMS: el router R-SUC responde por la WAN, pero no hay tráfico de la LAN. Los AP de la sucursal están caídos.
2. **Revisas los cambios**: anoche hubo un cambio en R-SUC («ajustes menores de OSPF y DHCP»).
3. **Comunicas**: actualizas el ticket («Investigando, próxima actualización en 30 minutos») y avisas al responsable de la sucursal.

## 08:15 · Diagnóstico por capas

```ios
R-SUC# show ip interface brief
GigabitEthernet0/0   192.168.50.1   YES manual administratively down down
GigabitEthernet0/1   10.0.50.2      YES manual up                    up
R-SUC# show ip ospf neighbor
                                    ← vacío: no hay vecino con la central
R-SUC# show ip protocols
  Routing for Networks:
    192.168.50.0 0.0.0.255 area 0
    10.0.50.4 0.0.0.3 area 0        ← no coincide con 10.0.50.2
  Passive Interface(s):
    GigabitEthernet0/0
    GigabitEthernet0/1              ← la WAN no debería ser pasiva
```

Tres hallazgos en diez minutos, sin tocar nada. Y al revisar el pool DHCP, un cuarto: `default-router 192.168.50.254`, una IP que no existe.

## 08:30 · Arreglo (con el cambio de emergencia aprobado)

Se arregla **en orden de capas** y verificando cada paso: interfaz LAN (`no shutdown`), red OSPF correcta, WAN no pasiva, puerta de enlace del DHCP. Antes de guardar se comprueba: vecino en FULL, ruta `O` a 10.10.0.0/16, ping a los servidores y concesiones DHCP.

## 09:00 · Cierre y causa raíz

- **Causa raíz:** cambio sin revisión entre pares, escrito a mano, con cuatro errores. No hubo comprobaciones posteriores.
- **Acciones para que no se repita:** plantillas para la configuración de sucursales, revisión obligatoria de los cambios, *post-checks* en el MOP y una alerta en el NMS cuando una sucursal pierde la vecindad OSPF.

::: nota
Fíjate en que **la causa raíz no es «el técnico se equivocó»**: es que el proceso permitió que un error llegase a producción. Un buen informe propone mejoras del proceso.
:::

## Ahora te toca

Si no lo hiciste en la lección de método, resuelve este incidente en el simulador: es exactamente el mismo router. Después, practica el diagnóstico de varias averías en una topología completa.

[[cli:averia-sucursal]]

[[topo:averias]]

::: quiz
? ¿Qué es lo primero que haces al recibir un P1?
+ Confirmar el alcance, revisar cambios recientes y comunicar el estado
- Reiniciar el router
- Esperar a que se arregle solo
= Comunicar pronto da tranquilidad y el alcance orienta el diagnóstico.

? ¿Por qué se arregla en orden de capas y verificando cada paso?
+ Porque así sabes qué arreglo resolvió qué y no introduces fallos nuevos
- Porque IOS lo exige
- Para tardar más
= Arreglar todo de golpe impide saber qué funcionó.

? En el caso, ¿cuál es la causa raíz correcta?
- El técnico es malo
+ Un cambio sin revisión ni comprobaciones posteriores que llevó cuatro errores a producción
- El router es viejo
= La causa raíz apunta al proceso, para poder mejorarlo.

? ¿Qué acción evita que vuelva a pasar algo parecido?
+ Plantillas, revisión de cambios entre pares y comprobaciones posteriores en el MOP
- Prohibir los cambios para siempre
- Quitar OSPF
= Mejorar el proceso reduce los errores humanos.
:::

::: banco
? ¿Cada cuánto se actualiza un ticket P1 abierto?
+ A intervalos cortos y comprometidos (por ejemplo, cada 30 minutos), aunque no haya novedades
- Solo al cerrarlo
- Nunca
= La comunicación constante es parte del trabajo en un incidente grave.

? ¿Qué alerta habría detectado antes este incidente?
+ Una alerta en el NMS cuando una sucursal pierde la vecindad OSPF
- Una alerta de temperatura
- Ninguna
= Monitorizar la vecindad de enrutamiento detecta pérdidas de conectividad en segundos.

? ¿Qué es un cambio de emergencia?
+ Un cambio urgente para resolver un incidente, con aprobación rápida y documentado después
- Un cambio que se hace sin avisar a nadie
- Un cambio de hardware
= Incluso en una emergencia, el cambio queda registrado y aprobado.
:::
