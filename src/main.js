import * as THREE from "three";
import { createWorld, POND_RADIUS, ISLAND_RADIUS } from "./world.js";
import { createOtter } from "./otter.js";
import { createResourceField, RESOURCE_TYPES } from "./resources.js";
import { createVillage, getBuilding, upgradeCost } from "./village.js";
import { createVillagers } from "./villagers.js";
import { createPets, PET_TYPES } from "./pets.js";
import { createHazards } from "./hazards.js";
import { SKINS, HATS, getSkin, getHat, buildHatMesh } from "./cosmetics.js";
import { createPostFX } from "./postfx.js";
import { createUI } from "./ui.js";

// ---------------------------------------------------------------------------
// Renderer + scene
// ---------------------------------------------------------------------------
const app = document.getElementById("app");
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);

const postfx = createPostFX(renderer, scene, camera);
postfx.setSize(window.innerWidth, window.innerHeight);

const world = createWorld(scene);
const otter = createOtter();
scene.add(otter.group);
const resources = createResourceField(scene, { maxItems: 28, spawnRate: 0.9 });
const village = createVillage(scene);
const pets = createPets(scene, { onSplash: (p) => makeSplash(p, 0xbfeaff, 9) });
const villagers = createVillagers(scene, {
  onProduce: (res, pos) => {
    game.inventory[res] += 1;
    ui.syncInventory(res);
    makeSplash(pos, RESOURCE_TYPES[res].color, 3);
  },
});
const hazards = createHazards(scene, { jellies: 4, shark: true });

// ---------------------------------------------------------------------------
// Game state + interface used by the UI
// ---------------------------------------------------------------------------
const SAVE_KEY = "otterVillage.cosmetics.v1";
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
    return {
      pearls: s.pearls ?? 0,
      ownedSkins: s.ownedSkins ?? ["classic"],
      ownedHats: s.ownedHats ?? ["none"],
      skin: s.skin ?? "classic",
      hat: s.hat ?? "none",
    };
  } catch { return { pearls: 0, ownedSkins: ["classic"], ownedHats: ["none"], skin: "classic", hat: "none" }; }
}
const saved = loadSave();
function persist() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      pearls: game.pearls,
      ownedSkins: game.cosmetics.ownedSkins,
      ownedHats: game.cosmetics.ownedHats,
      skin: game.cosmetics.skin,
      hat: game.cosmetics.hat,
    }));
  } catch {}
}

const game = {
  inventory: { wood: 0, reed: 0, shell: 0, berry: 0, fish: 0, ore: 0 },
  pouch: { wood: 0, reed: 0, shell: 0, berry: 0, fish: 0, ore: 0 },
  carry: { level: 1, step: 6, capacity: 12 },
  villagePop: 0,
  pearls: saved.pearls,
  cosmetics: { ownedSkins: saved.ownedSkins, ownedHats: saved.ownedHats, skin: saved.skin, hat: saved.hat },
  village, villagers, pets,

  addPearls(n) { game.pearls += n; ui.syncStats(); ui.bumpPearls(); persist(); },
  // buy if not owned, otherwise equip
  selectSkin(id) {
    const s = getSkin(id);
    if (!game.cosmetics.ownedSkins.includes(id)) {
      if (game.pearls < s.price) { ui.toast(`Need 🦪 ${s.price} pearls`); return; }
      game.pearls -= s.price; game.cosmetics.ownedSkins.push(id);
      ui.toast(`Unlocked ${s.name}!`);
    }
    game.cosmetics.skin = id;
    otter.setFur(s.fur, s.belly);
    ui.syncStats(); ui.refreshSheet(); persist();
  },
  selectHat(id) {
    const h = getHat(id);
    if (!game.cosmetics.ownedHats.includes(id)) {
      if (game.pearls < h.price) { ui.toast(`Need 🦪 ${h.price} pearls`); return; }
      game.pearls -= h.price; game.cosmetics.ownedHats.push(id);
      ui.toast(`Unlocked ${h.name}!`);
    }
    game.cosmetics.hat = id;
    otter.setHat(buildHatMesh(id));
    ui.syncStats(); ui.refreshSheet(); persist();
  },

  pouchUsed: () => Object.values(game.pouch).reduce((a, b) => a + b, 0),
  canAfford: (cost) => Object.entries(cost).every(([r, n]) => game.inventory[r] >= n),
  pay: (cost) => { for (const [r, n] of Object.entries(cost)) game.inventory[r] -= n; },

  carryUpgradeCost: () => ({ wood: 4 + game.carry.level * 2, reed: 2 + game.carry.level }),
  upgradeCarry() {
    const cost = game.carryUpgradeCost();
    if (!game.canAfford(cost)) { ui.toast("Not enough materials"); return; }
    game.pay(cost);
    game.carry.level++;
    game.carry.capacity += game.carry.step;
    ui.toast(`🎒 Pouch upgraded to ${game.carry.capacity}!`);
    ui.syncInventory(); ui.syncPouch(); ui.refreshSheet();
  },

  tryBuild(index, def) {
    if (!game.canAfford(def.cost)) { ui.toast("Not enough materials yet 🥺"); return; }
    game.pay(def.cost);
    village.buildOnPlot(index, def);
    applyBuildingGains(def);
    makeSplash(village.plots[index].position.clone().setY(0.4), 0xfff0c0, 8);
    ui.toast(`${def.emoji} ${def.name} built!`);
    ui.hidePlotPopup();
    ui.syncInventory(); ui.syncStats();
    checkMilestone();
  },
  tryUpgrade(index) {
    const b = village.plots[index].building;
    if (!b) return;
    const cost = upgradeCost(b.def, b.level);
    if (!game.canAfford(cost)) { ui.toast("Not enough to upgrade"); return; }
    game.pay(cost);
    village.upgradePlot(index);
    applyBuildingGains(b.def);
    makeSplash(village.plots[index].position.clone().setY(0.6), 0xfff0c0, 10);
    ui.toast(`${b.def.emoji} upgraded to ★${b.level}!`);
    ui.syncInventory(); ui.syncStats();
    ui.showPlotPopup(index); // refresh popup
    checkMilestone();
  },

  adoptPet(key) {
    const def = PET_TYPES[key];
    if (game.pets.hasType(key)) return;
    if (!game.canAfford(def.cost)) { ui.toast("Not enough to adopt 🥺"); return; }
    game.pay(def.cost);
    pets.adopt(key);
    applyPetBonuses();
    ui.toast(`${def.emoji} ${def.name} joined the village!`);
    ui.syncInventory(); ui.refreshSheet();
  },
};

function applyBuildingGains(def) {
  game.villagePop += def.pop;
  for (let i = 0; i < def.villagers; i++) villagers.addVillager();
}

// pet bonus tuning
let collectRadius = 1.5;
let otterSpeedMult = 1;
function applyPetBonuses() {
  resources.setSpawnRate(pets.has("spawn") ? 1.7 : 0.9);
  collectRadius = pets.has("reach") ? 2.4 : 1.5;
  otterSpeedMult = pets.has("speed") ? 1.4 : 1;
}

const ui = createUI(game);
ui.syncInventory(); ui.syncStats(); ui.syncPouch();

// apply saved cosmetics to the otter
{
  const s = getSkin(game.cosmetics.skin);
  otter.setFur(s.fur, s.belly);
  otter.setHat(buildHatMesh(game.cosmetics.hat));
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------
let lastMilestone = 0;
function checkMilestone() {
  const tiers = [
    { pop: 6, msg: "Your village is growing! 🦦🏡" },
    { pop: 14, msg: "A bustling little hamlet! 🎉" },
    { pop: 28, msg: "Otter Town, population: adorable 💛" },
    { pop: 50, msg: "A grand Otter City! 👑" },
  ];
  for (const t of tiers) if (game.villagePop >= t.pop && lastMilestone < t.pop) { lastMilestone = t.pop; ui.toast(t.msg); }
}

// ---------------------------------------------------------------------------
// Splash particles
// ---------------------------------------------------------------------------
const splashes = [];
const dropGeo = new THREE.SphereGeometry(0.08, 6, 5);
function makeSplash(pos, color, count = 5) {
  const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.3, 18).rotateX(-Math.PI / 2), ringMat);
  ring.position.copy(pos); ring.position.y = Math.max(0.12, pos.y);
  scene.add(ring);
  splashes.push({ mesh: ring, life: 0, max: 0.6, kind: "ring" });
  for (let i = 0; i < count; i++) {
    const drop = new THREE.Mesh(dropGeo, new THREE.MeshBasicMaterial({ color, transparent: true }));
    drop.position.copy(ring.position);
    const a = Math.random() * Math.PI * 2;
    drop.userData.vel = new THREE.Vector3(Math.cos(a) * 1.6, 2.4 + Math.random() * 1.5, Math.sin(a) * 1.6);
    scene.add(drop);
    splashes.push({ mesh: drop, life: 0, max: 0.7, kind: "drop" });
  }
}
function updateSplashes(dt) {
  for (let i = splashes.length - 1; i >= 0; i--) {
    const s = splashes[i];
    s.life += dt;
    const k = s.life / s.max;
    if (s.kind === "ring") {
      const sc = 1 + k * 3;
      s.mesh.scale.set(sc, sc, sc);
      s.mesh.material.opacity = 0.8 * (1 - k);
    } else {
      s.mesh.position.addScaledVector(s.mesh.userData.vel, dt);
      s.mesh.userData.vel.y -= 9 * dt;
      s.mesh.material.opacity = 1 - k;
    }
    if (s.life >= s.max) {
      scene.remove(s.mesh);
      if (s.kind === "drop") s.mesh.material.dispose();
      else { s.mesh.geometry.dispose(); s.mesh.material.dispose(); }
      splashes.splice(i, 1);
    }
  }
}

// ---------------------------------------------------------------------------
// Pearls (premium currency) — floating pickups that drift to the otter
// ---------------------------------------------------------------------------
const pearlItems = [];
const pearlGeo = new THREE.SphereGeometry(0.22, 16, 12);
const pearlMat = new THREE.MeshStandardMaterial({ color: 0xfff2f8, roughness: 0.12, metalness: 0.25, emissive: 0xffd2ea, emissiveIntensity: 0.4 });
function spawnPearl(pos) {
  const m = new THREE.Mesh(pearlGeo, pearlMat);
  m.position.copy(pos); m.position.y = 0.35;
  m.castShadow = true;
  scene.add(m);
  pearlItems.push({ mesh: m, bob: Math.random() * 6 });
}
function updatePearls(dt, t) {
  const op = otter.group.position;
  for (let i = pearlItems.length - 1; i >= 0; i--) {
    const pr = pearlItems[i]; const p = pr.mesh.position;
    pr.bob += dt;
    p.y = 0.35 + Math.sin(t * 3 + pr.bob) * 0.1;
    pr.mesh.rotation.y += dt * 2;
    const dx = p.x - op.x, dz = p.z - op.z, d = Math.hypot(dx, dz);
    if (d < 3.2) { p.x -= (dx / d) * dt * 3.5; p.z -= (dz / d) * dt * 3.5; } // magnet
    if (d < 1.0) {
      game.addPearls(1);
      makeSplash(p.clone(), 0xffd2ea, 5);
      scene.remove(pr.mesh); pearlItems.splice(i, 1);
    }
  }
}

// ---------------------------------------------------------------------------
// Treasure chest + whirlpool
// ---------------------------------------------------------------------------
let chestReady = true, chestCooldown = 0;
function updateChest(dt) {
  if (!chestReady) {
    chestCooldown -= dt;
    if (chestCooldown <= 0) { chestReady = true; world.chestLid.rotation.x = 0; }
    return;
  }
  if (otter.group.position.distanceTo(world.chestPos) < 2.6) {
    chestReady = false; chestCooldown = 25;
    world.chestLid.rotation.x = -1.0; // pop open
    const n = 4 + ((Math.random() * 4) | 0);
    for (let i = 0; i < n; i++) {
      const off = new THREE.Vector3((Math.random() - 0.5) * 2.2, 0, (Math.random() - 0.5) * 2.2);
      spawnPearl(world.chestPos.clone().add(off));
    }
    makeSplash(world.chestPos.clone().setY(0.6), 0xffd23c, 10);
    ui.toast("🦪 Treasure chest! Pearls spilled out!");
  }
}

let whirlT = 6;
function updateWhirlpool(dt) {
  whirlT -= dt;
  if (whirlT <= 0) {
    whirlT = 9 + Math.random() * 6;
    const off = new THREE.Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2);
    spawnPearl(world.whirlpoolPos.clone().add(off));
  }
  if (otter.group.position.distanceTo(world.whirlpoolPos) < 2.2) {
    spinExtra = Math.max(spinExtra, Math.PI * 1.5); // dizzy spin
  }
}

// ---------------------------------------------------------------------------
// Hazards (jellyfish stun, shark scare)
// ---------------------------------------------------------------------------
let stunTimer = 0;
function handleHazards(dt, t) {
  const ev = hazards.update(dt, t, otter.group.position);
  for (const e of ev) {
    if (e.type === "stun") {
      stunTimer = 1.0; ui.flash();
      makeSplash(e.pos.clone(), 0xff9ad6, 6);
      ui.toast("⚡ Zap! A jellyfish stunned you!");
    } else if (e.type === "scare") {
      ui.flash();
      let lost = 0;
      for (const r of Object.keys(game.pouch)) {
        if (lost >= 3) break;
        const take = Math.min(game.pouch[r], 3 - lost);
        game.pouch[r] -= take; lost += take;
      }
      ui.syncPouch();
      const dx = otter.group.position.x - e.pos.x, dz = otter.group.position.z - e.pos.z, d = Math.hypot(dx, dz) || 1;
      otterVel.x += (dx / d) * 11; otterVel.z += (dz / d) * 11; // knockback
      ui.toast(lost > 0 ? `🦈 Shark! You dropped ${lost} items!` : "🦈 Shark! Swim away!");
    }
  }
}

// ---------------------------------------------------------------------------
// Input — drag joystick + keyboard, plus tap-to-open-plot
// ---------------------------------------------------------------------------
const move = new THREE.Vector2(0, 0);
const keys = new Set();
let joyActive = false, joyId = null;
const joyStart = new THREE.Vector2();
const joystickEl = document.getElementById("joystick");
const joyKnob = document.getElementById("joystick-knob");
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function plotAtScreen(x, y) {
  ndc.x = (x / window.innerWidth) * 2 - 1;
  ndc.y = -(y / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(village.plotMeshes, false);
  return hits.length ? hits[0].object.userData.plotIndex : null;
}

renderer.domElement.addEventListener("pointerdown", (e) => {
  // tapping a plot opens its build/upgrade popup
  const plot = plotAtScreen(e.clientX, e.clientY);
  if (plot !== null) { ui.showPlotPopup(plot); return; }
  if (ui.isPopupOpen()) return;
  if (joyActive) return;
  joyActive = true; joyId = e.pointerId;
  joyStart.set(e.clientX, e.clientY);
  joystickEl.style.left = e.clientX - 60 + "px";
  joystickEl.style.top = e.clientY - 60 + "px";
  joystickEl.classList.remove("hidden");
  joyKnob.style.transform = "translate(-50%, -50%)";
});
window.addEventListener("pointermove", (e) => {
  if (!joyActive || e.pointerId !== joyId) return;
  const dx = e.clientX - joyStart.x, dy = e.clientY - joyStart.y;
  const max = 48, len = Math.hypot(dx, dy), clamped = Math.min(len, max);
  const nx = len > 0 ? dx / len : 0, ny = len > 0 ? dy / len : 0;
  move.set(nx * (clamped / max), ny * (clamped / max));
  joyKnob.style.transform = `translate(calc(-50% + ${nx * clamped}px), calc(-50% + ${ny * clamped}px))`;
});
function endJoy(e) {
  if (e && e.pointerId !== joyId) return;
  joyActive = false; joyId = null; move.set(0, 0);
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
// Otter movement + gathering + banking
// ---------------------------------------------------------------------------
const otterVel = new THREE.Vector3();
const BASE_SPEED = 7.2;
let spinExtra = 0;       // happy spin on banking
let pouchToastT = 0;
let wakeTimer = 0;       // trailing ripple cadence

function updateOtter(dt, t) {
  if (stunTimer > 0) stunTimer -= dt;
  const stunned = stunTimer > 0;
  const k = keyboardDir();
  let dirX = stunned ? 0 : move.x + k.x, dirZ = stunned ? 0 : move.y + k.y;
  const len = Math.hypot(dirX, dirZ);
  if (len > 1) { dirX /= len; dirZ /= len; }
  const speedCap = BASE_SPEED * otterSpeedMult;
  otterVel.x += (dirX * speedCap - otterVel.x) * Math.min(1, dt * 6);
  otterVel.z += (dirZ * speedCap - otterVel.z) * Math.min(1, dt * 6);

  const g = otter.group;
  g.position.x += otterVel.x * dt;
  g.position.z += otterVel.z * dt;

  const distC = Math.hypot(g.position.x, g.position.z);
  const inner = ISLAND_RADIUS + 0.9, outer = POND_RADIUS - 0.8;
  if (distC < inner) {
    const nx = g.position.x / (distC || 1), nz = g.position.z / (distC || 1);
    g.position.x = nx * inner; g.position.z = nz * inner;
    otterVel.x *= 0.3; otterVel.z *= 0.3;
  } else if (distC > outer) {
    const nx = g.position.x / distC, nz = g.position.z / distC;
    g.position.x = nx * outer; g.position.z = nz * outer;
    otterVel.x *= 0.3; otterVel.z *= 0.3;
  }

  const speed = Math.hypot(otterVel.x, otterVel.z);

  // trailing wake ripples while paddling
  wakeTimer -= dt;
  if (speed > 3 && wakeTimer <= 0) {
    wakeTimer = 0.16;
    const bx = g.position.x - (otterVel.x / speed) * 0.9;
    const bz = g.position.z - (otterVel.z / speed) * 0.9;
    makeSplash(new THREE.Vector3(bx, 0.12, bz), 0xeafdff, 0);
  }

  if (speed > 0.2 && spinExtra <= 0) {
    const targetRot = Math.atan2(-otterVel.z, otterVel.x);
    let d = targetRot - g.rotation.y;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    g.rotation.y += d * Math.min(1, dt * 8);
    g.rotation.z = THREE.MathUtils.clamp(-d * 0.5, -0.3, 0.3);
  } else {
    g.rotation.z *= 0.9;
  }
  if (spinExtra > 0) { g.rotation.y += dt * 14; spinExtra -= dt * 14; }

  otter.update(dt, t, Math.min(1, speed / BASE_SPEED));

  // banking: near the island shore, deposit the whole pouch
  if (distC < ISLAND_RADIUS + 2.3 && game.pouchUsed() > 0) {
    let total = 0;
    for (const r of Object.keys(game.pouch)) { game.inventory[r] += game.pouch[r]; total += game.pouch[r]; game.pouch[r] = 0; }
    ui.syncInventory(); ui.syncPouch();
    ui.toast(`🎒 Banked +${total}!`);
    makeSplash(g.position.clone(), 0xfff0c0, 6);
    spinExtra = Math.PI * 2;
  }

  if (pouchToastT > 0) pouchToastT -= dt;
}

function collectNearby() {
  if (game.pouchUsed() >= game.carry.capacity) {
    if (pouchToastT <= 0) { ui.toast("🎒 Pouch full — bank near the island!"); pouchToastT = 4; }
    return;
  }
  const op = otter.group.position;
  const r2 = collectRadius * collectRadius;
  for (let i = resources.items.length - 1; i >= 0; i--) {
    const it = resources.items[i];
    const dx = it.mesh.position.x - op.x, dz = it.mesh.position.z - op.z;
    if (dx * dx + dz * dz < r2) {
      game.pouch[it.type] += 1;
      ui.syncPouch();
      makeSplash(it.mesh.position.clone(), RESOURCE_TYPES[it.type].color, 4);
      resources.remove(it);
      if (game.pouchUsed() >= game.carry.capacity) break;
    }
  }
}

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------
const camOffset = new THREE.Vector3(0, 20, 15);
const camTarget = new THREE.Vector3();
const tmpTarget = new THREE.Vector3();
function updateCamera(dt) {
  const p = otter.group.position;
  const desired = new THREE.Vector3(p.x + camOffset.x, camOffset.y, p.z + camOffset.z);
  camera.position.lerp(desired, Math.min(1, dt * 3));
  // bias the look target a little toward the island centre so the village
  // stays nicely framed while paddling around the pond.
  tmpTarget.set(p.x * 0.7, 1.5, p.z * 0.7);
  camTarget.lerp(tmpTarget, Math.min(1, dt * 4));
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
  villagers.update(dt, t);
  pets.update(dt, t);
  updateOtter(dt, t);
  collectNearby();
  handleHazards(dt, t);
  updatePearls(dt, t);
  updateChest(dt);
  updateWhirlpool(dt);
  updateSplashes(dt);
  updateCamera(dt);
  postfx.render();
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  postfx.setSize(window.innerWidth, window.innerHeight);
});

otter.group.position.set(0, 0, ISLAND_RADIUS + 5);
camera.position.set(camOffset.x, camOffset.y, ISLAND_RADIUS + 5 + camOffset.z);
camera.lookAt(0, 1.5, (ISLAND_RADIUS + 5) * 0.7);
postfx.render();
document.getElementById("loader").classList.add("hidden");

// Dev aid: ?debug grants resources and exposes the game state for testing.
if (location.search.includes("debug")) {
  for (const k of Object.keys(game.inventory)) game.inventory[k] = 99;
  game.pearls = 200;
  window.__game = game;
  window.__build = (index, id) => game.tryBuild(index, getBuilding(id));
  window.__upgrade = (index) => game.tryUpgrade(index);
  window.__pearl = (x, z) => spawnPearl(new THREE.Vector3(x || 0, 0, z || 12));
  ui.syncInventory(); ui.syncStats();
}

document.getElementById("start-btn").addEventListener("click", () => {
  document.getElementById("intro").classList.add("hidden");
  document.getElementById("hud").classList.remove("hidden");
  ui.setHint("Tap a glowing ＋ plot to build your first hut!");
  setTimeout(() => ui.setHint(null), 6000);
  running = true;
  clock.start();
  tick();
});
