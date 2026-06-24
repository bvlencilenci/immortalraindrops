'use client';

import { useEffect, useRef } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import { Howler } from 'howler';

// @ts-ignore
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

  const initRef = useRef(false);

  const isRadioPlaying = currentlyPlayingId === 'radio-stream' && isPlaying;

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = Howler.ctx;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => { });
    }

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;

      visualizerRef.current?.setDimensions?.(canvas.width, canvas.height);
    };

    resizeCanvas();

    let visualizer: any;
    let butterchurn: any;
    let butterchurnPresets: any;

    const init = async () => {
      try {
        if (!radioAudioNode) {
          console.log('waiting for audio node...');
          return;
        }

        // 🔥 allow retry until successful init
        if (initRef.current) return;

        const pixelRatio =
          window.innerWidth < 768 ? 0.75 : window.devicePixelRatio || 1;

        butterchurn = (await import('butterchurn')).default;
        butterchurnPresets = (await import('butterchurn-presets')).default;

        visualizer = butterchurn.createVisualizer(ctx, canvas, {
          width: canvas.width,
          height: canvas.height,
          pixelRatio,
          textureRatio: 1,
        });

        visualizerRef.current = visualizer;

        const analyser = Howler.ctx.createAnalyser();
        analyser.fftSize = 1024;

        const osc = Howler.ctx.createOscillator();
        osc.connect(analyser);
        osc.start();

        visualizer.connectAudio(analyser);

        // -------------------------
        // PRESETS
        // -------------------------
        let curatedPresets: any[] = [];
        const allPresets = butterchurnPresets.getPresets();

        CURATED_PRESET_NAMES.forEach((name) => {
          if (allPresets[name]) curatedPresets.push(allPresets[name]);
        });

        if (curatedPresets.length === 0) {
          const keys = Object.keys(allPresets);
          const sampleSize = Math.min(15, Math.max(10, keys.length));

          for (let i = 0; i < sampleSize; i++) {
            curatedPresets.push(
              allPresets[keys[Math.floor(Math.random() * keys.length)]]
            );
          }
        }

        let currentPresetIdx = 0;

        if (curatedPresets.length > 0) {
          currentPresetIdx = Math.floor(Math.random() * curatedPresets.length);
          visualizer.loadPreset(curatedPresets[currentPresetIdx], 0.0);
        }

        const rotatePreset = () => {
          if (curatedPresets.length <= 1) return;

          currentPresetIdx = (currentPresetIdx + 1) % curatedPresets.length;

          visualizer.loadPreset(
            curatedPresets[currentPresetIdx],
            2.0
          );
        };

        presetIntervalRef.current = setInterval(rotatePreset, 10000);

        const renderLoop = () => {
          if (!document.hidden && visualizerRef.current && isRadioPlaying) {
            visualizerRef.current.render();
          }

          animationFrameRef.current = requestAnimationFrame(renderLoop);
        };
        console.log('render tick');
        renderLoop();

        // ✅ ONLY mark success AFTER everything works
        initRef.current = true;
      } catch (e) {
        console.error('Butterchurn init failed:', e);
        initRef.current = false;
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

      visualizerRef.current?.dispose?.();
      initRef.current = false;
    };
  }, [radioAudioNode, isRadioPlaying]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
      <canvas
        ref={canvasRef}
        className="w-full h-full block transition-opacity duration-1000"
      />

      {/* Static border-cracks glass overlay */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <svg
          className="w-full h-full block"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: 'drop-shadow(0 0 3px rgba(236, 238, 223, 0.12))' }}
        >
          <path
            d="
              M 0,0 L 20,20 L 45,35 L 65,65 M 20,20 L 35,10 L 50,8 M 45,35 L 38,55 L 32,70
              M 1000,0 L 980,20 L 955,35 L 935,65 M 980,20 L 965,10 L 950,8 M 955,35 L 962,55 L 968,70
              M 0,1000 L 20,980 L 45,965 L 65,935 M 20,980 L 35,990 L 50,992 M 45,965 L 38,945 L 32,930
              M 1000,1000 L 980,980 L 955,965 L 935,935 M 980,980 L 965,990 L 950,992 M 955,965 L 962,945 L 968,930
              M 500,0 L 510,25 L 495,50 L 505,75 M 510,25 L 530,35 L 545,40 M 495,50 L 475,60 L 460,65
              M 500,1000 L 510,975 L 495,950 L 505,925 M 510,975 L 530,965 L 545,960 M 495,950 L 475,940 L 460,935
              M 0,500 L 25,510 L 50,495 L 75,505 M 25,510 L 35,530 L 40,545 M 50,495 L 60,475 L 65,460
              M 1000,500 L 975,510 L 950,495 L 925,505 M 975,510 L 965,530 L 960,545 M 950,495 L 940,475 L 935,460
            "
            stroke="rgba(236, 238, 223, 0.2)"
            strokeWidth="0.8"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}