/**
 * @file menubar.js
 * @description Optimized Menubar with class-based architecture.
 */

export class Menubar {
  constructor(menubarElement, options = {}) {
    if (!menubarElement || menubarElement.menubar) return;

    this.element = menubarElement;
    this.id = menubarElement.id || `menubar-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };

    // Core state
    this.activeMenu = null;
    this.submenuCloseTimer = null;
    this.menus = [];

    // Bound event handlers for proper cleanup
    this._boundHandlers = {
      keydown: (e) => this._handleGlobalKeydown(e),
      click: (e) => this._handleGlobalClick(e)
    };

    this.init();
    this.element.menubar = this;
  }

  defaults = {
    closeOnEscape: true,
    closeOnOutsideClick: true
  }

  init() {
    this.setupStructure();
    this.setupMenus();
    this.setupGlobalEvents();
    
    this.element.classList.add('menubar-initialized');
    this.emit('init');
  }

  setupStructure() {
    // Ensure proper ARIA attributes
    this.element.setAttribute('role', 'menubar');
    if (!this.element.hasAttribute('aria-label')) {
      this.element.setAttribute('aria-label', 'Main menu');
    }
  }

  setupMenus() {
    const menuElements = Array.from(this.element.querySelectorAll('.menubar-menu'));
    this.menus = menuElements.map(el => new MenubarMenu(this, el));
  }

  setupGlobalEvents() {
    document.addEventListener('keydown', this._boundHandlers.keydown);
    document.addEventListener('click', this._boundHandlers.click);
  }

  _handleGlobalKeydown(e) {
    if (e.key === 'Escape' && this.activeMenu && this.options.closeOnEscape) {
      this.closeAllMenus();
    }
  }

  _handleGlobalClick(e) {
    if (this.activeMenu && !this.element.contains(e.target) && this.options.closeOnOutsideClick) {
      this.closeAllMenus();
    }
  }

  // Public API methods
  openMenu(menuToOpen) {
    if (this.activeMenu && this.activeMenu !== menuToOpen) {
      this.activeMenu.close();
    }
    this.activeMenu = menuToOpen;
    this.activeMenu.open();
    this.emit('menu-open', { menu: menuToOpen });
  }

  closeAllMenus() {
    if (this.activeMenu) {
      this.activeMenu.close();
      this.activeMenu = null;
      this.emit('menu-close-all');
    }
  }

  closeSubMenus(parentMenu) {
    clearTimeout(this.submenuCloseTimer);
    this.submenuCloseTimer = setTimeout(() => {
      parentMenu.subMenus.forEach(sub => sub.close());
    }, 100);
  }
  
  openSubMenu(submenuToOpen) {
    clearTimeout(this.submenuCloseTimer);
    submenuToOpen.parentMenu.subMenus.forEach(sub => {
      if (sub !== submenuToOpen) sub.close();
    });
    submenuToOpen.open();
    this.emit('submenu-open', { submenu: submenuToOpen });
  }

  // Custom event system
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`menubar:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }

  // Cleanup method
  destroy() {
    // Clear timers
    clearTimeout(this.submenuCloseTimer);

    // Close all menus
    this.closeAllMenus();

    // Remove global event listeners
    document.removeEventListener('keydown', this._boundHandlers.keydown);
    document.removeEventListener('click', this._boundHandlers.click);

    // Destroy menu instances
    this.menus.forEach(menu => menu.destroy());

    // Clean up DOM
    this.element.classList.remove('menubar-initialized');
    delete this.element.menubar;

    this.emit('destroy');
  }
}

class MenubarMenu {
  constructor(controller, menuElement) {
    this.controller = controller;
    this.element = menuElement;
    this.trigger = menuElement.querySelector('.menubar-trigger');
    this.content = menuElement.querySelector('.menubar-content');
    this.subMenus = [];

    if (!this.trigger || !this.content) {
      console.error('MenubarMenu missing required elements', menuElement);
      return;
    }

    this.init();
  }

  init() {
    this.setupStructure();
    this.setupEvents();
    this.setupSubMenus();
  }

  setupStructure() {
    // ARIA attributes
    this.trigger.setAttribute('role', 'menuitem');
    this.trigger.setAttribute('aria-haspopup', 'true');
    this.trigger.setAttribute('aria-expanded', 'false');
    this.content.setAttribute('role', 'menu');
  }

  setupEvents() {
    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.controller.activeMenu === this ? 
        this.controller.closeAllMenus() : 
        this.controller.openMenu(this);
    });

    this.trigger.addEventListener('mouseenter', () => {
      if (this.controller.activeMenu && this.controller.activeMenu !== this) {
        this.controller.openMenu(this);
      }
    });
    
    this.content.addEventListener('click', (e) => {
      const item = e.target.closest('.menubar-item, .menubar-checkbox-item, .menubar-radio-item');
      if (!item || item.classList.contains('menubar-item-disabled')) return;

      if (item.classList.contains('menubar-checkbox-item')) {
        const isChecked = item.getAttribute('aria-checked') === 'true';
        item.setAttribute('aria-checked', String(!isChecked));
        this.controller.emit('checkbox-change', { item, checked: !isChecked });
      } else if (item.classList.contains('menubar-radio-item')) {
        const group = item.closest('.menubar-radio-group');
        if (group) {
          group.querySelectorAll('.menubar-radio-item').forEach(radio => {
            radio.setAttribute('aria-checked', 'false');
          });
        }
        item.setAttribute('aria-checked', 'true');
        this.controller.emit('radio-change', { item, group });
      }

      this.controller.emit('item-click', { item });

      // Close the entire menubar unless the click was inside a submenu
      if (!e.target.closest('.menubar-sub')) {
        this.controller.closeAllMenus();
      }
    });
  }

  setupSubMenus() {
    const subElements = Array.from(this.element.querySelectorAll('.menubar-sub'));
    this.subMenus = subElements.map(el => new MenubarSub(this, el));
  }
  
  open() {
    this.trigger.setAttribute('data-state', 'open');
    this.trigger.setAttribute('aria-expanded', 'true');
    this.content.setAttribute('data-state', 'open');
    this._positionContent();
  }

  close() {
    this.trigger.setAttribute('data-state', 'closed');
    this.trigger.setAttribute('aria-expanded', 'false');
    this.content.setAttribute('data-state', 'closed');
    this.subMenus.forEach(sub => sub.close());
  }
  
  _positionContent() {
    const sideOffset = 8;
    const viewportPadding = 8;
    const triggerRect = this.trigger.getBoundingClientRect();
    
    this.content.style.maxHeight = `${window.innerHeight - 2 * viewportPadding}px`;
    const contentRect = this.content.getBoundingClientRect();

    const space = {
      above: triggerRect.top - viewportPadding,
      below: window.innerHeight - triggerRect.bottom - viewportPadding,
    };

    let finalSide = 'bottom';
    if (space.below < contentRect.height && space.above > space.below) {
      finalSide = 'top';
    }

    let top = (finalSide === 'top') ? 
      triggerRect.top - contentRect.height - sideOffset : 
      triggerRect.bottom + sideOffset;
    let left = triggerRect.left;

    if (left + contentRect.width > window.innerWidth - viewportPadding) {
      left = window.innerWidth - contentRect.width - viewportPadding;
    }
    if (left < viewportPadding) {
      left = viewportPadding;
    }
    
    this.content.style.top = `${top}px`;
    this.content.style.left = `${left}px`;
  }

  destroy() {
    // Destroy submenus
    this.subMenus.forEach(sub => sub.destroy());
  }
}

class MenubarSub {
  constructor(parentMenu, subElement) {
    this.parentMenu = parentMenu;
    this.element = subElement;
    this.trigger = this.element.querySelector('.menubar-sub-trigger');
    this.content = this.element.querySelector('.menubar-sub-content');

    if (!this.trigger || !this.content) {
      console.error('MenubarSub missing required elements', subElement);
      return;
    }

    this.init();
  }

  init() {
    this.setupStructure();
    this.setupEvents();
  }

  setupStructure() {
    this.trigger.setAttribute('role', 'menuitem');
    this.trigger.setAttribute('aria-haspopup', 'true');
    this.trigger.setAttribute('aria-expanded', 'false');
    this.content.setAttribute('role', 'menu');
  }

  setupEvents() {
    this.element.addEventListener('mouseenter', () => {
      this.parentMenu.controller.openSubMenu(this);
    });

    this.element.addEventListener('mouseleave', () => {
      this.parentMenu.controller.closeSubMenus(this.parentMenu);
    });
  }
  
  open() {
    this.trigger.setAttribute('aria-expanded', 'true');
    this.content.setAttribute('data-state', 'open');
    this._positionContent();
  }
  
  close() {
    this.trigger.setAttribute('aria-expanded', 'false');
    this.content.setAttribute('data-state', 'closed');
  }
  
  _positionContent() {
    const triggerRect = this.trigger.getBoundingClientRect();
    this.content.style.left = `${triggerRect.right - 4}px`;
    this.content.style.top = `${triggerRect.top - 5}px`;
    
    const contentRect = this.content.getBoundingClientRect();
    if (contentRect.right > window.innerWidth - 8) {
      this.content.style.left = `${triggerRect.left - contentRect.width + 4}px`;
    }
    if (contentRect.bottom > window.innerHeight - 8) {
      this.content.style.top = `${window.innerHeight - contentRect.height - 8}px`;
    }
    if (contentRect.top < 8) {
      this.content.style.top = '8px';
    }
  }

  destroy() {
    // No additional cleanup needed for submenus
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-menubar]:not(.menubar-initialized)').forEach(el => {
    new Menubar(el);
  });
});

export default Menubar;
