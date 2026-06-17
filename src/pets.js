import * as THREE from "three";
import { POND_RADIUS, ISLAND_RADIUS } from "./world.js";

// Adoptable pets that roam the pond and grant a gentle gameplay bonus.
export const PET_TYPES = {
  turtle: {
    name: "Sea Turtle",
    emoji: "🐢",
    desc: "Stirs the current — more treasures drift in.",
    cost: { shell: 6, reed: 4 },
    bonus: "spawn",
    build: buildTurtle,
  },
  dolphin: {
    name: "Dolphin",
    emoji: "🐬",
    desc: "Leaps in waves — your otter swims faster!",
    cost: { fish: 8, shell: 4 },
    bonus: "speed",
    build: buildDolphin,
  },
  duck: {
    name: "Pond Duck",
    emoji: "🦆",
    desc: "A helpful friend — wider gathering reach.",
    cost: { wood: 5, berry: 4 },
    bonus: "reach",
    build: buildDuck,
  },
};

function buildTurtle() {
  const g = new THREE.Group();
  const shellMat = new THREE.MeshStandardMaterial({ color: 0x3f8f5a, roughness: 0.7 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0x6fb07a, roughness: 0.8 });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.7, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2), shellMat);
  shell.scale.set(1, 0.6, 1.2);
  shell.position.y = 0.25;
  g.add(shell);
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x2f6f45, roughness: 0.8 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const plate = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), plateMat);
    plate.position.set(Math.cos(a) * 0.42, 0.4, Math.sin(a) * 0.5);
    g.add(plate);
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), skinMat);
  head.position.set(0, 0.22, 1.05);
  g.add(head);
  for (const z of [0.85, -0.85]) for (const x of [0.55, -0.55]) {
    const flip = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), skinMat);
    flip.scale.set(1.4, 0.4, 0.7);
    flip.position.set(x, 0.05, z * 0.6);
    flip.rotation.y = x > 0 ? -0.6 : 0.6;
    g.add(flip);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function buildDolphin() {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0x6f8ea8, roughness: 0.35, metalness: 0.2 });
  const belly = new THREE.MeshStandardMaterial({ color: 0xdfe9f0, roughness: 0.4 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 1.1, 8, 14), skin);
  body.rotation.z = Math.PI / 2;
  g.add(body);
  const tummy = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.9, 6, 10), belly);
  tummy.rotation.z = Math.PI / 2;
  tummy.position.y = -0.12;
  g.add(tummy);
  // snout
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 12), skin);
  snout.rotation.z = -Math.PI / 2;
  snout.position.x = 0.95;
  g.add(snout);
  // dorsal fin
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 4), skin);
  fin.position.set(-0.1, 0.4, 0);
  fin.rotation.z = -0.4;
  g.add(fin);
  // tail fluke
  const fluke = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.4, 4), skin);
  fluke.rotation.z = Math.PI / 2;
  fluke.scale.set(1, 1, 0.3);
  fluke.position.x = -0.95;
  g.add(fluke);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshStandardMaterial({ color: 0x111 }));
  eye.position.set(0.55, 0.12, 0.2);
  g.add(eye);
  const eye2 = eye.clone(); eye2.position.z = -0.2; g.add(eye2);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function buildDuck() {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.8 });
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xf7a93b, roughness: 0.6 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), bodyMat);
  body.scale.set(1.1, 0.9, 1.3);
  body.position.y = 0.3;
  g.add(body);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 0.5, 10), bodyMat);
  neck.position.set(0, 0.6, 0.35);
  neck.rotation.x = 0.3;
  g.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10), bodyMat);
  head.position.set(0, 0.85, 0.45);
  g.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 8), beakMat);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.83, 0.72);
  g.add(beak);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 6), bodyMat);
  tail.rotation.x = -Math.PI / 2.2;
  tail.position.set(0, 0.4, -0.5);
  g.add(tail);
  for (const z of [0.3, -0.3]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
    eye.position.set(z * 0.5, 0.92, 0.62);
    g.add(eye);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export function createPets(scene, opts = {}) {
  const onSplash = opts.onSplash || (() => {});
  const pets = [];

  function adopt(typeKey) {
    const def = PET_TYPES[typeKey];
    const mesh = def.build();
    const a = Math.random() * Math.PI * 2;
    const r = ISLAND_RADIUS + 5;
    mesh.position.set(Math.cos(a) * r, 0.05, Math.sin(a) * r);
    mesh.scale.setScalar(0.01);
    const pet = {
      typeKey, def, mesh,
      angle: a,
      grow: 0,
      bobOffset: Math.random() * Math.PI * 2,
      target: pickTarget(),
      jumpT: Math.random() * 4,
      jumping: false,
    };
    scene.add(mesh);
    pets.push(pet);
    return pet;
  }

  function pickTarget() {
    const a = Math.random() * Math.PI * 2;
    const r = ISLAND_RADIUS + 2 + Math.random() * (POND_RADIUS - ISLAND_RADIUS - 5);
    return new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
  }

  return {
    pets,
    adopt,
    has: (bonus) => pets.some((p) => p.def.bonus === bonus),
    hasType: (k) => pets.some((p) => p.typeKey === k),
    update(dt, t) {
      for (const p of pets) {
        if (p.grow < 1) { p.grow = Math.min(1, p.grow + dt * 1.5); p.mesh.scale.setScalar(p.grow); }
        const g = p.mesh;

        if (p.typeKey === "dolphin") {
          // dolphin glides on a big circle and leaps periodically
          p.angle += dt * 0.4;
          const r = POND_RADIUS - 6;
          g.position.x = Math.cos(p.angle) * r;
          g.position.z = Math.sin(p.angle) * r;
          g.rotation.y = -p.angle + Math.PI / 2;
          p.jumpT -= dt;
          if (!p.jumping && p.jumpT <= 0) { p.jumping = true; p.jumpPhase = 0; }
          if (p.jumping) {
            p.jumpPhase += dt * 1.6;
            const a = Math.sin(p.jumpPhase * Math.PI);
            g.position.y = a * 2.2 - 0.1;
            g.rotation.z = -Math.cos(p.jumpPhase * Math.PI) * 0.9;
            if (p.jumpPhase >= 1) {
              p.jumping = false; p.jumpT = 4 + Math.random() * 4; g.rotation.z = 0;
              onSplash(g.position.clone().setY(0.1));
            }
          } else {
            g.position.y = Math.sin(t * 2 + p.bobOffset) * 0.05;
          }
          continue;
        }

        // turtle / duck wander gently
        const dx = p.target.x - g.position.x;
        const dz = p.target.z - g.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.6) {
          p.target = pickTarget();
        } else {
          const sp = 1.2 * dt;
          g.position.x += (dx / dist) * sp;
          g.position.z += (dz / dist) * sp;
          const targetRot = Math.atan2(dx, dz);
          let d = targetRot - g.rotation.y;
          while (d > Math.PI) d -= Math.PI * 2;
          while (d < -Math.PI) d += Math.PI * 2;
          g.rotation.y += d * Math.min(1, dt * 3);
        }
        g.position.y = Math.sin(t * 1.4 + p.bobOffset) * 0.06;
      }
    },
  };
}
