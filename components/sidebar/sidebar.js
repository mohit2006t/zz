/**
 * @file sidebar.js
 * @description Optimized Sidebar with class-based architecture
 * - Smaller bundle size
 * - Better performance
 * - Memory leak prevention
 */

export class Sidebar {
  constructor(element, options = {}) {
    if (!element || element.sidebar) return;
    
    this.element = element;
    this.id = element.id || `sidebar-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };
    this.state = this.loadState();
    
    this.init();
    element.sidebar = this;
  }

  defaults = {
    breakpoint: 768,
    saveState: true,
    overlay: true
  }

  init() {
    this.provider = this.element.closest('.sidebar-provider');
    this.overlay = this.provider?.querySelector('.sidebar-overlay');
    this.applyState();
    
    // Mark as initialized to prevent duplicate initialization
    this.element.classList.add('sidebar-initialized');
  }

  toggle() {
    const isMobile = window.innerWidth <= this.options.breakpoint;
    
    if (isMobile) {
      this.toggleMobile();
    } else {
      this.toggleDesktop();
    }
    
    this.emit('toggle', { state: this.state });
  }

  toggleMobile() {
    this.state = this.state === 'open' ? 'closed' : 'open';
    this.element.classList.toggle('open', this.state === 'open');
    this.overlay?.classList.toggle('open', this.state === 'open');
  }

  toggleDesktop() {
    this.state = this.state === 'collapsed' ? 'expanded' : 'collapsed';
    this.element.classList.toggle('collapsed', this.state === 'collapsed');
    
    if (this.options.saveState) {
      this.saveState();
    }
  }

  // Optimized state management
  saveState() {
    if (!this.options.saveState) return;
    try {
      localStorage.setItem(`sidebar-${this.id}`, this.state);
    } catch (e) {
      console.warn('Could not save sidebar state');
    }
  }

  loadState() {
    if (!this.options.saveState) return 'expanded';
    try {
      return localStorage.getItem(`sidebar-${this.id}`) || 'expanded';
    } catch (e) {
      return 'expanded';
    }
  }

  applyState() {
    const isMobile = window.innerWidth <= this.options.breakpoint;
    
    if (isMobile) {
      this.element.classList.remove('collapsed');
      this.element.classList.toggle('open', this.state === 'open');
    } else {
      this.element.classList.remove('open');
      this.element.classList.toggle('collapsed', this.state === 'collapsed');
    }
  }

  // Custom event system
  emit(event, data) {
    this.element.dispatchEvent(new CustomEvent(`sidebar:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }

  // Cleanup method
  destroy() {
    this.element.classList.remove('sidebar-initialized');
    delete this.element.sidebar;
  }
}

// Optimized global handlers with better performance
const sidebarGlobals = {
  resizeTimeout: null,
  
  init() {
    // Throttled resize handler
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Efficient click delegation
    document.addEventListener('click', this.handleClick.bind(this));
    
    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.autoInit.bind(this));
    } else {
      this.autoInit();
    }
  },

  handleResize() {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      document.querySelectorAll('.sidebar-initialized').forEach(sidebar => {
        sidebar.sidebar?.applyState();
      });
    }, 100);
  },

  handleClick(e) {
    // Handle triggers
    const trigger = e.target.closest('.sidebar-trigger');
    if (trigger) {
      const sidebarId = trigger.dataset.controls;
      const sidebar = sidebarId ? document.getElementById(sidebarId) : null;
      sidebar?.sidebar?.toggle();
      return;
    }

    // Handle overlay clicks
    if (e.target.classList.contains('sidebar-overlay')) {
      const provider = e.target.closest('.sidebar-provider');
      const openSidebar = provider?.querySelector('.sidebar.open');
      if (openSidebar?.sidebar) {
        openSidebar.sidebar.state = 'closed';
        openSidebar.sidebar.applyState();
      }
    }
  },

  autoInit() {
    document.querySelectorAll('.sidebar:not(.sidebar-initialized)').forEach(el => {
      new Sidebar(el);
    });
  }
};

// Initialize
sidebarGlobals.init();

export default Sidebar;
