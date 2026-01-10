'use client';

import { useAudioStore } from '../store/useAudioStore';
import ArchiveGrid from './ArchiveGrid';
import SplashScreen from './SplashScreen';
import { Track } from '../types';

interface ClientHomeProps {
  tracks: Track[];
}

const ClientHome = ({ tracks }: ClientHomeProps) => {
  const hasEntered = useAudioStore((state) => state.hasEntered);

  return (
    <>
      {!hasEntered && <SplashScreen />}
      {hasEntered && <ArchiveGrid tracks={tracks} />}
    </>
  );
};

export default ClientHome;
