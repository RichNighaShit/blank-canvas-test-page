
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, ShoppingCart, Heart, Star, Loader2, AlertCircle, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  currency: string;
  image: string;
  affiliateUrl: string;
  category: string;
  rating: number;
  reviews: number;
  inStock: boolean;
}

export const SmartShoppingSuggestions = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hasWardrobe, setHasWardrobe] = useState<boolean | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      checkUserWardrobe();
      loadProducts();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkUserWardrobe = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (error) throw error;
      setHasWardrobe(data && data.length > 0);
    } catch (error) {
      console.error('Error checking wardrobe:', error);
      setHasWardrobe(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // Generate sample products for demonstration
      const sampleProducts: Product[] = [
        {
          id: '1',
          name: 'Classic White Button Shirt',
          brand: 'Everlane',
          price: 68,
          originalPrice: 85,
          currency: 'USD',
          image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=500&fit=crop',
          affiliateUrl: 'https://example.com/shirt1',
          category: 'tops',
          rating: 4.5,
          reviews: 1234,
          inStock: true
        },
        {
          id: '2',
          name: 'High-Waisted Denim Jeans',
          brand: 'Levi\'s',
          price: 89,
          originalPrice: 120,
          currency: 'USD',
          image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=500&fit=crop',
          affiliateUrl: 'https://example.com/jeans1',
          category: 'bottoms',
          rating: 4.3,
          reviews: 892,
          inStock: true
        },
        {
          id: '3',
          name: 'Minimalist Sneakers',
          brand: 'Allbirds',
          price: 98,
          currency: 'USD',
          image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=500&fit=crop',
          affiliateUrl: 'https://example.com/sneakers1',
          category: 'shoes',
          rating: 4.7,
          reviews: 2156,
          inStock: true
        },
        {
          id: '4',
          name: 'Midi Wrap Dress',
          brand: 'Reformation',
          price: 158,
          originalPrice: 198,
          currency: 'USD',
          image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop',
          affiliateUrl: 'https://example.com/dress1',
          category: 'dresses',
          rating: 4.6,
          reviews: 567,
          inStock: false
        },
        {
          id: '5',
          name: 'Cashmere Blend Sweater',
          brand: 'COS',
          price: 125,
          currency: 'USD',
          image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=500&fit=crop',
          affiliateUrl: 'https://example.com/sweater1',
          category: 'tops',
          rating: 4.4,
          reviews: 234,
          inStock: true
        },
        {
          id: '6',
          name: 'Tailored Blazer',
          brand: 'Mango',
          price: 79,
          originalPrice: 99,
          currency: 'USD',
          image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop',
          affiliateUrl: 'https://example.com/blazer1',
          category: 'outerwear',
          rating: 4.2,
          reviews: 445,
          inStock: true
        }
      ];

      setProducts(sampleProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error loading products",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(products.map(p => p.category))];

  if (!user) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
          <p className="text-muted-foreground mb-4">
            Please sign in to get personalized shopping suggestions
          </p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </CardContent>
      </Card>
    );
  }

  if (hasWardrobe === false) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-8 text-center">
          <Upload className="h-12 w-12 mx-auto mb-4 text-orange-600" />
          <h3 className="text-lg font-semibold mb-2">Build Your Wardrobe First</h3>
          <p className="text-muted-foreground mb-4">
            Upload some wardrobe items to get personalized shopping suggestions based on your style and gaps in your wardrobe.
          </p>
          <Button onClick={() => navigate('/wardrobe')}>
            Add Wardrobe Items
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading personalized suggestions...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Smart Shopping Suggestions
          </CardTitle>
          <p className="text-muted-foreground">
            Curated products that complement your existing wardrobe
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Showing {filteredProducts.length} products
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square relative overflow-hidden bg-muted">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.originalPrice && (
                <Badge variant="destructive" className="absolute top-2 left-2">
                  {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                </Badge>
              )}
              {!product.inStock && (
                <Badge variant="secondary" className="absolute top-2 right-2">
                  Out of Stock
                </Badge>
              )}
            </div>
            
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium line-clamp-2">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.brand}</p>
                </div>
                
                <div className="flex items-center gap-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-3 w-3 ${
                          i < Math.floor(product.rating) 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-300'
                        }`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{product.rating}</span>
                  <span className="text-sm text-muted-foreground">({product.reviews})</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{product.currency} {product.price}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      {product.currency} {product.originalPrice}
                    </span>
                  )}
                </div>
                
                <Button 
                  className="w-full" 
                  disabled={!product.inStock}
                  asChild
                >
                  <a href={product.affiliateUrl} target="_blank" rel="noopener noreferrer">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {product.inStock ? 'Shop Now' : 'Out of Stock'}
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
