import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, MousePointer, X } from 'lucide-react';

interface AmbientSoundLayerProps {
  onMouseTrailToggle?: (enabled: boolean) => void;
  mouseTrailEnabled?: boolean;
}

const AmbientSoundLayer: React.FC<AmbientSoundLayerProps> = ({
  onMouseTrailToggle,
  mouseTrailEnabled = true
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio context for generating ambient sounds
    // Since we can't include actual audio files, we'll create a subtle ambient tone using Web Audio API
    const createAmbientTone = () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create multiple oscillators for a rich ambient sound
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const oscillator3 = audioContext.createOscillator();
        
        const gainNode = audioContext.createGain();
        const filterNode = audioContext.createBiquadFilter();
        
        // Configure oscillators for ambient tones
        oscillator1.frequency.setValueAtTime(220, audioContext.currentTime); // A3
        oscillator2.frequency.setValueAtTime(330, audioContext.currentTime); // E4
        oscillator3.frequency.setValueAtTime(440, audioContext.currentTime); // A4
        
        oscillator1.type = 'sine';
        oscillator2.type = 'sine';
        oscillator3.type = 'triangle';
        
        // Configure filter for warmth
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(800, audioContext.currentTime);
        filterNode.Q.setValueAtTime(1, audioContext.currentTime);
        
        // Configure gain for gentle volume
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        
        // Connect audio nodes
        oscillator1.connect(filterNode);
        oscillator2.connect(filterNode);
        oscillator3.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Add subtle modulation for organic feel
        const lfo = audioContext.createOscillator();
        const lfoGain = audioContext.createGain();
        lfo.frequency.setValueAtTime(0.1, audioContext.currentTime);
        lfo.type = 'sine';
        lfoGain.gain.setValueAtTime(10, audioContext.currentTime);
        
        lfo.connect(lfoGain);
        lfoGain.connect(oscillator1.frequency);
        
        return { 
          audioContext, 
          oscillators: [oscillator1, oscillator2, oscillator3], 
          gainNode, 
          lfo 
        };
      } catch (error) {
        console.log('Web Audio API not supported');
        return null;
      }
    };

    let audioElements: any = null;

    if (isPlaying) {
      audioElements = createAmbientTone();
      if (audioElements) {
        const { oscillators, gainNode, lfo } = audioElements;
        
        // Fade in
        gainNode.gain.exponentialRampToValueAtTime(
          volume * 0.1, 
          audioElements.audioContext.currentTime + 2
        );
        
        // Start oscillators
        oscillators.forEach((osc: OscillatorNode) => {
          osc.start(audioElements.audioContext.currentTime);
        });
        lfo.start(audioElements.audioContext.currentTime);
      }
    }

    return () => {
      if (audioElements) {
        const { audioContext, oscillators, lfo } = audioElements;
        try {
          oscillators.forEach((osc: OscillatorNode) => {
            osc.stop();
          });
          lfo.stop();
          audioContext.close();
        } catch (error) {
          // Oscillators might already be stopped
        }
      }
    };
  }, [isPlaying, volume]);

  const toggleSound = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMouseTrail = () => {
    if (onMouseTrailToggle) {
      onMouseTrailToggle(!mouseTrailEnabled);
    }
  };

  return (
    <div className="fixed bottom-8 left-8 z-40 space-y-3">
      <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-3 border border-white/30 shadow-lg hover:bg-white/30 transition-all duration-300">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSound}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors"
            aria-label={isPlaying ? 'Mute ambient sound' : 'Play ambient sound'}
          >
            {isPlaying ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <VolumeX className="h-5 w-5" />
            )}
            <span className="text-sm font-light hidden sm:inline">
              {isPlaying ? 'Ambient' : 'Silent'}
            </span>
          </button>

          <div className="w-px h-5 bg-white/30"></div>

          <button
            onClick={toggleMouseTrail}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors"
            aria-label={mouseTrailEnabled ? 'Disable mouse trail' : 'Enable mouse trail'}
          >
            {mouseTrailEnabled ? (
              <MousePointer className="h-5 w-5" />
            ) : (
              <MousePointerOff className="h-5 w-5" />
            )}
            <span className="text-sm font-light hidden sm:inline">
              {mouseTrailEnabled ? 'Trail' : 'No Trail'}
            </span>
          </button>
        </div>
      </div>
      
      {isPlaying && (
        <div className="mt-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 border border-white/30">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
            aria-label="Volume control"
          />
        </div>
      )}
    </div>
  );
};

export default AmbientSoundLayer;
