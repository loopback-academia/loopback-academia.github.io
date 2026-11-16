#!/usr/bin/env bash
# Sube el contenido de pago (_privado/premium.sql, generado por scripts/build_curso.py) a la base de datos de Supabase.
# Lo ejecuta la integración continua en cada cambio de main. Necesita el secreto SUPABASE_DB_URL: la cadena de conexión
# «Session pooler» de Supabase (Connect → Session pooler), con la contraseña de la base de datos.
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -z "${SUPABASE_DB_URL:-}" ]; then
  # Sin el contenido de pago en Supabase, sus lecciones no se verían: se para la publicación (la web anterior sigue).
  echo "::error::Falta el secreto SUPABASE_DB_URL (Settings → Secrets and variables → Actions). No se publica para no dejar las lecciones de pago sin contenido."
  exit 1
fi
python3 scripts/build_curso.py >/dev/null
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -f _privado/premium.sql
