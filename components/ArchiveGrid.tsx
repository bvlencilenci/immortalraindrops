import Tile from './Tile';

interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
}

interface ArchiveGridProps {
  tracks: Track[];
}

const ArchiveGrid = ({ tracks }: ArchiveGridProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-0 border-t border-l border-[#222]">
      {tracks.map((track) => (
        <Tile
          key={track.id}
          id={track.id}
          title={track.title}
          artist={track.artist}
          url={track.url}
        />
      ))}
    </div>
  );
};

export default ArchiveGrid;
