-- Make the source bucket private. Reads now go through ownership-checked,
-- short-lived signed URLs issued by the API (GET /api/notes/:id/file); the
-- API also signs URLs it hands to OpenAI. Writes remain server-only via
-- service_role, which bypasses Storage policies.
--
-- Apply ONLY after the API build that signs URLs is deployed: once this runs,
-- any client or server code that reads a raw public URL gets a 400/404.
-- Existing rows store legacy public URLs; the API resolves those to object
-- paths, so no data backfill is required.
update storage.buckets
set public = false
where id = 'note-images';
