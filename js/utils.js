// Shared utility helpers for forms, IDs, notifications, and pagination.
(() => {
  function generateId(prefix, collection) {
    const count = collection.length + 1;
    return `${prefix}${String(count).padStart(3, '0')}`;
  }

  function showToast(message, type = 'success') {
    const stack = document.getElementById('toast-stack');
    if (!stack) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    stack.appendChild(toast);
    setTimeout(() => toast.remove(), 2400);
  }

  function confirmAction(message, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    const messageBox = document.getElementById('confirm-message');
    if (!modal || !messageBox) return;
    messageBox.textContent = message;
    modal.classList.add('active');
    const done = () => {
      modal.classList.remove('active');
      document.removeEventListener('click', handle);
    };
    const handle = (event) => {
      if (event.target.matches('[data-modal-confirm]')) {
        onConfirm();
        done();
      }
      if (event.target.matches('[data-modal-cancel]')) {
        done();
      }
    };
    document.addEventListener('click', handle);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function paginate(items, page, perPage = 8) {
    const start = (page - 1) * perPage;
    return items.slice(start, start + perPage);
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
  }

  function getToday() {
    return new Date().toISOString().slice(0, 10);
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  window.HMS = window.HMS || {};
  window.HMS.utils = { generateId, showToast, confirmAction, escapeHtml, paginate, formatCurrency, getToday, readFileAsText };
})();
