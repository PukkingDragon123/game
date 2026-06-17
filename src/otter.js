import * as THREE from "three";

// Builds the raw otter mesh + part references, so both the player otter and
// the little villager otters can share one cute body.
export function buildOtterMesh(opts = {}) {
  const fur = opts.fur ?? 0x9c6b43;
  const belly = opts.belly ?? 0xd9b489;
  const group = new THREE.Group();

  const furMat = new THREE.MeshStandardMaterial({ color: fur, roughness: 0.85 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: belly, roughness: 0.85 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x2c2018, roughness: 0.6 });
  const noseMat = new THREE.MeshStandardMaterial({ color: 0x4a2f24, roughness: 0.5 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.6, 0.9, 8, 16), furMat);
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.55;
  body.castShadow = true;
  group.add(body);

  const bellyMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 0.7, 6, 12), bellyMat);
  bellyMesh.rotation.z = Math.PI / 2;
  bellyMesh.position.set(0.05, 0.42, 0);
  group.add(bellyMesh);

  const head = new THREE.Group();
  head.position.set(0.95, 0.75, 0);
  group.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.52, 24, 18), furMat);
  skull.castShadow = true;
  head.add(skull);

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), bellyMat);
  muzzle.scale.set(1, 0.8, 1);
  muzzle.position.set(0.42, -0.1, 0);
  head.add(muzzle);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), noseMat);
  nose.position.set(0.68, -0.02, 0);
  head.add(nose);

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
  for (const z of [-0.34, 0.34]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), furMat);
    ear.position.set(-0.05, 0.42, z);
    head.add(ear);
  }

  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.9, 6, 10), furMat);
  tail.scale.set(1, 1, 0.55);
  tail.rotation.z = Math.PI / 2.4;
  tail.position.set(-1.0, 0.4, 0);
  tail.castShadow = true;
  group.add(tail);

  const paws = [];
  for (const z of [-0.4, 0.4]) {
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), darkMat);
    paw.scale.set(1.2, 0.7, 1);
    paw.position.set(0.55, 0.18, z);
    paw.userData.baseZ = z;
    group.add(paw);
    paws.push(paw);
  }

  return { group, head, tail, paws, furMat, bellyMat };
}

// The player-controlled otter, with a held-item anchor and richer animation.
export function createOtter() {
  const { group, head, tail, paws, furMat, bellyMat } = buildOtterMesh();

  const heldAnchor = new THREE.Group();
  heldAnchor.position.set(0.45, 0.7, 0);
  group.add(heldAnchor);

  // hat sits on top of the head
  const hatAnchor = new THREE.Group();
  hatAnchor.position.set(0.05, 0.48, 0);
  head.add(hatAnchor);
  let currentHat = null;

  group.scale.setScalar(0.9);

  let paddle = 0;
  return {
    group,
    head,
    heldAnchor,
    setFur(color, bellyColor) {
      furMat.color.set(color);
      if (bellyColor) bellyMat.color.set(bellyColor);
    },
    setHat(mesh) {
      if (currentHat) { hatAnchor.remove(currentHat); }
      currentHat = mesh || null;
      if (mesh) hatAnchor.add(mesh);
    },
    update(dt, t, speed01) {
      group.position.y = Math.sin(t * 2.2) * 0.05;
      paddle += dt * (4 + speed01 * 16);
      const swing = Math.sin(paddle) * (0.12 + speed01 * 0.25);
      paws[0].position.x = 0.55 + swing;
      paws[1].position.x = 0.55 - swing;
      paws[0].position.y = 0.18 + Math.max(0, Math.cos(paddle)) * 0.12 * speed01;
      paws[1].position.y = 0.18 + Math.max(0, -Math.cos(paddle)) * 0.12 * speed01;
      tail.rotation.y = Math.sin(t * 2.0) * 0.25 * (0.4 + speed01);
      if (speed01 < 0.05) {
        head.rotation.y = Math.sin(t * 0.7) * 0.4;
        head.position.y = 0.75 + Math.sin(t * 1.5) * 0.03;
      } else {
        head.rotation.y *= 0.9;
      }
    },
  };
}
