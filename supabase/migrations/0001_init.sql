-- 0001_init.sql — initial schema for note_project
-- Tables: classes, notes.  Storage: note-images bucket (public read).
-- RLS is enabled as a safe default. The server uses the service_role key,
-- which bypasses RLS, so all app access continues to work. Anon/authenticated
-- clients get no direct table access until real auth + per-user policies land.

-- ── classes ─────────────────────────────────────────────────────────────────
create table if not exists public.classes (
  id          bigint generated always as identity primary key,
  name        text        not null,
  created_at  timestamptz not null default now()
);

-- ── notes ───────────────────────────────────────────────────────────────────
create table if not exists public.notes (
  id             bigint generated always as identity primary key,
  class_id       bigint      not null references public.classes(id) on delete cascade,
  image_url      text        not null,
  file_type      text,
  filename       text,
  extracted_text text,
  created_at     timestamptz not null default now()
);

-- Foreign-key lookup index (notes are queried by class_id constantly).
create index if not exists notes_class_id_idx on public.notes (class_id);

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Deny-by-default. No policies => no access for anon/authenticated roles.
-- service_role (used by the Express server) bypasses RLS entirely.
alter table public.classes enable row level security;
alter table public.notes   enable row level security;
