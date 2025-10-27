-- Add user_id column to searches table
ALTER TABLE public.searches 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing searches to have a null user_id (will be handled by app logic)
-- New searches will require authentication

-- Drop the old public policies
DROP POLICY IF EXISTS "Searches are viewable by everyone" ON public.searches;
DROP POLICY IF EXISTS "Anyone can delete searches" ON public.searches;
DROP POLICY IF EXISTS "Anyone can create searches" ON public.searches;

-- Create user-specific policies for searches
CREATE POLICY "Users can view their own searches" 
ON public.searches 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own searches" 
ON public.searches 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own searches" 
ON public.searches 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Update recommendations table to add user_id
ALTER TABLE public.recommendations 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old public policies for recommendations
DROP POLICY IF EXISTS "Recommendations are viewable by everyone" ON public.recommendations;
DROP POLICY IF EXISTS "Anyone can create recommendations" ON public.recommendations;

-- Create user-specific policies for recommendations
CREATE POLICY "Users can view their own recommendations" 
ON public.recommendations 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recommendations" 
ON public.recommendations 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);