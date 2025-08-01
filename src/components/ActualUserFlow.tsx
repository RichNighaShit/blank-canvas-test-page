import React from 'react';
import { ArrowRight, CheckCircle, User, Palette, Camera, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const ActualUserFlow: React.FC = () => {
  const userFlowSteps = [
    {
      step: 1,
      icon: User,
      title: "Sign Up & Onboarding",
      description: "Create your account and complete the guided onboarding process",
      details: [
        "Email verification",
        "Basic profile setup",
        "Style quiz completion",
        "Terms acceptance"
      ],
      timeEstimate: "5 minutes",
      status: "active"
    },
    {
      step: 2,
      icon: Palette,
      title: "Color Palette Setup",
      description: "Set up your personal color palette using our guided system",
      details: [
        "Choose seasonal palette",
        "Set color preferences",
        "View color theory guidance",
        "Save your palette"
      ],
      timeEstimate: "3 minutes",
      status: "active"
    },
    {
      step: 3,
      icon: Camera,
      title: "Upload Your Wardrobe",
      description: "Add your clothing items with our AI-powered upload system",
      details: [
        "Take/upload photos",
        "AI categorization",
        "Add tags and details",
        "Organize by category"
      ],
      timeEstimate: "10-30 minutes",
      status: "active"
    },
    {
      step: 4,
      icon: Sparkles,
      title: "Get Recommendations",
      description: "Start receiving AI-powered outfit suggestions",
      details: [
        "Set occasion preferences",
        "Weather consideration",
        "Personal style matching",
        "Plan future outfits"
      ],
      timeEstimate: "Ongoing",
      status: "active"
    }
  ];

  return (
    <section className="py-32 px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-bl from-purple-50/40 via-white to-pink-50/40"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-flex items-center space-x-3 bg-white/50 backdrop-blur-md rounded-full px-6 py-3 border border-white/60 shadow-lg mb-8">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-slate-700 tracking-wide">How It Actually Works</span>
          </div>
          
          <h2 className="font-serif text-4xl lg:text-5xl text-slate-800 mb-6 leading-tight">
            Your Real Journey
            <span className="block text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text italic">
              From Setup to Style
            </span>
          </h2>
          
          <p className="text-xl text-slate-600 font-light leading-relaxed max-w-2xl mx-auto">
            Here's exactly what happens when you join DripMuse - the actual steps, 
            real time estimates, and working features you'll use.
          </p>
        </div>

        <div className="space-y-8">
          {userFlowSteps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === userFlowSteps.length - 1;
            
            return (
              <div key={step.step} className="relative">
                <Card className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/50 shadow-lg">
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
                      {/* Step Number & Icon */}
                      <div className="text-center lg:text-left">
                        <div className="relative inline-block">
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4 mx-auto lg:mx-0">
                            <Icon className="h-10 w-10 text-purple-600" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{step.step}</span>
                          </div>
                        </div>
                        <div className="text-sm text-slate-500 font-medium">
                          {step.timeEstimate}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="lg:col-span-2 text-center lg:text-left">
                        <h3 className="text-2xl font-serif text-slate-800 mb-3">{step.title}</h3>
                        <p className="text-slate-600 font-light leading-relaxed mb-4">{step.description}</p>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {step.details.map((detail, idx) => (
                            <div key={idx} className="flex items-center text-sm text-slate-600">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              <span>{detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="text-center lg:text-right">
                        <div className="inline-flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Working</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Connector Arrow */}
                {!isLast && (
                  <div className="flex justify-center my-6">
                    <ArrowRight className="h-8 w-8 text-purple-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center">
          <Card className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-rose-500/10 backdrop-blur-md rounded-3xl p-8 border border-white/50 shadow-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-serif text-slate-800 mb-4">Ready to Start?</h3>
            <p className="text-slate-600 font-light mb-6 leading-relaxed">
              Everything above is real and working right now. 
              No waiting, no "coming soon" features - just a complete style management platform.
            </p>
            <div className="text-sm text-slate-500">
              Complete setup typically takes 15-20 minutes for full functionality
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ActualUserFlow;
