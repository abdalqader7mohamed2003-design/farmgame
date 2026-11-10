function init() {
  const saved = loadGame();
  setState(saved || createInitialState());
  if (!saved) saveGame(getState());
  applyUnlocks(getState().level);

  document.querySelectorAll('.tab').forEach(t => {
    t.onclick = () => {
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      currentTab = t.dataset.tab;
      render();
    };
  });

  render();
  setInterval(render, 1200);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  }
}
document.addEventListener('DOMContentLoaded', init);
