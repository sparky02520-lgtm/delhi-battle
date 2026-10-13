# Delhi Battle v0.20 — Right-Hand Action Controls

A browser-playable, offline 2D political-satire arena shooter prototype.

## What's new in v0.20
- Removed the separate R2/FIRE button and the separate SWAP button. The right aim stick aims and fires while held.
- Tapping the weapon card in the top-right switches to the next collected weapon; its weapon silhouette and ammo display remain visible.
- Reload remains automatic when the magazine empties and is also available as a manual button.
- Moved JUMP, JET, PUNCH, RELOAD, GREN, SPECIAL, and ULT to the right-hand action cluster. The left hand is reserved for movement.
- In grenade mode, aim with the right stick and release it to throw; gun mode then returns automatically.

## Previous features retained
- Touch action buttons use near-clear glass styling with no blur layer, so the action remains visible behind them.
- Grenades use the last direction aimed with the right firing joystick (or mouse aim on desktop), show a dotted throw guide, bounce off cover/ground, and deal distance-based blast damage. Tap GREN to arm a grenade, aim with the right stick, then release the stick to throw.
- Added close-range PUNCH button and desktop F key, with cooldown, hit range, knockback, arm animation, and punch sound.
- Added character-specific parody callouts spoken through the browser's text-to-speech voice when available, plus differentiated character attack visuals. These are stylized game lines, not recordings or exact voice impersonations.
- Added punch/ricochet sound envelopes and an audio unlock sound when a match starts.
- Previous arenas, supply drops, destructible cover, chaos events, character selection, pause menu and controls retained.

## Install into the existing GitHub repository
1. Extract this ZIP.
2. Open the `delhi-battle-v19` folder inside this ZIP.
3. Replace repository-root `index.html`, `style.css`, `game.js`, and `README.md`. Do not upload the enclosing folder as a nested directory.
4. Commit the changes and wait for GitHub Pages to redeploy.

## Controls
- Desktop: A/D move, Space jump, Shift jetpack, mouse aim/fire, G grenade, F punch, R reload, Q special, X ultimate.
- Mobile: left stick move; right stick aim/fire; tap the top-right weapon card to switch weapons; right-side buttons provide jump, jet, punch, reload, grenade, special and ultimate.
- Browser speech and Web Audio require browser support and an initial user interaction. SFX can be toggled with the on-screen button.

## Current limitations
Offline single-player against one bot only. Online multiplayer/server rooms are not implemented. Browser speech depends on the voices installed in the user's browser/device.


## Earlier controls and combat reactions
- Mobile aim joystick only aims; it no longer fires by itself. Hold FIRE to shoot.
- GREN MODE switches the FIRE button to THROW, so a grenade cannot accidentally launch while shooting. Aim first, then tap THROW. Tap GUN MODE to return to shooting.
- SWAP cycles collected weapons; the ammo readout is shown in the top-right of the play area. Desktop uses mouse hold to fire, G for grenade, F for punch, Tab to cycle weapons, and 1/2/3 for direct selection.
- Hits cause stagger, knockback and a short hit flash; grenade blasts apply distance-based damage and knockback.


## v0.18 touch firing and weapon feedback
- Right aim joystick now fires only while actively pushed; releasing it or pointer-cancelling immediately stops touch firing.
- The aim joystick no longer triggers grenade throws. In grenade mode, use the THROW/FIRE action button to throw.
- Added distinct pistol, rifle, SMG and sniper silhouettes with weapon-specific recoil and muzzle flashes.
- Weapon HUD briefly pops/highlights when switching weapons.
- Desktop mouse firing remains hold-to-fire.


## v0.19 mobile layout
- Left side: move joystick plus JUMP, JET, RELOAD, SPECIAL and ULT.
- Right side: AIM · HOLD TO FIRE joystick plus circular JUMP, JET, PUNCH, RELOAD, GREN, SPECIAL and ULT buttons. Tap the top-right weapon card to switch weapons.
- Top-right weapon card shows a weapon silhouette and magazine/reserve ammo; swipe horizontally across the card to cycle weapons.
- Touch controls are translucent to preserve battlefield visibility.
