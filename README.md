# 🦦 Otter Village

A cute, polished 3D web game. You're an otter in a sparkling pond — swim around,
scoop up **drifting treasures** (driftwood, reeds, stone, shells), **catch fish**,
then **plant buildings on your island** to grow a cozy little village. Each build
earns XP and attracts more otters. Level up to unlock fancier buildings!

## Features

- **🐟 Fish with rarity** — Common → Uncommon → Rare → Epic → Legendary species
  (Minnow, Rainbow Trout, Crystal Angel, Rainbow Koi, Golden Arowana…). Rarer
  fish dart away faster but are worth far more. Track your catches in the 🐠
  **Fish Collection** (tap the fish button, top-right).
- **🏭 Manufacture facilities** — the **Fish Factory** turns caught fish into 🍣
  **food**; the **Wood Cutter** passively produces wood over time.
- **🐠 Aquarium** — a glass tank that shows off your collected fish swimming.
- **🐾 Pets** — spend food to adopt bouncy pets (duckling, frog, crab) that
  follow you around in a wobbly little conga line.
- **🏝️ Island expansion** — spend resources to grow the island and unlock more
  build plots (costs scale each time).

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
- **Gather:** swim into floating resources and 🐟 fish to auto-scoop them.
- **Build:** tap a building in the bottom dock — it plants on the nearest empty plot on your island. Build a 🏭 Fish Factory to make food, then 🐾 adopt a pet or 🏝️ expand the island.
- **Grow:** every build gives XP and pop; reach higher Village Levels to unlock manufacture facilities, the aquarium, big trees and a lantern tower.

## Tech

- [Three.js](https://threejs.org/) (loaded from CDN via import map)
- Procedural low-poly models, an animated water shader, particle bursts, confetti, and tiny WebAudio sound effects.
- Mobile-first: touch joystick, responsive HUD, safe-area aware.

Built to run anywhere a browser does. Have fun! 🌊
