import React, { useEffect, useState, useRef } from 'react';

interface CursorTrail {
  id: number;
  x: number;
  y: number;
  timestamp: number;
  opacity: number;
  size: number;
}

interface WatercolorCursorProps {
  enabled?: boolean;
}

const WatercolorCursor: React.FC<WatercolorCursorProps> = ({ enabled = true }) => {
  const [cursorTrails, setCursorTrails] = useState<CursorTrail[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const trailIdRef = useRef(0);

  useEffect(() => {
    let animationFrameId: number;

    const updateTrails = () => {
      const now = Date.now();
      setCursorTrails(prev => 
        prev
          .map(trail => ({
            ...trail,
            opacity: Math.max(0, trail.opacity - 0.02),
            size: trail.size * 0.995
          }))
          .filter(trail => trail.opacity > 0.01)
      );
      animationFrameId = requestAnimationFrame(updateTrails);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!enabled) {
        setIsVisible(false);
        setCursorTrails([]);
        return;
      }

      setIsVisible(true);
      const now = Date.now();

      setCursorTrails(prev => {
        const newTrail: CursorTrail = {
          id: trailIdRef.current++,
          x: e.clientX,
          y: e.clientY,
          timestamp: now,
          opacity: 1,
          size: Math.random() * 20 + 15
        };

        return [...prev.slice(-15), newTrail]; // Keep only last 15 trails
      });
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    
    animationFrameId = requestAnimationFrame(updateTrails);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, [enabled]);

  // Clear trails when disabled
  useEffect(() => {
    if (!enabled) {
      setCursorTrails([]);
      setIsVisible(false);
    }
  }, [enabled]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {cursorTrails.map(trail => (
        <div
          key={trail.id}
          className="absolute rounded-full"
          style={{
            left: trail.x - trail.size / 2,
            top: trail.y - trail.size / 2,
            width: trail.size,
            height: trail.size,
            background: `radial-gradient(circle, 
              rgba(221, 190, 216, ${trail.opacity * 0.6}) 0%, 
              rgba(230, 224, 244, ${trail.opacity * 0.4}) 30%, 
              rgba(217, 175, 195, ${trail.opacity * 0.3}) 60%, 
              transparent 100%)`,
            transform: 'scale(1)',
            filter: 'blur(2px)',
            transition: 'all 0.1s ease-out'
          }}
        />
      ))}
      
      {/* Main cursor */}
      {cursorTrails.length > 0 && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: cursorTrails[cursorTrails.length - 1]?.x - 6,
            top: cursorTrails[cursorTrails.length - 1]?.y - 6,
            width: 12,
            height: 12,
          }}
        >
          {/* Feather-like cursor shape */}
          <svg width="12" height="12" viewBox="0 0 12 12" className="opacity-80">
            <path
              d="M6 0 C8 2, 10 4, 8 6 C6 8, 4 6, 2 8 C0 6, 2 4, 4 2 C5 1, 6 0, 6 0 Z"
              fill="rgba(168, 85, 247, 0.8)"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="0.5"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default WatercolorCursor;
