/**
 * @file toggle.js
 * @description Optimized Toggle with class-based architecture.
 */

export class Toggle {
  constructor(toggleElement, options = {}) {
    if (!toggleElement || toggleElement.toggle) return;

    this.element = toggleElement;
    this.id = toggleElement.id || `toggle-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };

    // State
    this.pressed = this.element.dataset.state === 'on';

    // Bound event handlers for proper cleanup
    this._boundHandlers = {
      click: (e) => this._handleClick(e)
    };

    this.init();
    this.element.toggle = this;
  }

  defaults = {
    onToggle: () => {}
  }

  init() {
    this.setupStructure();
    this.setupEvents();
    this.updateState();
    
    this.element.classList.add('toggle-initialized');
    this.emit('init');
  }

  setupStructure() {
    // Ensure proper ARIA attributes
    this.element.setAttribute('role', 'button');
    this.element.setAttribute('type', 'button');
  }

  setupEvents() {
    this.element.addEventListener('click', this._boundHandlers.click);
  }

  updateState() {
    // Update data attribute and ARIA state
    this.element.dataset.state = this.pressed ? 'on' : 'off';
    this.element.setAttribute('aria-pressed', this.pressed.toString());
  }

  _handleClick(e) {
    if (this.element.disabled) return;
    
    e.preventDefault();
    this.toggle();
  }

  // Public API methods
  toggle() {
    if (this.element.disabled) return;
    
    const previousState = this.pressed;
    this.pressed = !this.pressed;
    this.updateState();

    this.options.onToggle(this.pressed, previousState);
    this.emit('toggle', { pressed: this.pressed, previousState });
  }

  setPressed(pressed) {
    if (this.element.disabled) return;
    
    const previousState = this.pressed;
    this.pressed = Boolean(pressed);
    this.updateState();

    if (previousState !== this.pressed) {
      this.options.onToggle(this.pressed, previousState);
      this.emit('toggle', { pressed: this.pressed, previousState });
    }
  }

  isPressed() {
    return this.pressed;
  }

  enable() {
    this.element.disabled = false;
    this.element.removeAttribute('disabled');
  }

  disable() {
    this.element.disabled = true;
    this.element.setAttribute('disabled', 'true');
  }

  // Custom event system
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`toggle:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }

  // Cleanup method
  destroy() {
    // Remove event listeners
    this.element.removeEventListener('click', this._boundHandlers.click);

    // Clean up DOM
    this.element.classList.remove('toggle-initialized');
    delete this.element.toggle;

    this.emit('destroy');
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.toggle:not(.toggle-initialized)').forEach(el => {
    new Toggle(el);
  });
});

export default Toggle;
