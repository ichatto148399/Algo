// ===== DATA STORE =====
const DB = {
  users: [
    { id: 1, username: 'admin',     password: 'admin123', role: 'admin',     name: 'System Administrator', email: 'admin@school.edu',     status: 'active', department: 'IT' },
    { id: 2, username: 'registrar', password: 'reg123',   role: 'registrar', name: 'Registrar',            email: 'registrar@school.edu', status: 'active', department: 'Registrar' },
  ],
  departments:    [],  // { id, code, name }
  programs:       [],  // { id, code, name, departmentId }
  subjects:       [],
  rooms:          [],
  schedules:      [],
  changeRequests: [],
  notifications:  [],
};

// Helper to get next ID
DB.nextId = (collection) => Math.max(...DB[collection].map(i => i.id), 0) + 1;
