# Glosario de Loopback

Una fila por término: | Término | Otras formas (separadas por comas) | Área | Definición |
Las otras formas son plurales, siglas o variantes que también se marcan en las lecciones.

| Término | Otras formas | Área | Definición |
|---|---|---|---|
| ACL | ACLs, lista de control de acceso, listas de control de acceso | redes | Lista de reglas en un router o firewall que permite o deniega tráfico según su origen, destino, protocolo o puerto. |
| AAA | | redes | Autenticación (quién eres), autorización (qué puedes hacer) y registro (qué hiciste). Suele centralizarse con RADIUS o TACACS+. |
| Ancho de banda | | redes | Cantidad máxima de datos que un enlace puede transmitir por segundo, por ejemplo 1 Gbps. |
| APIPA | | redes | Dirección 169.254.x.x que Windows se asigna cuando ningún servidor DHCP le responde. Indica un problema de DHCP o de cable. |
| ARP | | redes | Protocolo que averigua la dirección MAC que corresponde a una IPv4 dentro de la misma red. |
| Broadcast | difusión | redes | Envío a todos los equipos de una red. En IPv4 es la última dirección de la subred; IPv6 no lo tiene. |
| CDP | | redes | Protocolo de Cisco para descubrir los equipos vecinos conectados directamente. LLDP es el estándar equivalente. |
| Colisión | colisiones | redes | Dos tramas enviadas a la vez por el mismo medio compartido. Con switches y full dúplex ya no ocurren. |
| Conmutador | | redes | Otro nombre del switch. |
| CSMA/CD | | redes | Método de acceso de la Ethernet antigua (half dúplex): escuchar antes de transmitir y detectar colisiones. |
| DHCP | | redes | Servicio que entrega automáticamente a cada equipo su IP, máscara, puerta de enlace y DNS. |
| DNS | | redes | Sistema que traduce nombres como www.ejemplo.com a direcciones IP. |
| Dominio de broadcast | dominios de broadcast | redes | Conjunto de equipos que reciben los broadcasts de los demás. Cada VLAN es uno; los routers los separan. |
| Dúplex | full dúplex, half dúplex, full-duplex, half-duplex | redes | Full dúplex: enviar y recibir a la vez. Half dúplex: solo una cosa cada vez. Si los dos extremos no coinciden, hay errores. |
| EtherChannel | | redes | Agrupación de varios enlaces físicos entre dos switches en uno lógico, para sumar capacidad y redundancia. |
| EUI-64 | | redes | Forma de crear los 64 bits de interfaz de una IPv6 a partir de la MAC: se inserta FFFE en medio y se invierte el 7.º bit. |
| Firewall | cortafuegos, firewalls | redes | Equipo o programa que filtra el tráfico entre redes según reglas de seguridad. |
| FHRP | HSRP, VRRP | redes | Protocolos que hacen que dos routers compartan una puerta de enlace virtual: si uno falla, el otro toma el relevo. |
| Gateway | puerta de enlace, puerta de enlace predeterminada | redes | El router al que un equipo envía todo lo que va fuera de su red local. |
| Hub | | redes | Concentrador antiguo que repite cada señal por todos los puertos. Fue sustituido por el switch. |
| ICMP | | redes | Protocolo de mensajes de control y error de IP. Lo usan ping y traceroute. |
| IPv4 | | redes | Versión 4 de IP: direcciones de 32 bits escritas como cuatro números de 0 a 255, por ejemplo 192.168.1.10. |
| IPv6 | | redes | Versión 6 de IP: direcciones de 128 bits en hexadecimal, por ejemplo 2001:DB8::1. |
| Latencia | | redes | Tiempo que tarda un paquete en llegar a su destino. Se mide en milisegundos. |
| Link-local | | redes | Dirección IPv6 FE80::/10 válida solo dentro del enlace. Todas las interfaces IPv6 tienen una. |
| Loopback | | redes | Interfaz virtual que siempre está activa. En un equipo, 127.0.0.1 (o ::1) apunta a sí mismo. |
| MAC | dirección MAC, direcciones MAC | redes | Dirección física de 48 bits de una tarjeta de red, por ejemplo 00:1A:2B:3C:4D:5E. Sirve dentro de la red local. |
| Máscara de subred | máscara | redes | Número que indica qué parte de una IPv4 es la red y cuál el equipo, por ejemplo 255.255.255.0 (/24). |
| MTU | | redes | Tamaño máximo de paquete que admite un enlace sin fragmentarlo. En Ethernet, 1500 bytes. |
| Multicast | | redes | Envío a un grupo de equipos interesados, no a todos. |
| NAT | PAT | redes | Traducción de direcciones: permite que muchos equipos con IP privadas salgan a internet con una sola IP pública. |
| NDP | | redes | Protocolo de descubrimiento de vecinos de IPv6: sustituye a ARP y anuncia los routers. |
| NTP | | redes | Protocolo que sincroniza la hora de los equipos. Imprescindible para que los registros sean fiables. |
| OSI | modelo OSI | redes | Modelo de 7 capas que describe cómo se comunican los equipos: física, enlace, red, transporte, sesión, presentación y aplicación. |
| OSPF | | redes | Protocolo de enrutamiento dinámico de estado de enlace muy usado en empresas. Elige caminos según el coste. |
| Paquete | paquetes | redes | Unidad de datos de la capa de red (capa 3), con IP de origen y de destino. |
| Ping | | redes | Comando que envía mensajes ICMP para comprobar si un equipo responde y cuánto tarda. |
| PoE | | redes | Power over Ethernet: el switch alimenta por el cable de red a teléfonos, cámaras o puntos de acceso. |
| Port security | | redes | Función del switch que limita qué direcciones MAC pueden usar un puerto. |
| Prefijo | | redes | Longitud de la parte de red de una dirección, escrita con barra: /24, /64. |
| Puerto | puertos | redes | Número que identifica una aplicación dentro de un equipo (por ejemplo 443 para HTTPS). También, cada conector físico de un switch. |
| Punto de acceso | puntos de acceso, AP | redes | Equipo que crea la red wifi y la conecta con la red cableada. |
| QoS | calidad de servicio | redes | Técnicas que dan prioridad a cierto tráfico, como la voz, cuando la red está congestionada. |
| Router | routers, enrutador | redes | Equipo que conecta redes distintas y decide por dónde enviar cada paquete según su tabla de enrutamiento. |
| Ruta por defecto | | redes | Ruta 0.0.0.0/0 (o ::/0) que se usa cuando ninguna otra coincide. Normalmente apunta a internet. |
| SDN | | redes | Redes definidas por software: un controlador central programa el comportamiento de los equipos. |
| SLAAC | | redes | Autoconfiguración de IPv6 sin servidor: el equipo crea su dirección con el prefijo que anuncia el router. |
| SNMP | | redes | Protocolo para monitorizar y gestionar equipos de red de forma centralizada. |
| SSH | | redes | Acceso remoto cifrado a la consola de un equipo. Sustituye a Telnet, que viaja sin cifrar. |
| STP | spanning tree | redes | Protocolo que bloquea enlaces redundantes entre switches para evitar bucles. |
| Subnetting | subred, subredes | redes | Dividir una red en redes más pequeñas tomando bits de la parte de equipo. |
| Switch | switches | redes | Equipo que conecta los dispositivos de una red local y reenvía cada trama solo al puerto del destino, según la MAC. |
| Syslog | | redes | Estándar para enviar los mensajes de registro de los equipos a un servidor central. |
| Tabla de enrutamiento | | redes | Lista de redes conocidas por un router y por dónde llegar a cada una. Se ve con show ip route. |
| TCP | | redes | Protocolo de transporte fiable y orientado a conexión: confirma lo recibido y retransmite lo perdido. |
| Trama | tramas | redes | Unidad de datos de la capa de enlace (capa 2), con MAC de origen y de destino. |
| Trunk | trunks, enlace troncal | redes | Enlace entre switches que transporta varias VLAN, etiquetando cada trama con 802.1Q. |
| UDP | | redes | Protocolo de transporte sin conexión ni confirmaciones: más ligero y rápido que TCP. |
| VLAN | VLANs | redes | Red lógica dentro de un switch: separa equipos en dominios de broadcast distintos aunque compartan el mismo switch. |
| VPN | | redes | Túnel cifrado a través de internet para conectar sedes o trabajadores remotos como si estuvieran en la oficina. |
| WAN | | redes | Red de área amplia: conecta sedes en distintas ciudades o con internet. |
| LAN | | redes | Red de área local: la de una oficina, casa o edificio. |
| Wildcard | máscara wildcard | redes | Máscara inversa que usan las ACL y OSPF: 0 = tiene que coincidir, 1 = da igual. 0.0.0.255 equivale a /24. |
| Backup | copia de seguridad, copias de seguridad | bd | Copia de los datos para poder recuperarlos si se pierden o se dañan. |
| Clave foránea | claves foráneas, foreign key | bd | Columna que apunta a la clave primaria de otra tabla y así relaciona las dos. |
| Clave primaria | claves primarias, primary key | bd | Columna (o columnas) que identifica cada fila de una tabla sin repetirse. |
| CRUD | | bd | Las cuatro operaciones básicas sobre datos: crear (INSERT), leer (SELECT), actualizar (UPDATE) y borrar (DELETE). |
| CTE | | bd | Subconsulta con nombre que se define con WITH al principio de una consulta para hacerla más legible. |
| DDL | | bd | Parte de SQL que define la estructura: CREATE, ALTER, DROP. |
| Índice | índices | bd | Estructura que acelera las búsquedas en una columna, a cambio de espacio y de escrituras algo más lentas. |
| Inyección SQL | | bd | Ataque que mete código SQL en un campo de texto cuando la aplicación pega ese texto dentro de la consulta. |
| JOIN | | bd | Operación de SQL que combina filas de varias tablas relacionadas. |
| Normalización | | bd | Organizar las tablas para que cada dato esté en un solo sitio y no haya duplicados. |
| NoSQL | | bd | Bases de datos no relacionales: de documentos, clave-valor, columnas o grafos. |
| ACID | | bd | Propiedades de una transacción fiable: atomicidad, consistencia, aislamiento y durabilidad. |
| SQL | | bd | Lenguaje estándar para consultar y modificar bases de datos relacionales. |
| Transacción | transacciones | bd | Grupo de operaciones que se aplican todas o ninguna (COMMIT o ROLLBACK). |
| Vista | | bd | Consulta guardada con nombre que se usa como si fuera una tabla. |
| Algoritmo | algoritmos | prog | Secuencia de pasos bien definida para resolver un problema. |
| API | APIs | prog | Interfaz que permite que un programa use las funciones o los datos de otro. |
| Bucle | bucles | prog | Estructura que repite un bloque de código mientras se cumpla una condición o para cada elemento de una lista. |
| Clase | | prog | Plantilla que define los datos y el comportamiento de un tipo de objeto. |
| Compilador | | prog | Programa que traduce todo el código fuente a código máquina antes de ejecutarlo. |
| Depurar | depuración | prog | Encontrar y corregir errores en un programa. |
| Diccionario | diccionarios | prog | Estructura que guarda pares clave-valor, por ejemplo {"ssh": 22}. |
| Excepción | excepciones | prog | Error que ocurre durante la ejecución y que el programa puede capturar con try/except. |
| Framework | frameworks | prog | Conjunto de herramientas y reglas sobre el que se construye una aplicación, por ejemplo Django o React. |
| Función | funciones | prog | Bloque de código con nombre que recibe datos, hace algo y puede devolver un resultado. |
| Git | | prog | Sistema de control de versiones: guarda el historial de cambios del código. |
| HTTP | HTTPS | prog | Protocolo de la web. HTTPS es HTTP cifrado con TLS. |
| JSON | | prog | Formato de texto para intercambiar datos estructurados, muy usado por las APIs. |
| Librería | librerías, biblioteca | prog | Código ya escrito que se reutiliza en otros programas. |
| Pull request | | prog | Petición para incorporar los cambios de una rama a otra, donde el equipo los revisa antes. |
| Rama | ramas | prog | Línea de trabajo independiente en Git para desarrollar algo sin afectar a la rama principal. |
| REST | | prog | Estilo de API web que usa URL para los recursos y los métodos HTTP GET, POST, PUT y DELETE. |
| Variable | variables | prog | Nombre que guarda un valor que el programa puede leer y cambiar. |
| Active Directory | AD | ti | Servicio de directorio de Windows que gestiona usuarios, equipos, grupos y permisos de una empresa. |
| Base de conocimiento | | ti | Colección de artículos con soluciones documentadas para resolver más rápido los problemas repetidos. |
| Directiva de grupo | directivas de grupo, GPO | ti | Configuración que Active Directory aplica automáticamente a usuarios y equipos (fondos, unidades, seguridad). |
| Escalar | escalamiento | ti | Pasar un ticket al nivel o equipo que puede resolverlo cuando supera tus permisos o conocimientos. |
| Incidente | incidentes | ti | Interrupción o degradación de un servicio. El objetivo es restaurarlo cuanto antes. |
| ITIL | | ti | Marco de buenas prácticas para gestionar servicios de TI: incidentes, problemas, cambios, peticiones. |
| Malware | | ti | Programa malicioso: virus, troyanos, ransomware, spyware. |
| Mesa de ayuda | help desk | ti | Punto de contacto donde los usuarios reportan problemas y piden servicios de TI. |
| MFA | autenticación multifactor | ti | Verificación con dos o más factores: algo que sabes (contraseña), algo que tienes (móvil) o algo que eres (huella). |
| Phishing | | ti | Engaño por correo o mensaje que suplanta a alguien de confianza para robar contraseñas, dinero o instalar malware. |
| Ransomware | | ti | Malware que cifra los archivos y pide un rescate para devolverlos. |
| SLA | | ti | Acuerdo de nivel de servicio: tiempos máximos comprometidos para responder y resolver. |
| Spooler | cola de impresión | ti | Servicio de Windows que gestiona los trabajos de impresión pendientes. |
| Ticket | tickets | ti | Registro de una incidencia o petición, con su estado, prioridad e historial. |
| Hash | hashes, función hash | sec | Huella de tamaño fijo calculada a partir de un texto. No se puede revertir; se usa para guardar contraseñas y comprobar que un archivo no ha cambiado. |
| Sal criptográfica | | sec | Valor aleatorio distinto para cada usuario que se añade a la contraseña antes de calcular el hash, para que contraseñas iguales den hashes distintos. |
| Cifrado simétrico | | sec | Cifrado en el que la misma clave cifra y descifra. Es rápido; el estándar es AES. |
| Cifrado asimétrico | criptografía asimétrica | sec | Cifrado con dos claves: una pública que se reparte y una privada que solo tiene su dueño. Ejemplos: RSA y curvas elípticas. |
| Firma digital | firmas digitales | sec | Hash de un documento cifrado con la clave privada de quien firma. Demuestra quién lo firmó y que no ha cambiado. |
| TLS | | sec | Protocolo que cifra y autentica conexiones; HTTPS es HTTP sobre TLS. Hoy se usan las versiones 1.2 y 1.3. |
| Certificado digital | certificados digitales | sec | Documento firmado por una autoridad de certificación que asocia un dominio o una persona con su clave pública. |
| DMZ | zona desmilitarizada | sec | Zona de red para los servidores publicados en Internet, separada de la LAN por el cortafuegos. |
| SIEM | | sec | Sistema que reúne y correlaciona los registros de muchos equipos y genera alertas de seguridad. |
| SOC | centro de operaciones de seguridad | sec | Equipo que vigila la seguridad de una organización, normalmente 24/7, revisando alertas y respondiendo a incidentes. |
| EDR | | sec | Protección de equipos que vigila el comportamiento de los procesos y permite investigar y aislar un equipo a distancia. |
| IDS | IPS, IDS/IPS | sec | Sistema que detecta patrones de ataque en el tráfico (IDS) o además los bloquea (IPS). |
| CVE | | sec | Identificador único de una vulnerabilidad publicada, por ejemplo CVE-2021-44228. |
| CVSS | | sec | Puntuación de 0 a 10 de la gravedad de una vulnerabilidad: baja, media, alta o crítica. |
| XSS | cross-site scripting | sec | Vulnerabilidad web que permite ejecutar un script malicioso en el navegador de otros usuarios. |
| OWASP | | sec | Comunidad abierta que publica guías de seguridad web y el Top 10 de riesgos de las aplicaciones. |
| Fuerza bruta | ataque de fuerza bruta | sec | Probar muchas contraseñas o claves hasta acertar. Se frena con contraseñas largas, límites de intentos y MFA. |
| Ingeniería social | | sec | Engañar a las personas para que entreguen información o hagan algo que beneficia al atacante. |
| Base64 | | sec | Codificación que convierte datos en texto. No es cifrado: cualquiera la revierte. |
| Día cero | zero-day, vulnerabilidad de día cero | sec | Vulnerabilidad que se explota antes de que exista un parche. |
| Hardware | | base | Las piezas físicas de un equipo, las que se pueden tocar: procesador, memoria, disco, pantalla, teclado… |
| Software | | base | Los programas: instrucciones que le dicen al hardware qué hacer. El sistema operativo y las aplicaciones son software. |
| Procesador | CPU, procesadores | base | La pieza que ejecuta las instrucciones de los programas: el «cerebro» del ordenador. |
| Memoria RAM | RAM | base | Memoria rápida donde está lo que se usa en este momento. Se borra al apagar el equipo. |
| SSD | disco SSD, disco duro, HDD | base | El disco guarda los archivos aunque se apague el equipo. Un SSD es mucho más rápido que un disco duro tradicional (HDD). |
| Sistema operativo | sistemas operativos | base | El programa principal que hace funcionar el equipo y organiza los demás: Windows, macOS, Linux, Android o iOS. |
| Navegador | navegadores, navegador web | base | Programa para visitar páginas web, como Chrome, Edge, Firefox o Safari. |
| Extensión de archivo | extensiones de archivo | base | Lo que va después del último punto del nombre (.pdf, .docx, .jpg) e indica qué tipo de archivo es. |
| Bit | bits | base | La unidad más pequeña de información: un 0 o un 1. |
| Byte | bytes | base | Grupo de 8 bits. Los tamaños de archivo se miden en bytes: KB, MB, GB y TB. |
| Mbps | megabits por segundo | base | Unidad de velocidad de una conexión. Para pasar a megabytes por segundo se divide entre 8. |
| Almacenamiento en la nube | la nube, en la nube | base | Guardar archivos en servidores de internet (Google Drive, OneDrive, Dropbox) para tenerlos en cualquier dispositivo. |
| Servidor | servidores | base | Ordenador que da un servicio a otros, como una página web, el correo o los archivos compartidos. |
| URL | dirección web, direcciones web | base | La dirección de una página web, por ejemplo https://www.ejemplo.com/contacto. |
| Gestor de contraseñas | gestores de contraseñas | base | Programa que guarda tus contraseñas cifradas y las rellena por ti; solo hay que recordar una contraseña maestra. |
