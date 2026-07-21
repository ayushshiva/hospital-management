// Department Management Module — Full CRUD with LocalStorage persistence.
// Features: Add, Edit, Delete, Search, Duplicate prevention, Status toggle.
(() => {
  'use strict';

  // ----- Data Access -----
  function loadDepartments() {
    const state = window.HMS.storage.loadData();
    return state.departments || [];
  }

  function saveDepartments(departments) {
    const state = window.HMS.storage.loadData();
    state.departments = departments;
    window.HMS.storage.saveData(state);
  }

  // ----- Render Grid -----
  function renderDepartments() {
    const container = document.getElementById('departments-grid');
    if (!container) return;
    const departments = loadDepartments();
    const searchTerm = (document.getElementById('department-search')?.value || '').toLowerCase();

    // Filter by search
    const filtered = searchTerm
      ? departments.filter(d =>
          d.name.toLowerCase().includes(searchTerm) ||
          (d.head || '').toLowerCase().includes(searchTerm)
        )
      : departments;

    // Update total count
    const totalEl = document.getElementById('department-total');
    if (totalEl) totalEl.textContent = filtered.length;

    container.innerHTML = filtered.map(d => `
      <div class="grid-card">
        <div class="card-head" style="margin-bottom:10px;">
          <h4>${window.HMS.utils.escapeHtml(d.name)}</h4>
          <span class="status-pill ${d.status === 'Active' ? 'active' : 'inactive'}">${d.status}</span>
        </div>
        <p><strong>Head:</strong> ${window.HMS.utils.escapeHtml(d.head || '—')}</p>
        <p><strong>Description:</strong> ${window.HMS.utils.escapeHtml(d.description || '—')}</p>
        <p><strong>Doctors:</strong> ${d.doctorsCount || 0}</p>
        <p><strong>Capacity:</strong> ${d.capacity || 0}</p>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="action-btn" data-action="edit" data-id="${d.id}">Edit</button>
          <button class="action-btn delete" data-action="delete" data-id="${d.id}">Delete</button>
        </div>
      </div>
    `).join('') || '<p style="grid-column:1/-1;text-align:center;color:var(--muted);">No departments found</p>';
  }

  // ----- Open Modal -----
  function openForm(department = null) {
    const modal = document.getElementById('department-modal');
    const title = document.getElementById('department-modal-title');
    if (!modal || !title) return;

    // Reset form
    document.getElementById('department-form').reset();
    document.getElementById('department-id').value = department ? department.id : '';
    document.getElementById('department-name').value = department?.name || '';
    document.getElementById('department-head').value = department?.head || '';
    document.getElementById('department-description').value = department?.description || '';
    document.getElementById('department-doctors').value = department?.doctorsCount || 0;
    document.getElementById('department-capacity').value = department?.capacity || '';
    document.getElementById('department-status').value = department?.status || 'Active';

    title.textContent = department ? 'Edit Department' : 'Add Department';
    modal.classList.add('active');
  }

  // ----- Form Submit -----
  function handleSubmit(event) {
    event.preventDefault();
    const departments = loadDepartments();
    const editId = document.getElementById('department-id').value;
    const name = document.getElementById('department-name').value.trim();

    // Validate required fields
    if (!name) {
      window.HMS.utils.showToast('Department name is required', 'error');
      return;
    }

    // Prevent duplicate names (exclude current editing record)
    const duplicate = departments.find(d =>
      d.name.toLowerCase() === name.toLowerCase() && d.id !== editId
    );
    if (duplicate) {
      window.HMS.utils.showToast('A department with this name already exists', 'error');
      return;
    }

    const payload = {
      id: editId || window.HMS.utils.generateId('DEP', departments),
      name: name,
      head: document.getElementById('department-head').value.trim(),
      description: document.getElementById('department-description').value.trim(),
      doctorsCount: Number(document.getElementById('department-doctors').value || 0),
      capacity: Number(document.getElementById('department-capacity').value || 0),
      status: document.getElementById('department-status').value
    };

    const index = departments.findIndex(d => d.id === payload.id);
    if (index >= 0) {
      departments[index] = payload;
    } else {
      departments.push(payload);
    }

    saveDepartments(departments);
    document.getElementById('department-modal').classList.remove('active');
    window.HMS.utils.showToast(editId ? 'Department updated' : 'Department added', 'success');
    renderDepartments();
  }

  // ----- Inline Actions (Edit / Delete) -----
  function handleAction(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const departments = loadDepartments();
    const department = departments.find(d => d.id === button.dataset.id);
    if (!department) return;

    if (button.dataset.action === 'edit') {
      openForm(department);
    }

    if (button.dataset.action === 'delete') {
      window.HMS.utils.confirmAction(`Delete department "${department.name}"?`, () => {
        const next = departments.filter(d => d.id !== department.id);
        saveDepartments(next);
        renderDepartments();
        window.HMS.utils.showToast('Department deleted', 'success');
      });
    }
  }

  // ----- Print Departments -----
  function printDepartments() {
    const departments = loadDepartments();
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Departments List</title>
      <style>body{font-family:Arial;padding:20px;}table{width:100%;border-collapse:collapse;}
      th,td{padding:8px 12px;border:1px solid #ddd;text-align:left;}th{background:#1f78d1;color:white;}
      h2{color:#1f78d1;}</style></head><body>
      <h2>Northstar Hospital — Departments</h2>
      <table><thead><tr><th>Name</th><th>Head</th><th>Description</th><th>Doctors</th><th>Status</th></tr></thead>
      <tbody>${departments.map(d => `<tr><td>${d.name}</td><td>${d.head || '—'}</td><td>${d.description || '—'}</td><td>${d.doctorsCount || 0}</td><td>${d.status}</td></tr>`).join('')}</tbody>
      </table></body></html>
    `);
    win.document.close();
    win.print();
  }

  // ----- Export CSV -----
  function exportDepartmentsCsv() {
    const departments = loadDepartments();
    const rows = [
      ['Name', 'Head', 'Description', 'Doctors', 'Capacity', 'Status'],
      ...departments.map(d => [d.name, d.head || '', d.description || '', d.doctorsCount || 0, d.capacity || 0, d.status])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'departments.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // ----- Initialize -----
  function init() {
    if (document.body.dataset.page !== 'departments') return;

    // Add search input if not present
    const cardHead = document.querySelector('.card-head');
    if (cardHead && !document.getElementById('department-search')) {
      const searchInput = document.createElement('input');
      searchInput.id = 'department-search';
      searchInput.type = 'search';
      searchInput.placeholder = 'Search departments...';
      searchInput.style.maxWidth = '250px';
      searchInput.addEventListener('input', renderDepartments);
      cardHead.after(searchInput);
    }

    // Add total count display
    const card = document.querySelector('.page-card .card-head h3');
    if (card && !document.getElementById('department-total')) {
      const totalSpan = document.createElement('span');
      totalSpan.id = 'department-total';
      totalSpan.style.marginLeft = '8px';
      totalSpan.style.fontSize = '0.85rem';
      totalSpan.style.color = 'var(--muted)';
      card.appendChild(totalSpan);
    }

    document.getElementById('add-department-btn')?.addEventListener('click', () => openForm());
    document.getElementById('department-form')?.addEventListener('submit', handleSubmit);
    document.getElementById('departments-grid')?.addEventListener('click', handleAction);

    // Add print button
    const printBtn = document.createElement('button');
    printBtn.className = 'btn btn-secondary';
    printBtn.textContent = 'Print';
    printBtn.addEventListener('click', printDepartments);
    document.querySelector('.card-head')?.appendChild(printBtn);

    // Add export CSV button
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-secondary';
    exportBtn.textContent = 'Export CSV';
    exportBtn.addEventListener('click', exportDepartmentsCsv);
    document.querySelector('.card-head')?.appendChild(exportBtn);

    renderDepartments();
  }

  // Listen for page-ready event (dispatched by app.js)
  document.addEventListener('hms:page-ready', init);
  // Also handle direct DOMContentLoaded as fallback
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

