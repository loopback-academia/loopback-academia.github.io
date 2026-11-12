-- Imitación mínima de Supabase para probar las migraciones en un PostgreSQL local (nunca se usa en producción):
-- roles anon/authenticated/service_role, esquema auth con users y mfa_factors, y auth.uid()/auth.jwt() leídos de
-- request.jwt.claims, como hace PostgREST.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
end $$;
create schema auth;
create table auth.users (id uuid primary key, email text);
create table auth.mfa_factors (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade, status text);
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt()->>'sub', '')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
insert into auth.users values
  ('11111111-1111-1111-1111-111111111111', 'profe@example.com'), ('22222222-2222-2222-2222-222222222222', 'ana@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'luis@example.com'), ('44444444-4444-4444-4444-444444444444', 'intruso@example.com');
