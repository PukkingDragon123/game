import * as THREE from "three";
import { POND_RADIUS, ISLAND_RADIUS } from "./world.js";

// Resource definitions. `emoji` drives the UI; `behavior` controls how the
// floating object moves on the pond:
//   drift  - bobs and slowly floats (wood/reed/shell/berry)
//   heavy  - drifts slowly, rarer, sparkles (ore)
//   swim   - darts in smooth arcs and is quicker to catch (fish)
export const RESOURCE_TYPES = {
  wood:  { name: "Driftwood", emoji: "🪵", color: 0x9b6a3c, behavior: "drift", weight: 5 },
  reed:  { name: "Reed",      emoji: "🌿", color: 0x5fae54, behavior: "drift", weight: 5 },
  shell: { name: "Shell",     emoji: "🐚", color: 0xf3d9c0, behavior: "drift", weight: 4 },
  berry: { name: "Berry",     emoji: "🫐", color: 0x6a5acd, behavior: "drift", weight: 3 },
  fish:  { name: "Fish",      emoji: "🐟", color: 0x6fc3d6, behavior: "swim",  weight: 3 },
  ore:   { name: "Ore",       emoji: "🪨", color: 0x8a8f99, behavior: "heavy", weight: 2 },
};

export const RESOURCE_KEYS = Object.keys(RESOURCE_TYPES);

// weighted random type
function randomType() {
  const total = RESOURCE_KEYS.reduce((s, k) => s + RESOURCE_TYPES[k].weight, 0);
  let r = Math.random() * total;
  for (const k of RESOURCE_KEYS) {
    r -= RESOURCE_TYPES[k].weight;
    if (r <= 0) return k;
  }
  return "wood";
}

function buildMesh(type) {
  const def = RESOURCE_TYPES[type];
  const mat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.7 });
  const g = new THREE.Group();

  if (type === "wood") {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.1, 10), mat);
    log.rotation.z = Math.PI / 2;
    g.add(log);
    const ring = new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 0.8 });
    for (const x of [-0.4, 0.4]) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.08, 10), ring);
      cap.rotation.z = Math.PI / 2;
      cap.position.x = x;
      g.add(cap);
    }
  } else if (type === "reed") {
    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.9, 6), mat);
      blade.position.set((i - 1) * 0.12, 0.35, (i - 1) * 0.08);
      blade.rotation.z = (i - 1) * 0.2;
      g.add(blade);
    }
    const pad = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x4a9a4f, roughness: 1 })
    );
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.02;
    g.add(pad);
  } else if (type === "shell") {
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat);
    shell.scale.set(1, 0.7, 1);
    g.add(shell);
    const ridgeMat = new THREE.MeshStandardMaterial({ color: 0xe0b89a, roughness: 0.6 });
    for (let i = 0; i < 5; i++) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.03), ridgeMat);
      r.position.y = 0.1;
      r.rotation.y = (i / 5) * Math.PI - Math.PI / 2;
      r.position.x = Math.cos((i / 5) * Math.PI - Math.PI / 2) * 0.12;
      r.position.z = Math.sin((i / 5) * Math.PI - Math.PI / 2) * 0.12;
      g.add(r);
    }
  } else if (type === "berry") {
    const cluster = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.4 });
    for (const [dx, dy, dz] of [[0,0.1,0],[0.18,0,0.05],[-0.15,0.02,0.1],[0.05,0.05,-0.18]]) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), cluster);
      b.position.set(dx, dy + 0.15, dz);
      g.add(b);
    }
    const leaf = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.3, 5),
      new THREE.MeshStandardMaterial({ color: 0x4a9a4f, roughness: 1 })
    );
    leaf.position.y = 0.42;
    g.add(leaf);
  } else if (type === "fish") {
    const bodyMat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.35, metalness: 0.2 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), bodyMat);
    body.scale.set(1.4, 0.7, 0.6);
    g.add(body);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.3, 4), bodyMat);
    tail.rotation.z = Math.PI / 2;
    tail.position.x = -0.42;
    tail.scale.set(1, 1, 0.4);
    g.add(tail);
    // dorsal fin
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 4), bodyMat);
    fin.position.set(0, 0.18, 0);
    g.add(fin);
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    );
    eye.position.set(0.3, 0.05, 0.14);
    g.add(eye);
    const eye2 = eye.clone(); eye2.position.z = -0.14; g.add(eye2);
  } else { // ore
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34, 0), mat);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    g.add(rock);
    // glittering ore veins
    const gem = new THREE.MeshStandardMaterial({ color: 0x7fe0ff, emissive: 0x2a9fd6, emissiveIntensity: 0.6, roughness: 0.2 });
    for (let i = 0; i < 4; i++) {
      const v = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), gem);
      const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI;
      v.position.set(Math.cos(a) * Math.sin(b) * 0.28, Math.cos(b) * 0.28, Math.sin(a) * Math.sin(b) * 0.28);
      g.add(v);
    }
  }

  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export function createResourceField(scene, opts = {}) {
  const items = [];
  const maxItems = opts.maxItems ?? 26;
  let spawnRate = opts.spawnRate ?? 0.9; // items per second probability scaler

  function spawn(forceType) {
    const type = forceType || randomType();
    const def = RESOURCE_TYPES[type];
    const mesh = buildMesh(type);

    const a = Math.random() * Math.PI * 2;
    const r = ISLAND_RADIUS + 3 + Math.random() * (POND_RADIUS - ISLAND_RADIUS - 4);
    mesh.position.set(Math.cos(a) * r, 0.18, Math.sin(a) * r);

    const speed = def.behavior === "swim" ? 1.6 : def.behavior === "heavy" ? 0.25 : 0.55;
    const dir = Math.random() * Math.PI * 2;
    const item = {
      type,
      behavior: def.behavior,
      mesh,
      drift: new THREE.Vector2(Math.cos(dir) * speed, Math.sin(dir) * speed),
      heading: dir,
      bobOffset: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.8,
      dartTimer: Math.random() * 2,
    };
    scene.add(mesh);
    items.push(item);
    return item;
  }

  for (let i = 0; i < 14; i++) spawn();

  return {
    items,
    setSpawnRate(v) { spawnRate = v; },
    update(dt, t) {
      if (items.length < maxItems && Math.random() < dt * spawnRate) spawn();

      for (const it of items) {
        const p = it.mesh.position;

        if (it.behavior === "swim") {
          // fish dart: occasionally change heading sharply
          it.dartTimer -= dt;
          if (it.dartTimer <= 0) {
            it.heading += (Math.random() - 0.5) * 2.2;
            it.dartTimer = 0.8 + Math.random() * 1.6;
          }
          const sp = 1.6;
          it.drift.set(Math.cos(it.heading) * sp, Math.sin(it.heading) * sp);
          it.mesh.rotation.y = -it.heading;
          p.y = 0.16 + Math.sin(t * 5 + it.bobOffset) * 0.05;
        } else {
          p.y = 0.18 + Math.sin(t * 1.6 + it.bobOffset) * 0.08;
          it.mesh.rotation.y += it.spin * dt;
        }

        p.x += it.drift.x * dt;
        p.z += it.drift.y * dt;

        const distC = Math.hypot(p.x, p.z);
        if (distC < ISLAND_RADIUS + 1.5) {
          const nx = p.x / (distC || 1), nz = p.z / (distC || 1);
          it.drift.x += nx * dt * 0.9;
          it.drift.y += nz * dt * 0.9;
          it.heading = Math.atan2(it.drift.y, it.drift.x);
        }
        if (distC > POND_RADIUS - 1) {
          const nx = p.x / distC, nz = p.z / distC;
          // steer back inward
          it.drift.x -= nx * Math.abs(it.drift.x) * 1.5;
          it.drift.y -= nz * Math.abs(it.drift.y) * 1.5;
          it.heading = Math.atan2(it.drift.y, it.drift.x);
        }
      }
    },
    remove(item) {
      const i = items.indexOf(item);
      if (i !== -1) items.splice(i, 1);
      scene.remove(item.mesh);
      item.mesh.traverse((o) => {
        if (o.isMesh) { o.geometry.dispose(); o.material.dispose?.(); }
      });
    },
  };
}
