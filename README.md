# 🦦 Otter Village

A cute, polished 3D web game. You're an otter in a sparkling pond — swim around,
scoop up **drifting treasures** (driftwood, reeds, stone, shells), **catch fish**,
then **plant buildings on your island** to grow a cozy little village. Each build
earns XP and attracts more otters. Level up to unlock fancier buildings!

## Features

- **🏝️ Tile-based island (Animal Crossing style)** — a big, flat, mowed-lawn
  grid island. Buildings & décor snap to tiles; a green cursor shows where the
  next item lands. **Buy Land** with coins to grow the island & unlock more tiles.
- **🌷 Decoration & 🛠️ edit mode** — a **Decor** tab with flower beds, hedges,
  fences, lamp posts, benches, umbrellas, fountains, mailboxes, campfires,
  topiaries, statues & balloons. Toggle **Edit mode** to place items or stand on
  one and tap ♻️ to pick it up (full refund).
- **🏠 Houses you can decorate** — place a Cozy House and tap it to repaint the
  roof in different colours, then dress the yard with décor.
- **🤿 Underwater diving (Dave-the-Diver style)** — tap the dive mask on open
  water to descend to the **coral reef**: swaying kelp, colourful corals, reef
  fish, and **hidden treasure** (pearls, coins, gems, chests, lost crowns).
- **💨 Oxygen** — your air drains while submerged (dashing costs extra). Surface
  before it runs out or you'll be forced up. Surfacing refills air & banks loot.
- **⚡ Dash & better controls** — momentum-based swimming with a dash burst
  (button, **Shift**/**Space**, or double-tap the joystick).
- **💰 Treasure → coins → Buy Land** — sunken treasure gives gold you spend to
  **buy land** and expand the island.
- **⛵ Boat** — a little dinghy bobs on the surface as your home base.

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

## How to view / play

No build step and **no internet needed** — three.js is vendored in `vendor/`.

**Easiest (recommended): run a tiny local server.** From this folder:

```bash
python3 -m http.server 8000
```

…then open **http://localhost:8000** in your browser.

In **Claude Code on the web**, run that same command — when it reports
`Serving HTTP on ... port 8000`, open the forwarded preview/port that pops up
(it maps to port 8000). If the preview asks for a port, enter **8000**.

**Also works by double-clicking** `index.html` (it opens via `file://`).
A server is still the most reliable option across browsers.

> If you ever see a spinning otter that never starts, you're likely opening it
> from a sandbox that blocks files, or `vendor/three.min.js` is missing. Use the
> local-server method above and it will work 100%.

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
