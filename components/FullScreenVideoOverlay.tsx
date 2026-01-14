'use client';

import { useEffect } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import CustomVideoPlayer from './CustomVideoPlayer';
import { motion, AnimatePresence } from 'framer-motion';

const FullScreenVideoOverlay = () => {
  const { activeFullscreenUrl, activeFullscreenStartTime, setActiveFullscreenVideo } = useAudioStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveFullscreenVideo(null);
      }
    };

    if (activeFullscreenUrl) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFullscreenUrl, setActiveFullscreenVideo]);

  return (
    <AnimatePresence>
      {activeFullscreenUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-12 overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={() => setActiveFullscreenVideo(null)}
            className="absolute top-8 right-8 z-[2001] p-4 text-[#ECEEDF] hover:opacity-50 transition-opacity font-mono text-sm tracking-widest uppercase"
          >
            [ CLOSE ]
          </button>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full h-full max-w-[95vw] max-h-[90vh] flex items-center justify-center pointer-events-auto"
          >
            <div className="w-full h-full max-w-7xl aspect-video shadow-2xl shadow-black relative overflow-hidden bg-black">
              <CustomVideoPlayer
                src={activeFullscreenUrl}
                startTime={activeFullscreenStartTime}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullScreenVideoOverlay;
