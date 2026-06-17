# 🦦 Otter Village

A cute, polished 3D web game. You're an otter in a sparkling pond with **real
Gerstner-wave physics** — swim around riding the swell, scoop up **drifting
treasures** (driftwood, reeds, stone, shells), **hunt darting fish** with your
tools, then **plant it all on your island** to build a cozy little village.
Each build earns XP and attracts more otters. Level up to unlock fancier
buildings!

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
- **Hunt:** chase the fish — they sense you and flee! Use the tools on the right:
  - **🥅 Net** (toggle): widens your catch radius for both fish and drift.
  - **💨 Dash** (cooldown): a burst of speed to run fish down.
- **Build:** tap a building in the bottom dock — it plants on the nearest empty plot on your island.
- **Grow:** every catch and build gives XP and pop; reach higher Village Levels to unlock the fish pond, docks, wells, big trees and a lantern tower.

## Tech

- [Three.js](https://threejs.org/) (loaded from CDN via import map)
- **Gerstner-wave water** — the same wave math runs in the GPU shader *and* in
  JS gameplay physics, so the otter, fish and drifting treasures genuinely ride
  the same swell (height + surface tilt).
- Polished shaders: fresnel sky reflections, sun specular glints, crest & shore
  foam, a gradient sky dome, a glowing sun, and animated underwater caustics.
- Schooling fish with flee/hunt AI, expanding wake & splash ripples, particle
  bursts, confetti, and tiny WebAudio sound effects.
- Procedural low-poly models throughout.
- Mobile-first: touch joystick, on-screen tools, responsive HUD, safe-area aware.

Built to run anywhere a browser does. Have fun! 🌊
