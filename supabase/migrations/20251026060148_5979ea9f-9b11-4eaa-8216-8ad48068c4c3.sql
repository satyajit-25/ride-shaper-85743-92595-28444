-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create cars table with embeddings
CREATE TABLE IF NOT EXISTS public.cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  type TEXT NOT NULL,
  fuel_type TEXT NOT NULL,
  price_lakhs DECIMAL(10,2) NOT NULL,
  mileage_kmpl DECIMAL(5,2),
  description TEXT,
  features TEXT[],
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create searches table
CREATE TABLE IF NOT EXISTS public.searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_query TEXT NOT NULL,
  fuel_type TEXT,
  price_range TEXT,
  car_type TEXT,
  mileage_preference TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create recommendations table
CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID REFERENCES public.searches(id) ON DELETE CASCADE,
  car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  ai_explanation TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Cars are viewable by everyone" ON public.cars FOR SELECT USING (true);
CREATE POLICY "Anyone can create searches" ON public.searches FOR INSERT WITH CHECK (true);
CREATE POLICY "Searches are viewable by everyone" ON public.searches FOR SELECT USING (true);
CREATE POLICY "Anyone can create recommendations" ON public.recommendations FOR INSERT WITH CHECK (true);
CREATE POLICY "Recommendations are viewable by everyone" ON public.recommendations FOR SELECT USING (true);

-- Sample data
INSERT INTO public.cars (name, brand, type, fuel_type, price_lakhs, mileage_kmpl, description, features) VALUES
('Tata Nexon', 'Tata', 'SUV', 'Diesel', 10.50, 21.5, 'Compact SUV with 5-star safety rating', ARRAY['5-Star Safety', 'Sunroof', 'Connected Car Tech']),
('Maruti Swift', 'Maruti Suzuki', 'Hatchback', 'Petrol', 6.50, 23.2, 'Best-selling hatchback with excellent efficiency', ARRAY['Auto Gear Shift', 'Touchscreen', 'Dual Airbags']),
('Hyundai Creta', 'Hyundai', 'SUV', 'Diesel', 14.00, 18.5, 'Premium mid-size SUV', ARRAY['Panoramic Sunroof', 'Touchscreen', 'Ventilated Seats']),
('Honda City', 'Honda', 'Sedan', 'Petrol', 12.00, 18.4, 'Premium sedan with spacious interiors', ARRAY['Lane Watch Camera', 'Cruise Control', 'Paddle Shifters']),
('Mahindra Scorpio-N', 'Mahindra', 'SUV', 'Diesel', 13.50, 15.5, 'Powerful 7-seater SUV', ARRAY['4x4 Capability', '7 Seats', 'Hill Hold Assist']),
('Tata Tiago', 'Tata', 'Hatchback', 'Petrol', 5.50, 24.0, 'Budget-friendly hatchback', ARRAY['Best Mileage', 'Affordable', 'Spacious Boot']),
('MG Hector', 'MG', 'SUV', 'Hybrid', 16.00, 17.0, 'Tech-loaded hybrid SUV', ARRAY['48V Hybrid', 'Large Touchscreen', 'Connected Features']),
('Kia Seltos', 'Kia', 'SUV', 'Diesel', 13.00, 18.0, 'Feature-rich compact SUV', ARRAY['LED Lighting', 'Bose Sound', '360° Camera']),
('Maruti Brezza', 'Maruti Suzuki', 'SUV', 'Petrol', 9.00, 19.8, 'Reliable compact SUV', ARRAY['Low Maintenance', '6 Airbags', 'HUD Display']),
('Hyundai Venue', 'Hyundai', 'SUV', 'Petrol', 8.50, 17.5, 'Compact SUV with tech', ARRAY['BlueLink Tech', 'Air Purifier', 'Sunroof']);