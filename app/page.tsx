import ArchiveGrid from '../components/ArchiveGrid';
import { promises as fs } from 'fs';
import path from 'path';

async function getData() {
  // Read the JSON file from the public directory
  const filePath = path.join(process.cwd(), 'public', 'archive.json');
  const fileContents = await fs.readFile(filePath, 'utf8');
  return JSON.parse(fileContents);
}

export default async function Home() {
  const tracks = await getData();

  return (
    <main className="h-full w-full p-0 bg-black">
      <div className="h-full w-full">
        <ArchiveGrid tracks={tracks} />
      </div>
    </main>
  );
}
