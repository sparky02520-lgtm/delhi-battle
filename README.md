# Delhi Battle v0.11 — Caricature Fighters & Signature Abilities

This update builds on v0.10 and keeps the existing controls, auto/manual reload, Parliament District geometry, security event, health and pickups.

## New in v0.11
- Compact cartoon caricature-style fighter rendering with distinct hair, facial hair, glasses, outfits and accent colors for all nine selectable fighters.
- Special ability: `Q` on desktop or the SPECIAL touch button.
- Ultimate: `X` on desktop or the ULT touch button. Ultimate charge increases slowly over time and faster when damaging the bot.
- Unique abilities and ultimate effects are mapped to each fighter. These are first-pass balance values and should be playtested.
- Adds visual ability effects and scan/shield indicators.

## Controls
- A/D or arrows: move; Space/W/Up: jump/double jump; Shift: jetpack.
- Mouse aim and hold to fire; on mobile use the aim/fire joystick.
- R or RELOAD: manual reload; empty magazines also auto-reload.
- Q / SPECIAL: character special ability. X / ULT: ultimate when charge reaches 100%.
- G / GREN: grenade; E near console: security event; 1/2/3: weapon slots.

## Current limitations
- Offline bot match only. Online multiplayer/private rooms are not connected.
- Arena selection and the other four arenas are not included yet; Parliament District remains the playable map.
- Character drawings are original canvas-drawn caricature approximations, not finished hand-drawn sprite sheets. Ability values need balancing after playtesting.

## Install
Replace `index.html`, `style.css`, `game.js`, and `README.md` at the root of the existing GitHub repository, commit the changes, then wait for GitHub Pages to redeploy.
