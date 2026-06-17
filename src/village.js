import * as THREE from "three";
import { ISLAND_RADIUS, ISLAND_TOP_Y } from "./world.js";

// Buildings can be placed on plots and upgraded up to MAX_LEVEL. Each level
// re-grants the building's villagers + pop and bumps production a little.
export const MAX_LEVEL = 3;

export const BUILDINGS = [
  {
    id: "hut", name: "Otter Hut", emoji: "🛖",
    desc: "Cozy home — 2 otters move in!",
    cost: { wood: 4, reed: 2 }, pop: 2, villagers: 2, build: buildHut,
  },
  {
    id: "garden", name: "Berry Garden", emoji: "🌳",
    desc: "A leafy tree and berry bushes.",
    cost: { berry: 3, reed: 2 }, pop: 1, villagers: 0, build: buildGarden,
  },
  {
    id: "lantern", name: "Shell Lantern", emoji: "🏮",
    desc: "Lights the village at dusk.",
    cost: { shell: 3, wood: 1 }, pop: 1, villagers: 0, build: buildLantern,
  },
  {
    id: "dock", name: "Little Dock", emoji: "🛶",
    desc: "A wooden pier to rest your paws.",
    cost: { wood: 6 }, pop: 1, villagers: 0, build: buildDock,
  },
  {
    id: "mine", name: "Stone Mine", emoji: "⛏️",
    desc: "A dig site — home to 2 miners.",
    cost: { wood: 8, ore: 2 }, pop: 2, villagers: 2, build: buildMine,
  },
  {
    id: "hall", name: "Village Hall", emoji: "🏛️",
    desc: "The proud heart — houses 4 otters.",
    cost: { wood: 10, reed: 6, shell: 4 }, pop: 5, villagers: 4, build: buildHall,
  },
];

export function getBuilding(id) { return BUILDINGS.find((b) => b.id === id); }

// upgrade cost scales with the next level
export function upgradeCost(def, currentLevel) {
  const mult = currentLevel + 1;
  const out = {};
  for (const [k, v] of Object.entries(def.cost)) out[k] = Math.ceil(v * mult * 0.8);
  return out;
}

function woodMat() { return new THREE.MeshStandardMaterial({ color: 0x9b6a3c, roughness: 0.85 }); }
function roofMat() { return new THREE.MeshStandardMaterial({ color: 0xc8703f, roughness: 0.8 }); }

function buildHut() {
  const g = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.0, 1.1, 12), woodMat());
  wall.position.y = 0.55; g.add(wall);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.25, 1.0, 12), roofMat());
  roof.position.y = 1.6; g.add(roof);
  const door = new THREE.Mesh(new THREE.CircleGeometry(0.3, 12, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x4a2f24 }));
  door.position.set(0, 0.35, 1.0); g.add(door);
  return g;
}
function buildGarden() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.0, 8), woodMat());
  trunk.position.y = 0.5; g.add(trunk);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x66c25a, roughness: 1 });
  for (const [x, y, z, s] of [[0,1.3,0,0.8],[0.45,1.1,0.2,0.55],[-0.4,1.15,-0.2,0.55],[0.1,1.6,-0.1,0.5]]) {
    const blob = new THREE.Mesh(new THREE.SphereGeometry(s, 12, 10), leafMat);
    blob.position.set(x, y, z); g.add(blob);
  }
  const berryMat = new THREE.MeshStandardMaterial({ color: 0x6a5acd, roughness: 0.4 });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), berryMat);
    b.position.set(Math.cos(a) * 0.7, 0.18, Math.sin(a) * 0.7); g.add(b);
  }
  return g;
}
function buildLantern() {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.3, 8), woodMat());
  post.position.y = 0.65; g.add(post);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 12),
    new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffcf6b, emissiveIntensity: 0.9 }));
  glow.position.y = 1.4; g.add(glow);
  const light = new THREE.PointLight(0xffd27a, 0.8, 6, 2);
  light.position.y = 1.4; g.add(light);
  return g;
}
function buildDock() {
  const g = new THREE.Group();
  const plankMat = woodMat();
  for (let i = 0; i < 4; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.4), plankMat);
    plank.position.set(0, 0.1, i * 0.5 - 0.75); g.add(plank);
  }
  for (const x of [-0.5, 0.5]) for (const z of [-0.7, 0.9]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6), plankMat);
    post.position.set(x, -0.1, z); g.add(post);
  }
  return g;
}
function buildMine() {
  const g = new THREE.Group();
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x8a8f99, roughness: 0.95 });
  for (const [x, y, z, s] of [[0,0.4,0,0.9],[0.5,0.2,0.3,0.5],[-0.4,0.25,-0.2,0.6],[0.2,0.55,-0.3,0.45]]) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockMat);
    rock.position.set(x, y, z); rock.rotation.set(Math.random(), Math.random(), Math.random()); g.add(rock);
  }
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.32, 16, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x1a1a1f }));
  hole.position.set(0, 0.32, 0.9); g.add(hole);
  for (const x of [-0.34, 0.34]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.1), woodMat());
    beam.position.set(x, 0.35, 0.92); g.add(beam);
  }
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.12, 0.12), woodMat());
  top.position.set(0, 0.72, 0.92); g.add(top);
  const gem = new THREE.MeshStandardMaterial({ color: 0x7fe0ff, emissive: 0x2a9fd6, emissiveIntensity: 0.6 });
  for (let i = 0; i < 3; i++) {
    const v = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), gem);
    v.position.set((Math.random() - 0.5) * 1.2, 0.3 + Math.random() * 0.4, (Math.random() - 0.5) * 1.2); g.add(v);
  }
  return g;
}
function buildHall() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 2.0), woodMat());
  base.position.y = 0.7; g.add(base);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.2, 4), roofMat());
  roof.rotation.y = Math.PI / 4; roof.position.y = 2.0; g.add(roof);
  const colMat = new THREE.MeshStandardMaterial({ color: 0xf2e2b6, roughness: 1 });
  for (const x of [-0.9, -0.3, 0.3, 0.9]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.3, 8), colMat);
    col.position.set(x, 0.65, 1.05); g.add(col);
  }
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6), woodMat());
  pole.position.set(0, 3.0, 0); g.add(pole);
  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.04), new THREE.MeshStandardMaterial({ color: 0xff9f6b }));
  flag.position.set(0.32, 3.35, 0); g.add(flag);
  return g;
}

// floating "+" marker shown on empty plots
function makePlusSprite() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.beginPath(); ctx.arc(64, 64, 50, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#ff9f6b"; ctx.lineWidth = 12; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(64, 38); ctx.lineTo(64, 90); ctx.moveTo(38, 64); ctx.lineTo(90, 64); ctx.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sp.scale.set(0.9, 0.9, 0.9);
  return sp;
}

// Manages plots + the buildings placed on them.
export function createVillage(scene) {
  const plots = [];
  const plotMeshes = [];

  // layout: a centre plot + a ring of 6
  const layout = [[0, 0]];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    layout.push([Math.cos(a) * 4.3, Math.sin(a) * 4.3]);
  }

  const padMat = new THREE.MeshStandardMaterial({ color: 0xcdb892, roughness: 1 });
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0xa8906a, roughness: 1 });

  layout.forEach(([x, z], i) => {
    const grp = new THREE.Group();
    const edge = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.18, 2.1), edgeMat);
    edge.position.y = 0.06; edge.receiveShadow = true; grp.add(edge);
    const pad = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 1.8), padMat);
    pad.position.y = 0.1; pad.receiveShadow = true;
    pad.userData.plotIndex = i;        // raycast target
    grp.add(pad);
    const plus = makePlusSprite();
    plus.position.set(0, 1.1, 0);
    grp.add(plus);
    grp.position.set(x, ISLAND_TOP_Y, z);
    scene.add(grp);

    plotMeshes.push(pad);
    plots.push({ index: i, group: grp, pad, plus, position: new THREE.Vector3(x, ISLAND_TOP_Y, z), building: null });
  });

  function buildOnPlot(index, def) {
    const plot = plots[index];
    if (plot.building) return null;
    const mesh = def.build();
    mesh.position.copy(plot.position);
    mesh.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    mesh.scale.setScalar(0.01);
    mesh.userData.grow = 0;
    mesh.userData.targetScale = 1;
    scene.add(mesh);
    plot.building = { def, level: 1, mesh };
    plot.plus.visible = false;
    return plot.building;
  }

  function upgradePlot(index) {
    const plot = plots[index];
    if (!plot.building || plot.building.level >= MAX_LEVEL) return null;
    plot.building.level++;
    const m = plot.building.mesh;
    m.userData.targetScale = 1 + (plot.building.level - 1) * 0.14;
    m.userData.grow = 0.6; // little re-pop
    return plot.building;
  }

  return {
    plots,
    plotMeshes,
    buildOnPlot,
    upgradePlot,
    update(dt) {
      for (const plot of plots) {
        // bob the + marker
        if (!plot.building) plot.plus.position.y = 1.1 + Math.sin(performance.now() * 0.003 + plot.index) * 0.1;
        const b = plot.building;
        if (b && b.mesh.userData.grow < 1) {
          b.mesh.userData.grow = Math.min(1, b.mesh.userData.grow + dt * 3);
          const g = b.mesh.userData.grow;
          const target = b.mesh.userData.targetScale;
          const s = g < 0.7 ? (g / 0.7) * target * 1.1 : target * (1.1 - ((g - 0.7) / 0.3) * 0.1);
          b.mesh.scale.setScalar(s);
        }
      }
    },
  };
}
