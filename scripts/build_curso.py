#!/usr/bin/env python3
"""Compila el temario de Loopback.

Lee los módulos escritos en Markdown (contenido/*.md) y genera:
  - data/curso.json   estructura completa (módulos, lecciones ya analizadas en bloques y cuestionarios)
  - data/buscar.json  índice de búsqueda (texto plano por lección)
  - data/examen.json  banco de preguntas del simulador de examen, etiquetadas por dominio del CCNA

Formato de cada módulo:
    ---
    id: m1
    titulo: Fundamentos de redes
    dominio: 1.0 Network Fundamentals
    peso: 20
    descripcion: ...
    ---
    === m1-redes | ¿Qué es una red? | 12 | 1      (el último número es el nivel: 1 principiante, 2 intermedio, 3 avanzado, 4 profesional)
    Texto en Markdown (párrafos, listas, **negrita**, *cursiva*, `código`, [enlaces](https://...), tablas,
    bloques ``` con lenguaje), avisos (::: nota / ::: examen / ::: cuidado ... :::), elementos interactivos
    ([[anim:arp]], [[lab:subnetting]], [[cli:vlan]], [[sql:select]]) y un cuestionario:
    ::: quiz            (::: banco con el mismo formato: preguntas solo para exámenes y repaso)
    ? Enunciado
    - opción incorrecta
    + opción correcta
    = Explicación de la respuesta.
    :::

Contenido gratis y de pago: los módulos de GRATIS se publican completos en data/. Del resto, data/ solo lleva la
estructura (títulos, nivel, número de preguntas y los laboratorios que contiene), sin texto ni preguntas; su contenido
va a _privado/premium.json, que se sube a Supabase (scripts/subir-premium.mjs) y solo se entrega a quien tiene acceso.
_privado/ (no se sube al repositorio) guarda además el temario completo para las pruebas.

Uso: python3 scripts/build_curso.py [--check]   (--check: no escribe data/, falla si no está al día)
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "contenido"
OUT = ROOT / "data"
PRIV = ROOT / "_privado"

# Módulos gratuitos (se publican completos). Vacío: todo el temario es del plan completo; lo único gratis es el examen
# de entrada, que usa las preguntas de muestra de cada lección.
GRATIS: set[str] = set()

# Elementos interactivos que existen en la web (se comprueba que cada [[tipo:id]] apunta a uno real).
KNOWN = {
    "anim": {"encapsulacion", "switch", "arp", "tcp", "dhcp", "dns", "vlan", "stp", "enrutamiento", "nat", "acl", "ospf"},
    "lab": {"subnetting", "binario", "vlsm", "ipv6"},
    "cli": {"averia-sucursal", "auditoria", "basico", "vlan", "trunk", "estatica", "ospf", "acl", "ssh", "portsecurity", "router", "intervlan", "dhcp", "nat",
            "ipv6", "capa2", "averia-puerto", "averia-trunk", "averia-gestion", "averia-ruta", "averia-ospf", "averia-ssh", "averia-acl", "averia-duplex"},
    "proyecto": {"oficina"},
    "apuntes": {"basico", "vlan", "trunk", "estatica", "ospf", "acl", "ssh", "portsecurity", "router", "intervlan", "dhcp", "nat", "ipv6", "capa2"},
    "ordena": {"basico", "vlan", "trunk", "estatica", "ospf", "acl", "ssh", "portsecurity", "router", "intervlan", "dhcp", "nat", "ipv6", "capa2"},
    "modos": {"ios"},
    "lista": {"pt-instalar"},
    "topo": {"lan", "gateway", "vlan", "troncal", "intervlan", "estaticas", "dhcp", "averias", "libre"},
    "caso": {"login", "impresora-etiquetas", "sucursal", "nuevo-empleado", "lento"},
    "turno": {"soporte"},
    "video": {"viaje-mensaje", "vlan-switch", "router-decide", "dhcp-nat", "phishing", "automatizar", "tablas-claves", "join", "transaccion", "bucle", "lenguajes", "git-flujo", "busqueda", "ticket-vida"},
    "sqli": {"login"},
    "phishing": {"bandeja"},
    "entrevista": {"soporte", "redes", "datos", "prog"},
    "ad": {"mesa"},
    "atencion": {"enfadado", "no-tecnica", "fuera", "telefono"},
    "pc": {"oficina", "diseno"},
    "hw": {"averias"},
    "orden": {"instalar-windows"},
    "vocab": {"basico"},
    "lectura": {"errores", "docs"},
    "frases": {"tickets", "llamadas", "entrevista"},
    "pass": {"fuerza", "hash"},
    "cripto": {"retos"},
    "logs": {"ssh", "web"},
    "fw": {"oficina", "dmz"},
    "ir": {"ransomware", "cuenta"},
    "paso": {"variables", "bucle", "funciones", "listas", "pila", "busqueda"},
    "inicio": {"atajos", "archivos", "partes", "unidades", "orientacion"},
    "er": {"tienda", "escuela"},
    "fn": {"formas"},
    "conc": {"sucia", "bloqueo", "perdida", "deadlock"},
    "cap": {"dhcp", "web", "ping"},
    "git": {"primeros", "ramas", "conflicto", "remoto"},
    "linux": {"archivos", "permisos", "logs", "servicio", "disco"},
    "win": {"apipa", "dns", "impresora", "lento", "unidad-red"},
    "sql": {"select", "join", "agregacion", "funciones", "subconsultas", "modificar", "ddl", "ventanas", "inventario", "detective", "analisis"},
    "code": {"python-basico", "python-condicionales", "python-bucles", "python-colecciones", "python-redes", "python-poo",
             "js-basico", "js-arrays", "js-avanzado", "python-libre", "js-libre",
             "python-errores", "js-errores", "python-automatizacion"},
}
CALLOUTS = {"nota", "examen", "cuidado", "practica", "comando", "reto", "solucion", "externo"}
AREAS = ("base", "redes", "bd", "prog", "ti", "en", "sec")
LESSON_RE = re.compile(r"^===\s*([a-z0-9-]+)\s*\|\s*(.+?)\s*\|\s*(\d+)\s*\|\s*([1234])\s*$")
INLINE_RE = re.compile(r"(\*\*.+?\*\*|`[^`]+`|\[[^\]]+\]\((?:https://|\./|#)[^)\s]+\)|(?<![\w*])\*[^*\s][^*]*?\*(?!\w))")


class ContentError(Exception):
    pass


def inline(text: str) -> list:
    """Convierte texto con **negrita**, *cursiva*, `código` y [enlaces](https://...) en segmentos."""
    out, pos = [], 0
    for m in INLINE_RE.finditer(text):
        if m.start() > pos:
            out.append({"t": "text", "v": text[pos:m.start()]})
        tok = m.group(0)
        if tok.startswith("**"):
            out.append({"t": "b", "v": tok[2:-2]})
        elif tok.startswith("`"):
            out.append({"t": "code", "v": tok[1:-1]})
        elif tok.startswith("["):
            label, href = re.match(r"\[([^\]]+)\]\(([^)]+)\)", tok).groups()
            out.append({"t": "link", "v": label, "href": href})
        else:
            out.append({"t": "i", "v": tok[1:-1]})
        pos = m.end()
    if pos < len(text):
        out.append({"t": "text", "v": text[pos:]})
    return out


def plain(segments: list) -> str:
    return "".join(s["v"] for s in segments)


def parse_quiz(lines: list[str], where: str) -> list:
    questions, cur = [], None
    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        if line.startswith("? "):
            cur = {"q": line[2:].strip(), "options": [], "correct": [], "explain": ""}
            questions.append(cur)
        elif cur is None:
            raise ContentError(f"{where}: el cuestionario debe empezar con '? pregunta'")
        elif line.startswith(("- ", "+ ")):
            if line[0] == "+":
                cur["correct"].append(len(cur["options"]))
            cur["options"].append(line[2:].strip())
        elif line.startswith("= "):
            cur["explain"] = (cur["explain"] + " " + line[2:].strip()).strip()
        else:
            raise ContentError(f"{where}: línea de cuestionario no reconocida: {line!r}")
    for q in questions:
        if len(q["options"]) < 2 or not q["correct"]:
            raise ContentError(f"{where}: la pregunta {q['q']!r} necesita al menos 2 opciones y una correcta")
        if not q["explain"]:
            raise ContentError(f"{where}: la pregunta {q['q']!r} no tiene explicación (= ...)")
    return questions


def parse_blocks(lines: list[str], where: str) -> tuple[list, list]:
    blocks, quiz = [], []
    i, para = 0, []

    def flush_para():
        if para:
            blocks.append({"t": "p", "c": inline(" ".join(s.strip() for s in para))})
            para.clear()

    while i < len(lines):
        line = lines[i]
        s = line.strip()
        if not s:
            flush_para(); i += 1; continue
        if s.startswith("```"):
            flush_para()
            lang = s[3:].strip() or "texto"
            j = i + 1
            code = []
            while j < len(lines) and not lines[j].strip().startswith("```"):
                code.append(lines[j].rstrip("\n"))
                j += 1
            if j >= len(lines):
                raise ContentError(f"{where}: bloque de código sin cerrar")
            blocks.append({"t": "code", "lang": lang, "v": "\n".join(code)})
            i = j + 1; continue
        if s.startswith(":::"):
            flush_para()
            kind = s[3:].strip()
            j = i + 1
            inner = []
            depth = 0
            while j < len(lines):
                t = lines[j].strip()
                if t.startswith(":::") and t != ":::":
                    depth += 1
                elif t == ":::":
                    if depth == 0:
                        break
                    depth -= 1
                inner.append(lines[j])
                j += 1
            if j >= len(lines):
                raise ContentError(f"{where}: bloque ::: {kind} sin cerrar")
            if kind == "quiz":
                quiz.extend(parse_quiz(inner, where))
            elif kind == "banco":
                # Preguntas que no se muestran en la lección: solo salen en los exámenes de escalón y en el repaso.
                quiz.extend({**q, "banco": True} for q in parse_quiz(inner, where))
            elif kind in CALLOUTS:
                sub, subquiz = parse_blocks(inner, where)
                if subquiz:
                    raise ContentError(f"{where}: no puede haber cuestionario dentro de un aviso")
                blocks.append({"t": "callout", "kind": kind, "c": sub})
            else:
                raise ContentError(f"{where}: tipo de bloque desconocido ::: {kind}")
            i = j + 1; continue
        m = re.fullmatch(r"\[\[(\w+):([\w-]+)\]\]", s)
        if m:
            flush_para()
            kind, ident = m.groups()
            if ident not in KNOWN.get(kind, set()):
                raise ContentError(f"{where}: elemento interactivo desconocido [[{kind}:{ident}]]")
            blocks.append({"t": "embed", "kind": kind, "id": ident})
            i += 1; continue
        hm = re.match(r"^(#{2,4})\s+(.*)$", s)
        if hm:
            flush_para()
            blocks.append({"t": "h", "level": len(hm.group(1)), "c": inline(hm.group(2))})
            i += 1; continue
        if re.match(r"^([-*]|\d+\.)\s+", s):
            flush_para()
            ordered = bool(re.match(r"^\d+\.", s))
            items = []
            while i < len(lines) and re.match(r"^\s*([-*]|\d+\.)\s+", lines[i]):
                item = re.sub(r"^\s*([-*]|\d+\.)\s+", "", lines[i]).strip()
                i += 1
                while i < len(lines) and lines[i].startswith("  ") and lines[i].strip() and not re.match(r"^\s*([-*]|\d+\.)\s+", lines[i]):
                    item += " " + lines[i].strip(); i += 1
                items.append(inline(item))
            blocks.append({"t": "ol" if ordered else "ul", "items": items})
            continue
        if s.startswith("|"):
            flush_para()
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                # Celdas separadas por | ; un \| dentro de una celda es una barra literal (por ejemplo el operador ||).
                fila = lines[i].strip()
                fila = fila[1:] if fila.startswith("|") else fila
                fila = fila[:-1] if fila.endswith("|") and not fila.endswith("\\|") else fila
                cells = [c.strip().replace("\\|", "|") for c in re.split(r"(?<!\\)\|", fila)]
                if not all(re.fullmatch(r":?-{2,}:?", c) for c in cells):
                    rows.append([inline(c) for c in cells])
                i += 1
            if len(rows) < 2:
                raise ContentError(f"{where}: una tabla necesita cabecera y al menos una fila")
            width = len(rows[0])
            if any(len(r) != width for r in rows):
                raise ContentError(f"{where}: filas de tabla con distinto número de columnas")
            blocks.append({"t": "table", "head": rows[0], "rows": rows[1:]})
            continue
        para.append(line)
        i += 1
    flush_para()
    return blocks, quiz


def block_text(blocks: list) -> str:
    parts = []
    for b in blocks:
        t = b["t"]
        if t in ("p", "h"):
            parts.append(plain(b["c"]))
        elif t in ("ul", "ol"):
            parts.extend(plain(it) for it in b["items"])
        elif t == "code":
            parts.append(b["v"])
        elif t == "callout":
            parts.append(block_text(b["c"]))
        elif t == "table":
            parts.extend(" | ".join(plain(c) for c in row) for row in [b["head"], *b["rows"]])
    return "\n".join(parts)


def parse_module(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        raise ContentError(f"{path.name}: falta la cabecera --- ... ---")
    meta = {}
    for line in m.group(1).splitlines():
        k, _, v = line.partition(":")
        meta[k.strip()] = v.strip()
    for key in ("id", "titulo", "descripcion", "area"):
        if not meta.get(key):
            raise ContentError(f"{path.name}: falta '{key}' en la cabecera")
    body = text[m.end():].splitlines()
    lessons, cur, buf = [], None, []

    def close():
        if cur is None:
            return
        where = f"{path.name} › {cur['id']}"
        blocks, quiz = parse_blocks(buf, where)
        if not blocks:
            raise ContentError(f"{where}: lección vacía")
        cur["blocks"] = blocks
        cur["quiz"] = [q for q in quiz if not q.get("banco")]
        cur["banco"] = [{k: v for k, v in q.items() if k != "banco"} for q in quiz if q.get("banco")]
        cur["texto"] = block_text(blocks)
        lessons.append(cur)

    for line in body:
        lm = LESSON_RE.match(line.strip())
        if lm:
            close()
            lid, title, minutes, level = lm.groups()
            if not lid.startswith(meta["id"] + "-"):
                raise ContentError(f"{path.name}: la lección {lid} debe empezar por '{meta['id']}-'")
            cur, buf = {"id": lid, "titulo": title, "minutos": int(minutes), "nivel": int(level)}, []
        elif line.startswith("=== "):
            raise ContentError(f"{path.name}: cabecera de lección mal formada (=== id | título | minutos | nivel 1-4): {line!r}")
        elif cur is None:
            if line.strip():
                raise ContentError(f"{path.name}: texto antes de la primera lección: {line!r}")
        else:
            buf.append(line)
    close()
    if not lessons:
        raise ContentError(f"{path.name}: el módulo no tiene lecciones")
    return {
        "id": meta["id"], "titulo": meta["titulo"], "descripcion": meta["descripcion"],
        "dominio": meta.get("dominio", ""), "peso": int(meta.get("peso", 0) or 0), "area": meta["area"],
        "lecciones": lessons,
    }


def build() -> dict[str, str]:
    modules = [parse_module(p) for p in sorted(SRC.glob("*.md")) if not p.name.startswith("_") and p.name != "glosario.md"]
    ids = [l["id"] for m in modules for l in m["lecciones"]]
    dup = {i for i in ids if ids.count(i) > 1}
    if dup:
        raise ContentError(f"Identificadores de lección repetidos: {sorted(dup)}")
    if len({m['id'] for m in modules}) != len(modules):
        raise ContentError("Identificadores de módulo repetidos")

    curso = {"modulos": []}
    buscar, examen = [], []
    vistos = {}
    for m in modules:
        if m["area"] not in AREAS:
            raise ContentError(f"Módulo {m['id']}: área desconocida {m['area']!r} (usa {', '.join(AREAS)})")
        mod = {k: m[k] for k in ("id", "titulo", "descripcion", "dominio", "peso", "area")}
        mod["lecciones"] = []
        for l in m["lecciones"]:
            buscar.append({"id": l["id"], "modulo": m["id"], "titulo": l["titulo"], "texto": l["texto"]})
            propias = 0
            for n, q in enumerate(l["quiz"] + l["banco"]):
                entrada = {"id": f"{l['id']}#{n}", "modulo": m["id"], "area": m["area"], "dominio": m["dominio"], **q}
                # Una pregunta con el mismo enunciado que otra anterior se marca como duplicada: sirve para el repaso,
                # pero no cuenta en los exámenes (si no, «otro» intento podría repetir la misma pregunta).
                clave = re.sub(r"\s+", " ", q["q"].strip().lower())
                if clave in vistos:
                    entrada["dup"] = vistos[clave]
                else:
                    vistos[clave] = entrada["id"]
                    propias += 1
                examen.append(entrada)
            mod["lecciones"].append({**{k: l[k] for k in ("id", "titulo", "minutos", "nivel", "blocks", "quiz")}, "preguntas": propias})
        curso["modulos"].append(mod)
    dump = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":")) + "\n"
    faltan = GRATIS - {m["id"] for m in curso["modulos"]}
    if faltan:
        raise ContentError(f"GRATIS menciona módulos que no existen: {sorted(faltan)}")

    # Versión pública: los módulos de pago sin texto ni preguntas.
    gratis = lambda mod_id: mod_id in GRATIS
    publico = {"modulos": []}
    premium = {"lecciones": [], "preguntas": []}
    for mod in curso["modulos"]:
        if gratis(mod["id"]):
            publico["modulos"].append(mod)
            continue
        lecciones = []
        for l in mod["lecciones"]:
            premium["lecciones"].append({"id": l["id"], "area": mod["area"], "modulo": mod["id"], "blocks": l["blocks"], "quiz": l["quiz"]})
            # Se conservan solo los elementos interactivos (sin texto): sirven para saber en qué lección está cada laboratorio.
            embeds = [b for b in l["blocks"] if b.get("t") == "embed"]
            lecciones.append({**{k: l[k] for k in ("id", "titulo", "minutos", "nivel")}, "blocks": embeds, "quiz": [], "preguntas": l["preguntas"], "premium": True})
        publico["modulos"].append({**mod, "lecciones": lecciones})
    premium["preguntas"] = [q for q in examen if not gratis(q["modulo"])]
    # Unas pocas preguntas de muestra por lección de pago (las primeras con opciones y no repetidas) se publican para que
    # el examen de entrada, que es gratis, pueda medir el nivel en todo el temario: 2 por lección, o 3 en los módulos de
    # 6 lecciones o menos, para que cada bloque del examen de entrada tenga sus 6 preguntas.
    lecciones_mod = {m["id"]: len(m["lecciones"]) for m in curso["modulos"]}
    muestra, por_leccion = set(), {}
    for q in premium["preguntas"]:
        leccion = q["id"].split("#")[0]
        tope = 3 if lecciones_mod[q["modulo"]] <= 6 else 2
        if por_leccion.get(leccion, 0) < tope and not q.get("dup") and len(q.get("options", [])) >= 2:
            muestra.add(q["id"]); por_leccion[leccion] = por_leccion.get(leccion, 0) + 1
    examen_publico = [q if gratis(q["modulo"]) else {**q, "muestra": True} for q in examen if gratis(q["modulo"]) or q["id"] in muestra]
    titulo_mod = {m["id"]: m["titulo"] for m in curso["modulos"]}
    buscar_publico = [b if gratis(b["modulo"]) else {**b, "texto": titulo_mod[b["modulo"]], "premium": True} for b in buscar]

    publicos = {"curso.json": dump(publico), "buscar.json": dump(buscar_publico), "examen.json": dump(examen_publico), "glosario.json": dump(glosario())}
    privados = {"curso.json": dump(curso), "buscar.json": dump(buscar), "examen.json": dump(examen), "premium.json": dump(premium),
                "premium.sql": premium_sql(premium)}
    return publicos, privados


def premium_sql(premium: dict) -> str:
    """SQL que deja lecciones_premium y preguntas_premium exactamente iguales al temario (añade, cambia y borra)."""
    marca = "$contenido_loopback$"
    datos = json.dumps(premium, ensure_ascii=False, separators=(",", ":"))
    if marca in datos:
        raise ContentError("El temario contiene la marca reservada " + marca)
    return f"""-- Generado por scripts/build_curso.py: contenido de pago de Loopback. PRIVADO: no subir al repositorio.
-- Lo aplica la integración continua (scripts/subir-premium.sh). Se puede repetir: solo cambia lo que haya cambiado.
begin;
create temporary table premium_nuevo (d jsonb) on commit drop;
insert into premium_nuevo values ({marca}{datos}{marca}::jsonb);
insert into public.lecciones_premium (id, area, modulo, blocks, quiz)
  select e->>'id', e->>'area', e->>'modulo', e->'blocks', e->'quiz' from premium_nuevo, jsonb_array_elements(d->'lecciones') e
  on conflict (id) do update set area = excluded.area, modulo = excluded.modulo, blocks = excluded.blocks, quiz = excluded.quiz, actualizado = now()
  where (lecciones_premium.area, lecciones_premium.modulo, lecciones_premium.blocks, lecciones_premium.quiz)
        is distinct from (excluded.area, excluded.modulo, excluded.blocks, excluded.quiz);
delete from public.lecciones_premium where id not in (select e->>'id' from premium_nuevo, jsonb_array_elements(d->'lecciones') e);
insert into public.preguntas_premium (id, area, modulo, datos)
  select e->>'id', e->>'area', e->>'modulo', e from premium_nuevo, jsonb_array_elements(d->'preguntas') e
  on conflict (id) do update set area = excluded.area, modulo = excluded.modulo, datos = excluded.datos
  where (preguntas_premium.area, preguntas_premium.modulo, preguntas_premium.datos) is distinct from (excluded.area, excluded.modulo, excluded.datos);
delete from public.preguntas_premium where id not in (select e->>'id' from premium_nuevo, jsonb_array_elements(d->'preguntas') e);
commit;
select (select count(*) from public.lecciones_premium) as lecciones_de_pago, (select count(*) from public.preguntas_premium) as preguntas_de_pago;
"""


def glosario() -> list:
    """Lee contenido/glosario.md: una fila de tabla por término (término | otras formas | área | definición)."""
    terminos, vistos = [], set()
    for n, linea in enumerate((SRC / "glosario.md").read_text(encoding="utf-8").splitlines(), 1):
        if not linea.startswith("| ") or linea.startswith("| Término") or linea.startswith("|---"):
            continue
        celdas = [c.strip() for c in linea.strip().strip("|").split("|")]
        if len(celdas) != 4 or not celdas[0] or not celdas[3]:
            raise ContentError(f"glosario.md, línea {n}: se esperan 4 columnas (término | otras formas | área | definición)")
        termino, otras, area, definicion = celdas
        if area not in AREAS:
            raise ContentError(f"glosario.md, línea {n}: área desconocida {area!r}")
        formas = [termino] + [x.strip() for x in otras.split(",") if x.strip()]
        for f in formas:
            if f.lower() in vistos:
                raise ContentError(f"glosario.md, línea {n}: «{f}» ya está en otro término")
            vistos.add(f.lower())
        terminos.append({"t": termino, "formas": formas, "area": area, "d": definicion})
    return sorted(terminos, key=lambda x: x["t"].lower())


def main() -> int:
    check = "--check" in sys.argv
    try:
        files, privados = build()
    except ContentError as e:
        print(f"Error en el temario: {e}", file=sys.stderr)
        return 1
    stale = []
    # _privado/ se escribe siempre (también con --check): las pruebas leen de ahí el temario completo.
    PRIV.mkdir(exist_ok=True)
    for name, content in privados.items():
        (PRIV / name).write_text(content, encoding="utf-8")
    OUT.mkdir(exist_ok=True)
    for name, content in files.items():
        target = OUT / name
        if check:
            if not target.exists() or target.read_text(encoding="utf-8") != content:
                stale.append(name)
        else:
            target.write_text(content, encoding="utf-8")
    curso = json.loads(privados["curso.json"])
    n_lessons = sum(len(m["lecciones"]) for m in curso["modulos"])
    n_q = len(json.loads(privados["examen.json"]))
    n_pago = len(json.loads(privados["premium.json"])["lecciones"])
    if stale:
        print("data/ no está al día (ejecuta python3 scripts/build_curso.py): " + ", ".join(stale), file=sys.stderr)
        return 1
    n_g = len(json.loads(files["glosario.json"]))
    print(f"Temario {'al día' if check else 'compilado'}: {len(curso['modulos'])} módulos, {n_lessons} lecciones ({n_lessons - n_pago} gratis), {n_q} preguntas, {n_g} términos del glosario.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
