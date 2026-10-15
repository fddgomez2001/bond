-- =====================================================================
-- BOND Phase 1 — private bucket for selfies, IDs and business documents
-- Run after 20261015000000_phase1_profiles.sql (uses public.is_admin()).
--
-- Files are stored as  <user id>/<document type>-<timestamp>.<ext>
-- and uploaded only by the server with the service-role key, after the
-- file type has been checked from its contents. Users can read their own
-- folder (e.g. via short-lived signed URLs); admins can read all of it.
-- Nobody can list, overwrite or delete through the public API.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'private-documents',
  'private-documents',
  false,
  2097152, -- 2 MB, matches MAX_UPLOAD_FILE_BYTES in lib/config/uploads.ts
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read their own private documents" on storage.objects;
create policy "Users can read their own private documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'private-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Admins can read private documents" on storage.objects;
create policy "Admins can read private documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'private-documents'
    and (select public.is_admin())
  );

-- Intentionally no INSERT / UPDATE / DELETE policies for this bucket.
