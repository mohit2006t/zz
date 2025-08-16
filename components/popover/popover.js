/**
 * @file popover.js
 * @description Pure popover behavior - only handles show/hide/portal functionality.
 * Positioning is handled by the component's CSS, not by this behavior.
 */

export class PopoverBehavior {
  constructor(element, options = {}) {
    if (!element || element.popoverBehavior) return;

    this.element = element;
    this.options = { ...this.defaults, ...options };

    // Find content element
    this.content = this._findContent();
    if (!this.content) {
      console.warn('Popover behavior: No content element found for', element);
      return;
    }

    // State
    this.isOpen = false;
    this.originalParent = this.content.parentElement;

    // Bound event handlers
    this._boundHandlers = {
      trigger: (e) => this._handleTrigger(e),
      outsideClick: (e) => this._handleOutsideClick(e),
      keydown: (e) => this._handleKeydown(e)
    };

    this.init();
    this.element.popoverBehavior = this;
  }

  defaults = {
    portal: true,
    keyboard: true,
    closeOnOutsideClick: true,
    trigger: 'click' // 'click', 'hover', 'focus'
  }

  init() {
    this.setupAccessibility();
    this.setupEvents();
    this.setupInitialState();
    this._applyClassBasedSettings();
    
    this.element.classList.add('has-popover');
    this.emit('init');
  }

  _findContent() {
    // Method 1: Look for data-popover-content attribute pointing to ID
    const contentId = this.element.getAttribute('data-popover-content');
    if (contentId) {
      return document.getElementById(contentId);
    }

    // Method 2: Look for .popover-content as next sibling
    let sibling = this.element.nextElementSibling;
    while (sibling) {
      if (sibling.classList.contains('popover-content')) {
        return sibling;
      }
      sibling = sibling.nextElementSibling;
    }

    // Method 3: Look for .popover-content as child
    return this.element.querySelector('.popover-content');
  }

  _applyClassBasedSettings() {
    if (this.element.classList.contains('popover-no-portal')) {
      this.options.portal = false;
    }
    if (this.element.classList.contains('popover-no-keyboard')) {
      this.options.keyboard = false;
    }
    if (this.element.classList.contains('popover-no-outside-click')) {
      this.options.closeOnOutsideClick = false;
    }
    if (this.element.classList.contains('popover-hover')) {
      this.options.trigger = 'hover';
    }
    if (this.element.classList.contains('popover-focus')) {
      this.options.trigger = 'focus';
    }
  }

  setupAccessibility() {
    const contentId = this.content.id || `popover-${Math.random().toString(36).substr(2, 9)}-content`;
    this.content.id = contentId;
    
    this.element.setAttribute('aria-haspopup', 'dialog');
    this.element.setAttribute('aria-expanded', 'false');
    this.element.setAttribute('aria-controls', contentId);
    this.content.setAttribute('role', 'dialog');
  }

  setupEvents() {
    switch (this.options.trigger) {
      case 'hover':
        this.element.addEventListener('mouseenter', this._boundHandlers.trigger);
        this.element.addEventListener('mouseleave', () => this.close());
        this.content.addEventListener('mouseenter', () => clearTimeout(this._hideTimer));
        this.content.addEventListener('mouseleave', () => this.close());
        break;
      case 'focus':
        this.element.addEventListener('focus', this._boundHandlers.trigger);
        this.element.addEventListener('blur', () => this.close());
        break;
      case 'click':
      default:
        this.element.addEventListener('click', this._boundHandlers.trigger);
        break;
    }
  }

  setupInitialState() {
    this.content.classList.add('popover-closed', 'popover-hidden');
  }

  _handleTrigger(e) {
    if (this.options.trigger === 'click') {
      e.stopPropagation();
    }
    this.toggle();
  }

  _handleOutsideClick(e) {
    if (!this.options.closeOnOutsideClick) return;
    if (!this.content.contains(e.target) && !this.element.contains(e.target)) {
      this.close();
    }
  }

  _handleKeydown(e) {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
      this.element.focus();
    }
  }

  open() {
    if (this.isOpen) return;

    PopoverBehavior._closeAll();
    this.isOpen = true;

    // Portal to body if enabled (positioning handled by CSS)
    if (this.options.portal) {
      document.body.appendChild(this.content);
    }

    // Just show - NO positioning logic here
    this.content.classList.remove('popover-closed', 'popover-hidden');
    this.content.classList.add('popover-open', 'popover-visible');
    this.element.setAttribute('aria-expanded', 'true');

    this._addGlobalListeners();
    this.emit('open');
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.content.classList.remove('popover-open', 'popover-visible');
    this.content.classList.add('popover-closed', 'popover-hidden');
    this.element.setAttribute('aria-expanded', 'false');

    this._removeGlobalListeners();

    // Return to original parent after animation
    if (this.options.portal) {
      setTimeout(() => {
        if (this.content.parentElement === document.body) {
          this.originalParent.appendChild(this.content);
        }
      }, 150);
    }

    this.emit('close');
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  static _closeAll() {
    const elements = document.querySelectorAll('.has-popover');
    for (const el of elements) {
      if (el.popoverBehavior?.isOpen) {
        el.popoverBehavior.close();
      }
    }
  }

  _addGlobalListeners() {
    setTimeout(() => {
      if (this.options.closeOnOutsideClick) {
        document.addEventListener('click', this._boundHandlers.outsideClick, true);
      }
      if (this.options.keyboard) {
        document.addEventListener('keydown', this._boundHandlers.keydown);
      }
    }, 0);
  }

  _removeGlobalListeners() {
    document.removeEventListener('click', this._boundHandlers.outsideClick, true);
    document.removeEventListener('keydown', this._boundHandlers.keydown);
  }

  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`popover:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }

  destroy() {
    if (this.isOpen) this.close();
    
    this.element.removeEventListener('click', this._boundHandlers.trigger);
    this.element.removeEventListener('mouseenter', this._boundHandlers.trigger);
    this.element.removeEventListener('focus', this._boundHandlers.trigger);
    this._removeGlobalListeners();

    this.element.classList.remove('has-popover');
    delete this.element.popoverBehavior;
    this.emit('destroy');
  }
}

// Auto-apply popover behavior
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-popover], .has-popover').forEach(el => {
    if (!el.popoverBehavior) {
      new PopoverBehavior(el);
    }
  });
});

export default PopoverBehavior;
