// AetherOS — App Entry Point
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  // Initialize user
  try {
    const user = await API.getUser();
    if (user && !user.error) {
      // Render shell
      document.getElementById('app').innerHTML = `
        <!-- Mobile Header -->
        <div class="mobile-header">
          <div class="sidebar-brand">
            <div class="brand-icon" style="background:transparent;font-size:1.8rem;border:none"><i class="ph-fill ph-planet" style="color:var(--primary-500)"></i></div>
            <span class="brand-name">AetherOS</span>
          </div>
          <button id="mobile-menu-btn" class="mobile-menu-btn">
            <i class="ph ph-list"></i>
          </button>
        </div>
        ${renderSidebar(user.user || user)}
        <div id="sidebar-overlay" class="sidebar-overlay"></div>
        <main class="main-content" id="page-content"></main>
      `;

      // Mobile Menu Toggle
      const mobileBtn = document.getElementById('mobile-menu-btn');
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebar-overlay');

      if (mobileBtn && sidebar && overlay) {
        mobileBtn.addEventListener('click', () => {
          sidebar.classList.toggle('active');
          overlay.classList.toggle('active');
        });

        overlay.addEventListener('click', () => {
          sidebar.classList.remove('active');
          overlay.classList.remove('active');
        });
      }

      // Register routes
      router.register('/', renderDashboard);
      router.register('/ai', renderAIPage);
      router.register('/tasks', renderTasksPage);
      router.register('/projects', renderProjectsPage);
      router.register('/meetings', renderMeetingsPage);
      router.register('/calendar', renderCalendarPage);
      router.register('/analytics', renderAnalyticsPage);
      router.register('/study', renderStudyPage);
      router.register('/settings', renderSettingsPage);

      // Resolve initial route
      router.resolve();
    }
  } catch (error) {
    console.error("Initialization error:", error);
    localStorage.removeItem('token');
    window.location.href = '/login.html';
  }
});
