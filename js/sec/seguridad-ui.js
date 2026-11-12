// Laboratorios de ciberseguridad: analizador de contraseñas ([[pass:fuerza]]), hashes y ataque de diccionario ([[pass:hash]]),
// retos de criptografía ([[cripto:retos]]), análisis de registros ([[logs:ssh]], [[logs:web]]), cortafuegos ([[fw:oficina]],
// [[fw:dmz]]) y respuesta a incidentes ([[ir:ransomware]], [[ir:cuenta]]).
import { el, toast } from '../core.js';
import { guardarLab, labHecho, cargar } from '../progreso.js';
import * as S from './seguridad.js';

const NIVEL = { principiante: 'Nivel 1 · Principiante', intermedio: 'Nivel 2 · Intermedio', avanzado: 'Nivel 3 · Avanzado' };
const uid = () => 'sg-' + Math.random().toString(36).slice(2, 9);
function completar(progreso, titulo) { if (!labHecho(progreso)) { guardarLab(progreso); toast('¡Práctica completada: ' + titulo + '!'); } }
function seccion(titulo, marcador, ...hijos) {
  return el('section', { class: 'lab sec-lab', 'aria-label': titulo }, el('div', { class: 'lab-head' }, el('h3', {}, titulo), marcador), ...hijos);
}
function tareas(lista, estado) {
  return lista.map((t, i) => el('li', {}, el('span', { class: 'check' + (estado[i] ? ' on' : ''), 'aria-hidden': 'true' }, '✓'), el('span', { class: estado[i] ? 'muted' : null }, (estado[i] ? '(hecha) ' : '') + t)));
}
// Pregunta con opciones o respuesta escrita; llama a alAcertar la primera vez que se acierta.
function pregunta(p, comprobar, alAcertar) {
  const fb = el('p', { class: 'small feedback', role: 'status' });
  let resuelta = false;
  const marcar = ok => {
    fb.className = 'small feedback ' + (ok ? 'ok' : 'bad');
    fb.textContent = ok ? '✓ Correcto. ' + p.e : 'No es correcto. Vuelve a mirarlo e inténtalo otra vez.';
    if (ok && !resuelta) { resuelta = true; alAcertar(); }
  };
  let control;
  if (p.opciones) {
    const ops = p.opciones.map((o, k) => {
      const b = el('button', { type: 'button', class: 'btn btn-ghost btn-sm sec-op' }, o);
      b.addEventListener('click', () => { const ok = comprobar(k); b.classList.toggle('bad', !ok); if (ok) { ops.forEach(x => { x.disabled = true; }); b.classList.add('ok'); } marcar(ok); });
      return b;
    });
    control = el('div', { class: 'sec-ops' }, ops);
  } else {
    const id = uid();
    const input = el('input', { id, type: 'text', class: 'input', autocomplete: 'off', spellcheck: 'false' });
    const b = el('button', { type: 'button', class: 'btn btn-primary btn-sm' }, 'Comprobar');
    const go = () => { if (input.value.trim()) marcar(comprobar(input.value)); };
    b.addEventListener('click', go);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    control = el('div', { class: 'sec-resp' }, el('label', { class: 'sr-only', for: id }, 'Tu respuesta'), input, b);
  }
  return el('div', { class: 'sec-preg' }, el('p', {}, el('strong', {}, p.q)), control, fb);
}
function bloquePreguntas(lista, comprobar, progreso, titulo, marcador) {
  let n = 0;
  marcador.textContent = `0/${lista.length} resueltas`;
  return lista.map((p, i) => pregunta(p, r => comprobar(p, r, i), () => {
    n++; marcador.textContent = `${n}/${lista.length} resueltas`;
    if (n === lista.length) completar(progreso, titulo);
  }));
}

// ================================================================== contraseñas
export async function montarPass(holder, id) {
  await cargar();
  if (id === 'fuerza') return montarFuerza(holder);
  if (id === 'hash') return montarHash(holder);
  throw new Error('Práctica de contraseñas desconocida: ' + id);
}
function montarFuerza(holder) {
  const titulo = 'Analizador de contraseñas';
  const marcador = el('span', { class: 'badge badge-accent' });
  const idIn = uid();
  const input = el('input', { id: idIn, type: 'text', class: 'input sec-pass', autocomplete: 'off', spellcheck: 'false', placeholder: 'Escribe una contraseña de prueba (no uses una real)' });
  const barra = el('div', { class: 'sec-barra', role: 'meter', 'aria-valuemin': 0, 'aria-valuemax': 4, 'aria-label': 'Fortaleza' }, ...[0, 1, 2, 3].map(() => el('span')));
  const nivel = el('p', { class: 'sec-nivel', 'aria-live': 'polite' });
  const datos = el('dl', { class: 'sec-dl small' });
  const problemas = el('ul', { class: 'small sec-problemas' });
  const lista = el('ul', { class: 'tasks' });
  const hechas = [false, false];
  function pintarTareas() {
    lista.replaceChildren(...tareas(S.TAREAS_FUERZA.map(t => t.texto).concat(`Acierta al menos ${Math.ceil(S.PARES.length * S.APROBADO)} de ${S.PARES.length} comparaciones «¿cuál es más segura?».`), [...hechas, parAprobado]));
    const n = hechas.filter(Boolean).length + (parAprobado ? 1 : 0);
    marcador.textContent = `${n}/3 tareas`;
    if (n === 3) completar('pass-fuerza', titulo);
  }
  function analizar() {
    const pw = input.value, a = S.analizarContrasena(pw);
    barra.setAttribute('aria-valuenow', String(pw ? a.puntuacion : 0));
    barra.dataset.n = pw ? String(a.puntuacion) : '';
    nivel.textContent = pw ? `${a.nivel} · se adivinaría ${a.tiempo === 'al instante' ? 'al instante' : 'en ' + a.tiempo}` : '';
    datos.replaceChildren(...(pw ? [['Longitud', a.longitud], ['Entropía estimada', a.bits + ' bits'], ['Tipos de caracteres', Object.entries(a.tiene).filter(([, v]) => v).map(([k]) => k).join(', ') || '—']] : []).flatMap(([k, v]) => [el('dt', {}, k), el('dd', {}, String(v))]));
    problemas.replaceChildren(...(pw ? a.problemas : []).map(p => el('li', {}, p)));
    S.TAREAS_FUERZA.forEach((t, i) => { if (pw && t.ok(a, pw)) hechas[i] = true; });
    pintarTareas();
  }
  input.addEventListener('input', analizar);
  let aciertos = 0, respondidas = 0, parAprobado = labHecho('pass-fuerza');
  const pares = S.PARES.map(([a, b, c, e]) => {
    const fb = el('p', { class: 'small feedback', role: 'status' });
    const ops = [a, b].map((txt, k) => {
      const bt = el('button', { type: 'button', class: 'btn btn-ghost btn-sm sec-op mono' }, txt);
      bt.addEventListener('click', () => {
        ops.forEach(x => { x.disabled = true; }); ops[c].classList.add('ok'); if (k !== c) bt.classList.add('bad');
        respondidas++; if (k === c) aciertos++;
        fb.className = 'small feedback ' + (k === c ? 'ok' : 'bad'); fb.textContent = (k === c ? '✓ ' : '✗ ') + e;
        if (respondidas === S.PARES.length && aciertos / S.PARES.length >= S.APROBADO) parAprobado = true;
        pintarTareas();
      });
      return bt;
    });
    return el('div', { class: 'sec-preg' }, el('div', { class: 'sec-ops dos' }, ops), fb);
  });
  holder.append(seccion(titulo, marcador,
    el('p', { class: 'muted' }, 'Escribe contraseñas de prueba y mira cómo se estima su fortaleza: la longitud, la variedad y, sobre todo, no seguir patrones conocidos. Nada sale de tu navegador, pero no escribas tus contraseñas reales.'),
    el('div', { class: 'cli-layout' },
      el('div', {}, el('label', { for: idIn, class: 'small' }, 'Contraseña de prueba'), input, barra, nivel, datos, problemas,
        el('h4', {}, '¿Cuál es más segura?'), ...pares),
      el('div', {}, el('h4', {}, 'Tareas'), lista,
        el('p', { class: 'small muted' }, 'La estimación supone un ataque sin conexión de 10.000 millones de intentos por segundo contra un hash rápido, y resta entropía por palabras, años y secuencias.')))));
  analizar();
}
async function montarHash(holder) {
  const titulo = 'Hashes, sal y ataque de diccionario';
  const marcador = el('span', { class: 'badge badge-accent' });
  const idIn = uid();
  const entrada = el('input', { id: idIn, type: 'text', class: 'input', value: 'hola', autocomplete: 'off', spellcheck: 'false' });
  const salida = el('code', { class: 'sec-hash' });
  const pintarHash = async () => { salida.textContent = await S.sha256(entrada.value); };
  entrada.addEventListener('input', pintarHash);
  let conSal = false, tabla = [];
  const cuerpo = el('tbody');
  const btnSal = el('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'aria-pressed': 'false' }, 'Añadir sal');
  const btnAtaque = el('button', { type: 'button', class: 'btn btn-primary btn-sm' }, 'Lanzar ataque de diccionario');
  const resAtaque = el('p', { class: 'small', role: 'status' });
  async function pintarTabla(descubiertas = {}) {
    tabla = await S.tablaFiltrada(conSal);
    cuerpo.replaceChildren(...tabla.map(u => el('tr', {}, el('td', {}, u.usuario), conSal ? el('td', { class: 'mono' }, u.sal) : null, el('td', { class: 'mono sec-hash-celda' }, u.hash), el('td', {}, descubiertas[u.usuario] ? el('strong', { class: 'sec-roja' }, descubiertas[u.usuario]) : el('span', { class: 'muted' }, '—')))));
    cabSal.hidden = !conSal;
  }
  const cabSal = el('th', { hidden: true }, 'Sal');
  btnSal.addEventListener('click', async () => { conSal = !conSal; btnSal.setAttribute('aria-pressed', String(conSal)); btnSal.textContent = conSal ? 'Quitar la sal' : 'Añadir sal'; resAtaque.textContent = ''; await pintarTabla(); });
  btnAtaque.addEventListener('click', async () => {
    btnAtaque.disabled = true; resAtaque.textContent = 'Probando las contraseñas más usadas…';
    const r = await S.ataqueDiccionario(tabla);
    const d = Object.fromEntries(r.resultados.filter(x => x.clave).map(x => [x.usuario, x.clave]));
    await pintarTabla(d);
    resAtaque.textContent = `${Object.keys(d).length} de ${tabla.length} cuentas descubiertas con ${r.calculos} cálculos de hash.${conSal ? ' Con sal hay que repetir el diccionario para cada usuario.' : ' Sin sal basta con calcular el diccionario una vez.'}`;
    btnAtaque.disabled = false;
  });
  const preguntas = bloquePreguntas(S.PREGUNTAS_HASH, (p, r) => +r === p.c, 'pass-hash', titulo, marcador);
  holder.append(seccion(titulo, marcador,
    el('p', { class: 'muted' }, 'Un hash convierte cualquier texto en una huella de tamaño fijo y no se puede «deshacer». Por eso las webs guardan el hash de tu contraseña, no la contraseña. Pero si la contraseña es común, basta con calcular el hash de las más usadas y comparar.'),
    el('h4', {}, '1. Prueba el SHA-256'),
    el('label', { for: idIn, class: 'small' }, 'Texto'), entrada, el('p', { class: 'small' }, 'SHA-256: ', salida),
    el('p', { class: 'small muted' }, 'Cambia una sola letra (hola → Hola) y mira cómo cambia el hash entero: es el efecto avalancha.'),
    el('h4', {}, '2. La base de datos filtrada de una tienda'),
    el('div', { class: 'hero-cta' }, btnSal, btnAtaque), resAtaque,
    el('div', { class: 'table-wrap' }, el('table', { class: 'table sec-tabla' }, el('thead', {}, el('tr', {}, el('th', {}, 'Usuario'), cabSal, el('th', {}, 'Hash SHA-256'), el('th', {}, 'Descubierta'))), cuerpo)),
    el('h4', {}, '3. Responde'), ...preguntas));
  await Promise.all([pintarHash(), pintarTabla()]);
}

// ================================================================== criptografía
export async function montarCripto(holder, id) {
  if (id !== 'retos') throw new Error('Práctica de criptografía desconocida: ' + id);
  await cargar();
  const titulo = 'Retos de criptografía';
  const marcador = el('span', { class: 'badge badge-accent' });
  // Herramientas
  const ids = [uid(), uid(), uid(), uid(), uid()];
  const cTexto = el('textarea', { id: ids[0], class: 'input mono', rows: 2, spellcheck: 'false' });
  const cK = el('input', { id: ids[1], type: 'range', min: 0, max: 25, value: 0 });
  const cKv = el('output', { for: ids[1] }, '0');
  const cOut = el('p', { class: 'mono sec-salida', 'aria-live': 'polite' });
  const pintarC = () => { cKv.textContent = cK.value; cOut.textContent = S.cesar(cTexto.value, -cK.value); };
  cTexto.addEventListener('input', pintarC); cK.addEventListener('input', pintarC);
  const vTexto = el('textarea', { id: ids[2], class: 'input mono', rows: 2, spellcheck: 'false' });
  const vClave = el('input', { id: ids[3], type: 'text', class: 'input mono', value: '', spellcheck: 'false' });
  const vOut = el('p', { class: 'mono sec-salida', 'aria-live': 'polite' });
  const btnV = (txt, dec) => el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => { vOut.textContent = S.vigenere(vTexto.value, vClave.value, dec); } }, txt);
  const bTexto = el('textarea', { id: ids[4], class: 'input mono', rows: 2, spellcheck: 'false' });
  const bOut = el('p', { class: 'mono sec-salida', 'aria-live': 'polite' });
  const btnB = (txt, f) => el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => { const r = f(bTexto.value); bOut.textContent = r == null ? 'No es Base64 válido.' : r; } }, txt);
  const herramientas = el('div', { class: 'sec-herr' },
    el('details', { class: 'sec-tool', open: true }, el('summary', {}, 'César (descifrar probando desplazamientos)'),
      el('label', { for: ids[0], class: 'small' }, 'Texto cifrado'), cTexto,
      el('label', { for: ids[1], class: 'small' }, 'Desplazamiento: ', cKv), cK, el('p', { class: 'small muted' }, 'Resultado:'), cOut),
    el('details', { class: 'sec-tool' }, el('summary', {}, 'Vigenère'),
      el('label', { for: ids[2], class: 'small' }, 'Texto'), vTexto, el('label', { for: ids[3], class: 'small' }, 'Clave'), vClave,
      el('div', { class: 'hero-cta' }, btnV('Cifrar', false), btnV('Descifrar', true)), vOut),
    el('details', { class: 'sec-tool' }, el('summary', {}, 'Base64'),
      el('label', { for: ids[4], class: 'small' }, 'Texto'), bTexto,
      el('div', { class: 'hero-cta' }, btnB('Decodificar', S.b64dec), btnB('Codificar', S.b64cod)), bOut));
  const retos = bloquePreguntas(S.RETOS_CRIPTO.map(r => ({ ...r, q: `${r.titulo}. ${r.q}` })), (p, r, i) => S.comprobarCripto(S.RETOS_CRIPTO[i], r), 'cripto-retos', titulo, marcador);
  holder.append(seccion(titulo, marcador,
    el('p', { class: 'muted' }, 'Cifrados clásicos para entender la idea, Base64 para ver que codificar no es cifrar, y las preguntas clave de la criptografía moderna: qué clave se usa para cada cosa.'),
    el('div', { class: 'cli-layout sec-cripto' }, el('div', {}, ...retos), el('div', {}, el('h4', {}, 'Herramientas'), herramientas))));
  pintarC();
}

// ================================================================== registros
export async function montarLogs(holder, id) {
  const log = S.LOGS[id];
  if (!log) throw new Error('Registro desconocido: ' + id);
  await cargar();
  const titulo = 'Análisis de registros: ' + log.titulo;
  const marcador = el('span', { class: 'badge badge-accent' });
  const idF = uid();
  const filtro = el('input', { id: idF, type: 'search', class: 'input mono', placeholder: 'Ej.: Failed 203.0.113.45', autocomplete: 'off', spellcheck: 'false' });
  const cuenta = el('span', { class: 'badge' });
  const visor = el('pre', { class: 'code sec-log', tabindex: 0, 'aria-label': 'Contenido del registro' });
  const pintar = () => { const ls = S.filtrarLineas(log.lineas, filtro.value); visor.textContent = ls.join('\n') || '(ninguna línea coincide)'; cuenta.textContent = `${ls.length} de ${log.lineas.length} líneas`; };
  filtro.addEventListener('input', pintar);
  const preguntas = bloquePreguntas(log.preguntas, (p, r) => S.comprobarLog(p, r), 'logs-' + id, titulo, marcador);
  holder.append(seccion(titulo, marcador,
    el('p', { class: 'muted' }, log.intro),
    el('div', { class: 'sec-filtro' }, el('label', { for: idF, class: 'small' }, `Filtrar ${log.archivo} (todas las palabras deben aparecer, como grep encadenados)`), el('div', { class: 'sec-fila' }, filtro, cuenta)),
    visor, el('h4', {}, 'Preguntas de la investigación'), ...preguntas));
  pintar();
}

// ================================================================== cortafuegos
export async function montarFirewall(holder, id) {
  const reto = S.RETOS_FW[id];
  if (!reto) throw new Error('Reto de cortafuegos desconocido: ' + id);
  await cargar();
  const titulo = reto.titulo;
  const progreso = 'fw-' + id;
  const marcador = el('span', { class: 'badge badge-accent' });
  let reglas = reto.inicial.map(r => ({ ...r }));
  const tabla = el('tbody');
  const flujos = el('ul', { class: 'tasks sec-flujos' });
  const dirs = ['cualquiera', 'LAN', ...(id === 'dmz' ? ['DMZ'] : []), 'Internet', ...Object.values(reto.hosts)];
  const nombreDir = d => Object.entries(reto.hosts).find(([, ip]) => ip === d)?.[0] || d;
  const sel = (lab, opts, val) => { const s = el('select', { 'aria-label': lab }, opts.map(([v, t]) => el('option', { value: v }, t))); s.value = String(val); return s; };
  const nueva = { accion: 'permitir', proto: 'tcp', origen: 'LAN', destino: 'Internet', puerto: 443 };
  const fAccion = sel('Acción', [['permitir', 'Permitir'], ['denegar', 'Denegar']], nueva.accion);
  const fProto = sel('Protocolo', [['tcp', 'TCP'], ['udp', 'UDP'], ['icmp', 'ICMP'], ['cualquiera', 'Cualquiera']], nueva.proto);
  const fOrigen = sel('Origen', dirs.map(d => [d, nombreDir(d)]), nueva.origen);
  const fDestino = sel('Destino', dirs.map(d => [d, nombreDir(d)]), nueva.destino);
  const fPuerto = sel('Puerto', [['cualquiera', 'Cualquiera'], ...S.PUERTOS_CONOCIDOS.map(([t, p]) => [String(p), t])], nueva.puerto);
  const btnAdd = el('button', { type: 'button', class: 'btn btn-primary btn-sm' }, 'Añadir regla al final');
  btnAdd.addEventListener('click', () => { reglas.push({ accion: fAccion.value, proto: fProto.value, origen: fOrigen.value, destino: fDestino.value, puerto: fPuerto.value === 'cualquiera' ? 'cualquiera' : +fPuerto.value }); pintar(); });
  const btnReset = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Reiniciar');
  btnReset.addEventListener('click', () => { reglas = reto.inicial.map(r => ({ ...r })); pintar(); });
  const textoRegla = r => `${r.accion === 'permitir' ? 'Permitir' : 'Denegar'} ${r.proto === 'cualquiera' ? 'todo' : r.proto.toUpperCase()} de ${nombreDir(r.origen)} a ${nombreDir(r.destino)}${r.puerto === 'cualquiera' || r.proto === 'icmp' ? '' : ' puerto ' + r.puerto}`;
  function pintar() {
    tabla.replaceChildren(...reglas.map((r, i) => el('tr', { class: r.accion === 'permitir' ? 'sec-permitir' : 'sec-denegar' },
      el('td', {}, String(i + 1)), el('td', {}, textoRegla(r)),
      el('td', { class: 'sec-acciones' },
        el('button', { type: 'button', class: 'btn btn-quiet btn-sm', 'aria-label': `Subir la regla ${i + 1}`, disabled: i === 0, onclick: () => { [reglas[i - 1], reglas[i]] = [reglas[i], reglas[i - 1]]; pintar(); } }, '↑'),
        el('button', { type: 'button', class: 'btn btn-quiet btn-sm', 'aria-label': `Bajar la regla ${i + 1}`, disabled: i === reglas.length - 1, onclick: () => { [reglas[i + 1], reglas[i]] = [reglas[i], reglas[i + 1]]; pintar(); } }, '↓'),
        el('button', { type: 'button', class: 'btn btn-quiet btn-sm', 'aria-label': `Borrar la regla ${i + 1}`, onclick: () => { reglas.splice(i, 1); pintar(); } }, '✕')))),
    el('tr', { class: 'sec-denegar muted' }, el('td', {}, '∗'), el('td', {}, 'Denegar todo (regla implícita final)'), el('td')));
    const ok = S.revisarFirewall(reto, reglas);
    flujos.replaceChildren(...reto.flujos.map((f, i) => {
      const r = S.evaluarFirewall(reglas, f);
      return el('li', {}, el('span', { class: 'check' + (ok[i] ? ' on' : ' bad'), 'aria-hidden': 'true' }, ok[i] ? '✓' : '✗'),
        el('span', {}, `${f.d} (${f.proto.toUpperCase()}${f.proto === 'icmp' ? '' : ' ' + f.puerto}). Debe ${f.debe === 'permitir' ? 'pasar' : 'bloquearse'}: ahora ${r.accion === 'permitir' ? 'pasa' : 'se bloquea'} por ${r.regla < 0 ? 'la regla implícita' : 'la regla ' + (r.regla + 1)}.`));
    }));
    const n = ok.filter(Boolean).length;
    marcador.textContent = `${n}/${ok.length} flujos correctos`;
    if (n === ok.length) completar(progreso, titulo);
  }
  holder.append(seccion(titulo, marcador,
    el('div', { class: 'lab-tags' }, el('span', { class: 'badge level-' + reto.nivel }, NIVEL[reto.nivel])),
    el('p', { class: 'muted' }, reto.intro),
    el('p', { class: 'small muted' }, `Zonas: LAN = ${S.ZONAS.LAN}${id === 'dmz' ? ', DMZ = ' + S.ZONAS.DMZ : ''}, Internet = todo lo demás.`),
    el('div', { class: 'cli-layout sec-fw' },
      el('div', {},
        el('h4', {}, 'Reglas (se aplica la primera que coincide)'),
        el('div', { class: 'table-wrap' }, el('table', { class: 'table sec-tabla' }, el('thead', {}, el('tr', {}, el('th', {}, '#'), el('th', {}, 'Regla'), el('th', {}, ''))), tabla)),
        el('div', { class: 'sec-form' }, fAccion, fProto, fOrigen, fDestino, fPuerto), el('div', { class: 'hero-cta' }, btnAdd, btnReset)),
      el('div', {}, el('h4', {}, 'Tráfico de prueba'), flujos))));
  pintar();
}

// ================================================================== respuesta a incidentes
export async function montarIncidente(holder, id) {
  const inc = S.INCIDENTES[id];
  if (!inc) throw new Error('Incidente desconocido: ' + id);
  await cargar();
  const titulo = 'Respuesta a incidentes: ' + inc.titulo;
  const marcador = el('span', { class: 'badge badge-accent' });
  const caja = el('div', { class: 'sec-ir' });
  const max = S.maximoIncidente(inc);
  function empezar() {
    let puntos = 0;
    const historial = el('ol', { class: 'sec-ir-hist' });
    const paso = i => {
      marcador.textContent = `Paso ${Math.min(i + 1, inc.pasos.length)}/${inc.pasos.length}`;
      if (i === inc.pasos.length) {
        const ok = puntos / max >= S.APROBADO;
        if (ok) completar('ir-' + id, titulo);
        caja.replaceChildren(historial, el('div', { class: 'alert ' + (ok ? 'alert-ok' : 'alert-warn') },
          el('p', {}, el('strong', {}, `${puntos} de ${max} puntos (${Math.round((puntos / max) * 100)} %). `), ok ? 'Incidente bien gestionado: contuviste, conservaste pruebas, recuperaste con seguridad y aprendiste.' : `Hace falta un ${S.APROBADO * 100} %. Repasa las decisiones marcadas y vuelve a intentarlo.`),
          el('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: empezar }, 'Repetir el caso')));
        return;
      }
      const p = inc.pasos[i];
      const ops = [...p.o].sort(() => Math.random() - 0.5).map(([txt, pts, fb]) => {
        const b = el('button', { type: 'button', class: 'btn btn-ghost sec-op' }, txt);
        b.addEventListener('click', () => {
          puntos += pts;
          historial.append(el('li', { class: 'sec-ir-' + (pts === 2 ? 'ok' : pts === 1 ? 'medio' : 'mal') }, el('p', { class: 'small' }, el('strong', {}, p.s), ' ', txt), el('p', { class: 'small muted' }, (pts === 2 ? '✓ ' : pts === 1 ? '≈ ' : '✗ ') + fb)));
          paso(i + 1);
        });
        return b;
      });
      caja.replaceChildren(historial, el('div', { class: 'card sec-ir-paso' }, el('p', {}, el('strong', {}, p.s)), el('div', { class: 'sec-ops' }, ops)));
      ops[0]?.focus({ preventScroll: true });
    };
    paso(0);
  }
  holder.append(seccion(titulo, marcador, el('div', { class: 'lab-tags' }, el('span', { class: 'badge level-' + inc.nivel }, NIVEL[inc.nivel])),
    el('p', { class: 'muted' }, inc.intro), caja));
  empezar();
}
