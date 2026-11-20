---
area: redes
id: m0
titulo: Bienvenida
dominio: Introducción
peso: 0
descripcion: Cómo funciona el curso, qué es el CCNA y cómo montar tu laboratorio para practicar desde el primer día.
---
=== m0-curso | Cómo funciona este curso y qué necesitas | 10 | 1
Loopback es un curso **técnico**. Damos por hecho que ya manejas la computadora con soltura: archivos y carpetas, instalar programas, el navegador y el correo. A partir de ahí, cada área empieza por sus fundamentos técnicos y llega hasta el trabajo real de un profesional.

## Qué vas a hacer aquí

- **Leer documentación técnica**: tablas de comandos, salidas de consola, diagramas de red y fragmentos de código. Cuando aparezca un término que no conoces, pasa el mouse o toca la palabra subrayada con puntos: el **glosario** te da la definición sin salir de la lección.
- **Trabajar en la línea de comandos**: Cisco IOS en el simulador del curso, PowerShell y el terminal de Linux.
- **Diagnosticar averías**: los laboratorios no solo piden configurar, también encontrar qué está mal en una red que «no funciona».
- **Demostrar lo que sabes**: cada lección termina con un cuestionario (80 % para aprobar) y cada escalón con un examen.

## Cómo avanza el curso

| Pieza | Para qué sirve |
| --- | --- |
| **Escalones** | Grupos de lecciones del mismo nivel. Se abren en orden: no se puede saltar la base |
| **Examen de escalón** | Mínimo 80 %. Preguntas distintas en cada intento |
| **Laboratorios** | Prácticas que se corrigen solas: consola Cisco, SQL, código, casos de soporte |
| **Repaso de errores** | Lo que fallas vuelve con repetición espaciada (1, 3, 7, 14 y 30 días) |
| **Examen final y certificado** | Lo corrige el servidor; el certificado se puede verificar con su código |

Si ya tienes experiencia, haz el **examen de entrada**: convalida los escalones que dominas y te deja empezar en tu nivel.

## Tu equipo de trabajo

| Herramienta | Para qué | Dónde |
| --- | --- | --- |
| Cisco Packet Tracer | Simular redes completas con routers y switches Cisco | Gratis con una cuenta de Cisco Networking Academy (lección siguiente) |
| Terminal | PowerShell en Windows; en Linux o macOS, el terminal del sistema | Ya viene instalado |
| WSL o una máquina virtual | Practicar Linux sin cambiar tu sistema | WSL en Windows, o VirtualBox / Hyper-V |
| Visual Studio Code | Escribir código y archivos de configuración | Gratis |

Una computadora con 8 GB de RAM basta para todo el curso. Las máquinas virtuales agradecen 16 GB.

::: nota
La mayor parte de la documentación técnica está en **inglés**: comandos, mensajes de error, RFC y manuales de fabricantes. El área de **Inglés técnico** te prepara para leerla; no hace falta que lo hables con fluidez para empezar.
:::

::: quiz
? Ves una palabra subrayada con puntos en una lección y no sabes qué significa. ¿Qué haces?
+ Pasar el mouse o tocarla para ver su definición del glosario
- Saltarte la lección
- Esperar al examen final
= El glosario está integrado en las lecciones para que nunca te quedes atascado en un término.

? ¿Qué nota mínima abre la lección siguiente y el escalón siguiente?
- 50 %
- 65 %
+ 80 %
= Es el mismo criterio en cuestionarios y exámenes de escalón.

? Ya trabajas con switches y routers. ¿Cuál es la forma más rápida de empezar en tu nivel?
+ Hacer el examen de entrada de Redes para convalidar los escalones que dominas
- Empezar por la primera lección y saltarte los cuestionarios
- Ir directamente al examen final
= El examen de entrada convalida escalones completos según tu resultado.
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
