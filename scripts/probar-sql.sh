#!/usr/bin/env bash
# Prueba las migraciones de Supabase en un PostgreSQL local: crea una base de datos temporal, simula Supabase, aplica las
# migraciones dos veces (deben poder repetirse) y ejecuta las pruebas de seguridad de supabase/pruebas/.
# Uso: PGHOST=localhost PGPORT=5432 PGUSER=postgres scripts/probar-sql.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DB="loopback_prueba_$$"
psql -q -d postgres -c "create database $DB" >/dev/null
trap 'psql -q -d postgres -c "drop database if exists $DB" >/dev/null' EXIT
# psql para en el primer error (ON_ERROR_STOP) y pipefail hace que ese error pare el script; grep solo quita el ruido.
run() { psql -q -t -v ON_ERROR_STOP=1 -d "$DB" -f "$1" 2>&1 | { grep -v -E 'NOTICE|^ *$' || true; }; }
run supabase/pruebas/simular-supabase.sql
for m in supabase/migrations/*.sql; do run "$m"; run "$m"; done
for p in supabase/pruebas/*.sql; do [ "$(basename "$p")" = simular-supabase.sql ] || run "$p"; done
