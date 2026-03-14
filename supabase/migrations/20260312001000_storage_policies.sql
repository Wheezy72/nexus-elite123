-- Storage policies for encrypted blobs
-- Buckets:
--  - nexus-profile (encrypted profile photos)
--  - nexus-backups (encrypted backup blobs)

-- NOTE: Buckets must be created in the Supabase dashboard (Storage → Buckets).
-- NOTE: RLS is already enabled on storage.objects in hosted Supabase.

-- nexus-profile
DROP POLICY IF EXISTS "Users manage own encrypted profile photos" ON storage.objects;
CREATE POLICY "Users manage own encrypted profile photos"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'nexus-profile'
  AND owner_id = auth.uid()
)
WITH CHECK (
  bucket_id = 'nexus-profile'
  AND owner_id = auth.uid()
);

-- nexus-backups
DROP POLICY IF EXISTS "Users manage own encrypted backups" ON storage.objects;
CREATE POLICY "Users manage own encrypted backups"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'nexus-backups'
  AND owner_id = auth.uid()
)
WITH CHECK (
  bucket_id = 'nexus-backups'
  AND owner_id = auth.uid()
);
