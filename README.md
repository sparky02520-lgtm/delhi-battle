# Delhi Battle — Prototype 0.2

A browser-based 2D side-view combat prototype for the Delhi Battle project.

## What's included
- Canvas-based Delhi-inspired training arena
- Keyboard movement and mouse aiming/shooting
- Landscape-first mobile layout with a rotate-phone prompt in portrait mode
- Touchscreen movement and aim/fire joysticks positioned inside the visible screen bounds
- Jumping, jetpack, grenades, melee, reloading
- A basic training bot with health, damage, elimination and respawn
- Responsive interface for desktop and mobile

## Controls
- **A / D** or **Left / Right**: move
- **W / Up / Space**: jump
- **Shift**: jetpack
- **Mouse**: aim
- **Left mouse button**: fire
- **R**: reload
- **G**: grenade
- **F**: melee
- On mobile, rotate the phone horizontally (landscape) and use the on-screen joysticks and action buttons. Tap Enter Training to attempt fullscreen and landscape orientation lock where the browser supports it.

## Run locally
Open `index.html` in a modern browser. If your browser restricts local files, run a static server in this folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish using GitHub Pages
1. Upload `index.html`, `style.css`, `game.js`, and `README.md` to the **root** of the `main` branch.
2. Open repository **Settings → Pages**.
3. Choose **Deploy from a branch**, select `main` and `/(root)`, then save.
4. Wait for the deployment to complete, then open your GitHub Pages URL.

## Important status
This is **Version 0.1**, a local single-player prototype. It does **not** yet have real online multiplayer, matchmaking, a room system, all five final arenas, or a production-ready server. Those will be built in later stages. GitHub Pages hosts static browser files; online multiplayer requires a separate realtime backend/server.

All visuals in this prototype are drawn with Canvas and CSS. The project does not include copied game assets.
