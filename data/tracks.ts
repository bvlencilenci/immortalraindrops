export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  // Computed URL Props (optional/legacy support for fallback)
  url?: string;
  coverImage?: string;

  // New Schema Props
  media_type?: string;
  audio_key?: string;
  image_key?: string;
  tileIndex?: number;
  genre?: string;
}

const R2_URL = process.env.NEXT_PUBLIC_R2_URL || 'https://archive.org/download';

export const tracks: Track[] = [
  {
    id: "track1",
    title: "may 8 mix",
    artist: "p/rpose",
    media_type: "song",
    audio_key: "may-8-calm-mix/may%208%20calm%20mix.mp3",
    image_key: "may-8-calm-mix/cover.jpg", // Placeholder key, fallback uses existing logic
    url: `${R2_URL}/may-8-calm-mix/may%208%20calm%20mix.mp3`,
    coverImage: "/images/may8mix_pic.jpg",
    duration: "0:00",
    tileIndex: 0
  },
  {
    id: "track2",
    title: "test2",
    artist: "Null Pointer",
    media_type: "song",
    audio_key: "CanonInD_261/CanoninD.mp3",
    url: `${R2_URL}/CanonInD_261/CanoninD.mp3`,
    coverImage: "/images/test2_pic.jpg",
    duration: "5:34",
    tileIndex: 1
  },
  {
    id: "track3",
    title: "test3",
    artist: "Memory Leak",
    media_type: "song",
    audio_key: "mythium/JLS_ATI.mp3",
    url: `${R2_URL}/mythium/JLS_ATI.mp3`,
    coverImage: "/images/test3_pic.jpg",
    duration: "4:20",
    tileIndex: 2
  },
  {
    id: "track4",
    title: "test4",
    artist: "Stack Trace",
    media_type: "song",
    audio_key: "testmp3testfile/mp3test.mp3",
    url: `${R2_URL}/testmp3testfile/mp3test.mp3`,
    coverImage: "/images/test4_pic.jpg",
    duration: "0:12",
    tileIndex: 3
  },
  {
    id: "track5",
    title: "test5",
    artist: "Void Walker",
    media_type: "song",
    audio_key: "testmp3testfile/mp3test.mp3",
    url: `${R2_URL}/testmp3testfile/mp3test.mp3`,
    coverImage: "/images/test5_pic.jpg",
    duration: "0:15",
    tileIndex: 4
  },
  {
    id: "track6",
    title: "test6",
    artist: "Kernel Panic",
    media_type: "song",
    audio_key: "testmp3testfile/mp3test.mp3",
    url: `${R2_URL}/testmp3testfile/mp3test.mp3`,
    coverImage: "/images/test6_pic.jpg",
    duration: "0:18",
    tileIndex: 5
  },
  {
    id: "tile-4",
    title: "UNTITLED BURIAL FINAL MASTER",
    artist: "p/rpose",
    media_type: "song",
    audio_key: "UNTITLED%20BURIAL%20FINAL%20MASTER%20.wav",
    url: `${R2_URL}/UNTITLED%20BURIAL%20FINAL%20MASTER%20.wav`,
    coverImage: "/images/placeholder.jpg",
    duration: "0:00",
    tileIndex: 6
  }
];
