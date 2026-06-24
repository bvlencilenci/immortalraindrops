'use client';

import { useEffect, useRef, useState } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import { Howler } from 'howler';

// @ts-ignore
// ❌ REMOVED STATIC IMPORT (this causes Turbopack SSR crash)
// import butterchurn from 'butterchurn';
// import butterchurnPresets from 'butterchurn-presets';

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
      ctx.resume().catch((err) =>
        console.warn('Failed to resume AudioContext in visualizer:', err)
      );
    }

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

    let visualizer: any;
    let butterchurn: any;
    let butterchurnPresets: any;

    const init = async () => {
      try {
        const isMobile = window.innerWidth < 768;
        const pixelRatio = isMobile ? 0.75 : window.devicePixelRatio || 1;

        // ✅ ONLY FIX: dynamic import (fixes SSR/Turbopack crash)
        butterchurn = (await import('butterchurn')).default;
        butterchurnPresets = (await import('butterchurn-presets')).default;

        visualizer = butterchurn.createVisualizer(ctx, canvas, {
          width: canvas.width,
          height: canvas.height,
          pixelRatio,
          textureRatio: 1
        });

        visualizerRef.current = visualizer;

        visualizer.connectAudio(radioAudioNode);

        console.log('Butterchurn visualizer initialized successfully');
        setIsActive(true);
        setIsInitialized(true);

        // -------------------------
        // PRESETS (UNCHANGED LOGIC)
        // -------------------------
        let curatedPresets: any[] = [];
        const allPresets = butterchurnPresets.getPresets();

        CURATED_PRESET_NAMES.forEach((name) => {
          if (allPresets[name]) {
            curatedPresets.push(allPresets[name]);
          }
        });

        if (curatedPresets.length === 0) {
          const presetKeys = Object.keys(allPresets);
          const sampleSize = Math.min(15, Math.max(10, presetKeys.length));

          for (let i = 0; i < sampleSize; i++) {
            const randomIdx = Math.floor(Math.random() * presetKeys.length);
            curatedPresets.push(allPresets[presetKeys[randomIdx]]);
          }
        }

        console.log(`Loaded ${curatedPresets.length} presets for rotation`);

        let currentPresetIdx = 0;

        if (curatedPresets.length > 0) {
          currentPresetIdx = Math.floor(Math.random() * curatedPresets.length);
          visualizer.loadPreset(curatedPresets[currentPresetIdx], 0.0);
        }

        const rotatePreset = () => {
          if (curatedPresets.length > 1) {
            currentPresetIdx = (currentPresetIdx + 1) % curatedPresets.length;
            visualizer.loadPreset(curatedPresets[currentPresetIdx], 2.0);
          }
        };

        presetIntervalRef.current = setInterval(rotatePreset, 10000);

        const renderLoop = () => {
          if (document.hidden) {
            animationFrameRef.current = requestAnimationFrame(renderLoop);
            return;
          }

          if (visualizerRef.current && isRadioPlaying) {
            visualizerRef.current.render();
          }

          animationFrameRef.current = requestAnimationFrame(renderLoop);
        };

        renderLoop();
      } catch (e) {
        console.error('Failed to initialize Butterchurn visualizer:', e);
        setIsActive(false);
        setIsInitialized(false);
      }
    };

    init();

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
        className={`w-full h-full block transition-opacity duration-1000`}
      />

      <div
        className="absolute inset-0 bg-black/45 mix-blend-multiply"
        style={{
          backgroundImage:
            'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 0, 0.03))',
          backgroundSize: '100% 4px, 6px 100%',
        }}
      />
    </div>
  );
}