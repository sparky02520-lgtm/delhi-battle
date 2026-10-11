# DELHI BATTLE

Phase 1: main menu + playable 3D endless runner (Delhi), 9 characters with transformation abilities, local high scores.
Battle mode, online multiplayer, accounts and extra cities are **not built yet** (they are labelled "coming soon" in the UI).

## Run it
```bash
npm install
npm run dev      # open the URL it prints (usually http://localhost:5173)
npm run build    # production build into dist/
```

## Publish on GitHub Pages
1. Commit everything and push to `main`.
2. GitHub repo → Settings → Pages → Source: **GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` builds and deploys. Site: `https://<your-user>.github.io/delhi-battle/`.
`vite.config.js` uses `base: './'`, so asset paths work under that sub-path.

## Where to change things
- `src/app/config.js`: ability duration/cooldown/multiplier, speeds, and all nine characters (names, colours, effects).
- `src/runner/world.js`: obstacle types, spawn rules, Delhi city segments.
- `src/runner/effects.js` + `characters3d.js`: transformation visuals.
- `src/services/audio.js`: procedural sounds (swap in real files from `public/assets/audio/` later).

## Manual test checklist
Menu opens · pick a character · Play · A/D or arrows switch all 3 lanes · W jumps · S slides · hit an obstacle → Game Over ·
Space triggers ability (≈5 s boost, then ≈15 s cooldown; pressing early does nothing) · coins raise the counter ·
Restart works · refresh the page: best score is still there · Esc pauses · on a phone: swipes and the ability button work.
