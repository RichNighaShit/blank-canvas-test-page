
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { category, country = 'US', budget_max = 1000, colors = [] } = await req.json()

    console.log('Fetching products for:', { category, country, budget_max, colors })

    // Generate mock products
    const mockProducts = generateMockProducts(category, country, budget_max, colors)
    
    // Cache products in database with proper error handling
    for (const product of mockProducts) {
      try {
        const { error } = await supabase
          .from('shopping_products')
          .upsert({
            external_id: product.external_id,
            name: product.name,
            brand: product.brand,
            price: product.price,
            original_price: product.original_price,
            currency: product.currency,
            image_url: product.image_url,
            affiliate_url: product.affiliate_url,
            category: product.category,
            subcategory: product.subcategory,
            colors: product.colors,
            sizes: product.sizes,
            description: product.description,
            rating: product.rating,
            reviews_count: product.reviews_count,
            availability_countries: product.availability_countries,
            is_in_stock: product.is_in_stock,
            sustainability_score: product.sustainability_score,
            source_platform: product.source_platform,
            last_updated: new Date().toISOString()
          }, {
            onConflict: 'external_id,source_platform'
          })

        if (error) {
          console.error('Error upserting product:', error)
        }
      } catch (productError) {
        console.error('Error processing product:', productError)
      }
    }

    return new Response(
      JSON.stringify({ products: mockProducts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function generateMockProducts(category: string, country: string, budget_max: number, colors: string[]) {
  const brands = ['Nike', 'Adidas', 'Zara', 'H&M', 'Uniqlo', 'COS', 'Everlane', 'Reformation']
  const platforms = ['amazon', 'shopify', 'zalando', 'asos']
  
  const products = []
  
  for (let i = 0; i < 12; i++) {
    const brand = brands[Math.floor(Math.random() * brands.length)]
    const platform = platforms[Math.floor(Math.random() * platforms.length)]
    const price = Math.floor(Math.random() * budget_max * 0.8) + 20
    const originalPrice = Math.random() > 0.6 ? price + Math.floor(price * 0.3) : null
    
    const productColors = colors.length > 0 ? 
      colors.slice(0, Math.floor(Math.random() * 2) + 1) : 
      ['black', 'white', 'navy', 'gray'].slice(0, Math.floor(Math.random() * 2) + 1)
    
    products.push({
      external_id: `${platform}_${Date.now()}_${i}`,
      name: generateProductName(category, brand),
      brand: brand,
      price: price,
      original_price: originalPrice,
      currency: getCurrencyForCountry(country),
      image_url: `https://picsum.photos/400/500?random=${i + Date.now()}`,
      affiliate_url: `https://${platform}.com/product/${Date.now()}_${i}`,
      category: category,
      subcategory: getSubcategory(category),
      colors: productColors,
      sizes: generateSizes(category),
      description: `High-quality ${category} from ${brand}. Perfect for modern style.`,
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 - 5.0
      reviews_count: Math.floor(Math.random() * 500) + 50,
      availability_countries: getAvailableCountries(country),
      is_in_stock: Math.random() > 0.1, // 90% in stock
      sustainability_score: Math.round(Math.random() * 10 * 10) / 10,
      source_platform: platform,
    })
  }
  
  return products
}

function generateProductName(category: string, brand: string): string {
  const adjectives = ['Essential', 'Classic', 'Modern', 'Vintage', 'Premium', 'Casual', 'Elegant']
  const styles = {
    'tops': ['Blouse', 'Shirt', 'Sweater', 'Tank Top', 'Turtleneck'],
    'bottoms': ['Jeans', 'Trousers', 'Skirt', 'Shorts', 'Leggings'],
    'dresses': ['Midi Dress', 'Maxi Dress', 'Cocktail Dress', 'Wrap Dress', 'Shift Dress'],
    'outerwear': ['Blazer', 'Coat', 'Jacket', 'Cardigan', 'Trench'],
    'shoes': ['Sneakers', 'Boots', 'Heels', 'Flats', 'Sandals']
  }
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const style = styles[category] || ['Item']
  const styleItem = style[Math.floor(Math.random() * style.length)]
  
  return `${brand} ${adj} ${styleItem}`
}

function getSubcategory(category: string): string {
  const subcategories = {
    'tops': 'blouses',
    'bottoms': 'jeans',
    'dresses': 'midi',
    'outerwear': 'blazers',
    'shoes': 'sneakers'
  }
  return subcategories[category] || 'general'
}

function generateSizes(category: string): string[] {
  if (category === 'shoes') {
    return ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10']
  }
  return ['XS', 'S', 'M', 'L', 'XL']
}

function getCurrencyForCountry(country: string): string {
  const currencies = {
    'US': 'USD',
    'GB': 'GBP', 
    'DE': 'EUR',
    'FR': 'EUR',
    'CA': 'CAD',
    'AU': 'AUD',
    'JP': 'JPY'
  }
  return currencies[country] || 'USD'
}

function getAvailableCountries(primaryCountry: string): string[] {
  const regions = {
    'US': ['US', 'CA'],
    'GB': ['GB', 'IE', 'DE', 'FR'],
    'DE': ['DE', 'FR', 'IT', 'ES', 'NL'],
    'AU': ['AU', 'NZ'],
    'JP': ['JP', 'KR']
  }
  return regions[primaryCountry] || [primaryCountry]
}
