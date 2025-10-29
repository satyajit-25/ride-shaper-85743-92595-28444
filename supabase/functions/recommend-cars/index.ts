import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Car {
  id: string;
  name: string;
  brand: string;
  type: string;
  fuel_type: string;
  price_lakhs: string;
  mileage_kmpl: string;
  description: string;
  features?: string[];
  image_url?: string;
  similarity_score?: number;
}

interface AIRecommendation {
  car_name: string;
  rank: number;
  explanation: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestBody = await req.json();
    
    // Validate input with Zod schema
    const requestSchema = z.object({
      userQuery: z.string().min(1, 'Query required').max(500, 'Query too long'),
      fuelType: z.enum(['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', '']).default(''),
      priceRange: z.string().regex(/^\d*$/, 'Price must be numeric').max(10).default(''),
      carType: z.enum(['SUV', 'Sedan', 'Hatchback', 'MPV', '']).default(''),
      mileagePreference: z.enum(['excellent', 'good', 'average', '']).default('')
    });

    let validatedData;
    try {
      validatedData = requestSchema.parse(requestBody);
    } catch (validationError) {
      console.error('Validation error:', validationError);
      return new Response(
        JSON.stringify({ error: 'Invalid input parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userQuery, fuelType, priceRange, carType, mileagePreference } = validatedData;
    
    console.log('Received request from user:', user.id);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('API key not configured');
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Get all cars from database
    const { data: allCars, error: carsError } = await supabaseClient
      .from('cars')
      .select('*');

    if (carsError) {
      console.error('Database error:', carsError);
      return new Response(
        JSON.stringify({ error: 'Unable to retrieve car data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${allCars.length} cars in database`);

    // Step 2: Calculate similarity scores and filter
    const carsWithScores = allCars.map((car: Car) => {
      // Simple text-based matching score
      let score = 0;
      const carText = `${car.name} ${car.type} ${car.fuel_type} ${car.description} ${car.features?.join(' ')}`.toLowerCase();
      const queryLower = userQuery.toLowerCase();
      
      // Basic keyword matching
      if (carText.includes(queryLower)) score += 10;
      if (car.type.toLowerCase() === carType.toLowerCase()) score += 5;
      if (car.fuel_type.toLowerCase() === fuelType.toLowerCase()) score += 5;
      if (priceRange && parseFloat(car.price_lakhs) <= parseFloat(priceRange)) score += 5;
      
      // Mileage scoring
      if (mileagePreference === 'excellent' && parseFloat(car.mileage_kmpl) >= 20) score += 5;
      else if (mileagePreference === 'good' && parseFloat(car.mileage_kmpl) >= 15) score += 3;
      
      return { ...car, similarity_score: score };
    });

    // Get top 5 matches
    const top5Cars = carsWithScores
      .sort((a: Car, b: Car) => (b.similarity_score ?? 0) - (a.similarity_score ?? 0))
      .slice(0, 5);

    console.log('Top 5 cars:', top5Cars.map((c: Car) => ({ name: c.name, score: c.similarity_score })));

    // Step 3: Use AI to reason and select top 4
    console.log('Asking AI to select top 4 cars...');
    const aiPrompt = `You are a car recommendation expert. Based on the user's query: "${userQuery}"

Here are the top 5 matching cars:

${top5Cars.map((car: Car, i: number) => `
${i + 1}. ${car.name} (${car.brand})
   - Type: ${car.type}
   - Fuel: ${car.fuel_type}
   - Price: ₹${car.price_lakhs}L
   - Mileage: ${car.mileage_kmpl} km/l
   - Description: ${car.description}
   - Features: ${car.features?.join(', ')}
`).join('\n')}

Please select the TOP 4 BEST cars for this customer and explain WHY each car is a great match for their needs. Be specific about how each car matches their requirements.

IMPORTANT: Use ONLY the car name (without the brand in parentheses) in your response. For example, if you see "Verna Diesel (Hyundai)", use only "Verna Diesel" as the car_name.

Respond in this exact JSON format:
{
  "recommendations": [
    {
      "car_name": "exact car name from list (WITHOUT brand in parentheses)",
      "rank": 1,
      "explanation": "detailed explanation of why this car is perfect for the customer"
    },
    {
      "car_name": "exact car name from list (WITHOUT brand in parentheses)",
      "rank": 2,
      "explanation": "detailed explanation of why this car is perfect for the customer"
    },
    {
      "car_name": "exact car name from list (WITHOUT brand in parentheses)",
      "rank": 3,
      "explanation": "detailed explanation of why this car is perfect for the customer"
    },
    {
      "car_name": "exact car name from list (WITHOUT brand in parentheses)",
      "rank": 4,
      "explanation": "detailed explanation of why this car is perfect for the customer"
    }
  ]
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a car recommendation expert. Always respond with valid JSON.' },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Unable to generate recommendations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    console.log('AI response:', aiContent);

    // Parse AI response
    let aiRecommendations: { recommendations: AIRecommendation[] };
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = aiContent.match(/```json\n([\s\S]*?)\n```/) || aiContent.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiContent;
      aiRecommendations = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response');
      return new Response(
        JSON.stringify({ error: 'Unable to process recommendations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Build final response with full car details
    const finalRecommendations = aiRecommendations.recommendations
      .map((rec: AIRecommendation) => {
        // Remove brand suffix from AI response (e.g., "Verna Diesel (Hyundai)" -> "Verna Diesel")
        const cleanCarName = rec.car_name.replace(/\s*\([^)]*\)\s*$/, '').trim();
        
        // Try exact match first, then fuzzy match
        let car = top5Cars.find((c: Car) => c.name === cleanCarName);
        if (!car) {
          // Try matching by checking if the car name contains the cleaned name or vice versa
          car = top5Cars.find((c: Car) => 
            c.name.toLowerCase().includes(cleanCarName.toLowerCase()) ||
            cleanCarName.toLowerCase().includes(c.name.toLowerCase())
          );
        }
        
        if (!car) {
          console.error(`Could not find car matching: ${rec.car_name} (cleaned: ${cleanCarName})`);
          return null;
        }
        
        return {
          rank: rec.rank,
          car: {
            id: car.id,
            name: car.name,
            brand: car.brand,
            type: car.type,
            fuel_type: car.fuel_type,
            price_lakhs: car.price_lakhs,
            mileage_kmpl: car.mileage_kmpl,
            description: car.description,
            features: car.features,
            image_url: car.image_url
          },
          explanation: rec.explanation
        };
      })
      .filter((rec): rec is NonNullable<typeof rec> => rec !== null);

    // Step 5: Save search to database
    const { data: searchData, error: searchError } = await supabaseClient
      .from('searches')
      .insert({
        user_id: user.id,
        user_query: userQuery,
        fuel_type: fuelType,
        price_range: priceRange,
        car_type: carType,
        mileage_preference: mileagePreference
      })
      .select()
      .single();

    if (searchError) {
      console.error('Failed to save search');
    } else if (finalRecommendations.length > 0) {
      console.log('Saved search with ID:', searchData.id);

      // Save recommendations
      for (const rec of finalRecommendations) {
        await supabaseClient
          .from('recommendations')
          .insert({
            user_id: user.id,
            search_id: searchData.id,
            car_id: rec.car.id,
            rank: rec.rank,
            ai_explanation: rec.explanation
          });
      }
    }

    console.log('Returning recommendations:', finalRecommendations);

    return new Response(
      JSON.stringify({ recommendations: finalRecommendations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error details:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to process recommendation request' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
