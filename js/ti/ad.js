// Active Directory simulado (dominio laceiba.local) con una cola de tickets de mesa de ayuda. Sin DOM: se prueba en
// Node. Las acciones devuelven { ok, msg } y el estado guarda lo hecho para comprobar cada ticket.

export const OUS = ['Contabilidad', 'Ventas', 'Recepción', 'Soporte TI', 'Bajas'];
export const GRUPOS = {
  GG_Contabilidad: 'Carpetas y programas de contabilidad', GG_Ventas: 'Carpetas y CRM de ventas', GG_Recepcion: 'Agenda y carpeta de recepción',
  GG_VPN: 'Acceso remoto por VPN', GG_Impresoras: 'Impresoras de la oficina', 'Admins. del dominio': 'Control total del dominio (solo TI)',
};
const U = (usuario, nombre, ou, grupos, extra = {}) => ({ usuario, nombre, ou, grupos, bloqueada: false, deshabilitada: false, cambiarAlEntrar: false, cargo: '', ...extra });

export function nuevoAd() {
  return {
    usuarios: [
      U('mfernandez', 'Marta Fernández', 'Contabilidad', ['GG_Contabilidad', 'GG_Impresoras'], { bloqueada: true, cargo: 'Contable' }),
      U('rvaldez', 'Rosa Valdez', 'Contabilidad', ['GG_Contabilidad', 'GG_Impresoras'], { cargo: 'Jefa de contabilidad' }),
      U('psantos', 'Pedro Santos', 'Ventas', ['GG_Ventas', 'GG_Impresoras'], { cargo: 'Vendedor' }),
      U('jmartinez', 'Jorge Martínez', 'Ventas', ['GG_Ventas', 'GG_Impresoras'], { cargo: 'Vendedor' }),
      U('cpena', 'Carlos Peña', 'Ventas', ['GG_Ventas', 'GG_Impresoras', 'GG_VPN'], { cargo: 'Coordinador de ventas' }),
      U('abatista', 'Ana Batista', 'Recepción', ['GG_Recepcion', 'GG_Impresoras'], { cargo: 'Recepcionista' }),
      U('lrosario', 'Luis Rosario', 'Soporte TI', ['Admins. del dominio', 'GG_VPN', 'GG_Impresoras'], { cargo: 'Administrador de sistemas' }),
    ],
    verificados: new Set(), contrasenas: {}, registro: [], rechazados: new Set(), cerrados: new Set(),
  };
}

export const buscar = (s, usuario) => s.usuarios.find(u => u.usuario === usuario);
const anotar = (s, t) => { s.registro.push(t); return { ok: true, msg: t }; };
export function contrasenaValida(c) {
  if (c.length < 12) return 'Debe tener al menos 12 caracteres.';
  if (!/[a-z]/.test(c) || !/[A-Z]/.test(c) || !/\d/.test(c)) return 'Debe combinar minúsculas, mayúsculas y números.';
  return null;
}

// ---------------------------------------------------------------- acciones
export function verificarIdentidad(s, usuario) { s.verificados.add(usuario); return anotar(s, `Identidad de ${usuario} verificada (llamada de vuelta a su extensión registrada).`); }
export function desbloquear(s, usuario) { const u = buscar(s, usuario); if (!u.bloqueada) return { ok: false, msg: 'La cuenta no está bloqueada.' }; u.bloqueada = false; return anotar(s, `Cuenta ${usuario} desbloqueada.`); }
export function restablecer(s, usuario, nueva, cambiar) {
  const u = buscar(s, usuario);
  if (!s.verificados.has(usuario)) { s.sinVerificar = true; return { ok: false, msg: 'Antes de restablecer una contraseña hay que verificar la identidad de quien la pide (procedimiento de la empresa).' }; }
  const e = contrasenaValida(nueva); if (e) return { ok: false, msg: 'Contraseña no válida: ' + e };
  s.contrasenas[usuario] = nueva; u.cambiarAlEntrar = !!cambiar; u.bloqueada = false;
  return anotar(s, `Contraseña de ${usuario} restablecida${cambiar ? '; deberá cambiarla al iniciar sesión' : ''}.`);
}
export function crearUsuario(s, { nombre, apellido, usuario, ou, contrasena, cambiar }) {
  usuario = String(usuario || '').trim().toLowerCase();
  if (!nombre || !apellido || !usuario) return { ok: false, msg: 'Faltan el nombre, el apellido o el nombre de inicio de sesión.' };
  if (!/^[a-z][a-z0-9.]{2,19}$/.test(usuario)) return { ok: false, msg: 'El nombre de inicio de sesión solo admite minúsculas, números y puntos (3 a 20 caracteres).' };
  if (buscar(s, usuario)) return { ok: false, msg: `Ya existe una cuenta con el inicio de sesión ${usuario}.` };
  if (!OUS.includes(ou)) return { ok: false, msg: 'Elige una unidad organizativa.' };
  const e = contrasenaValida(contrasena || ''); if (e) return { ok: false, msg: 'Contraseña inicial no válida: ' + e };
  s.usuarios.push(U(usuario, `${nombre.trim()} ${apellido.trim()}`, ou, ['GG_Impresoras'], { cambiarAlEntrar: !!cambiar }));
  s.contrasenas[usuario] = contrasena;
  return anotar(s, `Usuario ${usuario} creado en ${ou}.`);
}
export function mover(s, usuario, ou) { const u = buscar(s, usuario); if (!OUS.includes(ou)) return { ok: false, msg: 'Unidad organizativa desconocida.' }; u.ou = ou; return anotar(s, `${usuario} movido a la OU ${ou}.`); }
export function ponerGrupo(s, usuario, grupo, dentro) {
  const u = buscar(s, usuario);
  if (!GRUPOS[grupo]) return { ok: false, msg: 'Grupo desconocido.' };
  if (dentro && !u.grupos.includes(grupo)) { u.grupos.push(grupo); if (grupo === 'Admins. del dominio') s.adminIndebido = usuario !== 'lrosario'; return anotar(s, `${usuario} añadido a ${grupo}.`); }
  if (!dentro && u.grupos.includes(grupo)) { u.grupos = u.grupos.filter(g => g !== grupo); return anotar(s, `${usuario} quitado de ${grupo}.`); }
  return { ok: true, msg: '' };
}
export function habilitar(s, usuario, si) { const u = buscar(s, usuario); u.deshabilitada = !si; return anotar(s, `Cuenta ${usuario} ${si ? 'habilitada' : 'deshabilitada'}.`); }
export function borrar(s, usuario) { s.usuarios = s.usuarios.filter(u => u.usuario !== usuario); s.borrados = [...(s.borrados || []), usuario]; return anotar(s, `Cuenta ${usuario} eliminada.`); }

// ---------------------------------------------------------------- tickets
const tiene = (s, us, g) => buscar(s, us)?.grupos.includes(g);
export const TICKETS = [
  { id: 'T-5101', prioridad: 'P2', de: 'Marta Fernández (Contabilidad)', texto: 'Me equivoqué varias veces con la contraseña y ahora dice que mi cuenta está bloqueada. Recuerdo bien la contraseña.',
    ok: s => !buscar(s, 'mfernandez').bloqueada && !s.contrasenas.mfernandez, error: s => (s.contrasenas.mfernandez ? 'Recuerda su contraseña: bastaba con desbloquear la cuenta, sin cambiarla.' : 'La cuenta sigue bloqueada.') },
  { id: 'T-5102', prioridad: 'P2', de: 'Pedro Santos (Ventas)', texto: 'Olvidé mi contraseña después de las vacaciones. ¿Me la pueden cambiar?',
    ok: s => !!s.contrasenas.psantos && buscar(s, 'psantos').cambiarAlEntrar, error: s => (!s.contrasenas.psantos ? 'Verifica su identidad y restablece la contraseña con una temporal.' : 'Marca que deba cambiar la contraseña al iniciar sesión: la temporal la conoces tú.') },
  { id: 'T-5103', prioridad: 'P3', de: 'Rosa Valdez (Contabilidad)', texto: 'Nueva empleada en Ventas: Laura Méndez, empieza el lunes. Usuario lmendez, por favor, con acceso a lo de ventas.',
    ok: s => { const u = buscar(s, 'lmendez'); return !!u && u.ou === 'Ventas' && u.grupos.includes('GG_Ventas') && u.cambiarAlEntrar && !u.deshabilitada; }, error: s => (!buscar(s, 'lmendez') ? 'Crea el usuario lmendez en la OU Ventas.' : 'Comprueba la OU (Ventas), el grupo GG_Ventas y que deba cambiar la contraseña al entrar.') },
  { id: 'T-5104', prioridad: 'P3', de: 'Recursos Humanos', texto: 'Jorge Martínez pasa de Ventas a Contabilidad desde hoy.',
    ok: s => { const u = buscar(s, 'jmartinez'); return u.ou === 'Contabilidad' && u.grupos.includes('GG_Contabilidad') && !u.grupos.includes('GG_Ventas'); }, error: () => 'Muévelo a la OU Contabilidad, añádelo a GG_Contabilidad y quítalo de GG_Ventas (mínimo privilegio).' },
  { id: 'T-5105', prioridad: 'P1', de: 'Recursos Humanos', texto: 'Carlos Peña deja la empresa hoy a las 17:00. Hay que cortar su acceso, pero su jefe necesita revisar sus correos y archivos durante un mes.',
    ok: s => { const u = buscar(s, 'cpena'); return !!u && u.deshabilitada && u.ou === 'Bajas' && !u.grupos.includes('GG_VPN'); }, error: s => (!buscar(s, 'cpena') ? 'Se eliminó la cuenta: así se pierden su buzón y sus permisos. En una baja se deshabilita, no se borra.' : 'Deshabilita la cuenta, muévela a la OU Bajas y quítale la VPN.') },
  { id: 'T-5106', prioridad: 'P3', de: 'Ana Batista (Recepción)', texto: 'Mi jefa aprobó que trabaje desde casa los viernes. Necesito la VPN. (Aprobación adjunta.)',
    ok: s => tiene(s, 'abatista', 'GG_VPN'), error: () => 'Añádela al grupo GG_VPN.' },
  { id: 'T-5107', prioridad: 'P4', de: 'Rosa Valdez (Contabilidad)', texto: 'Hazme administradora del dominio, así instalo yo los programas y no os molesto.', rechazar: true,
    ok: s => s.rechazados.has('T-5107') && !tiene(s, 'rvaldez', 'Admins. del dominio'), error: s => (tiene(s, 'rvaldez', 'Admins. del dominio') ? '¡Le diste control total del dominio! Quítala de Admins. del dominio.' : 'Este ticket no se resuelve dando permisos: recházalo y ofrece instalarle el programa.') },
];

export function cerrarTicket(s, id) {
  const t = TICKETS.find(x => x.id === id);
  if (t.ok(s)) { s.cerrados.add(id); return { ok: true, msg: `${id} cerrado correctamente.` }; }
  return { ok: false, msg: t.error(s) };
}
export function rechazarTicket(s, id) {
  const t = TICKETS.find(x => x.id === id);
  if (!t.rechazar) return { ok: false, msg: 'Este ticket es una petición legítima: no se rechaza.' };
  s.rechazados.add(id);
  return cerrarTicket(s, id);
}
