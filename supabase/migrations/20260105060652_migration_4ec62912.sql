ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS consultation_mode text,
ADD COLUMN IF NOT EXISTS suggestions text;