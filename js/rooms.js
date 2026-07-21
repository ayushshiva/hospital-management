// Room Management Module — Full CRUD with LocalStorage persistence.
// Features: Add, Edit, Delete, Search, Filter by status/type, Print, Export CSV.
(() => {
  'use strict';

  // ----- Data Access -----
  function loadRooms() {
    const state = window.HMS.storage.loadData();
    return state.rooms || [];
  }

  function saveRooms(rooms) {
    const state = window.HMS.storage.loadData();
    state.rooms = rooms;
    window.HMS.storage.saveData(state);
  }

  // ----- Render Grid -----
  function renderRooms() {
    const container = document.getElementById('rooms-grid');
    if (!container) return;
    const rooms = loadRooms();
    const searchTerm = (document.getElementById('room-search')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('room-status-filter')?.value || 'all';
    const typeFilter = document.getElementById('room-type-filter')?.value || 'all';

    const filtered = rooms.filter(r => {
      const matchesSearch = [r.number, r.type, r.assignedPatient || ''].join(' ').toLowerCase().includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesType = typeFilter === 'all' || r.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });

    container.innerHTML = filtered.map(r => `
      <div class="grid-card">
        <div class="card-head" style="margin-bottom:8px;">
          <h4>Room ${window.HMS.utils.escapeHtml(r.number)}</h4>
          <span class="status-pill ${r.status === 'Available' ? 'active' : 'inactive'}">${r.status}</span>
        </div>
        <p><strong>Type:</strong> ${window.HMS.utils.escapeHtml(r.type)}</p>
        <p><strong>Ward:</strong> ${window.HMS.utils.escapeHtml(r.ward || '—')}</p>
        <p><strong>Floor:</strong> ${r.floor || '—'}</p>
        <p><strong>Beds:</strong> ${r.bedCount || 0}</p>
        <p><strong>Price/Day:</strong> ${window.HMS.utils.formatCurrency(r.pricePerDay || 0)}</p>
        ${r.assignedPatient ? `<p><strong>Patient:</strong> ${window.HMS.utils.escapeHtml(r.assignedPatient)}</p>` : ''}
        <p><strong>Features:</strong> ${(r.features || []).join(', ') || '—'}</p>
        <div style="display:flex;gap:8px;margin-top:10px;">
          <button class="action-btn" data-action="edit" data-id="${r.id}">Edit</button>
          <button class="action-btn delete" data-action="delete" data-id="${r.id}">Delete</button>
        </div>
      </div>
    `).join('') || '<p style="grid-column:1/-1;text-align:center;color:var(--muted);">No rooms found</p>';
  }

  // ----- Open Modal -----
  function openForm(room = null) {
    const modal = document.getElementById('room-modal');
    const title = document.getElementById('room-modal-title');
    if (!modal || !title) return;

    document.getElementById('room-form').reset();
    document.getElementById('room-id').value = room ? room.id : '';
    document.getElementById('room-number').value = room?.number || '';
    document.getElementById('room-type').value = room?.type || '';
    document.getElementById('room-ward').value = room?.ward || '';
    document.getElementById('room-floor').value = room?.floor || '';
    document.getElementById('room-bed-count').value = room?.bedCount || '';
    document.getElementById('room-price').value = room?.pricePerDay || '';
    document.getElementById('room-status').value = room?.status || 'Available';
    document.getElementById('room-patient').value = room?.assignedPatient || '';
    document.getElementById('room-admission').value = room?.admissionDate || '';
    document.getElementById('room-discharge').value = room?.dischargeDate || '';

    // Features checkboxes
    const features = room?.features || [];
    document.querySelectorAll('input[name="room-features"]').forEach(cb => {
      cb.checked = features.includes(cb.value);
    });

    title.textContent = room ? 'Edit Room' : 'Add Room';
    modal.classList.add('active');
  }

  // ----- Form Submit -----
  function handleSubmit(event) {
    event.preventDefault();
    const rooms = loadRooms();
    const editId = document.getElementById('room-id').value;
    const number = document.getElementById('room-number').value.trim();

    if (!number) {
      window.HMS.utils.showToast('Room number is required', 'error');
      return;
    }

    // Prevent duplicate room numbers
    const duplicate = rooms.find(r => r.number.toLowerCase() === number.toLowerCase() && r.id !== editId);
    if (duplicate) {
      window.HMS.utils.showToast('Room number already exists', 'error');
      return;
    }

    // Gather selected features
    const features = [];
    document.querySelectorAll('input[name="room-features"]:checked').forEach(cb => {
      features.push(cb.value);
    });

    const payload = {
      id: editId || window.HMS.utils.generateId('R', rooms),
      number: number,
      type: document.getElementById('room-type').value.trim(),
      ward: document.getElementById('room-ward').value.trim(),
      floor: Number(document.getElementById('room-floor').value || 0),
      bedCount: Number(document.getElementById('room-bed-count').value || 0),
      pricePerDay: Number(document.getElementById('room-price').value || 0),
      status: document.getElementById('room-status').value,
      assignedPatient: document.getElementById('room-patient').value.trim(),
      admissionDate: document.getElementById('room-admission').value,
      dischargeDate: document.getElementById('room-discharge').value,
      features: features
    };

    const index = rooms.findIndex(r => r.id === payload.id);
    if (index >= 0) rooms[index] = payload;
    else rooms.push(payload);

    saveRooms(rooms);
    document.getElementById('room-modal').classList.remove('active');
    window.HMS.utils.showToast(editId ? 'Room updated' : 'Room added', 'success');
    renderRooms();
  }

  // ----- Inline Actions (Edit / Delete) -----
  function handleAction(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const rooms = loadRooms();
    const room = rooms.find(r => r.id === button.dataset.id);
    if (!room) return;

    if (button.dataset.action === 'edit') openForm(room);
    if (button.dataset.action === 'delete') {
      window.HMS.utils.confirmAction(`Delete room ${room.number}?`, () => {
        const next = rooms.filter(r => r.id !== room.id);
        saveRooms(next);
        renderRooms();
        window.HMS.utils.showToast('Room deleted', 'success');
      });
    }
  }

  // ----- Print -----
  function printRooms() {
    const rooms = loadRooms();
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Rooms List</title>
      <style>body{font-family:Arial;padding:20px;}table{width:100%;border-collapse:collapse;}
      th,td{padding:8px 12px;border:1px solid #ddd;text-align:left;}th{background:#1f78d1;color:white;}
      h2{color:#1f78d1;}</style></head><body>
      <h2>Northstar Hospital — Rooms</h2>
      <table><thead><tr><th>Number</th><th>Type</th><th>Ward</th><th>Floor</th><th>Beds</th><th>Price/Day</th><th>Status</th><th>Patient</th></tr></thead>
      <tbody>${rooms.map(r => `<tr><td>${r.number}</td><td>${r.type}</td><td>${r.ward || '—'}</td><td>${r.floor || 0}</td><td>${r.bedCount || 0}</td><td>₹${r.pricePerDay || 0}</td><td>${r.status}</td><td>${r.assignedPatient || '—'}</td></tr>`).join('')}</tbody>
      </table></body></html>
    `);
    win.document.close();
    win.print();
  }

  // ----- Export CSV -----
  function exportCsv() {
    const rooms = loadRooms();
    const rows = [
      ['Number', 'Type', 'Ward', 'Floor', 'Beds', 'Price/Day', 'Status', 'Patient', 'Features'],
      ...rooms.map(r => [r.number, r.type, r.ward || '', r.floor || 0, r.bedCount || 0, r.pricePerDay || 0, r.status, r.assignedPatient || '', (r.features || []).join('; ')])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'rooms.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // ----- Initialize -----
  function init() {
    if (document.body.dataset.page !== 'rooms') return;

    // Add toolbar filters if not present
    const section = document.querySelector('.page-card');
    if (section && !document.getElementById('room-search')) {
      const toolbar = document.createElement('div');
      toolbar.className = 'toolbar';
      toolbar.innerHTML = `
        <input id="room-search" type="search" placeholder="Search rooms..." style="flex:1;max-width:300px;">
        <select id="room-status-filter"><option value="all">All Status</option><option value="Available">Available</option><option value="Occupied">Occupied</option><option value="Cleaning">Cleaning</option><option value="Maintenance">Maintenance</option></select>
        <select id="room-type-filter"><option value="all">All Types</option><option value="ICU">ICU</option><option value="General">General</option><option value="Private">Private</option><option value="Deluxe">Deluxe</option><option value="Ward">Ward</option></select>
      `;
      document.querySelector('.card-head')?.after(toolbar);
      toolbar.addEventListener('change', renderRooms);
      toolbar.addEventListener('input', renderRooms);
    }

    document.getElementById('add-room-btn')?.addEventListener('click', () => openForm());
    document.getElementById('room-form')?.addEventListener('submit', handleSubmit);
    document.getElementById('rooms-grid')?.addEventListener('click', handleAction);

    // Add action buttons
    const cardHead = document.querySelector('.card-head');
    if (cardHead && !document.getElementById('print-rooms-btn')) {
      const printBtn = document.createElement('button');
      printBtn.id = 'print-rooms-btn';
      printBtn.className = 'btn btn-secondary';
      printBtn.textContent = 'Print';
      printBtn.addEventListener('click', printRooms);
      cardHead.appendChild(printBtn);

      const exportBtn = document.createElement('button');
      exportBtn.id = 'export-rooms-btn';
      exportBtn.className = 'btn btn-secondary';
      exportBtn.textContent = 'Export CSV';
      exportBtn.addEventListener('click', exportCsv);
      cardHead.appendChild(exportBtn);
    }

    renderRooms();
  }

  document.addEventListener('hms:page-ready', init);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

