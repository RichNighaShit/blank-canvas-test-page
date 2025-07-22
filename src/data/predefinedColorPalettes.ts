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
