import { BUILDINGS, upgradeCost, MAX_LEVEL } from "./village.js";
import { PET_TYPES } from "./pets.js";
import { JOBS, ASSIGNABLE_JOBS } from "./villagers.js";
import { RESOURCE_TYPES } from "./resources.js";
import { SKINS, HATS } from "./cosmetics.js";

export function createUI(game) {
  const $ = (id) => document.getElementById(id);
  const counts = {
    wood: $("count-wood"), reed: $("count-reed"), shell: $("count-shell"),
    berry: $("count-berry"), fish: $("count-fish"), ore: $("count-ore"),
  };
  const villageCount = $("village-count");
  const otterCount = $("otter-count");
  const pearlCount = $("pearl-count");
  const styleBalance = $("style-balance");
  const skinList = $("skin-list");
  const hatList = $("hat-list");
  const hitFlash = $("hit-flash");
  const pouchFill = $("pouch-fill");
  const pouchText = $("pouch-text");
  const sheet = $("sheet");
  const sheetToggle = $("sheet-toggle");
  const sheetClose = $("sheet-close");
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const panels = { otters: $("tab-otters"), pets: $("tab-pets"), style: $("tab-style") };
  const otterSummary = $("otter-summary");
  const carryUpgrade = $("carry-upgrade");
  const jobList = $("job-list");
  const petList = $("pet-list");
  const popup = $("plot-popup");
  const popupTitle = $("popup-title");
  const popupContent = $("popup-content");
  const popupClose = $("popup-close");
  const hintBanner = $("hint-banner");
  const toastEl = $("toast");

  let currentTab = "otters";
  let openPlotIndex = null;

  // ---------- cost rendering ----------
  function costHtml(cost) {
    return Object.entries(cost)
      .map(([res, n]) => {
        const cls = game.inventory[res] >= n ? "afford" : "short";
        return `<span class="${cls}">${RESOURCE_TYPES[res].emoji}${n}</span>`;
      })
      .join(" ");
  }

  // ---------- HUD numbers ----------
  function syncInventory(bumpRes) {
    for (const key of Object.keys(counts)) counts[key].textContent = game.inventory[key];
    if (bumpRes) {
      const el = document.querySelector(`.res[data-res="${bumpRes}"]`);
      if (el) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
    }
    if (!sheet.classList.contains("closed")) refreshSheet();
    if (openPlotIndex !== null) renderPopup(openPlotIndex);
  }
  function syncStats() {
    villageCount.textContent = game.villagePop;
    otterCount.textContent = game.villagers.count();
    pearlCount.textContent = game.pearls;
    if (currentTab === "style" && !sheet.classList.contains("closed")) renderStyleTab();
  }
  function bumpPearls() {
    const el = pearlCount.parentElement;
    el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
  }
  function syncPouch() {
    const used = game.pouchUsed();
    const cap = game.carry.capacity;
    pouchFill.style.width = Math.min(100, (used / cap) * 100) + "%";
    pouchFill.classList.toggle("full", used >= cap);
    pouchText.textContent = `${used}/${cap}`;
  }

  // ---------- sheet + tabs ----------
  function openSheet(tab) {
    if (tab) switchTab(tab);
    refreshSheet();
    sheet.classList.remove("closed");
  }
  function closeSheet() { sheet.classList.add("closed"); }
  function switchTab(tab) {
    currentTab = tab;
    tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
    for (const [k, el] of Object.entries(panels)) el.classList.toggle("hidden", k !== tab);
  }
  sheetToggle.addEventListener("click", () =>
    sheet.classList.contains("closed") ? openSheet() : closeSheet());
  sheetClose.addEventListener("click", closeSheet);
  tabs.forEach((t) => t.addEventListener("click", () => { switchTab(t.dataset.tab); refreshSheet(); }));

  function refreshSheet() {
    if (currentTab === "otters") { renderOtterTab(); }
    else if (currentTab === "pets") { renderPetTab(); }
    else if (currentTab === "style") { renderStyleTab(); }
  }

  // ---------- Style (cosmetics) tab ----------
  function renderStyleTab() {
    styleBalance.innerHTML = `<div class="balance"><span class="ico">🦪</span> <b>${game.pearls}</b> pearls</div>`;
    skinList.innerHTML = "";
    for (const s of SKINS) {
      const owned = game.cosmetics.ownedSkins.includes(s.id);
      const equipped = game.cosmetics.skin === s.id;
      const afford = game.pearls >= s.price;
      const swatch = "#" + s.fur.toString(16).padStart(6, "0");
      const card = document.createElement("div");
      card.className = "cos-card" + (equipped ? " equipped" : "") + (!owned && !afford ? " locked" : "");
      card.innerHTML = `
        <div class="cos-swatch" style="background:${swatch}"></div>
        <div class="cos-name">${s.name}</div>
        <div class="cos-tag">${equipped ? "Equipped" : owned ? "Tap to wear" : `🦪 ${s.price}`}</div>`;
      card.addEventListener("click", () => game.selectSkin(s.id));
      skinList.appendChild(card);
    }
    hatList.innerHTML = "";
    for (const h of HATS) {
      const owned = game.cosmetics.ownedHats.includes(h.id);
      const equipped = game.cosmetics.hat === h.id;
      const afford = game.pearls >= h.price;
      const card = document.createElement("div");
      card.className = "cos-card" + (equipped ? " equipped" : "") + (!owned && !afford ? " locked" : "");
      card.innerHTML = `
        <div class="cos-emoji">${h.emoji}</div>
        <div class="cos-name">${h.name}</div>
        <div class="cos-tag">${equipped ? "Equipped" : owned ? "Tap to wear" : `🦪 ${h.price}`}</div>`;
      card.addEventListener("click", () => game.selectHat(h.id));
      hatList.appendChild(card);
    }
  }

  // ---------- Otters tab ----------
  function renderOtterTab() {
    const c = game.villagers.getCounts();
    const total = game.villagers.count();
    otterSummary.innerHTML = total === 0
      ? `<div class="empty-note">Build an 🛖 Otter Hut on a plot to welcome villagers!</div>`
      : `<div class="otter-tally"><b>${total}</b> otters · <b>${c.idle}</b> idle 💤</div>`;

    // carry capacity upgrade
    const cost = game.carryUpgradeCost();
    const afford = game.canAfford(cost);
    carryUpgrade.innerHTML = `
      <div class="upgrade-row">
        <div><span class="ico">🎒</span> <b>Pouch</b> · capacity ${game.carry.capacity}
          <div class="sub">Carry more treasures before banking.</div></div>
        <button class="mini-btn ${afford ? "" : "disabled"}" data-act="carry">+${game.carry.step} ${costHtml(cost)}</button>
      </div>`;
    const carryBtn = carryUpgrade.querySelector('[data-act="carry"]');
    carryBtn.addEventListener("click", () => game.upgradeCarry());

    jobList.innerHTML = "";
    for (const jobKey of ASSIGNABLE_JOBS) {
      const job = JOBS[jobKey];
      const n = c[jobKey];
      const perMin = job.interval ? Math.round((60 / job.interval) * n) : 0;
      const row = document.createElement("div");
      row.className = "job-row";
      row.innerHTML = `
        <span class="job-emoji">${job.emoji}</span>
        <div class="job-info">
          <div class="job-name">${job.name}</div>
          <div class="job-rate">${RESOURCE_TYPES[job.resource].emoji} ${perMin}/min</div>
        </div>
        <div class="job-controls">
          <button class="mini-btn round" data-job="${jobKey}" data-d="-1">−</button>
          <span class="job-count">${n}</span>
          <button class="mini-btn round" data-job="${jobKey}" data-d="1">+</button>
        </div>`;
      jobList.appendChild(row);
    }
    jobList.querySelectorAll("[data-job]").forEach((b) => {
      b.addEventListener("click", () => {
        const ok = game.villagers.changeJob(b.dataset.job, +b.dataset.d);
        if (!ok && +b.dataset.d > 0) toast("No idle otters — build more homes!");
        renderOtterTab();
      });
    });
  }

  // ---------- Pets tab ----------
  function renderPetTab() {
    petList.innerHTML = "";
    for (const [key, def] of Object.entries(PET_TYPES)) {
      const owned = game.pets.hasType(key);
      const afford = game.canAfford(def.cost);
      const card = document.createElement("div");
      card.className = "pet-card" + (owned ? " owned" : afford ? "" : " locked");
      card.innerHTML = `
        <span class="pet-emoji">${def.emoji}</span>
        <div class="pet-info">
          <div class="pet-name">${def.name} ${owned ? "✓" : ""}</div>
          <div class="pet-desc">${def.desc}</div>
          ${owned ? `<div class="pet-owned">Adopted</div>` : `<div class="pet-cost">${costHtml(def.cost)}</div>`}
        </div>`;
      if (!owned) card.addEventListener("click", () => game.adoptPet(key));
      petList.appendChild(card);
    }
  }

  // ---------- Plot popup ----------
  function renderPopup(index) {
    const plot = game.village.plots[index];
    if (!plot.building) {
      popupTitle.textContent = "Build here 🔨";
      popupContent.innerHTML = "";
      const grid = document.createElement("div");
      grid.className = "build-grid";
      for (const def of BUILDINGS) {
        const afford = game.canAfford(def.cost);
        const card = document.createElement("div");
        card.className = "build-card" + (afford ? "" : " locked");
        card.innerHTML = `
          <div class="bc-top"><span class="bc-emoji">${def.emoji}</span><span class="bc-name">${def.name}</span></div>
          <div class="bc-desc">${def.desc}</div>
          <div class="bc-cost">${costHtml(def.cost)}</div>`;
        card.addEventListener("click", () => game.tryBuild(index, def));
        grid.appendChild(card);
      }
      popupContent.appendChild(grid);
    } else {
      const b = plot.building;
      popupTitle.textContent = `${b.def.emoji} ${b.def.name}`;
      const maxed = b.level >= MAX_LEVEL;
      const cost = upgradeCost(b.def, b.level);
      const afford = game.canAfford(cost);
      popupContent.innerHTML = `
        <div class="bldg-info">
          <div class="level-pips">${"★".repeat(b.level)}${"☆".repeat(MAX_LEVEL - b.level)}</div>
          <div class="bldg-stats">
            ${b.def.villagers ? `🦦 +${b.def.villagers} otters/level` : ""}
            ${b.def.pop ? ` · 🏡 +${b.def.pop}/level` : ""}
          </div>
        </div>
        ${maxed
          ? `<div class="maxed">Fully upgraded! ★★★</div>`
          : `<button class="big-btn ${afford ? "" : "disabled"}" data-act="upgrade">
               Upgrade to ★${b.level + 1} &nbsp; ${costHtml(cost)}</button>`}`;
      const up = popupContent.querySelector('[data-act="upgrade"]');
      if (up) up.addEventListener("click", () => game.tryUpgrade(index));
    }
  }
  function showPlotPopup(index) {
    openPlotIndex = index;
    renderPopup(index);
    popup.classList.remove("hidden");
  }
  function hidePlotPopup() { openPlotIndex = null; popup.classList.add("hidden"); }
  popupClose.addEventListener("click", hidePlotPopup);
  popup.addEventListener("click", (e) => { if (e.target === popup) hidePlotPopup(); });

  // ---------- toast + hint ----------
  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast-msg";
    el.textContent = msg;
    toastEl.appendChild(el);
    setTimeout(() => el.remove(), 2100);
  }
  function setHint(msg) {
    if (!msg) { hintBanner.classList.add("hidden"); return; }
    hintBanner.textContent = msg;
    hintBanner.classList.remove("hidden");
  }
  function flash() {
    hitFlash.classList.remove("show"); void hitFlash.offsetWidth; hitFlash.classList.add("show");
  }

  return {
    syncInventory, syncStats, syncPouch, refreshSheet, bumpPearls, flash,
    showPlotPopup, hidePlotPopup, isPopupOpen: () => openPlotIndex !== null,
    openSheet, closeSheet, toast, setHint,
  };
}
