// Doctor management module with CRUD.
(() => {
  function loadDoctors() {
    const state = window.HMS.storage.loadData();
    return state.doctors || [];
  }

  function saveDoctors(doctors) {
    const state = window.HMS.storage.loadData();
    state.doctors = doctors;
    window.HMS.storage.saveData(state);
  }

  function renderDoctors() {
    const tbody = document.getElementById('doctors-table-body');
    if (!tbody) return;
    const doctors = loadDoctors();
    tbody.innerHTML = doctors.map((doctor) => `
      <tr>
        <td>${doctor.id}</td>
        <td>${window.HMS.utils.escapeHtml(doctor.name)}</td>
        <td>${window.HMS.utils.escapeHtml(doctor.department)}</td>
        <td>${window.HMS.utils.escapeHtml(doctor.qualification)}</td>
        <td>${doctor.experience} yrs</td>
        <td>${window.HMS.utils.escapeHtml(doctor.availability)}</td>
        <td>${window.HMS.utils.formatCurrency(doctor.fees)}</td>
        <td>
          <button class="action-btn" data-action="edit" data-id="${doctor.id}">Edit</button>
          <button class="action-btn delete" data-action="delete" data-id="${doctor.id}">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  function openForm(doctor = null) {
    const modal = document.getElementById('doctor-modal');
    const title = document.getElementById('doctor-modal-title');
    if (!modal || !title) return;
    const form = document.getElementById('doctor-form');
    form.reset();
    document.getElementById('doctor-id').value = doctor ? doctor.id : '';
    document.getElementById('doctor-name').value = doctor?.name || '';
    document.getElementById('doctor-department').value = doctor?.department || '';
    document.getElementById('doctor-qualification').value = doctor?.qualification || '';
    document.getElementById('doctor-experience').value = doctor?.experience || '';
    document.getElementById('doctor-phone').value = doctor?.phone || '';
    document.getElementById('doctor-email').value = doctor?.email || '';
    document.getElementById('doctor-availability').value = doctor?.availability || '';
    document.getElementById('doctor-fees').value = doctor?.fees || '';
    title.textContent = doctor ? 'Edit Doctor' : 'Add Doctor';
    modal.classList.add('active');
  }

  function handleSubmit(event) {
    event.preventDefault();
    const doctors = loadDoctors();
    const payload = {
      id: document.getElementById('doctor-id').value || window.HMS.utils.generateId('D', doctors),
      name: document.getElementById('doctor-name').value.trim(),
      department: document.getElementById('doctor-department').value.trim(),
      qualification: document.getElementById('doctor-qualification').value.trim(),
      experience: Number(document.getElementById('doctor-experience').value || 0),
      phone: document.getElementById('doctor-phone').value.trim(),
      email: document.getElementById('doctor-email').value.trim(),
      availability: document.getElementById('doctor-availability').value.trim(),
      fees: Number(document.getElementById('doctor-fees').value || 0)
    };
    const index = doctors.findIndex((item) => item.id === payload.id);
    if (index >= 0) doctors[index] = payload; else doctors.push(payload);
    saveDoctors(doctors);
    document.getElementById('doctor-modal').classList.remove('active');
    window.HMS.utils.showToast('Doctor saved', 'success');
    renderDoctors();
  }

  function handleAction(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const doctors = loadDoctors();
    const doctor = doctors.find((item) => item.id === button.dataset.id);
    if (!doctor) return;
    if (button.dataset.action === 'edit') openForm(doctor);
    if (button.dataset.action === 'delete') {
      window.HMS.utils.confirmAction('Delete this doctor?', () => {
        const next = doctors.filter((item) => item.id !== doctor.id);
        saveDoctors(next);
        renderDoctors();
        window.HMS.utils.showToast('Doctor deleted', 'success');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (document.body.dataset.page !== 'doctors') return;
    window.HMS.ui.initCommon();
    document.getElementById('add-doctor-btn')?.addEventListener('click', () => openForm());
    document.getElementById('doctor-form')?.addEventListener('submit', handleSubmit);
    document.getElementById('doctors-table-body')?.addEventListener('click', handleAction);
    renderDoctors();
  });
})();
