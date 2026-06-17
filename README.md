# 🦦 Otter Village

A cute little **3D web game** for mobile & desktop. Paddle your otter around a
sunny pond, gather **drifting treasures** — driftwood, reeds, shells and
berries — and bring them ashore to **build a cozy village**.

Built with [Three.js](https://threejs.org/) and plain HTML/CSS/JS. No build
step, no bundler — just static files.

## ▶️ Play it

Because the game uses ES modules, it needs to be served over `http://`
(opening `index.html` directly with `file://` won't work in most browsers).

Pick whichever you have:

```bash
# Python 3
python3 -m http.server 8080

# Node (no install)
npx serve .

# PHP
php -S localhost:8080
```

Then open <http://localhost:8080> on your phone or desktop browser.

## 🎮 How to play

- **Move** — drag anywhere on screen (mobile) or use **WASD / arrow keys** (desktop).
  A virtual joystick appears wherever you press.
- **Gather** — just paddle into the floating items. They're collected automatically.
- **Build** — tap the 🔨 button, choose a building you can afford, then tap the
  grassy island to place it.
- **Grow** — every building raises your **village** score. Hit milestones to grow
  from a tiny camp into a grand Otter City. 👑

## 🧰 Resources & buildings

| Resource | | Used for |
|---|---|---|
| 🪵 Driftwood | huts, docks, halls | structure |
| 🌿 Reed | huts, gardens | thatch |
| 🐚 Shell | lanterns | decoration |
| 🫐 Berry | gardens | food |

| Building | Cost | Adds |
|---|---|---|
| 🛖 Otter Hut | 4🪵 2🌿 | +2 |
| 🌳 Berry Garden | 3🫐 2🌿 | +1 |
| 🏮 Shell Lantern | 3🐚 1🪵 | +1 |
| 🛶 Little Dock | 6🪵 | +1 |
| 🏛️ Village Hall | 10🪵 6🌿 4🐚 | +5 |

## 📁 Project layout

```
index.html        markup + loading / intro screens
style.css         all UI styling (HUD, build menu, joystick)
src/
  main.js         bootstrap, game loop, input, camera, collection
  world.js        pond, animated water, island, lighting
  otter.js        the cute low-poly otter + paddling animation
  resources.js    drifting collectibles
  village.js      building definitions + placement
  ui.js           HUD / build-menu / toast wiring
```

Made with 💛 and a lot of paddling.
