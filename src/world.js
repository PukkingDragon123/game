import * as THREE from "three";

// Pond is a big circle of water; the village island sits in the middle.
export const POND_RADIUS = 26;
export const ISLAND_RADIUS = 7.5;

export function createWorld(scene) {
  // ---- Sky / fog (soft pastel) ----
  scene.background = new THREE.Color(0xd9f3ff);
  scene.fog = new THREE.Fog(0xd9f3ff, 38, 70);

  // ---- Lights ----
  const hemi = new THREE.HemisphereLight(0xffffff, 0x9ad0e0, 0.95);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff2d6, 1.15);
  sun.position.set(14, 24, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 80;
  const s = 34;
  sun.shadow.camera.left = -s;
  sun.shadow.camera.right = s;
  sun.shadow.camera.top = s;
  sun.shadow.camera.bottom = -s;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  // ---- Water surface (animated gentle waves) ----
  const waterGeo = new THREE.CircleGeometry(POND_RADIUS + 8, 96, 0, Math.PI * 2);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x5bb6d8,
    roughness: 0.25,
    metalness: 0.0,
    transparent: true,
    opacity: 0.92,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.receiveShadow = true;
  scene.add(water);

  // store base positions for the wave animation
  const pos = waterGeo.attributes.position;
  const base = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) base[i] = pos.getY(i);

  // ---- Pond floor (so it doesn't look bottomless) ----
  const floorGeo = new THREE.CircleGeometry(POND_RADIUS + 8, 64);
  floorGeo.rotateX(-Math.PI / 2);
  const floor = new THREE.Mesh(
    floorGeo,
    new THREE.MeshStandardMaterial({ color: 0x3f7e93, roughness: 1 })
  );
  floor.position.y = -1.6;
  floor.receiveShadow = true;
  scene.add(floor);

  // ---- Village island ----
  const island = buildIsland();
  scene.add(island);

  // ---- Outer ring of reeds / lily pads for charm ----
  scene.add(buildDecorations());

  return {
    water,
    island,
    update(t) {
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const y =
          Math.sin(x * 0.25 + t * 1.1) * 0.12 +
          Math.cos(z * 0.3 + t * 0.9) * 0.12;
        pos.setY(i, base[i] + y);
      }
      pos.needsUpdate = true;
      waterGeo.computeVertexNormals();
    },
  };
}

function buildIsland() {
  const group = new THREE.Group();

  // grassy mound — a slightly squashed dome
  const moundGeo = new THREE.SphereGeometry(ISLAND_RADIUS, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2);
  moundGeo.scale(1, 0.42, 1);
  const grass = new THREE.Mesh(
    moundGeo,
    new THREE.MeshStandardMaterial({ color: 0x8ed16a, roughness: 0.95 })
  );
  grass.position.y = -0.15;
  grass.castShadow = true;
  grass.receiveShadow = true;
  group.add(grass);

  // sandy shoreline ring
  const sandGeo = new THREE.CylinderGeometry(ISLAND_RADIUS + 1.1, ISLAND_RADIUS + 1.6, 0.5, 48);
  const sand = new THREE.Mesh(
    sandGeo,
    new THREE.MeshStandardMaterial({ color: 0xf2e2b6, roughness: 1 })
  );
  sand.position.y = -0.35;
  sand.receiveShadow = true;
  group.add(sand);

  // a few starter rocks & tufts so it isn't bare
  const tuftMat = new THREE.MeshStandardMaterial({ color: 0x6fb84e, roughness: 1 });
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * (ISLAND_RADIUS - 1.5);
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 5), tuftMat);
    tuft.position.set(Math.cos(a) * r, 0.25, Math.sin(a) * r);
    tuft.castShadow = true;
    group.add(tuft);
  }

  return group;
}

function buildDecorations() {
  const group = new THREE.Group();
  const padMat = new THREE.MeshStandardMaterial({ color: 0x4fa86a, roughness: 1 });
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = POND_RADIUS - 2 - Math.random() * 5;
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.5 + Math.random() * 0.5, 7), padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(Math.cos(a) * r, 0.02, Math.sin(a) * r);
    group.add(pad);
  }
  return group;
}
