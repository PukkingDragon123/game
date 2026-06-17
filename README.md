# 🦦 Otter Village

A cute, polished 3D web game. You're a chubby otter on a sparkling pond with
**real Gerstner-wave physics**. Up top you scoop **drifting treasures** and
build a cozy island village — then **dive into a vibrant coral reef** and hunt
fish *Dave-the-Diver_style_* with a harpoon. Ten fish species, each with their
own behaviour and rarity, await below. Level up to unlock fancier buildings,
hireable crew, and rarer fish!

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
- **Dive:** press **Space** or tap **🤿** to plunge into the coral reef (tap again to surface).
- **Fish (underwater):** **tap a fish** to fire your **🎯 harpoon**. Fish have HP — common fish drop in one hit, but rare/legendary fish (lionfish, sea turtle, reef shark, manta ray) take several, flee faster, and behave differently. Rarer catches pay out far more.
- **Gather (surface):** swim into the floating treasures to auto-scoop them.
- **Tools:**
  - **🥅 Net** (toggle): widens your scoop radius.
  - **💨 Dash** (cooldown): a burst of speed.
- **Hire crew:** tap **🐾** to recruit chubby pinnipeds that auto-gather while you play:
  - **🦁 Sea Lion** → hunts **fish**
  - **🦭 Spotted Seal** → forages **reeds & shells**
  - **🦣 Walrus** → hauls **stone & driftwood**
  - Each hire costs more than the last and unlocks at higher Village Levels.
- **Build:** tap a building in the bottom dock — it plants on the nearest empty plot on your island.
- **Grow:** every catch, hire and build gives XP and pop; reach higher Village Levels to unlock the fish pond, docks, wells, big trees and a lantern tower.

## Tech

- [Three.js](https://threejs.org/) (loaded from CDN via import map)
- **Gerstner-wave water** — the same wave math runs in the GPU shader *and* in
  JS gameplay physics, so the otter, fish and drifting treasures genuinely ride
  the same swell (height + surface tilt).
- Polished shaders: fresnel sky reflections, sun specular glints, crest & shore
  foam, a gradient sky dome, a glowing sun, and animated underwater caustics.
- **Dive mode** with smooth camera, fog, sky and exposure transitions into a
  colourful **coral reef**: branching/brain/fan/tube corals, anemones, kelp,
  starfish, animated **god-ray light shafts**, rising **bubbles**, plankton and
  caustics on the seabed.
- **10 fish species** (clownfish, blue/yellow tang, mackerel, angelfish,
  pufferfish, lionfish, sea turtle, reef shark, manta ray) with per-species
  HP, speed, size and behaviour (timid, schooling, drifting, inflating,
  gliding, aggressive) and 5 rarity tiers with scaled rewards. A **harpoon**
  fishing system with damage, floating HP bars, and catch popups.
- **Chubby 4-legged creatures** with an animated walk/paddle gait — the otter,
  follower otters, and the hireable crew (sea lion, spotted seal, walrus).
- Soft bloom post-processing (async, with a safe fallback) plus a cinematic
  vignette that tints blue underwater.
- An organic, hand-shaped island with a wobbly coastline, sandy beaches,
  rocks, cattails, wildflowers and drifting clouds.
- **Perf-tuned:** capped pixel ratio, 1024 shadow map with few casters,
  instanced grass/flowers, lighter bloom, and cached per-frame updates.
- Mobile-first: touch joystick, on-screen tools, responsive HUD, safe-area aware.

Built to run anywhere a browser does. Have fun! 🌊
