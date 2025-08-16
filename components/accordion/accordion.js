/**
 * @file accordion.js
 * @description Manages accordion components with class-based configuration and full customization.
 */

export class Accordion {
  constructor(accordionElement, options = {}) {
    if (!accordionElement || accordionElement.accordion) return;

    this.element = accordionElement;
    this.id = accordionElement.id || `accordion-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };

    // Configuration from CSS classes instead of data attributes
    this.type = this._getTypeFromClasses();
    this.items = Array.from(this.element.querySelectorAll('.accordion-item'));
    
    // Store bound event handlers for proper cleanup
    this._boundHandleToggle = this._handleToggle.bind(this);
    this._boundHandleKeydown = this._handleKeydown.bind(this);

    this.init();
    this.element.accordion = this;
  }

  defaults = {
    type: 'multiple',
    collapsible: true,
    closeOthers: true,
    keyboard: true,
    animate: true
  }

  init() {
    this.setupAccessibility();
    this.setupEventListeners();
    this.handleInitialState();
    
    this.element.classList.add('accordion-initialized');
    this.emit('init', { 
      type: this.type, 
      totalItems: this.items.length,
      options: this.options 
    });
  }

  _getTypeFromClasses() {
    if (this.element.classList.contains('accordion-single')) return 'single';
    if (this.element.classList.contains('accordion-multiple')) return 'multiple';
    return this.options.type;
  }

  setupAccessibility() {
    // Set ARIA attributes on the container
    this.element.setAttribute('role', 'presentation');
    
    this.items.forEach((item, index) => {
      const trigger = item.querySelector('.accordion-trigger');
      const content = item.querySelector('.accordion-content');
      
      if (trigger && content) {
        const triggerId = trigger.id || `${this.id}-trigger-${index}`;
        const contentId = content.id || `${this.id}-content-${index}`;
        
        // Set IDs if not present
        trigger.id = triggerId;
        content.id = contentId;
        
        // ARIA attributes
        trigger.setAttribute('aria-controls', contentId);
        trigger.setAttribute('aria-expanded', item.open ? 'true' : 'false');
        content.setAttribute('aria-labelledby', triggerId);
        content.setAttribute('role', 'region');
      }
    });
  }

  setupEventListeners() {
    // Toggle event for single-type behavior
    if (this.type === 'single') {
      this.items.forEach(item => {
        item.addEventListener('toggle', this._boundHandleToggle);
      });
    }

    // Update ARIA on all types
    this.items.forEach(item => {
      item.addEventListener('toggle', (e) => this._updateAriaExpanded(e.target));
    });

    // Keyboard navigation if enabled
    if (this.options.keyboard) {
      this.items.forEach(item => {
        const trigger = item.querySelector('.accordion-trigger');
        if (trigger) {
          trigger.addEventListener('keydown', this._boundHandleKeydown);
        }
      });
    }
  }

  handleInitialState() {
    // Handle items that should be initially open/closed
    this.items.forEach(item => {
      const shouldBeOpen = item.classList.contains('accordion-item-open');
      const shouldBeClosed = item.classList.contains('accordion-item-closed');
      
      if (shouldBeOpen && !item.open) {
        item.open = true;
      } else if (shouldBeClosed && item.open) {
        item.open = false;
      }
      
      this._updateAriaExpanded(item);
    });
  }

  _handleToggle(event) {
    const currentItem = event.target;

    // Single-type behavior: close others when one opens
    if (currentItem.open && this.options.closeOthers) {
      this.items.forEach(otherItem => {
        if (otherItem !== currentItem && otherItem.open) {
          otherItem.open = false;
          this._updateAriaExpanded(otherItem);
        }
      });
    }

    this.emit('toggle', { 
      item: currentItem, 
      open: currentItem.open,
      index: this.items.indexOf(currentItem)
    });
  }

  _handleKeydown(event) {
    const trigger = event.target;
    const item = trigger.closest('.accordion-item');
    const currentIndex = this.items.indexOf(item);

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        this._focusNextTrigger(currentIndex);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        this._focusPreviousTrigger(currentIndex);
        break;
      case 'Home':
        event.preventDefault();
        this._focusTrigger(0);
        break;
      case 'End':
        event.preventDefault();
        this._focusTrigger(this.items.length - 1);
        break;
    }
  }

  _updateAriaExpanded(item) {
    const trigger = item.querySelector('.accordion-trigger');
    if (trigger) {
      trigger.setAttribute('aria-expanded', item.open ? 'true' : 'false');
    }
  }

  _focusNextTrigger(currentIndex) {
    const nextIndex = (currentIndex + 1) % this.items.length;
    this._focusTrigger(nextIndex);
  }

  _focusPreviousTrigger(currentIndex) {
    const prevIndex = currentIndex === 0 ? this.items.length - 1 : currentIndex - 1;
    this._focusTrigger(prevIndex);
  }

  _focusTrigger(index) {
    const trigger = this.items[index]?.querySelector('.accordion-trigger');
    if (trigger && !this.items[index].hasAttribute('disabled')) {
      trigger.focus();
    }
  }

  // Public API methods
  open(index) {
    const item = this.items[index];
    if (item && !item.hasAttribute('disabled')) {
      item.open = true;
      this._updateAriaExpanded(item);
      this.emit('open', { item, index });
    }
  }

  close(index) {
    const item = this.items[index];
    if (item && !item.hasAttribute('disabled')) {
      item.open = false;
      this._updateAriaExpanded(item);
      this.emit('close', { item, index });
    }
  }

  toggle(index) {
    const item = this.items[index];
    if (item && !item.hasAttribute('disabled')) {
      item.open ? this.close(index) : this.open(index);
    }
  }

  openAll() {
    if (this.type === 'multiple') {
      this.items.forEach((item, index) => {
        if (!item.hasAttribute('disabled')) {
          this.open(index);
        }
      });
      this.emit('openAll');
    }
  }

  closeAll() {
    this.items.forEach((item, index) => {
      if (!item.hasAttribute('disabled')) {
        this.close(index);
      }
    });
    this.emit('closeAll');
  }

  getOpenItems() {
    return this.items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.open);
  }

  isOpen(index) {
    return this.items[index]?.open || false;
  }

  // Custom event system
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`accordion:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }

  destroy() {
    // Remove event listeners
    this.items.forEach(item => {
      item.removeEventListener('toggle', this._boundHandleToggle);
      const trigger = item.querySelector('.accordion-trigger');
      if (trigger) {
        trigger.removeEventListener('keydown', this._boundHandleKeydown);
      }
    });

    // Clean up DOM
    this.element.classList.remove('accordion-initialized');
    delete this.element.accordion;

    this.emit('destroy');
  }
}

// Auto-initialize all accordions on the page
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.accordion:not(.accordion-initialized)').forEach(el => {
    el.accordion = new Accordion(el);
  });
});

export default Accordion;
