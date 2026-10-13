# Delhi Battle v0.15 — Arena Chaos

A browser-playable, offline 2D political-satire arena shooter prototype.

## What's new in v0.15
- Translucent mobile action buttons so the game remains visible underneath.
- Toggleable synthesized arcade sound effects (no external audio files required).
- Character-specific meme attack callouts, including Rahul Gandhi's “Bharat Jodo Charge”.
- Supply drops that land during a match and replenish gear.
- Destructible wall/barrier cover; shooting damaged cover can break it open.
- Arena-specific chaos bursts with visual effects and announcements.
- Existing five arenas, fighter selection, abilities, ultimates, touch controls and pause menu retained.

## Install into the existing GitHub repository
1. Extract this ZIP.
2. Open the `delhi-battle-v15` folder.
3. Replace the repository-root `index.html`, `style.css`, `game.js`, and `README.md` with these files. Do not upload the enclosing folder as a nested directory.
4. Commit the changes to the existing repository and wait for GitHub Pages to redeploy.

Sound uses the browser's Web Audio API and starts after an interaction. Use the `SFX ON/OFF` button to toggle it.

## Current limitations
This remains an offline single-player prototype against one bot. Online multiplayer/server rooms are not implemented. Sound effects are synthesized arcade tones, not recorded voice clips.
