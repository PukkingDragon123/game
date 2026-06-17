import * as THREE from "three";

// A chubby low-poly otter built from primitives. Returns a group plus an
// update() that animates paddling, bobbing and a little look-around idle.
export function createOtter() {
  const otter = new THREE.Group();

  const furMat = new THREE.MeshStandardMaterial({ color: 0x9c6b43, roughness: 0.85 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: 0xd9b489, roughness: 0.85 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x2c2018, roughness: 0.6 });
  const noseMat = new THREE.MeshStandardMaterial({ color: 0x4a2f24, roughness: 0.5 });

  // ---- Body (a fat capsule lying down) ----
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.6, 0.9, 8, 16), furMat);
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.55;
  body.castShadow = true;
  otter.add(body);

  // belly patch
  const belly = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 0.7, 6, 12), bellyMat);
  belly.rotation.z = Math.PI / 2;
  belly.position.set(0.05, 0.42, 0);
  otter.add(belly);

  // ---- Head ----
  const head = new THREE.Group();
  head.position.set(0.95, 0.75, 0);
  otter.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.52, 24, 18), furMat);
  skull.castShadow = true;
  head.add(skull);

  // muzzle
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), bellyMat);
  muzzle.scale.set(1, 0.8, 1);
  muzzle.position.set(0.42, -0.1, 0);
  head.add(muzzle);

  // nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), noseMat);
  nose.position.set(0.68, -0.02, 0);
  head.add(nose);

  // eyes
  for (const z of [-0.22, 0.22]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), darkMat);
    eye.position.set(0.38, 0.16, z);
    head.add(eye);
    const glint = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    glint.position.set(0.46, 0.21, z + 0.02);
    head.add(glint);
  }

  // ears
  for (const z of [-0.34, 0.34]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), furMat);
    ear.position.set(-0.05, 0.42, z);
    head.add(ear);
  }

  // ---- Tail (flat, tapering) ----
  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.9, 6, 10), furMat);
  tail.scale.set(1, 1, 0.55);
  tail.rotation.z = Math.PI / 2.4;
  tail.position.set(-1.0, 0.4, 0);
  tail.castShadow = true;
  otter.add(tail);

  // ---- Paws (little front feet that paddle) ----
  const paws = [];
  for (const z of [-0.4, 0.4]) {
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), darkMat);
    paw.scale.set(1.2, 0.7, 1);
    paw.position.set(0.55, 0.18, z);
    paw.userData.baseZ = z;
    otter.add(paw);
    paws.push(paw);
  }

  // ---- Held-item anchor (shows last gathered treasure on belly) ----
  const heldAnchor = new THREE.Group();
  heldAnchor.position.set(0.45, 0.7, 0);
  otter.add(heldAnchor);

  otter.scale.setScalar(0.9);

  let paddle = 0;
  return {
    group: otter,
    head,
    heldAnchor,
    // speed01: 0..1 how fast the otter is currently moving
    update(dt, t, speed01) {
      // gentle vertical bob on the water
      otter.position.y = Math.sin(t * 2.2) * 0.05;

      // body roll while turning is handled by main via group.rotation.y
      // paddling — faster paws when moving
      paddle += dt * (4 + speed01 * 16);
      const swing = Math.sin(paddle) * (0.12 + speed01 * 0.25);
      paws[0].position.x = 0.55 + swing;
      paws[1].position.x = 0.55 - swing;
      paws[0].position.y = 0.18 + Math.max(0, Math.cos(paddle)) * 0.12 * speed01;
      paws[1].position.y = 0.18 + Math.max(0, -Math.cos(paddle)) * 0.12 * speed01;

      // tail sways
      tail.rotation.y = Math.sin(t * 2.0) * 0.25 * (0.4 + speed01);

      // idle head look-around when nearly still
      if (speed01 < 0.05) {
        head.rotation.y = Math.sin(t * 0.7) * 0.4;
        head.position.y = 0.75 + Math.sin(t * 1.5) * 0.03;
      } else {
        head.rotation.y *= 0.9;
      }
    },
  };
}
