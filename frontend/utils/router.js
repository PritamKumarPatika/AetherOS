// AetherOS — Simple SPA Router
class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    window.addEventListener('popstate', () => this.resolve());
  }

  register(path, handler) {
    this.routes[path] = handler;
  }

  navigate(path) {
    if (this.currentRoute === path) return;
    window.history.pushState({}, '', `#${path}`);
    this.resolve();
  }

  resolve() {
    const hash = window.location.hash.slice(1) || '/';
    this.currentRoute = hash;
    const handler = this.routes[hash];
    if (handler) {
      handler();
    } else {
      const defaultHandler = this.routes['/'];
      if (defaultHandler) defaultHandler();
    }
    // Update sidebar active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.route === hash);
    });

    // On mobile, close sidebar after navigation
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar && sidebar.classList.contains('active')) {
      sidebar.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
    }
  }
}

const router = new Router();
