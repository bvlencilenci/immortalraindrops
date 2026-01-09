import ArchiveGrid from '../components/ArchiveGrid';
import { tracks } from '../data/tracks';

export default function Home() {
  return (
    <main className="flex-1 w-full flex flex-col bg-black min-h-0 px-8">
      <ArchiveGrid tracks={tracks} />
    </main>
  );
}
