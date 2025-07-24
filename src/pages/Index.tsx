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
  TrendingUp,
  Brain,
  Target,
  Heart,
  Smartphone,
  Clock,
  Shield,
  Trophy,
  Wand2,
  ChevronDown
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
      icon: Brain,
      title: 'AI Personal Stylist',
      description: 'Advanced machine learning algorithms analyze your style preferences, body type, and lifestyle to provide personalized outfit recommendations that evolve with your taste.',
      color: 'from-purple-500 to-purple-600',
      gradient: 'from-purple-500/10 to-purple-600/10',
      details: ['Color palette analysis', 'Body type considerations', 'Occasion-based suggestions', 'Weather integration']
    },
    {
      icon: Shirt,
      title: 'Smart Wardrobe Management',
      description: 'Upload photos of your clothes and let our AI automatically categorize, tag, and organize your entire wardrobe with intelligent visual recognition technology.',
      color: 'from-blue-500 to-blue-600',
      gradient: 'from-blue-500/10 to-blue-600/10',
      details: ['Automatic categorization', 'Visual search', 'Outfit history', 'Wear frequency tracking']
    },
    {
      icon: Wand2,
      title: 'Virtual Try-On Experience',
      description: 'See how outfits look on you with cutting-edge AR technology. Mix and match pieces virtually before making real-world style decisions.',
      color: 'from-pink-500 to-pink-600',
      gradient: 'from-pink-500/10 to-pink-600/10',
      details: ['AR visualization', 'Real-time fitting', 'Size adjustment', 'Multiple angles']
    },
    {
      icon: BarChart3,
      title: 'Style Analytics & Insights',
      description: 'Get detailed insights into your fashion patterns, color preferences, and style evolution with comprehensive analytics and trend tracking.',
      color: 'from-emerald-500 to-emerald-600',
      gradient: 'from-emerald-500/10 to-emerald-600/10',
      details: ['Style timeline', 'Color analysis', 'Trend identification', 'Preference learning']
    },
    {
      icon: Target,
      title: 'Smart Shopping Assistant',
      description: 'Never buy clothes that don\'t match your wardrobe again. Our AI suggests pieces that perfectly complement your existing items and fill style gaps.',
      color: 'from-orange-500 to-orange-600',
      gradient: 'from-orange-500/10 to-orange-600/10',
      details: ['Gap analysis', 'Budget optimization', 'Brand recommendations', 'Seasonal planning']
    },
    {
      icon: Heart,
      title: 'Personal Style Journey',
      description: 'Track your style evolution over time, set fashion goals, and receive guidance to develop your unique personal aesthetic with confidence.',
      color: 'from-rose-500 to-rose-600',
      gradient: 'from-rose-500/10 to-rose-600/10',
      details: ['Style development', 'Goal setting', 'Progress tracking', 'Confidence building']
    }
  ];

  const benefits = [
    'Save 30+ minutes every morning with instant outfit recommendations',
    'Discover hundreds of new style combinations from your existing wardrobe',
    'Make confident shopping decisions with AI-powered purchase guidance',
    'Track your fashion preferences and style evolution over time',
    'Get professional-level styling advice available 24/7',
    'Connect with a global community of fashion enthusiasts',
    'Reduce fashion waste by maximizing your wardrobe potential',
    'Build confidence with outfits tailored to your body type and lifestyle'
  ];

  const stats = [
    { number: '100K+', label: 'Active Users', icon: Users },
    { number: '5M+', label: 'Outfits Created', icon: Sparkles },
    { number: '98%', label: 'User Satisfaction', icon: Star },
    { number: '25M+', label: 'AI Recommendations', icon: TrendingUp }
  ];

  const howItWorks = [
    {
      step: 1,
      icon: Smartphone,
      title: 'Upload Your Wardrobe',
      description: 'Take photos of your clothes and let our AI automatically categorize and organize them'
    },
    {
      step: 2,
      icon: Brain,
      title: 'AI Learning',
      description: 'Our system learns your style preferences, body type, and lifestyle requirements'
    },
    {
      step: 3,
      icon: Wand2,
      title: 'Get Recommendations',
      description: 'Receive personalized outfit suggestions based on weather, occasion, and your unique style'
    },
    {
      step: 4,
      icon: Trophy,
      title: 'Style Evolution',
      description: 'Track your fashion journey and continuously improve your personal style confidence'
    }
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

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="flex flex-col items-center text-white/80">
              <span className="text-sm mb-2">Scroll to explore</span>
              <ChevronDown className="h-6 w-6" />
            </div>
          </div>
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
                  <Card key={index} className="card-interactive group border-0 shadow-elegant bg-white/80 backdrop-blur-sm animate-fade-in-up hover:shadow-glow transition-all duration-500" style={{ animationDelay: `${index * 0.1}s` }}>
                    <CardHeader className="pb-4">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-xl font-heading text-gray-900 mb-3">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed mb-4">{feature.description}</p>

                      {/* Feature details */}
                      <div className="space-y-2 mb-6">
                        {feature.details.map((detail, idx) => (
                          <div key={idx} className="flex items-center text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-3"></div>
                            {detail}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center text-purple-600 font-semibold group-hover:text-purple-700 transition-colors cursor-pointer">
                        <span>Explore Feature</span>
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-32 px-4 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto">
            <div className="text-center mb-20 animate-fade-in-up">
              <Badge variant="secondary" className="mb-6 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-0">
                <Clock className="mr-2 h-4 w-4" />
                Simple Process
              </Badge>
              <h2 className="text-section font-heading mb-6 text-gray-900">
                How DripMuse Works
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Get started in minutes and transform your style experience with our intuitive 4-step process
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              {/* Connection lines for desktop */}
              <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-200 via-blue-200 to-purple-200 transform -translate-y-1/2 z-0"></div>

              {howItWorks.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="relative z-10 text-center animate-fade-in-up" style={{ animationDelay: `${index * 0.2}s` }}>
                    <div className="relative mb-8">
                      <div className="w-20 h-20 mx-auto bg-white rounded-full shadow-elegant border-4 border-purple-100 flex items-center justify-center mb-4">
                        <Icon className="h-10 w-10 text-purple-600" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{step.step}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-heading text-gray-900 mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-16 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
              <Button
                size="lg"
                className="btn-premium text-lg px-10 py-4 text-white shadow-glow"
                onClick={() => navigate('/auth')}
              >
                <Sparkles className="mr-3 h-5 w-5" />
                Start Your Journey Today
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
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

        {/* Trust & Security Section */}
        <section className="py-20 px-4 bg-white border-y border-gray-100">
          <div className="container mx-auto">
            <div className="text-center mb-16 animate-fade-in-up">
              <h3 className="text-2xl font-heading mb-4 text-gray-900">Trusted by Fashion Lovers Worldwide</h3>
              <p className="text-muted-foreground">Your privacy and data security are our top priorities</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-2xl flex items-center justify-center">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Privacy Protected</h4>
                <p className="text-sm text-muted-foreground">Your photos and data are encrypted and never shared without permission</p>
              </div>

              <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">24/7 Support</h4>
                <p className="text-sm text-muted-foreground">Round-the-clock customer support to help with any questions</p>
              </div>

              <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-2xl flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Award Winning</h4>
                <p className="text-sm text-muted-foreground">Recognized as the #1 AI fashion platform by industry experts</p>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Social Proof */}
        <section className="py-32 px-4 text-center bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="max-w-6xl mx-auto">
            <div className="mb-16 animate-fade-in-up">
              <div className="flex justify-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-8 w-8 fill-yellow-400 text-yellow-400 mx-1" />
                ))}
              </div>
              <h3 className="text-3xl font-heading mb-4 text-gray-900">Loved by Fashion Enthusiasts Worldwide</h3>
              <p className="text-xl text-muted-foreground">Join thousands who've transformed their style journey</p>
            </div>

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-elegant animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <blockquote className="text-gray-700 mb-6 italic leading-relaxed">
                  "DripMuse completely transformed how I approach my wardrobe. The AI recommendations are spot-on!"
                </blockquote>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white font-bold">SJ</span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Sarah Johnson</p>
                    <p className="text-sm text-muted-foreground">Fashion Blogger</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-elegant animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <blockquote className="text-gray-700 mb-6 italic leading-relaxed">
                  "I save so much time in the morning and always feel confident in my outfit choices now."
                </blockquote>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold">MR</span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Mike Rodriguez</p>
                    <p className="text-sm text-muted-foreground">Marketing Director</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-elegant animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <blockquote className="text-gray-700 mb-6 italic leading-relaxed">
                  "The virtual try-on feature is amazing! I can see how clothes look before wearing them."
                </blockquote>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 flex items-center justify-center">
                    <span className="text-white font-bold">AL</span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Anna Lee</p>
                    <p className="text-sm text-muted-foreground">Graphic Designer</p>
                  </div>
                </div>
              </Card>
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

        {/* Footer */}
        <footer className="py-12 px-4 bg-white/10 backdrop-blur-sm border-t border-white/20">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <img
                    src="https://i.ibb.co/cSpbSRn7/logo.png"
                    alt="DripMuse Logo"
                    className="w-8 h-8 object-contain"
                  />
                  <span className="text-xl font-bold text-white">DripMuse</span>
                </div>
                <p className="text-white/80 text-sm leading-relaxed max-w-md">
                  Your AI-powered personal fashion stylist. Transform your wardrobe with intelligent
                  recommendations, color analysis, and style insights.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => navigate('/terms')}
                      className="text-white/70 hover:text-white text-sm transition-colors"
                    >
                      Terms of Use
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate('/privacy')}
                      className="text-white/70 hover:text-white text-sm transition-colors"
                    >
                      Privacy Policy
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-4">Support</h4>
                <ul className="space-y-2">
                  <li>
                    <span className="text-white/70 text-sm">
                      support@dripmuse.com
                    </span>
                  </li>
                  <li>
                    <span className="text-white/70 text-sm">
                      Available 24/7
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/20 mt-8 pt-8 text-center">
              <p className="text-white/60 text-sm">
                © 2024 DripMuse. All rights reserved. AI-powered fashion styling platform.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
