# Examen de entrada de Loopback (gratis y público).
# Preguntas técnicas propias, que NO salen de las lecciones de pago. Cada «@ lección» asocia las preguntas siguientes a
# esa lección: el bloque de cada escalón usa las preguntas de sus lecciones (hacen falta al menos 6 por escalón).
# Formato de cada pregunta: ? enunciado / - incorrecta / + correcta / = explicación.

# ================================================================ REDES · escalón 1
@ m1-osi
? Un switch decide el puerto de salida de una trama según la dirección MAC de destino. ¿En qué capa OSI trabaja al hacerlo?
- Capa 1, física
+ Capa 2, enlace de datos
- Capa 3, red
- Capa 4, transporte
= Las direcciones MAC pertenecen a la capa 2; las IP, a la 3.

? ¿En qué orden se encapsulan los datos de una petición web al bajar por la pila?
+ Datos → segmento TCP → paquete IP → trama Ethernet → bits
- Trama → paquete → segmento → datos → bits
- Paquete → segmento → trama → datos → bits
= Cada capa añade su cabecera: TCP (capa 4), IP (capa 3) y Ethernet (capa 2).

@ m1-ipv4
? Un equipo tiene la IP 172.16.40.130/26. ¿Cuál es su dirección de red?
- 172.16.40.0
- 172.16.40.64
+ 172.16.40.128
- 172.16.40.192
= Un /26 hace bloques de 64: 0, 64, 128, 192. La 130 cae en el bloque que empieza en 128.

? ¿Cuál de estas direcciones es privada según el RFC 1918?
- 172.32.10.5
+ 172.20.10.5
- 192.169.1.1
- 11.0.0.1
= Los rangos privados son 10.0.0.0/8, 172.16.0.0/12 (de 172.16 a 172.31) y 192.168.0.0/16.

@ m1-binario
? ¿Cuánto vale el octeto binario 11000000 en decimal?
- 128
+ 192
- 224
- 240
= 128 + 64 = 192. Es el octeto de una máscara /26 o de las redes 192.x.

@ m1-transporte
? Una llamada de voz por IP prioriza la baja latencia y tolera perder algún paquete. ¿Qué protocolo de transporte suele usar?
- TCP
+ UDP
- ARP
= UDP no retransmite ni espera confirmaciones: un paquete de voz que llega tarde ya no sirve.

@ m1-arp
? Un PC quiere enviar un paquete a otro equipo de su misma subred y no conoce su MAC. ¿Qué hace?
+ Envía una petición ARP en broadcast preguntando quién tiene esa IP
- Pregunta al servidor DNS
- Envía el paquete a su puerta de enlace
= Dentro de la subred se entrega directamente: hace falta la MAC del destino, y la averigua ARP.

@ m1-ethernet
? ¿Qué hace un switch con una trama cuya MAC de destino no está en su tabla?
- La descarta
+ La inunda por todos los puertos de la VLAN salvo por el que entró
- La envía al router
= Es una unicast desconocida: la inunda y aprende la MAC cuando el destino responda.

# ================================================================ REDES · escalón 2
@ m1-verificar
? En Windows, `ipconfig` muestra la IP 169.254.37.12. ¿Qué indica?
+ Que el equipo no obtuvo respuesta de ningún servidor DHCP y se asignó una APIPA
- Que tiene una IP pública
- Que el DNS no funciona
= Las 169.254.0.0/16 son de autoconfiguración: hay que revisar el cable, el puerto, la VLAN o el servidor DHCP.

@ m2-ios
? En un router Cisco, ¿qué comando guarda la configuración para que sobreviva a un reinicio?
- show running-config
+ copy running-config startup-config
- reload
= La running-config está en RAM; la startup-config, en NVRAM.

? ¿En qué modo de Cisco IOS se escribe `hostname R1`?
- Modo usuario (R1>)
- Modo privilegiado (R1#)
+ Configuración global (R1(config)#)
= Se entra con `configure terminal` desde el modo privilegiado.

@ m2-vlan
? Dos PC conectados al mismo switch, en las VLAN 10 y 20, no se hacen ping. ¿Qué falta para que se comuniquen?
+ Un router o un switch de capa 3 que enrute entre las VLAN
- Un cable cruzado
- Poner las dos en modo trunk
= Cada VLAN es un dominio de broadcast y una subred distinta: entre ellas hay que enrutar.

@ m4-dns
? ¿Qué registro DNS asocia un nombre a una dirección IPv4?
+ A
- AAAA
- MX
- CNAME
= AAAA es para IPv6, MX para el correo y CNAME es un alias de otro nombre.

@ m5-conceptos
? Un atacante envía a servidores DNS consultas con la IP de la víctima como origen para saturarla con las respuestas. ¿Qué ataque es?
- Phishing
+ Reflexión y amplificación
- Desbordamiento de búfer
= Las respuestas son mucho más grandes que las preguntas y van todas a la víctima.

@ m5-contrasenas
? ¿Qué comando protege la contraseña del modo privilegiado de Cisco con un hash?
- enable password
+ enable secret
- service password-encryption
= `enable secret` guarda un hash; `service password-encryption` solo ofusca con un cifrado débil (tipo 7).

# ================================================================ REDES · escalón 3
@ m1-subnetting
? Necesitas una subred para 50 equipos. ¿Cuál es el prefijo más ajustado?
- /27
+ /26
- /25
- /24
= /26 tiene 62 direcciones utilizables; /27 solo 30.

? ¿Cuál es la dirección de broadcast de 10.10.8.0/22?
- 10.10.8.255
- 10.10.10.255
+ 10.10.11.255
- 10.10.15.255
= /22 hace bloques de 4 en el tercer octeto: de 10.10.8.0 a 10.10.11.255.

@ m1-ipv6
? ¿Cuál es la forma abreviada correcta de 2001:0db8:0000:0000:0000:ff00:0042:8329?
+ 2001:db8::ff00:42:8329
- 2001:db8:0:0:ff00::42:8329::
- 2001:db8::ff00::42:8329
- 21:db8::ff:42:8329
= Se quitan los ceros a la izquierda de cada grupo y una sola secuencia de grupos de ceros se cambia por «::».

@ m2-trunk
? ¿Qué estándar etiqueta las tramas con el número de VLAN en un enlace troncal?
+ IEEE 802.1Q
- IEEE 802.3af
- IEEE 802.1X
- IEEE 802.11ac
= 802.1Q añade una etiqueta de 4 bytes con el identificador de VLAN.

? En un trunk 802.1Q, ¿qué tramas viajan sin etiqueta?
+ Las de la VLAN nativa
- Las de la VLAN 1 siempre, aunque se cambie la nativa
- Ninguna
= Si la VLAN nativa no coincide en los dos extremos, el tráfico se mezcla entre VLAN.

@ m2-stp
? ¿Para qué sirve Spanning Tree en una red con enlaces redundantes entre switches?
+ Para bloquear los caminos sobrantes y evitar bucles de capa 2
- Para repartir las VLAN entre los switches
- Para asignar direcciones IP
= Sin STP, un bucle provoca una tormenta de broadcast que tumba la red.

@ m2-intervlan
? En un router-on-a-stick, ¿qué comando asocia la subinterfaz Gi0/0.10 con la VLAN 10?
- switchport access vlan 10
+ encapsulation dot1Q 10
- vlan 10
= Cada subinterfaz recibe las tramas etiquetadas con su VLAN y tiene la puerta de enlace de esa subred.

@ m1-wireshark
? En Wireshark quieres ver solo el tráfico DNS. ¿Qué filtro de visualización usas?
+ dns
- port == dns
- udp.dns
- filter dns
= También sirve `udp.port == 53`, aunque `dns` incluye además el DNS sobre TCP.

# ================================================================ REDES · escalón 4
@ m3-tabla
? En `show ip route`, ¿qué significa la letra «C» delante de una ruta?
+ Que es una red directamente conectada a una interfaz del router
- Que la aprendió por OSPF
- Que es la ruta por defecto
= «L» es la dirección local de la interfaz, «O» es OSPF y «S» es estática.

@ m3-decision
? Un router tiene rutas a 10.0.0.0/8, 10.1.0.0/16 y 10.1.1.0/24. ¿Cuál usa para llegar a 10.1.1.20?
- 10.0.0.0/8, porque es la primera
- 10.1.0.0/16
+ 10.1.1.0/24
= Gana la coincidencia más larga (el prefijo más específico).

? Dos rutas al mismo destino tienen el mismo prefijo: una estática y otra de OSPF. ¿Cuál se instala por defecto?
+ La estática, porque su distancia administrativa (1) es menor que la de OSPF (110)
- La de OSPF, porque es dinámica
- Las dos, repartiendo la carga
= Con el mismo prefijo, decide la distancia administrativa.

@ m3-estatica
? ¿Qué comando crea una ruta por defecto hacia 203.0.113.1 en un router Cisco?
+ ip route 0.0.0.0 0.0.0.0 203.0.113.1
- ip default-route 203.0.113.1
- route add default 203.0.113.1
= 0.0.0.0/0 coincide con cualquier destino que no tenga una ruta más específica.

@ m4-nat
? Toda una oficina sale a internet con la única IP pública del router. ¿Qué tipo de NAT es?
- NAT estática
+ PAT (NAT con sobrecarga)
- NAT dinámica sin sobrecarga
= PAT distingue las conexiones por el puerto de origen.

@ m4-dhcp
? Los PC de una VLAN no reciben IP y el servidor DHCP está en otra subred. ¿Qué falta en la interfaz de la puerta de enlace de esa VLAN?
+ ip helper-address con la IP del servidor DHCP
- ip nat inside
- switchport mode trunk
= El DHCP Discover es un broadcast: el router no lo reenvía salvo que actúe como agente de retransmisión.

@ m4-ssh
? ¿Qué se necesita en un switch Cisco para activar SSH, además de un usuario local?
+ Nombre de host, nombre de dominio y claves RSA generadas
- Solo una contraseña de consola
- Una licencia de seguridad
= Con `hostname`, `ip domain-name` y `crypto key generate rsa` se crea el par de claves que usa SSH.

@ m4-ntp
? ¿Por qué es importante que todos los equipos de red tengan la hora sincronizada por NTP?
+ Para poder correlacionar los registros de varios equipos y para que funcionen los certificados
- Para que el wifi vaya más rápido
- Porque sin NTP no arrancan
= Sin la misma hora, reconstruir un incidente con los logs es casi imposible.

# ================================================================ REDES · escalón 5
@ m5-acl-estandar
? Quieres impedir que la red 192.168.30.0/24 llegue al servidor de nóminas, pero que siga llegando a todo lo demás, con una ACL estándar. ¿Dónde la aplicas?
- En la interfaz de entrada de la red 192.168.30.0/24
+ En la interfaz de salida hacia el servidor de nóminas, lo más cerca posible del destino
- En la interfaz hacia internet
= La ACL estándar solo mira el origen: cerca del origen cortaría también el tráfico hacia los demás destinos.

? ¿Qué bloquea la ACL `access-list 10 permit 192.168.10.0 0.0.0.255` aplicada en una interfaz?
+ Todo lo que no venga de 192.168.10.0/24, por la denegación implícita del final
- Nada, porque solo tiene un permit
- Solo el tráfico de 192.168.10.0/24
= Toda ACL termina con un `deny any` implícito.

@ m5-aaa
? ¿Qué protocolo AAA cifra el paquete completo y separa autenticación y autorización, por lo que se prefiere para administrar equipos de red?
+ TACACS+
- RADIUS
- SNMPv1
= RADIUS solo cifra la contraseña y combina autenticación y autorización; se usa mucho para el acceso a la red (802.1X).

@ m5-wifi
? ¿Qué protocolo de seguridad wifi usa SAE en lugar de la clave precompartida clásica?
- WEP
- WPA2-Personal
+ WPA3-Personal
= SAE resiste los ataques de diccionario fuera de línea que sí afectan a WPA2-Personal.

@ m6-json
? ¿Cuál de estos textos es JSON válido?
+ {"hostname": "R1", "interfaces": ["Gi0/0", "Gi0/1"]}
- {hostname: 'R1', interfaces: [Gi0/0, Gi0/1]}
- hostname = R1; interfaces = Gi0/0, Gi0/1
= JSON exige las claves y los textos entre comillas dobles.

@ m6-automatizacion
? ¿Qué ventaja aporta una herramienta de gestión de configuración como Ansible frente a configurar los equipos uno por uno?
+ Aplica la misma configuración a muchos equipos de forma repetible y documentada
- Elimina la necesidad de saber redes
- Hace innecesarias las copias de seguridad
= La configuración se describe una vez y se aplica igual en todos los equipos.

@ m8-practica
? En el examen CCNA, una pregunta pide elegir dos respuestas. ¿Cómo se puntúa normalmente?
+ Hay que marcar exactamente las dos correctas
- Basta con una correcta
- Se puntúa la que más se acerca
= Lee siempre cuántas respuestas pide el enunciado.

# ================================================================ REDES · escalón 6
@ m3-ospf1
? Dos routers OSPF conectados no forman vecindad. ¿Cuál de estas diferencias lo explica?
+ Tienen distintos temporizadores de hello y dead
- Tienen distinto nombre de host
- Uno tiene más interfaces que el otro
= Para ser vecinos deben coincidir el área, los temporizadores, la subred y la autenticación.

? ¿Cómo calcula OSPF el costo de una interfaz por defecto?
+ Ancho de banda de referencia (100 Mbps) dividido entre el ancho de banda de la interfaz
- Por el número de saltos
- Por el retardo medido con ping
= Con la referencia por defecto, Fast Ethernet y Gigabit tienen el mismo costo (1): conviene subir la referencia.

@ m3-ospf2
? En un segmento Ethernet con varios routers OSPF, ¿qué función reduce el número de adyacencias completas?
+ El router designado (DR) y su respaldo (BDR)
- El ABR
- La ruta por defecto
= Todos forman adyacencia completa solo con el DR y el BDR.

@ m2-etherchannel
? ¿Qué protocolo estándar IEEE negocia un EtherChannel?
- PAgP
+ LACP (802.3ad)
- CDP
= PAgP es propietario de Cisco.

@ m2-rstp
? En Rapid PVST+, ¿qué hace PortFast en un puerto de acceso?
+ Lo pasa directamente a reenviar, sin esperar la convergencia de STP
- Lo convierte en troncal
- Desactiva STP en todo el switch
= Solo se usa en puertos de equipos finales; se combina con BPDU Guard.

@ m3-fhrp
? ¿Para qué sirve HSRP?
+ Para dar una puerta de enlace virtual que sigue funcionando aunque falle uno de los routers
- Para repartir las VLAN entre switches
- Para cifrar el tráfico entre sedes
= Los equipos usan la IP virtual; si cae el router activo, el de reserva la asume.

@ m5-acl-extendida
? ¿Qué hace `access-list 110 deny tcp any host 10.0.0.10 eq 23`?
+ Bloquea Telnet hacia 10.0.0.10 desde cualquier origen
- Bloquea todo el tráfico de 10.0.0.10
- Permite solo Telnet
= Las ACL extendidas filtran por protocolo, origen, destino y puerto (23 = Telnet).

@ m5-capa2
? ¿Qué función de seguridad de capa 2 descarta respuestas DHCP que llegan por puertos no autorizados?
+ DHCP snooping
- Port security
- BPDU Guard
= Solo los puertos marcados como confiables pueden entregar ofertas DHCP: evita servidores DHCP falsos.

# ================================================================ REDES · escalón 7
@ m7-ipsec
? En una VPN IPsec, ¿qué se negocia en la fase 1 (IKE)?
+ Un canal seguro autenticado entre los dos extremos
- Las redes que viajan por el túnel
- La ruta por defecto
= En la fase 2 se negocian los túneles de datos (qué redes y con qué cifrado).

@ m7-firewall
? ¿Qué significa que un firewall sea «con estado» (stateful)?
+ Que sigue cada conexión y permite automáticamente su tráfico de vuelta
- Que guarda la configuración en disco
- Que solo funciona encendido
= Por eso no hace falta una regla de entrada para las respuestas del tráfico permitido.

@ m6-rest
? En una API REST, ¿qué método HTTP se usa normalmente para leer un recurso sin cambiarlo?
+ GET
- POST
- DELETE
= POST crea, PUT/PATCH modifican y DELETE borra.

? Una API REST responde con el código 401. ¿Qué significa?
+ Falta autenticación o el token no es válido
- El recurso no existe
- Error interno del servidor
= 404 es «no encontrado» y 500, error del servidor.

@ m6-sdn
? En una arquitectura SDN, ¿dónde se toman las decisiones de cómo reenviar el tráfico?
+ En un controlador centralizado (plano de control)
- En cada switch por separado, sin coordinación
- En los equipos finales
= El controlador programa a los equipos a través de su interfaz *southbound*.

@ m7-nube
? En la nube, ¿qué elemento filtra el tráfico que llega a una máquina virtual concreta?
+ Un grupo de seguridad (security group)
- Una VLAN nativa
- Un registro MX
= Funciona como un firewall con estado asociado a la instancia.

@ m7-monitoreo
? ¿Qué versión de SNMP añade autenticación y cifrado?
- SNMPv1
- SNMPv2c
+ SNMPv3
= v1 y v2c usan una comunidad en texto plano.

# ================================================================ REDES · escalón 8
@ m9-troubleshooting
? Un usuario no llega a un servidor. Haces ping a su puerta de enlace y responde; al servidor, no. ¿Qué método estás aplicando?
+ Divide y vencerás: aislar en qué tramo del camino está el fallo
- De arriba abajo, empezando por la aplicación
- Cambiar piezas al azar
= Cada prueba descarta una parte del camino.

@ m9-bgp
? ¿Qué protocolo intercambia rutas entre tu empresa y tu proveedor de internet, o entre proveedores?
- OSPF
- EIGRP
+ BGP
= BGP es el protocolo de enrutamiento entre sistemas autónomos.

@ m9-ospf-pro
? ¿Qué router OSPF conecta el área 0 con otra área?
+ Un ABR (Area Border Router)
- Un ASBR
- El DR
= El ASBR conecta OSPF con otro dominio de enrutamiento (por ejemplo, rutas estáticas o BGP).

@ m9-cambios
? Antes de un cambio en producción, ¿qué debe estar preparado sí o sí?
+ Un plan de vuelta atrás probado y una ventana de mantenimiento aprobada
- Un correo informal al compañero
- Nada, si el cambio es pequeño
= Muchos cortes graves vienen de «cambios pequeños» sin plan de vuelta atrás.

@ m9-hardening
? ¿Cuál de estas medidas endurece un router en producción?
+ Desactivar Telnet y HTTP, permitir solo SSHv2 desde la red de gestión
- Dejar la contraseña por defecto para no olvidarla
- Abrir SNMPv1 con la comunidad «public»
= Se reduce la superficie de ataque y se limita quién puede administrar.

@ m10-fortinet
? ¿Qué producto de Fortinet es un firewall de nueva generación?
+ FortiGate
- FortiAnalyzer
- FortiClient
= FortiAnalyzer centraliza los registros y FortiClient es el cliente para las computadoras.

@ m10-politicas
? En un FortiGate, ¿qué pasa con el tráfico que no coincide con ninguna política?
+ Se descarta por la política implícita de denegación (policy 0)
- Se permite por defecto
- Se envía al administrador
= Lo que no se permite explícitamente, se bloquea.

# ================================================================ REDES · escalón 9
@ m10-nat
? En FortiGate, ¿qué objeto publica un servidor interno traduciendo una IP pública a su IP privada?
- IP pool
+ VIP (IP virtual)
- Zona
= Además de la VIP, hace falta una política que permita ese tráfico.

@ m10-rutas-sdwan
? ¿Qué mide un health check de SD-WAN para decidir el enlace de salida?
+ Latencia, jitter y pérdida de cada enlace
- El número de usuarios conectados
- La temperatura del equipo
= Con esas medidas, el tráfico pasa al mejor enlace cuando uno se degrada.

@ m10-vpn
? Entre dos sedes con FortiGate, el túnel IPsec está arriba pero no pasa tráfico. ¿Qué revisas primero?
+ La ruta hacia la red remota por la interfaz del túnel y las políticas en los dos sentidos
- El cable de consola
- La licencia del antivirus
= En FortiGate, el túnel es una interfaz más: necesita ruta y políticas.

@ m10-perfiles
? ¿Qué hace falta para usar inspección SSL profunda sin errores de certificado en los navegadores?
+ Que los equipos confíen en la CA del firewall
- Desactivar HTTPS en la empresa
- Cambiar el DNS
= El firewall vuelve a firmar los sitios con su CA.

@ m10-ha-fabric
? ¿Qué requisito tienen los dos FortiGate de un clúster HA (FGCP)?
+ Mismo modelo y misma versión de FortiOS
- Estar en ciudades distintas
- Tener distinta configuración
= Si no coinciden, el clúster no se forma.

@ m10-diagnostico
? El debug flow de un FortiGate muestra `reverse path check fail, drop`. ¿Qué indica?
+ Que no hay ruta de vuelta hacia el origen por la interfaz por la que entró el paquete
- Que falta una licencia
- Que la contraseña es incorrecta
= Suele faltar una ruta hacia una red interna.

@ m10-certificacion
? ¿Cómo se llama el nivel profesional de las certificaciones actuales de Fortinet?
+ FCP (Fortinet Certified Professional)
- CCNP
- NSE 0
= Los niveles son FCF, FCA, FCP, FCSS y FCX.

# ================================================================ BASES DE DATOS · escalón 1
@ b1-modelo
? En una tabla de pedidos, la columna `cliente_id` apunta al `id` de la tabla clientes. ¿Qué es `cliente_id`?
+ Una clave foránea
- Una clave primaria
- Un índice de texto completo
= La clave foránea garantiza que cada pedido pertenezca a un cliente que existe.

? ¿Qué condición cumple una clave primaria?
+ Es única y no puede ser NULL
- Puede repetirse si los datos son distintos
- Siempre es un texto
= Identifica cada fila sin ambigüedad.

@ b1-tipos-datos
? ¿Qué devuelve `SELECT * FROM clientes WHERE telefono = NULL;`?
- Los clientes sin teléfono
+ Ninguna fila, porque NULL no es igual a nada; hay que usar IS NULL
- Un error de sintaxis siempre
= Cualquier comparación con NULL da «desconocido». Lo correcto es `WHERE telefono IS NULL`.

? Para guardar precios con exactitud, sin errores de redondeo, ¿qué tipo usas?
+ DECIMAL / NUMERIC
- FLOAT
- VARCHAR
= FLOAT es de coma flotante binaria y puede dar 0.30000000000000004.

@ b1-select
? ¿Qué consulta devuelve los productos con stock menor que 10, del menor al mayor stock?
+ SELECT * FROM productos WHERE stock < 10 ORDER BY stock;
- SELECT * FROM productos ORDER BY stock WHERE stock < 10;
- SELECT * WHERE stock < 10 FROM productos;
= El orden de las cláusulas es SELECT, FROM, WHERE y ORDER BY.

@ b1-intro
? ¿Qué propiedad ACID evita que una transferencia quede a medias si el servidor falla?
+ Atomicidad
- Durabilidad
- Aislamiento
= La transacción se aplica completa o no se aplica.

@ b1-sgbd
? ¿Cuál de estos gestores es NoSQL orientado a documentos?
- PostgreSQL
- SQL Server
+ MongoDB
= Guarda documentos con formato JSON (BSON).

# ================================================================ BASES DE DATOS · escalón 2
@ b2-join
? Quieres todos los clientes, tengan o no pedidos, con sus pedidos si los hay. ¿Qué JOIN usas?
- INNER JOIN
+ LEFT JOIN desde clientes
- CROSS JOIN
= LEFT JOIN conserva todas las filas de la tabla de la izquierda y pone NULL donde no hay coincidencia.

? Un INNER JOIN entre 1.000 pedidos y la tabla clientes devuelve 980 filas. ¿Qué es lo más probable?
+ 20 pedidos tienen un cliente_id que no existe en clientes (o es NULL)
- Se perdieron 20 pedidos de la base de datos
- El JOIN siempre descarta el 2 %
= INNER JOIN solo devuelve las filas con coincidencia en las dos tablas.

@ b2-agregacion
? ¿Qué cláusula filtra grupos después de un GROUP BY, por ejemplo las tiendas con más de 100 ventas?
- WHERE
+ HAVING
- ORDER BY
= WHERE filtra filas antes de agrupar; HAVING filtra los grupos.

? ¿Qué diferencia hay entre COUNT(*) y COUNT(email)?
+ COUNT(*) cuenta todas las filas; COUNT(email) solo las que tienen email no NULL
- Ninguna
- COUNT(email) cuenta los emails distintos
= Para contar distintos se usa COUNT(DISTINCT email).

@ b2-subconsultas
? ¿Qué devuelve esta consulta? `SELECT nombre FROM productos WHERE precio > (SELECT AVG(precio) FROM productos);`
+ Los productos con precio superior a la media
- El precio medio
- Los productos más baratos
= La subconsulta calcula la media y la consulta externa compara cada precio con ella.

@ b2-modificar
? Ejecutas `UPDATE empleados SET salario = salario * 1.10;` sin WHERE. ¿Qué pasa?
+ Se sube el 10 % a todos los empleados
- No pasa nada: falta el WHERE
- Da error
= Sin WHERE, UPDATE y DELETE afectan a todas las filas: por eso se prueban antes con SELECT y dentro de una transacción.

@ b2-ddl
? ¿Qué sentencia añade una columna a una tabla existente?
+ ALTER TABLE clientes ADD COLUMN telefono VARCHAR(20);
- UPDATE clientes ADD telefono;
- INSERT COLUMN telefono INTO clientes;
= ALTER TABLE cambia la estructura; UPDATE cambia datos.

@ b3-modelado
? En un modelo entidad-relación, un estudiante se inscribe en muchos cursos y un curso tiene muchos estudiantes. ¿Cómo se implementa?
+ Con una tabla intermedia (inscripciones) con dos claves foráneas
- Con una columna de cursos separados por comas en estudiantes
- Con una clave foránea en cada tabla apuntando a la otra
= Las relaciones muchos a muchos necesitan una tabla de unión.

# ================================================================ BASES DE DATOS · escalón 3
@ b2-ventanas
? ¿Qué hace `ROW_NUMBER() OVER (PARTITION BY tienda ORDER BY total DESC)`?
+ Numera las ventas de cada tienda de mayor a menor total, empezando en 1 en cada tienda
- Suma el total por tienda
- Elimina las filas repetidas
= Las funciones de ventana calculan sin agrupar: cada fila conserva su detalle.

@ b3-diseno
? Una tabla repite el nombre y la dirección del cliente en cada pedido. ¿Qué problema de diseño tiene?
+ Falta de normalización: redundancia y anomalías al actualizar
- Ninguno, así es más rápido siempre
- Que no tiene índices
= Si el cliente cambia de dirección, habría que actualizarla en todos sus pedidos.

@ b3-rendimiento
? Una consulta filtra siempre por `correo` en una tabla de 5 millones de filas y tarda varios segundos. ¿Qué pruebas primero?
+ Revisar el plan con EXPLAIN y crear un índice sobre correo
- Añadir más RAM al servidor sin mirar nada
- Borrar filas antiguas al azar
= Sin índice, el SGBD recorre la tabla entera (full scan).

? ¿Qué inconveniente tienen los índices?
+ Ocupan espacio y hacen más lentas las inserciones y actualizaciones
- Hacen más lentas todas las consultas
- Impiden usar JOIN
= Cada índice se actualiza en cada escritura: se crean solo los que se usan.

@ b3-transacciones
? Dos transacciones esperan cada una un bloqueo que tiene la otra. ¿Cómo se llama esta situación?
+ Interbloqueo (deadlock)
- Lectura sucia
- Replicación
= El SGBD lo detecta y cancela una de las dos transacciones.

@ b3-inyeccion
? ¿Cuál es la defensa correcta contra la inyección SQL?
+ Consultas parametrizadas (sentencias preparadas)
- Quitar las comillas del texto a mano
- Ocultar los mensajes de error
= Con parámetros, los datos nunca se interpretan como parte del código SQL.

@ b3-seguridad
? La aplicación web se conecta a la base de datos con el usuario administrador (superusuario). ¿Qué principio incumple?
+ Mínimo privilegio
- Normalización
- Atomicidad
= La aplicación debe usar un usuario con solo los permisos que necesita.

@ b3-nosql
? ¿Cuándo encaja mejor una base de datos clave-valor como Redis?
+ Para cachés y sesiones que se leen muchísimas veces por su clave
- Para informes contables con muchos JOIN
- Para sustituir cualquier base relacional
= Es muy rápida para accesos por clave, pero no hace consultas relacionales.

# ================================================================ PROGRAMACIÓN · escalón 1
@ p1-que-es
? ¿Qué lenguajes se compilan normalmente a un ejecutable nativo antes de usarse?
+ C, Go y Rust
- Python y JavaScript
- HTML y CSS
= Python y JavaScript suelen ejecutarse con un intérprete o con compilación JIT; HTML y CSS no son lenguajes de programación.

@ p1-variables
? En Python, ¿qué devuelve `7 // 2`?
- 3.5
+ 3
- 4
= `//` es la división entera; `/` daría 3.5 y `%` el resto (1).

? En Python, ¿qué pasa al ejecutar `"Total: " + 5`?
+ Un TypeError: no se puede concatenar texto y número sin convertir
- Muestra "Total: 5"
- Muestra 5
= Hay que convertir con str(5) o usar un f-string: f"Total: {5}".

@ p1-condicionales
? Con `edad = 20` y `tiene_permiso = False`, ¿qué vale `edad >= 18 and tiene_permiso`?
- True
+ False
- 20
= `and` exige que las dos condiciones sean verdaderas.

@ p1-bucles
? ¿Cuántas veces se ejecuta el cuerpo de `for i in range(2, 10, 3):`?
- 8
+ 3
- 4
= range(2, 10, 3) produce 2, 5 y 8.

@ p1-funciones
? ¿Qué imprime este código? `def doble(x): return x * 2` y después `print(doble(doble(3)))`
- 6
+ 12
- 9
= doble(3) = 6 y doble(6) = 12.

@ p1-traza
? ¿Qué vale `total` al final? `total = 0` y `for n in [3, 5, 2]: total = total + n * 2`
+ 20
- 10
- 15
= (3 + 5 + 2) × 2 = 20.

@ p2-javascript
? En JavaScript, ¿qué diferencia hay entre `==` y `===`?
+ `===` compara valor y tipo sin conversiones; `==` convierte los tipos antes de comparar
- Ninguna
- `==` es más estricto
= Por eso `0 == ""` es true y `0 === ""` es false. Se recomienda `===`.

# ================================================================ PROGRAMACIÓN · escalón 2
@ p1-colecciones
? En Python, ¿qué estructura usas para buscar rápidamente el precio de un producto por su código?
- Una lista de tuplas
+ Un diccionario {código: precio}
- Un texto separado por comas
= El acceso por clave en un diccionario es prácticamente inmediato aunque tenga millones de elementos.

@ p3-git
? Has hecho cambios en una rama y quieres incorporarlos a main. ¿Qué operación es?
+ Un merge (o un pull request que termina en merge)
- Un clone
- Un init
= `git merge rama` integra el historial de una rama en otra.

? ¿Qué hace `git commit`?
+ Guarda en el historial local los cambios preparados con git add
- Sube los cambios al servidor
- Descarga los cambios del servidor
= Subirlos es `git push`; descargarlos, `git pull` o `git fetch`.

@ p3-poo
? En programación orientada a objetos, ¿qué es una clase?
+ La plantilla que define los atributos y métodos de sus objetos
- Una variable global
- Un tipo de bucle
= Cada objeto es una instancia de una clase.

@ p3-errores
? En Python, ¿qué bloque se ejecuta siempre, haya o no excepción, por ejemplo para cerrar un archivo?
- except
- else
+ finally
= Aunque lo más idiomático para archivos es `with open(...)`, que los cierra solo.

@ p2-linux
? En Linux, ¿qué comando muestra las últimas líneas de un registro y sigue mostrando las nuevas?
+ tail -f /var/log/syslog
- cat -n /var/log/syslog
- ls -la /var/log/syslog
= `-f` (follow) mantiene el archivo abierto y muestra lo que se va escribiendo.

? En Linux, ¿qué permisos da `chmod 640 informe.txt`?
+ Lectura y escritura al dueño, lectura al grupo y nada a los demás
- Todos los permisos a todos
- Solo ejecución al dueño
= 6 = rw-, 4 = r--, 0 = ---.

@ p2-java
? ¿Qué ejecuta los programas Java compilados (bytecode)?
+ La máquina virtual de Java (JVM)
- El navegador
- El intérprete de Python
= El mismo bytecode corre en cualquier sistema con una JVM.

# ================================================================ PROGRAMACIÓN · escalón 3
@ p3-apis
? Una API responde `{"error": "not found"}` con código HTTP 404. ¿Qué significa?
+ El recurso pedido no existe en esa ruta
- La autenticación falló
- El servidor está caído
= 401 es autenticación, 403 falta de permisos y 5xx errores del servidor.

@ p4-algoritmos
? ¿Qué complejidad tiene la búsqueda binaria en una lista ordenada de n elementos?
- O(n)
+ O(log n)
- O(n²)
= En cada paso descarta la mitad de los elementos.

? Un algoritmo recorre una lista y, para cada elemento, vuelve a recorrer toda la lista. ¿Qué complejidad tiene?
- O(n)
- O(log n)
+ O(n²)
= Dos bucles anidados sobre n elementos: n × n operaciones.

@ p4-estructuras
? ¿Qué estructura sigue el orden «el último en entrar es el primero en salir»?
+ Una pila (stack)
- Una cola (queue)
- Un árbol binario
= La cola es «el primero en entrar, el primero en salir».

@ p4-pruebas
? ¿Qué comprueba una prueba unitaria?
+ Una función o unidad pequeña de forma aislada, con entradas y resultados conocidos
- El sistema completo con usuarios reales
- La velocidad de la red
= Las pruebas de integración y las de extremo a extremo comprueban piezas mayores.

@ p4-seguridad
? ¿Dónde NO debe estar nunca una contraseña de base de datos?
+ Escrita en el código fuente que se sube al repositorio
- En un gestor de secretos
- En una variable de entorno del servidor
= Lo que llega a un repositorio puede acabar expuesto, incluso en el historial.

@ p4-web
? ¿Qué parte de una aplicación web se ejecuta en el navegador del usuario?
+ El frontend (HTML, CSS y JavaScript)
- La base de datos
- El backend
= El backend se ejecuta en el servidor y es donde deben estar las comprobaciones de seguridad.

@ p4-redes
? Tu programa en Python debe conectarse a un servidor y garantizar que los datos llegan completos y en orden. ¿Qué tipo de socket usas?
+ TCP (SOCK_STREAM)
- UDP (SOCK_DGRAM)
- ICMP
= TCP garantiza la entrega ordenada; UDP no.

# ================================================================ EMPLEO TI · escalón 1
@ s1-ruta
? Las impresoras de una sede pierden la IP cada lunes y cada semana se abren varios tickets. ¿Qué práctica de ITIL busca la causa raíz?
- Gestión de incidentes
+ Gestión de problemas
- Solicitudes de servicio
= Cada ticket es un incidente; la causa común se gestiona como un problema.

@ s1-metodo
? Un usuario dice que «internet no funciona», pero puede hacer ping a 8.8.8.8. ¿Qué compruebas a continuación?
+ La resolución DNS, por ejemplo con nslookup
- El cable de red
- La tarjeta gráfica
= Si responde una IP pública pero no cargan los nombres, el fallo suele estar en el DNS.

@ s1-windows
? Un equipo con Windows va lento. En el Administrador de tareas, la memoria está al 95 % y el disco al 100 %. ¿Qué es lo más probable?
+ Falta RAM y el sistema está paginando en el disco
- La tarjeta de red está averiada
- El monitor tiene poca resolución
= Con la memoria llena, Windows usa el disco como memoria virtual y todo se ralentiza.

@ s1-tickets
? Cae el sistema de cobro en todas las tiendas un sábado por la mañana. ¿Qué prioridad tiene el ticket?
+ Crítica (P1): impacto alto y urgencia alta
- Baja, porque es fin de semana
- Media, hasta que alguien lo confirme
= La prioridad se calcula con el impacto (muchos usuarios, el negocio parado) y la urgencia.

@ s1-remoto
? ¿Qué buena práctica aplicas antes de conectarte por acceso remoto al equipo de un usuario?
+ Pedir su consentimiento y verificar su identidad por un canal conocido
- Conectarte sin avisar para no molestar
- Pedirle su contraseña por correo
= El soporte nunca pide contraseñas; y el acceso remoto se hace con permiso del usuario.

@ s2-consola
? ¿Qué comando de Windows muestra la configuración IP completa, incluidos los servidores DNS y la MAC?
- ipconfig /flushdns
+ ipconfig /all
- netstat -an
= `ipconfig /flushdns` vacía la caché DNS y `netstat` muestra conexiones.

? En PowerShell, ¿qué comando prueba si un servidor responde en el puerto 443?
+ Test-NetConnection servidor -Port 443
- Get-Process 443
- ping servidor:443
= Muestra si la conexión TCP al puerto se establece.

@ s2-componentes
? Un SSD NVMe Gen4 x4 se instala en una ranura PCIe Gen3 x4. ¿Qué ocurre?
+ Funciona, pero a la velocidad de Gen3, aproximadamente la mitad
- No arranca
- Funciona más rápido que en Gen4
= PCIe es compatible entre generaciones; manda la más lenta.

# ================================================================ EMPLEO TI · escalón 2
@ s2-ad
? Un usuario escribe mal su contraseña varias veces y ya no puede entrar aunque ahora la escriba bien. ¿Qué haces en Active Directory?
+ Desbloquear la cuenta, tras verificar su identidad
- Borrar la cuenta y crear otra
- Desactivar la directiva de contraseñas del dominio
= La directiva de bloqueo protege contra la fuerza bruta; se desbloquea y se revisa si hubo intentos sospechosos.

? ¿Cuál es la buena práctica para dar permisos a una carpeta compartida de Ventas?
+ Dar permisos a un grupo de Ventas y añadir a él a los usuarios
- Dar permisos a cada usuario por separado
- Dar control total a Todos
= Con grupos, las altas y bajas se gestionan en un solo lugar.

@ s1-impresoras
? Una impresora de red deja de funcionar tras un corte de luz y ahora tiene otra IP. ¿Qué solución evita que se repita?
+ Una reserva DHCP (o una IP fija documentada) para la impresora
- Reinstalar Windows en todos los equipos
- Cambiar el cable cada semana
= Los equipos apuntan a una IP: si cambia, dejan de encontrarla.

@ s2-averias
? Un PC enciende los ventiladores pero no da imagen y emite una secuencia de pitidos. ¿Qué indica?
+ Un fallo detectado en el POST, normalmente de memoria o de vídeo, según el código de la placa
- Que Windows necesita actualizarse
- Que el monitor está en modo ahorro
= Los pitidos son el código de error del POST: se consulta el manual de la placa.

@ s2-armar
? Antes de abrir un equipo para cambiar la RAM, ¿qué haces?
+ Apagarlo, desconectarlo de la corriente y descargar la electricidad estática
- Dejarlo encendido para ver si la reconoce
- Solo apagar el monitor
= La electricidad estática puede dañar los componentes.

@ s1-problemas
? ¿Qué técnica sirve para encontrar la causa raíz preguntando «¿por qué?» varias veces seguidas?
+ Los 5 porqués
- El análisis DAFO
- El modelo OSI
= Se va de los síntomas a la causa de fondo.

@ s1-laboratorio
? Quieres practicar Active Directory en casa sin afectar a tu computadora. ¿Qué usas?
+ Máquinas virtuales con versiones de evaluación de Windows Server
- Tu propio equipo como controlador de dominio
- No se puede practicar fuera de una empresa
= Las versiones de evaluación son legales y suficientes para aprender.

# ================================================================ INGLÉS TÉCNICO · escalón 1
@ s11-por-que
? `curl https://10.0.0.8` devuelve `Failed to connect to 10.0.0.8 port 443: Connection timed out`. ¿Qué es lo más probable?
+ Algo en el camino (un firewall o una ruta) impide llegar, o el equipo no responde
- El servidor web responde, pero el puerto 443 está cerrado
- El certificado ha caducado
= Si el puerto estuviera cerrado en un equipo accesible, el error sería *Connection refused*.

? En un RFC, ¿qué significa MUST?
+ Obligatorio
- Recomendado
- Opcional
= SHOULD es recomendado y MAY, opcional (RFC 2119).

? La documentación marca una función como *deprecated*. ¿Qué significa?
+ Todavía funciona, pero dejará de existir: hay que migrar
- Que es la recomendada
- Que tiene un error de seguridad grave
= Conviene planificar el cambio a la alternativa que indique la documentación.

@ s11-vocabulario
? ¿Qué significa *throughput*?
+ La cantidad de datos que realmente se transmite por segundo
- El tiempo que tarda un paquete en llegar
- El nombre de un cable
= La latencia es el tiempo; el throughput, la cantidad real transmitida.

? En un ticket en inglés pone *the issue persists after a reboot*. ¿Qué quiere decir?
+ El problema sigue después de reiniciar
- El problema se resolvió al reiniciar
- Hay que reiniciar dos veces
= *Persist* significa que continúa.

? ¿Qué es un *firmware upgrade*?
+ Una actualización del software interno de un dispositivo
- Comprar un equipo nuevo
- Un cambio de contraseña
= Por ejemplo, actualizar el sistema de un router o de una impresora.

? En un registro de firewall, ¿qué significa *dropped*?
+ Descartado sin avisar al origen
- Reenviado
- Cifrado
= *Denied* y *dropped* indican bloqueo; *dropped* no envía respuesta.

# ================================================================ INGLÉS TÉCNICO · escalón 2
@ s11-errores
? Un mensaje dice `Permission denied (publickey)`. ¿Qué falla?
+ La autenticación SSH con clave: el servidor no acepta tu clave pública
- El disco está lleno
- No hay conexión a internet
= Hay que revisar qué clave se envía y si está en authorized_keys del servidor.

? `ERROR: duplicate key value violates unique constraint "usuarios_email_key"`. ¿Qué pasó?
+ Se intentó insertar un email que ya existe en una columna única
- La base de datos está caída
- El email está mal escrito
= La restricción UNIQUE impide valores repetidos.

@ s11-escribir
? ¿Cuál es la frase más profesional para actualizar un ticket en inglés?
+ The printer was reconfigured with a DHCP reservation. Please confirm it works on your side.
- printer ok now
- I fix the printer yesterday maybe works
= Clara, completa y pide confirmación al usuario.

@ s11-llamadas
? En una llamada de soporte en inglés no entendiste el número de serie. ¿Qué dices?
+ Sorry, could you spell that for me, please?
- What?
- Repeat.
= Pedir que deletreen es lo habitual con números de serie y nombres de usuario.

? ¿Qué significa *Could you walk me through the steps?*
+ ¿Podrías explicarme los pasos uno por uno?
- ¿Puedes caminar hasta la oficina?
- ¿Puedes saltarte los pasos?
= *Walk someone through* es guiar paso a paso.

@ s11-entrevista
? En una entrevista te preguntan *Tell me about a time you solved a difficult problem*. ¿Qué estructura usas?
+ STAR: situación, tarea, acción y resultado
- Responder solo «yes»
- Hablar de tus aficiones
= STAR ordena la respuesta y muestra lo que hiciste tú.

? ¿Qué significa *troubleshooting*?
+ Diagnóstico y resolución de averías
- Instalación de programas
- Ventas técnicas
= Es una de las palabras que más aparecen en las ofertas de empleo de TI.

# ================================================================ CIBERSEGURIDAD · escalón 1
@ c1-que-es
? Un ransomware cifra los servidores y la empresa no puede facturar. ¿Qué propiedad de la tríada CIA se ha perdido sobre todo?
- Confidencialidad
- Integridad
+ Disponibilidad
= El servicio deja de estar disponible.

? Tienes tres vulnerabilidades: CVSS 5,3 en un equipo interno, CVSS 9,8 en el firewall expuesto a internet y CVSS 7,5 en un portátil. ¿Cuál parcheas primero?
+ La de CVSS 9,8 en el firewall expuesto a internet
- La de 5,3, porque es la más fácil
- La del portátil, porque se mueve
= Gravedad crítica (9,0 o más) y exposición a internet: es la de mayor riesgo.

@ c1-hash
? ¿Por qué se añade una «sal» aleatoria antes de calcular el hash de una contraseña?
+ Para que dos contraseñas iguales tengan hashes distintos y no sirvan tablas precalculadas
- Para poder descifrar la contraseña después
- Para que el hash sea más corto
= Un hash no se descifra; la sal impide los ataques con tablas arcoíris.

? Revisas una aplicación que guarda las contraseñas como `md5(contraseña)`. ¿Qué recomiendas?
+ Migrar a un algoritmo lento con sal, como Argon2 o bcrypt
- Cambiar a SHA-1 sin sal
- Cifrarlas con una clave guardada en el mismo servidor
= MD5 es rapidísimo: con tarjetas gráficas se prueban miles de millones de combinaciones por segundo.

@ c1-contrasenas
? ¿Qué método de verificación en dos pasos resiste mejor el phishing?
+ Una llave de seguridad FIDO2 o una passkey
- Un código por SMS
- Una pregunta de seguridad
= La llave verifica el dominio real del sitio: una página falsa no puede usarla.

@ c1-ingenieria
? Un correo urgente «del director» pide comprar tarjetas regalo y enviarle los códigos. ¿Qué tipo de ataque es?
+ Fraude del CEO (BEC), una forma de ingeniería social
- Un DDoS
- Una inyección SQL
= Se verifica siempre por otro canal conocido.

@ c1-malware
? ¿Qué tipo de malware se propaga solo por la red aprovechando vulnerabilidades, sin que el usuario haga nada?
- Troyano
+ Gusano
- Adware
= El troyano necesita que el usuario lo ejecute haciéndose pasar por algo legítimo.

# ================================================================ CIBERSEGURIDAD · escalón 2
@ c2-cripto
? ¿Qué tipo de cifrado usa una clave pública para cifrar y una privada para descifrar?
+ Asimétrico
- Simétrico
- Hash
= Por ejemplo RSA o curvas elípticas. El simétrico usa la misma clave (AES).

@ c2-tls
? El navegador avisa de que el certificado de un sitio no es válido. ¿Cuál puede ser la causa?
+ Que caducó, que no coincide con el nombre del sitio o que no lo firmó una CA de confianza
- Que el sitio usa HTTP/2
- Que el servidor tiene mucha carga
= Ignorar el aviso puede exponerte a un ataque de intermediario.

@ c2-firewall
? En una DMZ, ¿qué regla es correcta?
+ Internet puede llegar al servidor web de la DMZ solo por 443, y la DMZ no puede iniciar conexiones a la LAN
- La DMZ y la LAN se comunican sin restricciones
- Todo el tráfico de internet entra directamente a la LAN
= La DMZ limita el daño si un servidor público es comprometido.

@ c2-web
? Un formulario muestra en la página lo que escribe el usuario sin escaparlo, y alguien inyecta `<script>`. ¿Qué vulnerabilidad es?
+ XSS (cross-site scripting)
- Inyección SQL
- CSRF
= Se corrige escapando la salida y con una política de seguridad de contenido (CSP).

? ¿Qué ataque engaña al navegador de un usuario autenticado para que envíe una petición que él no quería?
- XSS
+ CSRF
- Fuerza bruta
= Se mitiga con tokens anti-CSRF y cookies SameSite.

@ c2-vulns
? Un escáner encuentra 300 vulnerabilidades. ¿Cómo priorizas?
+ Por gravedad (CVSS), si se están explotando activamente y lo expuesto que está cada sistema
- Por orden alfabético
- Arreglando primero las más fáciles, sean cuales sean
= Una vulnerabilidad crítica explotada en un servidor expuesto a internet va primero.

@ c2-cripto
? Un proveedor publica un instalador junto con su firma digital. ¿Qué te permite comprobar esa firma?
+ Que el archivo lo publicó ese proveedor y que nadie lo ha modificado
- Que el archivo no contiene ningún error de programación
- Que la descarga es más rápida
= La firma se verifica con la clave pública del proveedor: aporta autenticidad e integridad, no confidencialidad.

# ================================================================ CIBERSEGURIDAD · escalón 3
@ c3-logs
? En el registro de un servidor ves cientos de `Failed password for root from 203.0.113.50` en pocos minutos. ¿Qué es?
+ Un ataque de fuerza bruta por SSH contra la cuenta root
- Un usuario que olvidó su contraseña
- Una actualización del sistema
= Medidas: bloquear la IP, deshabilitar el acceso de root por SSH y usar claves en vez de contraseñas.

@ c3-soc
? ¿Qué herramienta del SOC reúne y correlaciona los registros de muchos sistemas para generar alertas?
+ Un SIEM
- Un IDE
- Un balanceador de carga
= Por ejemplo Splunk, Microsoft Sentinel, Wazuh o Elastic.

? El SIEM alerta de «exfiltración de datos» cada noche a las 2:00, y siempre es la copia de seguridad programada hacia la nube. ¿Cómo se clasifica la alerta y qué haces?
+ Es un falso positivo: se ajusta la regla documentando la excepción de ese origen y destino
- Es un ataque real: se apagan los servidores
- Se desactiva el SIEM por las noches
= Ajustar bien las reglas reduce el ruido sin dejar de detectar exfiltraciones reales.

@ c3-incidentes
? Detectas un equipo infectado con ransomware que sigue cifrando carpetas compartidas. ¿Cuál es la primera acción?
+ Aislarlo de la red (contención) sin apagarlo, si el procedimiento lo indica
- Pagar el rescate
- Borrar los registros
= Primero se contiene la propagación; apagarlo puede destruir evidencias de la memoria.

? ¿En qué orden van las fases de respuesta a incidentes según NIST?
+ Preparación; detección y análisis; contención, erradicación y recuperación; actividades posteriores
- Recuperación; detección; preparación
- Erradicación; preparación; detección
= Las lecciones aprendidas cierran el ciclo y mejoran la preparación.

@ c3-normas
? ¿Qué norma internacional se certifica para demostrar un sistema de gestión de la seguridad de la información?
+ ISO/IEC 27001
- ISO 9001
- RFC 2119
= ISO 9001 es de gestión de la calidad.

@ c3-carrera
? ¿Qué hace un analista SOC de nivel 1?
+ Revisa y clasifica las alertas y escala los incidentes confirmados
- Diseña la red de la empresa
- Programa el ERP
= Es una de las puertas de entrada más habituales a la ciberseguridad.
