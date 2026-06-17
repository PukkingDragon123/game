# 🦦 Otter Village

A cute, polished 3D web game. You're an otter in a sparkling pond — swim around,
scoop up **drifting treasures** (driftwood, reeds, stone, shells), then **plant
them on your island** to build a cozy little village. Each build earns XP and
attracts more otters. Level up your village to unlock fancier buildings!

## Play

It's a single self-contained file — no build step. Just open it:

```bash
# any static server works, e.g.
python3 -m http.server 8000
# then visit http://localhost:8000
```

Or simply open `index.html` in a modern browser.

## Controls

- **Move:** drag anywhere on the left side of the screen (virtual joystick), or use **WASD** / arrow keys on desktop.
- **Gather:** swim into the floating resources to auto-scoop them.
- **Build:** tap a building in the bottom dock — it plants on the nearest empty plot on your island.
- **Grow:** every build gives XP and pop; reach higher Village Levels to unlock docks, wells, big trees and a lantern tower.

## Tech

- [Three.js](https://threejs.org/) (loaded from CDN via import map)
- Procedural low-poly models, an animated water shader, particle bursts, confetti, and tiny WebAudio sound effects.
- Mobile-first: touch joystick, responsive HUD, safe-area aware.

Built to run anywhere a browser does. Have fun! 🌊
