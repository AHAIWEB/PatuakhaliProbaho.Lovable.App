-- Allow authenticated users to upload to photocards folder in site-assets
CREATE POLICY "Authenticated can upload photocards"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'site-assets'
  AND (storage.foldername(name))[1] = 'photocards'
);