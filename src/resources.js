import * as THREE from "three";
import { POND_RADIUS, ISLAND_RADIUS } from "./world.js";

// Resource definitions: emoji is used in UI, the mesh builder makes the
// little floating 3D object that drifts on the pond.
export const RESOURCE_TYPES = {
  wood:  { name: "Driftwood", emoji: "🪵", color: 0x9b6a3c },
  reed:  { name: "Reed",      emoji: "🌿", color: 0x5fae54 },
  shell: { name: "Shell",     emoji: "🐚", color: 0xf3d9c0 },
  berry: { name: "Berry",     emoji: "🫐", color: 0x6a5acd },
};

const TYPE_KEYS = Object.keys(RESOURCE_TYPES);

function buildMesh(type) {
  const def = RESOURCE_TYPES[type];
  const mat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.7 });
  const g = new THREE.Group();

  if (type === "wood") {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.1, 10), mat);
    log.rotation.z = Math.PI / 2;
    g.add(log);
    // bark rings
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
    // ridges
    const ridgeMat = new THREE.MeshStandardMaterial({ color: 0xe0b89a, roughness: 0.6 });
    for (let i = 0; i < 5; i++) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.03), ridgeMat);
      r.position.y = 0.1;
      r.rotation.y = (i / 5) * Math.PI - Math.PI / 2;
      r.position.x = Math.cos((i / 5) * Math.PI - Math.PI / 2) * 0.12;
      r.position.z = Math.sin((i / 5) * Math.PI - Math.PI / 2) * 0.12;
      g.add(r);
    }
  } else { // berry
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
  }

  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// Manages a pool of drifting resources floating across the pond.
export function createResourceField(scene) {
  const items = [];
  const maxItems = 22;

  function spawn(forceType) {
    const type = forceType || TYPE_KEYS[(Math.random() * TYPE_KEYS.length) | 0];
    const mesh = buildMesh(type);

    // spawn somewhere on the water ring (not on the island), drift across
    const a = Math.random() * Math.PI * 2;
    const r = ISLAND_RADIUS + 3 + Math.random() * (POND_RADIUS - ISLAND_RADIUS - 4);
    mesh.position.set(Math.cos(a) * r, 0.18, Math.sin(a) * r);

    // gentle drift velocity, tangential-ish so things swirl around the pond
    const drift = new THREE.Vector2(
      (Math.random() - 0.5) * 0.6,
      (Math.random() - 0.5) * 0.6
    );

    const item = {
      type,
      mesh,
      drift,
      bobOffset: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.8,
    };
    scene.add(mesh);
    items.push(item);
    return item;
  }

  // seed the pond
  for (let i = 0; i < 12; i++) spawn();

  return {
    items,
    update(dt, t) {
      // keep the pond populated
      if (items.length < maxItems && Math.random() < dt * 0.8) spawn();

      for (const it of items) {
        const p = it.mesh.position;
        p.x += it.drift.x * dt;
        p.z += it.drift.y * dt;
        p.y = 0.18 + Math.sin(t * 1.6 + it.bobOffset) * 0.08;
        it.mesh.rotation.y += it.spin * dt;

        // push gently away from the island so items stay reachable on water
        const distC = Math.hypot(p.x, p.z);
        if (distC < ISLAND_RADIUS + 1.5) {
          const nx = p.x / distC, nz = p.z / distC;
          it.drift.x += nx * dt * 0.8;
          it.drift.y += nz * dt * 0.8;
        }
        // wrap back if it drifts past the far shore
        if (distC > POND_RADIUS - 1) {
          it.drift.x *= -1;
          it.drift.y *= -1;
        }
      }
    },
    // remove a collected item from the scene + pool
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
