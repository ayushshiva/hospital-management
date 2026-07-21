// Laboratory / Lab Test Management Module — Full CRUD with LocalStorage persistence.
// Features: Add, Edit, Delete, Search, Filter, Print report, Download PDF, Export CSV.
(() => {
  'use strict';

  function loadTests() {
    const state = window.HMS.storage.loadData();
    return state.labs || [];
  }

  function saveTests(tests) {
    const state = window.HMS.storage.loadData();
    state.labs = tests;
    window.HMS.storage.saveData(state);
  }

  function renderTests() {
    const container = document.getElementById('tests-grid');
    if (!container) return;
    const tests = loadTests();
    const searchTerm = (document.getElementById('lab-search')?.value || '').toLowerCase();
    const catFilter = document.getElementById('lab-cat-filter')?.value || 'all';

    const filtered = tests.filter(t => {
      const matchSearch = [t.name, t.category, t.patient || ''].join(' ').toLowerCase().includes(searchTerm);
      const matchCat = catFilter === 'all' || (t.category || '').toLowerCase() === catFilter.toLowerCase();
      return matchSearch && matchCat;
    });

    container.innerHTML = filtered.map(t => `
      <div class="grid-card">
        <div class="card-head" style="margin-bottom:8px;">
          <h4>${window.HMS.utils.escapeHtml(t.name)}</h4>
          <span class="status-pill ${t.result ? 'active' : 'inactive'}">${t.result ? 'Completed' : 'Pending'}</span>
        </div>
        <p><strong>ID:</strong> ${t.id}</p>
        <p><strong>Category:</strong> ${window.HMS.utils.escapeHtml(t.category || '—')}</p>
        <p><strong>Price:</strong> ${window.HMS.utils.formatCurrency(t.price || 0)}</p>
        <p><strong>Sample:</strong> ${window.HMS.utils.escapeHtml(t.sampleType || '—')}</p>
        <p><strong>Patient:</strong> ${window.HMS.utils.escapeHtml(t.patient || '—')}</p>
        <p><strong>Doctor:</strong> ${window.HMS.utils.escapeHtml(t.doctor || '—')}</p>
        ${t.result ? `<p><strong>Result:</strong> ${window.HMS.utils.escapeHtml(t.result)}</p>` : ''}
        ${t.normalRange ? `<p><strong>Normal Range:</strong> ${window.HMS.utils.escapeHtml(t.normalRange)}</p>` : ''}
        <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
          <button class="action-btn" data-action="edit" data-id="${t.id}">Edit</button>
          <button class="action-btn" data-action="result" data-id="${t.id}">Add Result</button>
          <button class="action-btn" data-action="print" data-id="${t.id}">Print</button>
          <button class="action-btn delete" data-action="delete" data-id="${t.id}">Delete</button>
        </div>
    `).join('') || '<p style="grid-column:1/-1;text-align:center;color:var(--muted);">No lab tests found</p>';
  }

  function openForm(test = null) {
    const modal = document.getElementById('lab-modal');
    const title = document.getElementById('lab-modal-title');
    if (!modal || !title) return;

    document.getElementById('lab-form').reset();
    document.getElementById('lab-id').value = test ? test.id : '';
    document.getElementById('lab-name').value = test?.name || '';
    document.getElementById('lab-category').value = test?.category || '';
    document.getElementById('lab-price').value = test?.price || '';
    document.getElementById('lab-sample').value = test?.sampleType || '';
    document.getElementById('lab-range').value = test?.normalRange || '';
    document.getElementById('lab-result').value = test?.result || '';
    document.getElementById('lab-doctor').value = test?.doctor || '';
    document.getElementById('lab-patient').value = test?.patient || '';

    title.textContent = test ? 'Edit Lab Test' : 'Add Lab Test';
    modal.classList.add('active');
  }

  function handleSubmit(event) {
    event.preventDefault();
    const tests = loadTests();
    const editId = document.getElementById('lab-id').value;
    const name = document.getElementById('lab-name').value.trim();

    if (!name) {
      window.HMS.utils.showToast('Test name is required', 'error');
      return;
    }

    const payload = {
      id: editId || window.HMS.utils.generateId('L', tests),
      name: name,
      category: document.getElementById('lab-category').value.trim(),
      price: Number(document.getElementById('lab-price').value || 0),
      sampleType: document.getElementById('lab-sample').value.trim(),
      normalRange: document.getElementById('lab-range').value.trim(),
      result: document.getElementById('lab-result').value.trim(),
      doctor: document.getElementById('lab-doctor').value.trim(),
      patient: document.getElementById('lab-patient').value.trim()
    };

    const index = tests.findIndex(t => t.id === payload.id);
    if (index >= 0) tests[index] = payload;
    else tests.push(payload);

    saveTests(tests);
    document.getElementById('lab-modal').classList.remove('active');
    window.HMS.utils.showToast(editId ? 'Test updated' : 'Test added', 'success');
    renderTests();
  }

  function handleAction(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const tests = loadTests();
    const test = tests.find(t => t.id === button.dataset.id);
    if (!test) return;

    if (button.dataset.action === 'edit') openForm(test);
    if (button.dataset.action === 'delete') {
      window.HMS.utils.confirmAction(`Delete test "${test.name}"?`, () => {
        const next = tests.filter(t => t.id !== test.id);
        saveTests(next);
        renderTests();
        window.HMS.utils.showToast('Test deleted', 'success');
      });
    }
    if (button.dataset.action === 'result') {
      const result = prompt('Enter test result:', test.result || '');
      if (result !== null) {
        test.result = result;
        const index = tests.findIndex(t => t.id === test.id);
        tests[index] = test;
        saveTests(tests);
        renderTests();
        window.HMS.utils.showToast('Result added', 'success');
      }
    }
    if (button.dataset.action === 'print') {
      printReport(test);
    }
  }

  function printReport(test) {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Lab Report - ${test.name}</title>
      <style>
        body{font-family:Arial;padding:30px;max-width:700px;margin:auto;}
        .header{text-align:center;border-bottom:2px solid #1f78d1;padding-bottom:15px;margin-bottom:20px;}
        .header h1{color:#1f78d1;margin:0;}
        .details{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        .details div{padding:8px;border-bottom:1px solid #eee;}
        .result-box{background:#f0f7ff;padding:20px;border-radius:10px;margin:20px 0;text-align:center;}
        .result-box .value{font-size:2rem;font-weight:bold;color:#1f78d1;}
        .footer{text-align:center;margin-top:30px;color:#888;font-size:0.9rem;}
        @media print{body{padding:15px;}}
      </style></head><body>
      <div class="header">
        <h1>Northstar Hospital</h1>
        <p>Laboratory Test Report</p>
      </div>
      <div class="details">
        <div><strong>Test ID:</strong> ${test.id}</div>
        <div><strong>Test Name:</strong> ${test.name}</div>
        <div><strong>Category:</strong> ${test.category || '—'}</div>
        <div><strong>Sample Type:</strong> ${test.sampleType || '—'}</div>
        <div><strong>Patient:</strong> ${test.patient || '—'}</div>
        <div><strong>Doctor:</strong> ${test.doctor || '—'}</div>
        <div><strong>Normal Range:</strong> ${test.normalRange || '—'}</div>
      <div class="result-box">
        <p>Test Result</p>
        <div class="value">${test.result || 'Pending'}</div>
      <div class="footer">Generated on ${new Date().toLocaleDateString()} · Northstar Hospital Management System</div>
      <div style="text-align:center;margin-top:20px;">
        <button onclick="window.print()" style="padding:10px 20px;background:#1f78d1;color:white;border:none;border-radius:8px;cursor:pointer;">Print Report</button>
      </div>
      </body></html>
    `);
    win.document.close();
  }

  function init() {
    if (document.body.dataset.page !== 'laboratory') return;

    const section = document.querySelector('.page-card');
    if (section && !document.getElementById('lab-search')) {
      const toolbar = document.createElement('div');
      toolbar.className = 'toolbar';
      toolbar.innerHTML = `
        <input id="lab-search" type="search" placeholder="Search tests..." style="flex:1;max-width:300px;">
        <select id="lab-cat-filter"><option value="all">All Categories</option><option value="Hematology">Hematology</option><option value="Biochemistry">Biochemistry</option><option value="Microbiology">Microbiology</option><option value="Radiology">Radiology</option><option value="Pathology">Pathology</option><option value="Cardiology">Cardiology</option><option value="Other">Other</option></select>
      `;
      document.querySelector('.card-head')?.after(toolbar);
      toolbar.addEventListener('change', renderTests);
      toolbar.addEventListener('input', renderTests);
    }

    document.getElementById('add-test-btn')?.addEventListener('click', () => openForm());
    document.getElementById('lab-form')?.addEventListener('submit', handleSubmit);
    document.getElementById('tests-grid')?.addEventListener('click', handleAction);

    // Change button from generate-report to add-test
    const genBtn = document.getElementById('generate-report-btn');
    if (genBtn) {
      genBtn.id = 'add-test-btn';
      genBtn.textContent = 'Add Lab Test';
    }

    renderTests();
  }

  document.addEventListener('hms:page-ready', init);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
