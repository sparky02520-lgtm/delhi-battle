# Delhi Battle — Tactical Arena Build 0.6

This is a browser-playable offline prototype focused on the first complete tactical test arena: Parliament District.

## Included
- Automatic security lockdown event with advance warning
- Temporary shutter barricade changes the route; jump over it or use another path
- Two security consoles can trigger the event early with E when nearby; 45-second cooldown
- Side-scrolling camera across a wide map
- Platforms, solid barriers, building walls, and multiple routes
- Solid obstacles stop bullets
- Bushes conceal characters but do not block bullets
- Running, jumping, double jump, and limited-fuel jetpack
- Jetpack fuel refills only while grounded
- Health regeneration after 4 seconds without damage
- Collectible health packs, ammo, SMG, and sniper pickups
- Pistol + rifle starting loadout and weapon switching
- Training bot that moves, jumps toward high ground, and shoots when line of sight is clear
- Team-deathmatch-style 3-minute score match
- Mobile landscape touch controls and desktop mouse/keyboard controls

## Controls
- A / D or Left / Right: move
- Space or W / Up: jump, then double jump
- Hold Shift: jetpack (fuel refills only after landing)
- Mouse: aim; hold left mouse button to fire
- R: reload
- 1 / 2 / 3: switch available weapons
- G: throw grenade
- E: trigger a security lockdown at a nearby glowing console (when ready)
- Mobile: left joystick to move, right joystick to aim/fire, buttons for jump/jet/grenade/reload

## Run locally
Open `index.html` in a modern browser. No build step or external libraries are required.

## Publish to the existing GitHub Pages repository
1. Download and unzip this archive.
2. Open the `delhi-battle` folder inside it.
3. In your existing repository, upload/replace `index.html`, `style.css`, `game.js`, and `README.md` at the repository root (not inside an extra nested folder).
4. Commit the changes. GitHub Pages will redeploy automatically after a short delay.
5. Open your existing GitHub Pages URL and refresh. If the old version remains, do a hard refresh.

## Limitations
This is an offline prototype with one local training bot. Real online multiplayer, private rooms, 5v5 networking, final character roster, and the other arenas are not connected yet. This build is for testing the tactical movement/collision loop first.


## v0.8 fix notes
- Jetpack lift is capped and the fighter cannot fly above the visible arena.
- While the jetpack is held, steer left/right with A/D, arrow keys, or the mobile movement stick.
- Ground collision is resolved separately and the character render position is clamped so the full body remains visible on the ground.


### v0.8 updates
- Moved jump, jetpack, fire, grenade and reload buttons next to the right aim joystick.
- Inset both joysticks from the screen edges.
- Added a dedicated hold-to-fire touch button.
- Raised the ground line and aligned low cover with it to give the character more visible space above ground.
