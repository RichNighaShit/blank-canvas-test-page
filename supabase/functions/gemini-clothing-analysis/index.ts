
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Predefined options that match our app's schema
const PREDEFINED_OPTIONS = {
  categories: ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'],
  styles: ['casual', 'formal', 'sporty', 'elegant', 'bohemian', 'minimalist', 'streetwear', 'vintage'],
  colors: [
    'black', 'white', 'gray', 'light-gray', 'dark-gray', 'charcoal',
    'red', 'light-red', 'pink', 'coral',
    'orange', 'yellow', 'light-yellow', 'cream',
    'green', 'light-green', 'sage', 'teal',
    'blue', 'light-blue', 'navy', 'cyan',
    'purple', 'magenta', 'neutral'
  ],
  occasions: ['casual', 'work', 'formal', 'party', 'sport', 'travel', 'date'],
  seasons: ['spring', 'summer', 'fall', 'winter'],
  fits: ['slim', 'regular', 'loose', 'oversized', 'fitted'],
  patterns: ['solid', 'stripes', 'floral', 'geometric', 'abstract', 'dots', 'plaid', 'textured', 'patterned'],
  materials: ['cotton', 'denim', 'leather', 'polyester', 'wool', 'silk', 'linen', 'cashmere', 'synthetic', 'blend'],
  conditions: ['new', 'excellent', 'good', 'fair', 'worn']
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('AI clothing analysis function called');
    
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    console.log('Starting constrained AI analysis for:', imageUrl);

    // Get API key from Supabase secrets
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    console.log('API key exists:', !!openRouterApiKey);
    
    if (!openRouterApiKey) {
      throw new Error('OPENROUTER_API_KEY not found in environment variables');
    }

    // Create structured prompt with our predefined options
    const structuredPrompt = `Analyze this clothing item image and provide detailed information in EXACT JSON format. 

IMPORTANT: You MUST choose values ONLY from the predefined options below. Do not create new values.

PREDEFINED OPTIONS:
- categories: ${PREDEFINED_OPTIONS.categories.join(', ')}
- styles: ${PREDEFINED_OPTIONS.styles.join(', ')}
- colors: ${PREDEFINED_OPTIONS.colors.join(', ')}
- occasions: ${PREDEFINED_OPTIONS.occasions.join(', ')}
- seasons: ${PREDEFINED_OPTIONS.seasons.join(', ')}
- fits: ${PREDEFINED_OPTIONS.fits.join(', ')}
- patterns: ${PREDEFINED_OPTIONS.patterns.join(', ')}
- materials: ${PREDEFINED_OPTIONS.materials.join(', ')}
- conditions: ${PREDEFINED_OPTIONS.conditions.join(', ')}

Respond with ONLY this JSON structure (no extra text):

{
  "isClothing": boolean,
  "confidence": number (0-1),
  "analysis": {
    "name": "descriptive name for the item",
    "category": "MUST be one of: ${PREDEFINED_OPTIONS.categories.join(' | ')}",
    "subcategory": "specific type (e.g., t-shirt, jeans, sneakers)",
    "style": "MUST be one of: ${PREDEFINED_OPTIONS.styles.join(' | ')}",
    "colors": ["MUST be from: ${PREDEFINED_OPTIONS.colors.join(', ')}"],
    "patterns": ["MUST be from: ${PREDEFINED_OPTIONS.patterns.join(', ')}"],
    "materials": ["MUST be from: ${PREDEFINED_OPTIONS.materials.join(', ')}"],
    "occasions": ["MUST be from: ${PREDEFINED_OPTIONS.occasions.join(', ')}"],
    "seasons": ["MUST be from: ${PREDEFINED_OPTIONS.seasons.join(', ')}"],
    "fit": "MUST be one of: ${PREDEFINED_OPTIONS.fits.join(' | ')}",
    "description": "detailed description of the item",
    "brand_visible": boolean,
    "condition": "MUST be one of: ${PREDEFINED_OPTIONS.conditions.join(' | ')}",
    "versatility_score": number (1-10)
  },
  "styling_suggestions": [
    "suggestion 1",
    "suggestion 2", 
    "suggestion 3"
  ],
  "care_instructions": ["wash instructions", "care tips"],
  "reasoning": "brief explanation of the analysis"
}

CRITICAL: Only use values from the predefined options above. If unsure, choose the closest match.`;

    // Try Claude 3.5 Haiku first (more reliable)
    const claudeRequest = {
      model: "anthropic/claude-3-5-haiku-20241022",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: structuredPrompt
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
      max_tokens: 1500,
      temperature: 0.1
    };

    console.log('Trying Claude 3.5 Haiku first:', claudeRequest.model);

    try {
      const claudeResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://yourapp.lovable.dev',
          'X-Title': 'AI Wardrobe Assistant'
        },
        body: JSON.stringify(claudeRequest)
      });

      console.log('Claude response status:', claudeResponse.status);

      if (claudeResponse.ok) {
        const claudeData = await claudeResponse.json();
        console.log('Claude response received successfully');
        
        const aiContent = claudeData.choices?.[0]?.message?.content;
        if (aiContent) {
          console.log('Claude AI content received:', aiContent);
          
          try {
            const analysisResult = JSON.parse(aiContent);
            console.log('Successfully parsed Claude response:', analysisResult);
            
            // Validate and fix if needed
            const validation = validateAnalysisResult(analysisResult);
            if (!validation.isValid) {
              console.warn('Claude validation issues:', validation.issues);
              analysisResult = fixInvalidValues(analysisResult);
            }
            
            console.log('Claude 3.5 Haiku analysis complete:', analysisResult);
            return new Response(JSON.stringify(analysisResult), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
            
          } catch (parseError) {
            console.warn('Failed to parse Claude response, falling back to Gemini:', parseError);
          }
        }
      } else {
        const errorText = await claudeResponse.text();
        console.warn('Claude API failed:', claudeResponse.status, errorText);
      }
    } catch (claudeError) {
      console.warn('Claude request failed, trying Gemini fallback:', claudeError);
    }

    // Fallback to Gemini if Claude fails
    console.log('Falling back to Gemini 2.0 Flash');
    
    const geminiRequest = {
      model: "google/gemini-2.0-flash-exp:free",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: structuredPrompt
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
      max_tokens: 1500,
      temperature: 0.1
    };

    const geminiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://yourapp.lovable.dev',  
        'X-Title': 'AI Wardrobe Assistant'
      },
      body: JSON.stringify(geminiRequest)
    });

    console.log('Gemini response status:', geminiResponse.status);

    if (geminiResponse.ok) {
      const geminiData = await geminiResponse.json();
      const aiContent = geminiData.choices?.[0]?.message?.content;

      if (aiContent) {
        console.log('Gemini AI content received:', aiContent);
        
        try {
          const analysisResult = JSON.parse(aiContent);
          console.log('Successfully parsed Gemini response:', analysisResult);
          
          const validation = validateAnalysisResult(analysisResult);
          if (!validation.isValid) {
            console.warn('Gemini validation issues:', validation.issues);
            analysisResult = fixInvalidValues(analysisResult);
          }
          
          console.log('Gemini 2.0 Flash analysis complete:', analysisResult);
          return new Response(JSON.stringify(analysisResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
          
        } catch (parseError) {
          console.error('Failed to parse Gemini response:', parseError);
        }
      }
    } else {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
    }

    // If both AI models fail, return structured fallback
    console.log('Both AI models failed, returning structured fallback');
    return new Response(JSON.stringify({
      isClothing: true,
      confidence: 0.3,
      analysis: {
        name: "Clothing Item (AI Analysis Failed)",
        category: "tops",
        subcategory: "shirt",
        style: "casual",
        colors: ["neutral"],
        patterns: ["solid"],
        materials: ["blend"],
        occasions: ["casual"],
        seasons: ["spring", "summer", "fall", "winter"],
        fit: "regular",
        description: "Both AI analyses failed - using fallback detection",
        brand_visible: false,
        condition: "good",
        versatility_score: 5
      },
      styling_suggestions: [
        "Basic clothing item",
        "Manual review recommended",
        "Try uploading again later"
      ],
      care_instructions: [
        "Follow garment care label",
        "Machine wash if appropriate"
      ],
      reasoning: "Both Claude and Gemini AI analyses failed - fallback response provided"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Function error:', error);
    
    // Return structured fallback response instead of error
    return new Response(JSON.stringify({
      isClothing: true,
      confidence: 0.2,
      analysis: {
        name: "Clothing Item (Function Error)",
        category: "tops",
        subcategory: "shirt", 
        style: "casual",
        colors: ["neutral"],
        patterns: ["solid"],
        materials: ["blend"],
        occasions: ["casual"],
        seasons: ["spring", "summer", "fall", "winter"],
        fit: "regular",
        description: "Function error occurred - using fallback",
        brand_visible: false,
        condition: "good",
        versatility_score: 5
      },
      styling_suggestions: [
        "Basic clothing item",
        "Function error - retry recommended"
      ],
      care_instructions: [
        "Follow garment care label"
      ],
      reasoning: `Function failed: ${error.message}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Validation function to ensure all values are from predefined options
function validateAnalysisResult(result: any): { isValid: boolean, issues: string[] } {
  const issues: string[] = [];
  
  if (!result.analysis) {
    issues.push('Missing analysis object');
    return { isValid: false, issues };
  }
  
  const analysis = result.analysis;
  
  // Validate category
  if (!PREDEFINED_OPTIONS.categories.includes(analysis.category)) {
    issues.push(`Invalid category: ${analysis.category}`);
  }
  
  // Validate style
  if (!PREDEFINED_OPTIONS.styles.includes(analysis.style)) {
    issues.push(`Invalid style: ${analysis.style}`);
  }
  
  // Validate colors
  if (analysis.colors && Array.isArray(analysis.colors)) {
    analysis.colors.forEach((color: string) => {
      if (!PREDEFINED_OPTIONS.colors.includes(color)) {
        issues.push(`Invalid color: ${color}`);
      }
    });
  }
  
  // Validate occasions
  if (analysis.occasions && Array.isArray(analysis.occasions)) {
    analysis.occasions.forEach((occasion: string) => {
      if (!PREDEFINED_OPTIONS.occasions.includes(occasion)) {
        issues.push(`Invalid occasion: ${occasion}`);
      }
    });
  }
  
  // Validate seasons
  if (analysis.seasons && Array.isArray(analysis.seasons)) {
    analysis.seasons.forEach((season: string) => {
      if (!PREDEFINED_OPTIONS.seasons.includes(season)) {
        issues.push(`Invalid season: ${season}`);
      }
    });
  }
  
  return { isValid: issues.length === 0, issues };
}

// Function to fix invalid values by mapping to closest valid options
function fixInvalidValues(result: any): any {
  if (!result.analysis) return result;
  
  const analysis = result.analysis;
  
  // Fix category
  if (!PREDEFINED_OPTIONS.categories.includes(analysis.category)) {
    analysis.category = mapToClosestCategory(analysis.category) || 'tops';
  }
  
  // Fix style
  if (!PREDEFINED_OPTIONS.styles.includes(analysis.style)) {
    analysis.style = mapToClosestStyle(analysis.style) || 'casual';
  }
  
  // Fix colors
  if (analysis.colors && Array.isArray(analysis.colors)) {
    analysis.colors = analysis.colors
      .map((color: string) => mapToClosestColor(color))
      .filter(Boolean)
      .slice(0, 3);
    if (analysis.colors.length === 0) analysis.colors = ['neutral'];
  }
  
  // Fix occasions
  if (analysis.occasions && Array.isArray(analysis.occasions)) {
    analysis.occasions = analysis.occasions
      .map((occasion: string) => mapToClosestOccasion(occasion))
      .filter(Boolean)
      .slice(0, 3);
    if (analysis.occasions.length === 0) analysis.occasions = ['casual'];
  }
  
  // Fix seasons
  if (analysis.seasons && Array.isArray(analysis.seasons)) {
    analysis.seasons = analysis.seasons
      .map((season: string) => mapToClosestSeason(season))
      .filter(Boolean);
    if (analysis.seasons.length === 0) analysis.seasons = ['spring', 'summer'];
  }
  
  return result;
}

// Mapping functions for closest matches
function mapToClosestCategory(category: string): string | null {
  const lower = category?.toLowerCase() || '';
  if (lower.includes('shirt') || lower.includes('top') || lower.includes('blouse')) return 'tops';
  if (lower.includes('pant') || lower.includes('jean') || lower.includes('bottom')) return 'bottoms';
  if (lower.includes('dress') || lower.includes('gown')) return 'dresses';
  if (lower.includes('jacket') || lower.includes('coat') || lower.includes('blazer')) return 'outerwear';
  if (lower.includes('shoe') || lower.includes('boot') || lower.includes('sneaker')) return 'shoes';
  if (lower.includes('bag') || lower.includes('accessory') || lower.includes('hat')) return 'accessories';
  return 'tops';
}

function mapToClosestStyle(style: string): string | null {
  const lower = style?.toLowerCase() || '';
  if (lower.includes('formal') || lower.includes('business')) return 'formal';
  if (lower.includes('sport') || lower.includes('athletic')) return 'sporty';
  if (lower.includes('elegant') || lower.includes('fancy')) return 'elegant';
  if (lower.includes('boho') || lower.includes('hippie')) return 'bohemian';
  if (lower.includes('minimal') || lower.includes('simple')) return 'minimalist';
  if (lower.includes('street') || lower.includes('urban')) return 'streetwear';
  if (lower.includes('vintage') || lower.includes('retro')) return 'vintage';
  return 'casual';
}

function mapToClosestColor(color: string): string | null {
  const lower = color?.toLowerCase() || '';
  // Direct matches first
  if (PREDEFINED_OPTIONS.colors.includes(lower)) return lower;
  
  // Fuzzy matches
  if (lower.includes('black') || lower.includes('dark')) return 'black';
  if (lower.includes('white') || lower.includes('cream')) return 'white';
  if (lower.includes('red')) return 'red';
  if (lower.includes('blue')) return 'blue';
  if (lower.includes('green')) return 'green';
  if (lower.includes('yellow')) return 'yellow';
  if (lower.includes('orange')) return 'orange';
  if (lower.includes('purple')) return 'purple';
  if (lower.includes('pink')) return 'pink';
  if (lower.includes('gray') || lower.includes('grey')) return 'gray';
  
  return 'neutral';
}

function mapToClosestOccasion(occasion: string): string | null {
  const lower = occasion?.toLowerCase() || '';
  if (PREDEFINED_OPTIONS.occasions.includes(lower)) return lower;
  
  if (lower.includes('work') || lower.includes('business') || lower.includes('office')) return 'work';
  if (lower.includes('formal') || lower.includes('wedding') || lower.includes('ceremony')) return 'formal';
  if (lower.includes('party') || lower.includes('celebration') || lower.includes('event')) return 'party';
  if (lower.includes('sport') || lower.includes('gym') || lower.includes('exercise')) return 'sport';
  if (lower.includes('travel') || lower.includes('vacation')) return 'travel';
  if (lower.includes('date') || lower.includes('romantic')) return 'date';
  
  return 'casual';
}

function mapToClosestSeason(season: string): string | null {
  const lower = season?.toLowerCase() || '';
  if (PREDEFINED_OPTIONS.seasons.includes(lower)) return lower;
  
  if (lower.includes('spring')) return 'spring';
  if (lower.includes('summer')) return 'summer';
  if (lower.includes('fall') || lower.includes('autumn')) return 'fall';
  if (lower.includes('winter')) return 'winter';
  
  return null;
}
