// Programas para la ejecución paso a paso ([[paso:<id>]]). Cada uno se ejecuta de verdad con Python y luego se recorre
// línea a línea; las preguntas se responden mirando el estado en el paso adecuado.
export const PASOS = {
  variables: {
    titulo: 'Variables que cambian', nivel: 'principiante',
    intro: 'Una variable es una etiqueta que apunta a un valor. Avanza línea a línea y mira cómo cambian a, b y c.',
    codigo: 'a = 5\nb = a + 2\na = a * 3\nc = a - b\nb, c = c, b\nprint(a, b, c)\n',
    preguntas: [
      { q: 'Justo antes de la línea 4, ¿cuánto vale a?', respuesta: '15', e: 'La línea 3 calculó a * 3 con el valor que tenía (5): ahora a vale 15. b sigue valiendo 7: no se recalcula solo.' },
      { q: '¿Qué imprime el programa?', respuesta: '15 8 7', e: 'c = 15 - 7 = 8 y después la línea 5 intercambia b y c en un solo paso.' },
    ],
  },
  bucle: {
    titulo: 'Un bucle que acumula', nivel: 'principiante',
    intro: 'El bucle repite las líneas de dentro una vez por cada valor de i. Fíjate en cómo total va creciendo vuelta a vuelta.',
    codigo: 'total = 0\nfor i in range(1, 5):\n    total = total + i\n    print("vuelta", i, "total", total)\nprint("fin:", total)\n',
    preguntas: [
      { q: '¿Cuántas veces se ejecuta la línea 3?', respuesta: '4', e: 'range(1, 5) da 1, 2, 3 y 4: el 5 no se incluye.' },
      { q: '¿Cuánto vale total al terminar?', respuesta: '10', e: '1 + 2 + 3 + 4 = 10.' },
    ],
  },
  funciones: {
    titulo: 'Llamar a una función', nivel: 'principiante',
    intro: 'Cuando se llama a una función aparece un marco nuevo con sus propias variables. Al devolver el resultado, el marco desaparece.',
    codigo: 'def precio_final(precio, descuento):\n    rebaja = precio * descuento / 100\n    return precio - rebaja\n\nlibro = precio_final(20, 10)\ncamisa = precio_final(50, 20)\nprint(libro, camisa)\n',
    preguntas: [
      { q: '¿Existe la variable rebaja en el programa principal?', opciones: ['No: es local de la función y desaparece al volver', 'Sí, con el último valor calculado', 'Solo después de la segunda llamada'], c: 0, e: 'Cada llamada tiene su propio marco. Lo que se crea dentro es local y se pierde al hacer return.' },
      { q: '¿Qué valor devuelve la segunda llamada?', respuesta: '40.0', comparar: s => parseFloat(s), e: '50 * 20 / 100 = 10 de rebaja; 50 - 10 = 40.0 (es float porque / siempre da decimal).' },
    ],
  },
  listas: {
    titulo: 'Dos nombres, una misma lista', nivel: 'principiante',
    intro: 'Asignar una lista a otra variable no la copia: los dos nombres apuntan al mismo objeto. El número de objeto te lo muestra.',
    codigo: 'compra = ["pan", "leche"]\notra = compra\notra.append("huevos")\ncopia = list(compra)\ncopia.append("fruta")\nprint(compra)\nprint(copia)\n',
    preguntas: [
      { q: '¿Qué imprime la línea 6?', respuesta: "['pan', 'leche', 'huevos']", comparar: s => s.replace(/\s|"/g, '').replace(/'/g, ''), e: 'otra y compra son el mismo objeto: añadir por un nombre se ve por el otro.' },
      { q: '¿Por qué «fruta» no aparece en compra?', opciones: ['Porque list(compra) crea un objeto nuevo, una copia', 'Porque append solo funciona una vez', 'Porque copia es una tupla'], c: 0, e: 'list(...) (o compra.copy()) crea otra lista: tiene otro número de objeto.' },
    ],
  },
  pila: {
    titulo: 'La pila de llamadas con recursión', nivel: 'principiante',
    intro: 'Una función recursiva se llama a sí misma. Cada llamada apila un marco nuevo con su propio n, hasta llegar al caso base.',
    codigo: 'def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\nresultado = factorial(4)\nprint(resultado)\n',
    preguntas: [
      { q: '¿Cuántos marcos de factorial hay apilados como máximo a la vez?', respuesta: '4', e: 'factorial(4) llama a factorial(3), que llama a factorial(2), que llama a factorial(1): cuatro marcos.' },
      { q: '¿Qué valor devuelve la llamada factorial(2)?', respuesta: '2', e: 'factorial(1) devuelve 1 y factorial(2) devuelve 2 * 1 = 2.' },
    ],
  },
  busqueda: {
    titulo: 'Búsqueda binaria', nivel: 'avanzado',
    intro: 'En una lista ordenada, la búsqueda binaria mira el centro y descarta la mitad en cada vuelta. Sigue cómo se acercan bajo y alto.',
    codigo: 'datos = [3, 8, 15, 21, 34, 42, 57, 63, 78, 91]\nbuscado = 63\nbajo, alto = 0, len(datos) - 1\npasos = 0\nwhile bajo <= alto:\n    medio = (bajo + alto) // 2\n    pasos += 1\n    if datos[medio] == buscado:\n        break\n    elif datos[medio] < buscado:\n        bajo = medio + 1\n    else:\n        alto = medio - 1\nprint("posición", medio, "en", pasos, "pasos")\n',
    preguntas: [
      { q: '¿Qué valor tiene medio en la primera vuelta?', respuesta: '4', e: '(0 + 9) // 2 = 4, y datos[4] = 34 es menor que 63: se descarta la mitad izquierda.' },
      { q: '¿En cuántas vueltas lo encuentra?', respuesta: '2', e: 'Primero mira la posición 4 (34) y después la 7 (63). Con 10 elementos, una búsqueda lineal habría necesitado 8.' },
    ],
  },
};

export function comprobarPaso(p, r) {
  if (p.opciones) return +r === p.c;
  const f = p.comparar || (s => String(s).trim().replace(/\s+/g, ' '));
  return f(String(r)) === f(p.respuesta);
}
