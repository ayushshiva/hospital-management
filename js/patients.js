// Patient management module with CRUD, search, filter, sort, pagination, and CSV export.
(() => {
  const pageSize = 6;
  let currentPage = 1;
  let currentItems = [];

  function loadPatients() {
    const state = window.HMS.storage.loadData();
    return state.patients || [];
  }

  function savePatients(patients) {
    const state = window.HMS.storage.loadData();
    state.patients = patients;
    window.HMS.storage.saveData(state);
  }

  function renderPatients() {
    const patients = loadPatients();
    const search = document.getElementById('patient-search').value.toLowerCase();
    const status = document.getElementById('patient-status-filter').value;
    const sort = document.getElementById('patient-sort').value;
    let filtered = patients.filter((patient) => {
      const matchesSearch = [patient.name, patient.disease, patient.phone].join(' ').toLowerCase().includes(search);
      const matchesStatus = status === 'all' || patient.status === status;
      return matchesSearch && matchesStatus;
    });

    if (sort === 'name') filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'age') filtered = filtered.sort((a, b) => a.age - b.age);
    if (sort === 'newest') filtered = filtered.reverse();

    currentItems = filtered;
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);
    const pageItems = window.HMS.utils.paginate(filtered, currentPage, pageSize);
    const tbody = document.getElementById('patients-table-body');
    if (!tbody) return;
    tbody.innerHTML = pageItems.length ? pageItems.map((patient) => `
      <tr>
        <td>${patient.id}</td>
        <td>${window.HMS.utils.escapeHtml(patient.name)}</td>
        <td>${patient.age}</td>
        <td>${patient.gender}</td>
        <td>${window.HMS.utils.escapeHtml(patient.disease)}</td>
        <td>${window.HMS.utils.escapeHtml(patient.doctorAssigned || '—')}</td>
        <td><span class="status-pill active">${patient.status}</span></td>
        <td>
          <button class="action-btn" data-action="edit" data-id="${patient.id}">Edit</button>
          <button class="action-btn delete" data-action="delete" data-id="${patient.id}">Delete</button>
        </td>
      </tr>
    `).join('') : '<tr><td colspan="8">No patients found</td></tr>';
    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    const container = document.getElementById('patient-pagination');
    if (!container) return;
    container.innerHTML = '';
    for (let index = 1; index <= totalPages; index += 1) {
      const button = document.createElement('button');
      button.className = 'page-btn';
      button.textContent = index;
      button.disabled = index === currentPage;
      button.addEventListener('click', () => {
        currentPage = index;
        renderPatients();
      });
      container.appendChild(button);
    }
  }

  function openForm(patient = null) {
    const modal = document.getElementById('patient-modal');
    const title = document.getElementById('patient-modal-title');
    if (!modal || !title) return;
    const form = document.getElementById('patient-form');
    form.reset();
    document.getElementById('patient-id').value = patient ? patient.id : '';
    document.getElementById('patient-name').value = patient?.name || '';
    document.getElementById('patient-age').value = patient?.age || '';
    document.getElementById('patient-gender').value = patient?.gender || 'Male';
    document.getElementById('patient-blood').value = patient?.bloodGroup || '';
    document.getElementById('patient-phone').value = patient?.phone || '';
    document.getElementById('patient-email').value = patient?.email || '';
    document.getElementById('patient-address').value = patient?.address || '';
    document.getElementById('patient-disease').value = patient?.disease || '';
    document.getElementById('patient-doctor').value = patient?.doctorAssigned || '';
    document.getElementById('patient-admission').value = patient?.admissionDate || window.HMS.utils.getToday();
    document.getElementById('patient-status').value = patient?.status || 'Admitted';
    title.textContent = patient ? 'Edit Patient' : 'Add Patient';
    modal.classList.add('active');
  }

  function handleSubmit(event) {
    event.preventDefault();
    const patients = loadPatients();
    const patientId = document.getElementById('patient-id').value;
    const payload = {
      id: patientId || window.HMS.utils.generateId('P', patients),
      name: document.getElementById('patient-name').value.trim(),
      age: Number(document.getElementById('patient-age').value),
      gender: document.getElementById('patient-gender').value,
      bloodGroup: document.getElementById('patient-blood').value.trim(),
      phone: document.getElementById('patient-phone').value.trim(),
      email: document.getElementById('patient-email').value.trim(),
      address: document.getElementById('patient-address').value.trim(),
      disease: document.getElementById('patient-disease').value.trim(),
      doctorAssigned: document.getElementById('patient-doctor').value.trim(),
      admissionDate: document.getElementById('patient-admission').value,
      status: document.getElementById('patient-status').value
    };
    if (!payload.name || !payload.phone) return window.HMS.utils.showToast('Name and phone are required', 'error');
    const existingIndex = patients.findIndex((item) => item.id === payload.id);
    if (existingIndex >= 0) patients[existingIndex] = payload; else patients.push(payload);
    savePatients(patients);
    document.getElementById('patient-modal').classList.remove('active');
    window.HMS.utils.showToast('Patient saved', 'success');
    renderPatients();
  }

  function handleAction(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const patients = loadPatients();
    const patient = patients.find((item) => item.id === button.dataset.id);
    if (!patient) return;
    if (button.dataset.action === 'edit') openForm(patient);
    if (button.dataset.action === 'delete') {
      window.HMS.utils.confirmAction('Delete this patient record?', () => {
        const next = patients.filter((item) => item.id !== patient.id);
        savePatients(next);
        window.HMS.utils.showToast('Patient deleted', 'success');
        renderPatients();
      });
    }
  }

  function exportCsv() {
    const patients = loadPatients();
    const rows = [
      ['ID', 'Name', 'Age', 'Gender', 'Blood Group', 'Phone', 'Email', 'Address', 'Disease', 'Doctor Assigned', 'Admission Date', 'Status'],
      ...patients.map((patient) => [patient.id, patient.name, patient.age, patient.gender, patient.bloodGroup, patient.phone, patient.email, patient.address, patient.disease, patient.doctorAssigned, patient.admissionDate, patient.status])
    ];
    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'patients.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (document.body.dataset.page !== 'patients') return;
    window.HMS.ui.initCommon();
    const addButton = document.getElementById('add-patient-btn');
    if (addButton) addButton.addEventListener('click', () => openForm());
    const form = document.getElementById('patient-form');
    if (form) form.addEventListener('submit', handleSubmit);
    const search = document.getElementById('patient-search');
    if (search) search.addEventListener('input', renderPatients);
    document.getElementById('patient-status-filter')?.addEventListener('change', renderPatients);
    document.getElementById('patient-sort')?.addEventListener('change', renderPatients);
    document.getElementById('export-patients-btn')?.addEventListener('click', exportCsv);
    document.getElementById('patients-table-body')?.addEventListener('click', handleAction);
    renderPatients();
  });
})();
