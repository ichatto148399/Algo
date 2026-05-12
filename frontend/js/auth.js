// ===== AUTH MODULE =====
// Updated to use PHP backend instead of localStorage
// Backend by: [Your Name]

// Path to our PHP backend folder
const BACKEND = '../backend/';

const Auth = {
  currentUser: null,

  init() {
    const stored = sessionStorage.getItem('currentUser');
    if (stored) this.currentUser = JSON.parse(stored);
  },

  // Login - now sends to auth.php
  async login(username, password) {
    try {
      const formData = new FormData();
      formData.append('action',   'login');
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch(BACKEND + 'auth.php', {
        method: 'POST',
        body:   formData
      });

      const result = await response.json();

      if (result.success) {
        this.currentUser = result.user;
        sessionStorage.setItem('currentUser', JSON.stringify(result.user));
      }

      return result;

    } catch (error) {
      return { success: false, message: 'Cannot connect to server. Make sure XAMPP is running.' };
    }
  },

  // Logout - now tells auth.php to destroy session
  async logout() {
    try {
      const formData = new FormData();
      formData.append('action', 'logout');
      await fetch(BACKEND + 'auth.php', { method: 'POST', body: formData });
    } catch (e) {}

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
      admin:     ['all'],
      registrar: ['manage_subjects', 'manage_loading', 'manage_rooms', 'manage_schedules', 'view_reports', 'manage_users_view'],
      faculty:   ['view_schedule', 'request_change']
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
    setTimeout(() => toast.remove(), 3500);
  },

  openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
  },

  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
  },

  confirm(message, onConfirm) {
    if (window.confirm(message)) onConfirm();
  },

  renderSidebar(activePage = '') {
    const user = Auth.currentUser;
    if (!user) return;

    const allLinks = [
      { page: 'dashboard',       href: 'dashboard.html',       icon: '⊞', label: 'Dashboard',        roles: ['admin','registrar','faculty'] },
      { page: 'users',           href: 'users.html',           icon: '👥', label: 'User Management',  roles: ['admin'] },
      { page: 'subjects',        href: 'subjects.html',        icon: '📚', label: 'Subjects',          roles: ['admin','registrar'] },
      { page: 'faculty-loading', href: 'faculty-loading.html', icon: '📋', label: 'Faculty Loading',   roles: ['admin','registrar'] },
      { page: 'rooms',           href: 'rooms.html',           icon: '🏫', label: 'Room Management',   roles: ['admin','registrar'] },
      { page: 'schedules',       href: 'schedules.html',       icon: '📅', label: 'Schedules',         roles: ['admin','registrar','faculty'] },
      { page: 'reports',         href: 'reports.html',         icon: '📊', label: 'Reports',           roles: ['admin','registrar'] },
      { page: 'change-requests', href: 'change-requests.html', icon: '🔄', label: 'Change Requests',   roles: ['admin','registrar','faculty'] },
    ];

    const links = allLinks
      .filter(l => l.roles.includes(user.role))
      .map(l => `
        <a href="${l.href}" class="nav-link ${activePage === l.page ? 'active' : ''}">
          <span class="nav-icon">${l.icon}</span>
          <span>${l.label}</span>
        </a>`)
      .join('');

    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.innerHTML = `
        <div class="sidebar-header">
          <div class="sidebar-logo">UMSync</div>
          <div class="sidebar-subtitle">Scheduling System</div>
        </div>
        <nav class="sidebar-nav">${links}</nav>
        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-name">${user.name}</div>
            <div class="user-role">${user.role}</div>
          </div>
          <button onclick="Auth.logout()" class="logout-btn">Logout</button>
        </div>`;
    }
  },

  renderTopbar(title = '', subtitle = '') {
    const topbar = document.getElementById('topbar');
    if (topbar) {
      topbar.innerHTML = `
        <div class="topbar-title">
          <h2>${title}</h2>
          ${subtitle ? `<p>${subtitle}</p>` : ''}
        </div>
        <div class="topbar-actions">
          <span style="font-size:13px;opacity:0.7">Welcome, ${Auth.currentUser?.name || ''}</span>
        </div>`;
    }
  },

  toggleNotifications() {
    const dropdown = document.getElementById('notif-dropdown');
    if (dropdown) dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  }
};