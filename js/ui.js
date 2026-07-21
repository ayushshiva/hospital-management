// UI helpers for theme toggling, modals, and shared page initialization.
(() => {
  function applyTheme(theme) {
    document.body.classList.toggle('dark', theme === 'dark');
    const toggle = document.getElementById('theme-toggle');
    if (toggle) toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  function initTheme() {
    const data = window.HMS.storage.loadData();
    applyTheme(data.settings.theme || 'default');
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const current = document.body.classList.contains('dark') ? 'dark' : 'default';
        const next = current === 'dark' ? 'default' : 'dark';
        applyTheme(next);
        const state = window.HMS.storage.loadData();
        state.settings.theme = next;
        window.HMS.storage.saveData(state);
        window.HMS.utils.showToast('Theme updated', 'success');
      });
    }
  }

  function initModalHandlers() {
    document.addEventListener('click', (event) => {
      const closeButton = event.target.closest('[data-modal-close]');
      if (closeButton) {
        const overlay = closeButton.closest('.modal-overlay');
        if (overlay) overlay.classList.remove('active');
      }
    });
  }

  function initCommon() {
    const userPill = document.getElementById('user-pill');
    if (userPill) {
      const auth = JSON.parse(localStorage.getItem('northstar-hms-auth') || '{}');
      userPill.textContent = auth.username ? `Welcome, ${auth.username}` : 'Guest';
    }
    initTheme();
    initModalHandlers();
  }

  window.HMS = window.HMS || {};
  window.HMS.ui = { applyTheme, initCommon };
})();
