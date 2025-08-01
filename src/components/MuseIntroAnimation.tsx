import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  direction: number;
  color: string;
}

const MuseIntroAnimation: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Create floating particles
    const createParticles = () => {
      const newParticles: Particle[] = [];
      const colors = [
        'rgba(221, 190, 216, 0.6)', // mauve
        'rgba(230, 224, 244, 0.7)', // lavender
        'rgba(217, 175, 195, 0.5)', // dusty rose
        'rgba(248, 245, 250, 0.8)', // misty pearl
      ];

      for (let i = 0; i < 30; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * 4 + 2,
          opacity: Math.random() * 0.6 + 0.2,
          speed: Math.random() * 2 + 0.5,
          direction: Math.random() * Math.PI * 2,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
      setParticles(newParticles);
    };

    createParticles();

    // Animate particles
    const animateParticles = () => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        x: particle.x + Math.cos(particle.direction) * particle.speed,
        y: particle.y + Math.sin(particle.direction) * particle.speed,
        opacity: particle.opacity * 0.99, // Gradual fade
      })));
    };

    const interval = setInterval(animateParticles, 50);

    // Complete animation after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 800); // Allow fade out
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  if (!isVisible) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-gradient-to-br from-purple-50/80 via-pink-50/60 to-rose-50/80 backdrop-blur-sm transition-opacity duration-800 opacity-0 pointer-events-none"
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-50/80 via-pink-50/60 to-rose-50/80 backdrop-blur-sm">
      {/* Floating Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full pointer-events-none transition-opacity duration-300"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            filter: 'blur(1px)',
          }}
        />
      ))}

      {/* Central Logo/Brand Animation */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-6 animate-fade-in-scale">
          <div className="relative">
            <h1 className="font-serif text-6xl lg:text-8xl text-slate-800/80 tracking-tight">
              <span className="inline-block animate-float" style={{ animationDelay: '0s' }}>V</span>
              <span className="inline-block animate-float" style={{ animationDelay: '0.1s' }}>e</span>
              <span className="inline-block animate-float" style={{ animationDelay: '0.2s' }}>l</span>
              <span className="inline-block animate-float" style={{ animationDelay: '0.3s' }}>o</span>
              <span className="inline-block animate-float" style={{ animationDelay: '0.4s' }}>u</span>
              <span className="inline-block animate-float" style={{ animationDelay: '0.5s' }}>r</span>
              <span className="inline-block animate-float" style={{ animationDelay: '0.6s' }}>i</span>
              <span className="inline-block animate-float" style={{ animationDelay: '0.7s' }}>a</span>
            </h1>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/30 via-pink-400/30 to-rose-400/30 blur-3xl rounded-full opacity-50"></div>
          </div>
          <p className="text-lg text-slate-600/70 font-light tracking-widest animate-fade-in" style={{ animationDelay: '1s' }}>
            awakening your inner muse
          </p>
        </div>
      </div>

      {/* Watercolor wash effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent animate-pulse"></div>
    </div>
  );
};

export default MuseIntroAnimation;
