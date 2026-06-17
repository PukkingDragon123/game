import { BUILDINGS } from "./village.js";
import { RESOURCE_TYPES } from "./resources.js";

// Wires the DOM HUD to the game state. `game` exposes the inventory and a
// requestPlacement(buildingDef) callback used when a build card is tapped.
export function createUI(game) {
  const counts = {
    wood: document.getElementById("count-wood"),
    reed: document.getElementById("count-reed"),
    shell: document.getElementById("count-shell"),
    berry: document.getElementById("count-berry"),
  };
  const villageCount = document.getElementById("village-count");
  const buildMenu = document.getElementById("build-menu");
  const buildList = document.getElementById("build-list");
  const buildToggle = document.getElementById("build-toggle");
  const buildClose = document.getElementById("build-close");
  const placeBanner = document.getElementById("place-banner");
  const placeText = document.getElementById("place-text");
  const placeCancel = document.getElementById("place-cancel");
  const toastEl = document.getElementById("toast");

  // ---- Build cards ----
  function renderBuildCards() {
    buildList.innerHTML = "";
    for (const b of BUILDINGS) {
      const affordable = canAfford(b.cost);
      const card = document.createElement("div");
      card.className = "build-card" + (affordable ? "" : " locked");
      const costHtml = Object.entries(b.cost)
        .map(([res, n]) => {
          const have = game.inventory[res];
          const cls = have >= n ? "afford" : "short";
          return `<span class="${cls}">${RESOURCE_TYPES[res].emoji}${n}</span>`;
        })
        .join("");
      card.innerHTML = `
        <div class="bc-top">
          <span class="bc-emoji">${b.emoji}</span>
          <span class="bc-name">${b.name}</span>
        </div>
        <div class="bc-desc">${b.desc}</div>
        <div class="bc-cost">${costHtml}</div>`;
      card.addEventListener("click", () => {
        if (!canAfford(b.cost)) {
          toast("Not enough materials yet 🥺");
          return;
        }
        closeBuildMenu();
        game.requestPlacement(b);
      });
      buildList.appendChild(card);
    }
  }

  function canAfford(cost) {
    return Object.entries(cost).every(([res, n]) => game.inventory[res] >= n);
  }

  // ---- Menu open/close ----
  function openBuildMenu() {
    renderBuildCards();
    buildMenu.classList.remove("closed");
  }
  function closeBuildMenu() {
    buildMenu.classList.add("closed");
  }
  buildToggle.addEventListener("click", () => {
    if (buildMenu.classList.contains("closed")) openBuildMenu();
    else closeBuildMenu();
  });
  buildClose.addEventListener("click", closeBuildMenu);

  // ---- Placement banner ----
  placeCancel.addEventListener("click", () => game.cancelPlacement());

  // ---- Public update of numbers ----
  function syncInventory(bumpRes) {
    for (const key of Object.keys(counts)) {
      counts[key].textContent = game.inventory[key];
    }
    if (bumpRes) {
      const el = document.querySelector(`.res[data-res="${bumpRes}"]`);
      if (el) {
        el.classList.remove("bump");
        void el.offsetWidth; // restart animation
        el.classList.add("bump");
      }
    }
    if (!buildMenu.classList.contains("closed")) renderBuildCards();
  }

  function syncVillage(pop) {
    villageCount.textContent = pop;
  }

  function showPlacement(def) {
    placeText.textContent = `Tap the island to place ${def.emoji} ${def.name}`;
    placeBanner.classList.remove("hidden");
  }
  function hidePlacement() {
    placeBanner.classList.add("hidden");
  }

  let toastTimer = null;
  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast-msg";
    el.textContent = msg;
    toastEl.appendChild(el);
    setTimeout(() => el.remove(), 2100);
  }

  return { syncInventory, syncVillage, showPlacement, hidePlacement, toast, closeBuildMenu };
}
