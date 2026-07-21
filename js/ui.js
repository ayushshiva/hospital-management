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

  function initMobileNavigation() {
    const sidebar = document.querySelector('.sidebar');
    const topbarActions = document.querySelector('.topbar-actions');
    if (!sidebar || !topbarActions || document.querySelector('.mobile-nav-toggle')) return;

    const toggle = document.createElement('button');
    toggle.className = 'mobile-nav-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Open navigation menu');
    toggle.setAttribute('aria-controls', 'primary-navigation');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '&#9776;';

    const nav = sidebar.querySelector('.nav-links');
    if (nav) nav.id = 'primary-navigation';

    const close = document.createElement('button');
    close.className = 'sidebar-close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Close navigation menu');
    close.innerHTML = '&times;';
    sidebar.append(close);

    const backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.append(backdrop);

    const closeMenu = () => {
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    const openMenu = () => {
      document.body.classList.add('nav-open');
      toggle.setAttribute('aria-expanded', 'true');
      close.focus();
    };

    toggle.addEventListener('click', () => {
      document.body.classList.contains('nav-open') ? closeMenu() : openMenu();
    });
    close.addEventListener('click', closeMenu);
    backdrop.addEventListener('click', closeMenu);
    nav?.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024) closeMenu();
    });
    topbarActions.prepend(toggle);
  }

  function initCommon() {
    const userPill = document.getElementById('user-pill');
    if (userPill) {
      const auth = JSON.parse(localStorage.getItem('northstar-hms-auth') || '{}');
      userPill.textContent = auth.username ? `Welcome, ${auth.username}` : 'Guest';
    }
    initTheme();
    initModalHandlers();
    initMobileNavigation();
  }

  window.HMS = window.HMS || {};
  window.HMS.ui = { applyTheme, initCommon };
})();
