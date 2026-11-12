# Loopback

Plataforma de aprendizaje con **seis áreas**, de principiante a nivel de empleo: **Redes** (temario completo del **Cisco CCNA 200-301**), **Bases de datos**, **Programación**, **Ciberseguridad**, **Empleo TI** (soporte técnico, mesa de ayuda, Windows y administración corporativa) e **Inglés técnico para TI**.

> No es un curso oficial de Cisco ni otorga certificaciones oficiales. Los certificados de Loopback solo acreditan que terminaste un área: no están avalados por ninguna institución y no influyen en conseguir un empleo.

## Qué incluye

| | |
| --- | --- |
| **182 lecciones** en 6 áreas y 3 niveles | **Redes** (77 lecciones: los 6 dominios del CCNA, IPv6, Wireshark y temas más allá del CCNA), **Bases de datos** (29: modelo relacional, SQL, diseño, rendimiento, transacciones, administración, NoSQL y análisis de datos), **Programación** (33: fundamentos, lenguajes, Git, POO, APIs, algoritmos, código seguro, depuración, Linux, web y automatización), **Empleo TI** (21: soporte, mesa de ayuda, Windows, Active Directory, hardware, phishing, entrevistas y rutas profesionales) **Ciberseguridad** (16: fundamentos, contraseñas y hashes, ingeniería social, malware, criptografía, TLS, cortafuegos, OWASP, vulnerabilidades, registros, SOC, respuesta a incidentes, normas y carrera) e **Inglés técnico** (6: vocabulario, errores, documentación, tickets, llamadas y entrevista) |
| **Escalera por área** | Los módulos se desbloquean en orden. Cada escalón termina con un examen (mínimo 80 %) con preguntas distintas en cada intento, y el área con un examen final |
| **Exámenes con tiempo total** | 20 minutos en nivel principiante, 35 en intermedio, 45 en avanzado y 60 en el examen final. Al acabarse el tiempo se entrega solo con lo respondido |
| **Certificado de Loopback** | Al aprobar el examen final de un área: con tu nombre, la firma de Gabriel PD y un código. Se descarga como imagen o se guarda como PDF |
| **Laboratorio de código** | Python (Pyodide) y JavaScript ejecutados en el navegador, en un entorno aislado, con ejercicios corregidos automáticamente |
| **12 animaciones y 14 vídeos narrados** | Encapsulación, switch, ARP, TCP, DHCP, DNS, VLAN, STP, enrutamiento, NAT, ACL, OSPF y más, paso a paso |
| **Simulador de topologías** | Lienzo donde se colocan PC, switches, routers y servidores, se conectan con cables y se configuran (IP, VLAN, troncales, subinterfaces, rutas estáticas y DHCP). El ping se anima salto a salto y, si falla, dice exactamente dónde y por qué. 8 retos corregidos solos y un modo libre |
| **Simulador de Cisco IOS** | Laboratorios guiados y de averías que se corrigen sobre el estado del equipo; Tab autocompleta y hay pistas |
| **Guía de comandos** | Comandos de IOS por tema y nivel: qué hacen, en qué modo, un ejemplo y el laboratorio donde practicarlos |
| **Entrenadores** | Subnetting, binario y VLSM con ejercicios infinitos y explicación |
| **Laboratorio SQL** | SQLite en el navegador (WebAssembly) con el inventario de red de una empresa |
| **Casos de soporte** | Tickets simulados con prioridad, SLA y turnos de mesa de ayuda |
| **Terminales simuladas** | Consola de Windows (ipconfig, ping, nslookup…), terminal Linux (archivos, permisos, procesos, registros) y Git visual con el grafo de commits |
| **Más laboratorios** | IPv6, seguridad de capa 2 (DHCP snooping, DAI), lectura de capturas tipo Wireshark, caso detective SQL, inyección SQL, diagrama entidad-relación, formas normales, dos sesiones concurrentes, análisis de datos con gráficos, Active Directory, armar un PC, averías de hardware, phishing, atención al usuario y entrevista |
| **Laboratorios de ciberseguridad** | Analizador de contraseñas, hashes con sal y ataque de diccionario, retos de criptografía, cortafuegos con DMZ, análisis de auth.log y access.log, y casos de respuesta a incidentes (ransomware y cuenta comprometida) |
| **Inglés técnico** | Vocabulario con pronunciación, lectura de errores y documentación, frases para tickets, llamadas y entrevistas |
| **Reto diario y racha** | Cinco preguntas cada día y racha de días seguidos |
| **Glosario** | 130 términos con definición emergente dentro de las lecciones |
| **Mi CV** | Currículum generado con lo que has completado en cada área |
| **Sin conexión** | Un service worker guarda lo visitado para estudiar sin internet |
| **895 preguntas** | Cuestionario en cada lección, banco de preguntas de examen y preguntas de razonamiento generadas |
| **Buscador del curso** | Desde cualquier página, encuentra las lecciones y el fragmento que responden a una duda |
| **Ejecución paso a paso** | Python ejecutado línea a línea: la línea actual, las variables de cada marco de la pila (con lo que cambia resaltado y el número de objeto de cada lista) y la salida. En 6 programas comentados con preguntas y en todos los ejercicios de Python |
| **Panel del profesor** | El profesor crea una clase con un código, ve el progreso de cada alumno por área (lecciones, prácticas, escalones y examen final) y lo descarga en CSV. El alumno se une aceptando compartir su progreso con un alias, sin mostrar su correo, y puede salir cuando quiera |
| **Cuentas** | Registro con confirmación por correo, verificación en dos pasos y progreso sincronizado |

## Lenguajes y tecnologías

- **HTML, CSS y JavaScript** (módulos ES, sin frameworks) para la web.
- **Python** compila el temario (`contenido/*.md` → `data/*.json`).
- **SQL (PostgreSQL)** para la base de datos con seguridad a nivel de fila.
- **SQL (SQLite/WebAssembly)** en el laboratorio de bases de datos.
- **YAML** para la integración continua en GitHub Actions.

## Seguridad

- Política de seguridad de contenidos (**CSP**) estricta en todas las páginas: sin scripts ni estilos en línea, solo se conecta con el propio sitio y con Supabase. Protección contra *clickjacking*.
- El DOM se construye sin `innerHTML`.
- **Row Level Security** forzada en todas las tablas: cada alumno solo puede leer y escribir lo suyo. Si activa la verificación en dos pasos, sus datos exigen una sesión verificada (aal2).
- El panel del profesor no abre la tabla de progreso: el profesor solo obtiene, mediante una función que comprueba que la clase es suya, el progreso de quienes se unieron con su código y aceptaron compartirlo.
- El código que escriben los alumnos se ejecuta en un `iframe` con `sandbox="allow-scripts"` (origen opaco) y dentro de un Worker con tiempo límite: no puede leer la sesión, las cookies ni el almacenamiento de la web.
- En los exámenes, copiar o salir de la pantalla queda registrado y el enunciado lleva una marca de agua.
- Contraseñas de 12+ caracteres, recuperación sin revelar qué correos existen, cierre de sesión en todos los dispositivos y eliminación de la cuenta.
- Las pruebas automáticas comprueban la CSP, que no haya código inseguro ni claves en el repositorio, y las reglas RLS sobre un PostgreSQL real.

## Trabajar en el proyecto

```bash
npm install          # solo para las pruebas de la base de datos
npm run build        # compila el temario y genera las páginas
npm test             # pruebas
python3 -m http.server 8000   # y abre http://localhost:8000
```

- El temario está en `contenido/*.md` (formato explicado al principio de `scripts/build_curso.py`).
- Las páginas se editan en `src/paginas/*.html`; `node scripts/paginas.mjs` genera las del directorio raíz con la cabecera, el pie y la CSP.
- Para activar las cuentas, sigue **[docs/CONFIGURAR.md](docs/CONFIGURAR.md)**.

Sin configurar Supabase la web funciona igualmente en **modo invitado** (progreso guardado en el navegador).

## Licencias de terceros

`vendor/` incluye [supabase-js](https://github.com/supabase/supabase-js) (MIT), [sql.js](https://github.com/sql-js/sql.js) (MIT) y [Pyodide](https://github.com/pyodide/pyodide) 0.27.7 (MPL-2.0, ficheros sin modificar); ver sus archivos de licencia.
