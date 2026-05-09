// ===== STORAGE MODULE =====
// This saves and loads data so it doesn't disappear on page refresh.
// Written by: [Your Name] - Backend

const Storage = {

  // Save all DB data to localStorage
  save() {
    localStorage.setItem('db_users',          JSON.stringify(DB.users));
    localStorage.setItem('db_departments',    JSON.stringify(DB.departments));
    localStorage.setItem('db_programs',       JSON.stringify(DB.programs));
    localStorage.setItem('db_subjects',       JSON.stringify(DB.subjects));
    localStorage.setItem('db_rooms',          JSON.stringify(DB.rooms));
    localStorage.setItem('db_schedules',      JSON.stringify(DB.schedules));
    localStorage.setItem('db_changeRequests', JSON.stringify(DB.changeRequests));
    localStorage.setItem('db_notifications',  JSON.stringify(DB.notifications));
  },

  // Load all saved data back into DB
  load() {
    // Only load if there is saved data
    if (localStorage.getItem('db_users'))          DB.users          = JSON.parse(localStorage.getItem('db_users'));
    if (localStorage.getItem('db_departments'))    DB.departments    = JSON.parse(localStorage.getItem('db_departments'));
    if (localStorage.getItem('db_programs'))       DB.programs       = JSON.parse(localStorage.getItem('db_programs'));
    if (localStorage.getItem('db_subjects'))       DB.subjects       = JSON.parse(localStorage.getItem('db_subjects'));
    if (localStorage.getItem('db_rooms'))          DB.rooms          = JSON.parse(localStorage.getItem('db_rooms'));
    if (localStorage.getItem('db_schedules'))      DB.schedules      = JSON.parse(localStorage.getItem('db_schedules'));
    if (localStorage.getItem('db_changeRequests')) DB.changeRequests = JSON.parse(localStorage.getItem('db_changeRequests'));
    if (localStorage.getItem('db_notifications'))  DB.notifications  = JSON.parse(localStorage.getItem('db_notifications'));
  },

  // Delete all saved data (for reset/testing)
  clear() {
    localStorage.clear();
    console.log('All saved data cleared.');
  }

};

// Auto-load saved data when the page opens
Storage.load();