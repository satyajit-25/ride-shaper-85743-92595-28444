import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userQuery, fuelType, priceRange, carType, mileagePreference } = await req.json();
    
    console.log('Received request:', { userQuery, fuelType, priceRange, carType, mileagePreference });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Step 1: Get all cars from database
    const { data: allCars, error: carsError } = await supabaseClient
      .from('cars')
      .select('*');

    if (carsError) {
      console.error('Database error:', carsError);
      throw carsError;
    }

    console.log(`Found ${allCars.length} cars in database`);

    // Step 2: Calculate similarity scores and filter
    const carsWithScores = allCars.map(car => {
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
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, 5);

    console.log('Top 5 cars:', top5Cars.map(c => ({ name: c.name, score: c.similarity_score })));

    // Step 3: Use AI to reason and select top 4
    console.log('Asking AI to select top 4 cars...');
    const aiPrompt = `You are a car recommendation expert. Based on the user's query: "${userQuery}"

Here are the top 5 matching cars:

${top5Cars.map((car, i) => `
${i + 1}. ${car.name} (${car.brand})
   - Type: ${car.type}
   - Fuel: ${car.fuel_type}
   - Price: ₹${car.price_lakhs}L
   - Mileage: ${car.mileage_kmpl} km/l
   - Description: ${car.description}
   - Features: ${car.features?.join(', ')}
`).join('\n')}

Please select the TOP 4 BEST cars for this customer and explain WHY each car is a great match for their needs. Be specific about how each car matches their requirements.

Respond in this exact JSON format:
{
  "recommendations": [
    {
      "car_name": "exact car name from list",
      "rank": 1,
      "explanation": "detailed explanation of why this car is perfect for the customer"
    },
    {
      "car_name": "exact car name from list",
      "rank": 2,
      "explanation": "detailed explanation of why this car is perfect for the customer"
    },
    {
      "car_name": "exact car name from list",
      "rank": 3,
      "explanation": "detailed explanation of why this car is perfect for the customer"
    },
    {
      "car_name": "exact car name from list",
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
      console.error('AI API error:', errorText);
      throw new Error('Failed to get AI recommendations');
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    console.log('AI response:', aiContent);

    // Parse AI response
    let aiRecommendations;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = aiContent.match(/```json\n([\s\S]*?)\n```/) || aiContent.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiContent;
      aiRecommendations = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('Failed to parse AI recommendations');
    }

    // Step 4: Build final response with full car details
    const finalRecommendations = aiRecommendations.recommendations.map((rec: any) => {
      const car = top5Cars.find(c => c.name === rec.car_name);
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
          features: car.features
        },
        explanation: rec.explanation
      };
    });

    // Step 5: Save search to database
    const { data: searchData, error: searchError } = await supabaseClient
      .from('searches')
      .insert({
        user_query: userQuery,
        fuel_type: fuelType,
        price_range: priceRange,
        car_type: carType,
        mileage_preference: mileagePreference
      })
      .select()
      .single();

    if (searchError) {
      console.error('Failed to save search:', searchError);
    } else {
      console.log('Saved search with ID:', searchData.id);

      // Save recommendations
      for (const rec of finalRecommendations) {
        await supabaseClient
          .from('recommendations')
          .insert({
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
    console.error('Error in recommend-cars function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
