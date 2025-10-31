-- Fix nullable user_id columns security issue
-- Step 1: Delete orphaned records with NULL user_id (these are inaccessible due to RLS)
DELETE FROM public.recommendations WHERE user_id IS NULL;
DELETE FROM public.searches WHERE user_id IS NULL;

-- Step 2: Drop existing constraints if they exist (using IF EXISTS)
ALTER TABLE public.searches 
  DROP CONSTRAINT IF EXISTS searches_user_id_fkey;

ALTER TABLE public.recommendations 
  DROP CONSTRAINT IF EXISTS recommendations_user_id_fkey;

-- Step 3: Make user_id columns NOT NULL
ALTER TABLE public.searches 
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.recommendations 
  ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Add foreign key constraints with CASCADE delete
ALTER TABLE public.searches 
  ADD CONSTRAINT searches_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE public.recommendations 
  ADD CONSTRAINT recommendations_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;