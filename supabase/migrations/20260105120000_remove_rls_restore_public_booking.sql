-- Remove all RLS policies and disable RLS to restore original public booking functionality
-- This reverts the database to the state before admin panel was added

-- Drop all existing RLS policies on appointments table
DROP POLICY IF EXISTS "Allow public insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow authenticated users to view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow authenticated users to update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow authenticated users to delete appointments" ON public.appointments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.appointments;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.appointments;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.appointments;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.appointments;

-- Disable RLS on appointments table (restore to original state)
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;

-- Drop all storage policies
DROP POLICY IF EXISTS "Allow public uploads to medical-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read medical-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read medical-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload medical documents" ON storage.objects;

-- Make medical-documents bucket public for uploads and reads
UPDATE storage.buckets
SET public = true
WHERE id = 'medical-documents';

-- Create simple public policy for medical documents storage
CREATE POLICY "Public access to medical-documents"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'medical-documents')
WITH CHECK (bucket_id = 'medical-documents');

-- Comment: This migration restores the appointments table to allow public bookings
-- without any authentication requirements, just like before the admin panel was added.