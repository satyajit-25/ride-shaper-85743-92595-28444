-- Create comparison_history table to track past comparisons
CREATE TABLE public.comparison_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  comparison_name TEXT,
  car_ids TEXT[] NOT NULL,
  financing_params JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.comparison_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own comparison history" 
ON public.comparison_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own comparison history" 
ON public.comparison_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comparison history" 
ON public.comparison_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_comparison_history_user_id ON public.comparison_history(user_id);
CREATE INDEX idx_comparison_history_created_at ON public.comparison_history(created_at DESC);