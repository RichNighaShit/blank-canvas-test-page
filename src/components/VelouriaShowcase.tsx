import React from 'react';
import { Palette, Feather, Sparkles, Heart } from 'lucide-react';

const VelouriaShowcase: React.FC = () => {
  return (
    <div className="hidden lg:block fixed top-1/2 right-8 transform -translate-y-1/2 z-30 space-y-4">
      <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/40 shadow-xl max-w-sm">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-400/40 to-pink-400/40 flex items-center justify-center backdrop-blur-sm">
            <Feather className="h-8 w-8 text-purple-600" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-serif text-xl text-slate-700 tracking-wide">Velouria</h3>
            <p className="text-xs text-slate-600 font-light tracking-widest uppercase">
              Ethereal Design System
            </p>
          </div>
          
          <div className="space-y-3 text-left">
            <div className="flex items-center space-x-3 text-xs text-slate-600">
              <Palette className="h-3 w-3 text-purple-400" />
              <span>Muse Color Palette</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-600">
              <Sparkles className="h-3 w-3 text-pink-400" />
              <span>Glassmorphism UI</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-600">
              <Heart className="h-3 w-3 text-rose-400" />
              <span>Poetic Interactions</span>
            </div>
          </div>
          
          <div className="pt-4 border-t border-white/20">
            <p className="text-xs text-slate-500 italic font-light">
              "Where technology meets poetry"
            </p>
          </div>
        </div>
      </div>
      
      {/* Color Palette Preview */}
      <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-lg">
        <div className="grid grid-cols-4 gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-300 to-purple-400 shadow-sm" title="Mauve"></div>
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-200 to-purple-300 shadow-sm" title="Lavender"></div>
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-300 to-rose-400 shadow-sm" title="Dusty Rose"></div>
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 shadow-sm" title="Misty Pearl"></div>
        </div>
      </div>
    </div>
  );
};

export default VelouriaShowcase;
