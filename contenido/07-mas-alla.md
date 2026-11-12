---
area: redes
id: m7
titulo: Más allá del CCNA: redes de empresa
dominio: Más allá del CCNA
peso: 0
descripcion: Lo que piden los puestos de redes de nivel medio después del CCNA: VPN IPsec, firewalls de nueva generación, wifi empresarial con 802.1X, redes en la nube, SD-WAN y monitorización.
---

=== m7-ipsec | VPN IPsec: unir sedes y teletrabajadores | 18 | 3
Una **VPN** crea un túnel cifrado a través de internet. En las empresas hay dos tipos principales:

- **Sitio a sitio**: une dos oficinas de forma permanente, router con router (o firewall con firewall). Los usuarios ni se enteran.
- **Acceso remoto**: un empleado se conecta desde casa con un cliente VPN (IPsec, SSL/TLS o WireGuard).

## Cómo funciona IPsec

IPsec negocia el túnel en dos fases con **IKE** (Internet Key Exchange, normalmente IKEv2):

1. **Fase 1**: los dos extremos se autentican (con clave compartida o certificados) y crean un canal seguro para negociar.
2. **Fase 2**: acuerdan cómo se cifrará el tráfico real (algoritmo, por ejemplo AES-256-GCM) y **qué tráfico** va por el túnel.

Los dos extremos deben coincidir en todos los parámetros. La mayoría de las VPN que «no levantan» fallan por una diferencia: la clave, el algoritmo, el tiempo de vida o las redes de cada lado.

## Otras opciones

- **GRE sobre IPsec**: GRE permite pasar protocolos de enrutamiento (OSPF) por el túnel e IPsec lo cifra.
- **DMVPN**: muchas sucursales con túneles dinámicos entre ellas (Cisco).
- **VPN SSL / WireGuard**: muy usadas para el acceso remoto por su sencillez.

::: examen
Para el diagnóstico: comprueba primero que los dos extremos se ven por internet, después la **fase 1** y por último la **fase 2**. En equipos Cisco: `show crypto isakmp sa` (fase 1) y `show crypto ipsec sa` (fase 2).
:::

::: quiz
? ¿Qué tipo de VPN une dos oficinas de forma permanente?
+ Sitio a sitio
- Acceso remoto
- VLAN
- NAT
= La VPN sitio a sitio conecta redes completas entre dos dispositivos.

? ¿Qué protocolo negocia las claves y parámetros de un túnel IPsec?
+ IKE (Internet Key Exchange)
- DHCP
- ARP
- STP
= IKE autentica a los extremos y acuerda cómo cifrar.

? Un túnel IPsec no levanta. ¿Qué causa es la más habitual?
+ Una diferencia de parámetros entre los extremos (clave, algoritmo o redes)
- El cable de consola
- Que el DNS esté mal
= Ambos extremos deben configurarse de forma idéntica.

? ¿Por qué se usa GRE sobre IPsec?
+ Para poder pasar protocolos de enrutamiento como OSPF por un túnel cifrado
- Para no tener que cifrar
- Para sustituir a NAT
= GRE transporta multicast y protocolos de enrutamiento; IPsec aporta el cifrado.
:::

::: banco
? ¿Qué comando de Cisco muestra el estado de la fase 1 de IPsec?
+ show crypto isakmp sa
- show ip route
- show vlan brief
= La fase 1 (ISAKMP/IKE) se comprueba con show crypto isakmp sa.

? ¿Qué ventaja tiene usar certificados en lugar de una clave compartida en IPsec?
+ Escalan mejor y cada extremo tiene su propia identidad
- Son más fáciles de escribir
- No necesitan cifrado
= Con muchas sedes, una clave compartida es difícil de gestionar y de cambiar.

? Un empleado se conecta desde su casa a la red de la empresa. ¿Qué tipo de VPN usa?
+ VPN de acceso remoto
- VPN sitio a sitio
- Un trunk 802.1Q
= El cliente VPN del equipo crea el túnel hasta la empresa.
:::

=== m7-firewall | Firewalls de nueva generación | 16 | 3
Las ACL de un router filtran por IP y puerto. Un **firewall de nueva generación (NGFW)** hace mucho más:

- **Con estado (stateful)**: recuerda las conexiones; deja volver la respuesta de lo que salió sin abrir reglas de entrada.
- **Zonas**: interfaces agrupadas por confianza (dentro, DMZ, fuera). Las reglas se escriben entre zonas.
- **Reconoce aplicaciones** (no solo puertos): sabe distinguir una videollamada de una descarga aunque usen el puerto 443.
- **IPS**: detecta y bloquea ataques conocidos.
- **Filtrado web, usuarios** (integración con Active Directory) y **VPN**.

## Reglas: de arriba abajo

Las reglas se evalúan **en orden** y se aplica la primera que coincide. Al final hay una **denegación implícita**. Buenas prácticas:

1. Reglas concretas arriba, generales abajo.
2. **Mínimo privilegio**: permite solo lo necesario (origen, destino, servicio).
3. Una regla de «permitir todo» es un agujero, aunque sea «temporal».
4. Registra (log) las denegaciones para diagnosticar.
5. Documenta cada regla: quién la pidió y por qué.

## La DMZ

Los servidores que se publican en internet (web, correo) van en una **DMZ**, una zona separada de la red interna. Si alguien los compromete, no entra directamente en la red de la empresa.

::: quiz
? ¿Qué significa que un firewall sea «con estado»?
+ Que recuerda las conexiones y permite automáticamente su tráfico de vuelta
- Que solo funciona encendido
- Que guarda la configuración en NVRAM
= El firewall con estado sigue cada conexión de principio a fin.

? ¿Dónde se colocan los servidores que se publican en internet?
+ En una DMZ, separada de la red interna
- En la misma VLAN que los usuarios
- Fuera del firewall, sin protección
= La DMZ limita el daño si un servidor público es atacado.

? Las reglas de un firewall se evalúan…
+ De arriba abajo, y se aplica la primera que coincide
- Todas a la vez, y gana la más permisiva
- En orden alfabético
= Por eso las reglas concretas van primero.

? ¿Qué aporta un NGFW frente a una ACL?
+ Reconoce aplicaciones y usuarios, e incluye IPS y filtrado web
- Nada, son lo mismo
- Solo es más rápido
= Va más allá de IP y puerto.
:::

::: banco
? ¿Qué hay al final de la lista de reglas de un firewall?
+ Una denegación implícita de todo lo demás
- Un permiso implícito
- Una ruta por defecto
= Lo que no está permitido explícitamente se bloquea.

? ¿Por qué no se debe dejar una regla «permitir todo» aunque sea temporal?
+ Porque abre la red por completo y se suele olvidar quitarla
- Porque ralentiza el firewall
- Porque no está permitida en IPv6
= Las reglas «temporales» acaban siendo permanentes.

? ¿Qué es un IPS?
+ Un sistema que detecta y bloquea ataques conocidos en el tráfico
- Un proveedor de internet
- Un tipo de cable
= Intrusion Prevention System: compara el tráfico con firmas de ataques.
:::

=== m7-wifi | Wifi empresarial: controladores y 802.1X | 16 | 3
En una casa basta un router wifi con una contraseña. En una empresa con decenas de puntos de acceso hace falta algo más.

## Controladores

Los puntos de acceso (AP) se gestionan desde un **controlador** (físico, virtual o en la nube). Desde allí se configuran todas las redes, se reparten canales y potencia de forma automática y se ve qué clientes hay en cada AP. Los usuarios pasan de un AP a otro sin cortarse (**roaming**).

## WPA3-Enterprise y 802.1X

Con **WPA2/WPA3-Personal** todos comparten la misma contraseña: si alguien se va de la empresa, hay que cambiarla en todos los equipos. Con **Enterprise (802.1X)** cada persona entra con **su usuario** (o un certificado), que se comprueba en un servidor **RADIUS** conectado a Active Directory. Al desactivar la cuenta, pierde el acceso al wifi.

## Diseño

- **Estudio de cobertura (site survey)**: medir la señal antes y después de instalar.
- **Canales**: en 2,4 GHz solo 1, 6 y 11 no se solapan. En 5 GHz y 6 GHz hay muchos más; son los preferidos en oficinas.
- **SSID separados por función**: empleados (802.1X), invitados (aislada y con portal) y dispositivos (IoT, VLAN propia).

::: quiz
? ¿Qué ventaja tiene WPA3-Enterprise (802.1X) frente a una contraseña compartida?
+ Cada persona entra con su usuario y se le puede quitar el acceso individualmente
- No necesita cifrado
- Funciona sin puntos de acceso
= Con 802.1X se autentica a cada usuario contra RADIUS.

? ¿Qué canales de 2,4 GHz no se solapan?
+ 1, 6 y 11
- 1, 2 y 3
- 5, 10 y 15
= Son los únicos tres canales independientes en 2,4 GHz.

? ¿Qué gestiona un controlador inalámbrico?
+ La configuración, los canales y la potencia de todos los puntos de acceso
- Las direcciones MAC de los switches
- El correo de la empresa
= Centraliza la gestión de toda la red wifi.
:::

::: banco
? ¿Qué servidor comprueba los usuarios en una red wifi con 802.1X?
+ RADIUS
- DHCP
- DNS
= El AP o el controlador pregunta a RADIUS si el usuario es válido.

? ¿Por qué la red de invitados va separada?
+ Para que los invitados no lleguen a los equipos internos
- Para que tenga más velocidad
- Porque no necesita IP
= Se aísla en su propia VLAN y suele llevar un portal.

? ¿Qué es el roaming en una red wifi?
+ Pasar de un punto de acceso a otro sin perder la conexión
- Conectar desde otro país
- Compartir la contraseña
= El controlador y los estándares de itinerancia rápida lo facilitan.
:::

=== m7-nube | Redes en la nube: VPC, subredes y grupos de seguridad | 18 | 3
Cada vez más servidores están en la nube (AWS, Azure, Google Cloud). La red sigue existiendo, pero se configura con software.

## Los conceptos (los nombres cambian según el proveedor)

| Concepto | Qué es | Equivalente físico |
|---|---|---|
| **VPC / VNet** | Tu red privada en la nube, con un bloque de direcciones (por ejemplo 10.20.0.0/16) | La red de tu empresa |
| **Subred pública** | Subred con ruta a internet (internet gateway) | Una DMZ |
| **Subred privada** | Sin acceso directo desde internet; sale con una **NAT gateway** | La LAN interna |
| **Tabla de rutas** | Dónde se envía el tráfico de cada subred | La tabla de un router |
| **Grupo de seguridad** | Firewall con estado de cada servidor | Un firewall delante de cada equipo |
| **VPN o conexión dedicada** | Une la VPC con la oficina | Una WAN |

## Buenas prácticas

- Planifica el direccionamiento para que **no se solape** con el de las oficinas: si no, la VPN no funcionará.
- Bases de datos y servidores internos en **subredes privadas**.
- Grupos de seguridad con el **mínimo** de puertos y orígenes (nunca SSH abierto a todo internet).
- Varias **zonas de disponibilidad** para que una caída no tumbe el servicio.

::: quiz
? ¿Dónde pondrías una base de datos en una VPC?
+ En una subred privada, sin acceso directo desde internet
- En una subred pública
- Fuera de la VPC
= Solo debe recibir conexiones de los servidores de la aplicación.

? ¿Qué hace un grupo de seguridad?
+ Filtra el tráfico que entra y sale de cada servidor, como un firewall con estado
- Agrupa usuarios de Active Directory
- Hace copias de seguridad
= Se aplica a cada instancia o interfaz.

? ¿Por qué el bloque de direcciones de la VPC no debe solaparse con el de la oficina?
+ Porque al unirlas por VPN las rutas serían ambiguas y no funcionaría
- Porque la nube no admite IP privadas
- Porque gasta más dinero
= Dos redes con las mismas direcciones no se pueden enrutar entre sí.
:::

::: banco
? ¿Cómo sale a internet un servidor de una subred privada para descargar actualizaciones?
+ A través de una NAT gateway
- Directamente con su IP privada
- No puede salir nunca
= La NAT gateway permite salir sin aceptar conexiones de entrada.

? ¿Qué regla de un grupo de seguridad es peligrosa?
+ Permitir SSH (22) desde 0.0.0.0/0
- Permitir HTTPS (443) a un servidor web público
- Permitir el puerto de la base de datos solo desde la subred de la aplicación
= Exponer SSH a todo internet invita a ataques de fuerza bruta.

? ¿Para qué sirven las zonas de disponibilidad?
+ Para repartir los servidores en centros de datos distintos y tolerar una caída
- Para cobrar menos
- Para tener más direcciones IP
= Si una zona falla, la otra sigue dando servicio.
:::

=== m7-sdwan | SD-WAN y redundancia de la conexión | 14 | 3
Las empresas con muchas sucursales necesitan que todas tengan conexión fiable y barata. **SD-WAN** gestiona varias conexiones (fibra, cable, 4G/5G) desde un controlador central.

- **Varias líneas a la vez**: si una cae o va mal, el tráfico pasa a la otra en segundos.
- **Por aplicación**: la voz y el sistema de ventas van por la línea con menos latencia; las copias de seguridad, por la más barata.
- **Gestión centralizada**: una sucursal nueva se configura sola al conectar el equipo (*zero-touch*).
- **Seguridad**: túneles cifrados entre sedes y, a menudo, firewall integrado (lo que se conoce como **SASE** cuando se combina con seguridad en la nube).

## Redundancia en la LAN

Además de la WAN, se duplica lo crítico: dos switches de núcleo, enlaces agregados (EtherChannel), puertas de enlace redundantes (HSRP/VRRP) y fuentes de alimentación dobles.

::: quiz
? ¿Qué ventaja principal ofrece SD-WAN?
+ Usar varias conexiones y elegir la mejor para cada aplicación de forma automática
- Eliminar la necesidad de routers
- Que no haga falta internet
= Combina líneas distintas y reacciona a caídas y degradaciones.

? ¿Qué significa zero-touch en una sucursal SD-WAN?
+ Que el equipo se configura solo desde el controlador al conectarlo
- Que no se puede tocar el equipo
- Que no consume energía
= Basta con conectarlo; la configuración llega del controlador central.
:::

::: banco
? ¿Qué protocolo da una puerta de enlace redundante en la LAN?
+ HSRP o VRRP
- DHCP
- SNMP
= Dos routers comparten una IP virtual de puerta de enlace.

? ¿Qué es SASE?
+ La combinación de SD-WAN con servicios de seguridad en la nube
- Un tipo de cable de fibra
- Un protocolo de enrutamiento
= Secure Access Service Edge une red y seguridad como servicio.
:::

=== m7-monitoreo | Monitorizar la red: SNMP, NetFlow y alertas | 16 | 3
Una red bien administrada avisa **antes** de que los usuarios llamen. Para eso se monitoriza.

## Qué se monitoriza

- **Disponibilidad**: ¿responde cada equipo? (ping, SNMP).
- **Uso**: ancho de banda de los enlaces, CPU y memoria de los equipos.
- **Errores**: CRC, descartes, interfaces que suben y bajan.
- **Quién usa la red**: con **NetFlow / sFlow / IPFIX** se ve qué equipos y aplicaciones consumen el ancho de banda.
- **Registros**: Syslog centralizado, con la hora sincronizada por NTP.

## Herramientas

Zabbix, PRTG, LibreNMS, Grafana con Prometheus o las consolas de los fabricantes. Todas hacen lo mismo: recogen datos, dibujan gráficas y **alertan** (correo, mensaje, ticket automático) cuando algo cruza un umbral.

## SNMP

- **SNMPv2c** usa una «comunidad» (una contraseña que viaja en claro).
- **SNMPv3** añade autenticación y cifrado: es la que debe usarse.
- Nunca dejes la comunidad por defecto `public`.

::: quiz
? ¿Qué herramienta muestra qué equipos y aplicaciones consumen el ancho de banda?
+ NetFlow (o sFlow/IPFIX)
- ARP
- DHCP
= NetFlow resume las conversaciones que pasan por el equipo.

? ¿Qué versión de SNMP se debe usar?
+ SNMPv3, con autenticación y cifrado
- SNMPv1 con la comunidad public
- Ninguna, SNMP está prohibido
= v1 y v2c envían la comunidad en claro.

? ¿Para qué sirve sincronizar la hora con NTP en todos los equipos?
+ Para que los registros de distintos equipos se puedan comparar y ordenar
- Para que vaya más rápido internet
- Para ahorrar energía
= Sin hora común, reconstruir un incidente es casi imposible.
:::

::: banco
? ¿Qué ventaja tiene que la monitorización cree tickets automáticos?
+ Que los problemas se atienden antes de que los usuarios llamen
- Que ya no hacen falta técnicos
- Que los equipos no fallan
= Se detecta la caída o la degradación al momento.

? Una interfaz muestra miles de errores CRC. ¿Qué sospechas?
+ Un problema físico: cable, conector o dúplex mal negociado
- Un fallo de DNS
- Una contraseña incorrecta
= Los CRC indican tramas dañadas en la capa física o de enlace.

? ¿Qué es un umbral de alerta?
+ El valor a partir del cual la herramienta avisa (por ejemplo, CPU > 90 % durante 5 minutos)
- La velocidad máxima de un enlace
- El número de puertos de un switch
= Bien elegidos, evitan avisos inútiles y detectan problemas reales.
:::
