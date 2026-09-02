-- Create the storage bucket used by uploaded sources and in-app notes.
-- Files are read through public URLs; writes remain server-only via service_role.
insert into storage.buckets (id, name, public)
values ('note-images', 'note-images', true)
on conflict (id) do update
set public = excluded.public;
