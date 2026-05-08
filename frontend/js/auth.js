// ===== AUTH MODULE =====
const Auth = {
  currentUser: null,

  init() {
    const stored = sessionStorage.getItem('currentUser');
    if (stored) this.currentUser = JSON.parse(stored);
  },

  login(username, password) {
    const user = DB.users.find(u => u.username === username && u.password === password && u.status === 'active');
    if (user) {
      this.currentUser = user;
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      return { success: true, user };
    }
    return { success: false, message: 'Invalid username or password.' };
  },

  logout() {
    this.currentUser = null;
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
  },

  requireAuth(allowedRoles = []) {
    this.init();
    if (!this.currentUser) { window.location.href = 'index.html'; return false; }
    if (allowedRoles.length && !allowedRoles.includes(this.currentUser.role)) {
      window.location.href = 'dashboard.html'; return false;
    }
    return true;
  },

  can(action) {
    if (!this.currentUser) return false;
    const role = this.currentUser.role;
    const perms = {
      admin: ['all'],
      registrar: ['manage_subjects', 'manage_loading', 'manage_rooms', 'manage_schedules', 'view_reports', 'manage_users_view'],
      faculty: ['view_schedule', 'request_change']
    };
    const p = perms[role] || [];
    return p.includes('all') || p.includes(action);
  }
};

// ===== SHARED UI HELPERS =====
const UI = {
  showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : type === 'warning' ? 'warning' : ''}`;
    const icons = { success: '✓', error: '✕', warning: '⚠' };
    toast.innerHTML = `<span style="font-size:16px">${icons[type] || '✓'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; toast.style.transition = 'all .3s'; setTimeout(() => toast.remove(), 300); }, 3000);
  },

  openModal(id) { document.getElementById(id)?.classList.add('active'); },
  closeModal(id) { document.getElementById(id)?.classList.remove('active'); },

  confirm(message, onConfirm) {
    if (window.confirm(message)) onConfirm();
  },

  renderSidebar(activePage) {
    const user = Auth.currentUser;
    if (!user) return;
    const navItems = {
      admin: [
        { icon: 'grid', label: 'Dashboard', page: 'dashboard' },
        { icon: 'users', label: 'User Management', page: 'users' },
        { icon: 'book', label: 'Subjects', page: 'subjects' },
        { icon: 'user-check', label: 'Faculty Loading', page: 'faculty-loading' },
        { icon: 'home', label: 'Room Management', page: 'rooms' },
        { icon: 'calendar', label: 'Schedules', page: 'schedules' },
        { icon: 'bar-chart', label: 'Reports', page: 'reports' },
      ],
      registrar: [
        { icon: 'grid', label: 'Dashboard', page: 'dashboard' },
        { icon: 'book', label: 'Subjects', page: 'subjects' },
        { icon: 'user-check', label: 'Faculty Loading', page: 'faculty-loading' },
        { icon: 'home', label: 'Room Management', page: 'rooms' },
        { icon: 'calendar', label: 'Schedules', page: 'schedules' },
        { icon: 'bar-chart', label: 'Reports', page: 'reports' },
      ],
      faculty: [
        { icon: 'grid', label: 'Dashboard', page: 'dashboard' },
        { icon: 'calendar', label: 'My Schedule', page: 'schedules' },
        { icon: 'home', label: 'Room Assignments', page: 'rooms' },
        { icon: 'edit', label: 'Change Requests', page: 'change-requests' },
      ]
    };
    const items = navItems[user.role] || [];
    const svgIcons = {
      grid: '<path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z"/>',
      users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
      book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
      'user-check': '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>',
      home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
      calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
      'bar-chart': '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
      edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    };
    const roleColors = { admin: '#e8a020', registrar: '#17a2b8', faculty: '#28a745' };
    const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('sidebar').innerHTML = `
      <div class="sidebar-header">
        <div class="brand">
          <div class="brand-icon"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
          <div class="brand-text"><h2>UMSync</h2><span>Academic Scheduler</span></div>
        </div>
      </div>
      <div class="sidebar-user">
        <div class="user-avatar" style="background:${roleColors[user.role]}">${initials}</div>
        <div class="user-info"><div class="user-name">${user.name}</div><div class="user-role">${user.role}</div></div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section">Navigation</div>
        ${items.map(item => `
          <div class="nav-item ${activePage === item.page ? 'active' : ''}" onclick="window.location.href='${item.page === 'dashboard' ? 'dashboard' : item.page}.html'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">${svgIcons[item.icon] || ''}</svg>
            <span>${item.label}</span>
          </div>`).join('')}
      </nav>
      <div class="sidebar-footer">
        <div class="nav-item" onclick="Auth.logout()" style="color:rgba(255,255,255,0.7)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span>Logout</span>
        </div>
      </div>`;
  },

  renderTopbar(title, subtitle = '') {
    const unread = DB.notifications.filter(n => !n.read).length;
    document.getElementById('topbar').innerHTML = `
      <div class="topbar-left">
        <div>
          <h2>${title}</h2>
          ${subtitle ? `<div class="breadcrumb">${subtitle}</div>` : ''}
        </div>
      </div>
      <div class="topbar-right">
        <button class="notif-btn" onclick="UI.toggleNotifications()" title="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          ${unread > 0 ? `<span class="notif-badge">${unread}</span>` : ''}
        </button>
        <div style="font-size:13px;color:var(--text-muted)">${new Date().toLocaleDateString('en-PH', {weekday:'short',year:'numeric',month:'short',day:'numeric'})}</div>
      </div>`;
  },

  toggleNotifications() {
    let panel = document.getElementById('notif-panel');
    if (panel) { panel.remove(); return; }
    panel = document.createElement('div');
    panel.id = 'notif-panel';
    panel.style.cssText = 'position:fixed;top:70px;right:20px;width:320px;background:white;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.15);z-index:999;border:1px solid var(--border)';
    const dotColors = { info: '', warning: 'orange', danger: 'red', success: 'green' };
    panel.innerHTML = `
      <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <strong style="font-size:14px">Notifications</strong>
        <span style="font-size:11px;color:var(--primary-light);cursor:pointer" onclick="DB.notifications.forEach(n=>n.read=true);document.getElementById('notif-panel').remove();UI.renderTopbar(document.querySelector('.topbar-left h2').textContent)">Mark all read</span>
      </div>
      <div class="notification-list" style="padding:8px 16px;max-height:300px;overflow-y:auto">
        ${DB.notifications.map(n => `
          <div class="notif-item">
            <div class="notif-dot ${dotColors[n.type] || ''}"></div>
            <div><div class="notif-text" style="${!n.read ? 'font-weight:600' : ''}">${n.message}</div><div class="notif-time">${n.time}</div></div>
          </div>`).join('')}
      </div>`;
    document.body.appendChild(panel);
    setTimeout(() => document.addEventListener('click', function handler(e) { if (!panel.contains(e.target)) { panel.remove(); document.removeEventListener('click', handler); } }), 100);
  }
};
