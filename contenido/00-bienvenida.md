---
area: redes
id: m0
titulo: Bienvenida
dominio: Introducción
peso: 0
descripcion: Cómo funciona el curso, qué es el CCNA y cómo montar tu laboratorio para practicar desde el primer día.
---
=== m0-curso | Cómo aprovechar este curso | 8 | 1
Bienvenido a **Loopback**. Este curso te lleva desde cero hasta el nivel que pide el examen **Cisco CCNA 200-301**, la certificación de redes más solicitada en las ofertas de empleo de Latinoamérica y España. Además de esta área de **Redes**, la plataforma tiene otras dos completas: **Bases de datos** y **Programación**, cada una con su ruta por niveles. Las tres se complementan: un buen profesional de redes hoy consulta bases de datos y automatiza con Python.

::: nota
¿Empiezas de cero en tecnología? Antes de esta área, haz el área [🚀 Empieza aquí](./curso.html?area=base): en lenguaje sencillo, lo básico de la computadora, internet y las profesiones de la tecnología.
:::

## Cómo está organizado

El temario sigue los seis dominios oficiales del examen, con el mismo peso que tienen en él:

| Módulo | Dominio del CCNA | Peso en el examen |
|---|---|---|
| 1. Fundamentos de redes | Network Fundamentals | 20 % |
| 2. Acceso a la red | Network Access | 20 % |
| 3. Conectividad IP | IP Connectivity | 25 % |
| 4. Servicios IP | IP Services | 10 % |
| 5. Fundamentos de seguridad | Security Fundamentals | 15 % |
| 6. Automatización y programabilidad | Automation and Programmability | 10 % |

Cada lección tiene tres partes: la **explicación** (con animaciones paso a paso cuando el tema lo merece), un **cuestionario** corto para comprobar que lo entendiste y, cuando aplica, un **laboratorio** donde escribes comandos de verdad.

## La forma correcta de estudiar redes

- **Entiende antes de memorizar.** El examen no pregunta definiciones sueltas: pone escenarios. Si sabes *por qué* un switch inunda una trama, contestarás bien aunque la pregunta esté redactada de otra forma.
- **Practica a diario la parte numérica.** El subnetting se aprende con repetición. Dedica 10 minutos al día al entrenador de subnetting hasta que lo hagas de cabeza.
- **Escribe comandos.** Leer `switchport mode access` no es lo mismo que teclearlo. Usa el simulador de CLI y, cuando puedas, Packet Tracer.
- **Busca tus dudas.** Desde cualquier lección, el botón "Buscar en el curso" te lleva al punto exacto donde se explica lo que no entiendes.

::: examen
El CCNA 200-301 dura **120 minutos** y tiene entre 100 y 120 preguntas: de opción múltiple, de arrastrar y soltar, de simulación y de laboratorio. No se puede volver a una pregunta ya contestada, así que hay que llegar con soltura, no solo con conocimiento.
:::

## Tu progreso

Al completar una lección, aprobar su cuestionario o terminar un laboratorio, tu progreso se guarda en tu cuenta y lo ves en el panel del curso. Para presentarte al examen con garantías, apunta a terminar todo el temario y a sacar **más del 85 %** en dos simulacros de examen seguidos.

::: quiz
? ¿Cuál es el dominio con más peso en el examen CCNA 200-301?
- Fundamentos de redes
+ Conectividad IP
- Fundamentos de seguridad
- Automatización y programabilidad
= Conectividad IP (enrutamiento, OSPF, rutas estáticas, FHRP) pesa un 25 %, el máximo de los seis dominios.

? ¿Cuál es la mejor forma de dominar el subnetting?
- Memorizar una tabla de máscaras la noche antes del examen
+ Practicar un poco cada día hasta hacerlo de cabeza
- Usar siempre una calculadora en línea
= En el examen no hay calculadora de subredes: hay que resolverlo mentalmente y rápido, y eso solo se consigue con práctica diaria.

? ¿Se puede volver a una pregunta ya respondida durante el examen CCNA?
- Sí, al final hay una pantalla de revisión
+ No, cada respuesta es definitiva
= El examen de Cisco no permite volver atrás, por eso conviene llegar con práctica de tiempo en el simulador de examen.
:::

=== m0-packet-tracer | Instala Cisco Packet Tracer paso a paso | 20 | 1
**Cisco Packet Tracer** es un programa **gratuito** de Cisco que simula routers, switches, computadoras y cables en tu computadora. Con él montas redes completas sin comprar ningún equipo. En esta web tienes un simulador para practicar los comandos; Packet Tracer te permite además **dibujar la red entera, conectar cables y probarla**, igual que en una empresa. Lo usan los estudiantes de redes de todo el mundo.

::: nota
**No necesitas saber nada para instalarlo.** Sigue los pasos en orden y ve marcándolos en la lista del final de la lección. Tardarás unos 20 minutos, la mayor parte esperando a que se descargue.
:::

## Antes de empezar: qué necesitas

| Necesitas | Detalle |
|---|---|
| Una computadora | Windows 10 u 11 de 64 bits, macOS o Linux Ubuntu. **No hay versión para celular, tableta ni Chromebook**: si solo tienes celular, practica con el simulador de esta web. |
| Espacio libre | Unos 2 GB en el disco |
| Un correo electrónico | Para crear la cuenta gratuita |
| Conexión a Internet | Para descargarlo e iniciar sesión la primera vez |

## Paso 1: crea tu cuenta gratuita en Cisco Networking Academy

Packet Tracer se descarga desde **Cisco Networking Academy**, la plataforma educativa oficial de Cisco.

1. Entra en **[netacad.com](https://www.netacad.com/)**.
2. Haz clic en **Sign up** (Registrarse). Si la página está en inglés, puedes cambiar el idioma abajo del todo.
3. Escribe tu nombre, tu correo y una contraseña, y acepta las condiciones.
4. Abre tu correo y haz clic en el enlace de confirmación que te envían (si no aparece, mira en **spam**).

## Paso 2: inscríbete en el curso gratuito de Packet Tracer

1. Ve a la página oficial de Packet Tracer: **[netacad.com/cisco-packet-tracer](https://www.netacad.com/cisco-packet-tracer)**.
2. Busca el curso **Getting Started with Cisco Packet Tracer** (gratuito, a tu ritmo) y haz clic en **Get started** o **Enroll** (Inscribirse).
3. Inicia sesión con la cuenta que acabas de crear si te lo pide.

Inscribirte en ese curso es lo que te da acceso a la descarga. Además, el curso es un buen complemento para aprender a manejar el programa.

## Paso 3: descarga el instalador

1. Dentro del curso, o en el menú **Resources → Download Packet Tracer** de Networking Academy, busca la sección de descarga.
2. Elige tu sistema:
   - **Windows:** *Windows Desktop Version 64-bit* (un archivo `.exe`).
   - **macOS:** *macOS Version* (un archivo `.dmg`).
   - **Linux:** *Ubuntu Desktop Version 64-bit* (un archivo `.deb`).
3. Espera a que termine la descarga (pesa varios cientos de MB).

::: cuidado
Descárgalo **solo desde netacad.com**. Las páginas que ofrecen Packet Tracer «sin cuenta» o «crackeado» suelen esconder virus. El programa original es gratis: no hay ningún motivo para bajarlo de otro sitio.
:::

## Paso 4: instálalo

- **Windows:** abre la carpeta **Descargas**, haz doble clic en el archivo `.exe`, presiona **Sí** si Windows pregunta si permites cambios, acepta la licencia (*I accept the agreement*) y presiona **Next** hasta **Install** y después **Finish**.
- **macOS:** abre el `.dmg`, haz doble clic en el instalador y sigue los pasos. Si macOS dice que no puede abrirlo, ve a **Configuración del Sistema → Privacidad y seguridad** y presiona **Abrir igualmente**.
- **Ubuntu:** abre una terminal en la carpeta de descargas y escribe `sudo apt install ./` seguido del nombre del archivo `.deb`.

## Paso 5: ábrelo e inicia sesión

La primera vez, Packet Tracer pide que inicies sesión con tu cuenta de **Networking Academy** (la del paso 1). Marca la opción para mantener la sesión iniciada y no tener que hacerlo cada vez.

## Conoce la pantalla

| Zona | Dónde está | Para qué sirve |
|---|---|---|
| Área de trabajo | El gran espacio en blanco del centro | Ahí colocas los equipos y dibujas tu red |
| Tipos de equipo | Abajo a la izquierda | Routers, switches, PC (End Devices), servidores… Presiona una categoría y arrastra el modelo al área de trabajo |
| Conexiones (icono del rayo) | En la misma barra de abajo | Los cables. El directo (línea negra continua) sirve para PC↔switch y switch↔router |
| Pestañas del equipo | Al hacer clic en un equipo | **Physical** (el aparato), **Config** (menús) y **CLI** (la consola, igual que la de esta web) |
| Escritorio del PC | PC → pestaña **Desktop** | **IP Configuration** para ponerle IP y **Command Prompt** para hacer ping |
| Realtime / Simulation | Abajo a la derecha | En Simulation puedes ver los paquetes viajar paso a paso |

## Tu primera red en Packet Tracer (10 minutos)

1. En la barra de abajo presiona **Network Devices → Switches** y arrastra un **2960** al área de trabajo.
2. Presiona **End Devices** y arrastra **dos PC**.
3. Presiona el icono del **rayo** (Connections), elige el cable **Copper Straight-Through** (línea negra continua), haz clic en el primer PC → **FastEthernet0**, y después en el switch → **FastEthernet0/1**. Repite con el segundo PC → **FastEthernet0/2**.
4. Espera a que los triángulos de los cables pasen de naranja a **verde** (unos 30 segundos).
5. Haz clic en el primer PC → **Desktop → IP Configuration** y escribe: IP `192.168.1.10`, máscara `255.255.255.0`. En el segundo PC: `192.168.1.11` y la misma máscara.
6. En el primer PC abre **Desktop → Command Prompt** y escribe `ping 192.168.1.11`. Si ves **Reply from 192.168.1.11**, tu red funciona correctamente.
7. Ahora haz clic en el switch → pestaña **CLI**, presiona Enter y escribe `enable`, `configure terminal` y `hostname SW-CASA`. Igual que en el simulador de la web.
8. Guarda tu trabajo con **File → Save As**. Esos archivos `.pkt` son tu portafolio.

## Problemas frecuentes

| Problema | Solución |
|---|---|
| No me llega el correo de confirmación | Mira en spam. Si no está, vuelve a pedirlo desde netacad.com |
| No encuentro el botón de descarga | Asegúrate de haber iniciado sesión y de estar inscrito en *Getting Started with Cisco Packet Tracer* |
| Los triángulos del cable se quedan en naranja | Es normal durante unos 30 segundos (el switch comprueba que no haya bucles). Espera |
| Los triángulos se ponen en rojo | El cable no es el correcto o el puerto está apagado. En un router, entra en la interfaz y escribe `no shutdown` |
| El primer ping pierde un paquete | Es normal: el PC tiene que averiguar primero la MAC del otro (ARP). Repite el ping |
| Mi computadora es un Chromebook o solo tengo celular | Packet Tracer no funciona ahí. Haz todas las prácticas en el simulador de esta web y, cuando puedas, usa una computadora de un centro de estudios o una biblioteca |

[[lista:pt-instalar]]

::: quiz
? ¿Desde dónde se descarga Cisco Packet Tracer de forma segura?
- Desde cualquier web que lo ofrezca gratis
+ Desde Cisco Networking Academy (netacad.com), con una cuenta gratuita
- Desde la tienda de aplicaciones del celular
= El programa oficial es gratuito y se descarga desde Networking Academy. Las copias de otras webs pueden traer virus.

? ¿Qué pestaña de un switch en Packet Tracer abre la consola donde se escriben los comandos?
- Physical
- Config
+ CLI
- Desktop
= CLI (Command Line Interface) es la consola, igual que la del simulador de esta web. Desktop solo existe en los PC.

? Conectas un PC a un switch y el triángulo del cable está naranja. ¿Qué haces?
+ Esperar unos 30 segundos: es normal mientras el switch comprueba que no haya bucles
- Cambiar el cable inmediatamente
- Reinstalar Packet Tracer
= El puerto pasa unos segundos en escucha (Spanning Tree) antes de reenviar tráfico. Luego se pone verde.

? ¿Dónde se configura la dirección IP de un PC en Packet Tracer?
- En la pestaña CLI del switch
+ En el PC, pestaña Desktop → IP Configuration
- En el menú File
= Los PC se configuran desde su escritorio (Desktop): IP Configuration para la IP y Command Prompt para hacer ping.
:::

=== m0-laboratorio | Prepara tu laboratorio | 10 | 1
Las redes se aprenden tocando equipos. No hace falta comprar nada: hay herramientas gratuitas que simulan routers y switches Cisco.

## Las herramientas

| Herramienta | Qué es | Para qué usarla |
|---|---|---|
| Simulador de este curso | Consola IOS en el navegador | Laboratorios guiados con corrección automática |
| Cisco Packet Tracer | Simulador gratuito de Cisco (cuenta en Cisco Networking Academy) | Topologías completas, el que más se parece al examen |
| GNS3 / EVE-NG | Emuladores con imágenes reales de IOS | Nivel avanzado, requiere imágenes con licencia |
| Cisco Modeling Labs (CML) | Emulador oficial de pago | Preparación profesional y certificaciones superiores |

## Instalar Packet Tracer

Tienes la guía completa, con el enlace oficial y cada clic explicado, en la lección **[Instala Cisco Packet Tracer paso a paso](./leccion.html?id=m0-packet-tracer)**. Cuando lo tengas:

::: practica
Abre Packet Tracer, arrastra dos PC y un switch 2960, conéctalos con cables directos (línea continua negra) y asigna a los PC las direcciones `192.168.1.10/24` y `192.168.1.11/24`. Haz `ping` de uno a otro desde el *Command Prompt*. Acabas de montar tu primera LAN.
:::

## La consola de un equipo Cisco

En la vida real te conectas a un equipo nuevo con un **cable de consola** (RJ-45 a USB o serie) y un programa de terminal (PuTTY, Tera Term o `screen`) a **9600 baudios, 8 bits, sin paridad, 1 bit de parada**. Cuando el equipo ya tiene IP, la gestión se hace por **SSH**.

[[apuntes:basico]]

[[cli:basico]]

::: quiz
? ¿Qué velocidad se usa por defecto para conectarse por consola a un equipo Cisco?
- 115200 baudios
+ 9600 baudios
- 19200 baudios
- 1 Gbps
= La consola de los equipos Cisco usa por defecto 9600 baudios, 8 bits de datos, sin paridad y 1 bit de parada (9600 8N1).

? ¿Qué herramienta gratuita de Cisco permite simular topologías completas de routers y switches?
+ Packet Tracer
- Wireshark
- PuTTY
- Cisco Modeling Labs
= Packet Tracer es gratuito con una cuenta de Networking Academy. Cisco Modeling Labs es de pago y Wireshark es un analizador de tráfico, no un simulador.

? Una vez que el equipo tiene dirección IP, ¿cuál es el método recomendado para administrarlo en remoto?
- Telnet
+ SSH
- La consola
- HTTP
= SSH cifra toda la sesión, incluida la contraseña. Telnet y HTTP viajan en texto plano.
:::
