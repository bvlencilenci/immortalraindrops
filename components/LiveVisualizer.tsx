'use client';

import { useEffect, useRef, useState } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import { Howler } from 'howler';
import { supabase } from '../lib/supabase';

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

interface VisualizerSettings {
  enabled: boolean;
  presetNames: string[];
  rotationSeconds: number;
  blendSeconds: number;
  pixelRatioMobile: number;
  pixelRatioDesktop: number;
  overlayStrength: number;
}

type ButterchurnPreset = Record<string, unknown>;

interface ButterchurnVisualizerInstance {
  setDimensions?: (width: number, height: number) => void;
  connectAudio: (analyser: AnalyserNode) => void;
  loadPreset: (preset: ButterchurnPreset, blendDuration: number) => void;
  render: () => void;
  dispose?: () => void;
}

interface ButterchurnModule {
  createVisualizer: (
    context: BaseAudioContext,
    canvas: HTMLCanvasElement,
    options: {
      width: number;
      height: number;
      pixelRatio: number;
      textureRatio: number;
    }
  ) => ButterchurnVisualizerInstance;
}

interface ButterchurnPresetsModule {
  getPresets: () => Record<string, ButterchurnPreset>;
}

interface VisualizerSettingsRow {
  visualizer_enabled?: boolean | null;
  visualizer_preset_names?: string[] | null;
  visualizer_rotation_seconds?: number | null;
  visualizer_blend_seconds?: number | null;
  visualizer_pixel_ratio_mobile?: number | null;
  visualizer_pixel_ratio_desktop?: number | null;
  visualizer_overlay_strength?: number | null;
}

const DEFAULT_VISUALIZER_SETTINGS: VisualizerSettings = {
  enabled: true,
  presetNames: CURATED_PRESET_NAMES,
  rotationSeconds: 10,
  blendSeconds: 2,
  pixelRatioMobile: 0.75,
  pixelRatioDesktop: 1,
  overlayStrength: 1,
};

const applyVisualizerSettings = (settings: Partial<VisualizerSettings>): VisualizerSettings => ({
  enabled: settings.enabled ?? DEFAULT_VISUALIZER_SETTINGS.enabled,
  presetNames: settings.presetNames?.length ? settings.presetNames : DEFAULT_VISUALIZER_SETTINGS.presetNames,
  rotationSeconds: Math.max(1, Number(settings.rotationSeconds ?? DEFAULT_VISUALIZER_SETTINGS.rotationSeconds)),
  blendSeconds: Math.max(0, Number(settings.blendSeconds ?? DEFAULT_VISUALIZER_SETTINGS.blendSeconds)),
  pixelRatioMobile: Math.max(0.25, Number(settings.pixelRatioMobile ?? DEFAULT_VISUALIZER_SETTINGS.pixelRatioMobile)),
  pixelRatioDesktop: Math.max(0.25, Number(settings.pixelRatioDesktop ?? DEFAULT_VISUALIZER_SETTINGS.pixelRatioDesktop)),
  overlayStrength: Math.max(0, Number(settings.overlayStrength ?? DEFAULT_VISUALIZER_SETTINGS.overlayStrength)),
});

const normalizeSettingsPayload = (data: VisualizerSettingsRow | null): VisualizerSettings => applyVisualizerSettings({
  enabled: data?.visualizer_enabled ?? undefined,
  presetNames: Array.isArray(data?.visualizer_preset_names) ? data.visualizer_preset_names.filter(Boolean) : undefined,
  rotationSeconds: data?.visualizer_rotation_seconds ?? undefined,
  blendSeconds: data?.visualizer_blend_seconds ?? undefined,
  pixelRatioMobile: data?.visualizer_pixel_ratio_mobile ?? undefined,
  pixelRatioDesktop: data?.visualizer_pixel_ratio_desktop ?? undefined,
  overlayStrength: data?.visualizer_overlay_strength ?? undefined,
});

export default function LiveVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const radioAudioNode = useAudioStore((state) => state.radioAudioNode);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const currentlyPlayingId = useAudioStore((state) => state.currentlyPlayingId);
  const analyserFromStore = useAudioStore((state) => state.analyser);

  const visualizerRef = useRef<ButterchurnVisualizerInstance | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const presetIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const initRef = useRef(false);
  const [settings, setSettings] = useState<VisualizerSettings>(DEFAULT_VISUALIZER_SETTINGS);

  useEffect(() => {
    const loadSettings = async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('visualizer_enabled, visualizer_preset_names, visualizer_rotation_seconds, visualizer_blend_seconds, visualizer_pixel_ratio_mobile, visualizer_pixel_ratio_desktop, visualizer_overlay_strength')
        .eq('id', 1)
        .single();

      if (error) {
        console.warn('Visualizer settings unavailable, using defaults:', error.message);
        return;
      }

      setSettings(normalizeSettingsPayload(data as VisualizerSettingsRow | null));
    };

    loadSettings();

    const channel = supabase
      .channel('live-visualizer-settings')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_settings',
          filter: 'id=eq.1',
        },
        (payload) => {
          setSettings(normalizeSettingsPayload(payload.new as VisualizerSettingsRow));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!settings.enabled) return;
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const isRadio = currentlyPlayingId === 'radio-stream';
    const ctx = isRadio ? radioAudioNode?.context : Howler.ctx;

    if (ctx && ctx.state === 'suspended' && 'resume' in ctx) {
      (ctx as AudioContext).resume().catch(() => { });
    }

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;

      visualizerRef.current?.setDimensions?.(canvas.width, canvas.height);
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    let visualizer: ButterchurnVisualizerInstance;
    let butterchurn: ButterchurnModule;
    let butterchurnPresets: ButterchurnPresetsModule;

    const init = async () => {
      try {
        if (!ctx) {
          console.log('waiting for audio context...');
          return;
        }

        // 🔥 allow retry until successful init
        if (initRef.current) return;

        const pixelRatio =
          window.innerWidth < 768 ? settings.pixelRatioMobile : settings.pixelRatioDesktop;

        // Force a resize right before creation to match parent bounds
        resizeCanvas();

        butterchurn = (await import('butterchurn')).default as ButterchurnModule;
        butterchurnPresets = (await import('butterchurn-presets')).default as ButterchurnPresetsModule;

        visualizer = butterchurn.createVisualizer(ctx, canvas, {
          width: canvas.width,
          height: canvas.height,
          pixelRatio,
          textureRatio: 1,
        });

        visualizerRef.current = visualizer;

        let analyser: AnalyserNode;
        if (isRadio && radioAudioNode) {
          analyser = ctx.createAnalyser();
          analyser.fftSize = 1024;
          radioAudioNode.connect(analyser);
        } else if (analyserFromStore) {
          analyser = analyserFromStore;
        } else {
          analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
        }

        visualizer.connectAudio(analyser);

        // -------------------------
        // PRESETS
        // -------------------------
        const curatedPresets: ButterchurnPreset[] = [];
        const allPresets = butterchurnPresets.getPresets();

        settings.presetNames.forEach((name) => {
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
            settings.blendSeconds
          );
        };

        presetIntervalRef.current = setInterval(rotatePreset, settings.rotationSeconds * 1000);

        const renderLoop = () => {
          if (!document.hidden && visualizerRef.current && isPlaying && currentlyPlayingId) {
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

    return () => {
      resizeObserver.disconnect();

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (presetIntervalRef.current) {
        clearInterval(presetIntervalRef.current);
      }

      visualizerRef.current?.dispose?.();
      initRef.current = false;
    };
  }, [
    radioAudioNode,
    currentlyPlayingId,
    isPlaying,
    analyserFromStore,
    settings.enabled,
    settings.presetNames,
    settings.rotationSeconds,
    settings.blendSeconds,
    settings.pixelRatioMobile,
    settings.pixelRatioDesktop,
  ]);

  if (!settings.enabled) return null;

  const overlayStrength = settings.overlayStrength;

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-full h-full block transition-opacity duration-1000"
      />

      {/* Edge darkening layer */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          zIndex: 5,
          boxShadow: `inset 0 0 160px 15px rgba(10,10,8,${Math.min(1, 0.95 * overlayStrength)}), inset 0 0 60px 0px rgba(10,10,8,${Math.min(1, 0.6 * overlayStrength)})`
        }}
      />

      {/* Top/bottom gradient layer */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          zIndex: 6,
          background: `linear-gradient(to bottom, rgba(10,10,8,${Math.min(1, 0.55 * overlayStrength)}) 0%, transparent 25%, transparent 75%, rgba(10,10,8,${Math.min(1, 0.65 * overlayStrength)}) 100%)`
        }}
      />

      {/* Left/right gradient layer */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          zIndex: 7,
          background: `linear-gradient(to right, rgba(10,10,8,${Math.min(1, 0.45 * overlayStrength)}) 0%, transparent 20%, transparent 80%, rgba(10,10,8,${Math.min(1, 0.45 * overlayStrength)}) 100%)`
        }}
      />

      {/* Static border-cracks glass overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 8 }}>
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 900 640"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: 'drop-shadow(0 0 4px rgba(109,191,130,0.2))' }}
        >
          {/* Main radial cracks from top-left impact point */}
          <path d="M 80 60 L 143 198 L 112 310" stroke="rgba(109,191,130,0.28)" strokeWidth="0.8" fill="none"/>
          <path d="M 80 60 L 210 145 L 340 178" stroke="rgba(109,191,130,0.22)" strokeWidth="0.6" fill="none"/>
          <path d="M 80 60 L 58 180 L 42 390" stroke="rgba(109,191,130,0.18)" strokeWidth="0.5" fill="none"/>
          <path d="M 80 60 L 190 72 L 420 58" stroke="rgba(109,191,130,0.15)" strokeWidth="0.5" fill="none"/>

          {/* Branch cracks off main radials */}
          <path d="M 143 198 L 98 242 L 72 310" stroke="rgba(109,191,130,0.16)" strokeWidth="0.4" fill="none"/>
          <path d="M 210 145 L 248 210 L 230 290" stroke="rgba(109,191,130,0.13)" strokeWidth="0.4" fill="none"/>
          <path d="M 112 310 L 78 355 L 60 430" stroke="rgba(109,191,130,0.12)" strokeWidth="0.4" fill="none"/>

          {/* Bottom-right corner cracks */}
          <path d="M 900 640 L 760 548 L 680 490" stroke="rgba(109,191,130,0.2)" strokeWidth="0.7" fill="none"/>
          <path d="M 900 640 L 820 580 L 900 520" stroke="rgba(109,191,130,0.14)" strokeWidth="0.5" fill="none"/>
          <path d="M 760 548 L 700 590 L 640 640" stroke="rgba(109,191,130,0.12)" strokeWidth="0.4" fill="none"/>

          {/* Concentric arc fragments near impact */}
          <path d="M 42 140 Q 140 110 280 155" stroke="rgba(109,191,130,0.1)" strokeWidth="0.4" fill="none"/>
          <path d="M 55 260 Q 160 220 310 248" stroke="rgba(109,191,130,0.08)" strokeWidth="0.35" fill="none"/>
        </svg>
      </div>
    </div>
  );
}
