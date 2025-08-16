/**
 * @file dropdown-menu.js
 * @description Optimized DropdownMenu with better performance and memory management.
 */

export class DropdownMenu {
  constructor(dropdownElement, options = {}) {
    if (!dropdownElement || dropdownElement.dropdownMenu) return;

    this.element = dropdownElement;
    this.id = dropdownElement.id || `dropdown-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };

    // Core elements (cached)
    this.trigger = this.element.querySelector('.dropdown-menu-trigger');
    this.content = this.element.querySelector('.dropdown-menu-content');

    if (!this.trigger || !this.content) {
      console.error('DropdownMenu is missing trigger or content element.', this.element);
      return;
    }

    // State
    this.isPortaled = this.element.querySelector('.dropdown-menu-portal') !== null;
    this.originalParent = this.content.parentElement;
    this.submenuCloseTimer = null;
    this._isOpen = false;

    // Optimized event handlers (bound once)
    this._boundHandlers = {
      triggerClick: (e) => this._handleTriggerClick(e),
      outsideClick: (e) => this._handleOutsideClick(e),
      keydown: (e) => this._handleKeydown(e),
      contentMouseover: (e) => this._handleContentMouseover(e)
    };

    // Cache DOM queries
    this._cachedElements = {
      items: null,
      submenus: null
    };

    this.init();
    this.element.dropdownMenu = this;
  }

  defaults = {
    closeOnSelect: true,
    sideOffset: 4,
    viewportPadding: 8,
    submenuDelay: 100
  }

  get isOpen() {
    return this._isOpen;
  }

  // Cached getters for performance
  get items() {
    if (!this._cachedElements.items) {
      this._cachedElements.items = Array.from(
        this.element.querySelectorAll('.dropdown-menu-item, .dropdown-menu-checkbox-item, .dropdown-menu-radio-item')
      );
    }
    return this._cachedElements.items;
  }

  get submenus() {
    if (!this._cachedElements.submenus) {
      this._cachedElements.submenus = Array.from(this.element.querySelectorAll('.dropdown-menu-sub'));
    }
    return this._cachedElements.submenus;
  }

  init() {
    this.setupInitialState();
    this.setupEvents();
    this.setupSubmenus();
    
    this.element.classList.add('dropdown-menu-initialized');
    this.emit('init', { totalItems: this.items.length });
  }

  setupInitialState() {
    this.content.setAttribute('data-state', 'closed');
  }

  setupEvents() {
    // Main trigger
    this.trigger.addEventListener('mousedown', this._boundHandlers.triggerClick);

    // Items (single delegation)
    this.content.addEventListener('click', (e) => {
      const item = e.target.closest('.dropdown-menu-item, .dropdown-menu-checkbox-item, .dropdown-menu-radio-item');
      if (item) this._handleItemClick(item);
    });

    // Content mouseover for submenu handling
    this.content.addEventListener('mouseover', this._boundHandlers.contentMouseover);
  }

  setupSubmenus() {
    this.submenus.forEach(sub => {
      const trigger = sub.querySelector('.dropdown-menu-sub-trigger');
      const content = sub.querySelector('.dropdown-menu-sub-content');
      
      if (trigger && content) {
        content.setAttribute('data-state', 'closed');
        
        // Use passive listeners where possible
        sub.addEventListener('mouseenter', () => {
          clearTimeout(this.submenuCloseTimer);
          this.openSubmenu(trigger, content);
        }, { passive: true });
        
        sub.addEventListener('mouseleave', () => {
          this.submenuCloseTimer = setTimeout(() => {
            content.setAttribute('data-state', 'closed');
          }, this.options.submenuDelay);
        }, { passive: true });
      }
    });
  }

  _handleTriggerClick(e) {
    e.stopPropagation();
    this.toggle();
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

  _handleContentMouseover(e) {
    if (!e.target.closest('.dropdown-menu-sub')) {
      this.closeAllSubmenus();
    }
  }

  _handleItemClick(item) {
    if (item.classList.contains('dropdown-menu-item-disabled')) return;

    this._handleItemState(item);

    const shouldKeepOpen = this._shouldKeepOpen(item);
    
    this.emit('select', {
      item,
      value: item.textContent?.trim(),
      shouldKeepOpen
    });

    if (!shouldKeepOpen && this.options.closeOnSelect) {
      this.close();
    }
  }

  _handleItemState(item) {
    if (item.classList.contains('dropdown-menu-checkbox-item')) {
      const isChecked = item.getAttribute('aria-checked') === 'true';
      item.setAttribute('aria-checked', String(!isChecked));
    } else if (item.classList.contains('dropdown-menu-radio-item')) {
      const group = item.closest('.dropdown-menu-radio-group');
      if (group) {
        // Efficient batch update
        const radios = group.querySelectorAll('.dropdown-menu-radio-item');
        radios.forEach(radio => radio.setAttribute('aria-checked', 'false'));
      }
      item.setAttribute('aria-checked', 'true');
    }
  }

  _shouldKeepOpen(item) {
    return item.closest('.dropdown-menu-sub-content') ||
           item.classList.contains('dropdown-menu-checkbox-item') ||
           item.classList.contains('dropdown-menu-radio-item');
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    if (this.isOpen) return;

    // Close other dropdowns efficiently
    DropdownMenu._closeAllExcept(this.element);

    this._isOpen = true;

    if (this.isPortaled) {
      document.body.appendChild(this.content);
    }

    // Batch DOM updates
    document.body.style.overflow = 'hidden';
    this.content.setAttribute('data-state', 'open');
    
    this.positionContent();
    this._addGlobalListeners();

    this.emit('open');
  }

  close() {
    if (!this.isOpen) return;

    this._isOpen = false;

    // Batch DOM updates
    document.body.style.overflow = '';
    this.content.setAttribute('data-state', 'closed');
    
    this.closeAllSubmenus();
    this._removeGlobalListeners();

    if (this.isPortaled && this.content.parentElement === document.body) {
      // Use animation frame for smoother transition
      requestAnimationFrame(() => {
        setTimeout(() => {
          this.originalParent.appendChild(this.content);
        }, 150);
      });
    }

    this.emit('close');
  }

  // Static method for efficient global close
  static _closeAllExcept(exceptElement) {
    const openDropdowns = document.querySelectorAll('.dropdown-menu-initialized');
    for (const dropdown of openDropdowns) {
      if (dropdown !== exceptElement && dropdown.dropdownMenu?.isOpen) {
        dropdown.dropdownMenu.close();
      }
    }
  }

  _addGlobalListeners() {
    // Use setTimeout to avoid immediate trigger
    setTimeout(() => {
      document.addEventListener('mousedown', this._boundHandlers.outsideClick);
      document.addEventListener('keydown', this._boundHandlers.keydown);
    }, 0);
  }

  _removeGlobalListeners() {
    document.removeEventListener('mousedown', this._boundHandlers.outsideClick);
    document.removeEventListener('keydown', this._boundHandlers.keydown);
  }

  positionContent() {
    // Reset styles
    this.content.style.minWidth = this.content.style.width ? '0' : '';

    const position = this._calculatePosition();
    
    // Batch style updates
    Object.assign(this.content.style, {
      maxHeight: `${window.innerHeight - 2 * this.options.viewportPadding}px`,
      top: `${position.top}px`,
      left: `${position.left}px`
    });
  }

  _calculatePosition() {
    const side = this._getSide();
    const align = this._getAlignment();
    
    const triggerRect = this.trigger.getBoundingClientRect();
    const contentRect = this.content.getBoundingClientRect();
    
    let { top, left } = this._getPositionForSide(side, triggerRect, contentRect);
    ({ top, left } = this._adjustForAlignment(side, align, top, left, triggerRect, contentRect));
    ({ top, left } = this._constrainToViewport(top, left, contentRect));

    return { top, left };
  }

  _getSide() {
    if (this.element.classList.contains('dropdown-menu-top')) return 'top';
    if (this.element.classList.contains('dropdown-menu-left')) return 'left';
    if (this.element.classList.contains('dropdown-menu-right')) return 'right';
    return 'bottom';
  }

  _getAlignment() {
    if (this.element.classList.contains('dropdown-menu-align-center')) return 'center';
    if (this.element.classList.contains('dropdown-menu-align-end')) return 'end';
    return 'start';
  }

  _getPositionForSide(side, triggerRect, contentRect) {
    const { sideOffset } = this.options;
    
    switch (side) {
      case 'top':
        return { top: triggerRect.top - contentRect.height - sideOffset, left: 0 };
      case 'bottom':
        return { top: triggerRect.bottom + sideOffset, left: 0 };
      case 'left':
        return { top: 0, left: triggerRect.left - contentRect.width - sideOffset };
      case 'right':
        return { top: 0, left: triggerRect.right + sideOffset };
      default:
        return { top: 0, left: 0 };
    }
  }

  _adjustForAlignment(side, align, top, left, triggerRect, contentRect) {
    if (side === 'top' || side === 'bottom') {
      switch (align) {
        case 'start':
          left = triggerRect.left;
          break;
        case 'center':
          left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
          break;
        case 'end':
          left = triggerRect.right - contentRect.width;
          break;
      }
    } else {
      switch (align) {
        case 'start':
          top = triggerRect.top;
          break;
        case 'center':
          top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
          break;
        case 'end':
          top = triggerRect.bottom - contentRect.height;
          break;
      }
    }
    
    return { top, left };
  }

  _constrainToViewport(top, left, contentRect) {
    const { viewportPadding } = this.options;
    
    // Constrain to viewport
    if (left + contentRect.width > window.innerWidth - viewportPadding) {
      left = window.innerWidth - contentRect.width - viewportPadding;
    }
    if (left < viewportPadding) left = viewportPadding;
    if (top < viewportPadding) top = viewportPadding;
    
    return { top, left };
  }

  openSubmenu(trigger, content) {
    this.closeAllSubmenus(content);
    content.setAttribute('data-state', 'open');
    
    const triggerRect = trigger.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    
    let left = triggerRect.right - 4;
    let top = triggerRect.top - 5;

    // Viewport constraints
    if (left + contentRect.width > window.innerWidth - 8) {
      left = triggerRect.left - contentRect.width + 4;
    }
    if (top + contentRect.height > window.innerHeight - 8) {
      top = window.innerHeight - contentRect.height - 8;
    }
    if (top < 8) top = 8;

    // Batch style updates
    Object.assign(content.style, {
      left: `${left}px`,
      top: `${top}px`
    });

    this.emit('submenu:open', { trigger, content });
  }

  closeAllSubmenus(exclude = null) {
    const subcontents = this.element.querySelectorAll('.dropdown-menu-sub-content');
    for (const sub of subcontents) {
      if (sub !== exclude) {
        sub.setAttribute('data-state', 'closed');
      }
    }
  }

  // Clear cached elements
  _clearCache() {
    this._cachedElements.items = null;
    this._cachedElements.submenus = null;
  }

  // Custom event system
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`dropdown:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }

  // Cleanup method
  destroy() {
    // Clear timers
    clearTimeout(this.submenuCloseTimer);

    // Remove event listeners
    this.trigger.removeEventListener('mousedown', this._boundHandlers.triggerClick);
    this.content.removeEventListener('mouseover', this._boundHandlers.contentMouseover);
    
    this._removeGlobalListeners();

    // Clean up cached elements
    this._clearCache();

    // Clean up DOM
    this.element.classList.remove('dropdown-menu-initialized');
    delete this.element.dropdownMenu;

    this.emit('destroy');
  }
}

// Optimized global handlers
const dropdownGlobals = {
  init() {
    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.autoInit);
    } else {
      this.autoInit();
    }
  },

  autoInit() {
    const dropdowns = document.querySelectorAll('.dropdown-menu:not(.dropdown-menu-initialized)');
    for (const el of dropdowns) {
      el.dropdownMenu = new DropdownMenu(el);
    }
  }
};

// Initialize
dropdownGlobals.init();

export default DropdownMenu;
