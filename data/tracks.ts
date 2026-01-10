export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  coverImage: string;
  duration: string;
  r2_key?: string;
  genre?: string;
  media_type?: string;
  audio_key?: string;
  image_key?: string;
}

const R2_URL = process.env.NEXT_PUBLIC_R2_URL || 'https://archive.org/download';

export const tracks: Track[] = [
  {
    id: "track1",
    title: "may 8 mix",
    artist: "p/rpose",
    // Note: User requested to use R2 URL as base.
    // Assuming filenames match the previous archive.org paths for now or falling back to archive.org if env is missing.
    // If env is provided, it expects the file to be at ROOT of R2 bucket.
    // Original: https://archive.org/download/may-8-calm-mix/may%208%20calm%20mix.mp3
    url: `${R2_URL}/may-8-calm-mix/may%208%20calm%20mix.mp3`,
    coverImage: "/images/may8mix_pic.jpg",
    duration: "0:00"
  },
  {
    id: "track2",
    title: "test2",
    artist: "Null Pointer",
    // Original: https://archive.org/download/CanonInD_261/CanoninD.mp3
    url: `${R2_URL}/CanonInD_261/CanoninD.mp3`,
    coverImage: "/images/test2_pic.jpg",
    duration: "5:34"
  },
  {
    id: "track3",
    title: "test3",
    artist: "Memory Leak",
    // Original: https://archive.org/download/mythium/JLS_ATI.mp3
    url: `${R2_URL}/mythium/JLS_ATI.mp3`,
    coverImage: "/images/test3_pic.jpg",
    duration: "4:20"
  },
  {
    id: "track4",
    title: "test4",
    artist: "Stack Trace",
    // Original: https://archive.org/download/testmp3testfile/mp3test.mp3
    url: `${R2_URL}/testmp3testfile/mp3test.mp3`,
    coverImage: "/images/test4_pic.jpg",
    duration: "0:12"
  },
  {
    id: "track5",
    title: "test5",
    artist: "Void Walker",
    url: `${R2_URL}/testmp3testfile/mp3test.mp3`,
    coverImage: "/images/test5_pic.jpg",
    duration: "0:15"
  },
  {
    id: "track6",
    title: "test6",
    artist: "Kernel Panic",
    url: `${R2_URL}/testmp3testfile/mp3test.mp3`,
    coverImage: "/images/test6_pic.jpg",
    duration: "0:18"
  },
  {
    id: "tile-4",
    title: "UNTITLED BURIAL FINAL MASTER",
    artist: "p/rpose",
    url: `${R2_URL}/UNTITLED%20BURIAL%20FINAL%20MASTER%20.wav`,
    coverImage: "/images/placeholder.jpg",
    duration: "0:00"
  }
];
