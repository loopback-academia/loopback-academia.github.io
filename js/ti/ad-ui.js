// Consola «Usuarios y equipos de Active Directory» con una cola de tickets: el alumno resuelve cada ticket con la
// consola y lo cierra; la comprobación mira el estado del directorio.
import { el, toast } from '../core.js';
import { guardarLab, labHecho, cargar } from '../progreso.js';
import { nuevoAd, OUS, GRUPOS, TICKETS, buscar, verificarIdentidad, desbloquear, restablecer, crearUsuario, mover, ponerGrupo, habilitar, borrar, cerrarTicket, rechazarTicket } from './ad.js';

export async function montarAd(holder) {
  await cargar();
  let s = nuevoAd(), ou = 'Contabilidad', sel = null, filtro = '';
  const marcador = el('span', { class: 'badge badge-accent' });
  const tickets = el('div', { class: 'ad-tickets' });
  const arbol = el('nav', { class: 'ad-arbol', 'aria-label': 'Unidades organizativas' });
  const lista = el('div', { class: 'ad-lista' });
  const props = el('div', { class: 'ad-props', 'aria-live': 'polite' });
  const registro = el('ol', { class: 'ad-registro small' });
  const aviso = (r) => { if (r.msg) toast(r.msg); pintar(); };

  function pintarTickets() {
    marcador.textContent = `${s.cerrados.size}/${TICKETS.length} tickets`;
    tickets.replaceChildren(...TICKETS.map(t => {
      const cerrado = s.cerrados.has(t.id);
      const fb = el('p', { class: 'small feedback', role: 'status' });
      const cerrar = el('button', { type: 'button', class: 'btn btn-primary btn-sm', disabled: cerrado }, 'Cerrar ticket');
      const rechazar = el('button', { type: 'button', class: 'btn btn-quiet btn-sm', disabled: cerrado }, 'Rechazar');
      const tratar = r => { fb.className = 'small feedback ' + (r.ok ? 'ok' : 'bad'); fb.textContent = r.msg; if (r.ok) setTimeout(pintar, 600); comprobarFin(); };
      cerrar.addEventListener('click', () => tratar(cerrarTicket(s, t.id)));
      rechazar.addEventListener('click', () => tratar(rechazarTicket(s, t.id)));
      return el('article', { class: 'ad-ticket' + (cerrado ? ' cerrado' : '') },
        el('div', { class: 'ad-ticket-cab' }, el('strong', {}, t.id), el('span', { class: 'badge' + (t.prioridad === 'P1' ? ' badge-warn' : '') }, t.prioridad), cerrado ? el('span', { class: 'badge badge-ok' }, '✓ Cerrado') : null),
        el('p', { class: 'small muted' }, t.de), el('p', { class: 'small' }, t.texto),
        cerrado ? null : el('div', { class: 'hero-cta' }, cerrar, rechazar), fb);
    }));
  }
  function comprobarFin() {
    marcador.textContent = `${s.cerrados.size}/${TICKETS.length} tickets`;
    if (s.cerrados.size === TICKETS.length && !labHecho('ad-mesa')) { guardarLab('ad-mesa'); toast('¡Cola de tickets resuelta! Laboratorio completado.'); }
  }
  function pintarArbol() {
    arbol.replaceChildren(el('p', { class: 'small muted' }, '🌐 laceiba.local'), ...OUS.map(o => {
      const b = el('button', { type: 'button', class: 'ad-ou', 'aria-pressed': String(o === ou && !filtro) }, `📁 ${o} (${s.usuarios.filter(u => u.ou === o).length})`);
      b.addEventListener('click', () => { ou = o; filtro = ''; buscador.value = ''; pintar(); });
      return b;
    }));
  }
  const buscador = el('input', { type: 'search', placeholder: 'Buscar usuario…', 'aria-label': 'Buscar usuario', class: 'ad-buscar' });
  buscador.addEventListener('input', () => { filtro = buscador.value.trim().toLowerCase(); pintar(); });
  function pintarLista() {
    const us = filtro ? s.usuarios.filter(u => (u.nombre + ' ' + u.usuario).toLowerCase().includes(filtro)) : s.usuarios.filter(u => u.ou === ou);
    const nuevo = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, '👤 Nuevo usuario');
    nuevo.addEventListener('click', () => { sel = null; formularioNuevo(); });
    lista.replaceChildren(el('div', { class: 'ad-lista-cab' }, el('strong', {}, filtro ? 'Resultados' : ou), nuevo),
      us.length ? el('table', { class: 'result-table ad-tabla' }, el('thead', {}, el('tr', {}, el('th', { scope: 'col' }, 'Nombre'), el('th', { scope: 'col' }, 'Inicio de sesión'), el('th', { scope: 'col' }, 'Estado'))),
        el('tbody', {}, us.map(u => {
          const tr = el('tr', { class: u.usuario === sel ? 'sel' : '', tabindex: '0' }, el('td', {}, (u.deshabilitada ? '⛔ ' : u.bloqueada ? '🔒 ' : '👤 ') + u.nombre), el('td', { class: 'mono' }, u.usuario), el('td', {}, u.deshabilitada ? 'Deshabilitada' : u.bloqueada ? 'Bloqueada' : 'Activa'));
          const abrir = () => { sel = u.usuario; pintar(); };
          tr.addEventListener('click', abrir); tr.addEventListener('keydown', e => { if (e.key === 'Enter') abrir(); });
          return tr;
        }))) : el('p', { class: 'small muted' }, 'No hay usuarios aquí.'));
  }
  function pintarProps() {
    const u = sel && buscar(s, sel);
    if (!u) { if (!props.querySelector('form.ad-nuevo')) props.replaceChildren(el('p', { class: 'small muted' }, 'Selecciona un usuario para ver sus propiedades y acciones.')); return; }
    const boton = (t, f, cls = 'btn-ghost') => { const b = el('button', { type: 'button', class: 'btn btn-sm ' + cls }, t); b.addEventListener('click', f); return b; };
    const nueva = el('input', { type: 'text', autocomplete: 'off', 'aria-label': 'Contraseña temporal', placeholder: 'Contraseña temporal (12+)' });
    const cambiar = el('input', { type: 'checkbox' }); cambiar.checked = true;
    const selOu = el('select', { 'aria-label': 'Mover a la unidad organizativa' }, OUS.map(o => el('option', { value: o, selected: o === u.ou }, o)));
    props.replaceChildren(
      el('h4', {}, u.nombre), el('p', { class: 'small muted' }, `${u.usuario}@laceiba.local · ${u.cargo || 'sin cargo'} · OU ${u.ou}`),
      el('p', { class: 'small' }, `Estado: ${u.deshabilitada ? 'deshabilitada' : u.bloqueada ? 'bloqueada' : 'activa'}${u.cambiarAlEntrar ? ' · debe cambiar la contraseña al entrar' : ''}${s.verificados.has(u.usuario) ? ' · identidad verificada' : ''}`),
      el('div', { class: 'hero-cta' }, boton('📞 Verificar identidad', () => aviso(verificarIdentidad(s, u.usuario))), u.bloqueada ? boton('🔓 Desbloquear', () => aviso(desbloquear(s, u.usuario))) : null,
        boton(u.deshabilitada ? 'Habilitar' : '⛔ Deshabilitar', () => aviso(habilitar(s, u.usuario, u.deshabilitada))), boton('🗑 Eliminar', () => { if (confirm(`¿Eliminar definitivamente la cuenta ${u.usuario}? No se puede deshacer.`)) { aviso(borrar(s, u.usuario)); sel = null; pintar(); } }, 'btn-quiet')),
      el('fieldset', { class: 'ad-set' }, el('legend', {}, 'Restablecer contraseña'), nueva, el('label', { class: 'option' }, cambiar, el('span', {}, 'El usuario debe cambiarla al iniciar sesión')), boton('Restablecer', () => { const r = restablecer(s, u.usuario, nueva.value, cambiar.checked); if (!r.ok) toast(r.msg); else aviso(r); })),
      el('fieldset', { class: 'ad-set' }, el('legend', {}, 'Mover'), selOu, boton('Mover', () => aviso(mover(s, u.usuario, selOu.value)))),
      el('fieldset', { class: 'ad-set' }, el('legend', {}, 'Miembro de'), Object.entries(GRUPOS).map(([g, d]) => {
        const c = el('input', { type: 'checkbox' }); c.checked = u.grupos.includes(g);
        c.addEventListener('change', () => aviso(ponerGrupo(s, u.usuario, g, c.checked)));
        return el('label', { class: 'option' }, c, el('span', {}, g, el('span', { class: 'small muted' }, ' · ' + d)));
      })));
  }
  function formularioNuevo() {
    const campo = (id, t, attrs = {}) => el('div', { class: 'field' }, el('label', { for: id }, t), el('input', { id, type: 'text', autocomplete: 'off', ...attrs }));
    const cambiar = el('input', { type: 'checkbox' }); cambiar.checked = true;
    const f = el('form', { class: 'ad-nuevo', novalidate: true }, el('h4', {}, 'Nuevo usuario'),
      campo('adNombre', 'Nombre'), campo('adApellido', 'Apellido'), campo('adUsuario', 'Inicio de sesión (ej. lmendez)'),
      el('div', { class: 'field' }, el('label', { for: 'adOu' }, 'Unidad organizativa'), el('select', { id: 'adOu' }, OUS.map(o => el('option', { value: o, selected: o === ou }, o)))),
      campo('adPass', 'Contraseña inicial (12+, mayúsculas, minúsculas y números)'),
      el('label', { class: 'option' }, cambiar, el('span', {}, 'Debe cambiarla al iniciar sesión')),
      el('div', { class: 'hero-cta' }, el('button', { type: 'submit', class: 'btn btn-primary btn-sm' }, 'Crear'), el('button', { type: 'button', class: 'btn btn-quiet btn-sm', onclick: () => { props.replaceChildren(); pintar(); } }, 'Cancelar')));
    f.addEventListener('submit', e => {
      e.preventDefault();
      const v = id => f.querySelector('#' + id).value;
      const r = crearUsuario(s, { nombre: v('adNombre'), apellido: v('adApellido'), usuario: v('adUsuario'), ou: v('adOu'), contrasena: v('adPass'), cambiar: cambiar.checked });
      if (!r.ok) { toast(r.msg); return; }
      ou = v('adOu'); sel = v('adUsuario').trim().toLowerCase(); props.replaceChildren(); aviso(r);
    });
    props.replaceChildren(f);
  }
  function pintar() {
    pintarTickets(); pintarArbol(); pintarLista(); pintarProps();
    registro.replaceChildren(...s.registro.slice(-8).map(r => el('li', {}, r)));
  }
  const reiniciar = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Empezar de nuevo');
  reiniciar.addEventListener('click', () => { s = nuevoAd(); sel = null; ou = 'Contabilidad'; props.replaceChildren(); pintar(); });

  holder.append(el('section', { class: 'lab', 'aria-label': 'Active Directory' },
    el('div', { class: 'lab-head' }, el('h3', {}, 'Active Directory: la cola de la mesa de ayuda'), marcador),
    el('p', { class: 'muted' }, 'Eres técnico de soporte en Comercial La Ceiba (dominio laceiba.local, empresa ficticia). Resuelve cada ticket con la consola de abajo y ciérralo. Ojo: no todo lo que piden se debe hacer.'),
    el('h4', {}, 'Tickets abiertos'), tickets,
    el('h4', {}, 'Usuarios y equipos de Active Directory'),
    el('div', { class: 'ad-consola' }, el('div', {}, buscador, arbol), lista, props),
    el('details', { class: 'mt' }, el('summary', { class: 'small' }, 'Registro de cambios'), registro), el('div', { class: 'hero-cta' }, reiniciar)));
  pintar();
}
