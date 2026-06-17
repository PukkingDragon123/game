import * as THREE from "three";
import { buildOtterMesh } from "./otter.js";
import { POND_RADIUS, ISLAND_RADIUS, ISLAND_TOP_Y } from "./world.js";

// Job definitions. `domain` decides whether the worker roams the water or the
// island. `interval` is seconds per produced unit.
export const JOBS = {
  idle:   { name: "Idle",     emoji: "💤", color: 0xb8c4cc, domain: "land",  resource: null,   interval: 0 },
  gather: { name: "Gatherer", emoji: "🧺", color: 0x9b6a3c, domain: "water", resource: "wood", interval: 6, cycle: ["wood","reed","shell"] },
  fish:   { name: "Fisher",   emoji: "🎣", color: 0x6fc3d6, domain: "water", resource: "fish", interval: 8 },
  mine:   { name: "Miner",    emoji: "⛏️", color: 0x8a8f99, domain: "water", resource: "ore",  interval: 11 },
  farm:   { name: "Farmer",   emoji: "🧑‍🌾", color: 0x66c25a, domain: "land",  resource: "berry", interval: 7 },
};

export const ASSIGNABLE_JOBS = ["gather", "fish", "mine", "farm"];

const FUR_PALETTES = [
  { fur: 0xa9764c, belly: 0xe0c197 },
  { fur: 0x8a5e3b, belly: 0xcda97f },
  { fur: 0xb98a5a, belly: 0xead2ad },
  { fur: 0x6e4a2f, belly: 0xc6a079 },
];

function makeEmojiSprite(emoji) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.font = "92px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, size / 2, size / 2 + 6);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.7, 0.7, 0.7);
  return sprite;
}

export function createVillagers(scene, opts = {}) {
  const onProduce = opts.onProduce || (() => {});
  const villagers = [];

  function randomTargetIn(domain) {
    if (domain === "land") {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * (ISLAND_RADIUS - 1.5);
      return new THREE.Vector3(Math.cos(a) * r, ISLAND_TOP_Y, Math.sin(a) * r);
    }
    const a = Math.random() * Math.PI * 2;
    const r = ISLAND_RADIUS + 2 + Math.random() * (POND_RADIUS - ISLAND_RADIUS - 4);
    return new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
  }

  function addVillager() {
    const palette = FUR_PALETTES[(Math.random() * FUR_PALETTES.length) | 0];
    const { group, tail, paws, head } = buildOtterMesh(palette);
    group.scale.setScalar(0.42);

    const badge = makeEmojiSprite(JOBS.idle.emoji);
    badge.position.set(0, 2.4, 0);
    group.add(badge);

    const v = {
      group, tail, paws, head, badge,
      job: "idle",
      pos: randomTargetIn("land"),
      target: randomTargetIn("land"),
      workTimer: JOBS.idle.interval,
      paddle: Math.random() * 10,
      cycleIdx: 0,
      bobOffset: Math.random() * Math.PI * 2,
    };
    group.position.copy(v.pos);
    scene.add(group);
    villagers.push(v);
    return v;
  }

  function setJob(v, job) {
    v.job = job;
    v.badge.material.map.dispose();
    const sp = makeEmojiSprite(JOBS[job].emoji);
    v.badge.material.map = sp.material.map;
    v.badge.material.needsUpdate = true;
    v.workTimer = JOBS[job].interval || 4;
    v.target = randomTargetIn(JOBS[job].domain);
  }

  function getCounts() {
    const c = { idle: 0, gather: 0, fish: 0, mine: 0, farm: 0 };
    for (const v of villagers) c[v.job]++;
    return c;
  }

  // move one idle villager into `job` (delta>0) or one of `job` back to idle.
  function changeJob(job, delta) {
    if (delta > 0) {
      const idle = villagers.find((v) => v.job === "idle");
      if (!idle) return false;
      setJob(idle, job);
      return true;
    } else {
      const worker = villagers.find((v) => v.job === job);
      if (!worker) return false;
      setJob(worker, "idle");
      return true;
    }
  }

  return {
    villagers,
    JOBS,
    addVillager,
    getCounts,
    changeJob,
    count: () => villagers.length,
    update(dt, t) {
      for (const v of villagers) {
        const job = JOBS[v.job];
        const g = v.group;

        // wander toward target; pick a new one when close
        const dx = v.target.x - g.position.x;
        const dz = v.target.z - g.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.4) {
          v.target = randomTargetIn(job.domain);
        } else {
          const sp = (job.domain === "water" ? 2.2 : 1.4) * dt;
          g.position.x += (dx / dist) * sp;
          g.position.z += (dz / dist) * sp;
          const targetRot = Math.atan2(-dz, dx);
          let d = targetRot - g.rotation.y;
          while (d > Math.PI) d -= Math.PI * 2;
          while (d < -Math.PI) d += Math.PI * 2;
          g.rotation.y += d * Math.min(1, dt * 6);
        }

        // bobbing + paddling animation
        const moving = dist > 0.4 ? 1 : 0;
        const baseY = job.domain === "water" ? 0.0 : ISLAND_TOP_Y;
        g.position.y = baseY + Math.sin(t * 2.5 + v.bobOffset) * 0.04;
        v.paddle += dt * (4 + moving * 12);
        const swing = Math.sin(v.paddle) * (0.1 + moving * 0.2);
        v.paws[0].position.x = 0.55 + swing;
        v.paws[1].position.x = 0.55 - swing;
        v.tail.rotation.y = Math.sin(t * 2.2 + v.bobOffset) * 0.3;

        // gentle badge bob
        v.badge.position.y = 2.4 + Math.sin(t * 2 + v.bobOffset) * 0.08;

        // production
        if (job.resource) {
          v.workTimer -= dt;
          if (v.workTimer <= 0) {
            v.workTimer += job.interval;
            let res = job.resource;
            if (job.cycle) { res = job.cycle[v.cycleIdx % job.cycle.length]; v.cycleIdx++; }
            onProduce(res, g.position.clone());
          }
        }
      }
    },
  };
}
