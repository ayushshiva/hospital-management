// Storage helpers for the hospital management app.
// Manages LocalStorage CRUD for all modules: patients, doctors, appointments,
// departments, rooms, medicines, staff, bills, labs, reports, salary, pricing.
(() => {
  const STORAGE_KEY = 'northstar-hms-data';
  const DEFAULT_DATA = {
    settings: { hospitalName: 'Northstar Hospital', logoUrl: '', theme: 'default' },
    patients: [
      { id: 'P001', name: 'Ava Kumar', age: 29, gender: 'Female', bloodGroup: 'O+', phone: '9876543210', email: 'ava@example.com', address: 'Mira Road', disease: 'Fever', doctorAssigned: 'Dr. Mehta', admissionDate: '2026-07-10', status: 'Admitted' },
      { id: 'P002', name: 'Rohan Shah', age: 44, gender: 'Male', bloodGroup: 'A+', phone: '9988776655', email: 'rohan@example.com', address: 'Andheri', disease: 'Diabetes', doctorAssigned: 'Dr. Nair', admissionDate: '2026-07-12', status: 'Outpatient' }
    ],
    doctors: [
      { id: 'D001', name: 'Dr. Mehta', department: 'Cardiology', qualification: 'MBBS, MD', experience: 12, phone: '9123456780', email: 'mehta@example.com', availability: 'Mon-Fri', fees: 800 },
      { id: 'D002', name: 'Dr. Nair', department: 'Neurology', qualification: 'MBBS, DM', experience: 15, phone: '9223456781', email: 'nair@example.com', availability: 'Daily', fees: 1000 }
    ],
    appointments: [
      { id: 'A001', patient: 'Ava Kumar', doctor: 'Dr. Mehta', department: 'Cardiology', date: '2026-07-20', time: '10:30', status: 'Scheduled' }
    ],
    departments: [
      { id: 'DEP001', name: 'Cardiology', head: 'Dr. Mehta', capacity: 20, status: 'Active', description: 'Heart & Cardiovascular', doctorsCount: 3 },
      { id: 'DEP002', name: 'Neurology', head: 'Dr. Nair', capacity: 15, status: 'Active', description: 'Brain & Nervous System', doctorsCount: 2 }
    ],
    rooms: [
      { id: 'R001', number: 'ICU-01', type: 'ICU', ward: 'ICU', floor: 1, bedCount: 2, pricePerDay: 5000, status: 'Occupied', assignedPatient: 'Ava Kumar', admissionDate: '2026-07-10', dischargeDate: '', features: ['AC', 'ICU', 'Oxygen', 'Private Bathroom'] },
      { id: 'R002', number: 'GEN-02', type: 'General', ward: 'General', floor: 2, bedCount: 4, pricePerDay: 2500, status: 'Available', assignedPatient: '', admissionDate: '', dischargeDate: '', features: ['Non AC'] }
    ],
    medicines: [
      { id: 'M001', name: 'Paracetamol', brand: 'Cipla', category: 'Analgesic', manufacturer: 'Cipla Ltd', batchNo: 'BAT001', expiry: '2027-01-12', purchasePrice: 15, sellingPrice: 25, quantity: 120, minStock: 20, rackNo: 'A1', supplier: 'MediCare', gst: 12, barcode: '8901234567890' }
    ],
    staff: [
      { id: 'S001', name: 'Nina Rao', gender: 'Female', phone: '9000000001', email: 'nina@hospital.com', address: 'Mumbai', department: 'Nursing', role: 'Nurse', joiningDate: '2025-01-15', monthlySalary: 35000, attendance: 22, workingDays: 25, leaveDays: 3, overtime: 10, bonus: 2000, deduction: 500, netSalary: 0, paymentStatus: 'Paid' }
    ],
    bills: [],
    labs: [
      { id: 'L001', name: 'Blood Test', category: 'Hematology', price: 300, sampleType: 'Blood', normalRange: '4.5-11.0 x10^9/L', result: '' },
      { id: 'L002', name: 'MRI', category: 'Radiology', price: 5000, sampleType: 'N/A', normalRange: '', result: '' }
    ],
    pricing: [
      { id: 'PR001', name: 'Doctor Consultation Fee', price: 500, category: 'Consultation' },
      { id: 'PR002', name: 'Emergency Fee', price: 1000, category: 'Emergency' },
      { id: 'PR003', name: 'Registration Fee', price: 200, category: 'Registration' },
      { id: 'PR004', name: 'ICU Daily Charge', price: 5000, category: 'Room' },
      { id: 'PR005', name: 'General Ward Charge', price: 1500, category: 'Room' },
      { id: 'PR006', name: 'Private Room Charge', price: 3500, category: 'Room' },
      { id: 'PR007', name: 'Deluxe Room Charge', price: 6000, category: 'Room' },
      { id: 'PR008', name: 'Operation Charges', price: 15000, category: 'Surgery' },
      { id: 'PR009', name: 'Medicine GST', price: 12, category: 'Tax' },
      { id: 'PR010', name: 'Lab Test Price', price: 300, category: 'Lab' },
      { id: 'PR011', name: 'X-Ray Price', price: 500, category: 'Radiology' },
      { id: 'PR012', name: 'MRI Price', price: 5000, category: 'Radiology' },
      { id: 'PR013', name: 'CT Scan Price', price: 3500, category: 'Radiology' },
      { id: 'PR014', name: 'Blood Test Price', price: 300, category: 'Lab' },
      { id: 'PR015', name: 'ECG Price', price: 400, category: 'Cardiology' },
      { id: 'PR016', name: 'Nursing Charges', price: 500, category: 'Nursing' },
      { id: 'PR017', name: 'Food Charges', price: 300, category: 'Food' },
      { id: 'PR018', name: 'Ambulance Charges', price: 2000, category: 'Emergency' },
      { id: 'PR019', name: 'Admission Fee', price: 500, category: 'Registration' },
      { id: 'PR020', name: 'Radiology Charges', price: 1000, category: 'Radiology' }
    ],
    reports: [],
    salary: []
  };

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
        return structuredClone(DEFAULT_DATA);
      }
      const parsed = JSON.parse(raw);
      return { ...structuredClone(DEFAULT_DATA), ...parsed, settings: { ...DEFAULT_DATA.settings, ...(parsed.settings || {}) } };
    } catch (error) {
      console.warn('Storage load failed', error);
      return structuredClone(DEFAULT_DATA);
    }
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function backupData() {
    const data = loadData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'northstar-hms-backup.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function restoreData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        saveData(parsed);
        window.dispatchEvent(new CustomEvent('hms:storage-restored'));
      } catch (error) {
        console.error(error);
      }
    };
    reader.readAsText(file);
  }

  window.HMS = window.HMS || {};
  window.HMS.storage = { loadData, saveData, backupData, restoreData, DEFAULT_DATA };
})();
