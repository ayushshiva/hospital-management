// Pharmacy / Medicine Inventory Module — Full CRUD with LocalStorage persistence.
// Features: Add, Edit, Delete, Search, Filter, Low stock alert, Print, Export CSV.
(() => {
  'use strict';

  function loadMedicines() {
    const state = window.HMS.storage.loadData();
    return state.medicines || [];
  }

  function saveMedicines(medicines) {
    const state = window.HMS.storage.loadData();
    state.medicines = medicines;
    window.HMS.storage.saveData(state);
  }

  function renderMedicines() {
    const tbody = document.getElementById('medicines-table-body');
    if (!tbody) return;
    const medicines = loadMedicines();
    const searchTerm = (document.getElementById('medicine-search')?.value || '').toLowerCase();
    const catFilter = document.getElementById('medicine-cat-filter')?.value || 'all';

    const filtered = medicines.filter(m => {
      const matchSearch = [m.name, m.brand, m.category, m.supplier].join(' ').toLowerCase().includes(searchTerm);
      const matchCat = catFilter === 'all' || (m.category || '').toLowerCase() === catFilter.toLowerCase();
      return matchSearch && matchCat;
    });

    tbody.innerHTML = filtered.map(m => {
      const isLow = m.quantity <= m.minStock;
      return `<tr>
        <td>${m.id}</td>
        <td>${window.HMS.utils.escapeHtml(m.name)}</td>
        <td>${window.HMS.utils.escapeHtml(m.brand || '—')}</td>
        <td>${window.HMS.utils.escapeHtml(m.category || '—')}</td>
        <td>${m.expiry || '—'}</td>
        <td>${window.HMS.utils.formatCurrency(m.sellingPrice || 0)}</td>
        <td><span class="status-pill ${isLow ? 'inactive' : 'active'}">${m.quantity}</span></td>
        <td>${m.minStock || 0}</td>
        <td>${window.HMS.utils.escapeHtml(m.supplier || '—')}</td>
        <td>
          ${isLow ? '<span class="status-pill inactive" style="font-size:0.7rem;">⚠ Low Stock</span>' : ''}
        </td>
        <td>
          <button class="action-btn" data-action="edit" data-id="${m.id}">Edit</button>
          <button class="action-btn delete" data-action="delete" data-id="${m.id}">Delete</button>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="11" style="text-align:center;">No medicines found</td></tr>';
  }

  function openForm(medicine = null) {
    const modal = document.getElementById('medicine-modal');
    const title = document.getElementById('medicine-modal-title');
    if (!modal || !title) return;

    document.getElementById('medicine-form').reset();
    document.getElementById('medicine-id').value = medicine ? medicine.id : '';
    document.getElementById('medicine-name').value = medicine?.name || '';
    document.getElementById('medicine-brand').value = medicine?.brand || '';
    document.getElementById('medicine-category').value = medicine?.category || '';
    document.getElementById('medicine-manufacturer').value = medicine?.manufacturer || '';
    document.getElementById('medicine-batch').value = medicine?.batchNo || '';
    document.getElementById('medicine-expiry').value = medicine?.expiry || '';
    document.getElementById('medicine-purchase-price').value = medicine?.purchasePrice || '';
    document.getElementById('medicine-selling-price').value = medicine?.sellingPrice || '';
    document.getElementById('medicine-quantity').value = medicine?.quantity || '';
    document.getElementById('medicine-min-stock').value = medicine?.minStock || '';
    document.getElementById('medicine-rack').value = medicine?.rackNo || '';
    document.getElementById('medicine-supplier').value = medicine?.supplier || '';
    document.getElementById('medicine-gst').value = medicine?.gst || '';
    document.getElementById('medicine-barcode').value = medicine?.barcode || '';

    title.textContent = medicine ? 'Edit Medicine' : 'Add Medicine';
    modal.classList.add('active');
  }

  function handleSubmit(event) {
    event.preventDefault();
    const medicines = loadMedicines();
    const editId = document.getElementById('medicine-id').value;
    const name = document.getElementById('medicine-name').value.trim();

    if (!name) {
      window.HMS.utils.showToast('Medicine name is required', 'error');
      return;
    }

    const payload = {
      id: editId || window.HMS.utils.generateId('M', medicines),
      name: name,
      brand: document.getElementById('medicine-brand').value.trim(),
      category: document.getElementById('medicine-category').value.trim(),
      manufacturer: document.getElementById('medicine-manufacturer').value.trim(),
      batchNo: document.getElementById('medicine-batch').value.trim(),
      expiry: document.getElementById('medicine-expiry').value,
      purchasePrice: Number(document.getElementById('medicine-purchase-price').value || 0),
      sellingPrice: Number(document.getElementById('medicine-selling-price').value || 0),
      quantity: Number(document.getElementById('medicine-quantity').value || 0),
      minStock: Number(document.getElementById('medicine-min-stock').value || 10),
      rackNo: document.getElementById('medicine-rack').value.trim(),
      supplier: document.getElementById('medicine-supplier').value.trim(),
      gst: Number(document.getElementById('medicine-gst').value || 0),
      barcode: document.getElementById('medicine-barcode').value.trim()
    };

    const index = medicines.findIndex(m => m.id === payload.id);
    if (index >= 0) medicines[index] = payload;
    else medicines.push(payload);

    saveMedicines(medicines);
    document.getElementById('medicine-modal').classList.remove('active');
    window.HMS.utils.showToast(editId ? 'Medicine updated' : 'Medicine added', 'success');
    renderMedicines();
  }

  function handleAction(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const medicines = loadMedicines();
    const medicine = medicines.find(m => m.id === button.dataset.id);
    if (!medicine) return;

    if (button.dataset.action === 'edit') openForm(medicine);
    if (button.dataset.action === 'delete') {
      window.HMS.utils.confirmAction(`Delete "${medicine.name}"?`, () => {
        const next = medicines.filter(m => m.id !== medicine.id);
        saveMedicines(next);
        renderMedicines();
        window.HMS.utils.showToast('Medicine deleted', 'success');
      });
    }
  }

  function printMedicines() {
    const medicines = loadMedicines();
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Medicine Inventory</title>
      <style>body{font-family:Arial;padding:20px;}table{width:100%;border-collapse:collapse;}
      th,td{padding:8px;border:1px solid #ddd;text-align:left;}th{background:#1f78d1;color:white;}
      h2{color:#1f78d1;}</style></head><body>
      <h2>Northstar Hospital — Medicine Inventory</h2>
      <table><thead><tr><th>Name</th><th>Brand</th><th>Qty</th><th>Price</th><th>Supplier</th><th>Expiry</th></tr></thead>
      <tbody>${medicines.map(m => `<tr><td>${m.name}</td><td>${m.brand || '—'}</td><td>${m.quantity}</td><td>₹${m.sellingPrice || 0}</td><td>${m.supplier || '—'}</td><td>${m.expiry || '—'}</td></tr>`).join('')}</tbody></table></body></html>
    `);
    win.document.close();
    win.print();
  }

  function exportCsv() {
    const medicines = loadMedicines();
    const rows = [
      ['ID', 'Name', 'Brand', 'Category', 'Manufacturer', 'Batch No', 'Expiry', 'Purchase Price', 'Selling Price', 'Qty', 'Min Stock', 'Rack', 'Supplier', 'GST', 'Barcode'],
      ...medicines.map(m => [m.id, m.name, m.brand, m.category, m.manufacturer, m.batchNo, m.expiry, m.purchasePrice, m.sellingPrice, m.quantity, m.minStock, m.rackNo, m.supplier, m.gst, m.barcode])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'medicines.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // Deduct medicine stock after billing
  function deductStock(medicineName, quantity) {
    const medicines = loadMedicines();
    const med = medicines.find(m => m.name.toLowerCase() === medicineName.toLowerCase());
    if (med) {
      med.quantity = Math.max(0, med.quantity - quantity);
      saveMedicines(medicines);
      renderMedicines();
    }
  }

  // Expose for billing module to use
  window.HMS = window.HMS || {};
  window.HMS.pharmacy = { deductStock, loadMedicines };

  function init() {
    if (document.body.dataset.page !== 'pharmacy') return;

    const section = document.querySelector('.page-card');
    if (section && !document.getElementById('medicine-search')) {
      const toolbar = document.createElement('div');
      toolbar.className = 'toolbar';
      toolbar.innerHTML = `
        <input id="medicine-search" type="search" placeholder="Search medicines..." style="flex:1;max-width:300px;">
        <select id="medicine-cat-filter">
          <option value="all">All Categories</option>
          <option value="Analgesic">Analgesic</option>
          <option value="Antibiotic">Antibiotic</option>
          <option value="Antiviral">Antiviral</option>
          <option value="Cardiac">Cardiac</option>
          <option value="Neurology">Neurology</option>
          <option value="Vitamin">Vitamin</option>
          <option value="Other">Other</option>
        </select>
      `;
      document.querySelector('.card-head')?.after(toolbar);
      toolbar.addEventListener('change', renderMedicines);
      toolbar.addEventListener('input', renderMedicines);
    }

    document.getElementById('add-medicine-btn')?.addEventListener('click', () => openForm());
    document.getElementById('medicine-form')?.addEventListener('submit', handleSubmit);
    document.getElementById('medicines-table-body')?.addEventListener('click', handleAction);

    // Add columns to table header if missing
    const thead = document.querySelector('#medicines-table-body')?.closest('table')?.querySelector('thead tr');
    if (thead && thead.children.length < 11) {
      thead.innerHTML = '<th>ID</th><th>Name</th><th>Brand</th><th>Category</th><th>Expiry</th><th>Price</th><th>Stock</th><th>Min Stock</th><th>Supplier</th><th>Alert</th><th>Actions</th>';
    }

    const cardHead = document.querySelector('.card-head');
    if (cardHead && !document.getElementById('print-med-btn')) {
      const printBtn = document.createElement('button');
      printBtn.id = 'print-med-btn';
      printBtn.className = 'btn btn-secondary';
      printBtn.textContent = 'Print';
      printBtn.addEventListener('click', printMedicines);
      cardHead.appendChild(printBtn);

      const exportBtn = document.createElement('button');
      exportBtn.id = 'export-med-btn';
      exportBtn.className = 'btn btn-secondary';
      exportBtn.textContent = 'Export CSV';
      exportBtn.addEventListener('click', exportCsv);
      cardHead.appendChild(exportBtn);
    }

    renderMedicines();
  }

  document.addEventListener('hms:page-ready', init);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

