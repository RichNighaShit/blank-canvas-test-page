import React, { useState, useRef } from 'react';
import { Upload, Camera, Sparkles, Palette, Eye, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LiveColorDemo: React.FC = () => {
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const demoColors = [
    { name: 'Warm Autumn', color: 'bg-gradient-to-r from-orange-400 to-red-400', match: '96%' },
    { name: 'Deep Winter', color: 'bg-gradient-to-r from-blue-600 to-purple-600', match: '8%' },
    { name: 'Soft Summer', color: 'bg-gradient-to-r from-purple-300 to-pink-300', match: '23%' },
    { name: 'Clear Spring', color: 'bg-gradient-to-r from-green-400 to-yellow-400', match: '15%' }
  ];

  const analysisSteps = [
    'Analyzing facial features...',
    'Detecting skin undertones...',
    'Mapping color harmony...',
    'Generating palette...'
  ];

  const handleDemoClick = () => {
    setIsDemoActive(true);
    setAnalysisStep(0);
    
    // Simulate AI analysis
    const interval = setInterval(() => {
      setAnalysisStep(prev => {
        if (prev >= 3) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 800);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <section className="py-32 px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 via-white to-pink-50/40"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-3 bg-white/50 backdrop-blur-md rounded-full px-6 py-3 border border-white/60 shadow-lg mb-8">
            <Sparkles className="h-5 w-5 text-purple-400 animate-pulse" />
            <span className="text-sm font-medium text-slate-700 tracking-wide">Live AI Demo</span>
          </div>
          
          <h2 className="font-serif text-4xl lg:text-5xl text-slate-800 mb-6 leading-tight">
            See Your Perfect Colors
            <span className="block text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text italic">
              In Real Time
            </span>
          </h2>
          
          <p className="text-xl text-slate-600 font-light leading-relaxed max-w-2xl mx-auto">
            See how DripMuse analyzes your features to recommend the most flattering colors.
            Our AI considers skin tone, hair color, and eye color to create your personalized palette.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Demo Interface */}
          <div className="order-2 lg:order-1">
            <div className="bg-white/40 backdrop-blur-md rounded-3xl p-8 border border-white/50 shadow-xl">
              {!isDemoActive ? (
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Camera className="h-12 w-12 text-purple-600" />
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-serif text-2xl text-slate-700">Try Color Analysis</h3>
                    <p className="text-slate-600 font-light">
                      Upload a clear photo of yourself to see our AI in action
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <Button
                      onClick={handleDemoClick}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <Upload className="h-5 w-5 mr-3" />
                      Try Demo Analysis
                    </Button>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleDemoClick}
                    />
                    
                    <Button
                      onClick={handleFileUpload}
                      variant="outline"
                      className="w-full border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50"
                    >
                      <Camera className="h-5 w-5 mr-3" />
                      Upload Your Photo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Analysis Progress */}
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Eye className="h-8 w-8 text-white animate-pulse" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-serif text-xl text-slate-700">AI Analysis</h3>
                      <p className="text-sm text-slate-600">{analysisSteps[analysisStep]}</p>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-800"
                        style={{ width: `${((analysisStep + 1) / 4) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Results */}
                  {analysisStep >= 3 && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center justify-center space-x-2 text-green-600 mb-4">
                        <Check className="h-5 w-5" />
                        <span className="font-medium">Analysis Complete!</span>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-medium text-slate-700 text-center">Your Color Palette Matches:</h4>
                        {demoColors.map((colorType, index) => (
                          <div 
                            key={index}
                            className={`flex items-center justify-between p-3 rounded-xl border ${
                              index === 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full ${colorType.color}`}></div>
                              <span className="font-medium text-slate-700">{colorType.name}</span>
                            </div>
                            <span className={`font-bold ${index === 0 ? 'text-green-600' : 'text-gray-500'}`}>
                              {colorType.match}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <Button
                        onClick={() => setIsDemoActive(false)}
                        variant="outline"
                        className="w-full mt-4"
                      >
                        Try Another Photo
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="order-1 lg:order-2 space-y-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Palette className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-slate-700 mb-2">AI-Powered Analysis</h3>
                  <p className="text-slate-600 font-light leading-relaxed">
                    Our AI analyzes your facial features and coloring to determine your optimal color palette
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Eye className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-slate-700 mb-2">Quick Results</h3>
                  <p className="text-slate-600 font-light leading-relaxed">
                    Get your personalized color analysis results quickly with our trained AI model
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-400/20 to-purple-400/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-6 w-6 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-slate-700 mb-2">Personalized Recommendations</h3>
                  <p className="text-slate-600 font-light leading-relaxed">
                    Receive specific color codes, makeup suggestions, and wardrobe recommendations
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveColorDemo;
