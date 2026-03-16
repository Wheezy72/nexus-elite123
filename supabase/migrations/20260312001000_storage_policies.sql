-- Storage policies for encrypted blobs
-- Buckets:
--  - future-profile (encrypted profile photos)
--  - future-backups (encrypted backup blobs)

-- NOTE: Buckets must be created in the Supabase dashboard (Storage → Buckets).
-- NOTE: RLS is already enabled on storage.objects in hosted Supabase.

-- future-profile
DROP POLICY IF EXISTS "Users manage own encrypted profile photos" ON storage.objects;
CREATE POLICY "Users manage own encrypted profile photos"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'future-profile'
  AND (
    owner::text = auth.uid()::text
    OR owner_id = auth.uid()::text
  )
)
WITH CHECK (
  bucket_id = 'future-profile'
  AND (
    owner::text = auth.uid()::text
    OR owner_id = auth.uid()::text
  )
);

-- future-backups
DROP POLICY IF EXISTS "Users manage own encrypted backups" ON storage.objects;
CREATE POLICY "Users manage own encrypted backups"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'future-backups'
  AND (
    owner::text = auth.uid()::text
    OR owner_id = auth.uid()::text
  )
)
WITH CHECK (
  bucket_id = 'future-backups'
  AND (
    owner::text = auth.uid()::text
    OR owner_id = auth.uid()::text
  )
);
