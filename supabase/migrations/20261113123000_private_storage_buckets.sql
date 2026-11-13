-- Store property photos/videos and verification evidence in private Supabase
-- Storage buckets. App server routes authorize users before issuing short-lived
-- signed links; browser clients receive no direct object access policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('property-media', 'property-media', false, 26214400,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm', 'video/quicktime']),
  ('verification-files', 'verification-files', false, 10485760,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
