# Delhi Battle v0.10 — Reload + Fighter/Team Selection

## Changes in this build
- Empty magazines automatically start a timed 1.5-second reload when reserve ammunition is available.
- Manual reload remains available through the RELOAD touch button or `R` on desktop.
- Firing is driven by the AIM/FIRE joystick on mobile; the extra FIRE button has been removed. Desktop mouse aiming and hold-to-fire remain available.
- Added fighter and team selectors to the start screen. The selected fighter and team are shown in the HUD and above the character.
- BJP and CJP use distinct team colors; the rival is assigned to the opposing team. Fighter-specific artwork, signature weapons and abilities are not implemented yet.

## Install
Extract this ZIP and replace `index.html`, `style.css`, `game.js`, and `README.md` at the root of your existing GitHub repository. Commit the changes and wait for GitHub Pages to deploy.

## Controls
- Desktop: A/D or arrows move; Space jump; Shift jetpack; mouse aim and hold to fire; R reload; G grenade; 1/2/3 weapon selection; E security console.
- Mobile landscape: left joystick moves; right AIM/FIRE joystick aims and fires; JUMP, JET, GREN and RELOAD buttons provide actions.

## Limitations
Offline bot prototype only. Online multiplayer, private rooms, full roster-specific artwork and abilities are not included. JavaScript syntax and ZIP integrity should be checked before deployment; full browser playtesting is still recommended.
