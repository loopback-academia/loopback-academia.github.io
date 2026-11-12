// Detector de phishing: el alumno revisa cada correo, decide si es legítimo o phishing y marca las señales que ve.
import { el, toast } from '../core.js';
import { guardarLab, labHecho, cargar } from '../progreso.js';
import { CORREOS, SENALES, evaluarCorreo, resumen, APROBADO } from './phishing.js';

export async function montarPhishing(holder) {
  await cargar();
  let n = 0;
  const respuestas = {};
  const marcador = el('span', { class: 'badge badge-accent' });
  const vista = el('div', { class: 'mail-vista' });
  const final = el('div', { 'aria-live': 'polite' });

  function contar() {
    const r = resumen(respuestas);
    marcador.textContent = `${r.respondidos}/${r.total} revisados · ${r.bien} bien`;
    if (r.respondidos === r.total) {
      const pct = Math.round((r.bien / r.total) * 100);
      final.replaceChildren(el('div', { class: 'alert ' + (r.aprobado ? 'alert-ok' : 'alert-warn') },
        el('p', {}, el('strong', {}, r.aprobado ? `¡Bandeja revisada! ${pct} % de aciertos.` : `${pct} % de aciertos: necesitas un ${APROBADO * 100} %.`), ' ',
          r.aprobado ? 'En la vida real, el phishing se reporta (botón «Reportar» o reenviando a TI) y se borra. Nunca se responde ni se hace clic «para ver qué pasa».' : 'Repasa las explicaciones y vuelve a empezar.'),
        r.aprobado ? null : el('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: reiniciar }, 'Volver a empezar')));
      if (r.aprobado && !labHecho('phishing-bandeja')) { guardarLab('phishing-bandeja'); toast('Detector de phishing completado.'); }
    }
  }
  function reiniciar() { for (const k of Object.keys(respuestas)) delete respuestas[k]; n = 0; final.replaceChildren(); pintar(); contar(); }

  function pintar() {
    const c = CORREOS[n];
    const destino = el('p', { class: 'small mail-destino', 'aria-live': 'polite' });
    const cuerpo = el('div', { class: 'mail-cuerpo' },
      c.cuerpo.map(p => el('p', {}, p)),
      (c.enlaces || []).map(l => {
        const b = el('button', { type: 'button', class: 'mail-link', title: l.url }, l.texto);
        b.addEventListener('click', () => { destino.textContent = '🔗 Este enlace lleva en realidad a: ' + l.url; });
        return el('p', {}, b);
      }),
      destino,
      c.adjuntos?.length ? el('p', { class: 'mail-adjuntos' }, c.adjuntos.map(a => el('span', { class: 'badge' }, '📎 ' + a))) : null,
      el('p', { class: 'muted small' }, c.firma));
    const casillas = Object.entries(SENALES).map(([k, t]) => el('label', { class: 'option' }, el('input', { type: 'checkbox', value: k }), el('span', {}, t)));
    const zonaSenales = el('fieldset', { class: 'mail-senales', hidden: true }, el('legend', {}, '¿Qué señales lo delatan? Marca todas las que veas.'), casillas,
      el('button', { type: 'button', class: 'btn btn-primary btn-sm' }, 'Confirmar'));
    const resultado = el('div', { 'aria-live': 'polite' });
    const btnLeg = el('button', { type: 'button', class: 'btn btn-ghost' }, '✅ Es legítimo');
    const btnPhi = el('button', { type: 'button', class: 'btn btn-ghost' }, '🎣 Es phishing');
    const responder = (esPhishing, senales = []) => {
      const r = evaluarCorreo(c, { esPhishing, senales });
      respuestas[c.id] = r;
      btnLeg.disabled = btnPhi.disabled = true; zonaSenales.hidden = true;
      resultado.replaceChildren(el('div', { class: 'alert ' + (r.ok ? 'alert-ok' : 'alert-warn') },
        el('p', {}, el('strong', {}, r.ok ? 'Correcto. ' : r.clasificacion ? 'Bien clasificado, pero no marcaste ninguna señal real. ' : `No: era ${c.phishing ? 'phishing' : 'legítimo'}. `), c.explicacion),
        c.senales.length ? el('ul', { class: 'small' }, c.senales.map(k => el('li', {}, (r.acertadas.includes(k) ? '✓ ' : '• ') + SENALES[k]))) : null,
        r.falsas.length && c.phishing ? el('p', { class: 'small muted' }, 'Marcaste también: ' + r.falsas.map(k => SENALES[k].toLowerCase()).join('; ') + '.') : null));
      contar();
    };
    btnLeg.addEventListener('click', () => responder(false));
    btnPhi.addEventListener('click', () => { zonaSenales.hidden = false; zonaSenales.querySelector('input').focus(); });
    zonaSenales.querySelector('button').addEventListener('click', () => responder(true, [...zonaSenales.querySelectorAll('input:checked')].map(i => i.value)));
    if (respuestas[c.id]) { btnLeg.disabled = btnPhi.disabled = true; resultado.append(el('p', { class: 'muted small' }, respuestas[c.id].ok ? 'Ya lo revisaste: correcto.' : 'Ya lo revisaste: fallado.')); }
    const prev = el('button', { type: 'button', class: 'btn btn-quiet btn-sm', disabled: n === 0 }, '‹ Anterior');
    const next = el('button', { type: 'button', class: 'btn btn-quiet btn-sm', disabled: n === CORREOS.length - 1 }, 'Siguiente ›');
    prev.addEventListener('click', () => { n--; pintar(); });
    next.addEventListener('click', () => { n++; pintar(); });
    vista.replaceChildren(
      el('p', { class: 'small muted' }, `Correo ${n + 1} de ${CORREOS.length}`),
      el('article', { class: 'mail' },
        el('div', { class: 'mail-cab' }, el('p', {}, el('strong', {}, c.de), ' ', el('span', { class: 'mono small' }, `<${c.correo}>`)), el('p', { class: 'mail-asunto' }, c.asunto), el('p', { class: 'small muted' }, c.fecha)),
        cuerpo),
      el('div', { class: 'hero-cta' }, btnLeg, btnPhi), zonaSenales, resultado,
      el('div', { class: 'hero-cta' }, prev, next));
  }

  holder.append(el('section', { class: 'lab', 'aria-label': 'Detector de phishing' },
    el('div', { class: 'lab-head' }, el('h3', {}, 'Detector de phishing: la bandeja de entrada'), marcador),
    el('p', { class: 'muted' }, 'Revisa los correos de Comercial La Ceiba (empresa ficticia: todos los nombres y dominios son inventados). El dominio real de la empresa es laceiba.example. Pulsa los enlaces para ver a dónde llevan de verdad: aquí no se abre nada.'),
    vista, final));
  pintar(); contar();
}
