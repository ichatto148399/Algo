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
    if (!modal) return;
    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('active'));
  },

  closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; }, 260);
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

    const navIcons = {
      dashboard:         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
      users:             `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      subjects:          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
      'faculty-loading': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
      rooms:             `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
      schedules:         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
      reports:           `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
      'change-requests': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
    };

    const links = allLinks
      .filter(l => l.roles.includes(user.role))
      .map(l => `
        <a href="${l.href}" class="nav-item ${activePage === l.page ? 'active' : ''}">
          ${navIcons[l.page] || ''}
          <span>${l.label}</span>
        </a>`)
      .join('');

    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      const initials = user.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
      sidebar.innerHTML = `
        <div class="sidebar-header">
          <div class="brand">
            <div class="brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div class="brand-text"><h2>UMSync</h2><span>Academic Scheduler</span></div>
          </div>
        </div>
        <div class="sidebar-user">
          <div class="user-avatar">${initials}</div>
          <div class="user-info">
            <div class="user-name">${user.name}</div>
            <div class="user-role">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</div>
          </div>
        </div>
        <div class="sidebar-nav">
          <div class="nav-section">Navigation</div>
          ${links}
        </div>
        <div class="sidebar-footer">
          <button onclick="Auth.logout()" class="btn btn-outline btn-block" style="color:white;border-color:rgba(255,255,255,0.3);gap:8px">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>`;
    }
  },

  renderTopbar(title = '', subtitle = '') {
    const topbar = document.getElementById('topbar');
    if (topbar) {
      topbar.innerHTML = `
        <div class="topbar-left">
          <h2>${title}</h2>
          ${subtitle ? `<span class="breadcrumb">${subtitle}</span>` : ''}
        </div>
        <div class="topbar-right">
          <span style="font-size:13px;color:var(--text-muted)">Welcome, ${Auth.currentUser?.name || ''}</span>
          <div class="notif-wrapper" id="notif-wrapper">
            <button class="notif-btn" onclick="UI.toggleNotifications()" title="Notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span class="notif-badge" id="notif-count" style="display:none">0</span>
            </button>
            <div class="notif-dropdown" id="notif-dropdown" style="display:none">
              <div class="notif-dropdown-header">
                <span>Notifications</span>
                <a href="change-requests.html" style="font-size:12px;color:var(--primary)">View all</a>
              </div>
              <div id="notif-list"><div style="padding:16px;text-align:center;color:var(--text-muted);font-size:13px">Loading...</div></div>
            </div>
          </div>
        </div>`;
      // close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        const wrapper = document.getElementById('notif-wrapper');
        if (wrapper && !wrapper.contains(e.target)) {
          const dd = document.getElementById('notif-dropdown');
          if (dd) dd.style.display = 'none';
        }
      });
      // fetch pending change requests for badge
      UI.loadNotifications();
    }
  },

  async loadNotifications() {
    try {
      const fd = new FormData();
      fd.append('action', 'get_all');
      const res    = await fetch(BACKEND + 'change_requests.php', { method: 'POST', body: fd });
      const result = await res.json();
      if (!result.success) return;
      const pending = result.data.filter(r => r.status === 'pending');
      const badge   = document.getElementById('notif-count');
      const list    = document.getElementById('notif-list');
      if (badge) {
        badge.textContent = pending.length;
        badge.style.display = pending.length > 0 ? 'flex' : 'none';
      }
      if (list) {
        if (pending.length === 0) {
          list.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">No pending requests</div>`;
        } else {
          list.innerHTML = pending.slice(0, 5).map(r => `
            <a href="change-requests.html" class="notif-item">
              <div class="notif-dot orange"></div>
              <div>
                <div class="notif-text">${r.faculty_name || 'Faculty'} requested a change</div>
                <div class="notif-time">${r.reason ? r.reason.substring(0, 50) + (r.reason.length > 50 ? '…' : '') : 'No reason given'}</div>
              </div>
            </a>`).join('');
          if (pending.length > 5) {
            list.innerHTML += `<div style="padding:10px;text-align:center;font-size:12px;color:var(--text-muted)">${pending.length - 5} more pending...</div>`;
          }
        }
      }
    } catch (e) {}
  },

  toggleNotifications() {
    const dd = document.getElementById('notif-dropdown');
    if (dd) dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
  }
};

// ===== API MODULE =====
// Handles all fetch calls to the PHP backend

const API = {
  async call(endpoint, params = {}) {
    try {
      const formData = new FormData();
      for (const key in params) {
        formData.append(key, params[key]);
      }

      const response = await fetch(BACKEND + endpoint, {
        method: 'POST',
        body:   formData
      });

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('API error on ' + endpoint + ':', error);
      return { success: false, message: 'Cannot connect to server. Make sure XAMPP is running.' };
    }
  }
};