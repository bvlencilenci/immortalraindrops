'use client';

import { useEffect, useRef, useState } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import { Howler } from 'howler';
// @ts-ignore
import butterchurn from 'butterchurn';
// @ts-ignore
import butterchurnPresets from 'butterchurn-presets';

// Curated list of presets matching the station identity (dark, brutalist, slow motion, abstract geometry, red accents, VHS/analog feeling)
const CURATED_PRESET_NAMES = [
  '_Geiss - Artifact 01',
  '_Geiss - Desert Rose 2',
  'Cope - The Neverending Explosion of Red Liquid Fire',
  'martin - reflections on black tiles',
  'shifter - dark tides bdrv mix 2',
  'martin - castle in the air',
  'Flexi - what is the matrix',
  'Flexi - infused with the spiral',
  'martin - stormy sea (2010 update)',
  'yin - 191 - Temporal singularities',
  '_Aderrasi - Wanderer in Curved Space - mash0000 - faclempt kibitzing meshuggana schmaltz (Geiss color mix)',
  'Eo.S. + Phat - cubetrace - v2',
  'Unchained & Rovastar - Wormhole Pillars (Hall of Shadows mix)'
];

export default function LiveVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const radioAudioNode = useAudioStore((state) => state.radioAudioNode);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const currentlyPlayingId = useAudioStore((state) => state.currentlyPlayingId);
  const visualizerRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const presetIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const isRadioPlaying = currentlyPlayingId === 'radio-stream' && isPlaying;

  useEffect(() => {
    if (!canvasRef.current || !radioAudioNode) {
      setIsActive(false);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = Howler.ctx;
    if (!ctx) {
      setIsActive(false);
      return;
    }

    if (ctx.state === 'suspended') {
      ctx.resume().catch((err) => console.warn('Failed to resume AudioContext in visualizer:', err));
    }

    // Set canvas sizes
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        if (visualizerRef.current) {
          visualizerRef.current.setDimensions(canvas.width, canvas.height);
        }
      }
    };
    resizeCanvas();

    // Initialize Butterchurn visualizer
    let visualizer: any;
    try {
      const isMobile = window.innerWidth < 768;
      const pixelRatio = isMobile ? 0.75 : window.devicePixelRatio || 1;

      visualizer = butterchurn.createVisualizer(ctx, canvas, {
        width: canvas.width,
        height: canvas.height,
        pixelRatio,
        textureRatio: 1
      });
      visualizerRef.current = visualizer;

      // Connect audio node to visualizer
      visualizer.connectAudio(radioAudioNode);
      
      console.log('Butterchurn visualizer initialized successfully');
      setIsActive(true);
      setIsInitialized(true);
    } catch (e) {
      console.error('Failed to initialize Butterchurn visualizer:', e);
      setIsActive(false);
      setIsInitialized(false);
      return;
    }

    // Load presets
    let curatedPresets: any[] = [];
    try {
      const allPresets = butterchurnPresets.getPresets();
      CURATED_PRESET_NAMES.forEach((name) => {
        if (allPresets[name]) {
          curatedPresets.push(allPresets[name]);
        }
      });

      // Fallback if none found
      if (curatedPresets.length === 0) {
        const presetKeys = Object.keys(allPresets);
        if (presetKeys.length > 0) {
          // Get a random sample of 10-15 presets
          const sampleSize = Math.min(15, Math.max(10, presetKeys.length));
          for (let i = 0; i < sampleSize; i++) {
            const randomIdx = Math.floor(Math.random() * presetKeys.length);
            curatedPresets.push(allPresets[presetKeys[randomIdx]]);
          }
        }
      }

      console.log(`Loaded ${curatedPresets.length} presets for rotation`);
    } catch (e) {
      console.error('Failed to load presets:', e);
      curatedPresets = [];
    }

    // Start with a random curated preset
    let currentPresetIdx = 0;
    if (curatedPresets.length > 0) {
      currentPresetIdx = Math.floor(Math.random() * curatedPresets.length);
      try {
        visualizer.loadPreset(curatedPresets[currentPresetIdx], 0.0);
        console.log(`Loaded preset at index ${currentPresetIdx}`);
      } catch (e) {
        console.error('Failed to load initial preset:', e);
      }
    }

    // Preset rotation every 10 seconds with a 2 second blend
    const rotatePreset = () => {
      if (curatedPresets.length > 1) {
        currentPresetIdx = (currentPresetIdx + 1) % curatedPresets.length;
        try {
          visualizer.loadPreset(curatedPresets[currentPresetIdx], 2.0);
        } catch (e) {
          console.error('Failed to load preset during rotation:', e);
        }
      }
    };
    presetIntervalRef.current = setInterval(rotatePreset, 10000);

    // Animation render loop
    const renderLoop = () => {
      if (document.hidden) {
        // Pause rendering when page is hidden to save CPU
        animationFrameRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      if (visualizerRef.current && isRadioPlaying) {
        try {
          visualizerRef.current.render();
        } catch (e) {
          console.error('Error during visualizer render:', e);
        }
      }
      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    // Handle window resize
    const handleResize = () => resizeCanvas();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (presetIntervalRef.current) {
        clearInterval(presetIntervalRef.current);
      }
      // Clean up visualizer
      if (visualizerRef.current) {
        try {
          visualizerRef.current.dispose?.();
        } catch (e) {
          console.warn('Error disposing visualizer:', e);
        }
      }
    };
  }, [radioAudioNode, isRadioPlaying]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
      
  <canvas
    ref={canvasRef}
    className={`w-full h-full block transition-opacity duration-1000 `}
  />
      {/* Fullscreen darkening overlay above visualizer to preserve readability */}
      <div 
        className="absolute inset-0 bg-black/45 mix-blend-multiply"
        style={{
          backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
          backgroundSize: '100% 4px, 6px 100%',
        }}
      />
    </div>
  );
}
