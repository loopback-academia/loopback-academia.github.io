---
area: sec
id: c1
titulo: Fundamentos de ciberseguridad
dominio: Fundamentos
peso: 0
descripcion: Qué protege la ciberseguridad y de quién, contraseñas y verificación en dos pasos, cómo se guardan las contraseñas con hashes, ingeniería social y phishing, tipos de malware y las buenas prácticas que evitan la mayoría de los incidentes.
---

=== c1-que-es | Qué es la ciberseguridad | 14 | 1
La ciberseguridad protege la **información** y los **sistemas** que la manejan frente a accesos, cambios o caídas no autorizados. No es solo cosa de expertos: la mayoría de los incidentes empieza por un descuido de alguien que no trabaja en seguridad.

## La tríada CIA

Todo lo que se protege se resume en tres propiedades:

| Propiedad | Significa | Ejemplo de ataque |
|---|---|---|
| **Confidencialidad** | Solo lo ve quien debe | Robo de una base de datos de clientes |
| **Integridad** | Nadie lo cambia sin permiso | Alterar el número de cuenta de una factura |
| **Disponibilidad** | Está accesible cuando hace falta | Ransomware o denegación de servicio (DoS) |

## Amenaza, vulnerabilidad y riesgo

- **Activo**: lo que tiene valor (datos, equipos, la reputación).
- **Vulnerabilidad**: una debilidad (un programa sin actualizar, una contraseña débil, un empleado sin formación).
- **Amenaza**: lo que puede aprovecharla (un delincuente, un empleado descontento, un incendio).
- **Riesgo**: la probabilidad de que una amenaza aproveche una vulnerabilidad multiplicada por el **impacto**.

La seguridad no busca el riesgo cero, que no existe, sino **reducirlo** a un nivel aceptable con controles: técnicos (cortafuegos, cifrado), organizativos (políticas, formación) y físicos (cerraduras, cámaras).

## Quién ataca y por qué

- **Ciberdelincuentes**: buscan dinero (ransomware, fraude, venta de datos). Son la mayoría.
- **Hacktivistas**: motivos políticos o sociales.
- **Grupos patrocinados por estados**: espionaje y sabotaje.
- **Internos**: empleados o exempleados, por error o con mala intención.

## Defensa en profundidad

Ningún control es perfecto, así que se ponen **varias capas**: si falla una, otra detiene el ataque. Por ejemplo: formación contra el phishing + filtro de correo + verificación en dos pasos + copias de seguridad.

::: nota
La ciberseguridad tiene límites legales y éticos claros: probar la seguridad de un sistema sin permiso por escrito de su dueño es un delito, aunque la intención sea buena. Todo lo que practiques aquí ocurre en simulaciones dentro de tu navegador.
:::

::: quiz
? Un atacante cambia el importe de las facturas en la base de datos. ¿Qué propiedad ataca?
+ Integridad
- Confidencialidad
- Disponibilidad
= Los datos siguen visibles y accesibles, pero ya no son correctos.

? ¿Qué es una vulnerabilidad?
+ Una debilidad que una amenaza puede aprovechar
- Un ataque que ya ha ocurrido
- Un programa antivirus
- El valor de los datos
= Por ejemplo, un servidor sin parches o una contraseña débil.

? ¿Qué significa «defensa en profundidad»?
+ Varias capas de protección, para que si falla una actúe otra
- Un único cortafuegos muy potente
- Guardar los datos en un sótano
= Ningún control es perfecto por sí solo.
:::

::: banco
? Un ransomware deja los archivos de la empresa inaccesibles. ¿Qué propiedad de la tríada CIA se pierde sobre todo?
+ Disponibilidad
- Integridad
- Confidencialidad
= Los datos están, pero no se pueden usar.

? ¿Qué tipo de atacante es el más frecuente contra empresas pequeñas y medianas?
+ Ciberdelincuentes que buscan dinero
- Grupos patrocinados por estados
- Hacktivistas
= El fraude y el ransomware son negocios muy rentables.

? ¿Cómo se calcula de forma sencilla el riesgo?
+ Probabilidad de que ocurra × impacto si ocurre
- Número de equipos × número de usuarios
- Precio del antivirus × años
= Es la base para decidir qué proteger primero.

? Probar la seguridad de la web de otra empresa sin su permiso porque «solo quieres ayudar»…
+ Es ilegal: hace falta una autorización por escrito
- Es legal si no rompes nada
- Es legal si avisas después
= La autorización previa y por escrito es imprescindible.

? Formación, políticas y procedimientos son controles…
+ Organizativos
- Técnicos
- Físicos
= Los técnicos son, por ejemplo, el cifrado o el cortafuegos; los físicos, cerraduras o cámaras.
:::

=== c1-contrasenas | Contraseñas, gestores y verificación en dos pasos | 16 | 1
Las contraseñas siguen siendo la puerta principal de casi todo, y la mayoría de los accesos indebidos usan contraseñas **robadas, reutilizadas o fáciles de adivinar**.

## Qué hace fuerte una contraseña

1. **Longitud**: es lo que más cuenta. 14 caracteres o más.
2. **Que no siga patrones**: nada de palabra + año + símbolo («Verano2024!»), secuencias («1234», «qwerty») ni cambios previsibles («P@ssw0rd»). Los programas de ataque prueban justo eso primero.
3. **Única para cada servicio**: si una web sufre una filtración, los atacantes prueban esa misma contraseña en todas partes (*credential stuffing*).

Una **frase de contraseña** con varias palabras al azar («tren-nube-limón-faro») es larga, fácil de recordar y muy difícil de adivinar.

## Gestores de contraseñas

Nadie puede recordar cien contraseñas únicas. Un **gestor de contraseñas** las genera y las guarda cifradas; tú solo recuerdas una contraseña maestra muy fuerte. Además, autocompleta solo en la web correcta, lo que ayuda contra el phishing.

## Verificación en dos pasos (MFA)

La **autenticación multifactor** pide algo más que la contraseña:

- Algo que **sabes**: contraseña o PIN.
- Algo que **tienes**: el móvil (app de autenticación), una llave de seguridad física.
- Algo que **eres**: huella, cara.

Con MFA, una contraseña robada **no basta** para entrar. Las apps de autenticación y las llaves físicas son más seguras que los SMS. Y cuidado con la «fatiga de MFA»: si te llegan avisos de aprobación que no has pedido, **no los aceptes**: alguien tiene tu contraseña.

[[pass:fuerza]]

::: quiz
? ¿Qué factor hace más fuerte una contraseña?
+ La longitud, sin patrones conocidos
- Cambiar la «a» por «@»
- Añadir el año al final
- Empezar por mayúscula
= Los programas de ataque ya prueban sustituciones y años.

? ¿Por qué no se debe reutilizar una contraseña?
+ Si se filtra en un servicio, la prueban en todos los demás
- Porque caduca antes
- Porque el navegador no la guarda
= Es el ataque llamado *credential stuffing*.

? Te llega una notificación de MFA para aprobar un inicio de sesión que no has hecho. ¿Qué haces?
+ La rechazo y cambio mi contraseña, porque alguien la conoce
- La apruebo para que deje de molestar
- La ignoro sin más
= Es la «fatiga de MFA»: el atacante insiste hasta que alguien acepta.
:::

::: banco
? ¿Cuál de estas contraseñas es más segura?
+ caballo-lámpara-río-otoño
- Barcelona2025!
- P@ssw0rd123
= La frase larga de palabras al azar no sigue ningún patrón conocido.

? ¿Qué es la autenticación multifactor?
+ Pedir dos o más tipos de prueba: algo que sabes, algo que tienes o algo que eres
- Usar dos contraseñas distintas
- Cambiar la contraseña cada mes
= Dos contraseñas siguen siendo el mismo factor.

? ¿Qué método de MFA es más débil?
+ El código por SMS
- Una llave de seguridad física
- Una app de autenticación
= Los SMS se pueden interceptar o desviar con un duplicado de la SIM.

? ¿Qué ventaja tiene un gestor de contraseñas además de recordar?
+ Genera contraseñas únicas y solo autocompleta en la web correcta
- Hace innecesaria la contraseña maestra
- Desactiva el antivirus
= Si la web es falsa, el gestor no rellena nada: una pista de phishing.

? ¿Qué es el *credential stuffing*?
+ Probar en muchos servicios usuarios y contraseñas filtrados de otro
- Adivinar contraseñas letra a letra
- Robar el móvil para recibir los códigos
= Funciona porque mucha gente reutiliza contraseñas.
:::

=== c1-hash | Cómo se guardan las contraseñas: hashes y sal | 16 | 1
Una web bien hecha **no guarda tu contraseña**: guarda su **hash**. Cuando inicias sesión, calcula el hash de lo que escribes y lo compara con el guardado.

## Qué es un hash

Una **función hash** convierte cualquier texto en una huella de tamaño fijo:

- Siempre da el mismo resultado para el mismo texto.
- Un cambio mínimo cambia toda la huella (**efecto avalancha**).
- **No se puede deshacer**: del hash no se obtiene la contraseña.

Ejemplos: MD5 (32 caracteres hexadecimales, roto), SHA-1 (40, obsoleto), SHA-256 (64).

## El problema: los diccionarios

Si el hash no se deshace, ¿cómo se descubren contraseñas filtradas? **Calculando el hash de millones de contraseñas probables** y comparando. Si la tuya es común, cae en segundos.

## La sal

La **sal** es un valor aleatorio, distinto para cada usuario, que se añade a la contraseña antes de calcular el hash:

- Dos usuarios con la misma contraseña tienen hashes **distintos**.
- Las tablas precalculadas dejan de servir: hay que atacar cuenta por cuenta.

Además, para contraseñas se usan algoritmos **lentos a propósito** (bcrypt, scrypt, Argon2): un usuario no nota esperar 0,1 segundos, pero un atacante que prueba miles de millones sí.

[[pass:hash]]

::: cuidado
Hash no es cifrado. Lo cifrado se puede descifrar con la clave; un hash no se «descifra», solo se puede adivinar qué texto lo produjo.
:::

::: quiz
? ¿Por qué las webs guardan el hash y no la contraseña?
+ Si roban la base de datos, no obtienen las contraseñas directamente
- Porque ocupa menos espacio
- Porque es más rápido de escribir
= El hash permite comprobar la contraseña sin guardarla.

? ¿Para qué sirve la sal?
+ Para que contraseñas iguales den hashes distintos e inutilizar tablas precalculadas
- Para que el hash se pueda deshacer
- Para que la contraseña sea más corta
= Obliga al atacante a trabajar cuenta por cuenta.

? ¿Qué algoritmo es adecuado para guardar contraseñas?
+ Argon2 o bcrypt
- MD5
- Base64
= Son lentos a propósito y llevan sal.
:::

::: banco
? ¿Cuántos caracteres hexadecimales tiene un hash SHA-256?
+ 64
- 32
- 40
= 256 bits / 4 bits por carácter hexadecimal = 64.

? Cambias una sola letra del texto. ¿Qué le pasa al hash?
+ Cambia por completo
- Cambia solo un carácter
- No cambia
= Es el efecto avalancha.

? Un hash débilmente protegido se «rompe» normalmente…
+ Probando contraseñas probables y comparando sus hashes
- Aplicando la función al revés
- Con la clave privada del servidor
= Un hash no tiene operación inversa.

? Con sal, ¿una contraseña como «123456» ya es segura?
+ No: el atacante la sigue probando, aunque tenga que hacerlo usuario a usuario
- Sí, la sal la vuelve imposible de adivinar
- Solo si la sal es larga
= La sal no arregla una contraseña débil.

? ¿Qué diferencia hay entre hash y cifrado?
+ Lo cifrado se descifra con una clave; un hash no se puede revertir
- Ninguna
- El hash usa siempre clave pública
= Son herramientas distintas para necesidades distintas.
:::

=== c1-ingenieria | Ingeniería social y phishing | 16 | 1
La **ingeniería social** ataca a las personas en lugar de a las máquinas: engaña para que alguien entregue una contraseña, abra un archivo o haga un pago. Es la puerta de entrada de la mayoría de los incidentes.

## Las palancas que usan

- **Urgencia**: «tu cuenta se cerrará en 24 horas».
- **Autoridad**: se hacen pasar por el director, el banco o el departamento de TI.
- **Miedo o premio**: una multa, un paquete retenido, un premio.
- **Confianza**: usan datos reales tuyos o de tu empresa sacados de redes sociales.

## Formas habituales

| Ataque | Cómo es |
|---|---|
| **Phishing** | Correo masivo con un enlace a una web falsa |
| **Spear phishing** | Correo dirigido a ti, con datos personales |
| **Fraude del CEO / BEC** | «Soy el director, haz esta transferencia urgente y no lo comentes» |
| **Vishing** | Por teléfono: «llamo de soporte de Microsoft» |
| **Smishing** | Por SMS o mensajería |
| **Tailgating** | Entrar en la oficina detrás de un empleado |

## Cómo detectar un correo falso

1. El **remitente real** (no el nombre que se muestra): dominios parecidos como `micros0ft-soporte.com`.
2. **Pasa el ratón** por el enlace antes de pulsar: ¿adónde lleva de verdad?
3. **Adjuntos** inesperados, sobre todo `.zip`, `.html`, macros de Office o `.exe`.
4. Peticiones de **contraseñas, códigos o pagos**: ningún servicio legítimo te pide la contraseña por correo.
5. Ante la duda, **verifica por otro canal**: llama al número que ya conoces, no al del correo.

Y si caes: **avisa enseguida** a TI. Cuanto antes se cambie la contraseña y se revisen las sesiones, menos daño.

[[phishing:bandeja]]

::: quiz
? El «director» te escribe desde un Gmail pidiéndote una transferencia urgente y confidencial. ¿Qué haces?
+ Verificar por teléfono con el director, en un número conocido, antes de hacer nada
- Hacer la transferencia: es el director
- Responder al correo pidiendo confirmación
= Es el fraude del CEO: urgencia + autoridad + secreto.

? ¿Qué es el spear phishing?
+ Phishing dirigido a una persona concreta con datos personales
- Phishing por SMS
- Un antivirus para el correo
= Es más creíble porque usa información real de la víctima.

? Has pulsado un enlace y escrito tu contraseña en una web que ahora te parece falsa. ¿Qué haces?
+ Aviso a TI enseguida y cambio la contraseña
- No digo nada para que no me regañen
- Espero a ver si pasa algo
= Cada minuto cuenta para echar al atacante.
:::

::: banco
? ¿Qué es el vishing?
+ Ingeniería social por teléfono
- Phishing con vídeo
- Un virus de Windows
= Por ejemplo, el falso técnico de soporte que pide acceso remoto.

? ¿Cuál es la mejor comprobación de un enlace sospechoso en un correo?
+ Pasar el ratón por encima para ver la dirección real sin pulsar
- Pulsarlo para ver qué pasa
- Fiarse del texto del enlace
= El texto del enlace puede decir una cosa y llevar a otra.

? ¿Qué palanca usa «Tu cuenta será eliminada en 2 horas si no la verificas»?
+ Urgencia
- Confianza
- Premio
= La prisa impide pensar.

? Alguien con las manos ocupadas te pide que le abras la puerta de la oficina con tu tarjeta. ¿Cómo se llama ese ataque?
+ Tailgating
- Phishing
- Fuerza bruta
= La seguridad física también es ciberseguridad.

? ¿Cuál de estos adjuntos es más sospechoso en un correo inesperado?
+ factura.zip que contiene factura.pdf.exe
- Una foto en .jpg de un compañero conocido
- Un .pdf que esperabas de tu gestor
= La doble extensión esconde un ejecutable.
:::

=== c1-malware | Malware: virus, troyanos y ransomware | 14 | 1
**Malware** es cualquier software malicioso. Conocer los tipos ayuda a entender cómo llegan y qué hacen.

| Tipo | Qué hace |
|---|---|
| **Virus** | Se adjunta a archivos y se propaga cuando se ejecutan |
| **Gusano** | Se propaga solo por la red, sin intervención humana |
| **Troyano** | Se hace pasar por un programa útil y abre la puerta al atacante |
| **Ransomware** | Cifra los archivos y pide un rescate; hoy además roba datos y amenaza con publicarlos |
| **Spyware / keylogger** | Espía: registra lo que tecleas o lo que haces |
| **Botnet** | Convierte el equipo en un «zombi» controlado a distancia junto a miles más |
| **Rootkit** | Se esconde en lo más profundo del sistema para no ser detectado |

## Cómo entra

- Adjuntos y enlaces de **phishing** (la vía más común).
- Programas **piratas** o descargados de webs no oficiales.
- **Vulnerabilidades** sin parchear en sistemas expuestos a Internet.
- Memorias **USB** desconocidas.
- Accesos remotos (RDP) con contraseñas débiles.

## Cómo se defiende una empresa

- **Antivirus / EDR** en todos los equipos: el EDR además vigila el comportamiento y permite aislar un equipo a distancia.
- **Actualizaciones** al día.
- **Mínimo privilegio**: si el usuario no es administrador, el malware tampoco.
- **Copias de seguridad** desconectadas: la mejor respuesta al ransomware.
- **Formación**: la mayoría del malware necesita que alguien lo abra.

::: quiz
? ¿Qué diferencia a un gusano de un virus?
+ El gusano se propaga solo por la red, sin que nadie ejecute nada
- El gusano solo afecta a móviles
- No hay diferencia
= Por eso los gusanos pueden infectar miles de equipos en horas.

? ¿Cuál es la mejor defensa ante el ransomware?
+ Copias de seguridad desconectadas y probadas
- Pagar el rescate rápido
- Apagar el antivirus para que no moleste
= Con una copia limpia, se restaura sin pagar.

? Un programa gratuito de una web dudosa funciona bien, pero abre un acceso remoto al atacante. Es un…
+ Troyano
- Gusano
- Rootkit
= Se disfraza de algo útil.
:::

::: banco
? ¿Qué añade un EDR respecto a un antivirus clásico?
+ Vigila el comportamiento y permite investigar y aislar equipos a distancia
- Nada, es el mismo programa
- Solo funciona en servidores
= Detecta también ataques sin archivos maliciosos conocidos.

? ¿Por qué el mínimo privilegio frena al malware?
+ El malware tiene los mismos permisos que el usuario que lo ejecuta
- Porque el antivirus funciona mejor
- Porque cifra el disco
= Sin permisos de administrador no puede instalarse a fondo.

? ¿Qué es una botnet?
+ Una red de equipos infectados controlados a distancia por el atacante
- Un antivirus en la nube
- Un tipo de cortafuegos
= Se usan para enviar spam o lanzar ataques de denegación de servicio.

? ¿Qué hace el ransomware moderno además de cifrar?
+ Roba los datos y amenaza con publicarlos (doble extorsión)
- Nada más
- Repara los archivos dañados
= Por eso las copias de seguridad no bastan por sí solas.
:::

=== c1-higiene | Buenas prácticas: lo que evita la mayoría de los incidentes | 14 | 1
La mayoría de los incidentes no requiere atacantes geniales: aprovechan descuidos básicos. Estas prácticas, bien aplicadas, cortan gran parte del riesgo.

## Las básicas

1. **Actualizar** sistema, navegador y programas. Muchas intrusiones usan fallos con parche publicado hace meses.
2. **MFA** en todo lo importante: correo, VPN, administración, banca.
3. **Contraseñas únicas** con un gestor.
4. **Mínimo privilegio**: cada persona y cada programa, solo los permisos que necesita.
5. **Copias de seguridad 3-2-1**: 3 copias, en 2 soportes distintos, 1 fuera de la oficina (y desconectada o inmutable). Y **probar** que se restauran.
6. **Bloquear la pantalla** al levantarse (Windows + L).
7. **Cifrar** portátiles y móviles: si se pierden, los datos no se leen.
8. **Wi-Fi**: WPA2/WPA3 con buena clave y una red aparte para invitados.

## En el trabajo diario

- No instalar programas por tu cuenta: pide a TI.
- No conectar USB desconocidos.
- Cuidado con lo que publicas: tu cargo y tu empresa en redes sociales son material para el spear phishing.
- **Avisar** de cualquier cosa rara. En seguridad, avisar de más es mucho mejor que callar.

::: practica
Revisa hoy tus cuentas personales: ¿tienen MFA el correo y la banca? ¿Usas la misma contraseña en varios sitios? Un gestor de contraseñas gratuito y una tarde bastan para arreglarlo.
:::

::: quiz
? ¿Qué significa la regla 3-2-1 de copias de seguridad?
+ 3 copias, en 2 soportes distintos, 1 fuera de la oficina
- 3 discos, 2 servidores, 1 nube
- Copiar 3 veces al día, 2 días a la semana, 1 mes al año
= Y al menos una desconectada o inmutable frente al ransomware.

? ¿Por qué es tan importante actualizar?
+ Muchos ataques usan fallos que ya tienen parche publicado
- Para tener iconos nuevos
- Porque las versiones antiguas son más lentas
= Los atacantes analizan los parches para atacar a quien no los aplica.

? ¿Qué atajo bloquea la pantalla en Windows?
+ Windows + L
- Ctrl + Alt + Supr
- Alt + F4
= Bloquear al levantarse evita accesos de quien pasa por tu mesa.
:::

::: banco
? ¿Qué copia de seguridad protege mejor frente al ransomware?
+ Una desconectada de la red o inmutable
- Una carpeta compartida siempre conectada
- Una copia en el mismo disco
= El ransomware cifra todo lo que alcanza en la red.

? Una copia de seguridad que nunca se ha probado a restaurar…
+ Puede no servir cuando haga falta
- Es siempre válida
- Es más segura
= Hay que hacer pruebas de restauración periódicas.

? ¿Para qué sirve una red Wi-Fi aparte para invitados?
+ Para que los equipos de visitantes no lleguen a la red interna
- Para que vaya más rápido
- Para ahorrar electricidad
= Es segmentación aplicada al Wi-Fi.

? ¿Por qué cifrar el disco de un portátil?
+ Si se pierde o lo roban, no se pueden leer los datos
- Para que arranque más rápido
- Para no necesitar contraseña
= BitLocker (Windows) o FileVault (macOS).
:::
