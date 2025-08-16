/**
 * @file progress.js
 * @description Optimized Progress with class-based architecture.
 */

export class Progress {
  constructor(progressElement, options = {}) {
    if (!progressElement || progressElement.progress) return;

    this.element = progressElement;
    this.id = progressElement.id || `progress-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };

    // Core elements
    this.indicator = this.element.querySelector('.progress-indicator');
    
    if (!this.indicator) {
      console.error('Progress missing required element: .progress-indicator', this.element);
      return;
    }

    // State
    this.value = parseFloat(this.element.getAttribute('data-value')) || this.options.initialValue;

    this.init();
    this.element.progress = this;
  }

  defaults = {
    initialValue: 0,
    min: 0,
    max: 100,
    onValueChange: () => {}
  }

  init() {
    this.setupStructure();
    this.update(this.value);
    
    this.element.classList.add('progress-initialized');
    this.emit('init');
  }

  setupStructure() {
    // Ensure proper ARIA attributes
    this.element.setAttribute('role', 'progressbar');
    this.element.setAttribute('aria-valuemin', this.options.min);
    this.element.setAttribute('aria-valuemax', this.options.max);
  }

  // Public API methods
  update(newValue) {
    const value = Math.max(this.options.min, Math.min(this.options.max, parseFloat(newValue)));
    const previousValue = this.value;
    this.value = value;
    
    // Update ARIA attributes
    this.element.setAttribute('aria-valuenow', value);
    this.element.setAttribute('data-value', value);
    
    // Update visual indicator
    if (this.indicator) {
      const percentage = ((value - this.options.min) / (this.options.max - this.options.min)) * 100;
      this.indicator.style.transform = `translateX(-${100 - percentage}%)`;
    }

    // Trigger callbacks and events
    if (value !== previousValue) {
      this.options.onValueChange(value, previousValue);
      this.emit('value-change', { value, previousValue });
    }
  }

  setValue(value) {
    this.update(value);
  }

  getValue() {
    return this.value;
  }

  getPercentage() {
    return ((this.value - this.options.min) / (this.options.max - this.options.min)) * 100;
  }

  increment(amount = 1) {
    this.update(this.value + amount);
  }

  decrement(amount = 1) {
    this.update(this.value - amount);
  }

  reset() {
    this.update(this.options.initialValue);
  }

  // Custom event system
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`progress:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }

  // Cleanup method
  destroy() {
    // Clean up DOM
    this.element.classList.remove('progress-initialized');
    delete this.element.progress;

    this.emit('destroy');
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  const progressBars = {};
  document.querySelectorAll('.progress:not(.progress-initialized)').forEach((progressEl, i) => {
    const id = progressEl.id || `progress-${i}`;
    progressBars[id] = new Progress(progressEl);
  });
  
  // Make globally accessible
  window.AppProgress = progressBars;
});

export default Progress;
