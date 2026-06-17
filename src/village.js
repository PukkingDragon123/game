import * as THREE from "three";
import { ISLAND_RADIUS } from "./world.js";

// Each building has a cost (resources), an emoji for the menu, and a builder
// that returns a 3D mesh. `pop` controls how much "village" score it adds.
export const BUILDINGS = [
  {
    id: "hut",
    name: "Otter Hut",
    emoji: "🛖",
    desc: "A cozy home for one otter family.",
    cost: { wood: 4, reed: 2 },
    pop: 2,
    build: buildHut,
  },
  {
    id: "garden",
    name: "Berry Garden",
    emoji: "🌳",
    desc: "Sweet berries and a little tree.",
    cost: { berry: 3, reed: 2 },
    pop: 1,
    build: buildGarden,
  },
  {
    id: "lantern",
    name: "Shell Lantern",
    emoji: "🏮",
    desc: "Lights the village at dusk.",
    cost: { shell: 3, wood: 1 },
    pop: 1,
    build: buildLantern,
  },
  {
    id: "dock",
    name: "Little Dock",
    emoji: "🛶",
    desc: "A wooden pier to rest your paws.",
    cost: { wood: 6 },
    pop: 1,
    build: buildDock,
  },
  {
    id: "hall",
    name: "Village Hall",
    emoji: "🏛️",
    desc: "The proud heart of the village.",
    cost: { wood: 10, reed: 6, shell: 4 },
    pop: 5,
    build: buildHall,
  },
];

function woodMat() { return new THREE.MeshStandardMaterial({ color: 0x9b6a3c, roughness: 0.85 }); }
function roofMat() { return new THREE.MeshStandardMaterial({ color: 0xc8703f, roughness: 0.8 }); }

function buildHut() {
  const g = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.0, 1.1, 12), woodMat());
  wall.position.y = 0.55;
  g.add(wall);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.25, 1.0, 12), roofMat());
  roof.position.y = 1.6;
  g.add(roof);
  const door = new THREE.Mesh(
    new THREE.CircleGeometry(0.3, 12, 0, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x4a2f24 })
  );
  door.position.set(0, 0.35, 1.0);
  g.add(door);
  return g;
}

function buildGarden() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.0, 8), woodMat());
  trunk.position.y = 0.5;
  g.add(trunk);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x66c25a, roughness: 1 });
  for (const [x, y, z, s] of [[0,1.3,0,0.8],[0.45,1.1,0.2,0.55],[-0.4,1.15,-0.2,0.55],[0.1,1.6,-0.1,0.5]]) {
    const blob = new THREE.Mesh(new THREE.SphereGeometry(s, 12, 10), leafMat);
    blob.position.set(x, y, z);
    g.add(blob);
  }
  // berry bushes
  const berryMat = new THREE.MeshStandardMaterial({ color: 0x6a5acd, roughness: 0.4 });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), berryMat);
    b.position.set(Math.cos(a) * 0.7, 0.18, Math.sin(a) * 0.7);
    g.add(b);
  }
  return g;
}

function buildLantern() {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.3, 8), woodMat());
  post.position.y = 0.65;
  g.add(post);
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 14, 12),
    new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffcf6b, emissiveIntensity: 0.9 })
  );
  glow.position.y = 1.4;
  g.add(glow);
  const light = new THREE.PointLight(0xffd27a, 0.8, 6, 2);
  light.position.y = 1.4;
  g.add(light);
  return g;
}

function buildDock() {
  const g = new THREE.Group();
  const plankMat = woodMat();
  for (let i = 0; i < 4; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.4), plankMat);
    plank.position.set(0, 0.1, i * 0.5 - 0.75);
    g.add(plank);
  }
  for (const x of [-0.5, 0.5]) for (const z of [-0.7, 0.9]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6), plankMat);
    post.position.set(x, -0.1, z);
    g.add(post);
  }
  return g;
}

function buildHall() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 2.0), woodMat());
  base.position.y = 0.7;
  g.add(base);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.2, 4), roofMat());
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 2.0;
  g.add(roof);
  // columns
  const colMat = new THREE.MeshStandardMaterial({ color: 0xf2e2b6, roughness: 1 });
  for (const x of [-0.9, -0.3, 0.3, 0.9]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.3, 8), colMat);
    col.position.set(x, 0.65, 1.05);
    g.add(col);
  }
  // flag
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6), woodMat());
  pole.position.set(0, 3.0, 0);
  g.add(pole);
  const flag = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.4, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xff9f6b })
  );
  flag.position.set(0.32, 3.35, 0);
  g.add(flag);
  return g;
}

// Manages placed buildings on the island.
export function createVillage(scene) {
  const placed = [];

  function place(buildingDef, position) {
    const mesh = buildingDef.build();
    mesh.position.copy(position);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    mesh.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    // little pop-in animation flag
    mesh.scale.setScalar(0.01);
    mesh.userData.grow = 0;
    scene.add(mesh);
    placed.push({ def: buildingDef, mesh, position: position.clone() });
    return mesh;
  }

  // is a spot free of other buildings (simple radius check) and on the island?
  function canPlaceAt(position) {
    const distC = Math.hypot(position.x, position.z);
    if (distC > ISLAND_RADIUS - 0.8) return false;
    for (const b of placed) {
      if (b.position.distanceTo(position) < 2.0) return false;
    }
    return true;
  }

  return {
    placed,
    place,
    canPlaceAt,
    update(dt) {
      for (const b of placed) {
        const m = b.mesh;
        if (m.userData.grow < 1) {
          m.userData.grow = Math.min(1, m.userData.grow + dt * 3);
          // bouncy ease-out
          const g = m.userData.grow;
          const s = g < 0.7 ? g / 0.7 * 1.1 : 1.1 - (g - 0.7) / 0.3 * 0.1;
          m.scale.setScalar(s);
        }
      }
    },
  };
}
