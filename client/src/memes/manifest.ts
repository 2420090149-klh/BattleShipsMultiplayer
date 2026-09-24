export interface MemeConfig {
  id: string;
  file: string;
  category: 'hit' | 'miss' | 'ship-destroyed' | 'eliminated' | 'victory';
  language: 'neutral' | 'english' | 'telugu' | 'hindi';
  weight: number;
  durationMs: number;
}

export const MEME_MANIFEST: MemeConfig[] = [
  // HIT (8 clips)
  { id: 'hit_1', file: '/memes/hit/hit_1.mp4', category: 'hit', language: 'neutral', weight: 1, durationMs: 2500 },
  { id: 'hit_2', file: '/memes/hit/hit_2.mp4', category: 'hit', language: 'neutral', weight: 1, durationMs: 2500 },
  { id: 'hit_3', file: '/memes/hit/hit_3.mp4', category: 'hit', language: 'neutral', weight: 1, durationMs: 2500 },
  { id: 'hit_4', file: '/memes/hit/hit_4.mp4', category: 'hit', language: 'neutral', weight: 1, durationMs: 2500 },
  { id: 'hit_5', file: '/memes/hit/hit_5.mp4', category: 'hit', language: 'neutral', weight: 1, durationMs: 2500 },
  { id: 'hit_6', file: '/memes/hit/hit_6.mp4', category: 'hit', language: 'neutral', weight: 1, durationMs: 2500 },
  { id: 'hit_7', file: '/memes/hit/hit_7.mp4', category: 'hit', language: 'neutral', weight: 1, durationMs: 2500 },
  { id: 'hit_8', file: '/memes/hit/hit_8.mp4', category: 'hit', language: 'neutral', weight: 1, durationMs: 2500 },

  // MISS (6 clips)
  { id: 'miss_1', file: '/memes/miss/miss_1.mp4', category: 'miss', language: 'neutral', weight: 1, durationMs: 2500 },
  { id: 'miss_2', file: '/memes/miss/miss_2.mp4', category: 'miss', language: 'neutral', weight: 1, durationMs: 2500 },
  { id: 'miss_3', file: '/memes/miss/miss_3.mp4', category: 'miss', language: 'neutral', weight: 1, durationMs: 2500 },
  { id: 'miss_4', file: '/memes/miss/miss_4.mp4', category: 'miss', language: 'neutral', weight: 1, durationMs: 2500 },
  { id: 'miss_5', file: '/memes/miss/miss_5.mp4', category: 'miss', language: 'neutral', weight: 1, durationMs: 2500 },
  { id: 'miss_6', file: '/memes/miss/miss_6.mp4', category: 'miss', language: 'neutral', weight: 1, durationMs: 2500 },

  // SHIP DESTROYED (7 clips)
  { id: 'destroyed_1', file: '/memes/ship-destroyed/destroyed_1.mp4', category: 'ship-destroyed', language: 'neutral', weight: 1, durationMs: 2500 },
  { id: 'destroyed_2', file: '/memes/ship-destroyed/destroyed_2.mp4', category: 'ship-destroyed', language: 'neutral', weight: 1, durationMs: 2500 },
  { id: 'destroyed_3', file: '/memes/ship-destroyed/destroyed_3.mp4', category: 'ship-destroyed', language: 'neutral', weight: 1, durationMs: 2500 },
  { id: 'destroyed_4', file: '/memes/ship-destroyed/destroyed_4.mp4', category: 'ship-destroyed', language: 'neutral', weight: 1, durationMs: 2500 },
  { id: 'destroyed_5', file: '/memes/ship-destroyed/destroyed_5.mp4', category: 'ship-destroyed', language: 'neutral', weight: 1, durationMs: 2500 },
  { id: 'destroyed_6', file: '/memes/ship-destroyed/destroyed_6.mp4', category: 'ship-destroyed', language: 'neutral', weight: 1, durationMs: 2500 },
  { id: 'destroyed_7', file: '/memes/ship-destroyed/destroyed_7.mp4', category: 'ship-destroyed', language: 'neutral', weight: 1, durationMs: 2500 },

  // PLAYER ELIMINATED (4 clips)
  { id: 'eliminated_1', file: '/memes/eliminated/eliminated_1.mp4', category: 'eliminated', language: 'neutral', weight: 1, durationMs: 3000 },
  { id: 'eliminated_2', file: '/memes/eliminated/eliminated_2.mp4', category: 'eliminated', language: 'neutral', weight: 1, durationMs: 3000 },
  { id: 'eliminated_3', file: '/memes/eliminated/eliminated_3.mp4', category: 'eliminated', language: 'neutral', weight: 1, durationMs: 3000 },
  { id: 'eliminated_4', file: '/memes/eliminated/eliminated_4.mp4', category: 'eliminated', language: 'neutral', weight: 1, durationMs: 3000 },

  // VICTORY (3 clips)
  { id: 'victory_1', file: '/memes/victory/victory_1.mp4', category: 'victory', language: 'neutral', weight: 1, durationMs: 4000 },
  { id: 'victory_2', file: '/memes/victory/victory_2.mp4', category: 'victory', language: 'neutral', weight: 1, durationMs: 4000 },
  { id: 'victory_3', file: '/memes/victory/victory_3.mp4', category: 'victory', language: 'neutral', weight: 1, durationMs: 4000 },
];
