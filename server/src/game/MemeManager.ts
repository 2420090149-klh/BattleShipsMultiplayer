export interface MemeConfig {
  id: string;
  category: 'hit' | 'miss' | 'ship-destroyed' | 'eliminated' | 'victory';
  weight: number;
}

export const SERVER_MEME_MANIFEST: MemeConfig[] = [
  // HIT
  { id: 'hit_1', category: 'hit', weight: 1 },
  { id: 'hit_2', category: 'hit', weight: 1 },
  { id: 'hit_3', category: 'hit', weight: 1 },
  { id: 'hit_4', category: 'hit', weight: 1 },
  { id: 'hit_5', category: 'hit', weight: 1 },
  { id: 'hit_6', category: 'hit', weight: 1 },
  { id: 'hit_7', category: 'hit', weight: 1 },
  { id: 'hit_8', category: 'hit', weight: 1 },

  // MISS
  { id: 'miss_1', category: 'miss', weight: 1 },
  { id: 'miss_2', category: 'miss', weight: 1 },
  { id: 'miss_3', category: 'miss', weight: 1 },
  { id: 'miss_4', category: 'miss', weight: 1 },
  { id: 'miss_5', category: 'miss', weight: 1 },
  { id: 'miss_6', category: 'miss', weight: 1 },

  // SHIP DESTROYED
  { id: 'destroyed_1', category: 'ship-destroyed', weight: 1 },
  { id: 'destroyed_2', category: 'ship-destroyed', weight: 1 },
  { id: 'destroyed_3', category: 'ship-destroyed', weight: 1 },
  { id: 'destroyed_4', category: 'ship-destroyed', weight: 1 },
  { id: 'destroyed_5', category: 'ship-destroyed', weight: 1 },
  { id: 'destroyed_6', category: 'ship-destroyed', weight: 1 },
  { id: 'destroyed_7', category: 'ship-destroyed', weight: 1 },

  // PLAYER ELIMINATED
  { id: 'eliminated_1', category: 'eliminated', weight: 1 },
  { id: 'eliminated_2', category: 'eliminated', weight: 1 },
  { id: 'eliminated_3', category: 'eliminated', weight: 1 },
  { id: 'eliminated_4', category: 'eliminated', weight: 1 },

  // VICTORY
  { id: 'victory_1', category: 'victory', weight: 1 },
  { id: 'victory_2', category: 'victory', weight: 1 },
  { id: 'victory_3', category: 'victory', weight: 1 },
];

export class MemeManager {
    private recentMemes: string[] = [];
    private lastMemeTime: number = 0;
    private readonly COOLDOWN_MS = 8000;

    public evaluateEvent(category: 'hit' | 'miss' | 'ship-destroyed' | 'eliminated' | 'victory'): string | null {
        const now = Date.now();
        if (now - this.lastMemeTime < this.COOLDOWN_MS) {
            return null; // On cooldown
        }

        let chance = 0;
        switch (category) {
            case 'hit': chance = 0.3; break;
            case 'miss': chance = 0.2; break;
            case 'ship-destroyed': chance = 0.85; break;
            case 'eliminated': chance = 0.95; break;
            case 'victory': chance = 1.0; break;
        }

        if (Math.random() > chance) {
            return null; // Did not trigger
        }

        const candidates = SERVER_MEME_MANIFEST.filter(m => m.category === category);
        if (candidates.length === 0) return null;

        // Try to avoid recent memes
        let available = candidates.filter(m => !this.recentMemes.includes(m.id));
        if (available.length === 0) {
            // If all are recently used, just use any
            available = candidates;
        }

        // Weighted selection (simple uniform since weights are 1)
        const selected = available[Math.floor(Math.random() * available.length)];

        this.recentMemes.push(selected.id);
        if (this.recentMemes.length > 4) {
            this.recentMemes.shift();
        }

        this.lastMemeTime = now;
        return selected.id;
    }
}
