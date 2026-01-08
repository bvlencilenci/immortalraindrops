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
    <main className="min-h-screen w-full flex flex-col items-center justify-start p-0">
      <div className="w-full max-w-[1920px]">
        {/* Optional Header / Title could go here */}
        <header className="p-4 border-b border-[#222]">
          <h1 className="text-xl font-bold uppercase tracking-widest text-[#444]">
            Immortal Raindrops
          </h1>
        </header>

        <ArchiveGrid tracks={tracks} />
      </div>
    </main>
  );
}
