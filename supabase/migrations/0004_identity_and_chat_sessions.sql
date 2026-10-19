-- Production identity boundary and durable, server-owned chat sessions.
--
-- IMPORTANT: this migration intentionally leaves owner_id nullable while legacy
-- rows are backfilled. The API only returns rows matching the authenticated user,
-- so legacy rows become inaccessible until an explicit owner is assigned.

alter table public.folders add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.classes add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.notes add column if not exists owner_id uuid references auth.users(id) on delete cascade;

create index if not exists folders_owner_id_idx on public.folders (owner_id);
create index if not exists classes_owner_id_idx on public.classes (owner_id);
create index if not exists notes_owner_id_idx on public.notes (owner_id);

create table if not exists public.chat_sessions (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  class_id    bigint not null references public.classes(id) on delete cascade,
  kind        text not null check (kind in ('general', 'study_plan')),
  title       text,
  study_plan  jsonb,
  status      text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  archived_at timestamptz,
  check ((kind = 'study_plan' and study_plan is not null) or kind = 'general')
);

create table if not exists public.chat_messages (
  id                    bigint generated always as identity primary key,
  session_id            uuid not null references public.chat_sessions(id) on delete cascade,
  owner_id              uuid not null references auth.users(id) on delete cascade,
  client_message_id     uuid,
  reply_to_message_id   bigint references public.chat_messages(id) on delete cascade,
  role                  text not null check (role in ('user', 'assistant')),
  content               text not null check (char_length(content) between 1 and 4000),
  selected_note_id      bigint references public.notes(id) on delete set null,
  status                text not null default 'complete' check (status in ('pending', 'complete', 'failed')),
  model                 text,
  prompt_version        text,
  latency_ms            integer check (latency_ms is null or latency_ms >= 0),
  input_tokens          integer check (input_tokens is null or input_tokens >= 0),
  output_tokens         integer check (output_tokens is null or output_tokens >= 0),
  created_at            timestamptz not null default now(),
  check ((role = 'user' and client_message_id is not null) or role = 'assistant')
);

create unique index if not exists chat_messages_client_id_idx
  on public.chat_messages (session_id, client_message_id)
  where client_message_id is not null;
create unique index if not exists chat_messages_reply_idx
  on public.chat_messages (reply_to_message_id)
  where reply_to_message_id is not null;
create index if not exists chat_sessions_owner_class_idx
  on public.chat_sessions (owner_id, class_id, updated_at desc);
create index if not exists chat_messages_session_idx
  on public.chat_messages (session_id, id desc);

alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

create policy "owners manage folders" on public.folders
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners manage classes" on public.classes
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners manage notes" on public.notes
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners manage chat sessions" on public.chat_sessions
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners manage chat messages" on public.chat_messages
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- After explicitly backfilling legacy data, enforce these invariants manually:
-- alter table public.folders alter column owner_id set not null;
-- alter table public.classes alter column owner_id set not null;
-- alter table public.notes alter column owner_id set not null;
