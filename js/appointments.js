// Appointment scheduling and state management.
(() => {
  function loadAppointments() {
    const state = window.HMS.storage.loadData();
    return state.appointments || [];
  }

  function saveAppointments(appointments) {
    const state = window.HMS.storage.loadData();
    state.appointments = appointments;
    window.HMS.storage.saveData(state);
  }

  function renderAppointments() {
    const tbody = document.getElementById('appointments-table-body');
    if (!tbody) return;
    const appointments = loadAppointments();
    tbody.innerHTML = appointments.map((appointment) => `
      <tr>
        <td>${appointment.id}</td>
        <td>${window.HMS.utils.escapeHtml(appointment.patient)}</td>
        <td>${window.HMS.utils.escapeHtml(appointment.doctor)}</td>
        <td>${window.HMS.utils.escapeHtml(appointment.department)}</td>
        <td>${appointment.date}</td>
        <td>${appointment.time}</td>
        <td>${appointment.status}</td>
        <td>
          <button class="action-btn" data-action="edit" data-id="${appointment.id}">Edit</button>
          <button class="action-btn delete" data-action="delete" data-id="${appointment.id}">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  function openForm(appointment = null) {
    const modal = document.getElementById('appointment-modal');
    const title = document.getElementById('appointment-modal-title');
    if (!modal || !title) return;
    const form = document.getElementById('appointment-form');
    form.reset();
    document.getElementById('appointment-id').value = appointment ? appointment.id : '';
    document.getElementById('appointment-patient').value = appointment?.patient || '';
    document.getElementById('appointment-doctor').value = appointment?.doctor || '';
    document.getElementById('appointment-department').value = appointment?.department || '';
    document.getElementById('appointment-date').value = appointment?.date || window.HMS.utils.getToday();
    document.getElementById('appointment-time').value = appointment?.time || '09:00';
    document.getElementById('appointment-status').value = appointment?.status || 'Scheduled';
    title.textContent = appointment ? 'Edit Appointment' : 'Book Appointment';
    modal.classList.add('active');
  }

  function handleSubmit(event) {
    event.preventDefault();
    const appointments = loadAppointments();
    const payload = {
      id: document.getElementById('appointment-id').value || window.HMS.utils.generateId('A', appointments),
      patient: document.getElementById('appointment-patient').value.trim(),
      doctor: document.getElementById('appointment-doctor').value.trim(),
      department: document.getElementById('appointment-department').value.trim(),
      date: document.getElementById('appointment-date').value,
      time: document.getElementById('appointment-time').value,
      status: document.getElementById('appointment-status').value
    };
    const index = appointments.findIndex((item) => item.id === payload.id);
    if (index >= 0) appointments[index] = payload; else appointments.push(payload);
    saveAppointments(appointments);
    document.getElementById('appointment-modal').classList.remove('active');
    window.HMS.utils.showToast('Appointment saved', 'success');
    renderAppointments();
  }

  function handleAction(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const appointments = loadAppointments();
    const appointment = appointments.find((item) => item.id === button.dataset.id);
    if (!appointment) return;
    if (button.dataset.action === 'edit') openForm(appointment);
    if (button.dataset.action === 'delete') {
      window.HMS.utils.confirmAction('Cancel this appointment?', () => {
        const next = appointments.filter((item) => item.id !== appointment.id);
        saveAppointments(next);
        renderAppointments();
        window.HMS.utils.showToast('Appointment cancelled', 'success');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (document.body.dataset.page !== 'appointments') return;
    window.HMS.ui.initCommon();
    document.getElementById('add-appointment-btn')?.addEventListener('click', () => openForm());
    document.getElementById('appointment-form')?.addEventListener('submit', handleSubmit);
    document.getElementById('appointments-table-body')?.addEventListener('click', handleAction);
    renderAppointments();
  });
})();
