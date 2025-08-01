import React, { useEffect, useState } from 'react';

const ParallaxBackground: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Layer 1 - Furthest Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          transform: `translateY(${scrollY * 0.1}px)`,
          background: `radial-gradient(circle at ${20 + scrollY * 0.01}% ${30 + scrollY * 0.005}%, 
            rgba(221, 190, 216, 0.4) 0%, 
            transparent 50%)`
        }}
      />
      
      {/* Layer 2 - Middle Background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          transform: `translateY(${scrollY * 0.2}px) rotate(${scrollY * 0.01}deg)`,
          background: `radial-gradient(circle at ${80 - scrollY * 0.01}% ${70 - scrollY * 0.005}%, 
            rgba(230, 224, 244, 0.3) 0%, 
            transparent 40%)`
        }}
      />
      
      {/* Layer 3 - Closest Background */}
      <div 
        className="absolute inset-0 opacity-25"
        style={{
          transform: `translateY(${scrollY * 0.3}px)`,
          background: `radial-gradient(circle at ${60 + scrollY * 0.005}% ${40 + scrollY * 0.01}%, 
            rgba(217, 175, 195, 0.2) 0%, 
            transparent 30%)`
        }}
      />

      {/* Floating Geometric Shapes */}
      <div 
        className="absolute top-1/4 left-1/4 w-32 h-32 opacity-10"
        style={{
          transform: `translateY(${scrollY * 0.15}px) rotate(${scrollY * 0.02}deg)`,
          background: 'linear-gradient(45deg, rgba(168, 85, 247, 0.3), rgba(236, 72, 153, 0.3))',
          borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
          filter: 'blur(20px)'
        }}
      />
      
      <div 
        className="absolute top-3/4 right-1/4 w-24 h-24 opacity-15"
        style={{
          transform: `translateY(${scrollY * 0.25}px) rotate(${-scrollY * 0.015}deg)`,
          background: 'linear-gradient(135deg, rgba(217, 175, 195, 0.4), rgba(221, 190, 216, 0.4))',
          borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
          filter: 'blur(15px)'
        }}
      />

      <div 
        className="absolute top-1/2 right-1/3 w-20 h-20 opacity-12"
        style={{
          transform: `translateY(${scrollY * 0.18}px) rotate(${scrollY * 0.03}deg)`,
          background: 'linear-gradient(225deg, rgba(230, 224, 244, 0.5), rgba(248, 245, 250, 0.3))',
          borderRadius: '40% 60% 60% 40% / 60% 40% 40% 60%',
          filter: 'blur(25px)'
        }}
      />

      {/* Morphing Gradient Overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `linear-gradient(
            ${45 + scrollY * 0.05}deg,
            rgba(221, 190, 216, ${0.1 + Math.sin(scrollY * 0.001) * 0.05}) 0%,
            rgba(230, 224, 244, ${0.05 + Math.cos(scrollY * 0.0015) * 0.03}) 25%,
            rgba(217, 175, 195, ${0.08 + Math.sin(scrollY * 0.0008) * 0.04}) 50%,
            rgba(248, 245, 250, ${0.03 + Math.cos(scrollY * 0.0012) * 0.02}) 75%,
            transparent 100%
          )`
        }}
      />
    </div>
  );
};

export default ParallaxBackground;
