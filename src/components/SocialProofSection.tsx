import React from 'react';
import { Star, Users, TrendingUp, Heart } from 'lucide-react';

const SocialProofSection: React.FC = () => {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Marketing Director",
      content: "DripMuse completely transformed my confidence. The AI found colors I never would have tried - and they're perfect!",
      rating: 5,
      image: "bg-gradient-to-br from-pink-400 to-rose-400",
      saved: "$2,400"
    },
    {
      name: "Miguel Rodriguez",
      role: "Creative Designer",
      content: "As someone in fashion, I was skeptical. But DripMuse's color analysis is more accurate than human stylists.",
      rating: 5,
      image: "bg-gradient-to-br from-purple-400 to-blue-400",
      saved: "$1,800"
    },
    {
      name: "Priya Patel",
      role: "Software Engineer",
      content: "I saved 3 hours every week just on outfit planning. The AI knows my style better than I do!",
      rating: 5,
      image: "bg-gradient-to-br from-green-400 to-teal-400",
      saved: "$3,200"
    }
  ];

  const stats = [
    { number: "50K+", label: "Happy Users", icon: Users, description: "Trust DripMuse daily" },
    { number: "96%", label: "Accuracy Rate", icon: TrendingUp, description: "Color match precision" },
    { number: "$2,100", label: "Average Saved", icon: Heart, description: "Per user annually" },
    { number: "4.9/5", label: "User Rating", icon: Star, description: "App store rating" }
  ];

  return (
    <section className="py-32 px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-purple-50/30"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Stats Section */}
        <div className="text-center mb-20">
          <h2 className="font-serif text-4xl lg:text-5xl text-slate-800 mb-6 leading-tight">
            Trusted by Style Enthusiasts
            <span className="block text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text italic">
              Worldwide
            </span>
          </h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="text-3xl lg:text-4xl font-bold font-serif text-slate-800 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-lg font-medium text-slate-700 mb-1">
                    {stat.label}
                  </div>
                  <div className="text-sm text-slate-500 font-light">
                    {stat.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Testimonials */}
        <div className="space-y-12">
          <div className="text-center">
            <h3 className="font-serif text-3xl text-slate-800 mb-4">Real Stories, Real Results</h3>
            <p className="text-lg text-slate-600 font-light">
              See how DripMuse has transformed the style journey of thousands
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-white/60 backdrop-blur-md rounded-3xl p-8 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                {/* Rating */}
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                {/* Content */}
                <blockquote className="text-slate-700 font-light leading-relaxed mb-6 italic">
                  "{testimonial.content}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full ${testimonial.image} flex items-center justify-center text-white font-bold text-lg`}>
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-medium text-slate-800">{testimonial.name}</div>
                    <div className="text-sm text-slate-600">{testimonial.role}</div>
                  </div>
                </div>

                {/* Savings Highlight */}
                <div className="mt-6 pt-6 border-t border-white/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Money Saved:</span>
                    <span className="font-bold text-green-600 text-lg">{testimonial.saved}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-20 text-center">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span>Featured in Vogue</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-400"></div>
              <span>TechCrunch Startup</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-purple-400"></div>
              <span>Y Combinator W24</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-pink-400"></div>
              <span>Apple Design Award</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;
