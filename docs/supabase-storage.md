# Supabase file storage

Property photos and videos use the private `property-media` bucket (25 MiB per file). Identity, ownership, and verification evidence use the private `verification-files` bucket (10 MiB per file). Both buckets accept only the image, video, and document MIME types configured in the storage migration.

The application checks the active RESA session and the property or account relationship before reading a file. It serves media through a five-minute signed URL and serves verification files through the authenticated document route. Browser clients have no direct Storage object policies.

Uploads require `SUPABASE_SECRET_KEY` (or the legacy `SUPABASE_SERVICE_ROLE_KEY`) in the server environment. Keep it out of `NEXT_PUBLIC_*` variables and browser code. The project URL alone is not enough for this app's current custom session system. Add the key to local server configuration and the deployed server's environment settings before enabling uploads.

Signup supports seeker, owner, and agent accounts. Admin accounts remain provisioned through staff management and are not available through public signup.
