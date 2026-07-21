// Admin Pricing Management Module — Full CRUD with LocalStorage persistence.
// Only Admin role can access. All prices are used by Billing module automatically.
(() => {
  'use strict';

  function loadPricing() {
    const state = window.HMS.storage.loadData();
    return state.pricing || [];
  }

  function savePricing(pricing) {
    const state = window.HMS.storage.loadData();
    state.pricing = pricing;
    window.HMS.storage.saveData(state);
  }

  function getPriceByName(name) {
    const pricing = loadPricing();
    const item = pricing.find(p => p.name.toLowerCase() === name.toLowerCase());
    return item ? item.price : 0;
  }

  // Expose for billing module
  window.HMS = window.HMS || {};
  window.HMS.pricing = { getPriceByName, loadPricing };

  function renderPricing() {
    const tbody = document.getElementById('pricing-table-body');
    if (!tbody) return;
    const pricing = loadPricing();
    const searchTerm = (document.getElementById('pricing-search')?.value || '').toLowerCase();
    const catFilter = document.getElementById('pricing-cat-filter')?.value || 'all';

    const filtered = pricing.filter(p => {
      const matchSearch = [p.name, p.category].join(' ').toLowerCase().includes(searchTerm);
      const matchCat = catFilter === 'all' || (p.category || '').toLowerCase() === catFilter.toLowerCase();
      return matchSearch && matchCat;
    });

    tbody.innerHTML = filtered.map(p => `
      <tr>
        <td>${p.id}</td>
        <td>${window.HMS.utils.escapeHtml(p.name)}</td>
        <td>${window.HMS.utils.escapeHtml(p.category || '—')}</td>
        <td>${window.HMS.utils.formatCurrency(p.price)}</td>
        <td>
          <button class="action-btn" data-action="edit" data-id="${p.id}">Edit</button>
          <button class="action-btn delete" data-action="delete" data-id="${p.id}">Delete</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="5" style="text-align:center;">No pricing items found</td></tr>';
  }

  function openForm(item = null) {
    const modal = document.getElementById('pricing-modal');
    const title = document.getElementById('pricing-modal-title');
    if (!modal || !title) return;

    document.getElementById('pricing-form').reset();
    document.getElementById('pricing-id').value = item ? item.id : '';
    document.getElementById('pricing-name').value = item?.name || '';
    document.getElementById('pricing-category').value = item?.category || '';
    document.getElementById('pricing-price').value = item?.price || '';

    title.textContent = item ? 'Edit Price' : 'Add Price';
    modal.classList.add('active');
  }

  function handleSubmit(event) {
    event.preventDefault();
    const pricing = loadPricing();
    const editId = document.getElementById('pricing-id').value;
    const name = document.getElementById('pricing-name').value.trim();

    if (!name) {
      window.HMS.utils.showToast('Service name is required', 'error');
      return;
    }

    const payload = {
      id: editId || window.HMS.utils.generateId('PR', pricing),
      name: name,
      category: document.getElementById('pricing-category').value.trim(),
      price: Number(document.getElementById('pricing-price').value || 0)
    };

    const index = pricing.findIndex(p => p.id === payload.id);
    if (index >= 0) pricing[index] = payload;
    else pricing.push(payload);

    savePricing(pricing);
    document.getElementById('pricing-modal').classList.remove('active');
    window.HMS.utils.showToast(editId ? 'Price updated' : 'Price added', 'success');
    renderPricing();
  }

  function handleAction(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const pricing = loadPricing();
    const item = pricing.find(p => p.id === button.dataset.id);
    if (!item) return;

    if (button.dataset.action === 'edit') openForm(item);
    if (button.dataset.action === 'delete') {
      window.HMS.utils.confirmAction(`Delete "${item.name}"?`, () => {
        const next = pricing.filter(p => p.id !== item.id);
        savePricing(next);
        renderPricing();
        window.HMS.utils.showToast('Price deleted', 'success');
      });
    }
  }

  // Check if user is Admin
  function isAdmin() {
    const auth = JSON.parse(localStorage.getItem('northstar-hms-auth') || '{}');
    return auth.role === 'Admin';
  }

  function init() {
    if (document.body.dataset.page !== 'settings') return;

    // Only show pricing if Admin
    if (!isAdmin()) {
      const pricingSection = document.getElementById('pricing-section');
      if (pricingSection) pricingSection.style.display = 'none';
      return;
    }

    document.getElementById('add-pricing-btn')?.addEventListener('click', () => openForm());
    document.getElementById('pricing-form')?.addEventListener('submit', handleSubmit);
    document.getElementById('pricing-table-body')?.addEventListener('click', handleAction);

    const searchEl = document.getElementById('pricing-search');
    if (searchEl) searchEl.addEventListener('input', renderPricing);
    document.getElementById('pricing-cat-filter')?.addEventListener('change', renderPricing);

    renderPricing();
  }

  document.addEventListener('hms:page-ready', init);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
