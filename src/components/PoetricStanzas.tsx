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
    text: "AI discovers the colors that make you shine ✨",
    trigger: 15,
    position: 'right',
    delay: 0
  },
  {
    id: 2,
    text: "Your wardrobe, organized and intelligent 👗",
    trigger: 30,
    position: 'left',
    delay: 500
  },
  {
    id: 3,
    text: "Every outfit tells your unique story 🎨",
    trigger: 50,
    position: 'center',
    delay: 0
  },
  {
    id: 4,
    text: "Smart suggestions for every occasion 🌟",
    trigger: 70,
    position: 'right',
    delay: 300
  },
  {
    id: 5,
    text: "Your style evolution begins here 🚀",
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

  const getPositionClasses = (position: string, stanzaId: number) => {
    // Calculate smart positioning to avoid UI overlaps
    const baseVerticalOffset = (stanzaId % 3) * 120 - 60; // Vary vertical position

    switch (position) {
      case 'left':
        return `left-8 text-left`;
      case 'right':
        return `right-8 lg:right-80 text-right`; // Avoid Velouria showcase on desktop
      case 'center':
        return `left-1/2 transform -translate-x-1/2 text-center`;
      default:
        return `left-1/2 transform -translate-x-1/2 text-center`;
    }
  };

  const getVerticalPosition = (stanzaId: number) => {
    // Stagger vertical positions to avoid overlaps
    const positions = [
      'top-1/3 transform -translate-y-1/2',
      'top-2/3 transform -translate-y-1/2',
      'top-1/2 transform -translate-y-1/2',
      'top-1/4 transform -translate-y-1/2',
      'top-3/4 transform -translate-y-1/2'
    ];
    return positions[(stanzaId - 1) % positions.length];
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {poeticStanzas.map(stanza => (
        <div
          key={stanza.id}
          className={`absolute ${getVerticalPosition(stanza.id)} ${getPositionClasses(stanza.position, stanza.id)} transition-all duration-1000 ease-out ${
            visibleStanzas.has(stanza.id)
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          }`}
          style={{
            transitionDelay: `${stanza.delay}ms`,
            maxWidth: '350px',
            zIndex: 5 // Below other UI elements
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
