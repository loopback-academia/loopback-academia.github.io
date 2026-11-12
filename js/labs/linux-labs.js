// Casos de administración con la terminal Linux. Cada tarea se comprueba sobre el estado del servidor simulado.
const H = '/home/alumno';
const FALLOS = [['185.220.101.47', 'admin'], ['185.220.101.47', 'root'], ['203.0.113.9', 'test'], ['185.220.101.47', 'ubuntu'], ['185.220.101.47', 'admin'], ['185.220.101.47', 'oracle'], ['203.0.113.9', 'pi'], ['185.220.101.47', 'admin'], ['185.220.101.47', 'postgres'], ['185.220.101.47', 'git'], ['185.220.101.47', 'admin'], ['203.0.113.9', 'user'], ['185.220.101.47', 'ftp'], ['185.220.101.47', 'admin'], ['185.220.101.47', 'www'], ['185.220.101.47', 'deploy'], ['185.220.101.47', 'admin']];
const AUTH = [
  'Nov 12 02:58:10 srv-web01 sshd[2101]: Accepted publickey for alumno from 10.0.0.25 port 50122 ssh2',
  ...FALLOS.map(([ip, u], k) => `Nov 12 03:${String(10 + k).padStart(2, '0')}:0${k % 10} srv-web01 sshd[${2200 + k}]: Failed password for invalid user ${u} from ${ip} port ${51000 + k * 7} ssh2`),
  'Nov 12 08:01:44 srv-web01 sshd[2410]: Accepted publickey for alumno from 10.0.0.25 port 50311 ssh2',
  'Nov 12 08:02:01 srv-web01 sudo:   alumno : TTY=pts/0 ; PWD=/home/alumno ; USER=root ; COMMAND=/usr/bin/apt update',
].join('\n') + '\n';

export const LINUX_LABS = {
  archivos: {
    nivel: 'principiante',
    titulo: 'Moverse y organizar archivos',
    intro: 'Primer día como administrador junior del servidor web de la intranet (srv-web01). Antes de tocar nada importante, practica lo básico: dónde estás, crear carpetas y archivos, copiar y listar.',
    equipo: {},
    tareas: [
      { texto: 'Comprueba en qué carpeta estás (pwd).', ok: s => s.patrones.has('pwd') },
      { texto: 'Crea la carpeta proyectos/web dentro de tu carpeta personal (de una vez, con -p).', ok: s => s.fs.get(H + '/proyectos/web')?.tipo === 'dir' },
      { texto: 'Crea proyectos/notas.txt con el texto «Servidor web de la intranet».', ok: s => /Servidor web de la intranet/.test(s.fs.get(H + '/proyectos/notas.txt')?.contenido || '') },
      { texto: 'Copia notas.txt dentro de proyectos/web con el nombre leeme.txt.', ok: s => /Servidor web/.test(s.fs.get(H + '/proyectos/web/leeme.txt')?.contenido || '') },
      { texto: 'Lista con detalle (permisos, dueño, tamaño) el contenido de proyectos.', ok: s => s.historial.some(h => /^ls\s+(-\w*l\w*\s+)?.*proyectos|^ls\s+-\w*l/.test(h)) && s.patrones.has('ls') },
    ],
    pistas: ['mkdir -p crea también las carpetas intermedias que falten.', 'echo "texto" > archivo crea el archivo con ese texto (> lo sobrescribe; >> añade al final).', 'cp origen destino copia; ls -l muestra el detalle.'],
    solucion: ['pwd', 'mkdir -p proyectos/web', 'echo "Servidor web de la intranet" > proyectos/notas.txt', 'cp proyectos/notas.txt proyectos/web/leeme.txt', 'ls -l proyectos'],
  },
  permisos: {
    nivel: 'principiante',
    titulo: 'Permisos y propietarios',
    intro: 'Un compañero dejó en tu carpeta un script de copia de seguridad que no se ejecuta, y un archivo de claves que cualquiera puede leer. Además, la web no puede leer un informe porque es de root.',
    equipo: {
      estadoInicial: (s, { arch }) => {
        arch(H + '/backup.sh', '#!/bin/bash\ntar czf /tmp/backup-$(date +%F).tar.gz /var/www/html\n', { dueno: 'alumno', grupo: 'alumno', modo: 0o644, salidaScript: 'Copia guardada en /tmp/backup-2026-11-12.tar.gz' });
        arch(H + '/claves.txt', 'API_TOKEN=ejemplo-no-real\n', { dueno: 'alumno', grupo: 'alumno', modo: 0o666 });
        arch('/var/www/html/reporte.html', '<h1>Reporte mensual</h1>\n', { modo: 0o600 });
      },
    },
    tareas: [
      { texto: 'Intenta ejecutar ./backup.sh y lee el error.', ok: s => !!s.permisoDenegado },
      { texto: 'Mira los permisos de los archivos con ls -l.', ok: s => s.historial.some(h => /^ls\s+-\w*l/.test(h)) },
      { texto: 'Dale permiso de ejecución al script, solo para ti, y ejecútalo.', ok: s => (s.scriptsEjecutados || []).includes(H + '/backup.sh') && !(s.fs.get(H + '/backup.sh').modo & 0o011) },
      { texto: 'Deja claves.txt para que solo tú puedas leerlo y escribirlo (600).', ok: s => s.fs.get(H + '/claves.txt').modo === 0o600 },
      { texto: 'Haz que /var/www/html/reporte.html pertenezca al usuario y grupo www-data.', ok: s => s.fs.get('/var/www/html/reporte.html').dueno === 'www-data' && s.fs.get('/var/www/html/reporte.html').grupo === 'www-data' },
    ],
    pistas: ['Los permisos rwx van en tres grupos: dueño, grupo y otros. chmod u+x da ejecución solo al dueño.', 'En números: r = 4, w = 2, x = 1. 600 = rw- para el dueño y nada para los demás.', 'Cambiar el dueño de un archivo de root necesita sudo: sudo chown www-data:www-data archivo.'],
    solucion: ['./backup.sh', 'ls -l', 'chmod u+x backup.sh', './backup.sh', 'chmod 600 claves.txt', 'sudo chown www-data:www-data /var/www/html/reporte.html'],
  },
  logs: {
    nivel: 'intermedio',
    titulo: 'Investigar ataques en los registros',
    intro: 'El servidor va lento de madrugada y sospechas que alguien intenta entrar por SSH. El registro de autenticación (/var/log/auth.log) solo lo puede leer el administrador.',
    equipo: { estadoInicial: (s, { arch }) => { arch('/var/log/auth.log', AUTH, { modo: 0o640, grupo: 'adm' }); } },
    tareas: [
      { texto: 'Lee las últimas líneas de /var/log/auth.log (necesitarás sudo).', ok: s => s.patrones.has('sudo tail') || s.patrones.has('sudo cat') },
      { texto: 'Cuenta cuántos intentos fallidos («Failed password») hay.', ok: s => s.salidas.includes(String(FALLOS.length)) },
      { texto: 'Averigua qué IP hizo más intentos (grep, awk, sort y uniq -c).', ok: s => s.historial.some(h => /uniq -c/.test(h)) && s.salidas.some(x => /^\s*14 185\.220\.101\.47$/.test(x.split('\n')[0])) },
      { texto: 'Guarda la IP atacante en ~/informe.txt.', ok: s => /185\.220\.101\.47/.test(s.fs.get(H + '/informe.txt')?.contenido || '') },
    ],
    pistas: ['sudo grep "Failed password" /var/log/auth.log | wc -l cuenta las líneas que coinciden.', "awk '{print $13}' saca la columna 13 de cada línea, donde está la IP en estos mensajes.", 'sort | uniq -c cuenta repetidos; sort -rn los ordena de mayor a menor.'],
    solucion: ['sudo tail /var/log/auth.log', 'sudo grep "Failed password" /var/log/auth.log | wc -l', "sudo grep \"Failed password\" /var/log/auth.log | awk '{print $13}' | sort | uniq -c | sort -rn | head -1", 'echo "IP atacante: 185.220.101.47" > informe.txt'],
  },
  servicio: {
    nivel: 'intermedio',
    titulo: 'La intranet no carga: nginx caído',
    intro: 'Esta mañana nadie puede abrir la intranet. Ayer alguien instaló paquetes «para probar» en el servidor. Sospechas del servidor web nginx.',
    equipo: {
      estadoInicial: s => {
        s.servicios.apache2 = { activo: true, habilitado: true, puerto: 80 };
        Object.assign(s.servicios.nginx, { activo: false, fallo: true, motivo: 'bind() to 0.0.0.0:80 failed (98: Address already in use)' });
        s.paquetes.add('apache2');
      },
    },
    tareas: [
      { texto: 'Revisa el estado del servicio nginx.', ok: s => s.patrones.has('systemctl status') || s.patrones.has('sudo systemctl status') },
      { texto: 'Lee su registro para encontrar la causa (journalctl).', ok: s => s.patrones.has('journalctl') || s.patrones.has('sudo journalctl') },
      { texto: 'Comprueba qué programa ocupa el puerto 80 (ss -tuln).', ok: s => s.patrones.has('ss') || s.patrones.has('sudo ss') },
      { texto: 'Detén apache2 y desactívalo para que no arranque al reiniciar.', ok: s => !s.servicios.apache2.activo && !s.servicios.apache2.habilitado },
      { texto: 'Arranca nginx.', ok: s => s.servicios.nginx.activo },
      { texto: 'Verifica con curl http://localhost que responde la intranet.', ok: s => s.curlOk === 'nginx' },
    ],
    pistas: ['«Address already in use» significa que otro programa ya escucha en ese puerto.', 'ss -tuln lista los puertos en escucha y qué proceso los usa.', 'sudo systemctl stop apache2 lo detiene ahora; sudo systemctl disable apache2 evita que arranque solo.'],
    solucion: ['systemctl status nginx', 'journalctl -u nginx', 'ss -tuln', 'sudo systemctl stop apache2', 'sudo systemctl disable apache2', 'sudo systemctl start nginx', 'curl http://localhost'],
  },
  disco: {
    nivel: 'avanzado',
    titulo: 'Disco lleno: la base de datos no guarda',
    intro: 'La aplicación de ventas da error al guardar y el monitor avisa de que el disco del servidor está casi lleno. Encuentra qué ocupa el espacio y libéralo sin romper nada.',
    equipo: {
      estadoInicial: (s, { dir, arch }) => {
        s.disco.usadoBaseG = 9.6;
        dir('/var/log/app');
        arch('/var/log/app/app.log', '2026-11-12 09:40:01 INFO pedido 88213 guardado\n', { tamano: 22 * 1073741824 });
        arch('/var/log/app/app.log.1.gz', '', { tamano: 3.2 * 1073741824 });
        arch('/var/log/app/app.log.2.gz', '', { tamano: 3.1 * 1073741824 });
        arch('/var/log/syslog', 'Nov 12 09:40:00 srv-web01 CRON[2301]: (root) CMD (run-parts /etc/cron.hourly)\n', { tamano: 180 * 1048576 });
      },
    },
    tareas: [
      { texto: 'Comprueba el uso del disco (df -h).', ok: s => s.patrones.has('df') || s.patrones.has('sudo df') },
      { texto: 'Encuentra qué ocupa tanto dentro de /var/log (du -sh).', ok: s => s.patrones.has('du') || s.patrones.has('sudo du') },
      { texto: 'Borra los registros antiguos comprimidos (.gz) de /var/log/app.', ok: s => ![...s.fs.keys()].some(k => /^\/var\/log\/app\/.*\.gz$/.test(k)) },
      { texto: 'Vacía app.log sin borrarlo: la aplicación lo tiene abierto.', ok: s => s.fs.get('/var/log/app/app.log')?.tamano === 0 },
      { texto: 'Comprueba de nuevo con df -h que el disco tiene espacio.', ok: s => s.historial.filter(h => /^(sudo\s+)?df\b/.test(h)).length >= 2 && s.disco.usadoBaseG < 20 && /\b(2\d|1\d|\d)%/.test(s.salidas.filter(x => /Uso%/.test(x)).pop() || '') },
    ],
    pistas: ['du -sh /var/log/* muestra lo que ocupa cada elemento; sigue bajando hasta encontrar el archivo grande.', 'Los .gz son registros viejos ya rotados: se pueden borrar (o mover a otro disco) con sudo rm.', 'Si borras un archivo que un programa tiene abierto, el espacio no se libera. truncate -s 0 lo vacía sin borrarlo.'],
    solucion: ['df -h', 'sudo du -sh /var/log/*', 'sudo du -sh /var/log/app/*', 'sudo rm /var/log/app/*.gz', 'sudo truncate -s 0 /var/log/app/app.log', 'df -h'],
  },
};
