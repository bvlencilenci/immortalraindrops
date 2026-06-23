export interface QueuedTrack {
  url: string;
  title: string;
  artist: string;
  addedAt: number;
}

const globalForQueue = global as unknown as { featuredQueue: QueuedTrack[] };
export const featuredQueue = globalForQueue.featuredQueue || [];
if (process.env.NODE_ENV !== 'production') {
  globalForQueue.featuredQueue = featuredQueue;
}

export function addToQueue(track: { url: string; title: string; artist: string }) {
  featuredQueue.push({
    ...track,
    addedAt: Date.now(),
  });
}

export function getNextFromQueue(): QueuedTrack | null {
  if (featuredQueue.length === 0) return null;
  return featuredQueue.shift() || null;
}
