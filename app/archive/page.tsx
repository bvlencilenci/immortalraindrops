import ArchiveGrid from '../../components/ArchiveGrid';
import { getTracks } from '../actions';

export default async function Archive() {
  const tracks = await getTracks();

  return (
    <main className="flex-1 w-full flex flex-col bg-black px-8 pt-24 lg:pt-0">
      <ArchiveGrid tracks={tracks} />
    </main>
  );
}
