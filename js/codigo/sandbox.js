// Corre dentro de sandbox.html (iframe con sandbox="allow-scripts", origen opaco).
// Recibe {id, lang, code, tests, timeout} del padre y devuelve la salida y el resultado de las pruebas.
// Cada ejecución va a un Worker; si tarda demasiado (bucle infinito), se destruye y se crea otro.
(function () {
  'use strict';
  // Solo se ejecuta aislado: con origen opaco y dentro de un iframe.
  if (window.parent === window || self.origin !== 'null') { document.documentElement.textContent = 'Este entorno solo funciona dentro de Loopback.'; return; }

  var BASE = new URL('.', location.href).href;
  // Trazador de Python para la ejecución paso a paso: guarda en cada línea la pila de llamadas, sus variables y la salida.
  var TRAZADOR = [
    'import sys, io, json, types',
    'LIMITE = 600',
    'pasos = []',
    'salida = io.StringIO()',
    'class Limite(Exception): pass',
    'def corto(v):',
    '    try:',
    '        if isinstance(v, types.FunctionType): return "<función " + v.__name__ + ">"',
    '        if isinstance(v, types.ModuleType): return "<módulo " + v.__name__ + ">"',
    '        if isinstance(v, type): return "<clase " + v.__name__ + ">"',
    '        r = repr(v)',
    '    except Exception:',
    '        r = "?"',
    '    return r if len(r) <= 120 else r[:117] + "..."',
    'objetos = {}',
    'vivos = []',
    'def obj(v):',
    '    if not isinstance(v, (list, dict, set)): return None',
    '    if id(v) not in objetos:',
    '        objetos[id(v)] = len(objetos) + 1',
    '        vivos.append(v)',
    '    return objetos[id(v)]',
    'def foto(frame):',
    '    pila = []',
    '    f = frame',
    '    while f is not None and f.f_code.co_filename == "<alumno>":',
    '        vs = {}',
    '        for k, v in list(f.f_locals.items())[:40]:',
    '            if not k.startswith("__"): vs[k] = [corto(v), obj(v)]',
    '        pila.append({"f": "programa principal" if f.f_code.co_name == "<module>" else f.f_code.co_name, "v": vs})',
    '        f = f.f_back',
    '    pila.reverse()',
    '    return pila',
    'def traza(frame, evento, arg):',
    '    if frame.f_code.co_filename != "<alumno>": return None',
    '    if evento == "call" and frame.f_code.co_name == "<module>": return traza',
    '    if len(pasos) >= LIMITE: raise Limite()',
    '    p = {"l": frame.f_lineno, "e": evento, "pila": foto(frame), "out": salida.getvalue()}',
    '    if evento == "return": p["r"] = corto(arg)',
    '    if evento == "exception": p["x"] = arg[0].__name__ + ": " + str(arg[1])',
    '    pasos.append(p)',
    '    return traza',
    'error = None',
    'ns = {"__name__": "__main__"}',
    'viejo = sys.stdout',
    'sys.stdout = salida',
    'try:',
    '    codigo = compile(CODIGO, "<alumno>", "exec")',
    '    sys.settrace(traza)',
    '    exec(codigo, ns)',
    'except Limite:',
    '    error = "Se ha detenido tras " + str(LIMITE) + " pasos: el paso a paso es para programas cortos."',
    'except SyntaxError as e:',
    '    error = "SyntaxError: " + str(e.msg) + " (línea " + str(e.lineno) + ")"',
    'except BaseException as e:',
    '    error = type(e).__name__ + ": " + str(e)',
    'finally:',
    '    sys.settrace(None)',
    '    sys.stdout = viejo',
    'json.dumps({"pasos": pasos, "error": error, "out": salida.getvalue()})',
  ].join('\n');
  var CODIGO_WORKER = [
    "'use strict';",
    'var BASE = ' + JSON.stringify(BASE) + ';',
    'var py = null;',
    'var TRAZADOR = ' + JSON.stringify(TRAZADOR) + ';',
    'function enviar(m) { postMessage(m); }',
    'function texto(a) { return a.map(function (x) { if (typeof x === "string") return x; try { return JSON.stringify(x); } catch (e) { return String(x); } }).join(" "); }',
    // ---------------- JavaScript
    'function correrJs(m) {',
    '  var salida = function (tipo) { return function () { enviar({ id: m.id, type: tipo, text: texto([].slice.call(arguments)) + "\\n" }); }; };',
    '  var consola = { log: salida("stdout"), info: salida("stdout"), warn: salida("stderr"), error: salida("stderr") };',
    '  var pruebas = (m.tests || []).map(function (t, i) { return "try { __r[" + i + "] = !!(" + t.code + "); } catch (e) { __r[" + i + "] = false; }"; }).join("\\n");',
    '  try {',
    '    var f = new Function("console", "__r", "\\"use strict\\";\\n" + m.code + "\\n;" + pruebas + "\\nreturn __r;");',
    '    var r = f(consola, []);',
    '    enviar({ id: m.id, type: "done", ok: true, results: r });',
    '  } catch (e) { enviar({ id: m.id, type: "done", ok: false, error: (e && e.name ? e.name + ": " : "") + (e && e.message || e), results: [] }); }',
    '}',
    // ---------------- Python
    'async function cargarPython(id) {',
    '  if (py) return py;',
    '  enviar({ id: id, type: "loading" });',
    '  importScripts(BASE + "vendor/pyodide/pyodide.js");',
    '  py = await loadPyodide({ indexURL: BASE + "vendor/pyodide/" });',
    '  py.setStdin({ error: true });',
    '  return py;',
    '}',
    'async function correrPy(m) {',
    '  var p = await cargarPython(m.id);',
    '  p.setStdout({ batched: function (s) { enviar({ id: m.id, type: "stdout", text: s + "\\n" }); } });',
    '  p.setStderr({ batched: function (s) { enviar({ id: m.id, type: "stderr", text: s + "\\n" }); } });',
    '  enviar({ id: m.id, type: "running" });',
    '  var ns = p.globals.get("dict")();',
    '  try {',
    '    await p.runPythonAsync(m.code, { globals: ns });',
    '    var r = (m.tests || []).map(function (t) { try { return !!p.runPython("bool(" + t.code + ")", { globals: ns }); } catch (e) { return false; } });',
    '    enviar({ id: m.id, type: "done", ok: true, results: r });',
    '  } catch (e) {',
    '    var msg = String(e && e.message || e).trim().split("\\n");',
    '    var util = msg.filter(function (l) { return l.trim() && !/^[\\s^~]+$/.test(l) && !/^\\s*File "\\/lib\\/python|_pyodide|pyodide\\/|await |coroutine|eval_code|run_async/.test(l); });',
    '    enviar({ id: m.id, type: "done", ok: false, error: util.slice(-6).join("\\n"), results: [] });',
    '  } finally { ns.destroy(); }',
    '}',
    'async function trazarPy(m) {',
    '  var p = await cargarPython(m.id);',
    '  enviar({ id: m.id, type: "running" });',
    '  var ns = p.globals.get("dict")();',
    '  try {',
    '    ns.set("CODIGO", m.code);',
    '    var r = p.runPython(TRAZADOR, { globals: ns });',
    '    enviar({ id: m.id, type: "done", ok: true, results: [], traza: String(r) });',
    '  } catch (e) { enviar({ id: m.id, type: "done", ok: false, error: String(e && e.message || e).split("\\n").slice(-3).join("\\n"), results: [] }); }',
    '  finally { ns.destroy(); }',
    '}',
    'onmessage = function (ev) {',
    '  var m = ev.data;',
    '  if (m.lang === "javascript") correrJs(m);',
    '  else if (m.lang === "python") correrPy(m).catch(function (e) { enviar({ id: m.id, type: "done", ok: false, error: "No se pudo cargar Python: " + (e && e.message || e), results: [] }); });',
    '  else if (m.lang === "python-traza") trazarPy(m).catch(function (e) { enviar({ id: m.id, type: "done", ok: false, error: "No se pudo cargar Python: " + (e && e.message || e), results: [] }); });',
    '  else if (m.lang === "precarga-python") cargarPython(m.id).then(function () { enviar({ id: m.id, type: "ready" }); });',
    '};',
  ].join('\n');

  var url = URL.createObjectURL(new Blob([CODIGO_WORKER], { type: 'text/javascript' }));
  var workers = {}; // uno por lenguaje, para no recargar Python en cada ejecución
  function obtener(lang) {
    var clave = lang === 'javascript' ? 'js' : 'py';
    if (!workers[clave]) workers[clave] = new Worker(url);
    return workers[clave];
  }
  function responder(m) { window.parent.postMessage(m, '*'); }

  window.addEventListener('message', function (ev) {
    if (ev.source !== window.parent) return;
    var m = ev.data || {};
    if (typeof m.code !== 'string' || m.code.length > 20000 || !/^(python|javascript|precarga-python|python-traza)$/.test(m.lang)) return;
    var clave = m.lang === 'javascript' ? 'js' : 'py';
    var w = obtener(m.lang);
    var limite = Math.min(Number(m.timeout) || 5000, 15000);
    var reloj = null;
    var armar = function () { reloj = setTimeout(function () {
      w.terminate(); delete workers[clave];
      responder({ id: m.id, type: 'done', ok: false, timeout: true, error: 'El programa tardó más de ' + (limite / 1000) + ' s y se ha detenido. ¿Hay un bucle infinito?', results: [] });
    }, limite); };
    w.onmessage = function (e) {
      var r = e.data;
      if (r.type === 'loading') { responder(r); return; }      // la descarga de Python no cuenta para el límite
      if (r.type === 'running' && !reloj) armar();
      if (r.type === 'done' || r.type === 'ready') { clearTimeout(reloj); reloj = null; }
      responder(r);
    };
    if (m.lang === 'javascript') armar();
    w.postMessage(m);
  });
  responder({ type: 'sandbox-ready' });
})();
