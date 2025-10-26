-- Enable DELETE for searches table
CREATE POLICY "Anyone can delete searches"
ON public.searches
FOR DELETE
USING (true);