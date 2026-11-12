// Interfaz del simulador de topologías ([[topo:<reto>]]): lienzo SVG con equipos que se arrastran, herramienta de cable,
// panel de configuración de cada equipo y ping animado salto a salto con el motivo exacto cuando falla.
import { el, toast, local, reducedMotion } from '../core.js';
import { guardarLab, labHecho, cargar } from '../progreso.js';
import * as T from './topologia.js';
import { RETOS, revisarReto, claveDestino } from './topologia-retos.js';

const W = 800, H = 460;
const NIVEL = { principiante: 'Nivel 1 · Principiante', intermedio: 'Nivel 2 · Intermedio', avanzado: 'Nivel 3 · Avanzado' };
const HERRAMIENTAS = [['mover', 'Seleccionar y mover'], ['cable', 'Cable'], ['borrar', 'Borrar']];

function icono(tipo) {
  if (tipo === 'pc') return [el('rect', { x: -22, y: -21, width: 44, height: 30, rx: 4, class: 'topo-cuerpo' }), el('rect', { x: -17, y: -16, width: 34, height: 20, rx: 2, class: 'topo-pantalla' }), el('path', { d: 'M-9 15h18M0 9v6', class: 'topo-trazo' })];
  if (tipo === 'servidor') return [el('rect', { x: -16, y: -24, width: 32, height: 44, rx: 4, class: 'topo-cuerpo' }), el('path', { d: 'M-10 -14h20M-10 -6h20M-10 2h20', class: 'topo-trazo-claro' }), el('circle', { cx: 8, cy: 12, r: 2.5, class: 'topo-led' })];
  if (tipo === 'switch') return [el('rect', { x: -32, y: -13, width: 64, height: 26, rx: 5, class: 'topo-cuerpo' }), el('path', { d: 'M-18 -4h28m-5 -4 5 4-5 4M18 5h-28m5 -4-5 4 5 4', class: 'topo-trazo-claro' })];
  return [el('circle', { r: 22, class: 'topo-cuerpo' }), el('path', { d: 'M-12 0h24M0 -12v24M-12 0l4 -4M-12 0l4 4M12 0l-4 -4M12 0l-4 4M0 -12l-4 4M0 -12l4 4M0 12l-4 -4M0 12l4 -4', class: 'topo-trazo-claro' })];
}

export async function montarTopologia(holder, id) {
  const reto = RETOS[id];
  if (!reto) throw new Error('Reto de topología desconocido: ' + id);
  await cargar();
  const progreso = 'topo-' + id, clave = 'aula:topo:' + id;
  let t, h, sel = null, modo = 'mover', desde = null, completado = labHecho(progreso), animando = null;

  function cargarEstado() {
    const v = local.get(clave);
    if (v && T.validarTopologia(v.t)) { t = v.t; h = new Set(v.h || []); } else { t = reto.inicial(); h = new Set(); }
  }
  const guardar = () => local.set(clave, { t, h: [...h] });

  // ------------------------------------------------------------ elementos
  const marcador = el('span', { class: 'badge badge-accent' });
  const capaCables = el('g', { class: 'topo-capa-cables' });
  const capaEquipos = el('g');
  const capaPaquete = el('g', { 'aria-hidden': 'true' });
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'topo-svg', role: 'group', 'aria-label': 'Lienzo de la topología: los equipos se pueden seleccionar con el teclado y mover con las flechas' }, el('rect', { x: 0, y: 0, width: W, height: H, class: 'topo-fondo' }), capaCables, capaEquipos, capaPaquete);
  const ayuda = el('p', { class: 'small muted topo-ayuda', role: 'status' });
  const avisos = el('div', { class: 'topo-avisos', 'aria-live': 'polite' });
  const panel = el('div', { class: 'topo-panel' });
  const lista = el('ul', { class: 'tasks' });
  const listaPistas = el('ol', { class: 'hints' });
  let vistas = 0;
  const btnPista = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, 'Dame una pista');
  btnPista.addEventListener('click', () => {
    if (vistas >= reto.pistas.length) return;
    listaPistas.append(el('li', {}, reto.pistas[vistas++]));
    btnPista.textContent = vistas < reto.pistas.length ? `Otra pista (${reto.pistas.length - vistas})` : 'No hay más pistas';
    btnPista.disabled = vistas >= reto.pistas.length;
  });

  const botonesModo = HERRAMIENTAS.map(([m, txt]) => {
    const b = el('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'aria-pressed': String(m === modo) }, txt);
    b.addEventListener('click', () => { modo = m; desde = null; pintarModo(); dibujar(); });
    b.dataset.modo = m;
    return b;
  });
  const botonesAgregar = ['pc', 'servidor', 'switch', 'router'].map(tipo => {
    const b = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, '+ ' + T.NOMBRE_TIPO[tipo]);
    b.addEventListener('click', () => agregar(tipo));
    return b;
  });
  const btnReset = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Reiniciar');
  btnReset.addEventListener('click', () => {
    if (!confirm(reto.libre ? '¿Borrar toda la red y empezar de cero?' : '¿Reiniciar el reto? Se perderán tus cambios.')) return;
    local.del(clave); cargarEstado(); sel = null; desde = null; salidaPing.replaceChildren(); todo();
  });

  // ping
  const selOrigen = el('select', { 'aria-label': 'Equipo de origen del ping' });
  const selDestino = el('select', { 'aria-label': 'Destino del ping' });
  const btnPing = el('button', { type: 'button', class: 'btn btn-primary btn-sm' }, 'Enviar ping');
  const salidaPing = el('div', { class: 'topo-ping-salida', 'aria-live': 'polite' });
  btnPing.addEventListener('click', lanzarPing);

  function pintarModo() {
    botonesModo.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.modo === modo)));
    ayuda.textContent = modo === 'cable' ? (desde ? `Ahora toca el otro equipo para conectarlo con ${T.equipo(t, desde)?.nombre}.` : 'Toca el primer equipo del cable.')
      : modo === 'borrar' ? 'Toca un equipo o un cable para borrarlo.' : 'Toca un equipo para configurarlo o arrástralo para moverlo.';
  }

  // ------------------------------------------------------------ dibujo
  const grupos = new Map();
  function dibujarCables() {
    const items = [];
    for (const c of t.cables) {
      const a = T.equipo(t, c.a.eq), b = T.equipo(t, c.b.eq);
      const up = T.enlaceUp(t, a.id, c.a.p);
      const d = Math.hypot(b.x - a.x, b.y - a.y) || 1, ux = (b.x - a.x) / d, uy = (b.y - a.y) / d;
      const punto = (o, k) => [o.x + ux * k * (o === a ? 1 : -1), o.y + uy * k * (o === a ? 1 : -1)];
      const g = el('g', { class: 'topo-cable' + (up ? '' : ' caido') },
        el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'topo-linea' }),
        el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'topo-linea-toque' }, el('title', {}, `${a.nombre} ${c.a.p} — ${b.nombre} ${c.b.p}`)));
      for (const [o, p] of [[a, c.a.p], [b, c.b.p]]) {
        const [px, py] = punto(o, Math.min(46, d / 3));
        const [lx, ly] = punto(o, Math.min(70, d / 2.4));
        const ladoOn = T.enlaceUp(t, o.id, p);
        g.append(el('circle', { cx: px, cy: py, r: 4, class: 'topo-punto' + (ladoOn ? ' on' : '') }), el('text', { x: lx, y: ly - 5, class: 'topo-puerto' }, p));
      }
      g.addEventListener('click', () => { if (modo === 'borrar') { T.desconectar(t, c); cambio(); } });
      items.push(g);
    }
    capaCables.replaceChildren(...items);
  }
  function etiquetaIp(e) {
    if (e.tipo === 'switch' || e.tipo === 'router') return '';
    const i = e.ifs.Fa0;
    if (e.dhcp && !e.concedida) return 'DHCP: sin IP';
    return T.ipValida(i.ip) ? `${i.ip.trim()}${T.prefijo(i.mask) != null ? '/' + T.prefijo(i.mask) : ''}` : 'sin IP';
  }
  function dibujarEquipos() {
    grupos.clear();
    capaEquipos.replaceChildren(...t.equipos.map(e => {
      const g = el('g', { class: `topo-eq topo-${e.tipo}${sel === e.id ? ' sel' : ''}${desde === e.id ? ' origen' : ''}`, transform: `translate(${e.x} ${e.y})`, tabindex: 0, role: 'button', 'aria-label': `${T.NOMBRE_TIPO[e.tipo]} ${e.nombre}${etiquetaIp(e) ? ', ' + etiquetaIp(e) : ''}` },
        el('rect', { x: -38, y: -30, width: 76, height: 96, rx: 10, class: 'topo-halo' }),
        ...icono(e.tipo),
        el('text', { y: 36, class: 'topo-nombre' }, e.nombre),
        etiquetaIp(e) ? el('text', { y: 50, class: 'topo-ip' }, etiquetaIp(e)) : null,
        e.nota ? el('text', { y: etiquetaIp(e) ? 63 : 50, class: 'topo-nota' }, e.nota) : null);
      eventosEquipo(g, e);
      grupos.set(e.id, g);
      return g;
    }));
  }
  function dibujar() { dibujarCables(); dibujarEquipos(); }

  function puntoSvg(ev) {
    const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }
  function eventosEquipo(g, e) {
    let inicio = null, arrastrando = false;
    g.addEventListener('pointerdown', ev => {
      if (ev.button > 0) return;
      const p0 = puntoSvg(ev); inicio = { x: p0.x, y: p0.y, x0: e.x, y0: e.y }; arrastrando = false;
      g.setPointerCapture(ev.pointerId);
    });
    g.addEventListener('pointermove', ev => {
      if (!inicio || modo !== 'mover') return;
      const p = puntoSvg(ev), dx = p.x - inicio.x, dy = p.y - inicio.y;
      if (!arrastrando && Math.hypot(dx, dy) < 5) return;
      if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
      arrastrando = true;
      e.x = Math.round(Math.max(40, Math.min(W - 40, inicio.x0 + dx)));
      e.y = Math.round(Math.max(35, Math.min(H - 70, inicio.y0 + dy)));
      g.setAttribute('transform', `translate(${e.x} ${e.y})`);
      dibujarCables();
    });
    const fin = ev => {
      if (!inicio) return;
      inicio = null;
      if (g.hasPointerCapture?.(ev.pointerId)) g.releasePointerCapture(ev.pointerId);
      if (arrastrando) guardar(); else tocar(e);
    };
    g.addEventListener('pointerup', fin);
    g.addEventListener('pointercancel', () => { inicio = null; });
    g.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); tocar(e); return; }
      const mov = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[ev.key];
      if (mov && modo === 'mover') {
        ev.preventDefault();
        e.x = Math.max(40, Math.min(W - 40, e.x + mov[0])); e.y = Math.max(35, Math.min(H - 70, e.y + mov[1]));
        g.setAttribute('transform', `translate(${e.x} ${e.y})`); dibujarCables(); guardar();
      }
      if ((ev.key === 'Delete' || ev.key === 'Backspace') && !e.fijo) { ev.preventDefault(); borrarEquipo(e); }
    });
  }
  function enfocar(eid) { requestAnimationFrame(() => grupos.get(eid)?.focus({ preventScroll: true })); }

  // ------------------------------------------------------------ acciones
  function tocar(e) {
    if (modo === 'mover') { sel = e.id; dibujarEquipos(); pintarPanel(); enfocar(e.id); return; }
    if (modo === 'borrar') { borrarEquipo(e); return; }
    if (!desde) { desde = e.id; pintarModo(); dibujarEquipos(); enfocar(e.id); return; }
    if (desde === e.id) { desde = null; pintarModo(); dibujarEquipos(); return; }
    const r = T.conectar(t, desde, e.id);
    if (!r.ok) toast(r.motivo);
    else toast(`Cable: ${T.equipo(t, r.cable.a.eq).nombre} ${r.cable.a.p} ↔ ${T.equipo(t, r.cable.b.eq).nombre} ${r.cable.b.p}`, 2400);
    desde = null; pintarModo(); cambio(); enfocar(e.id);
  }
  function borrarEquipo(e) {
    if (e.fijo) { toast(`${e.nombre} forma parte del reto: no se puede borrar (sí puedes quitar sus cables).`); return; }
    T.quitarEquipo(t, e.id); if (sel === e.id) sel = null; cambio();
  }
  function agregar(tipo) {
    if (t.equipos.length >= T.MAX_EQUIPOS) { toast(`Como máximo ${T.MAX_EQUIPOS} equipos en el lienzo.`); return; }
    let pos = { x: 100, y: 100 };
    buscar: for (let y = 80; y <= H - 80; y += 95) for (let x = 80; x <= W - 60; x += 110) {
      if (t.equipos.every(o => Math.hypot(o.x - x, o.y - y) > 90)) { pos = { x, y }; break buscar; }
    }
    const e = T.agregarEquipo(t, tipo, pos);
    sel = e.id; modo = 'mover'; pintarModo(); cambio(); enfocar(e.id);
  }
  function cambio() { guardar(); dibujar(); pintarPanel(); revisar(); }
  // Cambio de configuración desde el panel: no se reconstruye el panel (para no perder el foco al escribir).
  function cambioConfig() { guardar(); dibujar(); revisar(); refrescarTabla(); }

  // ------------------------------------------------------------ panel de configuración
  let refrescarTabla = () => {};
  const conectadoA = (e, p) => { const o = T.otroExtremo(t, e.id, p); return o ? `${T.equipo(t, o.eq).nombre} ${o.p}` : '—'; };
  function campo(etq, valor, alCambiar, { tipo = 'text', placeholder, validar, ancho } = {}) {
    const id = 'tp-' + Math.random().toString(36).slice(2, 9);
    const input = el('input', { id, type: tipo, value: valor ?? '', placeholder, class: 'input' + (ancho ? ' ' + ancho : ''), autocomplete: 'off', spellcheck: 'false', inputmode: tipo === 'text' && placeholder && /\d/.test(placeholder) ? 'decimal' : null });
    const err = el('span', { class: 'small topo-error', role: 'alert' });
    input.addEventListener('change', () => {
      const msg = validar ? validar(input.value.trim()) : '';
      err.textContent = msg || '';
      input.setAttribute('aria-invalid', String(!!msg));
      alCambiar(input.value.trim(), input);
      cambioConfig();
    });
    return el('label', { class: 'topo-campo', for: id }, el('span', { class: 'small' }, etq), input, err);
  }
  const vIp = v => (!v || T.ipValida(v) ? '' : 'No es una IP válida (cuatro números de 0 a 255).');
  const vMask = v => (!v || T.prefijo(v) != null ? '' : 'Máscara no válida: usa 255.255.255.0 o /24.');
  const fijarMascara = (obj, k) => (v, input) => { const m = T.normalizarMascara(v); obj[k] = m || v; if (m) input.value = m; };

  function cabecera(e) {
    const nombre = e.fijo ? el('h4', {}, e.nombre) : campo('Nombre', e.nombre, (v, input) => {
      if (!v || t.equipos.some(o => o !== e && o.nombre.toLowerCase() === v.toLowerCase())) { toast('Ese nombre está vacío o ya existe.'); input.value = e.nombre; return; }
      e.nombre = v.slice(0, 12);
    });
    return el('div', { class: 'topo-panel-cab' }, el('span', { class: 'badge' }, T.NOMBRE_TIPO[e.tipo]), nombre);
  }
  function panelHost(e) {
    const i = e.ifs.Fa0;
    const partes = [cabecera(e), el('p', { class: 'small muted' }, `Fa0 → ${conectadoA(e, 'Fa0')}`)];
    if (e.tipo === 'pc') {
      const nombreGrupo = 'modo-' + e.id;
      const radio = (v, txt) => { const r = el('input', { type: 'radio', name: nombreGrupo, value: v }); r.checked = (v === 'dhcp') === !!e.dhcp; r.addEventListener('change', () => { e.dhcp = v === 'dhcp'; if (e.dhcp) { Object.assign(i, { ip: '', mask: '' }); e.gw = ''; e.concedida = false; } cambio(); }); return el('label', { class: 'topo-radio' }, r, ' ', txt); };
      partes.push(el('fieldset', { class: 'topo-fs' }, el('legend', { class: 'small' }, 'Configuración IP'), radio('estatica', 'Estática'), radio('dhcp', 'DHCP')));
    }
    if (e.dhcp) {
      const res = el('p', { class: 'small', role: 'status' });
      const b = el('button', { type: 'button', class: 'btn btn-primary btn-sm' }, 'Pedir IP (DHCP)');
      b.addEventListener('click', () => { const r = T.pedirDhcp(t, e.id); guardar(); dibujar(); revisar(); pintarPanel(); toast(r.motivo); });
      partes.push(b, res, el('dl', { class: 'topo-dl small' }, el('dt', {}, 'IP'), el('dd', {}, i.ip || '—'), el('dt', {}, 'Máscara'), el('dd', {}, i.mask || '—'), el('dt', {}, 'Puerta de enlace'), el('dd', {}, e.gw || '—')));
    } else {
      partes.push(campo('Dirección IP', i.ip, v => { i.ip = v; }, { placeholder: '192.168.1.10', validar: vIp }),
        campo('Máscara', i.mask, fijarMascara(i, 'mask'), { placeholder: '255.255.255.0', validar: vMask }),
        campo('Puerta de enlace', e.gw, v => { e.gw = v; }, { placeholder: '192.168.1.1', validar: vIp }));
    }
    if (e.tipo === 'servidor') {
      e.pools = e.pools || [];
      const pool = e.pools[0];
      const activo = el('input', { type: 'checkbox' }); activo.checked = !!pool;
      activo.addEventListener('change', () => { if (activo.checked) e.pools = [{ inicio: '', cantidad: 50, mask: '255.255.255.0', gw: '', dns: '' }]; else e.pools = []; cambio(); });
      partes.push(el('fieldset', { class: 'topo-fs' }, el('legend', { class: 'small' }, 'Servicio DHCP'), el('label', { class: 'topo-radio' }, activo, ' Activar el servidor DHCP'),
        pool ? el('div', { class: 'topo-grid2' },
          campo('Primera IP', pool.inicio, v => { pool.inicio = v; }, { placeholder: '192.168.1.100', validar: vIp }),
          campo('Cantidad', pool.cantidad, v => { pool.cantidad = Math.max(1, Math.min(250, parseInt(v, 10) || 1)); }, { tipo: 'number' }),
          campo('Máscara', pool.mask, fijarMascara(pool, 'mask'), { placeholder: '255.255.255.0', validar: vMask }),
          campo('Puerta de enlace', pool.gw, v => { pool.gw = v; }, { placeholder: '192.168.1.1', validar: vIp }),
          campo('Servidor DNS', pool.dns, v => { pool.dns = v; }, { placeholder: '8.8.8.8', validar: vIp })) : null));
    }
    return partes;
  }
  function panelSwitch(e) {
    const fila = p => {
      const i = e.ifs[p];
      const modoSel = el('select', { 'aria-label': `Modo de ${p}` }, el('option', { value: 'access' }, 'Acceso'), el('option', { value: 'trunk' }, 'Troncal'));
      modoSel.value = i.modo;
      const vlan = el('input', { type: 'number', min: 1, max: 4094, value: i.vlan, class: 'input topo-num', 'aria-label': `VLAN de ${p}`, disabled: i.modo === 'trunk' });
      const on = el('input', { type: 'checkbox', 'aria-label': `${p} encendido` }); on.checked = i.on !== false;
      modoSel.addEventListener('change', () => { i.modo = modoSel.value; vlan.disabled = i.modo === 'trunk'; cambioConfig(); });
      vlan.addEventListener('change', () => { const v = parseInt(vlan.value, 10); i.vlan = v >= 1 && v <= 4094 ? v : 1; vlan.value = i.vlan; cambioConfig(); });
      on.addEventListener('change', () => { i.on = on.checked; cambioConfig(); });
      return el('tr', {}, el('th', { scope: 'row' }, p), el('td', {}, conectadoA(e, p)), el('td', {}, modoSel), el('td', {}, i.modo === 'trunk' ? el('span', { class: 'small muted' }, 'todas') : vlan), el('td', {}, on));
    };
    const usados = Object.keys(e.ifs).filter(p => T.cableEn(t, e.id, p)), libres = Object.keys(e.ifs).filter(p => !T.cableEn(t, e.id, p));
    const tabla = filas => el('div', { class: 'table-wrap' }, el('table', { class: 'table topo-tabla' }, el('thead', {}, el('tr', {}, el('th', {}, 'Puerto'), el('th', {}, 'Conectado a'), el('th', {}, 'Modo'), el('th', {}, 'VLAN'), el('th', {}, 'On'))), el('tbody', {}, filas.map(fila))));
    return [cabecera(e), usados.length ? tabla(usados) : el('p', { class: 'small muted' }, 'Sin cables todavía.'),
      libres.length ? el('details', { class: 'topo-libres' }, el('summary', { class: 'small' }, `Puertos libres (${libres.length})`), tabla(libres)) : null,
      el('p', { class: 'small muted' }, 'Acceso: el puerto pertenece a una VLAN. Troncal: lleva todas las VLAN etiquetadas (802.1Q); la nativa es la 1.')];
  }
  function panelRouter(e) {
    const tablaRutas = el('pre', { class: 'code topo-rutas' });
    refrescarTabla = () => {
      const rs = T.tablaRutas(t, e.id);
      tablaRutas.textContent = rs.length ? rs.map(r => `${r.cod.padEnd(3)} ${r.red}/${T.prefijo(r.mask)} ${r.cod === 'C' ? 'conectada, ' + r.sal : 'por ' + r.via}`).join('\n') : '(vacía: configura IP y enciende las interfaces)';
    };
    const ifaces = Object.entries(e.ifs).map(([p, i]) => {
      const on = el('input', { type: 'checkbox' }); on.checked = !!i.on;
      on.addEventListener('change', () => { i.on = on.checked; cambioConfig(); });
      const subs = (i.subs || []).map((s, k) => el('div', { class: 'topo-sub' },
        el('span', { class: 'small topo-sub-nombre' }, `${p}.${s.vlan || '?'}`),
        campo('VLAN', s.vlan, v => { const n = parseInt(v, 10); s.vlan = n >= 1 && n <= 4094 ? n : ''; }, { tipo: 'number', ancho: 'topo-num' }),
        campo('IP', s.ip, v => { s.ip = v; }, { placeholder: '192.168.10.1', validar: vIp }),
        campo('Máscara', s.mask, fijarMascara(s, 'mask'), { placeholder: '255.255.255.0', validar: vMask }),
        el('button', { type: 'button', class: 'btn btn-quiet btn-sm', 'aria-label': `Quitar la subinterfaz ${p}.${s.vlan}`, onclick: () => { i.subs.splice(k, 1); cambio(); } }, '✕')));
      return el('fieldset', { class: 'topo-fs' },
        el('legend', { class: 'small' }, `${p} → ${conectadoA(e, p)}`),
        el('label', { class: 'topo-radio' }, on, ' Encendida (no shutdown)'),
        el('div', { class: 'topo-grid2' }, campo('IP', i.ip, v => { i.ip = v; }, { placeholder: '192.168.1.1', validar: vIp }), campo('Máscara', i.mask, fijarMascara(i, 'mask'), { placeholder: '255.255.255.0', validar: vMask })),
        ...subs,
        el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => { i.subs = i.subs || []; i.subs.push({ vlan: '', ip: '', mask: '255.255.255.0' }); cambio(); } }, '+ Subinterfaz'));
    });
    const rutas = (e.rutas || []).map((r, k) => el('li', {}, el('code', {}, `ip route ${r.red} ${r.mask} ${r.via}`), ' ', el('button', { type: 'button', class: 'btn btn-quiet btn-sm', 'aria-label': 'Quitar la ruta', onclick: () => { e.rutas.splice(k, 1); cambio(); } }, '✕')));
    const nueva = { red: '', mask: '', via: '' };
    const btnRuta = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, 'Añadir ruta');
    btnRuta.addEventListener('click', () => {
      const m = T.normalizarMascara(nueva.mask);
      if (!T.ipValida(nueva.red) || !m || !T.ipValida(nueva.via)) { toast('Completa la red, la máscara y el siguiente salto con valores válidos.'); return; }
      if (T.redDe(nueva.red, m) !== nueva.red.trim()) { toast(`${nueva.red} no es una dirección de red para esa máscara: sería ${T.redDe(nueva.red, m)}.`); return; }
      e.rutas.push({ red: nueva.red.trim(), mask: m, via: nueva.via.trim() }); cambio();
    });
    const out = [cabecera(e), ...ifaces,
      el('fieldset', { class: 'topo-fs' }, el('legend', { class: 'small' }, 'Rutas estáticas'),
        rutas.length ? el('ul', { class: 'topo-lista-rutas' }, rutas) : el('p', { class: 'small muted' }, 'Ninguna.'),
        el('div', { class: 'topo-grid3' },
          campo('Red de destino', '', v => { nueva.red = v; }, { placeholder: '192.168.2.0', validar: vIp }),
          campo('Máscara', '', v => { nueva.mask = v; }, { placeholder: '255.255.255.0', validar: vMask }),
          campo('Siguiente salto', '', v => { nueva.via = v; }, { placeholder: '10.0.12.2', validar: vIp })), btnRuta),
      el('h4', {}, 'Tabla de rutas (show ip route)'), tablaRutas];
    refrescarTabla();
    return out;
  }
  function pintarPanel() {
    refrescarTabla = () => {};
    const e = sel && T.equipo(t, sel);
    if (!e) { panel.replaceChildren(el('p', { class: 'small muted' }, 'Selecciona un equipo para ver y cambiar su configuración.')); return; }
    panel.replaceChildren(...(e.tipo === 'switch' ? panelSwitch(e) : e.tipo === 'router' ? panelRouter(e) : panelHost(e)).filter(Boolean));
  }

  // ------------------------------------------------------------ ping
  function opcionesPing() {
    const prevO = selOrigen.value, prevD = selDestino.value;
    const hosts = t.equipos.filter(e => e.tipo !== 'switch');
    selOrigen.replaceChildren(...hosts.map(e => el('option', { value: e.id }, e.nombre)));
    if (hosts.some(e => e.id === prevO)) selOrigen.value = prevO;
    const destinos = t.equipos.flatMap(e => T.interfacesL3(e).map(x => ({ v: x.ip, txt: `${e.nombre}${e.tipo === 'router' ? ' ' + x.nombre : ''} · ${x.ip}` })));
    selDestino.replaceChildren(...destinos.map(d => el('option', { value: d.v }, d.txt)));
    if (destinos.some(d => d.v === prevD)) selDestino.value = prevD;
    else if (destinos.length > 1) { const o = T.equipo(t, selOrigen.value); const propias = o ? T.ipsDe(o) : []; const otro = destinos.find(d => !propias.includes(d.v)); if (otro) selDestino.value = otro.v; }
    btnPing.disabled = !hosts.length || !destinos.length;
  }
  const nombreDe = idEq => T.equipo(t, idEq)?.nombre || '?';
  function lanzarPing() {
    const o = T.equipo(t, selOrigen.value), ip = selDestino.value;
    if (!o || !ip) return;
    const r = T.ping(t, o.id, ip);
    h.add(`${r.ok ? 'ok' : 'fallo'}:${o.nombre}>${claveDestino(t, ip)}`);
    guardar();
    const paso = (s, i) => {
      const por = s.camino.slice(1, -1).map(nombreDe);
      return el('li', {}, `${nombreDe(s.de)} → ${nombreDe(s.a)}: sale por ${s.sal} hacia ${s.nh}${por.length ? ', pasando por ' + por.join(' y ') : ''}.`);
    };
    salidaPing.replaceChildren(...[
      el('div', { class: 'alert ' + (r.ok ? 'alert-ok' : 'alert-warn') }, el('p', {}, el('strong', {}, r.ok ? `✓ ping ${o.nombre} → ${ip}: responde. ` : `✗ ping ${o.nombre} → ${ip}: falla. `), r.motivo)),
      r.ida.length ? el('div', {}, el('p', { class: 'small' }, el('strong', {}, 'Ida (echo request)')), el('ol', { class: 'small topo-pasos' }, r.ida.map(paso))) : null,
      r.vuelta.length ? el('div', {}, el('p', { class: 'small' }, el('strong', {}, 'Vuelta (echo reply)')), el('ol', { class: 'small topo-pasos' }, r.vuelta.map(paso))) : null].filter(Boolean));
    animar(r);
    revisar();
  }
  function animar(r) {
    animando?.cancel?.();
    capaPaquete.replaceChildren();
    const puntos = (saltos) => { const ids = []; for (const s of saltos) for (const x of s.camino) if (ids[ids.length - 1] !== x) ids.push(x); return ids.map(x => T.equipo(t, x)).filter(Boolean).map(e => [e.x, e.y]); };
    const ida = puntos(r.ida), vuelta = puntos(r.vuelta);
    const fallo = !r.ok ? T.equipo(t, r.fase === 'vuelta' ? (r.vuelta[r.vuelta.length - 1]?.a || r.ida[r.ida.length - 1]?.a) : (r.ida[r.ida.length - 1]?.a || selOrigen.value)) : null;
    const marcaFallo = () => { if (fallo) capaPaquete.append(el('g', { class: 'topo-fallo', transform: `translate(${fallo.x} ${fallo.y - 34})` }, el('circle', { r: 11 }), el('path', { d: 'M-4 -4l8 8M4 -4l-4 4-4 4' }))); };
    if (reducedMotion() || typeof Element.prototype.animate !== 'function' || (ida.length < 2 && vuelta.length < 2)) { marcaFallo(); return; }
    const tramo = (pts, clase) => new Promise(res => {
      if (pts.length < 2) { res(); return; }
      const c = el('circle', { r: 7, class: 'topo-paquete ' + clase });
      capaPaquete.append(c);
      const a = c.animate(pts.map(([x, y]) => ({ transform: `translate(${x}px, ${y}px)` })), { duration: 380 * (pts.length - 1), easing: 'linear', fill: 'forwards' });
      animando = a;
      a.onfinish = () => { c.remove(); res(); };
      a.oncancel = () => { c.remove(); res(); };
    });
    tramo(ida, 'ida').then(() => tramo(vuelta, 'vuelta')).then(marcaFallo);
  }

  // ------------------------------------------------------------ tareas y avisos
  function revisar() {
    const hechas = revisarReto(reto, t, h);
    lista.replaceChildren(...reto.tareas.map((x, i) => el('li', { class: hechas[i] ? 'done' : null }, el('span', { class: 'check' + (hechas[i] ? ' on' : ''), 'aria-hidden': 'true' }, '✓'), el('span', { class: hechas[i] ? 'muted' : null }, (hechas[i] ? '(hecha) ' : '') + x.texto))));
    const n = hechas.filter(Boolean).length;
    marcador.textContent = `${n}/${reto.tareas.length} tareas`;
    const dup = T.ipsDuplicadas(t);
    avisos.replaceChildren(...[
      dup.length ? el('p', { class: 'alert alert-warn small' }, `IP duplicada: ${dup.join(', ')}. Dos equipos con la misma IP provocan fallos intermitentes.`) : null,
      T.hayBucle(t) ? el('p', { class: 'alert alert-info small' }, 'Hay un bucle entre switches. En una red real, STP bloquearía uno de los puertos para evitar una tormenta de difusión.') : null].filter(Boolean));
    opcionesPing();
    if (n === reto.tareas.length && !completado) {
      completado = true;
      guardarLab(progreso);
      toast('¡Reto completado: ' + reto.titulo + '!');
    }
  }
  function todo() { pintarModo(); dibujar(); pintarPanel(); revisar(); }

  cargarEstado();
  holder.append(el('section', { class: 'lab topo', 'aria-label': 'Simulador de topologías: ' + reto.titulo },
    el('div', { class: 'lab-head' }, el('h3', {}, 'Simulador de topologías: ' + reto.titulo), marcador),
    el('div', { class: 'lab-tags' }, el('span', { class: 'badge level-' + reto.nivel }, NIVEL[reto.nivel])),
    el('p', { class: 'muted' }, reto.intro),
    el('div', { class: 'topo-barra', role: 'toolbar', 'aria-label': 'Herramientas' },
      el('div', { class: 'topo-grupo' }, ...botonesModo), el('div', { class: 'topo-grupo' }, ...botonesAgregar), btnReset),
    ayuda,
    el('div', { class: 'topo-layout' },
      el('div', { class: 'topo-izq' }, el('figure', { class: 'topo-lienzo', tabindex: -1 }, svg), el('p', { class: 'small muted topo-desliza' }, 'Desliza el lienzo hacia los lados para ver toda la red.'), avisos,
        el('div', { class: 'topo-ping' }, el('h4', {}, 'Probar con ping'),
          el('div', { class: 'topo-ping-fila' }, el('label', { class: 'small' }, 'Desde ', selOrigen), el('label', { class: 'small' }, 'hacia ', selDestino), btnPing), salidaPing)),
      el('aside', { class: 'topo-der' }, el('h4', {}, 'Configuración'), panel,
        el('h4', {}, 'Tareas'), lista, reto.pistas?.length ? el('div', { class: 'hints-box' }, btnPista, listaPistas) : null))));
  todo();
}
