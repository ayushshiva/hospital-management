// Billing / Invoice Management Module — Full CRUD with LocalStorage persistence.
// Features: Auto-fetch patient details, auto-calculate using Admin Pricing, invoice history,
// print invoice, download PDF, search invoices, medicine stock deduction.
(() => {
  'use strict';

  function loadBills() {
    const state = window.HMS.storage.loadData();
    return state.bills || [];
  }

  function saveBills(bills) {
    const state = window.HMS.storage.loadData();
    state.bills = bills;
    window.HMS.storage.saveData(state);
  }

  // Auto-generate invoice number
  function generateInvoiceNumber() {
    const bills = loadBills();
    const count = bills.length + 1;
    return `INV-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
  }

  // Get price from pricing module
  function getPrice(serviceName) {
    if (window.HMS.pricing && window.HMS.pricing.getPriceByName) {
      return window.HMS.pricing.getPriceByName(serviceName);
    }
    return 0;
  }

  // Calculate bill
  function calculateBill(data) {
    const doctorFee = data.doctorFee || getPrice('Doctor Consultation Fee');
    const admissionFee = data.admissionFee || getPrice('Admission Fee');
    const roomCharges = data.roomCharges || getPrice('Private Room Charge');
    const icuCharges = data.icuCharges || 0;
    const operationCharges = data.operationCharges || getPrice('Operation Charges');
    const medicineCharges = data.medicineCharges || 0;
    const labCharges = data.labCharges || getPrice('Lab Test Price');
    const radiologyCharges = data.radiologyCharges || getPrice('Radiology Charges');
    const emergencyCharges = data.emergencyCharges || getPrice('Emergency Fee');
    const nursingCharges = data.nursingCharges || getPrice('Nursing Charges');
    const bedCharges = data.bedCharges || 0;
    const foodCharges = data.foodCharges || getPrice('Food Charges');
    const discount = Number(data.discount || 0);
    const advancePayment = Number(data.advancePayment || 0);

    const subtotal = doctorFee + admissionFee + roomCharges + icuCharges + operationCharges +
      medicineCharges + labCharges + radiologyCharges + emergencyCharges +
      nursingCharges + bedCharges + foodCharges;

    const gstPercent = getPrice('Medicine GST') || 12;
    const gst = Math.round(subtotal * gstPercent / 100);
    const grandTotal = subtotal + gst - discount;
    const remainingAmount = grandTotal - advancePayment;

    return {
      doctorFee, admissionFee, roomCharges, icuCharges, operationCharges,
      medicineCharges, labCharges, radiologyCharges, emergencyCharges,
      nursingCharges, bedCharges, foodCharges, gst, gstPercent,
      subtotal, discount, advancePayment, grandTotal: Math.max(0, grandTotal),
      remainingAmount: Math.max(0, remainingAmount)
    };
  }

  // Render invoice history
  function renderHistory() {
    const tbody = document.getElementById('billing-history-body');
    if (!tbody) return;
    const bills = loadBills();
    const searchTerm = (document.getElementById('billing-search')?.value || '').toLowerCase();

    const filtered = bills.filter(b =>
      [b.invoiceNo, b.patientName, b.patientId].join(' ').toLowerCase().includes(searchTerm)
    ).reverse();

    tbody.innerHTML = filtered.map(b => `
      <tr>
        <td>${b.invoiceNo}</td>
        <td>${window.HMS.utils.escapeHtml(b.patientName || b.patient)}</td>
        <td>${b.patientId || '—'}</td>
        <td>${window.HMS.utils.formatCurrency(b.grandTotal || b.total || 0)}</td>
        <td>${window.HMS.utils.formatCurrency(b.advancePayment || 0)}</td>
        <td>${window.HMS.utils.formatCurrency(b.remainingAmount || b.grandTotal || 0)}</td>
        <td>${b.date || '—'}</td>
        <td>
          <button class="action-btn" data-action="view" data-id="${b.id || b.invoiceNo}">View</button>
          <button class="action-btn" data-action="print" data-id="${b.id || b.invoiceNo}">Print</button>
          <button class="action-btn delete" data-action="delete" data-id="${b.id || b.invoiceNo}">Delete</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="8" style="text-align:center;">No invoices found</td></tr>';
  }

  // Auto-fetch patient details
  function fetchPatientDetails() {
    const patientInput = document.getElementById('billing-patient').value.trim();
    if (!patientInput) return;

    const state = window.HMS.storage.loadData();
    const patients = state.patients || [];
    const patient = patients.find(p =>
      p.name.toLowerCase() === patientInput.toLowerCase() ||
      p.id.toLowerCase() === patientInput.toLowerCase()
    );

    if (patient) {
      document.getElementById('billing-patient-id').value = patient.id;
      document.getElementById('billing-doctor').value = patient.doctorAssigned || '';
      document.getElementById('billing-department').value = patient.disease || '';
      document.getElementById('billing-admission').value = patient.admissionDate || '';
      // Check if patient has a room assigned
      const rooms = state.rooms || [];
      const assignedRoom = rooms.find(r => r.assignedPatient && r.assignedPatient.toLowerCase() === patient.name.toLowerCase());
      if (assignedRoom) {
        document.getElementById('billing-room').value = assignedRoom.number;
      }
      window.HMS.utils.showToast('Patient details loaded', 'success');
    }
  }

  // Update invoice summary
  function updateSummary() {
    const data = {
      doctorFee: Number(document.getElementById('billing-doctor-fee').value || 0),
      admissionFee: Number(document.getElementById('billing-admission-fee').value || 0),
      roomCharges: Number(document.getElementById('billing-room-charge').value || 0),
      icuCharges: Number(document.getElementById('billing-icu-charge').value || 0),
      operationCharges: Number(document.getElementById('billing-operation-charge').value || 0),
      medicineCharges: Number(document.getElementById('billing-medicine-charge').value || 0),
      labCharges: Number(document.getElementById('billing-lab-charge').value || 0),
      radiologyCharges: Number(document.getElementById('billing-radiology-charge').value || 0),
      emergencyCharges: Number(document.getElementById('billing-emergency-charge').value || 0),
      nursingCharges: Number(document.getElementById('billing-nursing-charge').value || 0),
      bedCharges: Number(document.getElementById('billing-bed-charge').value || 0),
      foodCharges: Number(document.getElementById('billing-food-charge').value || 0),
      discount: Number(document.getElementById('billing-discount').value || 0),
      advancePayment: Number(document.getElementById('billing-advance').value || 0)
    };

    const result = calculateBill(data);
    const summary = document.getElementById('invoice-summary');
    if (!summary) return;

    summary.innerHTML = `
      <h4>Invoice Preview</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;">
        <p><strong>Doctor Fee:</strong> ${window.HMS.utils.formatCurrency(result.doctorFee)}</p>
        <p><strong>Admission Fee:</strong> ${window.HMS.utils.formatCurrency(result.admissionFee)}</p>
        <p><strong>Room Charges:</strong> ${window.HMS.utils.formatCurrency(result.roomCharges)}</p>
        <p><strong>ICU Charges:</strong> ${window.HMS.utils.formatCurrency(result.icuCharges)}</p>
        <p><strong>Operation Charges:</strong> ${window.HMS.utils.formatCurrency(result.operationCharges)}</p>
        <p><strong>Medicine Charges:</strong> ${window.HMS.utils.formatCurrency(result.medicineCharges)}</p>
        <p><strong>Lab Charges:</strong> ${window.HMS.utils.formatCurrency(result.labCharges)}</p>
        <p><strong>Radiology Charges:</strong> ${window.HMS.utils.formatCurrency(result.radiologyCharges)}</p>
        <p><strong>Emergency Charges:</strong> ${window.HMS.utils.formatCurrency(result.emergencyCharges)}</p>
        <p><strong>Nursing Charges:</strong> ${window.HMS.utils.formatCurrency(result.nursingCharges)}</p>
        <p><strong>Bed Charges:</strong> ${window.HMS.utils.formatCurrency(result.bedCharges)}</p>
        <p><strong>Food Charges:</strong> ${window.HMS.utils.formatCurrency(result.foodCharges)}</p>
      </div>
      <hr style="margin:12px 0;border-color:var(--border);">
      <p><strong>Subtotal:</strong> ${window.HMS.utils.formatCurrency(result.subtotal)}</p>
      <p><strong>GST (${result.gstPercent}%):</strong> ${window.HMS.utils.formatCurrency(result.gst)}</p>
      <p><strong>Discount:</strong> -${window.HMS.utils.formatCurrency(result.discount)}</p>
      <p><strong>Advance Payment:</strong> -${window.HMS.utils.formatCurrency(result.advancePayment)}</p>
      <p style="font-size:1.3rem;font-weight:700;color:var(--primary);margin-top:8px;">
        <strong>Grand Total: ${window.HMS.utils.formatCurrency(result.grandTotal)}</strong>
      </p>
      <p style="color:var(--danger);font-size:1.1rem;">
        <strong>Remaining: ${window.HMS.utils.formatCurrency(result.remainingAmount)}</strong>
      </p>
    `;

    return result;
  }

  // Save invoice
  function handleSubmit(event) {
    event.preventDefault();

    const result = updateSummary();
    if (!result) return;

    const bills = loadBills();
    const invoiceNo = generateInvoiceNumber();

    // Deduct medicine stock if pharmacy module exists
    const medicineName = document.getElementById('billing-medicine')?.value?.trim();
    if (medicineName && window.HMS.pharmacy && window.HMS.pharmacy.deductStock) {
      window.HMS.pharmacy.deductStock(medicineName, 1);
    }

    const bill = {
      id: `BILL-${Date.now()}`,
      invoiceNo: invoiceNo,
      patient: document.getElementById('billing-patient').value.trim(),
      patientName: document.getElementById('billing-patient').value.trim(),
      patientId: document.getElementById('billing-patient-id').value,
      doctor: document.getElementById('billing-doctor').value,
      department: document.getElementById('billing-department').value,
      room: document.getElementById('billing-room').value,
      admissionDate: document.getElementById('billing-admission').value,
      dischargeDate: document.getElementById('billing-discharge').value,
      ...result,
      date: window.HMS.utils.getToday()
    };

    bills.push(bill);
    saveBills(bills);
    window.HMS.utils.showToast(`Invoice ${invoiceNo} saved`, 'success');
    renderHistory();
    document.getElementById('billing-form').reset();
    document.getElementById('invoice-summary').innerHTML = '<p style="color:var(--muted);">Click "Calculate" to preview invoice</p>';
  }

  // Print invoice
  function printInvoice(bill) {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Invoice ${bill.invoiceNo}</title>
      <style>
        body{font-family:Arial;padding:30px;max-width:800px;margin:auto;}
        .header{text-align:center;border-bottom:2px solid #1f78d1;padding-bottom:15px;margin-bottom:20px;}
        .header h1{color:#1f78d1;margin:0;}
        .info{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;}
        .info div{padding:6px;}
        table{width:100%;border-collapse:collapse;margin:15px 0;}
        th,td{padding:10px;border:1px solid #ddd;text-align:left;}
        th{background:#1f78d1;color:white;}
        .total-row{font-weight:bold;background:#f0f7ff;}
        .summary{text-align:right;margin-top:15px;}
        .summary p{margin:5px 0;}
        .grand-total{font-size:1.5rem;color:#1f78d1;font-weight:bold;}
        .footer{text-align:center;margin-top:30px;color:#888;font-size:0.9rem;}
        @media print{body{padding:15px;}}
      </style></head><body>
      <div class="header">
        <h1>Northstar Hospital</h1>
        <p>Tax Invoice</p>
      </div>
      <div class="info">
        <div><strong>Invoice No:</strong> ${bill.invoiceNo}</div>
        <div><strong>Date:</strong> ${bill.date}</div>
        <div><strong>Patient:</strong> ${bill.patientName}</div>
        <div><strong>Patient ID:</strong> ${bill.patientId || '—'}</div>
        <div><strong>Doctor:</strong> ${bill.doctor || '—'}</div>
        <div><strong>Department:</strong> ${bill.department || '—'}</div>
        <div><strong>Room:</strong> ${bill.room || '—'}</div>
        <div><strong>Admission:</strong> ${bill.admissionDate || '—'}</div>
      <table>
        <thead><tr><th>Description</th><th>Amount (₹)</th></tr></thead>
        <tbody>
          <tr><td>Doctor Consultation Fee</td><td>${bill.doctorFee}</td></tr>
          <tr><td>Admission Fee</td><td>${bill.admissionFee}</td></tr>
          <tr><td>Room Charges</td><td>${bill.roomCharges}</td></tr>
          <tr><td>ICU Charges</td><td>${bill.icuCharges}</td></tr>
          <tr><td>Operation Charges</td><td>${bill.operationCharges}</td></tr>
          <tr><td>Medicine Charges</td><td>${bill.medicineCharges}</td></tr>
          <tr><td>Lab Charges</td><td>${bill.labCharges}</td></tr>
          <tr><td>Radiology Charges</td><td>${bill.radiologyCharges}</td></tr>
          <tr><td>Emergency Charges</td><td>${bill.emergencyCharges}</td></tr>
          <tr><td>Nursing Charges</td><td>${bill.nursingCharges}</td></tr>
          <tr><td>Bed Charges</td><td>${bill.bedCharges}</td></tr>
          <tr><td>Food Charges</td><td>${bill.foodCharges}</td></tr>
        </tbody>
      </table>
      <div class="summary">
        <p><strong>Subtotal:</strong> ₹${bill.subtotal}</p>
        <p><strong>GST (${bill.gstPercent}%):</strong> ₹${bill.gst}</p>
        <p><strong>Discount:</strong> -₹${bill.discount}</p>
        <p><strong>Advance Payment:</strong> -₹${bill.advancePayment}</p>
        <p class="grand-total">Grand Total: ₹${bill.grandTotal}</p>
        <p style="color:#d64545;"><strong>Remaining: ₹${bill.remainingAmount}</strong></p>
      </div>
      <div class="footer">Generated on ${new Date().toLocaleDateString()} · Northstar Hospital Management System</div>
      <div style="text-align:center;margin-top:20px;">
        <button onclick="window.print()" style="padding:10px 20px;background:#1f78d1;color:white;border:none;border-radius:8px;cursor:pointer;">Print Invoice</button>
      </div>
      </body></html>
    `);
    win.document.close();
  }

  // Handle action buttons in history
  function handleHistoryAction(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const bills = loadBills();
    const bill = bills.find(b => b.id === button.dataset.id || b.invoiceNo === button.dataset.id);
    if (!bill) return;

    if (button.dataset.action === 'view') printInvoice(bill);
    if (button.dataset.action === 'print') printInvoice(bill);
    if (button.dataset.action === 'delete') {
      window.HMS.utils.confirmAction(`Delete invoice ${bill.invoiceNo}?`, () => {
        const next = bills.filter(b => b.id !== bill.id && b.invoiceNo !== bill.invoiceNo);
        saveBills(next);
        renderHistory();
        window.HMS.utils.showToast('Invoice deleted', 'success');
      });
    }
  }

  // Auto-fill pricing defaults
  function autoFillPricing() {
    const fields = {
      'billing-doctor-fee': 'Doctor Consultation Fee',
      'billing-admission-fee': 'Admission Fee',
      'billing-room-charge': 'Private Room Charge',
      'billing-operation-charge': 'Operation Charges',
      'billing-lab-charge': 'Lab Test Price',
      'billing-radiology-charge': 'Radiology Charges',
      'billing-emergency-charge': 'Emergency Fee',
      'billing-nursing-charge': 'Nursing Charges',
      'billing-food-charge': 'Food Charges'
    };

    Object.entries(fields).forEach(([fieldId, priceName]) => {
      const el = document.getElementById(fieldId);
      if (el && !el.value) {
        const price = getPrice(priceName);
        if (price > 0) el.value = price;
      }
    });
  }

  // Initialize
  function init() {
    if (document.body.dataset.page !== 'billing') return;

    // Add invoice history section if not present
    const section = document.querySelector('.page-card');
    if (section && !document.getElementById('billing-history-section')) {
      const historySection = document.createElement('div');
      historySection.id = 'billing-history-section';
      historySection.style.marginTop = '24px';
      historySection.innerHTML = `
        <div class="card-head" style="margin-bottom:12px;">
          <h3>Invoice History</h3>
          <input id="billing-search" type="search" placeholder="Search invoices..." style="max-width:250px;">
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Invoice #</th><th>Patient</th><th>ID</th><th>Total</th><th>Advance</th><th>Remaining</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody id="billing-history-body"></tbody>
          </table>
        </div>
      `;
      section.appendChild(historySection);
    }

    // Event listeners
    document.getElementById('calculate-bill-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      autoFillPricing();
      updateSummary();
    });

    document.getElementById('billing-form')?.addEventListener('submit', handleSubmit);

    document.getElementById('print-bill-btn')?.addEventListener('click', () => {
      const result = updateSummary();
      if (result) {
        const bills = loadBills();
        const lastBill = bills[bills.length - 1];
        if (lastBill) printInvoice(lastBill);
      }
    });

    document.getElementById('billing-history-body')?.addEventListener('click', handleHistoryAction);
    document.getElementById('billing-search')?.addEventListener('input', renderHistory);

    // Auto-fetch patient details on blur
    document.getElementById('billing-patient')?.addEventListener('blur', fetchPatientDetails);

    // Load initial data
    autoFillPricing();
    renderHistory();
  }

  document.addEventListener('hms:page-ready', init);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
