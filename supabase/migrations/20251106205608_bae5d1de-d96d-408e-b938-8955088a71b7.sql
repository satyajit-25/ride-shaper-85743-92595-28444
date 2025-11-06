-- Add RLS policy to allow public read access to comparison_history by ID
-- This allows anyone with the link to view a shared comparison

CREATE POLICY "Public can view comparisons by ID" 
ON public.comparison_history 
FOR SELECT 
USING (true);