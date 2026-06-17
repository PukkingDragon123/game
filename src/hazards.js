import * as THREE from "three";
import { POND_RADIUS, ISLAND_RADIUS } from "./world.js";

// Hostile critters. Jellyfish drift and briefly STUN the otter on contact;
// a shark patrols and SCARES the otter (knocks loose a few pouch items).
// Both are gentle — this is a cozy game — and emit one event per contact,
// handled with a cooldown in main.

function buildJellyfish() {
  const g = new THREE.Group();
  const bellMat = new THREE.MeshStandardMaterial({
    color: 0xff9ad6, roughness: 0.3, transparent: true, opacity: 0.8,
    emissive: 0xff5fb0, emissiveIntensity: 0.25,
  });
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), bellMat);
  bell.scale.set(1, 0.8, 1);
  bell.position.y = 0.35;
  g.add(bell);
  const tentMat = new THREE.MeshStandardMaterial({ color: 0xff7bc0, transparent: true, opacity: 0.7 });
  const tents = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.7, 5), tentMat);
    t.position.set(Math.cos(a) * 0.25, -0.05, Math.sin(a) * 0.25);
    g.add(t); tents.push(t);
  }
  g.userData.tents = tents;
  return g;
}

function buildShark() {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x5a6b7a, roughness: 0.5 });
  const belly = new THREE.MeshStandardMaterial({ color: 0xcfd8de, roughness: 0.6 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.6, 8, 14), bodyMat);
  body.rotation.z = Math.PI / 2; body.position.y = 0.1; g.add(body);
  const tummy = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 1.3, 6, 10), belly);
  tummy.rotation.z = Math.PI / 2; tummy.position.set(0, -0.05, 0); g.add(tummy);
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.7, 12), bodyMat);
  snout.rotation.z = -Math.PI / 2; snout.position.x = 1.25; g.add(snout);
  // big dorsal fin (the visible threat above water)
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.9, 4), bodyMat);
  fin.position.set(-0.1, 0.7, 0); fin.rotation.z = -0.35; g.add(fin);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.6, 4), bodyMat);
  tail.rotation.z = Math.PI / 2; tail.scale.set(1, 1, 0.3); tail.position.x = -1.35; g.add(tail);
  for (const z of [0.45, -0.45]) {
    const pec = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 4), bodyMat);
    pec.position.set(0.2, -0.15, z); pec.rotation.set(Math.PI / 2, 0, z > 0 ? 0.6 : -0.6); g.add(pec);
  }
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshStandardMaterial({ color: 0x111111 }));
  eye.position.set(0.7, 0.18, 0.28); g.add(eye);
  const eye2 = eye.clone(); eye2.position.z = -0.28; g.add(eye2);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export function createHazards(scene, opts = {}) {
  const jellies = [];
  let shark = null;
  const events = [];

  function spawnJelly() {
    const mesh = buildJellyfish();
    const a = Math.random() * Math.PI * 2;
    const r = ISLAND_RADIUS + 3 + Math.random() * (POND_RADIUS - ISLAND_RADIUS - 5);
    mesh.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    scene.add(mesh);
    jellies.push({
      mesh, bob: Math.random() * Math.PI * 2,
      drift: new THREE.Vector2((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4),
      cooldown: 0,
    });
  }

  function spawnShark() {
    const mesh = buildShark();
    scene.add(mesh);
    shark = { mesh, angle: Math.random() * Math.PI * 2, radius: POND_RADIUS - 7, cooldown: 0, lungeT: 0 };
  }

  const jellyCount = opts.jellies ?? 4;
  for (let i = 0; i < jellyCount; i++) spawnJelly();
  if (opts.shark !== false) spawnShark();

  return {
    events,
    update(dt, t, otterPos) {
      events.length = 0;

      for (const j of jellies) {
        const p = j.mesh.position;
        p.x += j.drift.x * dt; p.z += j.drift.y * dt;
        const dc = Math.hypot(p.x, p.z);
        if (dc < ISLAND_RADIUS + 2 || dc > POND_RADIUS - 1) { j.drift.x *= -1; j.drift.y *= -1; }
        p.y = Math.sin(t * 1.5 + j.bob) * 0.18;
        j.mesh.scale.y = 1 + Math.sin(t * 3 + j.bob) * 0.12; // pulsing bell
        if (j.cooldown > 0) j.cooldown -= dt;
        const dx = p.x - otterPos.x, dz = p.z - otterPos.z;
        if (j.cooldown <= 0 && dx * dx + dz * dz < 1.4 * 1.4) {
          j.cooldown = 4;
          events.push({ type: "stun", pos: p.clone() });
        }
      }

      if (shark) {
        const s = shark;
        if (s.cooldown > 0) s.cooldown -= dt;
        // patrol a slowly shrinking/growing circle, occasionally lunge toward otter
        s.angle += dt * 0.35;
        s.lungeT -= dt;
        const targetR = s.radius + Math.sin(t * 0.3) * 3;
        const px = Math.cos(s.angle) * targetR, pz = Math.sin(s.angle) * targetR;
        const sp = s.lungeT > 0 ? 4 : 1.6;
        // blend toward patrol point (and toward otter when lunging)
        let tx = px, tz = pz;
        if (s.lungeT > 0) { tx = otterPos.x; tz = otterPos.z; }
        const m = s.mesh.position;
        const ddx = tx - m.x, ddz = tz - m.z, dd = Math.hypot(ddx, ddz) || 1;
        m.x += (ddx / dd) * sp * dt * (s.lungeT > 0 ? 6 : 3);
        m.z += (ddz / dd) * sp * dt * (s.lungeT > 0 ? 6 : 3);
        m.y = Math.sin(t * 2) * 0.05;
        s.mesh.rotation.y = Math.atan2(ddx, ddz) - Math.PI / 2;
        // randomly begin a lunge when otter is in the area
        if (s.lungeT <= -3 && Math.random() < dt * 0.4) s.lungeT = 1.4;
        const hx = m.x - otterPos.x, hz = m.z - otterPos.z;
        if (s.cooldown <= 0 && hx * hx + hz * hz < 1.8 * 1.8) {
          s.cooldown = 6; s.lungeT = -3;
          events.push({ type: "scare", pos: m.clone() });
        }
      }
      return events;
    },
  };
}
