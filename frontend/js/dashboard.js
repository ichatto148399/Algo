Auth.requireAuth();
UI.renderSidebar('dashboard');
UI.renderTopbar('Dashboard', `Welcome back, ${Auth.currentUser.name}`);

const role = Auth.currentUser.role;
const content = document.getElementById('page-content');

const SVG = {
  users:    `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  book:     `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  home:     `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  alert:    `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  clock:    `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  edit:     `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
};

function emptyRow(cols, message) {
  return `<tr><td colspan="${cols}" style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px">${message}</td></tr>`;
}

function emptyCard(message) {
  return `<div style="text-align:center;padding:32px 20px;color:var(--text-muted);font-size:13px">${message}</div>`;
}

function renderAdminDashboard() {
  const totalFaculty  = DB.users.filter(u => u.role === 'faculty').length;
  const activeFaculty = DB.users.filter(u => u.role === 'faculty' && u.status === 'active').length;
  const totalRooms    = DB.rooms.length;
  const availRooms    = DB.rooms.filter(r => r.status === 'available').length;
  const totalSubjects = DB.subjects.length;
  const totalSchedules= DB.schedules.length;
  const pendingReqs   = DB.changeRequests.filter(r => r.status === 'pending').length;

  const recentSchedulesRows = DB.schedules.length
    ? DB.schedules.slice(0, 5).map(s => `
        <tr>
          <td><div class="fw-bold">${s.subjectCode}</div><div class="text-muted" style="font-size:11px">${s.section}</div></td>
          <td style="font-size:12px">${s.facultyName}</td>
          <td><span class="badge badge-info">${s.room}</span></td>
          <td style="font-size:12px">${s.day}<br>${s.startTime}–${s.endTime}</td>
        </tr>`).join('')
    : emptyRow(4, 'No schedules yet. <a href="schedules.html" style="color:var(--primary-light)">Add one →</a>');

  const roomUtilContent = DB.rooms.length
    ? DB.rooms.map(r => {
        const used  = DB.schedules.filter(s => s.roomId === r.id).length;
        const pct   = Math.min(Math.round((used / Math.max(totalSchedules, 1)) * 100), 100);
        const color = pct > 80 ? 'red' : pct > 50 ? 'orange' : 'green';
        return `<div style="margin-bottom:14px">
          <div class="d-flex justify-between mb-1">
            <span style="font-size:13px;font-weight:600">${r.number}</span>
            <span style="font-size:12px;color:var(--text-muted)">${used} class${used !== 1 ? 'es' : ''}</span>
          </div>
          <div class="progress-bar-wrap"><div class="progress-bar ${color}" style="width:${pct}%"></div></div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${r.type} · Cap: ${r.capacity} · <span class="badge badge-${r.status === 'available' ? 'success' : 'danger'}">${r.status}</span></div>
        </div>`;
      }).join('')
    : emptyCard('No rooms added yet. <a href="rooms.html" style="color:var(--primary-light)">Add rooms →</a>');

  const facultyLoadContent = DB.users.filter(u => u.role === 'faculty' && u.status === 'active').length
    ? DB.users.filter(u => u.role === 'faculty' && u.status === 'active').map(f => {
        const units = DB.schedules
          .filter(s => s.facultyId === f.id)
          .reduce((sum, s) => { const subj = DB.subjects.find(x => x.id === s.subjectId); return sum + (subj ? subj.units : 0); }, 0);
        const max   = f.maxUnits || 21;
        const pct   = Math.min(Math.round((units / max) * 100), 100);
        const color = pct > 90 ? 'red' : pct > 70 ? 'orange' : 'green';
        return `<div style="margin-bottom:14px">
          <div class="d-flex justify-between mb-1">
            <span style="font-size:13px;font-weight:600">${f.name}</span>
            <span style="font-size:12px">${units}/${max} units</span>
          </div>
          <div class="progress-bar-wrap"><div class="progress-bar ${color}" style="width:${pct}%"></div></div>
        </div>`;
      }).join('')
    : emptyCard('No faculty added yet. <a href="users.html" style="color:var(--primary-light)">Add faculty →</a>');

  const changeReqContent = DB.changeRequests.length
    ? DB.changeRequests.slice(0, 5).map(r => `
        <div style="padding:10px 0;border-bottom:1px solid var(--border)">
          <div class="d-flex justify-between align-center">
            <div class="fw-bold" style="font-size:13px">${r.facultyName}</div>
            <span class="badge badge-${r.status === 'pending' ? 'warning' : r.status === 'approved' ? 'success' : 'danger'}">${r.status}</span>
          </div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:3px">${r.type} · ${r.reason}</div>
          <div style="font-size:11px;color:var(--text-muted)">${r.date}</div>
        </div>`).join('')
    : emptyCard('No change requests submitted.');

  content.innerHTML = `
    <div class="page-header">
      <div><h2>System Dashboard</h2><p>Academic Year 2025–2026 | 1st Semester</p></div>
      <div class="d-flex gap-2">
        <span class="badge badge-success">System Online</span>
        <span class="chip">Live View</span>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card blue">
        <div class="stat-icon blue">${SVG.users}</div>
        <div class="stat-info"><div class="stat-value">${activeFaculty}</div><div class="stat-label">Active Faculty</div><div class="stat-sub">${totalFaculty} total registered</div></div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon green">${SVG.book}</div>
        <div class="stat-info"><div class="stat-value">${totalSubjects}</div><div class="stat-label">Total Subjects</div><div class="stat-sub">This semester</div></div>
      </div>
      <div class="stat-card orange">
        <div class="stat-icon orange">${SVG.home}</div>
        <div class="stat-info"><div class="stat-value">${availRooms}</div><div class="stat-label">Available Rooms</div><div class="stat-sub">${totalRooms} total rooms</div></div>
      </div>
      <div class="stat-card teal">
        <div class="stat-icon teal">${SVG.calendar}</div>
        <div class="stat-info"><div class="stat-value">${totalSchedules}</div><div class="stat-label">Active Schedules</div><div class="stat-sub">Current semester</div></div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon red">${SVG.alert}</div>
        <div class="stat-info"><div class="stat-value">${pendingReqs}</div><div class="stat-label">Pending Requests</div><div class="stat-sub">Awaiting approval</div></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
      <div class="card">
        <div class="card-header"><h3>Recent Schedules</h3><a href="schedules.html" style="font-size:12px;color:var(--primary-light)">View all</a></div>
        <div class="card-body">
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Subject</th><th>Faculty</th><th>Room</th><th>Day/Time</th></tr></thead>
              <tbody>${recentSchedulesRows}</tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Room Utilization</h3><a href="rooms.html" style="font-size:12px;color:var(--primary-light)">Manage</a></div>
        <div class="card-body">${roomUtilContent}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div class="card">
        <div class="card-header"><h3>Faculty Load Summary</h3><a href="faculty-loading.html" style="font-size:12px;color:var(--primary-light)">Manage</a></div>
        <div class="card-body">${facultyLoadContent}</div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Change Requests</h3><a href="schedules.html" style="font-size:12px;color:var(--primary-light)">View all</a></div>
        <div class="card-body">${changeReqContent}</div>
      </div>
    </div>`;
}

function renderFacultyDashboard() {
  const user       = Auth.currentUser;
  const mySchedules= DB.schedules.filter(s => s.facultyId === user.id);
  const totalUnits = mySchedules.reduce((sum, s) => {
    const subj = DB.subjects.find(x => x.id === s.subjectId);
    return sum + (subj ? subj.units : 0);
  }, 0);
  const pendingReqs= DB.changeRequests.filter(r => r.facultyId === user.id && r.status === 'pending').length;

  const schedRows = mySchedules.length
    ? mySchedules.map(s => `
        <tr>
          <td><div class="fw-bold">${s.subjectCode}</div><div class="text-muted" style="font-size:11px">${s.subjectTitle}</div></td>
          <td>${s.section}</td>
          <td><span class="badge badge-info">${s.room}</span></td>
          <td>${s.day}</td>
          <td>${s.startTime} – ${s.endTime}</td>
          <td><span class="badge badge-${s.type === 'Lab' ? 'warning' : 'primary'}">${s.type}</span></td>
        </tr>`).join('')
    : emptyRow(6, 'No schedules assigned yet.');

  content.innerHTML = `
    <div class="page-header">
      <div><h2>My Dashboard</h2><p>Academic Year 2025–2026 | 1st Semester</p></div>
    </div>
    <div class="stat-grid">
      <div class="stat-card blue">
        <div class="stat-icon blue">${SVG.calendar}</div>
        <div class="stat-info"><div class="stat-value">${mySchedules.length}</div><div class="stat-label">Assigned Classes</div></div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon green">${SVG.clock}</div>
        <div class="stat-info"><div class="stat-value">${totalUnits}</div><div class="stat-label">Teaching Units</div><div class="stat-sub">Max: ${user.maxUnits || 21} units</div></div>
      </div>
      <div class="stat-card orange">
        <div class="stat-icon orange">${SVG.edit}</div>
        <div class="stat-info"><div class="stat-value">${pendingReqs}</div><div class="stat-label">Pending Requests</div></div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>My Schedule This Semester</h3></div>
      <div class="card-body">
        <div class="table-wrapper">
          <table>
            <thead><tr><th>Subject</th><th>Section</th><th>Room</th><th>Day</th><th>Time</th><th>Type</th></tr></thead>
            <tbody>${schedRows}</tbody>
          </table>
        </div>
      </div>
    </div>`;
}

if (role === 'admin' || role === 'registrar') renderAdminDashboard();
else if (role === 'faculty') renderFacultyDashboard();
