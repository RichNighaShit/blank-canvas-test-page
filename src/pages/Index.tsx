
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import ModernHeader from '@/components/ModernHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Shirt, 
  BarChart3, 
  ShoppingBag, 
  Camera, 
  Users, 
  ArrowRight,
  Check,
  Star,
  Zap,
  Crown,
  Palette,
  TrendingUp
} from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: Sparkles,
      title: 'Style Assistant',
      description: 'Get personalized outfit recommendations tailored to your unique style preferences',
      color: 'from-purple-500 to-purple-600',
      gradient: 'from-purple-500/10 to-purple-600/10'
    },
    {
      icon: Shirt,
      title: 'Smart Wardrobe',
      description: 'Organize your entire wardrobe with intelligent categorization and visual search capabilities',
      color: 'from-blue-500 to-blue-600',
      gradient: 'from-blue-500/10 to-blue-600/10'
    },
    {
      icon: Camera,
      title: 'Virtual Try-On',
      description: 'See how outfits look on you with our advanced AR technology before you wear them',
      color: 'from-pink-500 to-pink-600',
      gradient: 'from-pink-500/10 to-pink-600/10'
    },
    {
      icon: BarChart3,
      title: 'Style Analytics',
      description: 'Track your style evolution with detailed insights into your fashion patterns and preferences',
      color: 'from-emerald-500 to-emerald-600',
      gradient: 'from-emerald-500/10 to-emerald-600/10'
    },
    {
      icon: ShoppingBag,
      title: 'Smart Shopping',
      description: 'Discover pieces that perfectly complement your existing wardrobe with AI-powered suggestions',
      color: 'from-orange-500 to-orange-600',
      gradient: 'from-orange-500/10 to-orange-600/10'
    },
    {
      icon: Users,
      title: 'Style Community',
      description: 'Connect with fashion enthusiasts, share your looks, and get inspired by others',
      color: 'from-indigo-500 to-indigo-600',
      gradient: 'from-indigo-500/10 to-indigo-600/10'
    }
  ];

  const benefits = [
    'Save 30+ minutes every morning choosing outfits',
    'Discover new style combinations from your existing wardrobe',
    'Make smarter shopping decisions with AI guidance',
    'Track your fashion preferences and style evolution',
    'Get professional styling advice powered by AI',
    'Connect with a community of fashion enthusiasts'
  ];

  const stats = [
    { number: '50K+', label: 'Fashion Enthusiasts', icon: Users },
    { number: '2M+', label: 'Outfits Created', icon: Sparkles },
    { number: '95%', label: 'Satisfaction Rate', icon: Star },
    { number: '10M+', label: 'Style Recommendations', icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <ModernHeader />
      
      <div className="relative overflow-hidden">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-pink-600/5"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(168,85,247,0.1),transparent)] animate-pulse-soft"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(236,72,153,0.1),transparent)] animate-pulse-soft"></div>
          
          <div className="relative z-10 max-w-6xl mx-auto text-center">
            <div className="animate-fade-in-up">
              <Badge variant="secondary" className="mb-8 px-6 py-3 text-lg font-semibold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-0">
                <Crown className="mr-2 h-5 w-5" />
                The Future of Personal Styling
              </Badge>
            </div>
            
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <h1 className="text-display font-heading mb-8 bg-gradient-to-r from-purple-900 via-purple-700 to-pink-700 bg-clip-text text-transparent leading-tight">
                Your Personal Style Revolution
              </h1>
            </div>
            
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed font-light">
                Transform your wardrobe experience with AI-powered outfit recommendations, 
                smart organization, and personalized style insights that evolve with your unique taste.
              </p>
            </div>
            
            <div className="animate-fade-in-up flex flex-col sm:flex-row gap-6 justify-center items-center" style={{ animationDelay: '0.3s' }}>
              <Button 
                size="lg" 
                className="btn-premium text-xl px-12 py-6 text-white shadow-glow"
                onClick={() => navigate('/auth')}
              >
                Start Your Style Journey
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-xl px-12 py-6 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300"
                onClick={() => navigate('/virtual-try-on')}
              >
                <Zap className="mr-3 h-6 w-6" />
                Try Virtual Try-On
              </Button>
            </div>
          </div>
          
          {/* Floating elements */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 animate-float"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-10 animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-20 w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full opacity-15 animate-float" style={{ animationDelay: '2s' }}></div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-white/50 backdrop-blur-sm border-y border-purple-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
                      <Icon className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="text-4xl font-bold font-heading text-gray-900 mb-2">{stat.number}</div>
                    <div className="text-muted-foreground font-medium">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-32 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-20 animate-fade-in-up">
              <Badge variant="secondary" className="mb-6 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-0">
                <Palette className="mr-2 h-4 w-4" />
                Exclusive Features
              </Badge>
              <h2 className="text-section font-heading mb-6 text-gray-900">
                Everything You Need for Style Success
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Comprehensive tools designed to enhance your fashion experience with modern technology
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="card-interactive group border-0 shadow-elegant bg-white/80 backdrop-blur-sm animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <CardHeader className="pb-4">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-2xl font-heading text-gray-900">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-lg leading-relaxed mb-6">{feature.description}</p>
                      <div className="flex items-center text-purple-600 font-semibold group-hover:text-purple-700 transition-colors">
                        <span>Learn More</span>
                        <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-32 bg-gradient-to-br from-purple-50 to-pink-50 mx-4 rounded-3xl">
          <div className="max-w-6xl mx-auto px-8 text-center">
            <div className="animate-fade-in-up">
              <h2 className="text-section font-heading mb-6 text-gray-900">
                Why Fashion Lovers Choose DripMuse
              </h2>
              <p className="text-xl text-muted-foreground mb-16 max-w-3xl mx-auto">
                Join thousands who've transformed their style experience with our premium platform
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-4 animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-lg text-gray-700 font-medium">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-32 px-4 text-center">
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="flex justify-center mb-8">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-8 w-8 fill-yellow-400 text-yellow-400 mx-1" />
              ))}
            </div>
            <h3 className="text-3xl font-heading mb-6 text-gray-900">Loved by Fashion Enthusiasts Worldwide</h3>
            <blockquote className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto italic leading-relaxed">
              "DripMuse completely transformed how I approach my wardrobe. The AI recommendations are incredibly accurate, 
              and I've discovered so many new outfit combinations I never would have thought of. It's like having a personal stylist available 24/7!"
            </blockquote>
            <div className="flex items-center justify-center space-x-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">SJ</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 text-lg">Sarah Johnson</p>
                <p className="text-muted-foreground">Fashion Blogger & Influencer</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-4 text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            <h2 className="text-section font-heading mb-6">
              Ready to Transform Your Style?
            </h2>
            <p className="text-xl mb-12 max-w-2xl mx-auto opacity-90 leading-relaxed">
              Join the style revolution and discover your perfect look with our AI-powered personal styling platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-white text-purple-600 hover:bg-gray-50 text-xl px-12 py-6 font-bold shadow-floating"
                onClick={() => navigate('/auth')}
              >
                Get Started for Free
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
              <p className="text-sm opacity-75">No credit card required • Free forever plan available</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
