/**
 * Static Color Palette Details
 *
 * This file contains educational and interpretive content about color palettes,
 * color theory principles, and styling insights that enrich the user experience
 * on the "Your Color Palette" page.
 */

export interface ColorPaletteInfo {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
  exampleHexes: string[];
  styleAdvice: string[];
  colorTheory: string;
  personalityTraits?: string[];
  seasonalAlignment?: "spring" | "summer" | "autumn" | "winter" | "universal";
}

export interface ColorHarmonyPattern {
  id: string;
  name: string;
  description: string;
  examples: string[][];
  whenToUse: string;
}

export interface ColorMoodMapping {
  colors: string[];
  mood: string;
  description: string;
  outfitSuggestions: string[];
}

// Static color palette descriptions and educational content
export const staticColorPaletteDetails: ColorPaletteInfo[] = [
  {
    id: "vibrant_energy",
    name: "Vibrant Energy",
    description:
      "Palettes with bright, highly saturated colors often convey energy, enthusiasm, and confidence. These colors make a bold statement and are perfect for those who love to stand out.",
    characteristics: [
      "High saturation",
      "Bright and bold",
      "Eye-catching",
      "Confident",
    ],
    exampleHexes: ["#FF6F61", "#F7D678", "#6B5B95", "#88D8B0", "#FF7B7B"],
    styleAdvice: [
      "Perfect for statement pieces and accent colors",
      "Balance with neutrals to avoid overwhelming looks",
      "Great for casual and creative professional settings",
      "Use in accessories to add pops of color",
    ],
    colorTheory:
      "High saturation colors create visual impact through their intensity and purity. They work best when balanced with neutral tones.",
    personalityTraits: ["Outgoing", "Creative", "Confident", "Energetic"],
    seasonalAlignment: "spring",
  },
  {
    id: "calm_serenity",
    name: "Calm Serenity",
    description:
      "Softer, muted tones with lower saturation create a sense of calm, sophistication, and timeless elegance. These palettes are versatile and universally flattering.",
    characteristics: [
      "Muted tones",
      "Low to medium saturation",
      "Peaceful",
      "Sophisticated",
    ],
    exampleHexes: ["#AEC6CF", "#B399C6", "#CADFEF", "#E6E6FA", "#F0F8FF"],
    styleAdvice: [
      "Excellent for building a capsule wardrobe",
      "Perfect for professional and formal settings",
      "Easy to mix and match with other pieces",
      "Creates effortlessly elegant looks",
    ],
    colorTheory:
      "Muted colors are created by adding gray to pure hues, resulting in sophisticated, easy-to-wear shades that complement rather than compete.",
    personalityTraits: ["Peaceful", "Thoughtful", "Elegant", "Reliable"],
    seasonalAlignment: "summer",
  },
  {
    id: "warm_earth",
    name: "Warm Earth",
    description:
      "Rich, warm earth tones create a grounded, natural aesthetic. These colors evoke feelings of comfort, stability, and connection to nature.",
    characteristics: [
      "Warm undertones",
      "Natural and organic",
      "Rich depth",
      "Grounding",
    ],
    exampleHexes: ["#A0522D", "#CD853F", "#DEB887", "#F4A460", "#D2691E"],
    styleAdvice: [
      "Perfect for autumn and winter wardrobes",
      "Combines beautifully with denim and leather",
      "Ideal for casual and bohemian styles",
      "Works well with gold jewelry and accessories",
    ],
    colorTheory:
      "Earth tones are naturally harmonious as they appear together in nature. They create monochromatic and analogous color schemes effortlessly.",
    personalityTraits: ["Down-to-earth", "Warm", "Approachable", "Natural"],
    seasonalAlignment: "autumn",
  },
  {
    id: "cool_elegance",
    name: "Cool Elegance",
    description:
      "Cool-toned palettes with blues, greens, and purples create a sense of calm professionalism and refined elegance. These colors are naturally receding and flattering.",
    characteristics: ["Cool undertones", "Professional", "Calming", "Refined"],
    exampleHexes: ["#4682B4", "#5F9EA0", "#6495ED", "#778899", "#B0C4DE"],
    styleAdvice: [
      "Excellent for business and professional wear",
      "Pairs beautifully with silver jewelry",
      "Creates slimming and lengthening effects",
      "Perfect for minimalist and modern styles",
    ],
    colorTheory:
      "Cool colors appear to recede visually, creating a calming effect and making the wearer appear more approachable and trustworthy.",
    personalityTraits: ["Professional", "Calm", "Trustworthy", "Analytical"],
    seasonalAlignment: "winter",
  },
  {
    id: "monochromatic_harmony",
    name: "Monochromatic Harmony",
    description:
      "Palettes featuring variations of a single color create sophisticated, cohesive looks. This approach is foolproof and always appears intentional and polished.",
    characteristics: [
      "Single color family",
      "Tonal variation",
      "Sophisticated",
      "Cohesive",
    ],
    exampleHexes: ["#E6F3FF", "#B3D9FF", "#80BFFF", "#4DA6FF", "#1A8CFF"],
    styleAdvice: [
      "Creates effortlessly sophisticated looks",
      "Easy to shop for and coordinate",
      "Perfect for minimalist wardrobes",
      "Add interest through texture and silhouette",
    ],
    colorTheory:
      "Monochromatic schemes use variations in lightness and saturation of a single hue, creating harmony through similarity while maintaining visual interest.",
    personalityTraits: [
      "Minimalist",
      "Sophisticated",
      "Detail-oriented",
      "Classic",
    ],
    seasonalAlignment: "universal",
  },
  {
    id: "neutral_foundation",
    name: "Neutral Foundation",
    description:
      "Classic neutrals provide the perfect foundation for any wardrobe. These timeless colors are versatile, flattering, and never go out of style.",
    characteristics: ["Timeless", "Versatile", "Classic", "Foundation colors"],
    exampleHexes: ["#F5F5DC", "#D2B48C", "#A0A0A0", "#696969", "#2F4F4F"],
    styleAdvice: [
      "Essential building blocks for any wardrobe",
      "Mix easily with any accent colors",
      "Perfect for investment pieces",
      "Creates effortless, polished looks",
    ],
    colorTheory:
      "Neutrals are colors with low saturation that work harmoniously with all other colors, providing balance and allowing other elements to shine.",
    personalityTraits: ["Classic", "Practical", "Timeless", "Versatile"],
    seasonalAlignment: "universal",
  },
];

// Color harmony patterns for educational content
export const colorHarmonyPatterns: ColorHarmonyPattern[] = [
  {
    id: "complementary",
    name: "Complementary Colors",
    description:
      "Colors opposite each other on the color wheel create dynamic, high-contrast combinations that are naturally pleasing to the eye.",
    examples: [
      ["#FF0000", "#00FF00"], // Red & Green
      ["#0000FF", "#FFA500"], // Blue & Orange
      ["#800080", "#FFFF00"], // Purple & Yellow
    ],
    whenToUse:
      "Use complementary colors when you want to create bold, energetic looks or make a statement piece pop.",
  },
  {
    id: "analogous",
    name: "Analogous Colors",
    description:
      "Colors next to each other on the color wheel create harmonious, peaceful combinations that are easy on the eyes.",
    examples: [
      ["#FF0000", "#FF8000", "#FFFF00"], // Red to Yellow
      ["#0000FF", "#0080FF", "#00FFFF"], // Blue to Cyan
      ["#008000", "#00FF80", "#00FFFF"], // Green to Cyan
    ],
    whenToUse:
      "Perfect for creating serene, cohesive looks that feel naturally harmonious and sophisticated.",
  },
  {
    id: "triadic",
    name: "Triadic Colors",
    description:
      "Three colors evenly spaced on the color wheel create vibrant, balanced combinations while maintaining harmony.",
    examples: [
      ["#FF0000", "#00FF00", "#0000FF"], // Red, Green, Blue
      ["#FF8000", "#8000FF", "#00FF80"], // Orange, Purple, Green
    ],
    whenToUse:
      "Use triadic schemes when you want vibrant, playful looks that still feel balanced and intentional.",
  },
];

// Mood-based color mappings
export const colorMoodMappings: ColorMoodMapping[] = [
  {
    colors: ["#FF6B6B", "#FF8E53", "#FF6B9D"],
    mood: "Energetic & Playful",
    description: "Warm, bright colors that boost confidence and energy levels.",
    outfitSuggestions: [
      "Weekend casual with bright accessories",
      "Creative workplace attire",
      "Social events and parties",
      "Exercise and activewear accents",
    ],
  },
  {
    colors: ["#4ECDC4", "#45B7D1", "#96CEB4"],
    mood: "Calm & Peaceful",
    description:
      "Cool, soothing colors that promote relaxation and tranquility.",
    outfitSuggestions: [
      "Professional meetings and presentations",
      "Spa days and wellness activities",
      "Travel and vacation wear",
      "Meditation and yoga sessions",
    ],
  },
  {
    colors: ["#8B4513", "#D2691E", "#CD853F"],
    mood: "Grounded & Natural",
    description:
      "Earth tones that create feelings of stability and connection to nature.",
    outfitSuggestions: [
      "Outdoor activities and hiking",
      "Casual family gatherings",
      "Bohemian and artisanal styles",
      "Autumn and winter wardrobes",
    ],
  },
  {
    colors: ["#2C3E50", "#34495E", "#95A5A6"],
    mood: "Sophisticated & Professional",
    description: "Neutral, cool tones that convey competence and reliability.",
    outfitSuggestions: [
      "Business meetings and interviews",
      "Formal events and ceremonies",
      "Professional networking",
      "Classic, timeless looks",
    ],
  },
];

// Function to analyze a user's palette and suggest relevant information
export function analyzePaletteCharacteristics(colors: string[]): {
  dominantMood: ColorMoodMapping;
  relevantInfo: ColorPaletteInfo;
  suggestedHarmony: ColorHarmonyPattern;
} {
  // Simple analysis based on color properties
  // In a real implementation, this would use more sophisticated color analysis

  const avgBrightness = colors.length > 0 ? 0.5 : 0; // Simplified
  const hasWarmColors = colors.some((color) => {
    const rgb = hexToRgb(color);
    return rgb && rgb.r > rgb.b; // Simplified warm color detection
  });

  // Select dominant mood based on analysis
  let dominantMood = colorMoodMappings[1]; // Default to calm
  if (avgBrightness > 0.7) {
    dominantMood = colorMoodMappings[0]; // Energetic
  } else if (hasWarmColors) {
    dominantMood = colorMoodMappings[2]; // Grounded
  } else {
    dominantMood = colorMoodMappings[3]; // Professional
  }

  // Select relevant palette info
  let relevantInfo = staticColorPaletteDetails[1]; // Default to calm
  if (avgBrightness > 0.7) {
    relevantInfo = staticColorPaletteDetails[0]; // Vibrant
  } else if (hasWarmColors) {
    relevantInfo = staticColorPaletteDetails[2]; // Warm earth
  }

  // Suggest harmony pattern
  const suggestedHarmony =
    colors.length <= 3
      ? colorHarmonyPatterns[1] // Analogous for simple palettes
      : colorHarmonyPatterns[0]; // Complementary for complex palettes

  return {
    dominantMood,
    relevantInfo,
    suggestedHarmony,
  };
}

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Export all static data
export const colorPaletteData = {
  paletteDetails: staticColorPaletteDetails,
  harmonyPatterns: colorHarmonyPatterns,
  moodMappings: colorMoodMappings,
  analyzePaletteCharacteristics,
};
