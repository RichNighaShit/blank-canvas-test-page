
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    console.log('Starting Gemini AI clothing analysis for:', imageUrl);

    // Get API key from Supabase secrets
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      throw new Error('OPENROUTER_API_KEY not found in environment variables');
    }

    // Prepare the AI analysis request
    const aiRequest = {
      model: "google/gemini-2.5-pro-exp-03-25",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this clothing item image and provide detailed information in JSON format:

{
  "isClothing": boolean,
  "confidence": number (0-1),
  "analysis": {
    "name": "descriptive name for the item",
    "category": "tops|bottoms|dresses|outerwear|shoes|accessories",
    "subcategory": "specific type (e.g., t-shirt, jeans, sneakers)",
    "style": "casual|formal|sporty|elegant|bohemian|minimalist|streetwear|vintage",
    "colors": ["primary color", "secondary color", "accent color"],
    "patterns": ["solid|stripes|floral|geometric|abstract|etc"],
    "materials": ["cotton|denim|leather|polyester|wool|silk|etc"],
    "occasions": ["casual|work|formal|party|sport|travel|date"],
    "seasons": ["spring|summer|fall|winter"],
    "fit": "slim|regular|loose|oversized|fitted",
    "description": "detailed description of the item",
    "brand_visible": boolean,
    "condition": "new|good|fair|worn",
    "versatility_score": number (1-10)
  },
  "styling_suggestions": [
    "suggestion 1",
    "suggestion 2",
    "suggestion 3"
  ],
  "care_instructions": ["wash instructions", "care tips"],
  "reasoning": "explanation of the analysis"
}

Be very detailed and accurate. If it's not clothing, set isClothing to false and provide reasoning.`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    };

    // Make request to OpenRouter with Gemini
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://yourapp.com',
        'X-Title': 'AI Wardrobe Assistant'
      },
      body: JSON.stringify(aiRequest)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', errorData);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error('No content received from AI');
    }

    // Parse AI response
    let analysisResult;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : aiContent;
      analysisResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      // Fallback analysis
      analysisResult = {
        isClothing: true,
        confidence: 0.5,
        analysis: {
          name: 'Clothing Item',
          category: 'tops',
          subcategory: 'shirt',
          style: 'casual',
          colors: ['neutral'],
          patterns: ['solid'],
          materials: ['cotton'],
          occasions: ['casual'],
          seasons: ['spring', 'summer', 'fall', 'winter'],
          fit: 'regular',
          description: 'AI analysis failed - manual review needed',
          brand_visible: false,
          condition: 'good',
          versatility_score: 5
        },
        styling_suggestions: ['Can be styled casually', 'Versatile piece'],
        care_instructions: ['Follow garment care label'],
        reasoning: 'Fallback analysis due to parsing error'
      };
    }

    console.log('AI Analysis complete:', analysisResult);

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Gemini analysis error:', error);
    
    // Return fallback response instead of error
    const fallbackResult = {
      isClothing: true,
      confidence: 0.3,
      analysis: {
        name: 'Clothing Item (Analysis Failed)',
        category: 'tops',
        subcategory: 'shirt',
        style: 'casual',
        colors: ['neutral'],
        patterns: ['solid'],
        materials: ['unknown'],
        occasions: ['casual'],
        seasons: ['spring', 'summer', 'fall', 'winter'],
        fit: 'regular',
        description: 'AI analysis temporarily unavailable - please add details manually',
        brand_visible: false,
        condition: 'good',
        versatility_score: 5
      },
      styling_suggestions: ['Versatile basic piece', 'Good for layering'],
      care_instructions: ['Follow garment care label', 'Machine wash if appropriate'],
      reasoning: `Analysis failed: ${error.message}. Using fallback detection.`
    };

    return new Response(JSON.stringify(fallbackResult), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
