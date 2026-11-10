const SAVE_KEY = 'farmGame_v1';
const SAVE_VERSION = 1;

function saveGame(s) { s.version = SAVE_VERSION; localStorage.setItem(SAVE_KEY, JSON.stringify(s)); }
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.version !== SAVE_VERSION || !Array.isArray(s.plots)) return null;
    return s;
  } catch (e) { return null; }
}

function createInitialState() {
  return {
    version: 1, coins: 100, xp: 0, level: 1,
    seeds: { wheat: 5 },
    inventory: {},
    plots: Array(9).fill(null).map(() => ({ crop: null, plantedAt: null })),
    animals: [], factories: [],
    unlockedCrops: ['wheat'],
    unlockedAnimals: ['chicken'],
    unlockedFactories: []
  };
}

let state = null;
function getState() { return state; }
function setState(s) { state = s; }

function addItem(name, qty = 1) { state.inventory[name] = (state.inventory[name] || 0) + qty; }
function removeItem(name, qty = 1) {
  const cur = state.inventory[name] || 0;
  if (cur < qty) return false;
  state.inventory[name] = cur - qty;
  return true;
}
function hasItem(name, qty = 1) { return (state.inventory[name] || 0) >= qty; }

function applyUnlocks(level) {
  for (let l = 1; l <= level; l++) {
    const d = LEVELS[l]; if (!d) continue;
    for (const unlock of d.unlocks) {
      const [type, id] = unlock.split(':');
      if (type === 'crop'    && !state.unlockedCrops.includes(id))     state.unlockedCrops.push(id);
      if (type === 'animal'  && !state.unlockedAnimals.includes(id))   state.unlockedAnimals.push(id);
      if (type === 'factory' && !state.unlockedFactories.includes(id)) state.unlockedFactories.push(id);
    }
  }
}

function addXP(amount) {
  state.xp += amount;
  const newLvl = getLevelFromXp(state.xp);
  if (newLvl > state.level) {
    state.level = newLvl;
    applyUnlocks(newLvl);
    return true;
  }
  return false;
}

// ==== المزرعة ====
function plantSeed(plotIdx, cropId) {
  const plot = state.plots[plotIdx];
  if (!plot || plot.crop) return { msg: 'الأرض مشغولة' };
  if ((state.seeds[cropId] || 0) < 1) return { msg: 'ما عندك بذور' };
  state.seeds[cropId]--;
  plot.crop = cropId; plot.plantedAt = Date.now();
  saveGame(state);
  return { msg: `زرعت ${CROPS[cropId].name} 🌱` };
}

function harvestPlot(idx) {
  const plot = state.plots[idx];
  if (!plot || !plot.crop) return {};
  const crop = CROPS[plot.crop];
  if ((Date.now() - plot.plantedAt) / 1000 < crop.growTime) return { msg: 'لسه ما كمل' };
  addItem(plot.crop, 1);
  plot.crop = null; plot.plantedAt = null;
  const leveled = addXP(crop.xp);
  saveGame(state);
  return { msg: `حصدت ${crop.name} +${crop.xp}XP${leveled ? ' 🎉 مستوى جديد!' : ''}` };
}

function buySeed(cropId) {
  const crop = CROPS[cropId];
  if (!state.unlockedCrops.includes(cropId)) return { msg: 'غير مفتوح' };
  if (state.coins < crop.seedCost) return { msg: 'فلوسك ما تكفي' };
  state.coins -= crop.seedCost;
  state.seeds[cropId] = (state.seeds[cropId] || 0) + 1;
  saveGame(state);
  return { msg: `اشتريت بذرة ${crop.name}` };
}

// ==== الحيوانات ====
function buyAnimal(type) {
  const a = ANIMALS[type];
  if (!state.unlockedAnimals.includes(type)) return { msg: 'غير مفتوح' };
  if (state.coins < a.cost) return { msg: 'فلوسك ما تكفي' };
  state.coins -= a.cost;
  state.animals.push({ type, fedAt: null });
  saveGame(state);
  return { msg: `اشتريت ${a.name} 🎉` };
}

function feedAnimal(idx) {
  const a = state.animals[idx];
  if (!a || a.fedAt) return {};
  const def = ANIMALS[a.type];
  if (!hasItem('feed', def.feedCost)) return { msg: `تحتاج ${def.feedCost} علف` };
  removeItem('feed', def.feedCost);
  a.fedAt = Date.now();
  saveGame(state);
  return { msg: 'أطعمت الحيوان 🍃' };
}

function collectAnimal(idx) {
  const a = state.animals[idx];
  if (!a || !a.fedAt) return {};
  const def = ANIMALS[a.type];
  if ((Date.now() - a.fedAt) / 1000 < def.produceTime) return { msg: 'لسه ما جهز' };
  addItem(def.product, 1);
  a.fedAt = null;
  const leveled = addXP(def.xp);
  saveGame(state);
  return { msg: `جمعت ${ITEMS[def.product].name} +${def.xp}XP${leveled ? ' 🎉' : ''}` };
}

// ==== المعامل ====
function buyFactory(type) {
  const f = FACTORIES[type];
  if (!state.unlockedFactories.includes(type)) return { msg: 'غير مفتوح' };
  if (state.coins < f.cost) return { msg: 'فلوسك ما تكفي' };
  state.coins -= f.cost;
  state.factories.push({ type, busyUntil: null });
  saveGame(state);
  return { msg: `بنيت ${f.name} 🏭` };
}

function startProduction(idx) {
  const f = state.factories[idx];
  if (!f || f.busyUntil) return { msg: 'المعمل مشغول' };
  const recipe = RECIPES[f.type];
  for (const [item, qty] of Object.entries(recipe.input)) {
    if (!hasItem(item, qty)) return { msg: `تحتاج ${qty} ${ITEMS[item].name}` };
  }
  for (const [item, qty] of Object.entries(recipe.input)) removeItem(item, qty);
  f.busyUntil = Date.now() + recipe.time * 1000;
  saveGame(state);
  return { msg: 'بدت الصناعة ⚙️' };
}

function collectFactory(idx) {
  const f = state.factories[idx];
  if (!f || !f.busyUntil) return {};
  if (Date.now() < f.busyUntil) return { msg: 'لسه ما جهز' };
  const recipe = RECIPES[f.type];
  addItem(recipe.output, recipe.outputQty);
  f.busyUntil = null;
  const leveled = addXP(recipe.xp);
  saveGame(state);
  return { msg: `أنتجت ${ITEMS[recipe.output].name} +${recipe.xp}XP${leveled ? ' 🎉' : ''}` };
}

// ==== السوق ====
function sellItem(itemId, qty = 1) {
  if (!hasItem(itemId, qty)) return { msg: 'ما عندك كمية كافية' };
  const item = ITEMS[itemId];
  removeItem(itemId, qty);
  const gold = item.sellPrice * qty;
  state.coins += gold;
  addXP(Math.floor(gold / 5));
  saveGame(state);
  return { msg: `بعت ${qty} ${item.name} +${gold}💰` };
          }
