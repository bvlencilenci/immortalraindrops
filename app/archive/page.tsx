import ArchiveGrid from '../../components/ArchiveGrid';
import { getTracks } from '../actions';

export default async function Archive() {
  const tracks = await getTracks();

  return (
    <main className="flex-1 w-full flex flex-col bg-black min-h-0 px-8 pt-[90px]">
      <ArchiveGrid tracks={tracks} />
    </main>
  );
}
