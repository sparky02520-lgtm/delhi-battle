# Delhi Battle — free browser game starter

A small, responsive 2D political-satire arena prototype. It runs as a static site and has optional Supabase Realtime room broadcasting. The artwork is drawn with Canvas, so there are no paid art assets.

## Files
- `index.html` — game page and UI
- `style.css` — responsive layout and mobile controls
- `game.js` — canvas game, movement, paper-ball throws, and optional realtime room sync

## Run locally
Open `index.html` in a browser. For the most reliable local preview, serve this folder with a simple static server, e.g. `python3 -m http.server 8000`, then open `http://localhost:8000`.

## Enable online rooms with Supabase
1. Create a free project at https://supabase.com/.
2. In Supabase project settings, find the Project URL and the publishable/anon key.
3. In `game.js`, replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY` with those values.
4. Ensure Realtime is enabled for your project. The prototype uses Supabase Realtime Broadcast channels; it does not need a database table for the basic demo.
5. Deploy the three files to GitHub Pages (steps below).
6. Open the same website on two devices, choose different teams, enter the same room code, and click Join Arena.

**Security/limitations:** Never put a Supabase `service_role` or secret key in browser JavaScript. This is a prototype, not a cheat-resistant competitive game server: clients can spoof movement and projectiles. For a public competitive release, add server-authoritative gameplay, rate limits, moderation/reporting, and stronger room access controls. Free-tier quotas and terms can change; check Supabase's current pricing page.

## Publish free with GitHub Pages
1. Create/sign into https://github.com/.
2. Create a new public repository, for example `delhi-battle`.
3. Upload `index.html`, `style.css`, and `game.js` to the repository root.
4. Open repository **Settings → Pages**.
5. Under build/deployment, select **Deploy from a branch**, choose `main` and `/ (root)`, then Save.
6. Wait for the deployment. GitHub will show a URL like `https://YOUR-USERNAME.github.io/delhi-battle/`.
7. Share the URL and room code with friends.

No paid custom domain or hosting plan is required for this starter. A public repository means your source code and browser-side public key are visible, which is expected; never commit secrets.

## Current gameplay
- Move with WASD or arrow keys.
- Throw paper balls with Space.
- On mobile, use the on-screen directional pad and THROW button.
- Use the same room code to see remote player positions and paper-ball broadcasts.

## Next improvements
1. Add actual hit detection, health, respawns, and round timer.
2. Add a proper server-authoritative realtime backend before public competitive play.
3. Add a room browser, team balancing, and reconnect support.
4. Replace generic caricatures with original fictional characters and licensed/appropriate art.
