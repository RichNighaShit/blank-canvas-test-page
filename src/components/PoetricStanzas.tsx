import React, { useEffect, useState } from 'react';

interface Stanza {
  id: number;
  text: string;
  trigger: number; // scroll percentage to trigger
  position: 'left' | 'right' | 'center';
  delay: number;
}

const poeticStanzas: Stanza[] = [
  {
    id: 1,
    text: "Colors whisper secrets to those who listen...",
    trigger: 15,
    position: 'right',
    delay: 0
  },
  {
    id: 2,
    text: "In every hue lies a story untold",
    trigger: 30,
    position: 'left',
    delay: 500
  },
  {
    id: 3,
    text: "Beauty blooms where intention meets intuition",
    trigger: 50,
    position: 'center',
    delay: 0
  },
  {
    id: 4,
    text: "Your palette is your poetry",
    trigger: 70,
    position: 'right',
    delay: 300
  },
  {
    id: 5,
    text: "Style is the echo of your soul's song",
    trigger: 85,
    position: 'left',
    delay: 0
  }
];

const PoeticStanzas: React.FC = () => {
  const [visibleStanzas, setVisibleStanzas] = useState<Set<number>>(new Set());
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(progress);

      // Check which stanzas should be visible
      const newVisibleStanzas = new Set<number>();
      poeticStanzas.forEach(stanza => {
        if (progress >= stanza.trigger && progress <= stanza.trigger + 20) {
          newVisibleStanzas.add(stanza.id);
        }
      });
      setVisibleStanzas(newVisibleStanzas);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getPositionClasses = (position: string) => {
    switch (position) {
      case 'left':
        return 'left-8 text-left';
      case 'right':
        return 'right-8 text-right';
      case 'center':
        return 'left-1/2 transform -translate-x-1/2 text-center';
      default:
        return 'left-1/2 transform -translate-x-1/2 text-center';
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {poeticStanzas.map(stanza => (
        <div
          key={stanza.id}
          className={`absolute top-1/2 transform -translate-y-1/2 ${getPositionClasses(stanza.position)} transition-all duration-1000 ease-out ${
            visibleStanzas.has(stanza.id) 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
          }`}
          style={{
            transitionDelay: `${stanza.delay}ms`,
            maxWidth: '400px'
          }}
        >
          <div className="relative">
            <p className="font-serif text-lg lg:text-xl text-slate-700/80 italic leading-relaxed tracking-wide drop-shadow-sm">
              {stanza.text}
            </p>
            <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-lg -z-10 transform scale-110 opacity-50"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PoeticStanzas;
