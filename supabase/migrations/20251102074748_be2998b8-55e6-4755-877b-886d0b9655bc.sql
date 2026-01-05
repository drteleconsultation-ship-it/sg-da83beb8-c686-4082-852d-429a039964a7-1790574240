-- Create storage bucket for medical documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-documents',
  'medical-documents',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for medical documents
CREATE POLICY "Anyone can upload medical documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'medical-documents');

CREATE POLICY "Admins can view medical documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'medical-documents' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete medical documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'medical-documents' AND is_admin(auth.uid()));

-- Add attachment_urls column to appointments table (ARRAY, not single text)
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS attachment_urls text[];