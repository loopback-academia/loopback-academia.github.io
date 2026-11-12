---
area: sec
id: c2
titulo: Defensa de redes y aplicaciones
dominio: Defensa
peso: 0
descripcion: Criptografía simétrica y asimétrica, firmas, HTTPS y certificados, cortafuegos y segmentación con DMZ, vulnerabilidades web del OWASP Top 10 y la gestión de vulnerabilidades con CVE, CVSS y parches.
---

=== c2-cripto | Criptografía: simétrica, asimétrica y firmas | 18 | 2
La criptografía protege la **confidencialidad** (que nadie lea), la **integridad** (que nadie cambie) y la **autenticidad** (saber quién lo envía).

## Cifrado simétrico

Una **misma clave** cifra y descifra. Es muy rápido; el estándar es **AES**. Problema: ¿cómo compartes la clave con alguien sin que la intercepten?

## Cifrado asimétrico

Cada persona tiene **dos claves** relacionadas:

- **Pública**: se reparte a cualquiera.
- **Privada**: nunca sale de su dueño.

Lo que se cifra con una solo se descifra con la otra. Algoritmos: **RSA** y curvas elípticas (**ECC**). Es mucho más lento que el simétrico.

| Quiero… | Uso… |
|---|---|
| Que solo Bruno lea mi mensaje | La clave **pública de Bruno** para cifrar |
| Demostrar que el documento es mío | Mi clave **privada** para firmar |
| Comprobar la firma de Ana | La clave **pública de Ana** |

## En la práctica, las dos juntas

Protocolos como HTTPS o una VPN usan la asimétrica para **acordar una clave de sesión** con alguien desconocido, y después la simétrica (AES) para cifrar todo el tráfico rápido.

## Firmas digitales

Se calcula el **hash** del documento y se cifra con la **clave privada** de quien firma. Quien lo recibe descifra con la pública y compara hashes: si coinciden, el documento no ha cambiado y lo firmó quien tiene esa privada.

## Codificar no es cifrar

**Base64** convierte datos binarios en texto para transportarlos. No tiene clave: cualquiera lo revierte. Ver una contraseña en Base64 en un script es tan grave como verla en claro.

[[cripto:retos]]

::: quiz
? Con criptografía asimétrica, ¿con qué clave cifras un mensaje para Bruno?
+ Con la clave pública de Bruno
- Con tu clave privada
- Con la clave privada de Bruno
- Con tu clave pública
= Solo la privada de Bruno lo descifra.

? ¿Por qué HTTPS no usa solo criptografía asimétrica?
+ Es mucho más lenta: se usa para acordar una clave y AES cifra los datos
- Porque no es segura
- Porque los navegadores no la soportan
= Cada tipo hace lo que mejor sabe.

? ¿Qué es Base64?
+ Una codificación sin clave, que cualquiera revierte
- Un cifrado simétrico
- Un hash
= Sirve para transportar datos, no para protegerlos.
:::

::: banco
? ¿Con qué clave firma Ana un documento?
+ Con su clave privada
- Con su clave pública
- Con la clave pública del receptor
= La firma se verifica después con la clave pública de Ana.

? ¿Cuál es un algoritmo de cifrado simétrico?
+ AES
- RSA
- SHA-256
= RSA es asimétrico y SHA-256 es un hash.

? ¿Qué problema tiene el cifrado simétrico?
+ Compartir la clave de forma segura con el otro extremo
- Que es muy lento
- Que no se puede descifrar
= La criptografía asimétrica resuelve ese intercambio.

? ¿Qué garantiza una firma digital?
+ Que el documento no se ha modificado y quién lo firmó
- Que nadie más puede leerlo
- Que el documento es gratuito
= Integridad y autenticidad; la confidencialidad la da el cifrado.

? ¿Qué clave nunca debe salir de su dueño?
+ La clave privada
- La clave pública
- Ninguna
= Si se filtra la privada, cualquiera puede firmar o descifrar en su nombre.
:::

=== c2-tls | HTTPS, certificados y TLS | 14 | 2
**HTTPS** es HTTP dentro de un túnel **TLS**. Protege tres cosas: que nadie lea el tráfico, que nadie lo modifique y que hables con el servidor auténtico.

## El certificado

El servidor presenta un **certificado digital** que contiene su dominio y su clave pública, **firmado por una autoridad de certificación (CA)** en la que confía tu navegador o sistema. Así se evita que un impostor se haga pasar por `banco.com`.

El navegador comprueba:

- Que el certificado es para **ese dominio** exacto.
- Que **no ha caducado**.
- Que lo firmó una **CA de confianza** (cadena de confianza).

Si algo falla, muestra un aviso de seguridad. **No lo ignores** en webs donde vas a escribir datos.

## Qué NO garantiza el candado

El candado solo dice que la conexión está cifrada con **ese dominio**. Una web de phishing puede tener HTTPS perfectamente: `micros0ft-login.com` también consigue certificados gratuitos. Mira siempre el **dominio**.

## En la empresa

- Todos los servicios internos y externos con HTTPS; HTTP solo para redirigir a HTTPS.
- Versiones antiguas desactivadas: SSL, TLS 1.0 y 1.1. Se usan **TLS 1.2 y 1.3**.
- Vigilar la **caducidad** de los certificados: un certificado caducado tumba un servicio.
- Algunas empresas inspeccionan el tráfico TLS en el cortafuegos con su propia CA instalada en los equipos: debe estar informado en la política de uso.

::: quiz
? ¿Qué garantiza el candado de HTTPS?
+ Que la conexión está cifrada con el dominio que aparece en la barra
- Que la web es honrada
- Que la web no tiene virus
= Las webs de phishing también tienen HTTPS.

? ¿Quién firma el certificado de un servidor web?
+ Una autoridad de certificación (CA) de confianza
- El propio navegador
- El usuario
= Es la base de la cadena de confianza.

? ¿Qué versiones de TLS deberían usarse hoy?
+ TLS 1.2 y TLS 1.3
- SSL 3.0
- TLS 1.0
= Las antiguas tienen fallos conocidos.
:::

::: banco
? Un servicio interno deja de funcionar y el navegador avisa de «certificado caducado». ¿Qué pasó?
+ No se renovó el certificado a tiempo
- Hay un virus en el servidor
- El cable de red está roto
= Por eso se vigila y se automatiza la renovación.

? ¿Qué contiene un certificado de servidor?
+ El dominio, la clave pública del servidor y la firma de la CA
- La clave privada del servidor
- La contraseña del administrador
= La clave privada nunca se incluye en el certificado.

? ¿Qué protocolo hay debajo de HTTPS?
+ TLS
- FTP
- SMTP
= HTTPS = HTTP sobre TLS.

? El navegador avisa de que el certificado no corresponde al dominio en la web de tu banco. ¿Qué haces?
+ No continuar y avisar: puede ser una suplantación
- Aceptar el riesgo y seguir
- Desactivar los avisos
= Es justo el ataque que el certificado intenta evitar.
:::

=== c2-firewall | Cortafuegos y segmentación | 18 | 2
Un **cortafuegos** (firewall) decide qué tráfico pasa entre zonas de red según **reglas**.

## Cómo se evalúan las reglas

- Se revisan **de arriba abajo** y se aplica la **primera que coincide**.
- Al final hay una regla implícita: **denegar todo**.
- Cada regla indica acción (permitir o denegar), protocolo, origen, destino y puerto.

El orden importa: una regla general («permitir todo») arriba anula todas las de debajo.

## Con estado

Los cortafuegos actuales son **con estado** (*stateful*): recuerdan las conexiones permitidas y dejan volver sus respuestas automáticamente. No hace falta una regla para el tráfico de vuelta.

## Mínimo privilegio

Se permite **solo lo necesario** y todo lo demás queda denegado. Por ejemplo, en una oficina: web (80/443) y DNS (53) hacia Internet, y nada entrante desde Internet.

## Segmentación y DMZ

Separar la red en **zonas** limita lo que un atacante puede alcanzar si entra:

- **LAN**: los empleados.
- **DMZ**: los servidores publicados en Internet (web, correo). Si comprometen uno, el cortafuegos le impide llegar a la LAN.
- **Invitados**, **IoT**, **cámaras**…: cada uno en su VLAN y con sus reglas.

## Más allá del cortafuegos clásico

- **NGFW** (cortafuegos de nueva generación): entiende aplicaciones y usuarios, no solo puertos.
- **WAF**: protege aplicaciones web frente a inyecciones y otros ataques.
- **IDS/IPS**: detectan (y en el caso del IPS, bloquean) patrones de ataque.

[[fw:oficina]]

[[fw:dmz]]

::: quiz
? Un cortafuegos tiene arriba «permitir todo» y debajo «denegar SSH desde Internet». ¿Qué pasa con SSH desde Internet?
+ Pasa: se aplica la primera regla que coincide
- Se bloquea: las denegaciones tienen prioridad
- Depende del día
= El orden de las reglas importa.

? ¿Qué es una DMZ?
+ Una zona para los servidores publicados en Internet, separada de la LAN
- La red de los invitados
- Un tipo de cable
= Si comprometen un servidor de la DMZ, no llega directamente a la LAN.

? ¿Hace falta una regla para que vuelvan las respuestas de una navegación permitida en un cortafuegos con estado?
+ No, recuerda la conexión y deja volver las respuestas
- Sí, una por cada web
- Sí, permitir todo lo entrante
= Es lo que significa *stateful*.
:::

::: banco
? ¿Qué hace la regla implícita al final de un cortafuegos?
+ Deniega todo lo que no coincide con ninguna regla anterior
- Permite todo lo demás
- Reinicia el cortafuegos
= Es la base del mínimo privilegio.

? ¿Qué puerto usa el escritorio remoto de Windows (RDP)?
+ 3389
- 22
- 443
= Exponer RDP a Internet es una de las vías de entrada de ransomware más comunes.

? ¿Qué protege un WAF?
+ Aplicaciones web frente a inyección SQL, XSS y ataques similares
- El Wi-Fi de la oficina
- Los discos frente a fallos
= Web Application Firewall.

? ¿Por qué poner las cámaras IP en una VLAN propia?
+ Para que, si las comprometen, no lleguen al resto de la red
- Para que graben mejor
- Porque lo exige la ley
= Los dispositivos IoT suelen ser poco seguros.

? ¿Qué diferencia hay entre IDS e IPS?
+ El IDS detecta y avisa; el IPS además bloquea
- Ninguna
- El IPS es solo para Wi-Fi
= El IPS va en línea con el tráfico.
:::

=== c2-web | Vulnerabilidades web: OWASP Top 10 | 18 | 2
**OWASP** es una comunidad abierta que publica el **Top 10** de riesgos de las aplicaciones web. Estos son los que más aparecen en la práctica:

## Inyección (SQL y otras)

La aplicación mete lo que escribe el usuario **dentro de una consulta**. Con `' OR '1'='1` el atacante cambia la lógica y puede saltarse el inicio de sesión o leer toda la base de datos.

**Defensa**: consultas **parametrizadas** (el dato nunca se mezcla con el código SQL), validación de entradas y una cuenta de base de datos con pocos permisos.

## Cross-site scripting (XSS)

La web muestra texto del usuario **sin escaparlo**, y un `<script>` malicioso se ejecuta en el navegador de otras personas (por ejemplo, para robar su sesión).

**Defensa**: escapar siempre la salida, no usar `innerHTML` con datos externos y una política **CSP** estricta.

## Control de acceso roto

Cambiando `?pedido=1001` por `?pedido=1002` ves el pedido de otro cliente. El servidor debe comprobar **en cada petición** que el usuario tiene derecho a ese dato.

## Otros clásicos

- **Recorrido de directorios**: `?archivo=../../etc/passwd` sale de la carpeta prevista.
- **Configuración insegura**: paneles de administración expuestos, errores que muestran detalles internos, contraseñas por defecto.
- **Componentes vulnerables**: librerías sin actualizar.
- **Fallos de autenticación**: sin límite de intentos, sin MFA, sesiones que no caducan.

[[sqli:login]]

::: quiz
? ¿Cuál es la defensa principal contra la inyección SQL?
+ Consultas parametrizadas
- Ocultar los errores
- Usar HTTPS
= El dato nunca se interpreta como código SQL.

? Cambias el número de pedido en la URL y ves el pedido de otra persona. ¿Qué vulnerabilidad es?
+ Control de acceso roto
- XSS
- Inyección SQL
= El servidor no comprueba que el pedido sea tuyo.

? ¿Qué es el XSS?
+ Hacer que un script malicioso se ejecute en el navegador de otros usuarios
- Un ataque al cortafuegos
- Un virus de Windows
= Se evita escapando la salida y con CSP.
:::

::: banco
? ¿Qué intenta la petición `/descargar?f=../../etc/passwd`?
+ Recorrido de directorios para leer un archivo del sistema
- Inyección SQL
- Fuerza bruta
= Los ../ suben de carpeta.

? ¿Qué es OWASP?
+ Una comunidad abierta que publica guías y el Top 10 de riesgos web
- Un antivirus
- Un protocolo de red
= Open Worldwide Application Security Project.

? ¿Por qué no mostrar los errores detallados de la base de datos al usuario?
+ Dan pistas al atacante sobre la estructura interna
- Porque ocupan mucho
- Porque son en inglés
= Se registran en el servidor, no se muestran.

? Una web permite intentos ilimitados de inicio de sesión. ¿Qué riesgo hay?
+ Ataques de fuerza bruta contra las contraseñas
- Ninguno
- Que se llene el disco
= Hay que limitar intentos y ofrecer MFA.

? ¿Qué es una CSP?
+ Una política del navegador que limita de dónde se cargan scripts y estilos
- Un tipo de cifrado
- Una base de datos
= Content Security Policy: frena mucho el XSS.
:::

=== c2-vulns | Gestión de vulnerabilidades: CVE, CVSS y parches | 14 | 2
Cada semana se publican cientos de vulnerabilidades. Gestionarlas bien es un **proceso continuo**, no una tarea que se hace una vez.

## CVE y CVSS

- **CVE**: identificador único de una vulnerabilidad pública, por ejemplo `CVE-2021-44228` (Log4Shell).
- **CVSS**: puntuación de gravedad de **0 a 10**: baja (0,1-3,9), media (4-6,9), alta (7-8,9) y crítica (9-10). Tiene en cuenta si se ataca por red, si hace falta autenticación o interacción del usuario y el impacto.

## El ciclo

1. **Inventario**: no se puede proteger lo que no se sabe que existe.
2. **Escaneo**: herramientas que comparan versiones instaladas con vulnerabilidades conocidas.
3. **Priorización**: no solo la nota CVSS; también si está **expuesto a Internet**, si hay **explotación activa** (por ejemplo, el catálogo KEV de CISA) y lo crítico que es el sistema.
4. **Corrección**: aplicar el parche, o una mitigación temporal si no lo hay (desactivar la función, filtrar en el cortafuegos).
5. **Verificación**: volver a escanear.

## Parches sin romper nada

- Probar primero en un grupo pequeño de equipos.
- Ventanas de mantenimiento acordadas.
- Plan de **vuelta atrás**.
- Las críticas explotadas activamente, **cuanto antes**: días, no meses.

## Día cero

Una vulnerabilidad **de día cero** se explota antes de que exista parche. Ahí ayudan la defensa en profundidad, la segmentación y la detección.

::: quiz
? ¿Qué es un CVE?
+ El identificador único de una vulnerabilidad publicada
- Un antivirus
- Una puntuación de 0 a 10
= La puntuación es CVSS.

? Una vulnerabilidad tiene CVSS 9,8. ¿Cómo se clasifica?
+ Crítica
- Media
- Baja
= De 9 a 10 es crítica.

? Dos vulnerabilidades con CVSS 7,5: una en un servidor expuesto a Internet y explotada activamente, otra en un equipo aislado. ¿Cuál parcheas primero?
+ La del servidor expuesto y explotada activamente
- La del equipo aislado
- Da igual, tienen la misma nota
= La nota es solo un factor: la exposición y la explotación real cuentan mucho.
:::

::: banco
? ¿Qué es una vulnerabilidad de día cero?
+ Una que se explota antes de que exista un parche
- Una que se descubre el día 1 de cada mes
- Una sin importancia
= Por eso no basta con parchear: hay que segmentar y detectar.

? ¿Cuál es el primer paso de la gestión de vulnerabilidades?
+ Tener un inventario de los equipos y programas
- Comprar un escáner caro
- Esperar a que avise el fabricante
= Lo que no está inventariado no se parchea.

? No hay parche todavía para una vulnerabilidad grave. ¿Qué puedes hacer?
+ Aplicar una mitigación: desactivar la función afectada o filtrar el acceso
- Nada hasta que salga el parche
- Apagar todos los servidores
= Las mitigaciones reducen el riesgo mientras tanto.

? ¿Por qué probar los parches en un grupo pequeño antes de desplegarlos?
+ Para detectar si rompen algo antes de afectar a toda la empresa
- Porque los parches caducan
- Porque lo exige el antivirus
= Siempre con un plan de vuelta atrás.
:::
