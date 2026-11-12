// Buscador del curso a página completa.
import { iniciarPagina, $ } from '../core.js';
import { crearBuscador } from '../buscador.js';

iniciarPagina();
const { panel } = crearBuscador({ paginaCompleta: true });
$('#tutorHost').append(panel);
const q = new URLSearchParams(location.search).get('q');
if (q) panel.querySelector('textarea').value = q.slice(0, 500);
