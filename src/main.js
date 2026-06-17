import * as THREE from "three";
import { createWorld, POND_RADIUS, ISLAND_RADIUS } from "./world.js";
import { createOtter } from "./otter.js";
import { createResourceField, RESOURCE_TYPES } from "./resources.js";
import { createVillage, BUILDINGS } from "./village.js";
import { createUI } from "./ui.js";

// ---------------------------------------------------------------------------
// Renderer + scene
// ---------------------------------------------------------------------------
const app = document.getElementById("app");
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);

const world = createWorld(scene);
const otter = createOtter();
scene.add(otter.group);
const resources = createResourceField(scene);
const village = createVillage(scene);

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------
const game = {
  inventory: { wood: 0, reed: 0, shell: 0, berry: 0 },
  villagePop: 0,
  placementDef: null, // building currently being placed
  requestPlacement(def) {
    game.placementDef = def;
    ui.showPlacement(def);
  },
  cancelPlacement() {
    game.placementDef = null;
    ui.hidePlacement();
  },
};
const ui = createUI(game);
ui.syncInventory();
ui.syncVillage(0);

// ---------------------------------------------------------------------------
// Input — drag-anywhere joystick (mobile) + keyboard (desktop)
// ---------------------------------------------------------------------------
const move = new THREE.Vector2(0, 0); // desired move dir in screen space (x right, y down)
const keys = new Set();
let joyActive = false;
let joyId = null;
const joyStart = new THREE.Vector2();
const joystickEl = document.getElementById("joystick");
const joyKnob = document.getElementById("joystick-knob");

function isUIElement(target) {
  return target.closest(
    "#hud > *, #build-menu, #intro, #place-banner, #build-toggle, #resource-bar, #village-level"
  );
}

renderer.domElement.addEventListener("pointerdown", (e) => {
  // In placement mode, a tap tries to place a building instead of moving.
  if (game.placementDef) {
    tryPlaceAtScreen(e.clientX, e.clientY);
    return;
  }
  if (joyActive) return;
  joyActive = true;
  joyId = e.pointerId;
  joyStart.set(e.clientX, e.clientY);
  joystickEl.style.left = e.clientX - 60 + "px";
  joystickEl.style.top = e.clientY - 60 + "px";
  joystickEl.classList.remove("hidden");
  joyKnob.style.transform = "translate(-50%, -50%)";
});

window.addEventListener("pointermove", (e) => {
  if (!joyActive || e.pointerId !== joyId) return;
  const dx = e.clientX - joyStart.x;
  const dy = e.clientY - joyStart.y;
  const max = 48;
  const len = Math.hypot(dx, dy);
  const clamped = Math.min(len, max);
  const nx = len > 0 ? dx / len : 0;
  const ny = len > 0 ? dy / len : 0;
  move.set(nx * (clamped / max), ny * (clamped / max));
  joyKnob.style.transform = `translate(calc(-50% + ${nx * clamped}px), calc(-50% + ${ny * clamped}px))`;
});

function endJoy(e) {
  if (e && e.pointerId !== joyId) return;
  joyActive = false;
  joyId = null;
  move.set(0, 0);
  joystickEl.classList.add("hidden");
}
window.addEventListener("pointerup", endJoy);
window.addEventListener("pointercancel", endJoy);

window.addEventListener("keydown", (e) => keys.add(e.key.toLowerCase()));
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

function keyboardDir() {
  let x = 0, y = 0;
  if (keys.has("w") || keys.has("arrowup")) y -= 1;
  if (keys.has("s") || keys.has("arrowdown")) y += 1;
  if (keys.has("a") || keys.has("arrowleft")) x -= 1;
  if (keys.has("d") || keys.has("arrowright")) x += 1;
  return { x, y };
}

// ---------------------------------------------------------------------------
// Placement raycasting
// ---------------------------------------------------------------------------
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function tryPlaceAtScreen(clientX, clientY) {
  ndc.x = (clientX / window.innerWidth) * 2 - 1;
  ndc.y = -(clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObject(world.island, true);
  if (hits.length === 0) {
    ui.toast("Tap the grassy island 🌱");
    return;
  }
  const point = hits[0].point.clone();
  point.y = 0;
  const def = game.placementDef;
  if (!village.canPlaceAt(point)) {
    ui.toast("Too crowded — try another spot");
    return;
  }
  // pay the cost
  for (const [res, n] of Object.entries(def.cost)) game.inventory[res] -= n;
  village.place(def, point);
  game.villagePop += def.pop;
  ui.syncInventory();
  ui.syncVillage(game.villagePop);
  ui.toast(`${def.emoji} ${def.name} built!`);
  game.cancelPlacement();
  maybeMilestone();
}

let lastMilestone = 0;
function maybeMilestone() {
  const tiers = [
    { pop: 5, msg: "Your village is growing! 🦦🏡" },
    { pop: 12, msg: "A bustling little hamlet! 🎉" },
    { pop: 25, msg: "Otter Town, population: adorable 💛" },
    { pop: 45, msg: "A grand Otter City! 👑" },
  ];
  for (const t of tiers) {
    if (game.villagePop >= t.pop && lastMilestone < t.pop) {
      lastMilestone = t.pop;
      ui.toast(t.msg);
    }
  }
}

// ---------------------------------------------------------------------------
// Collection — pick up drifting resources the otter paddles into
// ---------------------------------------------------------------------------
const heldMeshSlot = { mesh: null, timer: 0 };
function collectNearby() {
  const op = otter.group.position;
  for (let i = resources.items.length - 1; i >= 0; i--) {
    const it = resources.items[i];
    const dx = it.mesh.position.x - op.x;
    const dz = it.mesh.position.z - op.z;
    if (dx * dx + dz * dz < 1.5 * 1.5) {
      game.inventory[it.type] += 1;
      ui.syncInventory(it.type);
      ui.toast(`+1 ${RESOURCE_TYPES[it.type].name} ${RESOURCE_TYPES[it.type].emoji}`);
      showHeld(it.type);
      resources.remove(it);
    }
  }
}

function showHeld(type) {
  if (heldMeshSlot.mesh) otter.heldAnchor.remove(heldMeshSlot.mesh);
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 10, 8),
    new THREE.MeshStandardMaterial({ color: RESOURCE_TYPES[type].color, roughness: 0.6 })
  );
  otter.heldAnchor.add(m);
  heldMeshSlot.mesh = m;
  heldMeshSlot.timer = 1.2;
}

// ---------------------------------------------------------------------------
// Otter movement
// ---------------------------------------------------------------------------
const otterVel = new THREE.Vector3();
const SPEED = 7.2;

function updateOtter(dt, t) {
  // combine joystick + keyboard into a world-space XZ direction.
  // screen: x→right maps to world +X, y→down maps to world +Z (camera looks
  // down -Z toward the scene), which keeps controls intuitive.
  const k = keyboardDir();
  let dirX = move.x + k.x;
  let dirZ = move.y + k.y;
  const len = Math.hypot(dirX, dirZ);
  if (len > 1) { dirX /= len; dirZ /= len; }

  const targetVx = dirX * SPEED;
  const targetVz = dirZ * SPEED;
  // smooth accel for a floaty, swimmy feel
  otterVel.x += (targetVx - otterVel.x) * Math.min(1, dt * 6);
  otterVel.z += (targetVz - otterVel.z) * Math.min(1, dt * 6);

  const g = otter.group;
  g.position.x += otterVel.x * dt;
  g.position.z += otterVel.z * dt;

  // keep the otter in the water ring (outside island, inside pond)
  const distC = Math.hypot(g.position.x, g.position.z);
  const inner = ISLAND_RADIUS + 0.9;
  const outer = POND_RADIUS - 0.8;
  if (distC < inner) {
    const nx = g.position.x / (distC || 1), nz = g.position.z / (distC || 1);
    g.position.x = nx * inner; g.position.z = nz * inner;
    otterVel.x *= 0.3; otterVel.z *= 0.3;
  } else if (distC > outer) {
    const nx = g.position.x / distC, nz = g.position.z / distC;
    g.position.x = nx * outer; g.position.z = nz * outer;
    otterVel.x *= 0.3; otterVel.z *= 0.3;
  }

  // face travel direction
  const speed = Math.hypot(otterVel.x, otterVel.z);
  if (speed > 0.2) {
    const targetRot = Math.atan2(-otterVel.z, otterVel.x);
    let d = targetRot - g.rotation.y;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    g.rotation.y += d * Math.min(1, dt * 8);
    // bank into turns a touch
    g.rotation.z = THREE.MathUtils.clamp(-d * 0.5, -0.3, 0.3);
  } else {
    g.rotation.z *= 0.9;
  }

  const speed01 = Math.min(1, speed / SPEED);
  otter.update(dt, t, speed01);

  // fade out the held trinket
  if (heldMeshSlot.mesh) {
    heldMeshSlot.timer -= dt;
    const s = Math.max(0, heldMeshSlot.timer / 1.2);
    heldMeshSlot.mesh.scale.setScalar(s);
    if (heldMeshSlot.timer <= 0) {
      otter.heldAnchor.remove(heldMeshSlot.mesh);
      heldMeshSlot.mesh = null;
    }
  }
}

// ---------------------------------------------------------------------------
// Camera follow
// ---------------------------------------------------------------------------
const camOffset = new THREE.Vector3(0, 13, 15);
const camTarget = new THREE.Vector3();
function updateCamera(dt) {
  const p = otter.group.position;
  const desired = new THREE.Vector3(p.x + camOffset.x, camOffset.y, p.z + camOffset.z);
  camera.position.lerp(desired, Math.min(1, dt * 3));
  camTarget.lerp(new THREE.Vector3(p.x, 1, p.z), Math.min(1, dt * 4));
  camera.lookAt(camTarget);
}

// ---------------------------------------------------------------------------
// Loop
// ---------------------------------------------------------------------------
let running = false;
const clock = new THREE.Clock();

function tick() {
  if (!running) return;
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  world.update(t);
  resources.update(dt, t);
  village.update(dt);
  updateOtter(dt, t);
  collectNearby();
  updateCamera(dt);

  renderer.render(scene, camera);
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// place camera initially
otter.group.position.set(0, 0, ISLAND_RADIUS + 5);
camera.position.set(camOffset.x, camOffset.y, ISLAND_RADIUS + 5 + camOffset.z);
camera.lookAt(0, 1, ISLAND_RADIUS + 5);
renderer.render(scene, camera);

// hide loader once everything is constructed
document.getElementById("loader").classList.add("hidden");

document.getElementById("start-btn").addEventListener("click", () => {
  document.getElementById("intro").classList.add("hidden");
  document.getElementById("hud").classList.remove("hidden");
  running = true;
  clock.start();
  tick();
});
