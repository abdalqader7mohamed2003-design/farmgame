let currentTab = 'farm';

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

function render() {
  const s = getState();
  document.getElementById('hud-coins').textContent = s.coins;
  document.getElementById('hud-xp').textContent = s.xp;
  document.getElementById('hud-level').textContent = s.level;
  const content = document.getElementById('content');
  if (currentTab === 'farm')      renderFarm(content);
  else if (currentTab === 'animals')   renderAnimals(content);
  else if (currentTab === 'factories') renderFactories(content);
  else if (currentTab === 'market')    renderMarket(content);
  else if (currentTab === 'storage')   renderStorage(content);
}

function renderFarm(el) {
  const s = getState();
  el.innerHTML = '<div class="grid plots"></div>';
  const grid = el.querySelector('.grid');
  s.plots.forEach((plot, i) => {
    const div = document.createElement('div');
    div.className = 'plot';
    if (!plot.crop) {
      div.classList.add('empty'); div.textContent = '➕';
      div.onclick = () => openPlantMenu(i);
    } else {
      const crop = CROPS[plot.crop];
      const elapsed = (Date.now() - plot.plantedAt) / 1000;
      if (elapsed >= crop.growTime) {
        div.classList.add('ready'); div.textContent = crop.emoji;
        div.onclick = () => { const r = harvestPlot(i); if (r.msg) showToast(r.msg); render(); };
      } else {
        div.classList.add('growing'); div.textContent = '🌱';
        const bar = document.createElement('div');
        bar.className = 'progress';
        bar.style.width = ((elapsed / crop.growTime) * 100) + '%';
        div.appendChild(bar);
      }
    }
    grid.appendChild(div);
  });
}

function openPlantMenu(idx) {
  const s = getState();
  const avail = s.unlockedCrops.filter(c => (s.seeds[c] || 0) > 0);
  if (avail.length === 0) { showToast('ما عندك بذور! اشتري من السوق 🏪'); return; }
  const r = plantSeed(idx, avail[0]);
  if (r.msg) showToast(r.msg);
  render();
}

function renderAnimals(el) {
  const s = getState();
  let html = '<h2>حيواناتي</h2>';
  if (s.animals.length === 0) html += '<div class="empty-state">ما عندك حيوانات 🐔</div>';
  s.animals.forEach((a, i) => {
    const def = ANIMALS[a.type];
    const ready = a.fedAt && (Date.now() - a.fedAt) / 1000 >= def.produceTime;
    let btn;
    if (!a.fedAt) btn = `<button onclick="doFeed(${i})">أطعم (${def.feedCost}🍃)</button>`;
    else if (ready) btn = `<button onclick="doCollect(${i})">اجمع</button>`;
    else btn = `<button disabled>ينمو...</button>`;
    html += `<div class="card"><div class="icon">${def.emoji}</div>
      <div class="info"><div class="title">${def.name}</div>
      <div class="sub">${def.produceTime}ث • ${ITEMS[def.product].name}</div></div>${btn}</div>`;
  });
  html += '<h2>شراء حيوانات</h2>';
  for (const [id, def] of Object.entries(ANIMALS)) {
    if (!s.unlockedAnimals.includes(id)) {
      html += `<div class="card"><div class="icon">🔒</div><div class="info"><div class="title">${def.name}</div><div class="sub">يفتح مستوى ${def.level}</div></div></div>`;
    } else {
      html += `<div class="card"><div class="icon">${def.emoji}</div>
        <div class="info"><div class="title">${def.name}</div><div class="sub">${def.cost}💰</div></div>
        <button class="buy" onclick="doBuyAnimal('${id}')">شراء</button></div>`;
    }
  }
  el.innerHTML = html;
}

function doBuyAnimal(id) { const r = buyAnimal(id); if (r.msg) showToast(r.msg); render(); }
function doFeed(i) { const r = feedAnimal(i); if (r.msg) showToast(r.msg); render(); }
function doCollect(i) { const r = collectAnimal(i); if (r.msg) showToast(r.msg); render(); }

function renderFactories(el) {
  const s = getState();
  let html = '<h2>معاملي</h2>';
  if (s.factories.length === 0) html += '<div class="empty-state">ما عندك معامل 🏭</div>';
  s.factories.forEach((f, i) => {
    const def = FACTORIES[f.type];
    const recipe = RECIPES[f.type];
    let btn;
    if (f.busyUntil) {
      if (Date.now() >= f.busyUntil) btn = `<button onclick="doCollectFactory(${i})">اجمع</button>`;
      else btn = `<button disabled>يشتغل...</button>`;
    } else btn = `<button onclick="doStartProd(${i})">ابدأ</button>`;
    const inp = Object.entries(recipe.input).map(([k,v]) => `${v}${ITEMS[k].emoji}`).join('+');
    html += `<div class="card"><div class="icon">${def.emoji}</div>
      <div class="info"><div class="title">${def.name}</div>
      <div class="sub">${inp} → ${ITEMS[recipe.output].emoji}</div></div>${btn}</div>`;
  });
  html += '<h2>بناء معامل</h2>';
  for (const [id, def] of Object.entries(FACTORIES)) {
    if (!s.unlockedFactories.includes(id)) {
      html += `<div class="card"><div class="icon">🔒</div><div class="info"><div class="title">${def.name}</div><div class="sub">يفتح مستوى ${def.level}</div></div></div>`;
    } else {
      html += `<div class="card"><div class="icon">${def.emoji}</div>
        <div class="info"><div class="title">${def.name}</div><div class="sub">${def.cost}💰</div></div>
        <button class="buy" onclick="doBuyFactory('${id}')">بناء</button></div>`;
    }
  }
  el.innerHTML = html;
}
function doBuyFactory(id) { const r = buyFactory(id); if (r.msg) showToast(r.msg); render(); }
function doStartProd(i) { const r = startProduction(i); if (r.msg) showToast(r.msg); render(); }
function doCollectFactory(i) { const r = collectFactory(i); if (r.msg) showToast(r.msg); render(); }

function renderMarket(el) {
  const s = getState();
  let html = '<h2>بذور للبيع</h2>';
  for (const [id, def] of Object.entries(CROPS)) {
    if (!s.unlockedCrops.includes(id)) continue;
    html += `<div class="card"><div class="icon">${def.emoji}</div>
      <div class="info"><div class="title">بذرة ${def.name}</div>
      <div class="sub">${def.seedCost}💰 • ${def.growTime}ث • تبيع ${def.sellPrice}💰</div></div>
      <button class="buy" onclick="doBuySeed('${id}')">شراء</button></div>`;
  }
  el.innerHTML = html;
}
function doBuySeed(id) { const r = buySeed(id); if (r.msg) showToast(r.msg); render(); }

function renderStorage(el) {
  const s = getState();
  let html = '<h2>مخزوني</h2>';
  let has = false;
  for (const [id, qty] of Object.entries(s.inventory)) {
    if (qty <= 0) continue;
    has = true;
    const item = ITEMS[id];
    html += `<div class="card"><div class="icon">${item.emoji}</div>
      <div class="info"><div class="title">${item.name} × ${qty}</div>
      <div class="sub">سعر: ${item.sellPrice}💰</div></div>
      <button class="buy" onclick="doSell('${id}')">بيع</button></div>`;
  }
  if (!has) html += '<div class="empty-state">مخزنك فاضي 📦</div>';
  el.innerHTML = html;
}
function doSell(id) { const r = sellItem(id); if (r.msg) showToast(r.msg); render(); }
