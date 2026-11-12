// Laboratorio de la consola de Windows: monta la terminal genérica con el motor de Windows.
import { montarTerminal } from './terminal-ui.js';
import { nuevoPc, ejecutar, prompt, completar } from './windows.js';
import { WIN_LABS } from './windows-labs.js';

const motor = { nuevo: nuevoPc, ejecutar, prompt, completar, esError: t => /^(Error|ERROR|La solicitud de ping no pudo|".*" no se reconoce|\*\*\*)/m.test(t) };

export function montarWindows(holder, id) {
  const lab = WIN_LABS[id];
  if (!lab) throw new Error('Caso de Windows desconocido: ' + id);
  return montarTerminal(holder, {
    lab, motor, progreso: 'win-' + id, nombre: 'Consola de Windows', clase: 'terminal-win',
    bienvenida: 'Microsoft Windows [Versión 10.0.22631.4460]\n(c) Microsoft Corporation. Todos los derechos reservados.\n\nSimulador de soporte: escribe help para ver los comandos. Tab completa, ↑ y ↓ recuperan comandos.\n',
  });
}
