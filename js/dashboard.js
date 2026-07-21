// Dashboard Statistics Module — Auto-updates all stats from every module in LocalStorage.
// Runs on dashboard page load and recalculates all metrics.
(() => {
  'use strict';

  function updateDashboard() {
    const state = window.HMS.storage.loadData();

    const patients = state.patients || [];
    const doctors = state.doctors || [];
    const appointments = state.appointments || [];
    const rooms = state.rooms || [];
    const bills = state.bills || [];
    const medicines = state.medicines || [];
    const staff = state.staff || [];
    const departments = state.departments || [];

    // Total Patients
    const statPatients = document.getElementById('stat-patients');
    if (statPatients) statPatients.textContent = patients.length;

    // Today's Appointments
    const today = window.HMS.utils.getToday();
    const todayAppointments = appointments.filter(a => a.date === today);
    const statAppointments = document.getElementById('stat-appointments');
    if (statAppointments) statAppointments.textContent = todayAppointments.length;

    // Doctors Available
    const statDoctors = document.getElementById('stat-doctors');
    if (statDoctors) statDoctors.textContent = doctors.length;

    // Total Rooms
    const statRoomsTotal = document.getElementById('stat-rooms-total');
    if (statRoomsTotal) statRoomsTotal.textContent = rooms.length;

    // Rooms Occupied
    const occupiedRooms = rooms.filter(r => r.status === 'Occupied').length;
    const statRooms = document.getElementById('stat-rooms');
    if (statRooms) statRooms.textContent = occupiedRooms;

    // Pending Bills
    const pendingBills = bills.filter(b => (b.remainingAmount || b.grandTotal || 0) > 0).length;
    const statBills = document.getElementById('stat-bills');
    if (statBills) statBills.textContent = pendingBills;

    // Total Revenue
    const totalRevenue = bills.reduce((sum, b) => sum + Number(b.grandTotal || b.total || 0), 0);
    const statRevenue = document.getElementById('stat-revenue');
    if (statRevenue) statRevenue.textContent = window.HMS.utils.formatCurrency(totalRevenue);

    // Total Staff
    const statStaff = document.getElementById('stat-staff');
    if (statStaff) statStaff.textContent = staff.length;

    // Total Medicines
    const statMedicines = document.getElementById('stat-medicines');
    if (statMedicines) statMedicines.textContent = medicines.length;

    // Total Departments
    const statDepartments = document.getElementById('stat-departments');
    if (statDepartments) statDepartments.textContent = departments.length;

    // Monthly Revenue (current month)
    const currentMonth = today.slice(0, 7);
    const monthlyRevenue = bills
      .filter(b => (b.date || '').startsWith(currentMonth))
      .reduce((sum, b) => sum + Number(b.grandTotal || b.total || 0), 0);
    const statMonthlyRevenue = document.getElementById('stat-monthly-revenue');
    if (statMonthlyRevenue) statMonthlyRevenue.textContent = window.HMS.utils.formatCurrency(monthlyRevenue);

    // Low Stock Medicines
    const lowStockCount = medicines.filter(m => m.quantity <= m.minStock).length;
    const statLowStock = document.getElementById('stat-low-stock');
    if (statLowStock) {
      statLowStock.textContent = lowStockCount;
      if (lowStockCount > 0) {
        statLowStock.style.color = 'var(--danger)';
      }
    }

    // Populate Recent Lists
    populateRecentLists(patients, appointments);
    populateNotifications(medicines, rooms, bills);
  }

  function populateRecentLists(patients, appointments) {
    const recentPatients = document.getElementById('recent-patients-list');
    const recentAppointments = document.getElementById('recent-appointments-list');

    if (recentPatients) {
      recentPatients.innerHTML = patients.slice(-5).reverse().map(p =>
        `<li><strong>${window.HMS.utils.escapeHtml(p.name)}</strong> · ${window.HMS.utils.escapeHtml(p.disease || '—')} · <span class="status-pill active" style="font-size:0.75rem;">${p.status}</span></li>`
      ).join('') || '<li style="color:var(--muted);">No patients yet</li>';
    }

    if (recentAppointments) {
      const today = window.HMS.utils.getToday();
      const todayApps = appointments.filter(a => a.date === today).slice(-5).reverse();
      recentAppointments.innerHTML = todayApps.length
        ? todayApps.map(a =>
            `<li><strong>${window.HMS.utils.escapeHtml(a.patient)}</strong> with ${window.HMS.utils.escapeHtml(a.doctor)} at ${a.time}</li>`
          ).join('')
        : appointments.slice(-5).reverse().map(a =>
            `<li><strong>${window.HMS.utils.escapeHtml(a.patient)}</strong> · ${a.date} · <span class="status-pill ${a.status === 'Scheduled' ? 'active' : 'inactive'}" style="font-size:0.75rem;">${a.status}</span></li>`
          ).join('') || '<li style="color:var(--muted);">No appointments yet</li>';
    }
  }

  function populateNotifications(medicines, rooms, bills) {
    const notifications = document.getElementById('notifications-list');
    if (!notifications) return;

    const notes = [];

    // Low stock alerts
    const lowStock = medicines.filter(m => m.quantity <= m.minStock);
    lowStock.forEach(m => {
      notes.push(`⚠️ Low stock: ${m.name} (${m.quantity} left)`);
    });

    // Overdue bills
    const pending = bills.filter(b => (b.remainingAmount || 0) > 0);
    if (pending.length > 0) {
      notes.push(`💰 ${pending.length} pending payment(s)`);
    }

    // Occupied rooms
    const occupied = rooms.filter(r => r.status === 'Occupied');
    if (occupied.length > 0) {
      notes.push(`🛏️ ${occupied.length} room(s) occupied`);
    }

    // Default notifications if nothing to show
    if (notes.length === 0) {
      notes.push('✅ All systems operational');
      notes.push('📋 No pending alerts');
    }

    notifications.innerHTML = notes.slice(0, 8).map(n => `<li>${n}</li>`).join('');
  }

  // Initialize dashboard
  function init() {
    if (document.body.dataset.page !== 'dashboard') return;

    // Expand stats grid to show more metrics
    const statsGrid = document.querySelector('.stats-grid');
    if (statsGrid && statsGrid.children.length < 9) {
      // Add extra stat cards if not already present
      const extraStats = [
        { id: 'stat-staff', label: 'Total Staff' },
        { id: 'stat-medicines', label: 'Total Medicines' },
        { id: 'stat-departments', label: 'Departments' },
        { id: 'stat-rooms-total', label: 'Total Rooms' },
        { id: 'stat-low-stock', label: 'Low Stock Alert' },
        { id: 'stat-monthly-revenue', label: 'Monthly Revenue' }
      ];

      // Check if they already exist
      extraStats.forEach(s => {
        if (!document.getElementById(s.id)) {
          const article = document.createElement('article');
          article.className = 'stat-card';
          article.innerHTML = `<h3>${s.label}</h3><p id="${s.id}">0</p>`;
          statsGrid.appendChild(article);
        }
      });
    }

    updateDashboard();

    // Re-run dashboard stats every time storage changes
    window.addEventListener('storage', updateDashboard);
    document.addEventListener('hms:storage-restored', updateDashboard);
  }

  document.addEventListener('hms:page-ready', init);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
