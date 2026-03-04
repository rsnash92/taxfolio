-- Create storage bucket for practice assets (logos, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('practice-assets', 'practice-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow practice owners to upload files
CREATE POLICY "Practice owners can upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'practice-assets'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM public.practices p
      JOIN public.practice_members pm ON pm.practice_id = p.id
      WHERE pm.user_id = auth.uid() AND pm.role = 'owner'
    )
  );

-- Public read access for logos
CREATE POLICY "Public read practice assets"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'practice-assets');

-- Allow practice owners to delete/replace their files
CREATE POLICY "Practice owners can delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'practice-assets'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM public.practices p
      JOIN public.practice_members pm ON pm.practice_id = p.id
      WHERE pm.user_id = auth.uid() AND pm.role = 'owner'
    )
  );

-- Allow practice owners to update (upsert) their files
CREATE POLICY "Practice owners can update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'practice-assets'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM public.practices p
      JOIN public.practice_members pm ON pm.practice_id = p.id
      WHERE pm.user_id = auth.uid() AND pm.role = 'owner'
    )
  );
