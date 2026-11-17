---
area: redes
id: m10
titulo: Fortinet: firewalls FortiGate
dominio: Fortinet · Nivel profesional
peso: 0
descripcion: El firewall que más se instala en empresas: FortiOS, políticas, NAT y VIP, rutas y SD-WAN, VPN IPsec, perfiles de seguridad, alta disponibilidad, diagnóstico con debug flow y la ruta de certificación de Fortinet.
---
=== m10-fortinet | Fortinet y FortiGate: por qué se usa tanto | 14 | 4
En la mayoría de las empresas, la red interna es de switches (muchas veces Cisco) y en la frontera con internet hay un **firewall**. Uno de los fabricantes de firewalls más instalados del mundo es **Fortinet**, con su equipo **FortiGate**: según la propia Fortinet, cerca de la mitad de los firewalls que se venden en el mundo son suyos. En América Latina se ve a diario en bancos, cadenas de tiendas, hospitales, universidades y proveedores de internet.

Por eso, después del CCNA, saber manejar un FortiGate es de lo que más se pide en las ofertas de **técnico de redes**, **administrador de firewalls** y **analista de seguridad perimetral**.

::: nota
Loopback no está afiliado a Fortinet. FortiGate, FortiOS y el resto de nombres «Forti» son marcas de Fortinet; aquí los usamos solo para enseñar a trabajar con sus equipos.
:::

## Las piezas que vas a oír nombrar

| Nombre | Qué es |
| --- | --- |
| **FortiGate** | El firewall de nueva generación (NGFW): filtra el tráfico, hace NAT, enruta, monta VPN y aplica perfiles de seguridad. Hay modelos físicos (40F, 60F, 100F…) y máquinas virtuales (FortiGate-VM) |
| **FortiOS** | El sistema operativo del FortiGate. Se maneja por una web (GUI) o por la línea de comandos (CLI) |
| **FortiGuard** | El servicio de suscripción que mantiene al día las firmas de antivirus, IPS, las categorías del filtro web y la reputación de IP |
| **FortiSwitch y FortiAP** | Switches y puntos de acceso wifi que se pueden administrar desde el propio FortiGate |
| **FortiAnalyzer** | Guarda y analiza los registros (logs) de uno o muchos FortiGate |
| **FortiManager** | Administra de forma centralizada decenas o cientos de FortiGate |
| **FortiClient** | El programa para las computadoras: VPN de acceso remoto y protección del equipo |

Fortinet llama **Security Fabric** a la idea de que todas estas piezas trabajen juntas y compartan información.

## Cisco y Fortinet en la misma red

No compiten en todo: es muy normal encontrar **switches Cisco** en la red interna y un **FortiGate** en la salida a internet y entre zonas. Lo que aprendiste en el CCNA sigue valiendo: VLAN, subredes, enrutamiento, NAT y ACL son los mismos conceptos. Cambia la forma de configurarlos.

| Concepto del CCNA | En Cisco IOS | En FortiGate |
| --- | --- | --- |
| Filtrar tráfico | ACL en una interfaz | **Política de firewall** entre una interfaz de entrada y una de salida |
| NAT de salida (PAT) | `ip nat inside source … overload` | Activar **NAT** en la política |
| Publicar un servidor | NAT estática | **VIP** (IP virtual) |
| Ruta por defecto | `ip route 0.0.0.0 0.0.0.0 …` | `config router static` |
| Guardar la configuración | `copy running-config startup-config` | Se guarda sola al terminar cada cambio |

::: quiz
? En una empresa típica, ¿dónde suele estar el FortiGate?
+ En la frontera con internet y entre zonas de la red (usuarios, servidores, invitados)
- Sustituyendo a todos los switches de acceso
- Solo en la casa del administrador
= El FortiGate es el firewall: controla lo que pasa entre zonas y hacia internet. Los switches siguen haciendo su trabajo dentro.

? ¿Qué es FortiOS?
+ El sistema operativo del FortiGate
- Un antivirus para celulares
- El nombre del cable de consola
= FortiOS es el software que corre en el FortiGate y se maneja por web o por CLI.

? ¿Para qué sirve la suscripción FortiGuard?
+ Para mantener al día las firmas de antivirus e IPS y las categorías del filtro web
- Para tener garantía física del equipo
- Para conectarse a internet
= Sin FortiGuard el equipo filtra igual por IP y puerto, pero sus protecciones avanzadas se quedan sin actualizar.

? ¿Qué equivale en FortiGate a una ACL de Cisco aplicada en una interfaz?
- Una VLAN
+ Una política de firewall entre una interfaz de entrada y una de salida
- Una ruta estática
= En FortiGate todo el tráfico que atraviesa el equipo tiene que coincidir con una política; si no, se descarta.
:::

::: banco
? ¿Qué producto de Fortinet guarda y analiza los registros de varios FortiGate?
+ FortiAnalyzer
- FortiAP
- FortiClient
= FortiAnalyzer centraliza los logs; FortiManager centraliza la configuración.

? ¿Qué producto se usa para administrar de forma centralizada cientos de FortiGate?
+ FortiManager
- FortiSwitch
- FortiGuard
= FortiManager envía configuraciones y actualizaciones a muchos equipos a la vez.

? ¿Qué nombre da Fortinet a la integración de FortiGate, FortiSwitch, FortiAP, FortiAnalyzer y FortiClient?
+ Security Fabric
- Spanning Tree
- Zero Touch
= El Security Fabric hace que las piezas compartan información y se administren juntas.
:::

=== m10-primer-acceso | Primer acceso: GUI, CLI e interfaces | 18 | 4
Un FortiGate se puede administrar de tres formas:

- **GUI**: la web del equipo, por HTTPS. Es lo más usado en el día a día.
- **CLI por consola**: con el cable de consola, como en un router Cisco. Imprescindible cuando no hay red.
- **CLI por SSH** o desde la consola que trae la propia GUI.

En un equipo nuevo, el usuario es `admin` **sin contraseña**, y FortiOS obliga a poner una al primer inicio de sesión. Muchos modelos de escritorio traen la IP `192.168.1.99` en la interfaz interna; una FortiGate-VM suele pedir su IP por DHCP en `port1`. Comprueba siempre la guía de tu modelo.

## Cómo se escribe en la CLI de FortiOS

La CLI de FortiOS no se parece a la de Cisco: todo se organiza en **bloques** que se abren con `config`, se editan con `edit` y se cierran con `next` y `end`.

| Comando | Qué hace |
| --- | --- |
| `config <tabla>` | Entra en una parte de la configuración (interfaces, políticas, rutas…) |
| `edit <nombre o número>` | Abre un elemento de esa tabla (o lo crea si no existe) |
| `set <opción> <valor>` | Cambia una opción |
| `unset <opción>` | Devuelve una opción a su valor por defecto |
| `next` | Guarda ese elemento y vuelve a la tabla |
| `end` | Guarda y sale del bloque |
| `abort` | Sale del bloque **sin** guardar los cambios |
| `show` / `show full-configuration` | Muestra la configuración (solo lo cambiado / todo) |
| `get` | Muestra estado y valores (`get system status`) |
| `diagnose` y `execute` | Diagnóstico y acciones (`execute ping`, `execute reboot`) |

::: cuidado
En FortiOS **no hay `copy running-config startup-config`**: cada cambio se aplica y se guarda al hacer `next` o `end`. Si te equivocas, no basta con reiniciar. Antes de un cambio importante, haz una copia de la configuración (en la GUI: menú del usuario → Configuration → Backup).
:::

## Configurar una interfaz

Así se da IP a la interfaz de la red interna y se decide **por qué protocolos se puede administrar** el equipo desde ella:

```fortios
config system global
    set hostname "FGT-Sede"
end
config system interface
    edit "port2"
        set alias "LAN"
        set mode static
        set ip 10.0.1.1 255.255.255.0
        set allowaccess ping https ssh
        set role lan
    next
end
```

`allowaccess` es una lista: pon solo lo que necesitas. En la interfaz de internet (WAN), **nunca** dejes `https`, `ssh` ni `http` abiertos al mundo: es la puerta por la que han entrado muchos ataques reales a firewalls de todas las marcas.

## Comprobar

```fortios
get system status
get system interface physical
show system interface port2
```

`get system status` dice el modelo, el número de serie y la **versión de FortiOS**, lo primero que pide soporte cuando hay un problema.

::: nota
Para limitar aún más quién administra el equipo, cada usuario administrador puede tener **hosts de confianza** (`config system admin` → `edit admin` → `set trusthost1 10.0.1.0 255.255.255.0`): fuera de esas redes, ni siquiera se puede intentar el inicio de sesión.
:::

::: quiz
? Acabas de cambiar varias opciones dentro de `config system interface` y te das cuenta de que te equivocaste. ¿Qué escribes para salir sin guardar?
+ `abort`
- `end`
- `next`
= `next` y `end` guardan; `abort` sale del bloque descartando los cambios.

? ¿Qué hace falta en FortiOS para guardar la configuración en la memoria de arranque?
+ Nada: los cambios se guardan al hacer `next` o `end`
- `copy running-config startup-config`
- `write memory`
= Por eso conviene hacer una copia de seguridad antes de un cambio importante.

? ¿Qué opción decide por qué protocolos se puede administrar el FortiGate desde una interfaz?
+ `allowaccess`
- `role`
- `alias`
= Por ejemplo `set allowaccess ping https ssh`. En la WAN no debe estar la administración abierta.

? ¿Qué comando muestra el modelo, el número de serie y la versión de FortiOS?
- `show full-configuration`
+ `get system status`
- `execute ping`
= Es lo primero que conviene anotar en cualquier ticket.
:::

::: banco
? ¿Qué diferencia hay entre `show` y `show full-configuration`?
+ `show` muestra solo lo que se ha cambiado; `show full-configuration` muestra también los valores por defecto
- Ninguna
- `show` borra la configuración
= Con `show` la salida es más corta y se ve lo que configuró alguien.

? ¿Qué riesgo tiene dejar `https` y `ssh` en el `allowaccess` de la interfaz de internet?
+ Que cualquiera en internet pueda intentar entrar a la administración del firewall
- Ninguno, porque hay contraseña
- Que internet vaya más lento
= Las interfaces de administración expuestas son uno de los vectores de ataque más comunes contra firewalls.

? ¿Con qué palabra se abre un elemento dentro de una tabla de configuración de FortiOS?
+ `edit`
- `interface`
- `enable`
= Por ejemplo `config system interface` y después `edit "port2"`.
:::

=== m10-politicas | Políticas de firewall y objetos | 20 | 4
En un FortiGate, **todo el tráfico que atraviesa el equipo tiene que coincidir con una política**. Si ninguna coincide, se descarta: es la **política implícita de denegación**, que FortiOS llama **policy 0**.

Una política dice:

| Campo | Pregunta que responde | Ejemplo |
| --- | --- | --- |
| `srcintf` | ¿Por qué interfaz entra? | `port2` (LAN) |
| `dstintf` | ¿Por qué interfaz sale? | `port1` (WAN) |
| `srcaddr` | ¿Desde qué direcciones? | `RED-LAN` |
| `dstaddr` | ¿Hacia qué direcciones? | `all` |
| `service` | ¿Qué servicios o puertos? | `HTTP`, `HTTPS`, `DNS` |
| `schedule` | ¿Cuándo? | `always` |
| `action` | ¿Qué se hace? | `accept` o `deny` |

Las políticas son **con estado**: si permites que la LAN salga a internet, las respuestas vuelven solas. No hace falta una política «de vuelta».

## Objetos: nombres en vez de números

En lugar de escribir IP en cada política, se crean **objetos de dirección** y **grupos**. Si mañana cambia la IP del servidor, se cambia en un sitio y todas las políticas quedan bien.

```fortios
config firewall address
    edit "RED-LAN"
        set subnet 10.0.1.0 255.255.255.0
    next
    edit "SRV-WEB"
        set subnet 10.0.10.10 255.255.255.255
    next
end
```

## Una política de salida a internet

```fortios
config firewall policy
    edit 1
        set name "LAN-a-Internet"
        set srcintf "port2"
        set dstintf "port1"
        set srcaddr "RED-LAN"
        set dstaddr "all"
        set service "HTTP" "HTTPS" "DNS"
        set schedule "always"
        set action accept
        set nat enable
        set logtraffic all
    next
end
```

## El orden importa (y el número no es el orden)

Las políticas se evalúan **de arriba abajo** y se aplica **la primera que coincide**, como en un firewall cualquiera. La trampa de FortiGate: el **número** de la política (`edit 1`, `edit 7`) es solo un identificador, **no su posición**. Una política nueva se añade al final de la lista aunque tenga un número bajo. Para colocarla:

```fortios
config firewall policy
    move 7 before 1
end
```

::: cuidado
Si una política general (por ejemplo, «LAN a todo, denegar») queda **encima** de una concreta («LAN al servidor web, permitir»), la concreta nunca se usará. Reglas concretas arriba, generales abajo.
:::

## Zonas

Si tienes varias interfaces con la misma función (por ejemplo, tres VLAN de usuarios), puedes agruparlas en una **zona** y escribir las políticas contra la zona: menos políticas y menos errores.

::: quiz
? Un equipo de la LAN intenta salir por un puerto que ninguna política permite. ¿Qué pasa?
+ Se descarta por la política implícita de denegación (policy 0)
- Pasa, porque por defecto todo está permitido
- El FortiGate se reinicia
= Lo que no está permitido explícitamente se bloquea.

? Creas la política con `edit 2` y en la lista ya había políticas 5, 8 y 9. ¿Dónde queda la nueva?
- Arriba del todo, porque su número es el más bajo
+ Al final de la lista, hasta que la muevas
- En medio, ordenada por número
= El número es un identificador; la posición se cambia con `move`.

? Permites que la LAN navegue hacia internet. ¿Hace falta otra política para que vuelvan las respuestas?
+ No: las políticas son con estado y el tráfico de vuelta de una sesión permitida pasa solo
- Sí, una de WAN a LAN que lo permita todo
- Sí, una por cada página web
= El firewall recuerda la sesión y deja volver sus respuestas.

? ¿Para qué sirve crear un objeto de dirección como `SRV-WEB`?
+ Para usar un nombre en las políticas y cambiar la IP en un solo sitio
- Para que el servidor tenga internet más rápido
- Es obligatorio para hacer ping
= Los objetos hacen las políticas más legibles y fáciles de mantener.
:::

::: banco
? ¿Qué comando coloca la política 7 por encima de la 1?
+ `move 7 before 1` dentro de `config firewall policy`
- `set position 1`
- `edit 1` y `rename 7`
= `move` cambia la posición en la lista, que es lo que decide qué se evalúa primero.

? ¿Qué campo de una política indica por qué interfaz entra el tráfico?
+ `srcintf`
- `dstaddr`
- `schedule`
= `srcintf` es la interfaz de entrada y `dstintf` la de salida.

? ¿Para qué se agrupan varias interfaces en una zona?
+ Para escribir una sola política para todas ellas
- Para que tengan la misma IP
- Para apagarlas a la vez
= Con zonas hay menos políticas que mantener.
:::

=== m10-nat | NAT en FortiGate: salida a internet y VIP | 18 | 4
[[anim:nat]]

Lo que aprendiste de NAT en el CCNA se aplica igual: las IP privadas no salen a internet y hay que traducirlas.

## NAT de salida (lo que en Cisco es PAT u overload)

En una política hacia internet, `set nat enable` hace que todos los equipos salgan con **la IP de la interfaz de salida**, cambiando el puerto de origen para distinguirlos. Es lo que necesitan casi todas las oficinas.

Si el proveedor te da un bloque de IP públicas y quieres salir con otra distinta de la de la interfaz, se crea un **IP pool** y se indica en la política:

```fortios
config firewall ippool
    edit "POOL-SALIDA"
        set type overload
        set startip 203.0.113.20
        set endip 203.0.113.20
    next
end
config firewall policy
    edit 1
        set nat enable
        set ippool enable
        set poolname "POOL-SALIDA"
    next
end
```

## Publicar un servidor: la VIP

Para que desde internet se llegue a un servidor interno se usa una **VIP (IP virtual)**: traduce la IP pública de destino a la IP privada del servidor. Es la NAT estática del CCNA.

```fortios
config firewall vip
    edit "VIP-WEB"
        set extip 203.0.113.10
        set extintf "port1"
        set mappedip "10.0.10.10"
        set portforward enable
        set protocol tcp
        set extport 443
        set mappedport 443
    next
end
```

Con `portforward` solo se publica el puerto 443; sin él, la VIP traduce todos los puertos, y casi nunca es lo que quieres.

**La VIP sola no deja pasar nada.** Hace falta una política de la WAN hacia la zona del servidor cuyo **destino sea la VIP**:

```fortios
config firewall policy
    edit 20
        set name "Internet-a-Web"
        set srcintf "port1"
        set dstintf "port3"
        set srcaddr "all"
        set dstaddr "VIP-WEB"
        set service "HTTPS"
        set schedule "always"
        set action accept
        set logtraffic all
    next
end
```

::: cuidado
Publica **solo** el puerto que el servicio necesita y pon el servidor en una **DMZ** (`port3` en el ejemplo), nunca en la LAN de los usuarios. Si alguien lo compromete, no entra directamente en la red de la empresa.
:::

::: nota
FortiOS tiene también un modo llamado **Central NAT**, en el que las reglas de NAT se escriben en una tabla aparte en lugar de dentro de cada política. Lo verás en empresas grandes; los conceptos son los mismos.
:::

::: quiz
? ¿Qué hace `set nat enable` en una política de la LAN hacia internet?
+ Que los equipos salgan con la IP de la interfaz de salida, distinguidos por el puerto
- Que el FortiGate deje de enrutar
- Que se publique un servidor
= Es el equivalente al PAT (overload) de Cisco.

? Creaste la VIP del servidor web, pero desde internet no se llega. ¿Qué es lo más probable que falte?
+ Una política de la WAN hacia la zona del servidor con destino la VIP
- Reiniciar el FortiGate
- Una ruta por defecto en el servidor de internet
= La VIP traduce, pero todo el tráfico necesita además una política que lo permita.

? ¿Qué objeto de FortiGate equivale a la NAT estática para publicar un servidor?
- IP pool
+ VIP (IP virtual)
- Zona
= La VIP traduce la IP pública de destino a la IP privada del servidor.

? ¿Por qué conviene activar `portforward` en la VIP?
+ Para publicar solo el puerto que el servicio necesita
- Para que la VIP sea más rápida
- Porque sin él no se puede usar HTTPS
= Sin `portforward`, la VIP traduce todos los puertos hacia el servidor.
:::

::: banco
? ¿Para qué se usa un IP pool en FortiGate?
+ Para que el tráfico de salida use una IP pública distinta de la de la interfaz
- Para dar IP por DHCP
- Para guardar copias de la configuración
= Se indica en la política con `set ippool enable` y `set poolname`.

? ¿Dónde debe estar un servidor publicado en internet?
+ En una DMZ, separada de la LAN de los usuarios
- En la LAN de los usuarios, para que vaya más rápido
- Conectado directamente al módem, sin firewall
= La DMZ limita el daño si el servidor es atacado.
:::

=== m10-rutas-sdwan | Rutas y SD-WAN con dos proveedores | 20 | 4
Un FortiGate es también un router: necesita saber por dónde mandar cada paquete.

## Ruta por defecto

```fortios
config router static
    edit 1
        set gateway 203.0.113.1
        set device "port1"
    next
end
```

Sin `set dst`, la ruta es hacia `0.0.0.0/0`: la ruta por defecto. Para ver la tabla de rutas:

```fortios
get router info routing-table all
```

## Distancia y prioridad

Igual que en Cisco, la **distancia administrativa** decide qué ruta entra en la tabla cuando hay dos hacia el mismo destino. FortiOS añade la **prioridad**: si dos rutas tienen la misma distancia, las dos entran en la tabla y se prefiere la de **menor prioridad**. Así se tiene una ruta de respaldo lista.

::: examen
Un detalle que confunde a todos al principio: en FortiGate **la búsqueda de ruta forma parte de la búsqueda de política**. La interfaz de salida (`dstintf`) de la política tiene que coincidir con la interfaz por la que va la ruta hacia ese destino. Si la ruta dice «por `port1`» y la política es hacia `port4`, la política no coincide y el tráfico cae en la policy 0.
:::

## SD-WAN: dos proveedores, una sola salida

Muchas empresas contratan dos conexiones a internet (por ejemplo, fibra y otra de respaldo). Con **SD-WAN**, el FortiGate las trata como un solo grupo y decide por cuál mandar cada tráfico, midiendo su calidad.

Las piezas:

- **Miembros**: las interfaces de cada proveedor (`wan1`, `wan2`).
- **Zona SD-WAN**: el grupo al que pertenecen (por defecto, `virtual-wan-link`). Las políticas y la ruta por defecto apuntan a la zona, no a cada interfaz.
- **Health check (SLA de rendimiento)**: pruebas continuas (por ejemplo, ping a dos servidores públicos) que miden **latencia, jitter y pérdida** en cada enlace.
- **Reglas**: deciden qué enlace usa cada tráfico. Por ejemplo, las videollamadas por el de menor latencia y las copias de seguridad por el más barato.

```fortios
config system sdwan
    set status enable
    config members
        edit 1
            set interface "wan1"
            set gateway 203.0.113.1
        next
        edit 2
            set interface "wan2"
            set gateway 198.51.100.1
        next
    end
    config health-check
        edit "Internet"
            set server "8.8.8.8" "1.1.1.1"
            set members 1 2
        next
    end
end
config router static
    edit 1
        set sdwan-zone "virtual-wan-link"
    next
end
```

Si la fibra empieza a perder paquetes, el health check lo detecta y el tráfico pasa al otro enlace **sin que los usuarios hagan nada**.

::: nota
La sintaxis de SD-WAN cambió entre versiones de FortiOS (en las antiguas se llamaba `virtual-wan-link`). Lo de arriba corresponde a FortiOS 7. Antes de copiar una configuración de internet, mira la versión del equipo con `get system status`.
:::

::: quiz
? ¿Qué ruta crea `config router static` → `edit 1` → `set gateway 203.0.113.1` → `set device "port1"`, sin `set dst`?
+ Una ruta por defecto (0.0.0.0/0) por port1
- Una ruta solo hacia 203.0.113.0/24
- Ninguna, falta el destino
= Sin destino, FortiOS usa 0.0.0.0/0.

? Dos rutas por defecto con la misma distancia y prioridades 1 y 10. ¿Cuál se usa?
+ La de prioridad 1
- La de prioridad 10
- Las dos por igual, siempre
= Con la misma distancia, las dos entran en la tabla y se prefiere la de menor prioridad.

? ¿Qué mide un health check de SD-WAN?
+ La latencia, el jitter y la pérdida de cada enlace
- La temperatura del equipo
- Cuántos usuarios hay conectados
= Con esas medidas el FortiGate decide por qué enlace mandar cada tráfico.

? La política es de `port2` hacia `port4`, pero la ruta hacia ese destino sale por `port1`. ¿Qué pasa?
+ La política no coincide y el tráfico cae en la policy 0
- El tráfico sale por port4 igualmente
- El FortiGate crea la ruta que falta
= La interfaz de salida de la política tiene que coincidir con la de la ruta.
:::

::: banco
? ¿A qué apuntan la ruta por defecto y las políticas cuando se usa SD-WAN?
+ A la zona SD-WAN, no a cada interfaz por separado
- A la IP del proveedor principal
- A la interfaz de la LAN
= Así el FortiGate puede elegir el enlace en cada momento.

? ¿Qué comando muestra la tabla de rutas de un FortiGate?
+ `get router info routing-table all`
- `show ip route`
- `diagnose sniffer packet`
= `show ip route` es de Cisco IOS.

? La fibra de la oficina empieza a perder paquetes. ¿Qué hace SD-WAN con un health check configurado?
+ Pasa el tráfico al otro enlace automáticamente
- Apaga el FortiGate
- Nada hasta que alguien cambie la ruta a mano
= Esa es la gracia de SD-WAN: decidir según la calidad medida.
:::

=== m10-vpn | VPN IPsec entre sedes y acceso remoto | 20 | 4
## Unir dos sedes

Una VPN IPsec entre dos FortiGate se monta en dos fases, como viste en el CCNA:

- **Fase 1 (IKE)**: los dos equipos se autentican (con una clave compartida o certificados) y crean un canal seguro.
- **Fase 2 (IPsec)**: acuerdan qué redes viajan por el túnel y cómo se cifran.

La GUI tiene un **asistente** (VPN → IPsec Wizard) que lo crea todo. Esto es lo que genera, para que sepas leerlo:

```fortios
config vpn ipsec phase1-interface
    edit "A-Sucursal"
        set interface "wan1"
        set ike-version 2
        set peertype any
        set proposal aes256-sha256
        set remote-gw 198.51.100.20
        set psksecret <una clave larga y aleatoria>
    next
end
config vpn ipsec phase2-interface
    edit "A-Sucursal"
        set phase1name "A-Sucursal"
        set proposal aes256-sha256
        set src-subnet 10.0.1.0 255.255.255.0
        set dst-subnet 10.2.1.0 255.255.255.0
    next
end
```

En FortiGate el túnel es **una interfaz más** (`A-Sucursal`). Por eso, además del túnel, hacen falta:

1. Una **ruta** hacia la red de la otra sede por la interfaz del túnel.
2. **Políticas** de la LAN al túnel y del túnel a la LAN (sin NAT: entre sedes se ven con sus IP privadas).

```fortios
config router static
    edit 5
        set dst 10.2.1.0 255.255.255.0
        set device "A-Sucursal"
    next
    edit 6
        set dst 10.2.1.0 255.255.255.0
        set blackhole enable
        set distance 254
    next
end
```

La segunda ruta es un truco de buena práctica: si el túnel se cae, el tráfico hacia la sucursal se descarta en lugar de salir **sin cifrar** por la ruta por defecto hacia internet.

## Ver si el túnel está arriba

```fortios
get vpn ipsec tunnel summary
diagnose vpn ike gateway list
diagnose vpn tunnel list
```

Si la fase 1 no sube, revisa la clave, las propuestas de cifrado y que los dos lados se alcancen por internet. Si sube la fase 1 pero no pasa tráfico, revisa las redes de la fase 2, la ruta y las políticas.

## Acceso remoto para empleados

Los empleados que trabajan desde casa se conectan con **FortiClient**. Durante años se usó sobre todo la **VPN SSL**, pero Fortinet está pasando el acceso remoto a **IPsec (IKEv2)** y a **ZTNA** (acceso a cada aplicación según quién eres y en qué estado está tu equipo): en las versiones más recientes de FortiOS el modo túnel de la VPN SSL ya no está disponible.

::: cuidado
Las VPN de acceso remoto de **todas** las marcas son uno de los objetivos favoritos de los atacantes, y FortiOS ha tenido vulnerabilidades graves en su VPN SSL. Tres reglas que no se negocian: **firmware al día** (sigue los avisos de seguridad de Fortinet), **segundo factor** para todos los usuarios de VPN y **la administración nunca expuesta a internet**.
:::

::: quiz
? El túnel entre sedes está arriba, pero los equipos de una sede no llegan a los de la otra. ¿Qué revisas primero?
+ La ruta hacia la red remota por la interfaz del túnel y las políticas en los dos sentidos
- El cable de consola
- La contraseña del administrador
= En FortiGate el túnel es una interfaz: necesita ruta y políticas como cualquier otra.

? ¿Para qué sirve la ruta `blackhole` con distancia 254 hacia la red de la sucursal?
+ Para que, si el túnel se cae, ese tráfico se descarte en vez de salir sin cifrar por internet
- Para que el túnel vaya más rápido
- Para bloquear la sucursal
= Mientras el túnel está arriba, su ruta (con distancia menor) es la que se usa.

? ¿Qué se negocia en la fase 2 de IPsec?
+ Qué redes viajan por el túnel y cómo se cifran
- La dirección MAC de los equipos
- La contraseña del wifi
= La fase 1 crea el canal seguro entre los equipos; la fase 2, los túneles para los datos.

? ¿Qué medidas no pueden faltar en una VPN de acceso remoto?
+ Firmware al día, segundo factor y administración no expuesta a internet
- Una contraseña corta para que la recuerden
- Permitir todo el tráfico del túnel a todas las redes
= Las VPN de acceso remoto son un objetivo habitual de los atacantes.
:::

::: banco
? ¿Hace falta NAT en las políticas entre la LAN y un túnel hacia otra sede?
+ No: entre sedes los equipos se ven con sus IP privadas
- Sí, siempre
- Solo si el túnel usa IKEv1
= La NAT se usa hacia internet, no entre las redes privadas de la misma empresa.

? ¿Qué comando da un resumen del estado de los túneles IPsec?
+ `get vpn ipsec tunnel summary`
- `show ip interface brief`
- `get system status`
= También sirven `diagnose vpn ike gateway list` y `diagnose vpn tunnel list`.

? ¿Con qué programa se conectan a la VPN los empleados que trabajan desde casa?
+ FortiClient
- FortiAnalyzer
- FortiSwitch
= FortiClient es el cliente de VPN para las computadoras.
:::

=== m10-perfiles | Perfiles de seguridad e inspección SSL | 18 | 4
Filtrar por IP y puerto ya no basta: casi todo viaja por el puerto 443. Lo que convierte un FortiGate en un firewall de nueva generación son los **perfiles de seguridad**, que se añaden a una política.

| Perfil | Qué hace |
| --- | --- |
| **AntiVirus** | Analiza los archivos que se descargan y bloquea el malware conocido |
| **Web Filter** | Bloquea páginas por **categoría** (apuestas, contenido para adultos, malware, phishing…) |
| **DNS Filter** | Bloquea dominios peligrosos ya en la consulta DNS |
| **Application Control** | Reconoce aplicaciones (redes sociales, juegos, P2P…) aunque usen el puerto 443 |
| **IPS** | Detecta y bloquea ataques conocidos contra servidores y equipos |
| **File Filter** | Bloquea tipos de archivo (por ejemplo, ejecutables descargados) |

Las firmas y categorías se actualizan con **FortiGuard**; sin licencia, se quedan antiguas.

```fortios
config firewall policy
    edit 1
        set utm-status enable
        set ssl-ssh-profile "certificate-inspection"
        set av-profile "default"
        set webfilter-profile "default"
        set application-list "default"
        set ips-sensor "default"
    next
end
```

## El problema del HTTPS: la inspección SSL

Si el tráfico está cifrado, el firewall no puede ver lo que hay dentro. FortiGate tiene dos perfiles de inspección:

| | Certificate inspection | Deep inspection |
| --- | --- | --- |
| Qué ve | El nombre del sitio (SNI) y su certificado | Todo el contenido, porque descifra y vuelve a cifrar |
| Sirve para | Filtrar webs por categoría y aplicaciones básicas | Antivirus, IPS y control fino del contenido |
| Qué hace falta | Nada en los equipos | Instalar el **certificado de la CA del FortiGate** en todas las computadoras |
| Riesgos | Ninguno especial | Privacidad de los empleados; hay que excluir bancos, salud, etc. |

::: cuidado
La inspección profunda descifra conversaciones privadas. Antes de activarla, la empresa debe tener una **política de uso aceptable** que lo explique, excluir categorías sensibles (banca, salud) y respetar la ley del país. Técnicamente es fácil; organizativamente, no.
:::

## Flujo o proxy

Los perfiles pueden trabajar en modo **flow** (analiza el tráfico al vuelo, más rápido; es el modo por defecto) o **proxy** (guarda el archivo completo antes de dejarlo pasar: más lento, más minucioso). Si los usuarios se quejan de lentitud después de activar perfiles, es una de las primeras cosas que se revisan.

::: quiz
? Quieres bloquear las páginas de apuestas sin instalar nada en las computadoras. ¿Qué usas?
+ Web Filter por categorías con certificate inspection
- Deep inspection obligatoriamente
- Una VIP
= Para filtrar por categoría basta con ver el nombre del sitio, que no necesita descifrar.

? ¿Qué hace falta para usar deep inspection sin que los navegadores den errores de certificado?
+ Instalar el certificado de la CA del FortiGate en las computadoras
- Apagar el antivirus de los equipos
- Cambiar el DNS a 8.8.8.8
= El FortiGate vuelve a firmar los sitios con su CA; los equipos tienen que confiar en ella.

? ¿Qué perfil reconoce aplicaciones aunque usen el puerto 443?
+ Application Control
- DNS Filter
- File Filter
= Identifica la aplicación por su comportamiento, no por el puerto.

? ¿Qué pasa con los perfiles si la licencia de FortiGuard vence?
+ Siguen funcionando, pero sus firmas y categorías dejan de actualizarse
- El FortiGate deja de enrutar
- Se borran las políticas
= Un antivirus o un IPS sin actualizar no detecta las amenazas nuevas.
:::

::: banco
? ¿Qué diferencia hay entre el modo flow y el modo proxy?
+ Flow analiza al vuelo y es más rápido; proxy guarda el archivo completo y es más minucioso
- Ninguna
- Proxy solo sirve para IPv6
= El modo por defecto es flow.

? ¿Qué categorías conviene excluir de la inspección profunda?
+ Banca y salud, entre otras sensibles
- Ninguna
- Solo los buscadores
= Por privacidad y porque algunas aplicaciones no aceptan que se descifre su tráfico.

? ¿Qué perfil bloquea dominios peligrosos ya en la consulta DNS?
+ DNS Filter
- IPS
- AntiVirus
= Es una de las protecciones más baratas y efectivas.
:::

=== m10-ha-fabric | Alta disponibilidad y Security Fabric | 16 | 4
## Dos FortiGate, un solo firewall

Si el firewall se apaga, la empresa se queda sin internet y sin VPN. Por eso en las sedes importantes se instalan **dos FortiGate en clúster** con el protocolo **FGCP**:

- Tienen que ser **del mismo modelo** y con **la misma versión de FortiOS**.
- Se unen por uno o dos cables de **heartbeat** (latido), por los que se vigilan y sincronizan la configuración.
- **Activo-pasivo (a-p)**: uno trabaja y el otro espera, listo para tomar el control. Es lo más común.
- **Activo-activo (a-a)**: los dos procesan parte del tráfico de inspección.

```fortios
config system ha
    set group-name "SEDE-HA"
    set mode a-p
    set password <una clave larga>
    set hbdev "ha1" 50 "ha2" 50
    set session-pickup enable
    set priority 200
end
```

- `priority`: el de prioridad más alta suele ser el principal.
- `session-pickup`: las conexiones abiertas sobreviven al cambio de equipo (las llamadas y descargas no se cortan).
- La configuración se hace **solo en el principal**: se copia sola al secundario.

```fortios
get system ha status
```

::: cuidado
Pon los dos cables de heartbeat por caminos distintos. Si se corta el único que hay, cada equipo cree que el otro murió y los dos intentan ser el principal a la vez (**split brain**): la red se vuelve inestable.
:::

## Security Fabric: un solo panel

Con **FortiLink**, el FortiGate administra **FortiSwitch** y **FortiAP** como si fueran parte de él: las VLAN, los puertos y el wifi se configuran desde la misma pantalla. **FortiAnalyzer** recibe los registros de todos los equipos y genera informes; **FortiManager** administra muchos FortiGate a la vez, algo típico en cadenas de tiendas o bancos con decenas de sucursales.

En la práctica encontrarás de todo: empresas «todo Fortinet» y empresas con switches Cisco y FortiGate en la frontera. Lo importante es entender qué hace cada pieza.

::: quiz
? ¿Qué requisito tienen los dos FortiGate de un clúster FGCP?
+ Mismo modelo y misma versión de FortiOS
- Distinto modelo, para que uno sea más rápido
- Estar en ciudades distintas
= Si no coinciden, el clúster no se forma.

? ¿Para qué sirve `session-pickup`?
+ Para que las conexiones abiertas no se corten al pasar al otro equipo
- Para cambiar la contraseña del administrador
- Para recoger los logs
= Sin él, al fallar el principal, los usuarios tendrían que volver a conectarse.

? ¿Dónde se hacen los cambios de configuración en un clúster activo-pasivo?
+ En el equipo principal: se sincronizan solos con el secundario
- En los dos, uno por uno
- Solo en el secundario
= El heartbeat también sirve para sincronizar la configuración.

? ¿Qué es el split brain en un clúster?
+ Los dos equipos creen que el otro ha fallado y actúan como principal a la vez
- Un ataque de phishing
- Una ruta por defecto duplicada
= Se evita con dos enlaces de heartbeat por caminos distintos.
:::

::: banco
? ¿Qué es FortiLink?
+ La forma en que el FortiGate administra FortiSwitch y FortiAP como parte de sí mismo
- Un cable de consola
- Un tipo de VPN
= Con FortiLink, VLAN, puertos y wifi se configuran desde el FortiGate.

? ¿Qué comando muestra el estado del clúster HA?
+ `get system ha status`
- `show ip route`
- `execute reboot`
= Indica qué equipo es el principal y si están sincronizados.

? ¿Cuál es el modo HA más común?
+ Activo-pasivo
- Activo-activo con cuatro equipos
- Sin heartbeat
= Uno trabaja y el otro espera para tomar el control.
:::

=== m10-diagnostico | Diagnóstico: sniffer y debug flow | 22 | 4
Cuando «no llega» algo a través de un FortiGate, el método es el mismo que aprendiste en redes, pero con dos herramientas que hacen de FortiGate un equipo muy fácil de diagnosticar.

## 1. Lo básico

```fortios
get system status
get system interface physical
get router info routing-table all
execute ping 10.0.10.10
execute traceroute 8.8.8.8
```

¿Están arriba las interfaces? ¿Hay ruta hacia el destino? ¿El FortiGate llega al destino?

## 2. El sniffer: ¿llega el paquete?

```fortios
diagnose sniffer packet any 'host 10.0.1.25 and icmp' 4
```

- `any`: todas las interfaces (o pon una: `port2`).
- El filtro usa la misma sintaxis que tcpdump o Wireshark.
- El `4` muestra también **por qué interfaz** entra y sale cada paquete.

Si ves el paquete **entrar** por la LAN pero **no salir** por la WAN, el problema está en el FortiGate (política, ruta o NAT). Si ni siquiera entra, el problema está antes: el equipo, el switch o la VLAN.

## 3. Debug flow: ¿por qué lo descarta?

Es la herramienta estrella: el FortiGate te cuenta paso a paso qué hace con el paquete.

```fortios
diagnose debug reset
diagnose debug flow filter addr 10.0.1.25
diagnose debug flow show function-name enable
diagnose debug console timestamp enable
diagnose debug flow trace start 20
diagnose debug enable
```

Ahora repite la prueba (el ping o la página que falla) y lee los mensajes. Los más habituales:

| Mensaje | Qué significa |
| --- | --- |
| `Denied by forward policy check (policy 0)` | Ninguna política coincide: falta una política, o la que hay tiene mal la interfaz, la dirección o el servicio |
| `reverse path check fail, drop` | No hay ruta de vuelta hacia el origen por la interfaz por la que entró (comprobación de ruta inversa) |
| `Allowed by Policy-5` | Lo permite la política 5: si sigue sin funcionar, mira más allá del FortiGate |
| `find a route: … via port1` | La ruta que ha elegido |

Al terminar, **apágalo siempre**:

```fortios
diagnose debug disable
diagnose debug reset
```

::: cuidado
El debug consume CPU. En un firewall con mucho tráfico, filtra siempre por una dirección y limita el número de paquetes (`trace start 20`). Nunca lo dejes activo y te vayas.
:::

## Un caso típico

> «Desde la LAN no se abre la web del servidor de la DMZ.»

1. `execute ping 10.0.10.10` desde el FortiGate: responde. El servidor está vivo.
2. Sniffer con `host 10.0.10.10`: el paquete entra por `port2`, pero no sale por `port3`.
3. Debug flow: `Denied by forward policy check (policy 0)`.
4. En las políticas hay una de `port2` a `port3`… con el servicio `HTTP`, y la web usa `HTTPS`. Se añade `HTTPS` a la política.
5. Se repite la prueba: `Allowed by Policy-12`. La web abre. Se documenta en el ticket.

::: quiz
? El debug flow muestra `Denied by forward policy check (policy 0)`. ¿Qué significa?
+ Que ninguna política permite ese tráfico
- Que el servidor está apagado
- Que el cable está roto
= Hay que revisar las políticas: interfaces, direcciones, servicio y orden.

? Con el sniffer ves que el paquete entra por la LAN pero no sale por la WAN. ¿Dónde está el problema?
+ En el FortiGate: política, ruta o NAT
- En el equipo del usuario
- En el switch de acceso
= Si entra y no sale, lo ha descartado o desviado el firewall.

? ¿Qué indica `reverse path check fail, drop`?
+ Que no hay ruta de vuelta hacia el origen por la interfaz por la que entró
- Que falta una VIP
- Que la licencia ha vencido
= Suele pasar cuando falta una ruta hacia una red interna.

? ¿Qué debes hacer siempre al terminar un debug flow?
+ `diagnose debug disable` y `diagnose debug reset`
- Reiniciar el FortiGate
- Borrar las políticas
= El debug consume CPU y no se debe quedar activo.
:::

::: banco
? ¿Qué muestra el nivel 4 del sniffer (`diagnose sniffer packet any '…' 4`)?
+ Los paquetes y por qué interfaz entra y sale cada uno
- Solo el número de paquetes
- La configuración completa
= Saber la interfaz es clave para ver dónde se pierde el tráfico.

? ¿Por qué se filtra el debug flow por una dirección (`flow filter addr`)?
+ Para ver solo el tráfico que te interesa y no cargar la CPU
- Porque sin filtro no funciona
- Para ocultar el tráfico a otros administradores
= En un equipo con mucho tráfico, sin filtro saldrían miles de líneas.

? La web del servidor no abre y el debug flow muestra `Allowed by Policy-5`. ¿Qué haces?
+ Buscar el problema más allá del FortiGate: el servidor, su servicio o su firewall local
- Borrar la política 5
- Desactivar el debug y dejarlo así
= Si el FortiGate lo permite, el problema está en otra parte.
:::

=== m10-certificacion | Certificaciones Fortinet y tu laboratorio en casa | 12 | 4
## La ruta de certificación

Fortinet renovó su programa de certificaciones (antes se llamaban NSE 1 a 8). Hoy tiene estos niveles, de menos a más:

| Nivel | Para quién |
| --- | --- |
| **FCF** · Fortinet Certified Fundamentals | Quien empieza en ciberseguridad |
| **FCA** · Fortinet Certified Associate | Quien opera un FortiGate en el día a día |
| **FCP** · Fortinet Certified Professional (por ejemplo, Network Security) | Quien administra y diagnostica FortiGate: la que más piden las ofertas de empleo |
| **FCSS** · Fortinet Certified Solution Specialist | Diseño de soluciones avanzadas |
| **FCX** · Fortinet Certified Expert | El nivel máximo, con examen práctico |

Los requisitos, los exámenes y los precios cambian con el tiempo: consúltalos siempre en el sitio oficial de Fortinet antes de pagar. Muchos cursos a tu ritmo de **Fortinet Training Institute** son gratuitos; lo que se paga es el examen.

::: examen
Una combinación muy valorada en América Latina: **CCNA** (redes) + **FCP Network Security** (firewall). Con las dos, puedes optar a puestos de técnico de redes, administrador de firewalls y seguridad perimetral.
:::

## Tu laboratorio en casa

No necesitas comprar un FortiGate para practicar:

- **FortiGate-VM** con licencia de evaluación: Fortinet permite descargar la máquina virtual con una cuenta gratuita de su portal de soporte. La licencia de prueba tiene **límites** (pocos recursos, número de políticas y cifrado reducidos), pero sobra para aprender.
- Se ejecuta en un hipervisor (VMware, Hyper-V, KVM) o en simuladores de redes como **EVE-NG** o **GNS3**, junto a routers y switches virtuales.

::: externo
**Laboratorio propuesto:** monta una FortiGate-VM con tres interfaces (WAN, LAN y DMZ), una máquina virtual en la LAN y otra en la DMZ.

1. Configura las interfaces y la ruta por defecto.
2. Crea la política de LAN a internet con NAT.
3. Publica un servidor web de la DMZ con una VIP solo en el puerto 443.
4. Añade Web Filter por categorías a la política de salida.
5. Rompe algo a propósito (quita el servicio HTTPS de una política) y encuéntralo con el debug flow.

Anota cada paso como si fuera un ticket: es justo lo que te preguntarán en una entrevista.
:::

::: quiz
? ¿Qué certificación de Fortinet es la que más piden las ofertas para administrar firewalls?
+ FCP (Fortinet Certified Professional)
- FCF
- Ninguna, Fortinet no tiene certificaciones
= FCP acredita que sabes administrar y diagnosticar FortiGate.

? ¿Cómo puedes practicar con FortiGate sin comprar el equipo?
+ Con una FortiGate-VM con licencia de evaluación en un hipervisor o en EVE-NG o GNS3
- Solo en la oficina del jefe
- No se puede
= La licencia de prueba tiene límites, pero sirve para aprender.

? ¿Cómo se llamaban antes los niveles de certificación de Fortinet?
+ NSE 1 a NSE 8
- CCNA y CCNP
- A+ y Network+
= Fortinet los sustituyó por FCF, FCA, FCP, FCSS y FCX.
:::

::: banco
? ¿Qué combinación de certificaciones es muy valorada para puestos de redes y firewall?
+ CCNA y FCP Network Security
- Solo una de inglés
- Ninguna, solo la experiencia
= Una cubre las redes y la otra el firewall que más se instala.

? ¿Qué suele ser gratuito en Fortinet Training Institute?
+ Muchos cursos a tu ritmo
- Todos los exámenes
- Los equipos FortiGate
= Lo que se paga es el examen.
:::
