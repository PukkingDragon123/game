import * as THREE from "three";

export const POND_RADIUS = 26;
export const ISLAND_RADIUS = 7.5;
// Height of the flat grassy plateau the village sits on (world Y).
export const ISLAND_TOP_Y = 0.55;

export function createWorld(scene) {
  // ---- Gradient sky backdrop ----
  scene.background = makeSkyTexture();
  scene.fog = new THREE.Fog(0xd4f0ff, 42, 78);

  // ---- Lights ----
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8fd0e0, 0.85);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff1d0, 1.25);
  sun.position.set(16, 26, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 90;
  const s = 36;
  sun.shadow.camera.left = -s;
  sun.shadow.camera.right = s;
  sun.shadow.camera.top = s;
  sun.shadow.camera.bottom = -s;
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  // visible sun orb + glow
  const sunOrb = new THREE.Mesh(
    new THREE.SphereGeometry(3, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff3c4 })
  );
  sunOrb.position.set(-22, 28, -34);
  scene.add(sunOrb);
  const sunGlow = new THREE.Mesh(
    new THREE.SphereGeometry(5, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff3c4, transparent: true, opacity: 0.25 })
  );
  sunGlow.position.copy(sunOrb.position);
  scene.add(sunGlow);

  // ---- Water surface ----
  const waterGeo = new THREE.CircleGeometry(POND_RADIUS + 10, 110, 0, Math.PI * 2);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x4fb4dd,
    roughness: 0.12,
    metalness: 0.15,
    transparent: true,
    opacity: 0.94,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.receiveShadow = true;
  scene.add(water);

  const pos = waterGeo.attributes.position;
  const base = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) base[i] = pos.getY(i);

  // ---- Pond floor ----
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(POND_RADIUS + 10, 64).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x2f6f87, roughness: 1 })
  );
  floor.position.y = -1.8;
  floor.receiveShadow = true;
  scene.add(floor);

  // foam ring around the island shoreline
  const foam = new THREE.Mesh(
    new THREE.RingGeometry(ISLAND_RADIUS + 1.3, ISLAND_RADIUS + 2.2, 48).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xeafdff, transparent: true, opacity: 0.5, roughness: 1 })
  );
  foam.position.y = 0.06;
  scene.add(foam);

  // ---- Island + scenery ----
  const island = buildIsland();
  scene.add(island);
  scene.add(buildLilyPads());

  // ---- Procedural ocean scenery so the pond feels alive ----
  scene.add(buildScatter());

  // ---- Treasure island (with an openable chest) + whirlpool ----
  const treasure = buildTreasureIsland();
  scene.add(treasure.group);
  const whirlpool = buildWhirlpool();
  scene.add(whirlpool.group);

  // ---- Drifting clouds ----
  const clouds = buildClouds();
  scene.add(clouds);

  return {
    water,
    island,
    chest: treasure.chest,
    chestPos: treasure.chestPos,
    chestLid: treasure.lid,
    whirlpool: whirlpool.group,
    whirlpoolPos: whirlpool.pos,
    update(t) {
      // richer two-layer swell + fine ripple
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const y =
          Math.sin(x * 0.22 + t * 1.1) * 0.16 +
          Math.cos(z * 0.28 + t * 0.9) * 0.16 +
          Math.sin((x + z) * 0.6 + t * 2.2) * 0.05;
        pos.setY(i, base[i] + y);
      }
      pos.needsUpdate = true;
      waterGeo.computeVertexNormals();

      for (const c of clouds.children) {
        c.position.x += c.userData.speed * 0.016;
        if (c.position.x > 60) c.position.x = -60;
      }

      // spin the whirlpool funnel
      whirlpool.group.children.forEach((ring, i) => {
        ring.rotation.z += (0.6 + i * 0.4) * 0.016 * 4;
      });
      treasure.bob(t);
    },
  };
}

// rock islets, reed clumps, extra lilies and distant mini-islands
function buildScatter() {
  const group = new THREE.Group();
  const rng = (a, b) => a + Math.random() * (b - a);

  // rock islets in the playable ring
  for (let i = 0; i < 7; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = rng(ISLAND_RADIUS + 4, POND_RADIUS - 3);
    const islet = new THREE.Group();
    const n = 2 + ((Math.random() * 3) | 0);
    for (let j = 0; j < n; j++) {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(rng(0.4, 0.9), 0),
        new THREE.MeshStandardMaterial({ color: 0x8f96a0, roughness: 1 })
      );
      rock.position.set(rng(-0.6, 0.6), rng(0.1, 0.5), rng(-0.6, 0.6));
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      islet.add(rock);
    }
    if (Math.random() < 0.5) {
      const reed = new THREE.Mesh(new THREE.ConeGeometry(0.08, rng(0.8, 1.3), 6),
        new THREE.MeshStandardMaterial({ color: 0x5fae54, roughness: 1 }));
      reed.position.set(rng(-0.5, 0.5), 0.5, rng(-0.5, 0.5));
      islet.add(reed);
    }
    islet.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    group.add(islet);
  }

  // distant mini-islands beyond the pond for a fuller horizon
  for (let i = 0; i < 9; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = rng(POND_RADIUS + 6, POND_RADIUS + 22);
    const mini = new THREE.Group();
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(rng(2, 4.5), 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x86d063, roughness: 1 })
    );
    dome.scale.set(1, rng(0.3, 0.5), 1);
    mini.add(dome);
    const tn = 1 + ((Math.random() * 3) | 0);
    for (let j = 0; j < tn; j++) {
      const tree = makeTree();
      tree.position.set(rng(-2, 2), dome.scale.y * 2.2, rng(-2, 2));
      tree.scale.setScalar(rng(0.8, 1.4));
      mini.add(tree);
    }
    mini.position.set(Math.cos(a) * r, rng(-0.6, -0.2), Math.sin(a) * r);
    group.add(mini);
  }

  return group;
}

function buildTreasureIsland() {
  const group = new THREE.Group();
  const a = -2.1, r = POND_RADIUS - 5;
  const cx = Math.cos(a) * r, cz = Math.sin(a) * r;
  group.position.set(cx, 0, cz);

  const sand = new THREE.Mesh(
    new THREE.SphereGeometry(2.6, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xf0dca0, roughness: 1 })
  );
  sand.scale.set(1, 0.32, 1); sand.castShadow = true; sand.receiveShadow = true;
  group.add(sand);

  // palm tree
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, 1.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x9b6a3c, roughness: 0.9 }));
  trunk.position.set(-0.9, 0.9, 0.4); trunk.rotation.z = 0.18; trunk.castShadow = true;
  group.add(trunk);
  const frondMat = new THREE.MeshStandardMaterial({ color: 0x57b86a, roughness: 1 });
  for (let i = 0; i < 5; i++) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.2, 5), frondMat);
    const ang = (i / 5) * Math.PI * 2;
    f.position.set(-1.0, 1.7, 0.4); f.rotation.set(Math.PI / 2.3, ang, 0);
    group.add(f);
  }

  // treasure chest
  const chest = new THREE.Group();
  const woodMatC = new THREE.MeshStandardMaterial({ color: 0x8a5a32, roughness: 0.8 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd23c, metalness: 0.5, roughness: 0.3, emissive: 0x6b4d00, emissiveIntensity: 0.2 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 0.7), woodMatC);
  box.position.y = 0.4; chest.add(box);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.0, 12, 1, false, 0, Math.PI), woodMatC);
  lid.rotation.z = Math.PI / 2; lid.position.set(0, 0.7, 0); chest.add(lid);
  for (const yy of [0.4, 0.7]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.08, 0.72), goldMat);
    band.position.y = yy; chest.add(band);
  }
  const lock = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.06), goldMat);
  lock.position.set(0, 0.5, 0.37); chest.add(lock);
  chest.position.set(0.8, 0.3, 0);
  chest.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  group.add(chest);

  const chestPos = new THREE.Vector3(cx + 0.8, 0, cz);
  return {
    group, chest, lid, chestPos,
    bob(t) { chest.position.y = 0.3 + Math.sin(t * 2) * 0.04; },
  };
}

function buildWhirlpool() {
  const group = new THREE.Group();
  const a = 1.3, r = POND_RADIUS - 9;
  const px = Math.cos(a) * r, pz = Math.sin(a) * r;
  group.position.set(px, 0.08, pz);
  group.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.6 - i * 0.36, 0.12 - i * 0.02, 8, 32, Math.PI * 1.6),
      new THREE.MeshStandardMaterial({ color: 0x3a93b8, roughness: 0.4, transparent: true, opacity: 0.85 })
    );
    ring.position.z = i * 0.12;
    group.add(ring);
  }
  return { group, pos: new THREE.Vector3(px, 0, pz) };
}

function makeSkyTexture() {
  const c = document.createElement("canvas");
  c.width = 16; c.height = 256;
  const ctx = c.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#7cc7f0");
  grad.addColorStop(0.45, "#b8e6ff");
  grad.addColorStop(1, "#eafaff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 16, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildIsland() {
  const group = new THREE.Group();
  const TOP = ISLAND_TOP_Y;

  // flat grassy plateau (top surface sits exactly at TOP) with a gentle flare
  const bodyH = 2.0;
  const grass = new THREE.Mesh(
    new THREE.CylinderGeometry(ISLAND_RADIUS, ISLAND_RADIUS + 0.4, bodyH, 64),
    new THREE.MeshStandardMaterial({ color: 0x86d063, roughness: 0.95 })
  );
  grass.position.y = TOP - bodyH / 2;
  grass.castShadow = true;
  grass.receiveShadow = true;
  group.add(grass);

  // soft rounded grass rim (a flattened torus) to round off the top edge
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(ISLAND_RADIUS - 0.05, 0.35, 10, 64).rotateX(Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x78c557, roughness: 1 })
  );
  rim.position.y = TOP - 0.18;
  rim.receiveShadow = true;
  group.add(rim);

  const sand = new THREE.Mesh(
    new THREE.CylinderGeometry(ISLAND_RADIUS + 1.1, ISLAND_RADIUS + 1.7, 0.6, 48),
    new THREE.MeshStandardMaterial({ color: 0xf3e4b8, roughness: 1 })
  );
  sand.position.y = -0.35;
  sand.receiveShadow = true;
  group.add(sand);

  // scenery: a couple of trees, rocks, flowers (kept toward the edges)
  const decor = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.5;
    const r = ISLAND_RADIUS - 1.6;
    decor.add(placeAt(makeTree(), Math.cos(a) * r, Math.sin(a) * r));
  }
  for (let i = 0; i < 5; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = ISLAND_RADIUS - 0.8 - Math.random() * 2;
    decor.add(placeAt(makeRock(), Math.cos(a) * r, Math.sin(a) * r));
  }
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * (ISLAND_RADIUS - 1);
    decor.add(placeAt(makeFlower(), Math.cos(a) * r, Math.sin(a) * r));
  }
  group.add(decor);

  return group;
}

function placeAt(obj, x, z) {
  obj.position.x = x;
  obj.position.z = z;
  obj.position.y = ISLAND_TOP_Y;
  return obj;
}

function makeTree() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.22, 1.0, 8),
    new THREE.MeshStandardMaterial({ color: 0x9b6a3c, roughness: 0.9 })
  );
  trunk.position.y = 0.45;
  trunk.castShadow = true;
  g.add(trunk);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x5fbe57, roughness: 1 });
  for (const [x, y, z, s] of [[0,1.2,0,0.75],[0.4,1.0,0.15,0.5],[-0.35,1.05,-0.15,0.5],[0.05,1.55,0,0.45]]) {
    const blob = new THREE.Mesh(new THREE.SphereGeometry(s, 12, 10), leafMat);
    blob.position.set(x, y, z);
    blob.castShadow = true;
    g.add(blob);
  }
  return g;
}

function makeRock() {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.25, 0),
    new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 1 })
  );
  rock.position.y = 0.15;
  rock.rotation.set(Math.random(), Math.random(), Math.random());
  rock.castShadow = true;
  return rock;
}

function makeFlower() {
  const g = new THREE.Group();
  const colors = [0xff9bd0, 0xffd34e, 0xff7b6b, 0xb98bff, 0xffffff];
  const c = colors[(Math.random() * colors.length) | 0];
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.3, 5),
    new THREE.MeshStandardMaterial({ color: 0x4a9a4f })
  );
  stem.position.y = 0.15;
  g.add(stem);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 6),
    new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 })
  );
  head.position.y = 0.32;
  g.add(head);
  return g;
}

function buildLilyPads() {
  const group = new THREE.Group();
  const padMat = new THREE.MeshStandardMaterial({ color: 0x4fa86a, roughness: 1 });
  const flowerMat = new THREE.MeshStandardMaterial({ color: 0xffc6e0, roughness: 0.7 });
  for (let i = 0; i < 22; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = POND_RADIUS - 2 - Math.random() * 6;
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.5 + Math.random() * 0.5, 8).rotateX(-Math.PI / 2), padMat);
    pad.position.set(Math.cos(a) * r, 0.04, Math.sin(a) * r);
    group.add(pad);
    if (Math.random() < 0.4) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), flowerMat);
      f.position.set(pad.position.x, 0.12, pad.position.z);
      group.add(f);
    }
  }
  return group;
}

function buildClouds() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });
  for (let i = 0; i < 7; i++) {
    const cloud = new THREE.Group();
    const n = 3 + ((Math.random() * 3) | 0);
    for (let j = 0; j < n; j++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(1.6 + Math.random() * 1.4, 10, 8), mat);
      puff.position.set(j * 1.8 - n, Math.random() * 0.8, Math.random() * 1.4);
      cloud.add(puff);
    }
    cloud.position.set((Math.random() - 0.5) * 110, 20 + Math.random() * 10, -25 - Math.random() * 30);
    cloud.userData.speed = 0.3 + Math.random() * 0.5;
    group.add(cloud);
  }
  return group;
}
