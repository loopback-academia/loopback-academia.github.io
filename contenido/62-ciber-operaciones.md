---
area: sec
id: c3
titulo: Operaciones de seguridad y respuesta a incidentes
dominio: Operaciones
peso: 0
descripcion: Registros y detección, SIEM, IDS y el trabajo en un centro de operaciones de seguridad (SOC), respuesta a incidentes paso a paso, marcos y normas (NIST, ISO 27001, protección de datos) y cómo empezar una carrera en ciberseguridad.
---

=== c3-logs | Registros: la memoria de los sistemas | 18 | 3
Casi todo lo que pasa en un sistema deja rastro en un **registro** (log). Saber leerlos es la habilidad básica de quien defiende.

## Registros que más se consultan

| Registro | Qué cuenta |
|---|---|
| `/var/log/auth.log` (Linux) | Inicios de sesión, SSH, sudo |
| Visor de eventos de Windows | 4624 inicio correcto, 4625 fallido, 4720 cuenta creada, 4732 añadido a grupo |
| Registro de accesos web | Cada petición: IP, fecha, ruta, código de respuesta, navegador |
| Cortafuegos | Conexiones permitidas y bloqueadas |
| Proxy / DNS | Qué webs y dominios se consultan |

## Señales de alerta

- **Muchos fallos seguidos** desde la misma IP → fuerza bruta. Y, peor, un **acierto** después.
- Inicios de sesión a **horas raras** o desde **países** donde no hay empleados.
- **Cuentas nuevas** o añadidas al grupo de administradores sin ticket.
- En la web: muchos **404** seguidos (escaneo), comillas y `UNION SELECT` (inyección), `../` (recorrido de directorios).
- Herramientas en el User-Agent: `sqlmap`, `nikto`, `curl` donde no se esperan.

## Buenas prácticas

- **Centralizar** los registros en otro sistema: un atacante que entra suele borrar los locales.
- Mantener la **hora sincronizada** (NTP) en todos los equipos: sin eso, no se puede reconstruir la línea de tiempo.
- Definir cuánto tiempo se **conservan** según la ley y las necesidades.

[[logs:ssh]]

::: quiz
? En auth.log ves 40 «Failed password» desde la misma IP en un minuto y luego «Accepted password». ¿Qué ha pasado?
+ Un ataque de fuerza bruta que ha conseguido entrar
- Un usuario que olvidó su contraseña
- Un fallo del disco
= El acierto final es lo más grave: hay que actuar ya.

? ¿Por qué centralizar los registros en otro sistema?
+ Porque un atacante que entra suele borrar los registros locales
- Para que ocupen menos
- Porque es obligatorio en Linux
= Así se conservan las pruebas.

? ¿Qué evento de Windows indica un inicio de sesión fallido?
+ 4625
- 4624
- 4720
= 4624 es correcto y 4720 es cuenta creada.
:::

::: banco
? ¿Por qué es importante que todos los equipos tengan la hora sincronizada?
+ Para poder reconstruir el orden real de los hechos entre sistemas
- Para que funcione el antivirus
- Para ahorrar batería
= Se usa NTP.

? Muchos códigos 404 seguidos desde la misma IP en el registro web suelen indicar…
+ Un escaneo en busca de archivos o paneles olvidados
- Un cliente que compra mucho
- Que el servidor está apagado
= Buscan /admin, /.env, /backup.zip…

? ¿Qué cuenta un registro de accesos web en cada línea?
+ IP, fecha, método y ruta, código de respuesta, tamaño y navegador
- La contraseña del usuario
- El contenido completo de la página
= Es el formato combinado de Apache y Nginx.

? Un usuario de Madrid inicia sesión a las 3:00 desde otro continente. ¿Qué haces?
+ Investigarlo como posible cuenta comprometida
- Nada, puede ser normal
- Borrar el registro
= Es un «viaje imposible», una alerta clásica.
:::

=== c3-soc | SIEM, IDS y el centro de operaciones (SOC) | 16 | 3
Una empresa mediana genera millones de líneas de registro al día. Nadie puede leerlas a mano: para eso están el **SIEM** y el **SOC**.

## SIEM

Un **SIEM** recoge los registros de todos los sistemas, los **normaliza**, los **correlaciona** y lanza **alertas** con reglas como:

- «5 inicios fallidos y 1 correcto desde la misma IP en 10 minutos».
- «Cuenta añadida al grupo Administradores del dominio».
- «Equipo que contacta con un dominio de una lista de amenazas».

Ejemplos: Microsoft Sentinel, Splunk, Elastic, Wazuh (de código abierto).

## IDS / IPS y EDR

- **IDS/IPS de red**: analizan el tráfico buscando firmas de ataques (Snort, Suricata).
- **EDR**: vigila procesos y comportamiento en cada equipo y permite aislarlo a distancia.
- **XDR**: une varias fuentes (equipos, correo, nube) en un solo análisis.

## El SOC

El **centro de operaciones de seguridad** vigila 24/7. Se organiza por niveles:

- **Nivel 1 (analista)**: revisa alertas, descarta falsos positivos y escala lo real. Es el puesto de entrada más habitual.
- **Nivel 2**: investiga a fondo y contiene incidentes.
- **Nivel 3 / threat hunting**: busca amenazas que no han generado alertas y mejora las reglas.

## Falsos positivos

Una alerta que no es un ataque real es un **falso positivo**. Demasiados causan **fatiga de alertas** y hacen que se escape lo importante; por eso se **ajustan** las reglas continuamente. Un **falso negativo** (un ataque que no salta) es todavía peor.

[[logs:web]]

::: quiz
? ¿Qué hace un SIEM?
+ Reúne y correlaciona registros de muchos sistemas y genera alertas
- Cifra los discos
- Bloquea el phishing en el correo
= Es el centro del trabajo de un SOC.

? ¿Qué hace un analista de nivel 1 de un SOC?
+ Revisa las alertas, descarta falsos positivos y escala lo que es real
- Programa el antivirus
- Diseña la red de la empresa
= Es el puesto de entrada más habitual en ciberseguridad.

? ¿Qué es un falso positivo?
+ Una alerta que no corresponde a un ataque real
- Un ataque que no genera alerta
- Un antivirus caducado
= Un ataque sin alerta es un falso negativo.
:::

::: banco
? ¿Qué es el threat hunting?
+ Buscar de forma proactiva amenazas que no han generado alertas
- Comprar listas de virus
- Bloquear todas las IP extranjeras
= Parte de la hipótesis de que el atacante ya puede estar dentro.

? ¿Cuál de estas herramientas es un IDS de red?
+ Suricata
- Excel
- BitLocker
= También Snort o Zeek.

? ¿Qué problema causan demasiados falsos positivos?
+ Fatiga de alertas: los analistas acaban pasando por alto las reales
- Que el SIEM se apague
- Ninguno
= Por eso se ajustan las reglas continuamente.

? ¿Qué permite un EDR ante un equipo infectado?
+ Aislarlo de la red a distancia e investigar sus procesos
- Formatearlo solo
- Mandar un correo al usuario
= El analista puede contener sin ir físicamente al equipo.
:::

=== c3-incidentes | Respuesta a incidentes paso a paso | 18 | 3
Un **incidente** es un evento que compromete la confidencialidad, integridad o disponibilidad. La diferencia entre un susto y un desastre suele estar en **cómo se responde**.

## El ciclo NIST

1. **Preparación**: plan escrito, contactos, herramientas, copias probadas y simulacros.
2. **Detección y análisis**: confirmar que es real, medir el alcance, priorizar.
3. **Contención**: parar la propagación (aislar equipos, bloquear cuentas e IP).
4. **Erradicación**: eliminar la causa (malware, cuenta robada, vulnerabilidad).
5. **Recuperación**: volver a la normalidad con seguridad (copias limpias, vigilancia extra).
6. **Lecciones aprendidas**: informe y mejoras para que no se repita.

## Reglas de oro

- **Contener antes que investigar a fondo**, pero **sin destruir pruebas**: aislar de la red en lugar de apagar o reinstalar.
- **Documentar todo** con hora: qué se vio, qué se hizo y quién lo hizo.
- **Comunicar por los canales del plan**: si el correo está comprometido, usar el teléfono.
- **No pagar rescates**: no garantiza nada y financia nuevos ataques.
- Hay **obligaciones legales**: si hay datos personales afectados, la ley de protección de datos suele exigir notificar a la autoridad en un plazo corto (en la Unión Europea, 72 horas).

## Cadena de custodia

Si el caso puede acabar en un juicio o en el seguro, las pruebas deben recogerse de forma que se pueda demostrar que **no se han alterado**: copias forenses, hashes de las imágenes de disco y registro de quién las ha manejado.

[[ir:ransomware]]

[[ir:cuenta]]

::: quiz
? Un equipo tiene ransomware. ¿Qué es lo primero?
+ Aislarlo de la red sin apagarlo
- Pagar el rescate
- Reinstalar el sistema enseguida
= Se corta la propagación y se conservan las pruebas.

? ¿Cuál es la última fase del ciclo de respuesta a incidentes?
+ Lecciones aprendidas
- Contención
- Detección
= Sin ella, el mismo incidente se repite.

? El correo de la empresa está comprometido. ¿Cómo coordina el equipo la respuesta?
+ Por un canal alternativo previsto en el plan, como el teléfono
- Por el mismo correo
- No se coordina
= El atacante podría leerlo todo.
:::

::: banco
? ¿Qué fase incluye hacer simulacros y probar las copias?
+ Preparación
- Recuperación
- Erradicación
= Se prepara antes de que ocurra.

? ¿Qué es la cadena de custodia?
+ El registro que demuestra que las pruebas no se han alterado y quién las ha manejado
- El orden en que se apagan los servidores
- Una lista de contraseñas
= Imprescindible si el caso llega a un juicio.

? Cambiar la contraseña de la cuenta comprometida y eliminar la regla de reenvío del atacante es…
+ Erradicación
- Preparación
- Lecciones aprendidas
= Se elimina la causa y lo que dejó el atacante.

? ¿Por qué no se recomienda pagar un rescate?
+ No garantiza recuperar los datos y financia nuevos ataques
- Porque es caro
- Porque las copias son mejores siempre
= Además, quien paga suele volver a ser atacado.

? En la Unión Europea, una brecha con datos personales se notifica a la autoridad normalmente en…
+ 72 horas
- Un año
- No hace falta notificar
= Lo exige el Reglamento General de Protección de Datos.
:::

=== c3-normas | Marcos, normas y protección de datos | 14 | 3
La seguridad de una organización no se improvisa: se apoya en **marcos** que ordenan qué hacer y en **leyes** que obligan.

## Marcos y normas

- **NIST Cybersecurity Framework**: organiza la seguridad en funciones: **Gobernar, Identificar, Proteger, Detectar, Responder y Recuperar**. Muy usado para medir la madurez.
- **ISO/IEC 27001**: norma internacional para un **sistema de gestión de seguridad de la información** (SGSI). Una empresa puede **certificarse**. La ISO 27002 detalla los controles.
- **CIS Controls**: lista práctica y priorizada de controles, útil para empezar.
- **PCI DSS**: obligatoria para quien procesa pagos con tarjeta.

## Protección de datos

Los **datos personales** (nombre, correo, DNI, salud, ubicación…) tienen protección legal:

- En la Unión Europea, el **RGPD**; en América Latina, leyes nacionales como la LFPDPPP en México o la Ley 172-13 en República Dominicana.
- Principios comunes: recoger **solo lo necesario**, para un **fin concreto**, con **seguridad adecuada**, y respetar los derechos de las personas (acceso, rectificación, supresión).
- Una **brecha** con datos personales puede obligar a notificar a la autoridad y a los afectados.

## Gestión del riesgo

Ante cada riesgo, la organización decide:

| Opción | Ejemplo |
|---|---|
| **Mitigar** | Poner MFA |
| **Transferir** | Contratar un ciberseguro |
| **Evitar** | Dejar de ofrecer un servicio peligroso |
| **Aceptar** | Asumirlo de forma consciente y documentada |

## Políticas

Documentos que dicen **qué se espera** de cada persona: uso aceptable, contraseñas, teletrabajo, clasificación de la información. Una política que nadie conoce no sirve: hay que **formar**.

::: quiz
? ¿Qué es la ISO/IEC 27001?
+ Una norma internacional para un sistema de gestión de seguridad de la información, certificable
- Un antivirus
- Una ley de un país concreto
= Las empresas pueden certificarse en ella.

? Contratar un ciberseguro es una forma de…
+ Transferir el riesgo
- Evitar el riesgo
- Aceptar el riesgo
= Parte del impacto económico pasa a la aseguradora.

? ¿Qué principio de protección de datos dice «recoge solo los datos que necesitas»?
+ Minimización
- Disponibilidad
- Integridad
= Lo que no se recoge no se puede filtrar.
:::

::: banco
? ¿Qué funciones tiene el NIST Cybersecurity Framework 2.0?
+ Gobernar, Identificar, Proteger, Detectar, Responder y Recuperar
- Instalar, Configurar y Apagar
- Solo Proteger
= Ordenan todo el trabajo de seguridad.

? ¿Qué norma deben cumplir quienes procesan pagos con tarjeta?
+ PCI DSS
- ISO 9001
- HTTP/2
= Payment Card Industry Data Security Standard.

? Una empresa decide asumir un riesgo bajo de forma consciente y documentada. Eso es…
+ Aceptar el riesgo
- Mitigar
- Transferir
= Es legítimo si se decide y se documenta.

? ¿Cuál de estos es un dato personal?
+ El correo electrónico de un cliente
- La temperatura del servidor
- El número de versión de Windows
= Identifica o permite identificar a una persona.
:::

=== c3-carrera | Trabajar en ciberseguridad | 12 | 3
La ciberseguridad tiene una gran demanda de profesionales, y la mayoría de quienes trabajan en ella **vienen de soporte, redes o sistemas**. Lo que has aprendido en Loopback es justo la base.

## Puestos de entrada y hacia dónde llevan

| Puesto | Qué hace |
|---|---|
| **Analista SOC nivel 1** | Vigila alertas en el SIEM y escala incidentes |
| **Técnico de seguridad / sistemas** | Parches, antivirus/EDR, copias, cuentas y permisos |
| **Analista de vulnerabilidades** | Escanea, prioriza y sigue la corrección |
| **Pentester junior** | Prueba sistemas con permiso para encontrar fallos (suele requerir más experiencia) |
| **GRC** | Normas, riesgos, auditorías y políticas |

## Certificaciones de entrada conocidas

- **CompTIA Security+**: conceptos generales, muy reconocida.
- **Cisco CyberOps Associate** (Cisco la está renovando como CCNA Cybersecurity): orientada a SOC.
- **ISC2 Certified in Cybersecurity (CC)**: de iniciación.
- **eJPT**: práctica de pentesting de entrada.

Antes de pagar un examen, comprueba qué piden las ofertas de empleo de tu zona.

## Cómo practicar legalmente

- **Laboratorios propios**: máquinas virtuales en tu ordenador (Kali Linux, Windows de evaluación, Metasploitable).
- **Plataformas de práctica** con permiso explícito: TryHackMe, Hack The Box, PortSwigger Web Security Academy, OverTheWire.
- **CTF** (*capture the flag*): competiciones con retos legales.
- Documenta lo que haces en un **portafolio**: informes de laboratorios, reglas de detección que has escrito, análisis de registros.

## Ética

Un profesional de seguridad trabaja **siempre con autorización**, protege la información que ve y comunica los fallos de forma responsable. Las habilidades son las mismas que las de un atacante: lo que cambia es el permiso y la intención.

::: quiz
? ¿Cuál es un puesto de entrada habitual en ciberseguridad?
+ Analista SOC de nivel 1
- Director de seguridad (CISO)
- Arquitecto de seguridad sénior
= Muchos llegan desde soporte o redes.

? ¿Dónde puedes practicar hacking de forma legal?
+ En tus propias máquinas virtuales y en plataformas que lo permiten expresamente
- En la web de cualquier empresa si no rompes nada
- En la red Wi-Fi del vecino
= Sin permiso explícito, es delito.

? ¿Qué separa a un profesional de seguridad de un atacante?
+ La autorización y la intención
- Las herramientas que usa
- El sistema operativo
= Las técnicas son las mismas.
:::

::: banco
? ¿Qué es un CTF?
+ Una competición con retos de seguridad legales
- Un tipo de cortafuegos
- Un certificado digital
= Capture the flag.

? ¿Qué área de la seguridad se ocupa de normas, riesgos y auditorías?
+ GRC (gobierno, riesgo y cumplimiento)
- Pentesting
- SOC
= Governance, Risk and Compliance.

? ¿Qué certificación está orientada al trabajo en un SOC?
+ Cisco CyberOps Associate
- Cisco CCNA
- Microsoft Excel Expert
= El CCNA es de redes, aunque es una base excelente.

? Encuentras por casualidad un fallo en la web de una empresa. ¿Qué es lo correcto?
+ Comunicarlo de forma responsable a la empresa, sin explotarlo ni publicarlo
- Publicarlo en redes para que lo arreglen
- Aprovecharlo para ver qué datos hay
= Muchas empresas tienen un canal de divulgación responsable.
:::
