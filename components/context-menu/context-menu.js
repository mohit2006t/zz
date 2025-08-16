/**
 * @file context-menu.js
 * @description Optimized ContextMenu with proper popover behavior.
 */

export class ContextMenu {
  // Static property to track all menu instances
  static #instances = new Set();

  constructor(contextMenuElement, options = {}) {
    if (!contextMenuElement || contextMenuElement.contextMenu) return;

    this.element = contextMenuElement;
    this.id = contextMenuElement.id || `context-menu-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };

    // Core elements
    this.trigger = this.element.querySelector('[data-context-menu-trigger]');
    this.content = this.element.querySelector('.context-menu-content');
    
    if (!this.trigger || !this.content) {
      console.error('ContextMenu missing required elements.', this.element);
      return;
    }

    // State
    this.isOpen = false;
    this.submenuCloseTimer = null;

    // Bound event handlers
    this._boundHandlers = {
      trigger: (e) => this._handleTrigger(e),
      outsideClick: (e) => this._handleOutsideClick(e),
      keydown: (e) => this._handleKeydown(e),
    };

    this.init();
    this.element.contextMenu = this;
    ContextMenu.#instances.add(this); // Add instance to static set
  }

  defaults = {
    closeOnItemClick: true,
    submenuDelay: 100,
  }

  init() {
    this.setupStructure();
    this.setupEvents();
    this.element.classList.add('context-menu-initialized');
    this.emit('init');
  }

  setupStructure() {
    this.content.style.position = 'fixed';
    this.content.setAttribute('role', 'menu');
    this.content.setAttribute('data-state', 'closed');
  }

  setupEvents() {
    this.trigger.addEventListener('contextmenu', this._boundHandlers.trigger);

    this.element.querySelectorAll('.context-menu-item, .context-menu-checkbox-item, .context-menu-radio-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        this._handleItemClick(item);
      });
    });

    this.element.querySelectorAll('.context-menu-sub').forEach(sub => {
      sub.addEventListener('mouseenter', () => this._handleSubmenuEnter(sub));
      sub.addEventListener('mouseleave', () => this._handleSubmenuLeave(sub));
    });

    this.content.addEventListener('mouseover', (e) => {
      if (!e.target.closest('.context-menu-sub')) {
        this._closeAllSubmenus();
      }
    });
  }

  _handleTrigger(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // If it's already open, do nothing (or close it, depending on desired UX)
    if (this.isOpen) {
        this.close();
        return;
    }

    // Close all other context menus before opening this one
    ContextMenu.closeAll(this);
    
    this.open(e.clientX, e.clientY);
  }

  _handleOutsideClick(e) {
    if (this.isOpen && !this.content.contains(e.target)) {
      this.close();
    }
  }

  _handleKeydown(e) {
    if (e.key === 'Escape') {
      this.close();
    }
  }

  _handleItemClick(item) {
    if (item.getAttribute('data-disabled') === 'true') return;

    // Handle checkbox and radio items
    if (item.classList.contains('context-menu-checkbox-item')) {
      const isChecked = item.getAttribute('aria-checked') === 'true';
      item.setAttribute('aria-checked', String(!isChecked));
    } else if (item.classList.contains('context-menu-radio-item')) {
      const group = item.closest('.context-menu-radio-group');
      if (group) {
        group.querySelectorAll('.context-menu-radio-item').forEach(radio => {
          radio.setAttribute('aria-checked', 'false');
        });
      }
      item.setAttribute('aria-checked', 'true');
    }

    if (this.options.closeOnItemClick) {
      this.close();
    }
  }
  
  _handleSubmenuEnter(sub) {
    clearTimeout(this.submenuCloseTimer);
    const trigger = sub.querySelector('.context-menu-sub-trigger');
    const content = sub.querySelector('.context-menu-sub-content');
    if (trigger && content) {
      this._openSubmenu(trigger, content);
    }
  }
  
  _handleSubmenuLeave(sub) {
    const content = sub.querySelector('.context-menu-sub-content');
    this.submenuCloseTimer = setTimeout(() => {
        if(content) content.setAttribute('data-state', 'closed');
    }, this.options.submenuDelay);
  }

  // Public API methods
  open(x, y) {
    if (this.isOpen) return;
    this.isOpen = true;
    
    this._positionContent(this.content, x, y);
    this.content.setAttribute('data-state', 'open');
    
    // Add global listeners
    setTimeout(() => {
        document.addEventListener('click', this._boundHandlers.outsideClick);
        document.addEventListener('keydown', this._boundHandlers.keydown);
    }, 0);

    this.emit('open');
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    
    this.content.setAttribute('data-state', 'closed');
    this._closeAllSubmenus();
    
    // Remove global listeners
    document.removeEventListener('click', this._boundHandlers.outsideClick);
    document.removeEventListener('keydown', this._boundHandlers.keydown);

    this.emit('close');
  }

  _positionContent(element, x, y) {
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    
    const rect = element.getBoundingClientRect();
    if (rect.right > window.innerWidth - 8) {
      element.style.left = `${window.innerWidth - rect.width - 8}px`;
    }
    if (rect.bottom > window.innerHeight - 8) {
      element.style.top = `${window.innerHeight - rect.height - 8}px`;
    }
  }
  
  _openSubmenu(trigger, content) {
    this._closeAllSubmenus(content);
    content.setAttribute('data-state', 'open');
    const triggerRect = trigger.getBoundingClientRect();
    content.style.left = `${triggerRect.right - 4}px`;
    content.style.top = `${triggerRect.top - 5}px`;

    const contentRect = content.getBoundingClientRect();
    if (contentRect.right > window.innerWidth - 8) {
      content.style.left = `${triggerRect.left - contentRect.width + 4}px`;
    }
    if (contentRect.bottom > window.innerHeight - 8) {
      content.style.top = `${window.innerHeight - contentRect.height - 8}px`;
    }
  }
  
  _closeAllSubmenus(exclude = null) {
    this.element.querySelectorAll('.context-menu-sub-content').forEach(sub => {
      if (sub !== exclude) sub.setAttribute('data-state', 'closed');
    });
  }

  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`context-menu:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }

  destroy() {
    this.trigger.removeEventListener('contextmenu', this._boundHandlers.trigger);
    this.element.classList.remove('context-menu-initialized');
    delete this.element.contextMenu;
    ContextMenu.#instances.delete(this);
    this.emit('destroy');
  }
  
  // Static method to close all menus
  static closeAll(exclude = null) {
    for (const instance of this.#instances) {
      if (instance !== exclude) {
        instance.close();
      }
    }
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.context-menu:not(.context-menu-initialized)').forEach(el => {
    new ContextMenu(el);
  });
});

export default ContextMenu;
