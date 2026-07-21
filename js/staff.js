// Staff Management Module — Full CRUD with salary calculation, salary slip, LocalStorage.
// Features: Add, Edit, Delete, Search, Filter, Print, Export CSV, Salary slip generation.
(() => {
  'use strict';

  function loadStaff() {
    const state = window.HMS.storage.loadData();
    return state.staff || [];
  }

  function saveStaff(staff) {
    const state = window.HMS.storage.loadData();
    state.staff = staff;
    window.HMS.storage.saveData(state);
  }

  function calculateNetSalary(member) {
    const base = Number(member.monthlySalary || 0);
    const workingDays = Number(member.workingDays || 0);
    const attended = Number(member.attendance || 0);
    const leaveDays = Number(member.leaveDays || 0);
    const overtime = Number(member.overtime || 0);
    const bonus = Number(member.bonus || 0);
    const deduction = Number(member.deduction || 0);

    // Base salary proportional to attendance
    let gross = 0;
    if (workingDays > 0) {
      gross = (base / workingDays) * attended;
    } else {
      gross = base;
    }
    // Overtime at 1.5x hourly rate (assuming 8hr days, 22 working days a month)
    const hourlyRate = workingDays > 0 ? base / (workingDays * 8) : base / (22 * 8);
    const overtimePay = overtime * hourlyRate * 1.5;
    const net = gross + overtimePay + bonus - deduction - leaveDays * (base / (workingDays || 22));
    return Math.max(0, Math.round(net));
  }

  function renderStaff() {
    const tbody = document.getElementById('staff-table-body');
    if (!tbody) return;
    const staff = loadStaff();
    const searchTerm = (document.getElementById('staff-search')?.value || '').toLowerCase();
    const roleFilter = document.getElementById('staff-role-filter')?.value || 'all';
    const deptFilter = document.getElementById('staff-dept-filter')?.value || 'all';

    const filtered = staff.filter(m => {
      const matchSearch = [m.name, m.role, m.department, m.phone].join(' ').toLowerCase().includes(searchTerm);
      const matchRole = roleFilter === 'all' || (m.role || '').toLowerCase() === roleFilter.toLowerCase();
      const matchDept = deptFilter === 'all' || (m.department || '').toLowerCase() === deptFilter.toLowerCase();
      return matchSearch && matchRole && matchDept;
    });

    tbody.innerHTML = filtered.map(m => {
      const netSalary = calculateNetSalary(m);
      return `<tr>
        <td>${m.id}</td>
        <td>${window.HMS.utils.escapeHtml(m.name)}</td>
        <td>${window.HMS.utils.escapeHtml(m.gender || '—')}</td>
        <td>${window.HMS.utils.escapeHtml(m.role)}</td>
        <td>${window.HMS.utils.escapeHtml(m.department || '—')}</td>
        <td>${window.HMS.utils.escapeHtml(m.phone)}</td>
        <td>${window.HMS.utils.formatCurrency(netSalary)}</td>
        <td><span class="status-pill ${m.paymentStatus === 'Paid' ? 'active' : 'inactive'}">${m.paymentStatus || 'Pending'}</span></td>
        <td>
          <button class="action-btn" data-action="edit" data-id="${m.id}">Edit</button>
          <button class="action-btn" data-action="salary" data-id="${m.id}">Salary</button>
          <button class="action-btn delete" data-action="delete" data-id="${m.id}">Del</button>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="9" style="text-align:center;">No staff found</td></tr>';
  }

  function openForm(member = null) {
    const modal = document.getElementById('staff-modal');
    const title = document.getElementById('staff-modal-title');
    if (!modal || !title) return;

    document.getElementById('staff-form').reset();
    document.getElementById('staff-id').value = member ? member.id : '';
    document.getElementById('staff-name').value = member?.name || '';
    document.getElementById('staff-gender').value = member?.gender || 'Male';
    document.getElementById('staff-phone').value = member?.phone || '';
    document.getElementById('staff-email').value = member?.email || '';
    document.getElementById('staff-address').value = member?.address || '';
    document.getElementById('staff-department').value = member?.department || '';
    document.getElementById('staff-role').value = member?.role || '';
    document.getElementById('staff-joining').value = member?.joiningDate || '';
    document.getElementById('staff-salary').value = member?.monthlySalary || '';
    document.getElementById('staff-attendance').value = member?.attendance || 0;
    document.getElementById('staff-working-days').value = member?.workingDays || 22;
    document.getElementById('staff-leave-days').value = member?.leaveDays || 0;
    document.getElementById('staff-overtime').value = member?.overtime || 0;
    document.getElementById('staff-bonus').value = member?.bonus || 0;
    document.getElementById('staff-deduction').value = member?.deduction || 0;
    document.getElementById('staff-payment-status').value = member?.paymentStatus || 'Pending';

    title.textContent = member ? 'Edit Staff' : 'Add Staff';
    modal.classList.add('active');
  }

  function handleSubmit(event) {
    event.preventDefault();
    const staff = loadStaff();
    const editId = document.getElementById('staff-id').value;
    const name = document.getElementById('staff-name').value.trim();

    if (!name) {
      window.HMS.utils.showToast('Staff name is required', 'error');
      return;
    }

    const monthlySalary = Number(document.getElementById('staff-salary').value || 0);
    const attendance = Number(document.getElementById('staff-attendance').value || 0);
    const workingDays = Number(document.getElementById('staff-working-days').value || 22);
    const leaveDays = Number(document.getElementById('staff-leave-days').value || 0);
    const overtime = Number(document.getElementById('staff-overtime').value || 0);
    const bonus = Number(document.getElementById('staff-bonus').value || 0);
    const deduction = Number(document.getElementById('staff-deduction').value || 0);

    const memberData = {
      id: editId || window.HMS.utils.generateId('S', staff),
      name: name,
      gender: document.getElementById('staff-gender').value,
      phone: document.getElementById('staff-phone').value.trim(),
      email: document.getElementById('staff-email').value.trim(),
      address: document.getElementById('staff-address').value.trim(),
      department: document.getElementById('staff-department').value.trim(),
      role: document.getElementById('staff-role').value.trim(),
      joiningDate: document.getElementById('staff-joining').value,
      monthlySalary: monthlySalary,
      attendance: attendance,
      workingDays: workingDays,
      leaveDays: leaveDays,
      overtime: overtime,
      bonus: bonus,
      deduction: deduction,
      netSalary: calculateNetSalary({ monthlySalary, attendance, workingDays, leaveDays, overtime, bonus, deduction }),
      paymentStatus: document.getElementById('staff-payment-status').value
    };

    const index = staff.findIndex(m => m.id === memberData.id);
    if (index >= 0) staff[index] = memberData;
    else staff.push(memberData);

    saveStaff(staff);
    document.getElementById('staff-modal').classList.remove('active');
    window.HMS.utils.showToast(editId ? 'Staff updated' : 'Staff added', 'success');
    renderStaff();
  }

  function handleAction(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const staff = loadStaff();
    const member = staff.find(m => m.id === button.dataset.id);
    if (!member) return;

    if (button.dataset.action === 'edit') openForm(member);
    if (button.dataset.action === 'delete') {
      window.HMS.utils.confirmAction(`Delete ${member.name}?`, () => {
        const next = staff.filter(m => m.id !== member.id);
        saveStaff(next);
        renderStaff();
        window.HMS.utils.showToast('Staff deleted', 'success');
      });
    }
    if (button.dataset.action === 'salary') {
      generateSalarySlip(member);
    }
  }

  function generateSalarySlip(member) {
    const netSalary = calculateNetSalary(member);
    const base = Number(member.monthlySalary || 0);
    const hourlyRate = member.workingDays > 0 ? base / (member.workingDays * 8) : base / (22 * 8);
    const overtimePay = Math.round(Number(member.overtime || 0) * hourlyRate * 1.5);

    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Salary Slip - ${member.name}</title>
      <style>
        body{font-family:Arial;padding:30px;max-width:700px;margin:auto;}
        .header{text-align:center;border-bottom:2px solid #1f78d1;padding-bottom:15px;margin-bottom:20px;}
        .header h1{color:#1f78d1;margin:0;}
        .details{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        .details div{padding:8px;border-bottom:1px solid #eee;}
        .total{background:#1f78d1;color:white;padding:15px;text-align:center;font-size:1.5rem;border-radius:10px;margin:20px 0;}
        table{width:100%;border-collapse:collapse;margin:15px 0;}
        th,td{padding:10px;border:1px solid #ddd;text-align:left;}
        th{background:#f5f5f5;}
        .footer{text-align:center;margin-top:30px;color:#888;font-size:0.9rem;}
        @media print{body{padding:15px;}}
      </style></head><body>
      <div class="header">
        <h1>Northstar Hospital</h1>
        <p>Salary Slip</p>
      </div>
      <div class="details">
        <div><strong>Employee ID:</strong> ${member.id}</div>
        <div><strong>Name:</strong> ${member.name}</div>
        <div><strong>Department:</strong> ${member.department || '—'}</div>
        <div><strong>Role:</strong> ${member.role}</div>
        <div><strong>Joining Date:</strong> ${member.joiningDate || '—'}</div>
        <div><strong>Payment Status:</strong> ${member.paymentStatus || 'Pending'}</div>
      </div>
      <h3>Salary Breakdown</h3>
      <table>
        <tr><th>Component</th><th>Amount (₹)</th></tr>
        <tr><td>Monthly Salary (Base)</td><td>${base}</td></tr>
        <tr><td>Attendance (${member.attendance || 0}/${member.workingDays || 22} days)</td><td>${member.workingDays > 0 ? Math.round(base / member.workingDays * (member.attendance || 0)) : base}</td></tr>
        <tr><td>Overtime (${member.overtime || 0} hrs)</td><td>${overtimePay}</td></tr>
        <tr><td>Bonus</td><td>${Number(member.bonus || 0)}</td></tr>
        <tr><td>Leave Deduction (${member.leaveDays || 0} days)</td><td>-${member.workingDays > 0 ? Math.round(base / member.workingDays * (member.leaveDays || 0)) : 0}</td></tr>
        <tr><td>Other Deduction</td><td>-${Number(member.deduction || 0)}</td></tr>
        <tr style="font-weight:bold;background:#f0f7ff;"><td>Net Salary</td><td>${netSalary}</td></tr>
      </table>
      <div class="total">Net Payable: ₹${netSalary}</div>
      <div class="footer">Generated on ${new Date().toLocaleDateString()} · Northstar Hospital Management System</div>
      <div style="text-align:center;margin-top:20px;">
        <button onclick="window.print()" style="padding:10px 20px;background:#1f78d1;color:white;border:none;border-radius:8px;cursor:pointer;">Print Salary Slip</button>
      </div>
      </body></html>
    `);
    win.document.close();
  }

  function printStaff() {
    const staff = loadStaff();
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Staff List</title>
      <style>body{font-family:Arial;padding:20px;}table{width:100%;border-collapse:collapse;}
      th,td{padding:8px;border:1px solid #ddd;text-align:left;}th{background:#1f78d1;color:white;}
      h2{color:#1f78d1;}</style></head><body>
      <h2>Northstar Hospital — Staff Directory</h2>
      <table><thead><tr><th>ID</th><th>Name</th><th>Role</th><th>Dept</th><th>Phone</th><th>Salary</th><th>Status</th></tr></thead>
      <tbody>${staff.map(m => `<tr><td>${m.id}</td><td>${m.name}</td><td>${m.role}</td><td>${m.department || '—'}</td><td>${m.phone || '—'}</td><td>₹${calculateNetSalary(m)}</td><td>${m.paymentStatus || 'Pending'}</td></tr>`).join('')}</tbody></table></body></html>
    `);
    win.document.close();
    win.print();
  }

  function exportCsv() {
    const staff = loadStaff();
    const rows = [
      ['ID', 'Name', 'Gender', 'Phone', 'Email', 'Address', 'Department', 'Role', 'Joining Date', 'Monthly Salary', 'Attendance', 'Working Days', 'Leave Days', 'Overtime', 'Bonus', 'Deduction', 'Net Salary', 'Payment Status'],
      ...staff.map(m => [m.id, m.name, m.gender, m.phone, m.email, m.address, m.department, m.role, m.joiningDate, m.monthlySalary, m.attendance, m.workingDays, m.leaveDays, m.overtime, m.bonus, m.deduction, calculateNetSalary(m), m.paymentStatus])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'staff.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function init() {
    if (document.body.dataset.page !== 'staff') return;

    const section = document.querySelector('.page-card');
    if (section && !document.getElementById('staff-search')) {
      const toolbar = document.createElement('div');
      toolbar.className = 'toolbar';
      toolbar.innerHTML = `
        <input id="staff-search" type="search" placeholder="Search staff..." style="flex:1;max-width:250px;">
        <select id="staff-role-filter"><option value="all">All Roles</option><option value="Doctor">Doctor</option><option value="Nurse">Nurse</option><option value="Receptionist">Receptionist</option><option value="Admin">Admin</option><option value="Lab Technician">Lab Technician</option><option value="Pharmacist">Pharmacist</option><option value="Other">Other</option></select>
        <select id="staff-dept-filter"><option value="all">All Departments</option></select>
      `;
      document.querySelector('.card-head')?.after(toolbar);
      toolbar.addEventListener('change', renderStaff);
      toolbar.addEventListener('input', renderStaff);
    }

    document.getElementById('add-staff-btn')?.addEventListener('click', () => openForm());
    document.getElementById('staff-form')?.addEventListener('submit', handleSubmit);
    document.getElementById('staff-table-body')?.addEventListener('click', handleAction);

    // Update thead if needed
    const thead = document.querySelector('#staff-table-body')?.closest('table')?.querySelector('thead tr');
    if (thead && thead.children.length < 9) {
      thead.innerHTML = '<th>ID</th><th>Name</th><th>Gender</th><th>Role</th><th>Dept</th><th>Contact</th><th>Net Salary</th><th>Status</th><th>Actions</th>';
    }

    const cardHead = document.querySelector('.card-head');
    if (cardHead && !document.getElementById('print-staff-btn')) {
      const printBtn = document.createElement('button');
      printBtn.id = 'print-staff-btn';
      printBtn.className = 'btn btn-secondary';
      printBtn.textContent = 'Print';
      printBtn.addEventListener('click', printStaff);
      cardHead.appendChild(printBtn);

      const exportBtn = document.createElement('button');
      exportBtn.id = 'export-staff-btn';
      exportBtn.className = 'btn btn-secondary';
      exportBtn.textContent = 'Export CSV';
      exportBtn.addEventListener('click', exportCsv);
      cardHead.appendChild(exportBtn);
    }

    renderStaff();
  }

  document.addEventListener('hms:page-ready', init);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

