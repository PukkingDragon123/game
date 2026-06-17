# 🦦 Otter Village

A cute, **stylized 3D web game** for mobile & desktop. Paddle your otter around a
sunny pond, gather **drifting treasures**, build & upgrade a cozy village, hire
**otter villagers**, dodge **sharks and jellyfish**, hunt for **pearls**, and
deck out your otter with **hats and skins**.

Built with [Three.js](https://threejs.org/) and plain HTML/CSS/JS — **no build
step and no CDN**. Three.js and the font are vendored into `lib/`, so the game
is fully self-contained.

## ▶️ Play it

ES modules need to be served over `http://` (opening `index.html` as a
`file://` won't work). Pick whichever you have:

```bash
python3 -m http.server 8080     # then open http://localhost:8080
# or:  npx serve .
```

Open it on your phone or desktop browser. Add `?debug` to the URL to start with
resources/pearls for testing.

## 🎮 How to play

- **Move** — drag anywhere on screen (mobile) or **WASD / arrow keys** (desktop).
- **Gather** — paddle into floating items; they go into your 🎒 pouch.
- **Bank** — return near the island to deposit your pouch into the village stores.
- **Build & upgrade** — tap a glowing **＋ plot** on the island to build, or tap a
  building to upgrade it (★→★★→★★★).
- **Hire otters** — homes (huts, hall, mine) bring villagers. Open **👷 Otters**
  and assign them as Gatherers, Fishers, Miners or Farmers — they produce
  resources for you over time.
- **Adopt pets** — **🐾 Pets**: a 🐢 turtle (more treasures drift in), a 🐬
  dolphin (swim faster), or a 🦆 duck (wider reach).
- **Style your otter** — **✨ Style**: spend 🦪 pearls on fur skins and hats.
- **Watch out!** — 🪼 jellyfish stun you and a 🦈 shark will scare loose some
  pouch items. Keep your distance!

## 🪙 Resources, currency & features

| Resource | Source | | Currency |
|---|---|---|---|
| 🪵 Driftwood, 🌿 Reed, 🐚 Shell, 🫐 Berry | drift on the pond | | 🦪 **Pearls** |
| 🐟 Fish | dart through the water | | from treasure 📦, the |
| 🪨 Ore | heavy, rarer drifters | | whirlpool 🌀 & drifters |

Explore the pond for a **treasure island** (an openable chest of pearls), a
**whirlpool** that spits out pearls, procedural **rock islets** and distant
**mini-islands**. Cosmetics and pearls are saved to your browser.

## 📁 Project layout

```
index.html        markup, loading / intro screens, HUD
style.css         hand-painted UI theme (panels, buttons, tabs, shop)
lib/              vendored three.module.js + Baloo 2 font (self-contained)
src/
  main.js         bootstrap, game loop, input, camera, gather/bank, pearls,
                  treasure, whirlpool, hazards, cosmetics, persistence
  world.js        pond, animated waves, plateau island, scenery, treasure,
                  whirlpool, procedural islets & mini-islands, sun, clouds
  postfx.js       bloom + colour-grade + vignette post-processing
  otter.js        the otter (recolourable fur, hat anchor) + animation
  resources.js    drifting collectibles (wood/reed/shell/berry/fish/ore)
  villagers.js    villager otters + job/assignment system
  pets.js         turtle / dolphin / duck pets
  hazards.js      jellyfish + shark
  cosmetics.js    fur skins + hats
  village.js      build plots, buildings & upgrades
  ui.js           HUD, bottom-sheet tabs, plot popup, cosmetics shop
```

Made with 💛 and a lot of paddling.
