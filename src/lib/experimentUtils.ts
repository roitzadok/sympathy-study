// Rotation pairs: which two videos get rotated (0-indexed)
// C(6,2) = 15 pairs
export const ROTATION_PAIRS: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [0, 5],
  [1, 2],
  [1, 3],
  [1, 4],
  [1, 5],
  [2, 3],
  [2, 4],
  [2, 5],
  [3, 4],
  [3, 5],
  [4, 5],
];

/**
 * Simple hash function for email to determine rotation pair
 * Returns a number 0-14
 */
export function hashEmail(email: string): number {
  let hash = 0;
  const normalizedEmail = email.toLowerCase().trim();
  
  for (let i = 0; i < normalizedEmail.length; i++) {
    const char = normalizedEmail.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash) % 15;
}

/**
 * Get which video indices should be rotated based on email
 */
export function getRotatedVideos(email: string): [number, number] {
  const pairIndex = hashEmail(email);
  return ROTATION_PAIRS[pairIndex];
}

/**
 * Check if a video index should be rotated
 */
export function shouldRotateVideo(email: string, videoIndex: number): boolean {
  const [first, second] = getRotatedVideos(email);
  return videoIndex === first || videoIndex === second;
}

/**
 * Fisher-Yates shuffle with seeded random for deterministic order per email
 */
export function seededShuffle<T>(array: T[], seed: string): T[] {
  const result = [...array];
  let seedHash = 0;
  
  for (let i = 0; i < seed.length; i++) {
    seedHash = ((seedHash << 5) - seedHash) + seed.charCodeAt(i);
    seedHash = seedHash & seedHash;
  }
  
  // Simple seeded random
  const seededRandom = () => {
    seedHash = (seedHash * 1103515245 + 12345) & 0x7fffffff;
    return seedHash / 0x7fffffff;
  };
  
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
}

/**
 * Get randomized video order for a participant
 */
export function getVideoOrder(email: string): number[] {
  const videos = [0, 1, 2, 3, 4, 5];
  return seededShuffle(videos, email.toLowerCase().trim());
}

/**
 * Video placeholder data
 */
export const VIDEO_DATA = [
  { id: 0, title: "Video 1", placeholder: "Interview Clip 1" },
  { id: 1, title: "Video 2", placeholder: "Interview Clip 2" },
  { id: 2, title: "Video 3", placeholder: "Interview Clip 3" },
  { id: 3, title: "Video 4", placeholder: "Interview Clip 4" },
  { id: 4, title: "Video 5", placeholder: "Interview Clip 5" },
  { id: 5, title: "Video 6", placeholder: "Interview Clip 6" },
];
