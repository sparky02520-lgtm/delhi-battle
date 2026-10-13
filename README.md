# Delhi Battle v0.19 — Split Controls & Weapon HUD

A browser-playable, offline 2D political-satire arena shooter prototype.

## What's new in v0.19
- Rebalanced mobile controls across both hands: movement joystick and utility buttons (jump, jet, reload, special, ultimate) are on the left; aiming joystick and a compact PlayStation-inspired action cluster (fire, grenade mode, punch, swap) are on the right.
- Circular, translucent △ ○ × □-style buttons use compact labels and brighter press feedback.
- Weapon HUD now displays a distinct pistol/rifle/SMG/sniper silhouette, equipped weapon slot, current magazine/reserve ammo, ammo bar, and grenade-mode status. Swipe the HUD horizontally to switch weapons.
- Kept aim-stick hold-to-fire behavior: pushing/holding away from centre fires; releasing, cancelling, or returning to centre stops firing. The separate FIRE button remains available.

## Previous features retained
- Touch action buttons use near-clear glass styling with no blur layer, so the action remains visible behind them.
- Grenades use the last direction aimed with the right firing joystick (or mouse aim on desktop), show a dotted throw guide, bounce off cover/ground, and deal distance-based blast damage. Aim first, then tap GREN.
- Added close-range PUNCH button and desktop F key, with cooldown, hit range, knockback, arm animation, and punch sound.
- Added character-specific parody callouts spoken through the browser's text-to-speech voice when available, plus differentiated character attack visuals. These are stylized game lines, not recordings or exact voice impersonations.
- Added punch/ricochet sound envelopes and an audio unlock sound when a match starts.
- Previous arenas, supply drops, destructible cover, chaos events, character selection, pause menu and controls retained.

## Install into the existing GitHub repository
1. Extract this ZIP.
2. Open the `delhi-battle-v17` folder inside this ZIP.
3. Replace repository-root `index.html`, `style.css`, `game.js`, and `README.md`. Do not upload the enclosing folder as a nested directory.
4. Commit the changes and wait for GitHub Pages to redeploy.

## Controls
- Desktop: A/D move, Space jump, Shift jetpack, mouse aim/fire, G grenade, F punch, R reload, Q special, X ultimate.
- Mobile: left stick move; right stick aim/fire; tap GREN to throw in the last aimed direction; PUNCH for melee.
- Browser speech and Web Audio require browser support and an initial user interaction. SFX can be toggled with the on-screen button.

## Current limitations
Offline single-player against one bot only. Online multiplayer/server rooms are not implemented. Browser speech depends on the voices installed in the user's browser/device.


## v0.17 controls and combat reactions
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
- Right side: AIM · HOLD TO FIRE joystick plus circular GREN, FIRE, PUNCH and SWAP buttons.
- Top-right weapon card shows a weapon silhouette and magazine/reserve ammo; swipe horizontally across the card to cycle weapons.
- Touch controls are translucent to preserve battlefield visibility.
