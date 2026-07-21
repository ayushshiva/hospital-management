// Core application bootstrapping for shared page behavior.
// Initializes auth, theme, modals, and user pill on every page.
(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;

    // Require auth for all pages except login
    if (page !== 'login') {
      window.HMS.auth.requireAuth();
    }

    // Initialize common UI components on all pages
    window.HMS.ui.initCommon();

    // Dispatch page-specific init event so individual modules can initialize
    document.dispatchEvent(new CustomEvent('hms:page-ready', { detail: { page } }));
  });
})();
