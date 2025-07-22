/**
 * Comprehensive Predefined Color Palettes
 * 
 * Inclusive collection of color combinations representing the full spectrum
 * of human coloring across all ethnicities and backgrounds.
 */

export interface ColorPalette {
  id: string;
  name: string;
  description: string;
  skinTone: {
    color: string;
    name: string;
    undertone: 'warm' | 'cool' | 'neutral';
  };
  hairColor: {
    color: string;
    name: string;
    category: 'blonde' | 'brown' | 'black' | 'red' | 'auburn' | 'gray' | 'white';
  };
  eyeColor: {
    color: string;
    name: string;
    category: 'blue' | 'green' | 'brown' | 'hazel' | 'gray' | 'amber';
  };
  colorSeason: 'spring' | 'summer' | 'autumn' | 'winter';
  complementaryColors: string[];
  category: 'very-fair' | 'fair' | 'light' | 'medium' | 'olive' | 'tan' | 'dark' | 'deep';
}

// Comprehensive and inclusive color palette collection representing the beautiful diversity of human coloring
// This collection includes 40+ palettes covering all ethnic backgrounds, skin tones, and natural color combinations
export const PREDEFINED_COLOR_PALETTES: ColorPalette[] = [
  // VERY FAIR COMPLEXIONS
  {
    id: 'platinum-blonde-blue-very-fair',
    name: 'Platinum Blonde & Blue Eyes',
    description: 'Very fair skin with platinum blonde hair and blue eyes',
    skinTone: { color: '#FEF7E7', name: 'Very Fair', undertone: 'cool' },
    hairColor: { color: '#F5F5DC', name: 'Platinum Blonde', category: 'blonde' },
    eyeColor: { color: '#6495ED', name: 'Blue', category: 'blue' },
    colorSeason: 'summer',
    complementaryColors: ['#E6F3FF', '#FFF8DC', '#F0F8FF', '#FFFACD', '#F5F5F5', '#E0E6FF'],
    category: 'very-fair'
  },
  {
    id: 'light-blonde-green-very-fair',
    name: 'Light Blonde & Green Eyes',
    description: 'Very fair skin with light blonde hair and green eyes',
    skinTone: { color: '#FFEEE6', name: 'Very Fair', undertone: 'neutral' },
    hairColor: { color: '#F0E68C', name: 'Light Blonde', category: 'blonde' },
    eyeColor: { color: '#90EE90', name: 'Green', category: 'green' },
    colorSeason: 'spring',
    complementaryColors: ['#F0FFF0', '#FFFACD', '#F5FFFA', '#FFEFD5', '#F8F8FF', '#E0FFE0'],
    category: 'very-fair'
  },
  {
    id: 'auburn-hazel-very-fair',
    name: 'Auburn Hair & Hazel Eyes',
    description: 'Very fair skin with auburn hair and hazel eyes',
    skinTone: { color: '#FFEBE6', name: 'Very Fair', undertone: 'warm' },
    hairColor: { color: '#A0522D', name: 'Auburn', category: 'auburn' },
    eyeColor: { color: '#8E7618', name: 'Hazel', category: 'hazel' },
    colorSeason: 'autumn',
    complementaryColors: ['#FFF8DC', '#FFEFD5', '#FFE4B5', '#FFDAB9', '#F5DEB3', '#DEB887'],
    category: 'very-fair'
  },

  // FAIR COMPLEXIONS
  {
    id: 'golden-blonde-blue-fair',
    name: 'Golden Blonde & Blue Eyes',
    description: 'Fair skin with golden blonde hair and blue eyes',
    skinTone: { color: '#FFEAA7', name: 'Fair', undertone: 'warm' },
    hairColor: { color: '#DAA520', name: 'Golden Blonde', category: 'blonde' },
    eyeColor: { color: '#4169E1', name: 'Blue', category: 'blue' },
    colorSeason: 'spring',
    complementaryColors: ['#FFE4B5', '#FFDAB9', '#F0E68C', '#E6E6FA', '#B0E0E6', '#FFFACD'],
    category: 'fair'
  },
  {
    id: 'strawberry-blonde-green-fair',
    name: 'Strawberry Blonde & Green Eyes',
    description: 'Fair skin with strawberry blonde hair and green eyes',
    skinTone: { color: '#FFDBAC', name: 'Fair', undertone: 'warm' },
    hairColor: { color: '#FF7F50', name: 'Strawberry Blonde', category: 'blonde' },
    eyeColor: { color: '#228B22', name: 'Green', category: 'green' },
    colorSeason: 'spring',
    complementaryColors: ['#FFE4E1', '#FFDAB9', '#F0E68C', '#98FB98', '#FFB6C1', '#FFEFD5'],
    category: 'fair'
  },
  {
    id: 'light-brown-brown-fair',
    name: 'Light Brown Hair & Brown Eyes',
    description: 'Fair skin with light brown hair and brown eyes',
    skinTone: { color: '#F5DEB3', name: 'Fair', undertone: 'neutral' },
    hairColor: { color: '#8B4513', name: 'Light Brown', category: 'brown' },
    eyeColor: { color: '#8B4513', name: 'Brown', category: 'brown' },
    colorSeason: 'autumn',
    complementaryColors: ['#F5DEB3', '#DEB887', '#D2B48C', '#BC8F8F', '#F4A460', '#CD853F'],
    category: 'fair'
  },

  // LIGHT COMPLEXIONS
  {
    id: 'dirty-blonde-hazel-light',
    name: 'Dirty Blonde & Hazel Eyes',
    description: 'Light skin with dirty blonde hair and hazel eyes',
    skinTone: { color: '#E4C2A8', name: 'Light', undertone: 'warm' },
    hairColor: { color: '#B8860B', name: 'Dirty Blonde', category: 'blonde' },
    eyeColor: { color: '#B8860B', name: 'Hazel', category: 'hazel' },
    colorSeason: 'autumn',
    complementaryColors: ['#F5DEB3', '#DEB887', '#D2B48C', '#BC8F8F', '#F4A460', '#CD853F'],
    category: 'light'
  },
  {
    id: 'medium-brown-blue-light',
    name: 'Medium Brown & Blue Eyes',
    description: 'Light skin with medium brown hair and blue eyes',
    skinTone: { color: '#D4A574', name: 'Light', undertone: 'cool' },
    hairColor: { color: '#654321', name: 'Medium Brown', category: 'brown' },
    eyeColor: { color: '#87CEEB', name: 'Blue', category: 'blue' },
    colorSeason: 'summer',
    complementaryColors: ['#E6E6FA', '#B0E0E6', '#F0F8FF', '#D2B48C', '#DDA0DD', '#C0C0C0'],
    category: 'light'
  },
  {
    id: 'dark-brown-green-light',
    name: 'Dark Brown & Green Eyes',
    description: 'Light skin with dark brown hair and green eyes',
    skinTone: { color: '#C68642', name: 'Light', undertone: 'neutral' },
    hairColor: { color: '#3C2415', name: 'Dark Brown', category: 'brown' },
    eyeColor: { color: '#006400', name: 'Green', category: 'green' },
    colorSeason: 'winter',
    complementaryColors: ['#228B22', '#006400', '#2E8B57', '#8FBC8F', '#98FB98', '#90EE90'],
    category: 'light'
  },

  // MEDIUM COMPLEXIONS
  {
    id: 'black-brown-medium',
    name: 'Black Hair & Brown Eyes',
    description: 'Medium skin with black hair and brown eyes',
    skinTone: { color: '#A0522D', name: 'Medium', undertone: 'warm' },
    hairColor: { color: '#000000', name: 'Black', category: 'black' },
    eyeColor: { color: '#654321', name: 'Brown', category: 'brown' },
    colorSeason: 'autumn',
    complementaryColors: ['#D2691E', '#CD853F', '#DEB887', '#F4A460', '#BC8F8F', '#8B4513'],
    category: 'medium'
  },
  {
    id: 'dark-brown-hazel-medium',
    name: 'Dark Brown & Hazel Eyes',
    description: 'Medium skin with dark brown hair and hazel eyes',
    skinTone: { color: '#8B7355', name: 'Medium', undertone: 'neutral' },
    hairColor: { color: '#2F1B14', name: 'Dark Brown', category: 'brown' },
    eyeColor: { color: '#8E7618', name: 'Hazel', category: 'hazel' },
    colorSeason: 'autumn',
    complementaryColors: ['#DAA520', '#B8860B', '#CD853F', '#D2691E', '#BC8F8F', '#8B4513'],
    category: 'medium'
  },
  {
    id: 'black-amber-medium',
    name: 'Black Hair & Amber Eyes',
    description: 'Medium skin with black hair and amber eyes',
    skinTone: { color: '#8D5524', name: 'Medium', undertone: 'warm' },
    hairColor: { color: '#1C1C1C', name: 'Black', category: 'black' },
    eyeColor: { color: '#FFBF00', name: 'Amber', category: 'amber' },
    colorSeason: 'autumn',
    complementaryColors: ['#FFD700', '#FFA500', '#FF8C00', '#DEB887', '#CD853F', '#D2691E'],
    category: 'medium'
  },

  // OLIVE COMPLEXIONS
  {
    id: 'black-brown-olive',
    name: 'Black Hair & Brown Eyes (Olive)',
    description: 'Olive skin with black hair and brown eyes',
    skinTone: { color: '#8B7D6B', name: 'Olive', undertone: 'neutral' },
    hairColor: { color: '#000000', name: 'Black', category: 'black' },
    eyeColor: { color: '#8B4513', name: 'Brown', category: 'brown' },
    colorSeason: 'autumn',
    complementaryColors: ['#9ACD32', '#8FBC8F', '#6B8E23', '#556B2F', '#808000', '#BDB76B'],
    category: 'olive'
  },
  {
    id: 'dark-brown-green-olive',
    name: 'Dark Brown & Green Eyes (Olive)',
    description: 'Olive skin with dark brown hair and green eyes',
    skinTone: { color: '#967117', name: 'Olive', undertone: 'warm' },
    hairColor: { color: '#3C2415', name: 'Dark Brown', category: 'brown' },
    eyeColor: { color: '#228B22', name: 'Green', category: 'green' },
    colorSeason: 'autumn',
    complementaryColors: ['#9ACD32', '#8FBC8F', '#6B8E23', '#556B2F', '#32CD32', '#98FB98'],
    category: 'olive'
  },
  {
    id: 'auburn-hazel-olive',
    name: 'Auburn Hair & Hazel Eyes (Olive)',
    description: 'Olive skin with auburn hair and hazel eyes',
    skinTone: { color: '#8B6914', name: 'Olive', undertone: 'warm' },
    hairColor: { color: '#A0522D', name: 'Auburn', category: 'auburn' },
    eyeColor: { color: '#8E7618', name: 'Hazel', category: 'hazel' },
    colorSeason: 'autumn',
    complementaryColors: ['#DAA520', '#B8860B', '#8FBC8F', '#6B8E23', '#CD853F', '#D2691E'],
    category: 'olive'
  },

  // TAN COMPLEXIONS
  {
    id: 'black-brown-tan',
    name: 'Black Hair & Brown Eyes (Tan)',
    description: 'Tan skin with black hair and brown eyes',
    skinTone: { color: '#8B4513', name: 'Tan', undertone: 'warm' },
    hairColor: { color: '#000000', name: 'Black', category: 'black' },
    eyeColor: { color: '#654321', name: 'Brown', category: 'brown' },
    colorSeason: 'autumn',
    complementaryColors: ['#D2691E', '#CD853F', '#DEB887', '#F4A460', '#BC8F8F', '#A0522D'],
    category: 'tan'
  },
  {
    id: 'dark-brown-amber-tan',
    name: 'Dark Brown & Amber Eyes (Tan)',
    description: 'Tan skin with dark brown hair and amber eyes',
    skinTone: { color: '#A0522D', name: 'Tan', undertone: 'warm' },
    hairColor: { color: '#2F1B14', name: 'Dark Brown', category: 'brown' },
    eyeColor: { color: '#FFBF00', name: 'Amber', category: 'amber' },
    colorSeason: 'autumn',
    complementaryColors: ['#FFD700', '#FFA500', '#FF8C00', '#DEB887', '#CD853F', '#D2691E'],
    category: 'tan'
  },
  {
    id: 'black-hazel-tan',
    name: 'Black Hair & Hazel Eyes (Tan)',
    description: 'Tan skin with black hair and hazel eyes',
    skinTone: { color: '#8B4513', name: 'Tan', undertone: 'neutral' },
    hairColor: { color: '#1C1C1C', name: 'Black', category: 'black' },
    eyeColor: { color: '#8E7618', name: 'Hazel', category: 'hazel' },
    colorSeason: 'autumn',
    complementaryColors: ['#DAA520', '#B8860B', '#CD853F', '#D2691E', '#BC8F8F', '#8B4513'],
    category: 'tan'
  },

  // DARK COMPLEXIONS
  {
    id: 'black-brown-dark',
    name: 'Black Hair & Brown Eyes (Dark)',
    description: 'Dark skin with black hair and brown eyes',
    skinTone: { color: '#654321', name: 'Dark', undertone: 'warm' },
    hairColor: { color: '#000000', name: 'Black', category: 'black' },
    eyeColor: { color: '#8B4513', name: 'Brown', category: 'brown' },
    colorSeason: 'winter',
    complementaryColors: ['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#BC8F8F', '#DEB887'],
    category: 'dark'
  },
  {
    id: 'black-amber-dark',
    name: 'Black Hair & Amber Eyes (Dark)',
    description: 'Dark skin with black hair and amber eyes',
    skinTone: { color: '#5D4037', name: 'Dark', undertone: 'warm' },
    hairColor: { color: '#1C1C1C', name: 'Black', category: 'black' },
    eyeColor: { color: '#FFBF00', name: 'Amber', category: 'amber' },
    colorSeason: 'autumn',
    complementaryColors: ['#FFD700', '#FFA500', '#FF8C00', '#DEB887', '#CD853F', '#D2691E'],
    category: 'dark'
  },
  {
    id: 'black-hazel-dark',
    name: 'Black Hair & Hazel Eyes (Dark)',
    description: 'Dark skin with black hair and hazel eyes',
    skinTone: { color: '#5D4037', name: 'Dark', undertone: 'neutral' },
    hairColor: { color: '#000000', name: 'Black', category: 'black' },
    eyeColor: { color: '#8E7618', name: 'Hazel', category: 'hazel' },
    colorSeason: 'autumn',
    complementaryColors: ['#DAA520', '#B8860B', '#CD853F', '#D2691E', '#BC8F8F', '#8B4513'],
    category: 'dark'
  },

  // DEEP COMPLEXIONS
  {
    id: 'black-brown-deep',
    name: 'Black Hair & Brown Eyes (Deep)',
    description: 'Deep skin with black hair and brown eyes',
    skinTone: { color: '#3C2415', name: 'Deep', undertone: 'warm' },
    hairColor: { color: '#000000', name: 'Black', category: 'black' },
    eyeColor: { color: '#654321', name: 'Brown', category: 'brown' },
    colorSeason: 'winter',
    complementaryColors: ['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#BC8F8F', '#DEB887'],
    category: 'deep'
  },
  {
    id: 'black-amber-deep',
    name: 'Black Hair & Amber Eyes (Deep)',
    description: 'Deep skin with black hair and amber eyes',
    skinTone: { color: '#2F1B14', name: 'Deep', undertone: 'warm' },
    hairColor: { color: '#1C1C1C', name: 'Black', category: 'black' },
    eyeColor: { color: '#FFBF00', name: 'Amber', category: 'amber' },
    colorSeason: 'autumn',
    complementaryColors: ['#FFD700', '#FFA500', '#FF8C00', '#DEB887', '#CD853F', '#D2691E'],
    category: 'deep'
  },
  {
    id: 'black-hazel-deep',
    name: 'Black Hair & Hazel Eyes (Deep)',
    description: 'Deep skin with black hair and hazel eyes',
    skinTone: { color: '#2F1B14', name: 'Deep', undertone: 'neutral' },
    hairColor: { color: '#000000', name: 'Black', category: 'black' },
    eyeColor: { color: '#8E7618', name: 'Hazel', category: 'hazel' },
    colorSeason: 'autumn',
    complementaryColors: ['#DAA520', '#B8860B', '#CD853F', '#D2691E', '#BC8F8F', '#8B4513'],
    category: 'deep'
  },

  // GRAY/SILVER HAIR OPTIONS
  {
    id: 'silver-blue-fair',
    name: 'Silver Hair & Blue Eyes',
    description: 'Fair skin with silver hair and blue eyes',
    skinTone: { color: '#F5DEB3', name: 'Fair', undertone: 'cool' },
    hairColor: { color: '#C0C0C0', name: 'Silver', category: 'gray' },
    eyeColor: { color: '#6495ED', name: 'Blue', category: 'blue' },
    colorSeason: 'summer',
    complementaryColors: ['#E6E6FA', '#B0E0E6', '#F0F8FF', '#D2B48C', '#DDA0DD', '#C0C0C0'],
    category: 'fair'
  },
  {
    id: 'gray-brown-medium',
    name: 'Gray Hair & Brown Eyes',
    description: 'Medium skin with gray hair and brown eyes',
    skinTone: { color: '#8B7355', name: 'Medium', undertone: 'neutral' },
    hairColor: { color: '#808080', name: 'Gray', category: 'gray' },
    eyeColor: { color: '#8B4513', name: 'Brown', category: 'brown' },
    colorSeason: 'winter',
    complementaryColors: ['#C0C0C0', '#A9A9A9', '#696969', '#D2B48C', '#BC8F8F', '#8B4513'],
    category: 'medium'
  },

  // RED HAIR VARIATIONS
  {
    id: 'red-green-fair',
    name: 'Red Hair & Green Eyes',
    description: 'Fair skin with red hair and green eyes',
    skinTone: { color: '#FFDBAC', name: 'Fair', undertone: 'warm' },
    hairColor: { color: '#B22222', name: 'Red', category: 'red' },
    eyeColor: { color: '#228B22', name: 'Green', category: 'green' },
    colorSeason: 'autumn',
    complementaryColors: ['#228B22', '#006400', '#2E8B57', '#8FBC8F', '#98FB98', '#90EE90'],
    category: 'fair'
  },
  {
    id: 'red-blue-fair',
    name: 'Red Hair & Blue Eyes',
    description: 'Fair skin with red hair and blue eyes',
    skinTone: { color: '#FFEAA7', name: 'Fair', undertone: 'warm' },
    hairColor: { color: '#DC143C', name: 'Red', category: 'red' },
    eyeColor: { color: '#4169E1', name: 'Blue', category: 'blue' },
    colorSeason: 'spring',
    complementaryColors: ['#FFE4B5', '#FFDAB9', '#F0E68C', '#E6E6FA', '#B0E0E6', '#FFFACD'],
    category: 'fair'
  },

  // ADDITIONAL DIVERSE COMPLEXIONS
  // South Asian & Middle Eastern
  {
    id: 'black-brown-south-asian',
    name: 'South Asian Coloring',
    description: 'Warm olive skin with black hair and dark brown eyes',
    skinTone: { color: '#C8956D', name: 'Warm Olive', undertone: 'warm' },
    hairColor: { color: '#1A1A1A', name: 'Black', category: 'black' },
    eyeColor: { color: '#654321', name: 'Dark Brown', category: 'brown' },
    colorSeason: 'autumn',
    complementaryColors: ['#D2691E', '#CD853F', '#DEB887', '#F4A460', '#BC8F8F', '#8B4513'],
    category: 'olive'
  },
  {
    id: 'black-hazel-middle-eastern',
    name: 'Middle Eastern Coloring',
    description: 'Warm medium skin with black hair and hazel eyes',
    skinTone: { color: '#B8860B', name: 'Golden Medium', undertone: 'warm' },
    hairColor: { color: '#2F2F2F', name: 'Black', category: 'black' },
    eyeColor: { color: '#8E7618', name: 'Hazel', category: 'hazel' },
    colorSeason: 'autumn',
    complementaryColors: ['#DAA520', '#B8860B', '#CD853F', '#D2691E', '#BC8F8F', '#8B4513'],
    category: 'medium'
  },

  // East Asian Variations
  {
    id: 'black-brown-east-asian-cool',
    name: 'East Asian Cool Tones',
    description: 'Cool undertone skin with black hair and dark brown eyes',
    skinTone: { color: '#E6C2A6', name: 'Light with Cool Undertones', undertone: 'cool' },
    hairColor: { color: '#000000', name: 'Black', category: 'black' },
    eyeColor: { color: '#8B4513', name: 'Brown', category: 'brown' },
    colorSeason: 'winter',
    complementaryColors: ['#E6E6FA', '#B0E0E6', '#F0F8FF', '#D2B48C', '#DDA0DD', '#C0C0C0'],
    category: 'light'
  },
  {
    id: 'black-brown-east-asian-warm',
    name: 'East Asian Warm Tones',
    description: 'Warm undertone skin with black hair and brown eyes',
    skinTone: { color: '#DEB887', name: 'Light with Warm Undertones', undertone: 'warm' },
    hairColor: { color: '#1C1C1C', name: 'Black', category: 'black' },
    eyeColor: { color: '#654321', name: 'Brown', category: 'brown' },
    colorSeason: 'autumn',
    complementaryColors: ['#D2691E', '#CD853F', '#DEB887', '#F4A460', '#BC8F8F', '#8B4513'],
    category: 'light'
  },

  // African/Afro-Caribbean Variations
  {
    id: 'black-brown-rich-deep',
    name: 'Rich Deep Complexion',
    description: 'Beautiful deep skin with black hair and rich brown eyes',
    skinTone: { color: '#8B4513', name: 'Rich Deep', undertone: 'warm' },
    hairColor: { color: '#000000', name: 'Black', category: 'black' },
    eyeColor: { color: '#654321', name: 'Rich Brown', category: 'brown' },
    colorSeason: 'winter',
    complementaryColors: ['#FFD700', '#FFA500', '#FF8C00', '#DEB887', '#CD853F', '#D2691E'],
    category: 'deep'
  },
  {
    id: 'black-amber-ebony',
    name: 'Ebony Complexion',
    description: 'Stunning ebony skin with black hair and amber eyes',
    skinTone: { color: '#654321', name: 'Ebony', undertone: 'neutral' },
    hairColor: { color: '#1A1A1A', name: 'Black', category: 'black' },
    eyeColor: { color: '#FFBF00', name: 'Amber', category: 'amber' },
    colorSeason: 'winter',
    complementaryColors: ['#FFD700', '#FFA500', '#FF8C00', '#DEB887', '#CD853F', '#D2691E'],
    category: 'deep'
  },
  {
    id: 'black-brown-mahogany',
    name: 'Mahogany Complexion',
    description: 'Rich mahogany skin with black hair and warm brown eyes',
    skinTone: { color: '#A0522D', name: 'Mahogany', undertone: 'warm' },
    hairColor: { color: '#2F1B14', name: 'Black', category: 'black' },
    eyeColor: { color: '#8B4513', name: 'Warm Brown', category: 'brown' },
    colorSeason: 'autumn',
    complementaryColors: ['#D2691E', '#CD853F', '#DEB887', '#F4A460', '#BC8F8F', '#8B4513'],
    category: 'dark'
  },

  // Mixed Heritage & Multiracial
  {
    id: 'brown-hazel-mixed-heritage',
    name: 'Mixed Heritage Warm',
    description: 'Mixed heritage with warm brown hair and hazel eyes',
    skinTone: { color: '#D2B48C', name: 'Golden Tan', undertone: 'warm' },
    hairColor: { color: '#8B4513', name: 'Rich Brown', category: 'brown' },
    eyeColor: { color: '#8E7618', name: 'Hazel', category: 'hazel' },
    colorSeason: 'autumn',
    complementaryColors: ['#DAA520', '#B8860B', '#CD853F', '#D2691E', '#BC8F8F', '#8B4513'],
    category: 'tan'
  },
  {
    id: 'dark-brown-green-multiracial',
    name: 'Multiracial Cool Tones',
    description: 'Mixed heritage with cool undertones and striking green eyes',
    skinTone: { color: '#C8956D', name: 'Cool Tan', undertone: 'cool' },
    hairColor: { color: '#654321', name: 'Dark Brown', category: 'brown' },
    eyeColor: { color: '#228B22', name: 'Green', category: 'green' },
    colorSeason: 'summer',
    complementaryColors: ['#228B22', '#006400', '#2E8B57', '#8FBC8F', '#98FB98', '#90EE90'],
    category: 'tan'
  },

  // Latino/Hispanic Variations
  {
    id: 'black-brown-latino',
    name: 'Latino Warm Complexion',
    description: 'Warm Latino skin with black hair and brown eyes',
    skinTone: { color: '#CD853F', name: 'Caramel', undertone: 'warm' },
    hairColor: { color: '#2F1B14', name: 'Black', category: 'black' },
    eyeColor: { color: '#8B4513', name: 'Brown', category: 'brown' },
    colorSeason: 'autumn',
    complementaryColors: ['#D2691E', '#CD853F', '#DEB887', '#F4A460', '#BC8F8F', '#8B4513'],
    category: 'tan'
  },
  {
    id: 'dark-brown-hazel-hispanic',
    name: 'Hispanic Golden Tones',
    description: 'Golden Hispanic skin with dark brown hair and hazel eyes',
    skinTone: { color: '#DEB887', name: 'Golden', undertone: 'warm' },
    hairColor: { color: '#654321', name: 'Dark Brown', category: 'brown' },
    eyeColor: { color: '#8E7618', name: 'Hazel', category: 'hazel' },
    colorSeason: 'autumn',
    complementaryColors: ['#DAA520', '#B8860B', '#CD853F', '#D2691E', '#BC8F8F', '#8B4513'],
    category: 'medium'
  },

  // Indigenous & Native American
  {
    id: 'black-brown-indigenous',
    name: 'Indigenous Heritage',
    description: 'Indigenous skin tones with black hair and deep brown eyes',
    skinTone: { color: '#A0522D', name: 'Bronze', undertone: 'warm' },
    hairColor: { color: '#1A1A1A', name: 'Black', category: 'black' },
    eyeColor: { color: '#654321', name: 'Deep Brown', category: 'brown' },
    colorSeason: 'autumn',
    complementaryColors: ['#D2691E', '#CD853F', '#DEB887', '#F4A460', '#BC8F8F', '#8B4513'],
    category: 'dark'
  },

  // Mediterranean & Southern European
  {
    id: 'dark-brown-brown-mediterranean',
    name: 'Mediterranean Olive',
    description: 'Mediterranean olive skin with dark brown hair and brown eyes',
    skinTone: { color: '#9ACD32', name: 'Olive', undertone: 'neutral' },
    hairColor: { color: '#654321', name: 'Dark Brown', category: 'brown' },
    eyeColor: { color: '#8B4513', name: 'Brown', category: 'brown' },
    colorSeason: 'autumn',
    complementaryColors: ['#9ACD32', '#8FBC8F', '#6B8E23', '#556B2F', '#808000', '#BDB76B'],
    category: 'olive'
  },

  // Additional Fair Complexions (Northern European)
  {
    id: 'light-brown-blue-scandinavian',
    name: 'Scandinavian Fair',
    description: 'Very fair Scandinavian skin with light brown hair and blue eyes',
    skinTone: { color: '#FFF8DC', name: 'Porcelain', undertone: 'cool' },
    hairColor: { color: '#D2B48C', name: 'Light Brown', category: 'brown' },
    eyeColor: { color: '#87CEEB', name: 'Light Blue', category: 'blue' },
    colorSeason: 'summer',
    complementaryColors: ['#E6E6FA', '#B0E0E6', '#F0F8FF', '#D2B48C', '#DDA0DD', '#C0C0C0'],
    category: 'very-fair'
  }
];

// Helper functions
export const getPalettesByCategory = (category: string): ColorPalette[] => {
  return PREDEFINED_COLOR_PALETTES.filter(palette => palette.category === category);
};

export const getPaletteById = (id: string): ColorPalette | undefined => {
  return PREDEFINED_COLOR_PALETTES.find(palette => palette.id === id);
};

export const getAllCategories = (): string[] => {
  return [...new Set(PREDEFINED_COLOR_PALETTES.map(palette => palette.category))];
};

export const getPalettesByColorSeason = (season: string): ColorPalette[] => {
  return PREDEFINED_COLOR_PALETTES.filter(palette => palette.colorSeason === season);
};

// Get total count for reference
export const getTotalPaletteCount = (): number => {
  return PREDEFINED_COLOR_PALETTES.length;
};

// Get palettes by heritage/ethnicity for inclusive browsing
export const getPalettesByHeritage = () => {
  return {
    european: PREDEFINED_COLOR_PALETTES.filter(p =>
      p.id.includes('blonde') || p.id.includes('scandinavian') || p.id.includes('mediterranean')
    ),
    african: PREDEFINED_COLOR_PALETTES.filter(p =>
      p.id.includes('ebony') || p.id.includes('mahogany') || p.id.includes('rich-deep')
    ),
    asian: PREDEFINED_COLOR_PALETTES.filter(p =>
      p.id.includes('east-asian') || p.id.includes('south-asian')
    ),
    latino: PREDEFINED_COLOR_PALETTES.filter(p =>
      p.id.includes('latino') || p.id.includes('hispanic')
    ),
    middleEastern: PREDEFINED_COLOR_PALETTES.filter(p =>
      p.id.includes('middle-eastern')
    ),
    indigenous: PREDEFINED_COLOR_PALETTES.filter(p =>
      p.id.includes('indigenous')
    ),
    mixed: PREDEFINED_COLOR_PALETTES.filter(p =>
      p.id.includes('mixed') || p.id.includes('multiracial')
    )
  };
};
