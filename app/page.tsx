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
    <main className="flex-1 w-full flex flex-col items-center justify-start p-0 bg-black">
      <ArchiveGrid tracks={tracks} />
    </main>
  );
}
