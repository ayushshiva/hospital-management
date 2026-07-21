// Reports / Medical Documents Management Module — Full CRUD with LocalStorage persistence.
// Role-based access: Doctor can upload/edit/delete, Admin can view/download/print, Reception can view.
// Supports: PDF, Image, Word, Lab Report, Prescription, Scan Report, X-Ray, MRI, CT Scan, Blood Report, Ultrasound, ECG.
(() => {
  'use strict';

  function loadReports() {
    const state = window.HMS.storage.loadData();
    return state.reports || [];
  }

  function saveReports(reports) {
    const state = window.HMS.storage.loadData();
    state.reports = reports;
    window.HMS.storage.saveData(state);
  }

  function getCurrentUser() {
    return JSON.parse(localStorage.getItem('northstar-hms-auth') || '{}');
  }

  function renderReports() {
    const container = document.getElementById('report-list');
    if (!container) return;
    const reports = loadReports();
    const user = getCurrentUser();
    const searchTerm = (document.getElementById('report-search')?.value || '').toLowerCase();
    const typeFilter = document.getElementById('report-type-filter')?.value || 'all';

    // Role-based filtering: Doctors only see their own uploads
    let visible = reports;
    if (user.role === 'Doctor') {
      visible = reports.filter(r => r.uploadedBy === user.username);
    }

    const filtered = visible.filter(r => {
      const matchSearch = [r.patientName, r.patientId, r.doctor, r.type, r.description].join(' ').toLowerCase().includes(searchTerm);
      const matchType = typeFilter === 'all' || r.type === typeFilter;
      return matchSearch && matchType;
    }).reverse();

    container.innerHTML = filtered.map(r => `
      <div class="grid-card">
        <div class="card-head" style="margin-bottom:8px;">
          <h4>${window.HMS.utils.escapeHtml(r.type)}</h4>
          <span class="status-pill active">${r.date || '—'}</span>
        </div>
        <p><strong>Patient:</strong> ${window.HMS.utils.escapeHtml(r.patientName)} (${r.patientId})</p>
        <p><strong>Doctor:</strong> ${window.HMS.utils.escapeHtml(r.doctor || '—')}</p>
        <p><strong>Department:</strong> ${window.HMS.utils.escapeHtml(r.department || '—')}</p>
        ${r.description ? `<p><strong>Description:</strong> ${window.HMS.utils.escapeHtml(r.description)}</p>` : ''}
        ${r.fileName ? `<p><strong>File:</strong> ${window.HMS.utils.escapeHtml(r.fileName)}</p>` : ''}
        <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
          ${user.role === 'Doctor' ? `
            <button class="action-btn" data-action="edit" data-id="${r.id}">Edit</button>
            <button class="action-btn delete" data-action="delete" data-id="${r.id}">Delete</button>
          ` : ''}
          <button class="action-btn" data-action="view" data-id="${r.id}">View</button>
          <button class="action-btn" data-action="print" data-id="${r.id}">Print</button>
          <button class="action-btn" data-action="download" data-id="${r.id}">Download</button>
        </div>
    `).join('') || '<p style="grid-column:1/-1;text-align:center;color:var(--muted);">No reports found</p>';
  }

  function openForm(report = null) {
    const modal = document.getElementById('report-modal');
    const title = document.getElementById('report-modal-title');
    if (!modal || !title) return;

    document.getElementById('report-form').reset();
    document.getElementById('report-id').value = report ? report.id : '';
    document.getElementById('report-type').value = report?.type || 'Lab Report';
    document.getElementById('report-patient-id').value = report?.patientId || '';
    document.getElementById('report-patient-name').value = report?.patientName || '';
    document.getElementById('report-doctor').value = report?.doctor || '';
    document.getElementById('report-department').value = report?.department || '';
    document.getElementById('report-date').value = report?.date || window.HMS.utils.getToday();
    document.getElementById('report-description').value = report?.description || '';

    const fileInfo = document.getElementById('report-file-info');
    if (fileInfo) {
      fileInfo.textContent = report?.fileName ? `Current file: ${report.fileName}` : '';
    }

    title.textContent = report ? 'Edit Report' : 'Upload Report';
    modal.classList.add('active');
  }

  function handleSubmit(event) {
    event.preventDefault();
    const reports = loadReports();
    const editId = document.getElementById('report-id').value;
    const user = getCurrentUser();
    const type = document.getElementById('report-type').value;
    const patientId = document.getElementById('report-patient-id').value.trim();
    const patientName = document.getElementById('report-patient-name').value.trim();

    if (!patientId || !patientName) {
      window.HMS.utils.showToast('Patient ID and Name are required', 'error');
      return;
    }

    const fileInput = document.getElementById('report-file');
    let fileName = '';
    let fileData = '';

    if (fileInput && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      fileName = file.name;
      const reader = new FileReader();
      reader.onload = function(e) {
        fileData = e.target.result;
        saveReportData(fileData);
      };
      reader.readAsDataURL(file);
    } else {
      const existing = reports.find(r => r.id === editId);
      if (existing) {
        fileName = existing.fileName || '';
        fileData = existing.fileData || '';
      }
      saveReportData(fileData);
    }

    function saveReportData(fileData) {
      const payload = {
        id: editId || `RPT-${Date.now()}`,
        type: type,
        patientId: patientId,
        patientName: patientName,
        doctor: document.getElementById('report-doctor').value.trim() || user.username,
        department: document.getElementById('report-department').value.trim(),
        date: document.getElementById('report-date').value,
        description: document.getElementById('report-description').value.trim(),
        fileName: fileName,
        fileData: fileData,
        uploadedBy: user.username,
        uploadedRole: user.role,
        createdAt: new Date().toISOString()
      };

      const index = reports.findIndex(r => r.id === payload.id);
      if (index >= 0) reports[index] = payload;
      else reports.push(payload);

      saveReports(reports);
      document.getElementById('report-modal').classList.remove('active');
      window.HMS.utils.showToast(editId ? 'Report updated' : 'Report uploaded', 'success');
      renderReports();
    }
  }

  function handleAction(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const reports = loadReports();
    const report = reports.find(r => r.id === button.dataset.id);
    if (!report) return;

    if (button.dataset.action === 'edit') openForm(report);
    if (button.dataset.action === 'delete') {
      window.HMS.utils.confirmAction('Delete this report?', () => {
        const next = reports.filter(r => r.id !== report.id);
        saveReports(next);
        renderReports();
        window.HMS.utils.showToast('Report deleted', 'success');
      });
    }
    if (button.dataset.action === 'view') viewReport(report);
    if (button.dataset.action === 'print') printReport(report);
    if (button.dataset.action === 'download') downloadReport(report);
  }

  function viewReport(report) {
    const win = window.open('', '_blank');
    let content = `
      <html><head><title>${report.type} - ${report.patientName}</title>
      <style>
        body{font-family:Arial;padding:30px;max-width:700px;margin:auto;}
        .header{text-align:center;border-bottom:2px solid #1f78d1;padding-bottom:15px;margin-bottom:20px;}
        .header h1{color:#1f78d1;margin:0;}
        .details{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        .details div{padding:8px;border-bottom:1px solid #eee;}
        .desc{background:#f9f9f9;padding:15px;border-radius:10px;margin:15px 0;}
        .footer{text-align:center;margin-top:30px;color:#888;font-size:0.9rem;}
      </style></head><body>
      <div class="header">
        <h1>Northstar Hospital</h1>
        <p>Medical Report</p>
      </div>
      <div class="details">
        <div><strong>Report Type:</strong> ${report.type}</div>
        <div><strong>Patient:</strong> ${report.patientName} (${report.patientId})</div>
        <div><strong>Doctor:</strong> ${report.doctor || '—'}</div>
        <div><strong>Department:</strong> ${report.department || '—'}</div>
        <div><strong>Date:</strong> ${report.date}</div>
      ${report.description ? `<div class="desc"><strong>Description:</strong><br>${report.description}</div>` : ''}
    `;

    if (report.fileData && report.fileData.startsWith('data:image')) {
      content += `<div style="text-align:center;margin:20px 0;"><img src="${report.fileData}" alt="Report Image" style="max-width:100%;max-height:500px;border-radius:10px;border:1px solid #ddd;" /></div>`;
    } else if (report.fileData && report.fileData.startsWith('data:application/pdf')) {
      content += `<div style="text-align:center;margin:20px 0;"><iframe src="${report.fileData}" style="width:100%;height:600px;border:1px solid #ddd;border-radius:10px;"></iframe></div>`;
    }

    content += `
      <div class="footer">Generated on ${new Date().toLocaleDateString()} · Northstar Hospital Management System</div>
      </body></html>
    `;

    win.document.write(content);
    win.document.close();
  }

  function printReport(report) {
    viewReport(report);
  }

  function downloadReport(report) {
    if (report.fileData) {
      const link = document.createElement('a');
      link.href = report.fileData;
      link.download = report.fileName || `${report.type}-${report.patientName}.pdf`;
      link.click();
    } else {
      const content = `
        Report Type: ${report.type}
        Patient: ${report.patientName} (${report.patientId})
        Doctor: ${report.doctor || '—'}
        Department: ${report.department || '—'}
        Date: ${report.date}
        Description: ${report.description || '—'}
        ---
        Northstar Hospital - Medical Report
        Generated: ${new Date().toLocaleString()}
      `;
      const blob = new Blob([content], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${report.type}-${report.patientName}.txt`;
      link.click();
      URL.revokeObjectURL(link.href);
    }
  }

  function updateReportStats() {
    const reports = loadReports();
    const totalEl = document.getElementById('report-total');
    if (totalEl) totalEl.textContent = reports.length;
  }

  function init() {
    if (document.body.dataset.page !== 'reports') return;

    const user = getCurrentUser();

    // Restrict upload to Doctor role
    const uploadBtn = document.getElementById('upload-report-btn');
    if (uploadBtn) {
      if (user.role === 'Doctor') {
        uploadBtn.style.display = '';
      } else {
        uploadBtn.style.display = 'none';
      }
    }

    // Add toolbar if not present
    const section = document.querySelector('.page-card');
    if (section && !document.getElementById('report-search')) {
      const toolbar = document.createElement('div');
      toolbar.className = 'toolbar';
      toolbar.innerHTML = `
        <input id="report-search" type="search" placeholder="Search reports..." style="flex:1;max-width:300px;">
        <select id="report-type-filter">
          <option value="all">All Types</option>
          <option value="Lab Report">Lab Report</option>
          <option value="Prescription">Prescription</option>
          <option value="Scan Report">Scan Report</option>
          <option value="X-Ray">X-Ray</option>
          <option value="MRI">MRI</option>
          <option value="CT Scan">CT Scan</option>
          <option value="Blood Report">Blood Report</option>
          <option value="Ultrasound">Ultrasound</option>
          <option value="ECG">ECG</option>
        </select>
        <span id="report-total" style="color:var(--muted);font-size:0.9rem;padding:8px 0;"></span>
      `;
      document.querySelector('.card-head')?.after(toolbar);
      toolbar.addEventListener('change', renderReports);
      toolbar.addEventListener('input', renderReports);
    }

    // Add report grid container
    const output = document.getElementById('report-output');
    if (output) {
      output.innerHTML = '<div class="grid-cards" id="report-list"></div>';
    }

    document.getElementById('upload-report-btn')?.addEventListener('click', () => openForm());
    document.getElementById('report-form')?.addEventListener('submit', handleSubmit);

    // Use document-level event delegation since report-list is dynamically created
    document.addEventListener('click', (event) => {
      const list = document.getElementById('report-list');
      if (list && list.contains(event.target)) {
        handleAction(event);
      }
    });

    renderReports();
    updateReportStats();
  }

  document.addEventListener('hms:page-ready', init);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
