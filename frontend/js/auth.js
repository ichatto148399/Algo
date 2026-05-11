// =============================================
// auth.js - Handles login, logout, and session
// Connects to the PHP backend
// =============================================

// The URL where our PHP backend files are located
// Change this if your backend is in a different folder
const BACKEND_URL = '../backend';

// =============================================
// AUTH - Login, Logout, Session
// =============================================
const Auth = {

  // This holds the currently logged in user
  currentUser: null,

  // Load user from session storage (so login persists on page refresh)
  init() {
    const stored = sessionStorage.getItem('currentUser');
    if (stored) {
      this.currentUser = JSON.parse(stored);
    }
  },

  // Send login request to auth.php
  async login(username, password) {
    try {
      // Build the form data to send to PHP
      const formData = new FormData();
      formData.append('action',   'login');
      formData.append('username', username);
      formData.append('password', password);

      // Send the request to auth.php
      const response = await fetch(BACKEND_URL + '/auth.php', {
        method: 'POST',
        body:   formData
      });

      const result = await response.json();

      // If login was successful, save the user
      if (result.success) {
        this.currentUser = result.user;
        sessionStorage.setItem('currentUser', JSON.stringify(result.user));
      }

      return result;

    } catch (error) {
      console.log('Login error:', error);
      return { success: false, message: 'Could not connect to server. Make sure XAMPP is running.' };
    }
  },

  // Log out the current user
  async logout() {
    try {
      const formData = new FormData();
      formData.append('action', 'logout');
      await fetch(BACKEND_URL + '/auth.php', { method: 'POST', body: formData });
    } catch (error) {
      console.log('Logout error:', error);
    }

    // Clear local session and go back to login page
    this.currentUser = null;
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
  },

  // Check if user is logged in, redirect if not
  requireAuth(allowedRoles = []) {
    this.init();

    if (!this.currentUser) {
      window.location.href = 'index.html';
      return false;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(this.currentUser.role)) {
      window.location.href = 'dashboard.html';
      return false;
    }

    return true;
  },

  // Check if current user has permission to do something
  can(action) {
    if (!this.currentUser) return false;

    const role = this.currentUser.role;

    const permissions = {
      admin:     ['all'],
      registrar: ['manage_subjects', 'manage_loading', 'manage_rooms', 'manage_schedules', 'view_reports', 'manage_users_view'],
      faculty:   ['view_schedule', 'request_change']
    };

    const userPerms = permissions[role] || [];
    return userPerms.includes('all') || userPerms.includes(action);
  }
};

// =============================================
// API - Helper to call backend PHP files easily
// Usage: API.call('users.php', { action: 'get_all' })
// =============================================
const API = {

  async call(file, data = {}) {
    try {
      const formData = new FormData();

      // Add all the data fields to the form
      for (const key in data) {
        formData.append(key, data[key]);
      }

      const response = await fetch(BACKEND_URL + '/' + file, {
        method: 'POST',
        body:   formData
      });

      const result = await response.json();
      return result;

    } catch (error) {
      console.log('API error calling ' + file + ':', error);
      return { success: false, message: 'Could not connect to server.' };
    }
  }
};

// =============================================
// UI - Shared helpers for modals, toasts, sidebar
// =============================================
const UI = {

  // Show a small popup message at the top right
  showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast ' + (type === 'error' ? 'error' : type === 'warning' ? 'warning' : '');

    const icons = { success: '✓', error: '✕', warning: '⚠' };
    toast.innerHTML = `<span style="font-size:16px">${icons[type] || '✓'}</span><span>${message}</span>`;
    container.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all .3s';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  openModal(id)  { document.getElementById(id)?.classList.add('active'); },
  closeModal(id) { document.getElementById(id)?.classList.remove('active'); },

  confirm(message, onConfirm) {
    if (window.confirm(message)) onConfirm();
  },

  // Draw the sidebar navigation
  renderSidebar(activePage) {
    const user = Auth.currentUser;
    if (!user) return;

    const navItems = {
      admin: [
        { icon: 'grid',       label: 'Dashboard',       page: 'dashboard' },
        { icon: 'users',      label: 'User Management',  page: 'users' },
        { icon: 'book',       label: 'Subjects',         page: 'subjects' },
        { icon: 'user-check', label: 'Faculty Loading',  page: 'faculty-loading' },
        { icon: 'home',       label: 'Room Management',  page: 'rooms' },
        { icon: 'calendar',   label: 'Schedules',        page: 'schedules' },
        { icon: 'bar-chart',  label: 'Reports',          page: 'reports' },
      ],
      registrar: [
        { icon: 'grid',       label: 'Dashboard',       page: 'dashboard' },
        { icon: 'book',       label: 'Subjects',         page: 'subjects' },
        { icon: 'user-check', label: 'Faculty Loading',  page: 'faculty-loading' },
        { icon: 'home',       label: 'Room Management',  page: 'rooms' },
        { icon: 'calendar',   label: 'Schedules',        page: 'schedules' },
        { icon: 'bar-chart',  label: 'Reports',          page: 'reports' },
      ],
      faculty: [
        { icon: 'grid',     label: 'Dashboard',       page: 'dashboard' },
        { icon: 'calendar', label: 'My Schedule',      page: 'schedules' },
        { icon: 'home',     label: 'Room Assignments', page: 'rooms' },
        { icon: 'edit',     label: 'Change Requests',  page: 'change-requests' },
      ]
    };

    const svgIcons = {
      grid:        '<path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z"/>',
      users:       '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
      book:        '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
      'user-check':'<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>',
      home:        '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
      calendar:    '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
      'bar-chart': '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
      edit:        '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    };

    const roleColors = { admin: '#e8a020', registrar: '#17a2b8', faculty: '#28a745' };
    const initials   = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const items      = navItems[user.role] || [];

    document.getElementById('sidebar').innerHTML = `
      <div class="sidebar-header">
        <div class="brand">
          <div class="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="22" height="22">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8"  y1="2" x2="8"  y2="6"/>
              <line x1="3"  y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div class="brand-text"><h2>UMSync</h2><span>Academic Scheduler</span></div>
        </div>
      </div>
      <div class="sidebar-user">
        <div class="user-avatar" style="background:${roleColors[user.role]}">${initials}</div>
        <div class="user-info">
          <div class="user-name">${user.name}</div>
          <div class="user-role">${user.role}</div>
        </div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section">Navigation</div>
        ${items.map(item => `
          <div class="nav-item ${activePage === item.page ? 'active' : ''}"
               onclick="window.location.href='${item.page === 'dashboard' ? 'dashboard' : item.page}.html'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              ${svgIcons[item.icon] || ''}
            </svg>
            <span>${item.label}</span>
          </div>`).join('')}
      </nav>
      <div class="sidebar-footer">
        <div class="nav-item" onclick="Auth.logout()" style="color:rgba(255,255,255,0.7)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Logout</span>
        </div>
      </div>`;
  },

  // Draw the top bar
  renderTopbar(title, subtitle = '') {
    document.getElementById('topbar').innerHTML = `
      <div class="topbar-left">
        <div>
          <h2>${title}</h2>
          ${subtitle ? `<div class="breadcrumb">${subtitle}</div>` : ''}
        </div>
      </div>
      <div class="topbar-right">
        <div style="font-size:13px;color:var(--text-muted)">
          ${new Date().toLocaleDateString('en-PH', { weekday:'short', year:'numeric', month:'short', day:'numeric' })}
        </div>
      </div>`;
  }
};