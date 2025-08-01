import React from 'react';
import { Palette, Shirt, Sparkles, Calendar, BarChart3, Camera, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const RealFeaturesShowcase: React.FC = () => {
  const actualFeatures = [
    {
      icon: Palette,
      title: "Color Analysis & Palette Setup",
      description: "Set up your personal color palette with our guided analysis system.",
      implemented: true,
      path: "/dashboard",
      features: ["Winter/Spring/Summer/Autumn palettes", "Skin tone analysis guidance", "Personal color preferences", "Color theory application"]
    },
    {
      icon: Shirt,
      title: "Digital Wardrobe Management",
      description: "Upload and organize your clothing items with AI-powered categorization.",
      implemented: true,
      path: "/wardrobe",
      features: ["Photo upload system", "Automatic categorization", "Tag management", "Search and filter"]
    },
    {
      icon: Sparkles,
      title: "AI Style Recommendations",
      description: "Get personalized outfit suggestions based on your wardrobe and preferences.",
      implemented: true,
      path: "/recommendations",
      features: ["Weather-based suggestions", "Occasion matching", "Style preference learning", "Confidence scoring"]
    },
    {
      icon: Calendar,
      title: "Outfit Planning",
      description: "Plan your outfits in advance for specific dates and occasions.",
      implemented: true,
      path: "/recommendations",
      features: ["Calendar integration", "Event planning", "Outfit scheduling", "Notes and reminders"]
    },
    {
      icon: BarChart3,
      title: "Wardrobe Analytics",
      description: "Track your style patterns and wardrobe usage with detailed insights.",
      implemented: true,
      path: "/analytics",
      features: ["Wear frequency tracking", "Color usage analysis", "Style pattern insights", "Wardrobe optimization tips"]
    },
    {
      icon: Target,
      title: "Style Profile Setup",
      description: "Create your personal style profile to get better recommendations.",
      implemented: true,
      path: "/edit-profile",
      features: ["Style preferences", "Body type settings", "Lifestyle factors", "Color preferences"]
    }
  ];

  return (
    <section className="py-32 px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-purple-50/30"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-flex items-center space-x-3 bg-white/50 backdrop-blur-md rounded-full px-6 py-3 border border-white/60 shadow-lg mb-8">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <span className="text-sm font-medium text-slate-700 tracking-wide">Actual Features</span>
          </div>
          
          <h2 className="font-serif text-4xl lg:text-5xl text-slate-800 mb-6 leading-tight">
            What DripMuse
            <span className="block text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text italic">
              Actually Does
            </span>
          </h2>
          
          <p className="text-xl text-slate-600 font-light leading-relaxed max-w-2xl mx-auto">
            These are the real, working features you can use right now in DripMuse.
            No demos, no mockups - just actual functionality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {actualFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 group h-full"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-8 w-8 text-purple-600" />
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                      Live
                    </Badge>
                  </div>
                  
                  <CardTitle className="text-xl font-serif text-slate-800 mb-3">{feature.title}</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-slate-600 font-light leading-relaxed">{feature.description}</p>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">What you can do:</h4>
                    {feature.features.map((item, idx) => (
                      <div key={idx} className="flex items-center text-sm text-slate-600">
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-3 flex-shrink-0"></div>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t border-white/30">
                    <div className="text-xs text-slate-500">
                      Available at: <span className="font-mono bg-slate-100 px-2 py-1 rounded">{feature.path}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Current Status */}
        <div className="mt-20 text-center">
          <Card className="bg-white/40 backdrop-blur-md rounded-2xl p-8 border border-white/50 shadow-lg max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
              <span className="font-medium text-slate-700">System Status</span>
            </div>
            <h3 className="text-xl font-serif text-slate-800 mb-3">All Features Operational</h3>
            <p className="text-slate-600 font-light">
              DripMuse is fully functional with all core features working. 
              Create your account to access the complete style management platform.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default RealFeaturesShowcase;
