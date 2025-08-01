import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import MuseIntroAnimation from '@/components/MuseIntroAnimation';
import PoeticStanzas from '@/components/PoetricStanzas';
import WatercolorCursor from '@/components/WatercolorCursor';
import AmbientSoundLayer from '@/components/AmbientSoundLayer';
import {
  Sparkles,
  ArrowRight,
  Feather,
  Moon,
  Star,
  Heart,
  Flower2,
  Palette,
  Camera,
  ChevronDown,
  User,
  LogIn
} from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
    setPageLoaded(true);
  };

  return (
    <div className="min-h-screen overflow-hidden relative" style={{ cursor: 'none' }}>
      {/* Intro Animation */}
      {showIntro && <MuseIntroAnimation onComplete={handleIntroComplete} />}

      {/* Watercolor Cursor */}
      {pageLoaded && <WatercolorCursor />}

      {/* Poetic Stanzas */}
      {pageLoaded && <PoeticStanzas />}

      {/* Ambient Sound Layer */}
      {pageLoaded && <AmbientSoundLayer />}
      {/* Botanical Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <pattern id="botanical" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <g opacity="0.3">
                <path d="M100 10 Q120 30 100 50 Q80 30 100 10" fill="url(#dustyRose)" />
                <path d="M150 80 Q170 100 150 120 Q130 100 150 80" fill="url(#lavender)" />
                <path d="M50 150 Q70 170 50 190 Q30 170 50 150" fill="url(#mauve)" />
              </g>
            </pattern>
            <linearGradient id="dustyRose" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(217, 175, 195)" />
              <stop offset="100%" stopColor="rgb(207, 159, 183)" />
            </linearGradient>
            <linearGradient id="lavender" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(230, 224, 244)" />
              <stop offset="100%" stopColor="rgb(218, 208, 236)" />
            </linearGradient>
            <linearGradient id="mauve" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(221, 190, 216)" />
              <stop offset="100%" stopColor="rgb(211, 176, 206)" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#botanical)" />
        </svg>
      </div>

      {/* Floating Navigation */}
      <nav className="fixed top-8 right-8 z-50 backdrop-blur-md bg-white/20 rounded-full px-6 py-3 border border-white/30 shadow-lg shadow-purple-100/20">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/auth')}
            className="text-sm text-slate-600 hover:text-slate-800 transition-colors duration-300 flex items-center space-x-2"
          >
            <LogIn className="h-4 w-4" />
            <span>Sign In</span>
          </button>
          <div className="w-px h-4 bg-slate-300"></div>
          <button 
            onClick={() => navigate('/auth')}
            className="text-sm bg-gradient-to-r from-purple-400/80 to-pink-400/80 text-white px-4 py-2 rounded-full hover:from-purple-500/80 hover:to-pink-500/80 transition-all duration-300 backdrop-blur-sm"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section - Editorial Magazine Style */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/60 via-pink-50/40 to-rose-50/60"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/40"></div>
        
        {/* Floating Watercolor Elements */}
        <div 
          className="absolute top-20 right-20 w-96 h-96 rounded-full opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgb(221, 190, 216) 0%, rgb(230, 224, 244) 50%, transparent 100%)',
            transform: `translateY(${scrollY * 0.2}px) rotate(${scrollY * 0.1}deg)`
          }}
        ></div>
        <div 
          className="absolute bottom-40 left-20 w-80 h-80 rounded-full opacity-25 blur-2xl"
          style={{
            background: 'radial-gradient(circle, rgb(217, 175, 195) 0%, rgb(207, 159, 183) 50%, transparent 100%)',
            transform: `translateY(${-scrollY * 0.15}px) rotate(${-scrollY * 0.05}deg)`
          }}
        ></div>

        {/* Abstract Female Silhouette */}
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-20">
          <svg viewBox="0 0 400 600" className="w-full h-full">
            <defs>
              <linearGradient id="silhouette" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(221, 190, 216)" stopOpacity="0.6" />
                <stop offset="50%" stopColor="rgb(230, 224, 244)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="rgb(217, 175, 195)" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path d="M200 50 Q220 70 215 100 Q210 140 200 180 Q195 220 190 280 Q185 350 180 420 Q175 480 170 540" 
                  stroke="url(#silhouette)" strokeWidth="40" fill="none" strokeLinecap="round" />
            <circle cx="200" cy="60" r="25" fill="url(#silhouette)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Content - Asymmetrical Layout */}
            <div className="space-y-12">
              {/* Floating Badge */}
              <div className="inline-flex items-center space-x-3 bg-white/40 backdrop-blur-md rounded-full px-6 py-3 border border-white/50 shadow-lg shadow-purple-100/20">
                <Sparkles className="h-5 w-5 text-purple-400 animate-pulse" />
                <span className="text-sm font-medium text-slate-700 tracking-wide">Velouria • Ethereal Style Discovery</span>
              </div>

              {/* Main Headline - Serif Typography */}
              <div className="space-y-6">
                <h1 className="font-serif text-6xl lg:text-7xl text-slate-800 leading-none tracking-tight">
                  <span className="block transform -rotate-1">Awaken</span>
                  <span className="block text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text transform rotate-1 ml-8">Your</span>
                  <span className="block transform -rotate-1">Inner Muse</span>
                </h1>

                <div className="space-y-4">
                  <p className="text-xl text-slate-600 font-light leading-relaxed max-w-lg">
                    Discover the poetry in your palette, the grace in your garments.
                    Let AI unveil the colors that make your soul sing.
                  </p>
                  <p className="text-sm text-slate-500 font-light italic tracking-widest">
                    — Powered by Velouria, the ethereal design system —
                  </p>
                </div>
              </div>

              {/* Floating Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <button 
                  onClick={() => navigate('/auth')}
                  className="group relative overflow-hidden bg-gradient-to-r from-purple-400/90 to-pink-400/90 text-white px-8 py-4 rounded-2xl backdrop-blur-md border border-white/30 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.8), rgba(236, 72, 153, 0.8))',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(168, 85, 247, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <span className="relative z-10 flex items-center space-x-3 text-lg font-medium">
                    <Palette className="h-5 w-5" />
                    <span>Begin Journey</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>

                <button 
                  onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                  className="group text-slate-600 hover:text-slate-800 transition-colors duration-300 flex items-center space-x-3"
                >
                  <div className="w-12 h-12 rounded-full bg-white/60 backdrop-blur-md border border-white/50 flex items-center justify-center group-hover:bg-white/80 transition-all duration-300">
                    <Camera className="h-5 w-5" />
                  </div>
                  <span className="text-lg font-light">Explore the Art</span>
                </button>
              </div>
            </div>

            {/* Right Content - Floating Cards */}
            <div className="relative">
              {/* Translucent Cards with Glassmorphism */}
              <div className="space-y-6 transform rotate-3">
                <div 
                  className="bg-white/30 backdrop-blur-md rounded-3xl p-8 border border-white/40 shadow-xl shadow-purple-100/20 transform -rotate-6 hover:rotate-0 transition-transform duration-700"
                  style={{ backdropFilter: 'blur(20px)' }}
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400/60 to-pink-400/60 flex items-center justify-center backdrop-blur-sm">
                      <Feather className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-serif text-slate-700">Color Harmony</h3>
                  </div>
                  <p className="text-slate-600 font-light leading-relaxed">
                    Uncover the hues that whisper to your essence, creating harmony between you and your wardrobe.
                  </p>
                </div>

                <div 
                  className="bg-white/25 backdrop-blur-md rounded-3xl p-8 border border-white/40 shadow-xl shadow-pink-100/20 transform rotate-6 hover:rotate-0 transition-transform duration-700 ml-12"
                  style={{ backdropFilter: 'blur(20px)' }}
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400/60 to-purple-400/60 flex items-center justify-center backdrop-blur-sm">
                      <Flower2 className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-serif text-slate-700">Intuitive Styling</h3>
                  </div>
                  <p className="text-slate-600 font-light leading-relaxed">
                    Let intuition guide your choices as AI learns the poetry of your personal aesthetic.
                  </p>
                </div>

                <div 
                  className="bg-white/35 backdrop-blur-md rounded-3xl p-8 border border-white/40 shadow-xl shadow-rose-100/20 transform -rotate-3 hover:rotate-0 transition-transform duration-700 mr-8"
                  style={{ backdropFilter: 'blur(20px)' }}
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400/60 to-rose-400/60 flex items-center justify-center backdrop-blur-sm">
                      <Heart className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-serif text-slate-700">Soulful Expression</h3>
                  </div>
                  <p className="text-slate-600 font-light leading-relaxed">
                    Express your inner world through thoughtful curation and mindful style choices.
                  </p>
                </div>
              </div>

              {/* Floating Botanical Elements */}
              <div className="absolute -top-8 -left-8 text-purple-300/40 animate-pulse">
                <Flower2 className="h-16 w-16 transform rotate-12" />
              </div>
              <div className="absolute -bottom-4 -right-4 text-pink-300/40 animate-pulse">
                <Star className="h-12 w-12 transform -rotate-12" />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="flex flex-col items-center space-y-2 text-slate-400">
            <span className="text-sm font-light">Scroll to explore</span>
            <ChevronDown className="h-6 w-6" />
          </div>
        </div>
      </section>

      {/* About Section - Poetic Layout */}
      <section className="relative py-32 px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-rose-50/60 via-white to-purple-50/40"></div>
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            {/* Centered Poetry */}
            <div className="lg:col-span-2 lg:col-start-2 text-center space-y-12">
              <div className="space-y-8">
                <h2 className="font-serif text-5xl lg:text-6xl text-slate-800 leading-tight tracking-tight">
                  Where Technology
                  <span className="block text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text italic">
                    Meets Poetry
                  </span>
                </h2>
                
                <div className="max-w-2xl mx-auto space-y-6 text-lg text-slate-600 font-light leading-relaxed">
                  <p>
                    In the delicate dance between science and art, we've crafted an experience 
                    that honors both your analytical mind and your creative spirit.
                  </p>
                  <p>
                    Each color recommendation is a verse, every outfit suggestion a stanza 
                    in the ongoing poem of your personal style journey.
                  </p>
                </div>
              </div>

              {/* Floating Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
                <div className="transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div 
                    className="bg-white/40 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300"
                    style={{ backdropFilter: 'blur(20px)' }}
                  >
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-400/40 to-pink-400/40 flex items-center justify-center backdrop-blur-sm">
                        <Palette className="h-8 w-8 text-purple-600" />
                      </div>
                      <h3 className="font-serif text-lg text-slate-700">Color Divination</h3>
                      <p className="text-sm text-slate-600 font-light leading-relaxed">
                        Unveil the colors that make your soul luminous through AI-powered analysis
                      </p>
                    </div>
                  </div>
                </div>

                <div className="transform rotate-2 hover:rotate-0 transition-transform duration-500 mt-8 md:mt-0">
                  <div 
                    className="bg-white/40 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300"
                    style={{ backdropFilter: 'blur(20px)' }}
                  >
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-rose-400/40 to-purple-400/40 flex items-center justify-center backdrop-blur-sm">
                        <Moon className="h-8 w-8 text-rose-600" />
                      </div>
                      <h3 className="font-serif text-lg text-slate-700">Wardrobe Sanctuary</h3>
                      <p className="text-sm text-slate-600 font-light leading-relaxed">
                        Curate your digital wardrobe like a sacred collection of treasured pieces
                      </p>
                    </div>
                  </div>
                </div>

                <div className="transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                  <div 
                    className="bg-white/40 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300"
                    style={{ backdropFilter: 'blur(20px)' }}
                  >
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-pink-400/40 to-rose-400/40 flex items-center justify-center backdrop-blur-sm">
                        <Sparkles className="h-8 w-8 text-pink-600" />
                      </div>
                      <h3 className="font-serif text-lg text-slate-700">Inspired Curation</h3>
                      <p className="text-sm text-slate-600 font-light leading-relaxed">
                        Receive outfit inspirations that honor your unique aesthetic vision
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Botanical Accents */}
        <div className="absolute top-20 left-20 opacity-20">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <path d="M60 10 Q80 30 60 50 Q40 30 60 10" fill="url(#dustyRose)" />
            <path d="M60 50 Q80 70 60 90 Q40 70 60 50" fill="url(#lavender)" />
            <path d="M60 90 Q80 110 60 130 Q40 110 60 90" fill="url(#mauve)" />
          </svg>
        </div>
      </section>

      {/* Call to Action - Dreamy Finale */}
      <section className="relative py-32 px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-100/60 via-pink-50/40 to-rose-100/60"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-white/30 to-white/60"></div>
        
        {/* Floating Watercolor Background */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="absolute top-20 left-20 w-96 h-96 rounded-full bg-gradient-radial from-purple-200/60 via-pink-200/40 to-transparent blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-gradient-radial from-rose-200/60 via-purple-200/40 to-transparent blur-2xl"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-8">
            <div className="inline-flex items-center space-x-3 bg-white/50 backdrop-blur-md rounded-full px-6 py-3 border border-white/60 shadow-lg">
              <Star className="h-5 w-5 text-purple-400 animate-pulse" />
              <span className="text-sm font-medium text-slate-700 tracking-wide">Begin Your Transformation</span>
            </div>

            <h2 className="font-serif text-5xl lg:text-6xl text-slate-800 leading-tight tracking-tight">
              Step Into Your
              <span className="block text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text italic">
                Style Renaissance
              </span>
            </h2>

            <p className="text-xl text-slate-600 font-light leading-relaxed max-w-2xl mx-auto">
              Every masterpiece begins with a single brushstroke. 
              Your journey to authentic style starts with one beautiful moment of discovery.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 items-center justify-center">
            <button 
              onClick={() => navigate('/auth')}
              className="group relative overflow-hidden px-12 py-5 rounded-2xl transition-all duration-500 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.9), rgba(236, 72, 153, 0.9))',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 20px 40px rgba(168, 85, 247, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              }}
            >
              <span className="relative z-10 flex items-center space-x-4 text-white text-xl font-medium">
                <Palette className="h-6 w-6" />
                <span>Discover Your Colors</span>
                <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>
          </div>

          {/* Floating Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-16 text-sm text-slate-500">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span>Trusted by thousands</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-purple-400"></div>
              <span>AI-powered precision</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-pink-400"></div>
              <span>Intuitive & beautiful</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
