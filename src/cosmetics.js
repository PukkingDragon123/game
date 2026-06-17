import * as THREE from "three";

// Fur skins (recolour the otter). Priced in pearls 🦪. "classic" is free.
export const SKINS = [
  { id: "classic", name: "Classic", fur: 0x9c6b43, belly: 0xd9b489, price: 0 },
  { id: "slate", name: "River Slate", fur: 0x7c8a93, belly: 0xc6d0d6, price: 12 },
  { id: "golden", name: "Golden", fur: 0xcf9a3c, belly: 0xf0d68a, price: 20 },
  { id: "snow", name: "Snowpaw", fur: 0xe9e6df, belly: 0xffffff, price: 25 },
  { id: "midnight", name: "Midnight", fur: 0x40384f, belly: 0x6a607d, price: 30 },
  { id: "bubblegum", name: "Bubblegum", fur: 0xe98fb0, belly: 0xffd3e2, price: 40 },
  { id: "minty", name: "Minty", fur: 0x7fcbaa, belly: 0xcdeede, price: 40 },
];

// Hats (mesh attaches to the otter's head). "none" is free.
export const HATS = [
  { id: "none", name: "No Hat", emoji: "🚫", price: 0, build: null },
  { id: "straw", name: "Straw Hat", emoji: "👒", price: 10, build: buildStraw },
  { id: "party", name: "Party Hat", emoji: "🎉", price: 15, build: buildParty },
  { id: "leaf", name: "Lily Leaf", emoji: "🍃", price: 15, build: buildLeaf },
  { id: "flower", name: "Flower", emoji: "🌸", price: 20, build: buildFlower },
  { id: "pirate", name: "Pirate", emoji: "🏴‍☠️", price: 30, build: buildPirate },
  { id: "crown", name: "Crown", emoji: "👑", price: 60, build: buildCrown },
];

function buildStraw() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xe7c878, roughness: 0.9 });
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.06, 16), mat);
  g.add(brim);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.28, 16), mat);
  top.position.y = 0.16; g.add(top);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.08, 16),
    new THREE.MeshStandardMaterial({ color: 0xd2554a }));
  band.position.y = 0.06; g.add(band);
  return g;
}
function buildParty() {
  const g = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.8, 14),
    new THREE.MeshStandardMaterial({ color: 0xff7bac, roughness: 0.6 }));
  cone.position.y = 0.4; g.add(cone);
  // stripes
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2 + i * 0.05, 0.03, 6, 16),
      new THREE.MeshStandardMaterial({ color: 0xffe14d }));
    ring.position.y = 0.18 + i * 0.18; ring.rotation.x = Math.PI / 2; g.add(ring);
  }
  const pom = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffff }));
  pom.position.y = 0.82; g.add(pom);
  return g;
}
function buildLeaf() {
  const g = new THREE.Group();
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.45, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x5fbe57, roughness: 1 }));
  leaf.scale.set(1, 0.25, 1); leaf.position.y = 0.05; g.add(leaf);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 5),
    new THREE.MeshStandardMaterial({ color: 0x4a9a4f }));
  stem.position.set(0.18, 0.14, 0.18); g.add(stem);
  return g;
}
function buildFlower() {
  const g = new THREE.Group();
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xffe14d }));
  center.position.y = 0.16; g.add(center);
  const petalMat = new THREE.MeshStandardMaterial({ color: 0xff8fb3, roughness: 0.7 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), petalMat);
    p.scale.set(1, 0.5, 1.4);
    p.position.set(Math.cos(a) * 0.18, 0.14, Math.sin(a) * 0.18);
    g.add(p);
  }
  return g;
}
function buildPirate() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x2b2b32, roughness: 0.7 });
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.62, 0.06, 18), mat);
  brim.scale.set(1, 1, 0.7); g.add(brim);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  crown.scale.set(1, 0.5, 0.8); crown.position.y = 0.04; g.add(crown);
  // skull
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xf2efe6 }));
  skull.position.set(0.34, 0.12, 0); g.add(skull);
  return g;
}
function buildCrown() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xffd23c, metalness: 0.4, roughness: 0.3, emissive: 0x6b4d00, emissiveIntensity: 0.2 });
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.2, 16, 1, true), mat);
  band.position.y = 0.1; g.add(band);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 6), mat);
    spike.position.set(Math.cos(a) * 0.34, 0.28, Math.sin(a) * 0.34);
    g.add(spike);
    const gem = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xff5f7a, emissive: 0x701020, emissiveIntensity: 0.4 }));
    gem.position.set(Math.cos(a) * 0.34, 0.38, Math.sin(a) * 0.34); g.add(gem);
  }
  return g;
}

export function getSkin(id) { return SKINS.find((s) => s.id === id) || SKINS[0]; }
export function getHat(id) { return HATS.find((h) => h.id === id) || HATS[0]; }
export function buildHatMesh(id) {
  const hat = getHat(id);
  if (!hat.build) return null;
  const m = hat.build();
  m.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return m;
}
