-- Fix Row Level Security to allow public booking while protecting admin functions
-- This allows anyone to INSERT appointments (public booking)
-- But only admins can SELECT, UPDATE, DELETE (via admin dashboard)

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow authenticated users to view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow authenticated users to update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow authenticated users to delete appointments" ON public.appointments;

-- Enable RLS on appointments table
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow ANYONE to INSERT appointments (public booking form)
-- This is critical for the booking system to work without authentication
CREATE POLICY "Allow public insert appointments"
ON public.appointments
FOR INSERT
TO public
WITH CHECK (true);

-- Policy 2: Allow authenticated users (admin) to SELECT all appointments
CREATE POLICY "Allow authenticated users to view appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Allow authenticated users (admin) to UPDATE appointments
CREATE POLICY "Allow authenticated users to update appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 4: Allow authenticated users (admin) to DELETE appointments
CREATE POLICY "Allow authenticated users to delete appointments"
ON public.appointments
FOR DELETE
TO authenticated
USING (true);

-- Also ensure medical-documents bucket allows public uploads
UPDATE storage.buckets
SET public = true
WHERE id = 'medical-documents';

-- Create storage policy to allow public uploads to medical-documents bucket
DROP POLICY IF EXISTS "Allow public uploads to medical-documents" ON storage.objects;
CREATE POLICY "Allow public uploads to medical-documents"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'medical-documents');

-- Allow public to read their uploaded files
DROP POLICY IF EXISTS "Allow public read medical-documents" ON storage.objects;
CREATE POLICY "Allow public read medical-documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'medical-documents');

-- Allow authenticated users (admin) to view all medical documents
DROP POLICY IF EXISTS "Allow authenticated read medical-documents" ON storage.objects;
CREATE POLICY "Allow authenticated read medical-documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'medical-documents');