# Meme Reaction Assets

This document tracks the reaction video assets used in the Battleships Multiplayer Meme Reaction System. 

> **Developer Note**: Due to the limitations of automated scraping and copyright protections, the initial implementation uses a synthetic sample MP4 clip derived from the game's existing cinematic intro to demonstrate the architecture and serve as a fully functional placeholder.
> 
> The system has been fully architected to support real assets seamlessly. To replace these placeholders with real videos, simply drop the real MP4s into the respective `client/public/memes/<category>/` folder and update `client/src/memes/manifest.ts`.

## Structure

Assets are organized into the following categories within `client/public/memes/`:

- `hit/`: 8 clips
- `miss/`: 6 clips
- `ship-destroyed/`: 7 clips
- `eliminated/`: 4 clips
- `victory/`: 3 clips

**Total Assets**: 28 MP4 files.
**Approximate Total Asset Size**: ~10 MB (using compressed short placeholders)

## Placeholder Files

Currently, the following files exist in the system and are fully linked to the Game Server's MemeManager weights and categories:

### Hit (8)
- `hit_1.mp4` to `hit_8.mp4`

### Miss (6)
- `miss_1.mp4` to `miss_6.mp4`

### Ship Destroyed (7)
- `destroyed_1.mp4` to `destroyed_7.mp4`

### Player Eliminated (4)
- `eliminated_1.mp4` to `eliminated_4.mp4`

### Victory (3)
- `victory_1.mp4` to `victory_3.mp4`

## Adding Real Royalty-Free Footage

When adding actual footage from Mixkit, Pixabay, or Pexels:

1. **Download** the clip (ensure it is royalty-free/CC0).
2. **Compress** it using FFmpeg if it exceeds 3-5MB:
   `ffmpeg -i input.mp4 -vcodec libx264 -crf 28 -preset fast -vf scale=-1:720 -an output.mp4`
3. **Rename** it to match the manifest, or add a new entry to `client/src/memes/manifest.ts` and `server/src/game/MemeManager.ts`.
4. **Document** the source below:

### Example Real Asset Entry (Future)
- **File**: `hit_telugu_01.mp4`
- **Category**: hit
- **Source Website**: Pixabay
- **Source Page**: https://pixabay.com/videos/search/funny%20reaction/
- **License**: Pixabay License (Free for commercial use, No attribution required)
- **Language**: telugu
