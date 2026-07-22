-- 0002_folders.sql — folders group classes, one level deep, no nesting.
-- A class belongs to at most one folder; deleting a folder just unassigns its classes.

create table if not exists public.folders (
  id          bigint generated always as identity primary key,
  name        text        not null,
  icon        text,
  created_at  timestamptz not null default now()
);

alter table public.classes
  add column if not exists folder_id bigint references public.folders(id) on delete set null;

create index if not exists classes_folder_id_idx on public.classes (folder_id);

alter table public.folders enable row level security;
