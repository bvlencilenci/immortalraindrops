import ArchiveGrid from '../../components/ArchiveGrid';
import LiveVisualizer from '../../components/LiveVisualizer';
import { getTracks } from '../actions';

export default async function Archive() {
  const tracks = await getTracks();

  return (
    <main className="relative flex-1 w-full min-h-dvh overflow-hidden bg-black text-[#ECEEDF]">
      <div className="fixed inset-0 z-0 opacity-80 scale-110 pointer-events-none">
        <LiveVisualizer />
      </div>

      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          maskImage: 'radial-gradient(circle at 50% 48%, transparent 0%, transparent 42%, rgba(0,0,0,0.18) 58%, rgba(0,0,0,0.65) 82%, black 100%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 48%, transparent 0%, transparent 42%, rgba(0,0,0,0.18) 58%, rgba(0,0,0,0.65) 82%, black 100%)',
        }}
      />

      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 42%, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0.04) 38%, rgba(0,0,0,0.44) 78%, rgba(0,0,0,0.78) 100%),
            repeating-linear-gradient(
              to bottom,
              rgba(255,255,255,0.045) 0px,
              rgba(255,255,255,0.045) 1px,
              transparent 1px,
              transparent 4px
            )
          `,
        }}
      />

      <div className="relative z-10 flex h-dvh items-center overflow-hidden px-3 pb-10 pt-[calc(5.75rem+env(safe-area-inset-top))] md:px-6 md:pb-12 md:pt-[calc(6.25rem+env(safe-area-inset-top))] lg:px-10 lg:pb-14 lg:pt-[7rem]">
        <ArchiveGrid tracks={tracks} variant="archive" />
      </div>
    </main>
  );
}
