// AetherOS — Sidebar Component
function renderSidebar(user) {
  const name = user?.name || 'Alex Johnson';
  const initials = getInitials(name);
  const status = user?.status || 'online';

  const navItems = [
    { icon: '<i class="ph ph-house"></i>', label: 'Home', route: '/' },
    { icon: '<i class="ph ph-robot"></i>', label: 'AI Assistant', route: '/ai' },
    { icon: '<i class="ph ph-check-circle"></i>', label: 'Tasks', route: '/tasks', badge: '' },
    { icon: '<i class="ph ph-folder"></i>', label: 'Projects', route: '/projects' },
    { icon: '<i class="ph ph-calendar-blank"></i>', label: 'Meetings', route: '/meetings' },
    { icon: '<i class="ph ph-calendar"></i>', label: 'Calendar', route: '/calendar' },
    { icon: '<i class="ph ph-chart-bar"></i>', label: 'Reports & Analytics', route: '/analytics' },
    { icon: '<i class="ph ph-book"></i>', label: 'Study', route: '/study' },
    { icon: '<i class="ph ph-gear"></i>', label: 'Settings', route: '/settings' },
  ];

  const currentRoute = window.location.hash.slice(1) || '/';

  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon" style="background:transparent;font-size:1.8rem;border:none"><i class="ph-fill ph-planet" style="color:var(--primary-500)"></i></div>
        <span class="brand-name">AetherOS</span>
      </div>

      <div class="sidebar-profile">
        <div class="avatar">${initials}</div>
        <div class="profile-info">
          <div class="profile-name">${escapeHtml(name)}</div>
          <div class="profile-status" style="display:flex;align-items:center;gap:4px;"><i class="ph-fill ph-circle" style="color:var(--success);font-size:0.5rem"></i> ${status}</div>
        </div>
        <div onclick="API.logout()" style="cursor:pointer;margin-left:auto;padding:8px;color:var(--text-secondary);border-radius:var(--radius-sm);transition:all 0.2s" title="Logout" onmouseover="this.style.color='var(--error)';this.style.background='rgba(239, 68, 68, 0.1)';" onmouseout="this.style.color='var(--text-secondary)';this.style.background='transparent';">
          <i class="ph ph-sign-out" style="font-size:1.2rem"></i>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-label">Menu</div>
        ${navItems.map(item => `
          <div class="nav-item ${item.route === currentRoute ? 'active' : ''}"
               data-route="${item.route}" onclick="router.navigate('${item.route}')">
            <span class="nav-icon">${item.icon}</span>
            <span>${item.label}</span>
            ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
          </div>
        `).join('')}
      </nav>
    </aside>
  `;
}
