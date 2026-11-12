// Casos de soporte con la consola de Windows. Cada tarea se comprueba sobre el estado del PC simulado.

export const WIN_LABS = {
  apipa: {
    nivel: 'principiante',
    titulo: 'Sin internet: dirección 169.254',
    intro: 'Lunes, 8:05. La recepcionista dice que no tiene internet ni puede abrir el sistema de citas. El técnico de redes te avisa de que el servidor DHCP estuvo caído durante la noche y ya lo reinició.',
    equipo: { adaptador: { ip: '169.254.112.7', mask: '255.255.0.0', gw: null } },
    tareas: [
      { texto: 'Mira la configuración IP con ipconfig. Fíjate en la dirección IPv4.', ok: s => s.patrones.has('ipconfig') || s.patrones.has('ipconfig /all') },
      { texto: 'Pide una dirección nueva al servidor DHCP: libera y renueva.', ok: s => s.patrones.has('ipconfig /renew') && s.adaptador.ip === '192.168.10.57' },
      { texto: 'Comprueba que llegas a la puerta de enlace (192.168.10.1).', ok: s => s.ultimoPing['192.168.10.1'] === true },
      { texto: 'Comprueba que resuelve nombres y llega a internet: ping www.google.com.', ok: s => s.ultimoPing['www.google.com'] === true },
    ],
    pistas: ['Una dirección 169.254.x.x (APIPA) significa que el equipo no recibió respuesta del servidor DHCP.', 'ipconfig /release suelta la dirección actual e ipconfig /renew pide una nueva.', 'Prueba por capas: primero la puerta de enlace, después un nombre de internet.'],
    solucion: ['ipconfig', 'ipconfig /release', 'ipconfig /renew', 'ping 192.168.10.1', 'ping www.google.com'],
  },
  dns: {
    nivel: 'principiante',
    titulo: '«Internet no funciona», pero Teams sí',
    intro: 'Contabilidad llama: «no se abre ninguna página», aunque Teams sigue conectado. Sospechas que alguien configuró a mano un servidor DNS antiguo (10.0.0.99) que ya no existe.',
    equipo: { adaptador: { dns: ['10.0.0.99'], dnsEstatico: true }, dnsCache: { 'www.google.com': null } },
    tareas: [
      { texto: 'Demuestra que hay conectividad por IP: ping 8.8.8.8 con éxito.', ok: s => s.ultimoPing['8.8.8.8'] === true },
      { texto: 'Demuestra que el fallo es de DNS: nslookup www.google.com falla.', ok: s => !!s.nsFallo },
      { texto: 'Mira qué DNS tiene configurado (netsh interface ip show config o ipconfig /all).', ok: s => s.patrones.has('netsh interface') || s.patrones.has('ipconfig /all') },
      { texto: 'Vuelve a poner el DNS automático por DHCP con netsh.', ok: s => !s.adaptador.dnsEstatico && s.adaptador.dns.includes('192.168.10.5') },
      { texto: 'Vacía la caché DNS (guardó el fallo anterior).', ok: s => s.patrones.has('ipconfig /flushdns') && !Object.keys(s.dnsCache).length },
      { texto: 'Verifica: nslookup intranet.empresa.local y ping www.google.com con éxito.', ok: s => s.ultimoNslookup['intranet.empresa.local'] === true && s.ultimoPing['www.google.com'] === true },
    ],
    pistas: ['Si un ping a una IP funciona y a un nombre no, el problema es la resolución de nombres (DNS).', 'netsh interface ip set dns "Ethernet" dhcp devuelve el DNS al modo automático.', 'Windows guarda también las respuestas fallidas en caché: ipconfig /flushdns la vacía.'],
    solucion: ['ping 8.8.8.8', 'nslookup www.google.com', 'netsh interface ip show config', 'netsh interface ip set dns "Ethernet" dhcp', 'ipconfig /flushdns', 'nslookup intranet.empresa.local', 'ping www.google.com'],
  },
  impresora: {
    nivel: 'intermedio',
    titulo: 'La cola de impresión atascada',
    intro: 'En contabilidad nadie puede imprimir: los documentos se quedan «en cola». Un PDF de factura dañado bloqueó la cola de impresión de este PC, que comparte la impresora del departamento.',
    equipo: {
      hostname: 'PC-CONTA-01', usuario: 'rvaldez',
      estadoInicial: s => { s.servicios.Spooler.colgado = true; s.colaImpresion = [{ doc: 'Factura_0457.pdf', usuario: 'rvaldez', danado: true }, { doc: 'Conciliacion_octubre.xlsx', usuario: 'rvaldez' }, { doc: 'Contrato_proveedor.docx', usuario: 'abatista' }]; s.eventos = [{ nivel: 'Error', origen: 'PrintService', id: 372, texto: 'No se pudo imprimir el documento Factura_0457.pdf: el controlador devolvió un error.' }]; },
    },
    tareas: [
      { texto: 'Revisa el estado del servicio de cola de impresión (sc query spooler).', ok: s => s.patrones.has('sc query') },
      { texto: 'Mira la cola de impresión (printqueue) y localiza el trabajo con error.', ok: s => s.patrones.has('printqueue') },
      { texto: 'Detén el servicio y borra los trabajos atascados de la carpeta PRINTERS.', ok: s => s.colaImpresion.length === 0 },
      { texto: 'Vuelve a iniciar el servicio de cola de impresión.', ok: s => s.servicios.Spooler.estado === 'RUNNING' && !s.servicios.Spooler.colgado && s.colaImpresion.length === 0 },
    ],
    pistas: ['El servicio se llama Spooler.', 'Con el servicio en marcha, los archivos de la cola están bloqueados: primero net stop spooler.', 'Los trabajos están en C:\\Windows\\System32\\spool\\PRINTERS. Después, net start spooler. Avisa a los usuarios de que reenvíen sus documentos.'],
    solucion: ['sc query spooler', 'printqueue', 'net stop spooler', 'del /q C:\\Windows\\System32\\spool\\PRINTERS\\*', 'net start spooler', 'printqueue'],
  },
  lento: {
    nivel: 'intermedio',
    titulo: 'El PC va lentísimo',
    intro: 'Un usuario de ventas dice que su PC «va lentísimo» desde ayer: las ventanas tardan en abrir y a veces se congela. La consola ya está abierta como administrador.',
    equipo: {
      hostname: 'PC-VENTAS-07', usuario: 'psantos', admin: true, sistemaDanado: true,
      disco: { libreGB: 1.4, tempGB: 18.6 },
      estadoInicial: s => {
        s.procesos.push({ nombre: 'actualizador_pdf.exe', pid: 7712, mem: 3900, cpu: 96, forzar: true });
        s.eventos = [
          { nivel: 'Error', origen: 'Application Hang', id: 1002, texto: 'El programa actualizador_pdf.exe dejó de interactuar con Windows.' },
          { nivel: 'Advertencia', origen: 'srv', id: 2013, texto: 'El disco C: está al 99 % de su capacidad o cerca de ella.' },
          { nivel: 'Error', origen: 'Windows Resource Protection', id: 1009, texto: 'Se detectaron archivos de sistema que no coinciden con la versión original.' },
        ];
      },
    },
    tareas: [
      { texto: 'Revisa los errores recientes en el Visor de eventos (eventvwr).', ok: s => s.patrones.has('eventvwr') || s.patrones.has('get-winevent') },
      { texto: 'Lista los procesos (tasklist) y encuentra el que consume casi 4 GB de memoria.', ok: s => s.patrones.has('tasklist') },
      { texto: 'Termina ese proceso. No responde: tendrás que forzarlo.', ok: s => !s.procesos.some(p => p.nombre === 'actualizador_pdf.exe') },
      { texto: 'Comprueba el espacio libre de C: (dir o Get-PSDrive C).', ok: s => s.patrones.has('dir') || s.patrones.has('get-psdrive') },
      { texto: 'Libera espacio borrando los archivos temporales (%TEMP%).', ok: s => s.disco.libreGB > 15 },
      { texto: 'Repara los archivos de sistema dañados con sfc /scannow.', ok: s => !!s.sfcHecho && !s.sistemaDanado },
    ],
    pistas: ['taskkill /im nombre.exe /f termina un proceso por su nombre; /f lo fuerza si no responde.', 'No termines procesos del sistema (System, explorer.exe) a ciegas.', 'del /q %TEMP%\\* borra los temporales del usuario. Windows necesita espacio libre para funcionar bien (al menos un 10-15 %).'],
    solucion: ['eventvwr', 'tasklist', 'taskkill /im actualizador_pdf.exe /f', 'dir', 'del /q %TEMP%\\*', 'sfc /scannow'],
  },
  'unidad-red': {
    nivel: 'intermedio',
    titulo: 'Cambio de departamento: carpetas y directivas',
    intro: 'A Marta (mfernandez) la pasaron de Recepción a Contabilidad. Ayer el administrador la añadió al grupo Contabilidad en Active Directory, pero ella sigue sin poder abrir la carpeta \\\\srv-archivos\\contabilidad. Su unidad Y: de Recepción ya no le corresponde.',
    equipo: {
      estadoInicial: s => { s.gruposPendientes = ['EMPRESA\\Contabilidad']; s.gpo.pendientes = ['Unidades de red de Contabilidad']; s.unidades = { 'Y:': '\\\\SRV-ARCHIVOS\\recepcion' }; },
    },
    tareas: [
      { texto: 'Comprueba a qué grupos pertenece la sesión (whoami /groups).', ok: s => s.patrones.has('whoami /groups') },
      { texto: 'Intenta conectar Z: a \\\\srv-archivos\\contabilidad y fíjate en el error.', ok: s => !!s.accesoDenegado },
      { texto: 'Actualiza las directivas y la pertenencia a grupos (gpupdate /force).', ok: s => !!s.gpoActualizada },
      { texto: 'Conecta la unidad Z: a \\\\srv-archivos\\contabilidad.', ok: s => /contabilidad$/i.test(s.unidades['Z:'] || '') },
      { texto: 'Desconecta la unidad Y: de Recepción.', ok: s => !s.unidades['Y:'] },
      { texto: 'Verifica con gpresult /r que el grupo y la directiva nueva están aplicados.', ok: s => s.patrones.has('gpresult /r') && s.gpoActualizada && s.grupos.includes('EMPRESA\\Contabilidad') },
    ],
    pistas: ['«Error de sistema 5: Acceso denegado» = la ruta existe, pero tu usuario no tiene permiso.', 'Los cambios de grupo no llegan a una sesión abierta hasta que se actualiza (gpupdate /force) o se vuelve a iniciar sesión.', 'net use Z: \\\\srv-archivos\\contabilidad conecta la unidad; net use Y: /delete la quita.'],
    solucion: ['whoami /groups', 'net use Z: \\\\srv-archivos\\contabilidad', 'gpupdate /force', 'net use Z: \\\\srv-archivos\\contabilidad', 'net use Y: /delete', 'gpresult /r'],
  },
};
