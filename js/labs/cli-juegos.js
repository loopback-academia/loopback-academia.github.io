// Fichas y juegos para aprender los comandos de Cisco IOS desde cero:
//  [[apuntes:<lab>]]  ficha para copiar en el cuaderno (o imprimir) con los comandos de un laboratorio.
//  [[ordena:<lab>]]   ordenar los comandos de ese laboratorio pensando en qué modo va cada uno.
//  [[modos:ios]]      «¿En qué modo estoy?»: reconocer el modo por el prompt y saber dónde se escribe cada comando.
import { el, toast } from '../core.js';
import { guardarLab, labHecho, cargar } from '../progreso.js';
import { LABS } from './ios-labs.js';
import { fichaComandos, secuenciaOrdenar, puedeIr, rondasModos, NOMBRE_MODO } from './cli-guia.js';

const SUFIJO = { user: '>', priv: '#', config: '(config)#', if: '(config-if)#', line: '(config-line)#', vlan: '(config-vlan)#', router: '(config-router)#', dhcp: '(dhcp-config)#', 'acl-std': '(config-std-nacl)#', 'acl-ext': '(config-ext-nacl)#' };
const mezclar = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

export async function montarApuntes(holder, id) {
  const lab = LABS[id];
  if (!lab) throw new Error('Laboratorio desconocido: ' + id);
  const filas = fichaComandos(lab);
  const imprimir = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, '🖨️ Imprimir la ficha');
  const caja = el('section', { class: 'ficha', 'aria-label': 'Ficha de comandos para tu cuaderno' },
    el('div', { class: 'ficha-cab' }, el('h3', {}, '📝 Apunta en tu cuaderno'), imprimir),
    el('p', { class: 'muted' }, `Los comandos de «${lab.titulo}» en orden. Cópialos a mano: escribirlos te ayuda a memorizarlos. Después practícalos en el simulador de abajo.`),
    el('div', { class: 'ficha-tabla' },
      el('table', {},
        el('thead', {}, el('tr', {}, el('th', { scope: 'col' }, 'Comando'), el('th', { scope: 'col' }, 'Dónde se escribe'), el('th', { scope: 'col' }, 'Para qué sirve'))),
        el('tbody', {}, ...filas.map(p => el('tr', {},
          el('td', {}, el('code', {}, p.linea)),
          el('td', {}, el('code', { class: 'ficha-prompt' }, p.sufijo), el('br'), el('span', { class: 'small muted' }, NOMBRE_MODO[p.modo])),
          el('td', {}, p.que)))))),
    el('p', { class: 'small muted' }, 'Truco: casi todos los comandos se pueden abreviar (conf t, int g0/1, sh run) y la tecla Tab los completa.'));
  imprimir.addEventListener('click', () => {
    caja.classList.add('ficha-activa');
    document.body.classList.add('imprimir-ficha');
    const fin = () => { caja.classList.remove('ficha-activa'); document.body.classList.remove('imprimir-ficha'); removeEventListener('afterprint', fin); };
    addEventListener('afterprint', fin);
    print();
    setTimeout(fin, 1000);
  });
  holder.append(caja);
}

export async function montarOrdena(holder, id) {
  const lab = LABS[id];
  if (!lab) throw new Error('Laboratorio desconocido: ' + id);
  await cargar();
  const clave = 'ordena-' + id;
  const seq = secuenciaOrdenar(lab);
  const caja = el('section', { class: 'juego', 'aria-label': 'Ordena los comandos' });
  let restantes, colocados, fallos;

  function pintar(msg) {
    const consola = el('div', { class: 'terminal juego-consola', 'aria-live': 'polite' },
      ...colocados.map(p => el('div', { class: 'in' }, p.prompt + p.linea)),
      restantes.length ? el('div', { class: 'juego-cursor' }, restantes[0].prompt + ' ▌') : el('div', { class: 'ok' }, seq[seq.length - 1].promptDespues + '  ✓ ¡Secuencia correcta!'));
    const botones = restantes.length ? el('div', { class: 'juego-ops' }, ...mezclar(restantes).map(p => {
      const b = el('button', { type: 'button', class: 'juego-op' }, p.linea);
      b.addEventListener('click', () => elegir(p, b));
      return b;
    })) : null;
    const fin = !restantes.length ? fallos === 0 ? '🏆 ¡Perfecto, sin ningún fallo!' : fallos === 1 ? '¡Superado con un solo fallo! ¿Te atreves a hacerlo sin ninguno?' : `Terminado con ${fallos} fallos. Repítelo hasta hacerlo con uno o ninguno para superarlo.` : null;
    const otra = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, restantes.length ? 'Empezar de nuevo' : 'Jugar otra vez');
    otra.addEventListener('click', reiniciar);
    caja.replaceChildren(...[
      el('div', { class: 'ficha-cab' }, el('h3', {}, '🧩 Ordena los comandos'), labHecho(clave) ? el('span', { class: 'badge badge-ok' }, '✓ Superado') : null),
      el('p', { class: 'muted' }, `Toca los comandos en el orden en que los escribirías para «${lab.titulo.toLowerCase()}». Fíjate en el prompt: te dice en qué modo estás.`),
      consola,
      msg ? el('p', { class: 'juego-msg ' + msg.tipo, role: 'status' }, msg.texto) : null,
      botones,
      fin ? el('p', { class: 'juego-msg ok' }, fin) : null,
      el('div', { class: 'hero-cta' }, otra),
    ].filter(Boolean));
  }
  function elegir(p, boton) {
    if (puedeIr(restantes, p)) {
      colocados.push(p);
      restantes = restantes.filter(x => x !== p);
      if (!restantes.length && fallos <= 1 && !labHecho(clave)) { guardarLab(clave); toast('¡Juego superado: ordena los comandos!'); }
      pintar({ tipo: 'ok', texto: '✓ ' + p.que });
    } else {
      fallos++;
      boton.classList.add('mal');
      const ahora = restantes[0];
      const texto = p.modo !== ahora.modo
        ? `Todavía no: ahora estás en ${NOMBRE_MODO[ahora.modo]} (${ahora.prompt}) y «${p.linea}» se escribe en ${NOMBRE_MODO[p.modo]} (${SUFIJO[p.modo]}).`
        : `Ese va más adelante. Piensa qué hay que hacer antes.`;
      const m = caja.querySelector('.juego-msg');
      const nuevo = el('p', { class: 'juego-msg warn', role: 'status' }, '✗ ' + texto);
      if (m) m.replaceWith(nuevo); else caja.querySelector('.juego-consola').after(nuevo);
    }
  }
  function reiniciar() { restantes = [...seq]; colocados = []; fallos = 0; pintar(null); }
  holder.append(caja);
  reiniciar();
}

export async function montarModos(holder) {
  await cargar();
  const clave = 'modos-ios';
  const labs = Object.values(LABS).filter(l => l.tipo !== 'averia');
  const caja = el('section', { class: 'juego', 'aria-label': '¿En qué modo estoy?' });
  let rondas, i, aciertos;

  function pintar(resp) {
    if (i >= rondas.length) {
      const ok = aciertos >= rondas.length - 1;
      if (ok && !labHecho(clave)) { guardarLab(clave); toast('¡Juego superado: los modos de IOS!'); }
      const otra = el('button', { type: 'button', class: 'btn btn-primary btn-sm' }, 'Jugar otra vez');
      otra.addEventListener('click', reiniciar);
      caja.replaceChildren(el('h3', {}, '🧭 ¿En qué modo estoy?'),
        el('p', { class: 'juego-msg ' + (ok ? 'ok' : 'warn') }, `${aciertos} de ${rondas.length}. ` + (ok ? '¡Ya te mueves por el IOS como un técnico!' : 'Repasa la tabla de modos de la lección y vuelve a intentarlo.')),
        el('div', { class: 'hero-cta' }, otra));
      return;
    }
    const r = rondas[i];
    const pregunta = r.tipo === 'prompt'
      ? [el('p', {}, 'Ves este prompt en la consola. ¿En qué modo estás?'), el('p', { class: 'juego-prompt' }, el('code', {}, r.pregunta + ' ▌'))]
      : [el('p', {}, '¿En qué modo se escribe este comando?'), el('p', { class: 'juego-prompt' }, el('code', {}, r.pregunta))];
    const ops = el('div', { class: 'juego-ops dos' }, ...r.opciones.map(m => {
      const b = el('button', { type: 'button', class: 'juego-op' + (resp ? (m === r.correcta ? ' bien' : m === resp ? ' mal' : '') : ''), disabled: !!resp },
        NOMBRE_MODO[m], r.tipo === 'comando' ? el('span', { class: 'small muted' }, ' ' + SUFIJO[m]) : null);
      b.addEventListener('click', () => { if (m === r.correcta) aciertos++; pintar(m); });
      return b;
    }));
    let pie = null;
    if (resp) {
      const sig = el('button', { type: 'button', class: 'btn btn-primary btn-sm' }, i + 1 < rondas.length ? 'Siguiente' : 'Ver resultado');
      sig.addEventListener('click', () => { i++; pintar(null); });
      pie = [el('p', { class: 'juego-msg ' + (resp === r.correcta ? 'ok' : 'warn'), role: 'status' },
        (resp === r.correcta ? '✓ ¡Correcto! ' : `✗ Era ${NOMBRE_MODO[r.correcta]} (${SUFIJO[r.correcta]}). `) + (r.tipo === 'comando' ? r.paso.que : '')), el('div', { class: 'hero-cta' }, sig)];
    }
    caja.replaceChildren(...[
      el('div', { class: 'ficha-cab' }, el('h3', {}, '🧭 ¿En qué modo estoy?'), el('span', { class: 'badge' }, `${i + 1} / ${rondas.length}`), labHecho(clave) ? el('span', { class: 'badge badge-ok' }, '✓ Superado') : null),
      ...pregunta, ops, ...(pie || [])].filter(Boolean));
    if (resp) caja.querySelector('.hero-cta .btn')?.focus();
  }
  function reiniciar() { rondas = rondasModos(labs, 8); i = 0; aciertos = 0; pintar(null); }
  holder.append(caja);
  reiniciar();
}
