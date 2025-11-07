-- Fix PUBLIC_DATA_EXPOSURE vulnerability in comparison_history table

-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can view comparisons by ID" ON public.comparison_history;

-- Add is_public column to control which comparisons are publicly accessible
ALTER TABLE public.comparison_history 
ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Create a properly restricted policy that only allows viewing explicitly shared comparisons
CREATE POLICY "Public can view shared comparisons" 
ON public.comparison_history 
FOR SELECT 
USING (is_public = true);

-- Keep the existing user-owned policy for authenticated users to view their own comparisons
-- (This policy already exists, no changes needed)