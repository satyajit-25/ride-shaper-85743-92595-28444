-- Fix search_id and car_id nullable columns and add foreign key constraints
-- Step 1: Drop existing constraints if they exist
ALTER TABLE public.recommendations 
  DROP CONSTRAINT IF EXISTS recommendations_search_id_fkey,
  DROP CONSTRAINT IF EXISTS recommendations_car_id_fkey;

-- Step 2: Make search_id and car_id NOT NULL
ALTER TABLE public.recommendations 
  ALTER COLUMN search_id SET NOT NULL,
  ALTER COLUMN car_id SET NOT NULL;

-- Step 3: Add foreign key constraints with CASCADE delete
ALTER TABLE public.recommendations 
  ADD CONSTRAINT recommendations_search_id_fkey 
  FOREIGN KEY (search_id) 
  REFERENCES searches(id) 
  ON DELETE CASCADE;

ALTER TABLE public.recommendations 
  ADD CONSTRAINT recommendations_car_id_fkey 
  FOREIGN KEY (car_id) 
  REFERENCES cars(id) 
  ON DELETE CASCADE;

-- Step 4: Add indices on foreign key columns for better query performance
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON public.recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_search_id ON public.recommendations(search_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_car_id ON public.recommendations(car_id);
CREATE INDEX IF NOT EXISTS idx_searches_user_id ON public.searches(user_id);