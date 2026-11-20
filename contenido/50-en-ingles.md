---
area: en
id: s11
titulo: Inglés técnico para TI
dominio: Inglés técnico
peso: 0
descripcion: El inglés que se necesita para trabajar en tecnología: vocabulario de hardware, software y redes, leer mensajes de error y documentación, escribir tickets y correos, atender llamadas y chats, y pasar una entrevista en inglés.
---

=== s11-por-que | Inglés técnico: la lengua de la documentación | 12 | 1
En TI, el inglés no es un extra: es el idioma de los **comandos**, los **mensajes de error**, los **registros (logs)**, la **documentación de los fabricantes** y los **estándares**. No hace falta hablarlo con fluidez para empezar, pero sí leerlo con precisión.

## Dónde te lo vas a encontrar

| Fuente | Ejemplo real |
| --- | --- |
| Consola de red | `% Invalid input detected at '^' marker.` |
| Sistema operativo | `Permission denied (publickey).` |
| Conectividad | `Connection refused`, `Request timed out`, `Destination host unreachable` |
| Base de datos | `ERROR: duplicate key value violates unique constraint` |
| Seguridad | Los avisos CVE y los boletines de los fabricantes |
| Estándares | Los **RFC** de internet (TCP, DNS, HTTP…) |

## Los verbos que más importan

| En inglés | Qué significa en un registro |
| --- | --- |
| **deny / drop** | El firewall bloqueó el paquete (*drop*: sin avisar al origen) |
| **refused** | El equipo respondió, pero nada escucha en ese puerto |
| **timed out** | No llegó ninguna respuesta a tiempo |
| **unreachable** | No hay ruta hacia el destino |
| **failed / denied** | La operación o la autenticación no se permitió |
| **deprecated** | Todavía funciona, pero dejará de existir: hay que migrar |

`Connection refused` y `Connection timed out` parecen lo mismo y no lo son: el primero dice que el servidor está vivo pero el servicio no escucha; el segundo, que algo (un firewall, una ruta) impide llegar.

## Cómo leen los estándares

Los RFC usan palabras con un significado exacto (RFC 2119):

- **MUST / MUST NOT:** obligatorio.
- **SHOULD / SHOULD NOT:** recomendado; solo se ignora con un buen motivo.
- **MAY:** opcional.

## Estrategia de lectura

1. Lee el mensaje **completo**, no solo la primera palabra.
2. Identifica el **objeto** (qué archivo, puerto, usuario o interfaz).
3. Busca el mensaje **exacto entre comillas** en la documentación oficial antes que en foros.

::: quiz
? `ssh admin@10.0.0.5` responde `Connection refused`. ¿Qué indica?
+ El equipo responde, pero no hay ningún servicio escuchando en el puerto 22
- Un firewall bloqueó el tráfico sin responder
- No hay ruta hacia 10.0.0.5
= Con un firewall que descarta, verías *timed out*; sin ruta, *unreachable*.

? En un registro de firewall, ¿qué significa `drop`?
+ El paquete se descartó sin avisar al origen
- El paquete se reenvió más rápido
- La interfaz se apagó
= *Deny* y *drop* indican bloqueo; *drop* no envía ninguna respuesta.

? En un RFC, ¿qué significa SHOULD?
- Obligatorio
+ Recomendado, salvo que haya un buen motivo para no hacerlo
- Prohibido
= MUST es obligatorio y MAY es opcional.

? La documentación dice que una función está *deprecated*. ¿Qué haces?
+ Planificar el cambio a su sustituta, porque dejará de existir
- Nada, significa que es la recomendada
- Desinstalar el programa
= Deprecated: funciona todavía, pero está en camino de desaparecer.

? ¿Qué indica `Destination host unreachable` en un ping?
+ Que no hay camino hacia el destino (por ejemplo, falta una ruta o la puerta de enlace no responde)
- Que el destino respondió correctamente
- Que la contraseña es incorrecta
= Es distinto de *Request timed out*, en el que el paquete sale pero no vuelve respuesta.
:::

::: banco
? ¿Qué significa MUST NOT en un RFC?
+ Que está prohibido
- Que es opcional
- Que es recomendable
= Es la prohibición absoluta del estándar.

? ¿Dónde conviene buscar primero un mensaje de error exacto?
+ En la documentación oficial del fabricante, con el mensaje entre comillas
- En el primer video que aparezca
- En ningún sitio: se reinicia el equipo
= La documentación oficial es la fuente más fiable y actualizada.
:::

=== s11-vocabulario | Vocabulario: hardware, software y redes | 16 | 1
Muchas palabras técnicas se usan igual en español (*router*, *switch*, *software*), pero otras no se parecen o tienen trampa.

## Las que más se usan

| Inglés | Español |
|---|---|
| motherboard | placa base |
| hard drive / SSD | disco duro / SSD |
| power supply | fuente de alimentación |
| screen / monitor | pantalla |
| driver | controlador |
| setting(s) | ajuste(s), configuración |
| gateway | puerta de enlace |
| bandwidth | ancho de banda |
| outage | caída del servicio |
| issue | problema, incidencia |
| troubleshoot | diagnosticar y resolver |
| backup | copia de seguridad |
| log in / log out | iniciar / cerrar sesión |
| restart / shut down | reiniciar / apagar |

## Falsos amigos

- **Actually** = en realidad (no «actualmente», que es *currently*).
- **Library** = biblioteca (también de código), no «librería» (*bookstore*). En programación se dice «librería» por costumbre, pero el término correcto es biblioteca.
- **Support** = dar soporte o ayudar, no «soportar» en el sentido de aguantar.
- **Eventually** = al final, con el tiempo (no «eventualmente»).

[[vocab:basico]]

::: quiz
? ¿Qué significa «power supply»?
+ Fuente de alimentación
- Corte de luz
- Batería de la laptop
- Enchufe
= La pieza que da corriente al equipo.

? ¿Qué significa «outage»?
+ Caída o interrupción del servicio
- Salida del edificio
- Actualización
- Copia de seguridad
= «There is an internet outage» = no hay internet (caída).

? «Actually, the server is down». ¿Qué significa «actually»?
+ En realidad
- Actualmente
- Rápidamente
- Otra vez
= Es un falso amigo: «actualmente» se dice «currently».

? ¿Cómo se dice «puerta de enlace» en inglés?
+ Gateway
- Doorway
- Gate link
- Entry
= Default gateway = puerta de enlace predeterminada.
:::

::: banco
? ¿Qué significa «troubleshoot»?
+ Diagnosticar y resolver un problema
- Disparar a un problema
- Apagar el equipo
= Troubleshooting es el proceso de diagnóstico.

? ¿Qué significa «driver» en informática?
+ Controlador
- Conductor del camión
- Disco duro
= El driver permite que el sistema use un dispositivo.

? «Please log in with your company account.» ¿Qué te piden?
+ Iniciar sesión con la cuenta de la empresa
- Cerrar sesión
- Crear una cuenta nueva
= Log in = iniciar sesión; log out = cerrar sesión.

? ¿Qué significa «bandwidth»?
+ Ancho de banda
- Cable de red
- Banda de música
= La capacidad de transmisión de un enlace.

? ¿Qué significa «setting»?
+ Ajuste o configuración
- Asiento
- Instalación
= Settings = configuración (por ejemplo, el menú de ajustes).

? «Shut down the computer» significa…
+ Apagar el equipo
- Reiniciar el equipo
- Bloquear la pantalla
= Restart = reiniciar; shut down = apagar.
:::

=== s11-errores | Leer mensajes de error y documentación | 18 | 2
Leer bien un mensaje de error en inglés es la mitad del diagnóstico. No hace falta traducir palabra por palabra: busca **qué pasó**, **dónde** y **qué te piden hacer**.

## Estructuras que se repiten

| En inglés | Quiere decir |
|---|---|
| could not / unable to … | no se pudo … |
| failed to … | falló al … |
| access denied / permission denied | acceso denegado / sin permiso |
| not found | no se encuentra |
| timed out | se agotó el tiempo de espera |
| make sure … | asegúrate de que … |
| try again | inténtalo de nuevo |
| will expire in … | caducará dentro de … |
| is offline / is not responding | está desconectado / no responde |

## Documentación: las palabras clave

- **Prerequisites**: lo que necesitas antes de empezar.
- **Step 1, Step 2…**: los pasos, en orden.
- **Note / Important / Warning / Caution**: avisos, de menos a más graves.
- **Known issue**: un problema conocido. **Workaround**: solución provisional.
- **Deprecated**: obsoleto, se eliminará en el futuro.
- **Default**: valor por defecto.

[[lectura:errores]]

[[lectura:docs]]

::: quiz
? ¿Qué significa «The request timed out»?
+ Se agotó el tiempo de espera de la petición
- La petición fue aceptada
- La petición está duplicada
- No hay permiso
= Timed out = no hubo respuesta a tiempo.

? En un manual, ¿qué indica «Warning»?
+ Un aviso importante de riesgo
- Un consejo opcional
- El índice
- La garantía
= Note < Important < Warning/Caution en gravedad.

? «Unable to connect to the server. Make sure the VPN is connected.» ¿Qué te pide?
+ Comprobar que la VPN está conectada
- Reiniciar el servidor
- Cambiar la contraseña
- Instalar la VPN de nuevo
= «Make sure» = asegúrate de que.

? ¿Qué es un «workaround»?
+ Una solución provisional
- Un error grave
- Una actualización
- Un manual
= Sirve mientras se arregla el problema de fondo.
:::

::: banco
? ¿Qué significa «deprecated» en documentación?
+ Obsoleto: funcionará un tiempo, pero se eliminará
- Recomendado
- Nuevo
= Hay que dejar de usarlo y buscar la alternativa.

? «File not found» significa…
+ No se encuentra el archivo
- El archivo está dañado
- El archivo es demasiado grande
= Not found = no encontrado.

? «Access denied» significa…
+ Acceso denegado
- Acceso concedido
- Acceso lento
= Falta de permisos.

? En una guía de instalación, ¿qué son los «prerequisites»?
+ Lo que necesitas antes de empezar
- Los pasos finales
- Los errores conocidos
= Requisitos previos.

? ¿Qué significa «default» en una configuración?
+ El valor por defecto
- Un fallo
- Un valor prohibido
= Default value = valor predeterminado.

? «The service failed to start.» ¿Qué pasó?
+ El servicio no pudo iniciarse
- El servicio se inició bien
- El servicio se detuvo a petición del usuario
= Failed to = falló al.
:::

=== s11-escribir | Escribir tickets y correos en inglés | 16 | 2
Un buen ticket en inglés es **corto, concreto y educado**. Las mismas reglas que en español: qué pasa, desde cuándo, a quién afecta, qué se probó y qué se necesita.

## Plantilla de ticket

> **Summary:** Unable to print from the accounting PC (PC-CONTA-01)
> **Since:** this morning, 8:30 a.m.
> **Impact:** 3 users in Accounting cannot print invoices
> **Steps taken:** restarted the print spooler, cleared the queue, issue persists
> **Next step:** escalating to the network team to check the printer's IP address

## Frases útiles

- *I'm writing regarding ticket #4821.* — Te escribo por el ticket 4821.
- *Could you please send me a screenshot of the error?* — ¿Podrías enviarme una captura del error?
- *The issue has been resolved. Please let me know if it happens again.* — El problema está resuelto. Avísame si vuelve a pasar.
- *I'm escalating this to the network team.* — Lo escalo al equipo de redes.
- *Sorry for the inconvenience.* — Disculpa las molestias.

## Tiempos verbales que más usarás

- **Pasado simple** para lo que hiciste: *I restarted the router.*
- **Presente perfecto** para algo que empezó y sigue: *The user has been unable to log in since Monday.*
- **Futuro con will** para lo que harás: *I will check the logs and get back to you.*

[[frases:tickets]]

::: quiz
? ¿Qué frase es correcta para decir que reiniciaste el servicio?
+ I restarted the service.
- I restart the service yesterday.
- I am restarted the service.
- I will restarted the service.
= Pasado simple: restarted.

? «The user has been unable to log in since Monday» expresa…
+ Algo que empezó el lunes y sigue ocurriendo
- Algo que pasó solo el lunes
- Algo que pasará el lunes
= Presente perfecto con «since».

? ¿Cómo pides una captura de pantalla con educación?
+ Could you please send me a screenshot?
- Send screenshot now.
- You give me screenshot.
= «Could you please…?» es la fórmula educada.
:::

::: banco
? ¿Qué significa «I will get back to you»?
+ Te volveré a contactar (te respondo después)
- Vuelvo a mi casa
- Te devuelvo el equipo
= Muy usado para comprometerse a dar respuesta.

? ¿Qué va en el «Summary» de un ticket?
+ Un resumen corto del problema
- Toda la conversación
- La firma del técnico
= Una línea que permita entender el caso de un vistazo.

? «Sorry for the inconvenience» significa…
+ Disculpa las molestias
- No es mi problema
- Gracias por tu paciencia
= Se usa al cerrar o al informar de una incidencia.

? ¿Qué tiempo verbal usas para lo que vas a hacer después?
+ Futuro con will: I will check the logs
- Pasado simple
- Presente perfecto
= Will + verbo para compromisos futuros.
:::

=== s11-llamadas | Atender llamadas y chats en inglés | 16 | 2
En una llamada en inglés lo difícil no es la gramática, sino **mantener la calma y guiar al usuario**. Ayuda mucho tener frases preparadas.

## El guion de una llamada

1. **Saludo**: *IT help desk, this is Ana speaking. How can I help you?*
2. **Identificación**: *Could I have your name and employee ID, please?*
3. **Entender el problema**: *Can you describe what happens? When did it start?*
4. **Guiar**: *Please click the Start button… Now type «cmd» and press Enter.*
5. **Si no entiendes**: *Sorry, could you repeat that, please?* / *Could you spell that for me?*
6. **Si necesitas tiempo**: *Please bear with me for a moment.*
7. **Cierre**: *Is there anything else I can help you with?* / *Have a great day!*

## Deletrear

En inglés se deletrean nombres, correos y códigos constantemente. Aprende el alfabeto en inglés y los símbolos: **@** *at*, **.** *dot*, **-** *dash* o *hyphen*, **_** *underscore*, **/** *slash*.

[[frases:llamadas]]

::: quiz
? ¿Qué dices si no entendiste lo que dijo el usuario?
+ Sorry, could you repeat that, please?
- What?
- I don't care.
- Speak Spanish.
= Pedir que repitan con educación es lo profesional.

? ¿Qué significa «Please bear with me for a moment»?
+ Tenga un momento de paciencia, por favor
- Por favor, cuelgue
- Traiga su equipo
- Espere al oso
= Se usa mientras compruebas algo.

? ¿Cómo se dice el símbolo @ en inglés al dictar un correo?
+ at
- arroba
- and
- around
= ana.perez@empresa.com se dicta «ana dot perez at empresa dot com».
:::

::: banco
? ¿Qué pregunta haces antes de cerrar una llamada?
+ Is there anything else I can help you with?
- Why did you call?
- Are you finished?
= Se ofrece ayuda adicional antes de terminar.

? ¿Qué significa «Could you spell that for me?»
+ ¿Me lo puede deletrear?
- ¿Me lo puede escribir en papel?
- ¿Puede hablar más alto?
= Spell = deletrear.

? ¿Cómo se dice el guion bajo (_) en inglés?
+ underscore
- dash
- slash
= Dash o hyphen es el guion (-); slash es la barra (/).

? ¿Qué pides para identificar al usuario al principio?
+ Could I have your name and employee ID, please?
- Who are you?
- Give me your password.
= Nunca se pide la contraseña: se verifica la identidad con otros datos.
:::

=== s11-entrevista | La entrevista de trabajo en inglés | 16 | 3
Muchas empresas hacen una parte de la entrevista en inglés para comprobar tu nivel. No buscan un inglés perfecto: buscan que te **comuniques con claridad** y que hables de tu experiencia con seguridad.

## Prepara estas respuestas

- **Tell me about yourself.** Presente (qué haces), experiencia relevante, un logro y por qué este puesto. Un minuto.
- **Why do you want to work here?** Relaciona la empresa con tus objetivos.
- **What are your strengths?** Dos o tres, con un ejemplo cada una.
- **Tell me about a time when you solved a difficult problem.** Usa STAR: *Situation, Task, Action, Result*.
- **Do you have any questions for us?** Ten siempre una o dos.

## Frases que ayudan

- *I have hands-on experience with…* — Tengo experiencia práctica con…
- *In my previous job, I was responsible for…* — En mi trabajo anterior era responsable de…
- *I'm not sure, but I would…* — No estoy seguro, pero haría…
- *Could you rephrase the question?* — ¿Podría reformular la pregunta?
- *What does a typical day look like in this role?* — ¿Cómo es un día normal en este puesto?

::: practica
Graba tus respuestas con el celular y escúchalas. Corrige lo que no se entienda y repite. En una semana notarás la diferencia.
:::

[[frases:entrevista]]

::: quiz
? ¿Cómo empiezas «Tell me about yourself»?
+ Con tu perfil profesional y tu experiencia relevante
- Con el año en que naciste
- Con tus aficiones
- Con lo que no te gusta de tu trabajo actual
= El entrevistador quiere saber qué aportas al puesto.

? ¿Qué significa «hands-on experience»?
+ Experiencia práctica
- Experiencia con las manos rotas
- Experiencia teórica
- Experiencia de voluntariado
= Haber hecho el trabajo, no solo estudiarlo.

? Si no entiendes una pregunta en la entrevista, ¿qué dices?
+ Could you rephrase the question, please?
- Next.
- Yes, yes.
- I don't speak English.
= Pedir que la reformulen es correcto y profesional.
:::

::: banco
? ¿Qué método usas para contar un problema que resolviste?
+ STAR: Situation, Task, Action, Result
- ABC: Always Be Calm
- FAQ
= Estructura la historia y destaca tu acción y el resultado.

? «In my previous job, I was responsible for…» significa…
+ En mi trabajo anterior era responsable de…
- En mi próximo trabajo seré responsable de…
- No tuve trabajo anterior
= Previous = anterior.

? ¿Qué pregunta es buena para hacer al final de la entrevista?
+ What does a typical day look like in this role?
- How many days off do I get?
- Can I start late every day?
= Demuestra interés por el trabajo real.

? ¿Qué buscan los entrevistadores en tu inglés?
+ Que te comuniques con claridad y seguridad
- Un acento nativo perfecto
- Que no cometas ningún error
= La claridad importa más que la perfección.
:::
