/**
 * @file select.js
 * @description Optimized Select with better performance and smaller bundle size.
 */

export class Select {
  constructor(selectElement, options = {}) {
    if (!selectElement || selectElement.select) return;

    this.element = selectElement;
    this.id = selectElement.id || `select-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };

    // Core elements (cached once)
    this.trigger = this.element.querySelector('.select-trigger');
    this.content = this.element.querySelector('.select-content');
    this.valueEl = this.element.querySelector('.select-value');

    if (!this.trigger || !this.content || this.trigger.disabled) return;

    // State
    this.isOpen = false;
    this._items = null; // Cached items array

    // Optimized event handlers (bound once)
    this._boundHandlers = {
      toggle: (e) => this._handleToggle(e),
      contentClick: (e) => this._handleContentClick(e),
      initialHover: () => this._handleInitialHover()
    };

    this.init();
    this.element.select = this;
  }

  defaults = {
    closeOnSelect: true,
    placeholder: 'Select an option...'
  }

  init() {
    this.setupAccessibility();
    this.setupEvents();
    this.setupInitialState();
    
    this.element.classList.add('select-initialized');
    this.emit('init', { totalOptions: this.items.length });
  }

  // Cached getter for items
  get items() {
    if (!this._items) {
      this._items = Array.from(this.content.querySelectorAll('.select-item'));
    }
    return this._items;
  }

  // Clear cache when items change
  _clearItemsCache() {
    this._items = null;
  }

  setupAccessibility() {
    // Batch DOM updates
    this.trigger.setAttribute('aria-haspopup', 'listbox');
    this.trigger.setAttribute('aria-expanded', 'false');
    this.content.setAttribute('role', 'listbox');
    
    // Single iteration for items setup
    this.items.forEach((item, index) => {
      const updates = {
        'role': 'option',
        'aria-selected': 'false'
      };
      
      if (!item.id) {
        updates.id = `${this.id}-option-${index}`;
      }
      
      // Apply all attributes at once
      Object.entries(updates).forEach(([attr, value]) => {
        item.setAttribute(attr, value);
      });
    });
  }

  setupEvents() {
    this.trigger.addEventListener('click', this._boundHandlers.toggle);
    this.content.addEventListener('click', this._boundHandlers.contentClick);
  }

  setupInitialState() {
    const selectedItem = this.content.querySelector('.select-item-selected');
    if (selectedItem) {
      this.selectItem(selectedItem, false);
    } else if (this.valueEl?.textContent?.trim() === '') {
      this.valueEl.classList.add('select-value-placeholder');
    }
  }

  _handleToggle(e) {
    e.stopPropagation();
    this.toggle();
  }

  _handleContentClick(e) {
    const item = e.target.closest('.select-item');
    if (!item) return;
    
    e.stopPropagation();
    this.selectItem(item);
    
    if (this.options.closeOnSelect) {
      this.close();
    }
  }

  _handleInitialHover() {
    this.content.classList.add('is-hovering');
  }

  selectItem(item, shouldEmit = true) {
    const textEl = item.querySelector('.select-item-text');
    if (!textEl) return;

    const newValue = textEl.textContent;
    
    // Early return if same value
    if (this.valueEl.textContent === newValue) return;

    // Batch DOM updates
    this.valueEl.textContent = newValue;
    this.valueEl.classList.remove('select-value-placeholder');

    // Efficient selection update
    const currentSelected = this.content.querySelector('.select-item-selected');
    if (currentSelected && currentSelected !== item) {
      currentSelected.classList.remove('select-item-selected');
      currentSelected.setAttribute('aria-selected', 'false');
    }
    
    item.classList.add('select-item-selected');
    item.setAttribute('aria-selected', 'true');

    if (shouldEmit) {
      this.emit('select', {
        item,
        value: newValue,
        index: this.items.indexOf(item)
      });
    }
  }

  open() {
    if (this.isOpen) return;

    // Close others efficiently
    Select._closeAllExcept(this.element);

    this.isOpen = true;
    
    // Batch DOM updates
    this.trigger.setAttribute('aria-expanded', 'true');
    this.content.classList.add('select-content-open');
    this.content.classList.remove('is-hovering');

    // Single event listener for hover
    this.content.addEventListener('mouseover', this._boundHandlers.initialHover, { once: true });

    this.emit('open');
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    
    // Batch DOM updates
    this.trigger.setAttribute('aria-expanded', 'false');
    this.content.classList.remove('select-content-open', 'is-hovering');
    this.content.removeEventListener('mouseover', this._boundHandlers.initialHover);

    this.emit('close');
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  // Static method for efficient global close
  static _closeAllExcept(exceptElement) {
    const openSelects = document.querySelectorAll('.select-initialized');
    for (const sel of openSelects) {
      if (sel !== exceptElement && sel.select?.isOpen) {
        sel.select.close();
      }
    }
  }

  getValue() {
    const selectedItem = this.content.querySelector('.select-item-selected');
    return selectedItem?.querySelector('.select-item-text')?.textContent || null;
  }

  setValue(value) {
    const targetItem = this.items.find(item => 
      item.querySelector('.select-item-text')?.textContent === value
    );
    
    if (targetItem) {
      this.selectItem(targetItem);
    }
  }

  // Optimized event emission
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`select:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }

  destroy() {
    // Remove event listeners
    this.trigger.removeEventListener('click', this._boundHandlers.toggle);
    this.content.removeEventListener('click', this._boundHandlers.contentClick);
    this.content.removeEventListener('mouseover', this._boundHandlers.initialHover);

    // Clean up
    this.element.classList.remove('select-initialized');
    this._clearItemsCache();
    delete this.element.select;

    this.emit('destroy');
  }
}

// Optimized global handlers
const selectGlobals = {
  _clickHandler: null,

  init() {
    // Single global click handler
    this._clickHandler = (e) => {
      if (!e.target.closest('.select')) {
        Select._closeAllExcept(null);
      }
    };
    
    document.addEventListener('click', this._clickHandler);
    
    // Auto-initialize
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.autoInit);
    } else {
      this.autoInit();
    }
  },

  autoInit() {
    const selects = document.querySelectorAll('.select:not(.select-initialized)');
    for (const el of selects) {
      el.select = new Select(el);
    }
  }
};

// Initialize
selectGlobals.init();

export default Select;
