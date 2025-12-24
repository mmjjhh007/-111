
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import Experience from './components/Experience';
import { AppMode, AppState } from './types';
import { ParticleSystem } from './components/ParticleSystem';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    mode: AppMode.TREE,
    isLoaded: false,
    uiHidden: false,
    handDetected: false,
    handPosition: { x: 0.5, y: 0.5 }
  });

  const particleSystemRef = useRef<ParticleSystem | null>(null);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h') {
        setState(prev => ({ ...prev, uiHidden: !prev.uiHidden }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mouse move handler for scene rotation
  const handleMouseMove = (e: React.MouseEvent) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    setState(prev => ({
      ...prev,
      handPosition: { x, y }
    }));
  };

  // Click handler to cycle modes
  const handleScreenClick = (e: React.MouseEvent) => {
    // Prevent cycling if clicking the upload button or its wrapper
    if ((e.target as HTMLElement).closest('.upload-wrapper')) return;

    setState(prev => {
      let nextMode: AppMode;
      switch (prev.mode) {
        case AppMode.TREE:
          nextMode = AppMode.SCATTER;
          break;
        case AppMode.SCATTER:
          nextMode = AppMode.FOCUS;
          break;
        case AppMode.FOCUS:
          nextMode = AppMode.TREE;
          break;
        default:
          nextMode = AppMode.TREE;
      }
      return { ...prev, mode: nextMode };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && particleSystemRef.current) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          new THREE.TextureLoader().load(ev.target.result as string, (t) => {
            t.colorSpace = THREE.SRGBColorSpace;
            particleSystemRef.current?.addPhotoToScene(t);
            setState(prev => ({ ...prev, mode: AppMode.FOCUS }));
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div 
      className="relative w-full h-screen overflow-hidden bg-black cursor-pointer"
      onMouseMove={handleMouseMove}
      onClick={handleScreenClick}
    >
      {/* Loader */}
      {!state.isLoaded && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-1000">
          <div className="spinner mb-4" />
          <div className="cinzel text-[#d4af37] text-sm tracking-widest animate-pulse">
            LOADING HOLIDAY MAGIC
          </div>
        </div>
      )}

      {/* Experience */}
      <Experience 
        state={state} 
        onLoaded={() => setState(prev => ({ ...prev, isLoaded: true }))}
        particleSystemRef={particleSystemRef}
      />

      {/* UI Overlay */}
      <div className={`fixed inset-0 pointer-events-none transition-opacity duration-500 ${state.uiHidden ? 'opacity-0' : 'opacity-100'}`}>
        {/* Title */}
        <div className="absolute top-10 w-full text-center">
          <h1 className="cinzel text-5xl md:text-7xl font-bold bg-gradient-to-b from-white to-[#d4af37] bg-clip-text text-transparent text-glow">
            Merry Christmas
          </h1>
        </div>

        {/* Controls */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 pointer-events-auto">
          <div className="upload-wrapper">
            <label className="glass px-8 py-3 rounded-full border border-[#d4af37]/30 text-[#fceea7] cinzel tracking-widest cursor-pointer hover:bg-white/10 transition-colors">
              ADD MEMORIES
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
          <p className="text-[10px] text-[#d4af37]/60 tracking-widest uppercase">
            Press 'H' to Hide Controls
          </p>
        </div>

        {/* Mode Indicator */}
        <div className="absolute top-10 left-10 glass p-4 rounded-xl text-[10px] tracking-widest text-[#d4af37]">
          <div className="mb-2 opacity-50 uppercase">Current Mode</div>
          <div className="cinzel text-lg">{state.mode}</div>
          <div className="mt-2 text-[#d4af37]/40">Click to Change</div>
        </div>

        {/* Instruction overlay */}
        <div className="absolute top-10 right-10 glass p-4 rounded-xl text-[10px] tracking-widest text-[#d4af37] max-w-xs">
          <div className="mb-2 opacity-50 uppercase">Interactions</div>
          <ul className="space-y-1">
            <li>• CLICK: CYCLE MODES</li>
            <li>• MOUSE: TILT SCENE</li>
            <li>• 'H': TOGGLE UI</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default App;
