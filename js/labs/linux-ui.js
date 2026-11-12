// Laboratorio de la terminal Linux: monta la terminal genérica con el motor de Linux.
import { montarTerminal } from './terminal-ui.js';
import { nuevoLinux, ejecutar, prompt, completar } from './linux.js';
import { LINUX_LABS } from './linux-labs.js';

const motor = { nuevo: nuevoLinux, ejecutar, prompt, completar, esError: t => /(No existe|Permiso denegado|no se encontró la orden|Operación no permitida|Access denied|failed|Fallo)/i.test(t) };

export function montarLinux(holder, id) {
  const lab = LINUX_LABS[id];
  if (!lab) throw new Error('Caso de Linux desconocido: ' + id);
  return montarTerminal(holder, {
    lab, motor, progreso: 'linux-' + id, nombre: 'Terminal Linux', clase: 'terminal-linux',
    bienvenida: 'Ubuntu 24.04 LTS (srv-web01)\nSimulador de administración: escribe help para ver los comandos. Tab completa comandos y rutas; ↑ y ↓ recuperan comandos.\n',
  });
}
