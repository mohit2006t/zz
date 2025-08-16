/**
 * @file input-otp.js
 * @description Optimized InputOTP with class-based architecture.
 */

export class InputOTP {
  constructor(otpElement, options = {}) {
    if (!otpElement || otpElement.inputOTP) return;

    this.element = otpElement;
    this.id = otpElement.id || `input-otp-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };

    // Core elements
    this.slots = Array.from(this.element.querySelectorAll('.input-otp-slot'));
    this.valueInput = this.element.querySelector('input[type="hidden"]');

    if (this.slots.length === 0) {
      console.error('InputOTP missing required elements: .input-otp-slot', this.element);
      return;
    }

    // State
    this.isProgrammaticFocus = false;
    this._handleDeselect = null;

    // Bound event handlers for proper cleanup
    this._boundHandlers = {
      keydown: (e) => this._onKeyDown(e),
      input: (e) => this._onInput(e),
      paste: (e) => this._onPaste(e),
      focusin: (e) => this._onFocus(e),
      click: (e) => this._onClick(e)
    };

    this.init();
    this.element.inputOTP = this;
  }

  defaults = {
    onComplete: () => {},
    onValueChange: () => {}
  }

  init() {
    this.setupEvents();
    this.element.classList.add('input-otp-initialized');
    this.emit('init');
  }

  setupEvents() {
    this.element.addEventListener('keydown', this._boundHandlers.keydown);
    this.element.addEventListener('input', this._boundHandlers.input);
    this.element.addEventListener('paste', this._boundHandlers.paste);
    this.element.addEventListener('focusin', this._boundHandlers.focusin);
    this.element.addEventListener('click', this._boundHandlers.click);
  }

  _clearSelection() {
    this.slots.forEach(s => s.classList.remove('is-selected'));
    if (this._handleDeselect) {
      document.removeEventListener('click', this._handleDeselect);
      this._handleDeselect = null;
    }
  }

  _updateValue() {
    const value = this.slots.map(slot => slot.value).join('');
    
    if (this.valueInput) {
      this.valueInput.value = value;
    }
    
    this.options.onValueChange(value);
    this.emit('value-change', { value });
    
    // Check if complete
    if (value.length === this.slots.length && value.split('').every(char => char !== '')) {
      this.options.onComplete(value);
      this.emit('complete', { value });
    }
  }

  _handleSelectAll() {
    this._clearSelection();
    const filledSlots = this.slots.filter(slot => slot.value);
    if (filledSlots.length > 0) {
      filledSlots.forEach(slot => slot.classList.add('is-selected'));
      this.isProgrammaticFocus = true;
      filledSlots[filledSlots.length - 1].focus();
      this.isProgrammaticFocus = false;
      
      this._handleDeselect = (e) => {
        if (!this.element.contains(e.target)) {
          this._clearSelection();
        }
      };
      document.addEventListener('click', this._handleDeselect);
    }
  }

  _handleMultiDelete(selectedSlots) {
    selectedSlots.forEach(slot => { slot.value = ''; });
    this._clearSelection();
    this._updateValue();
    this.slots[0].focus();
  }

  _handleSingleDelete(currentIndex) {
    let effectiveIndex = currentIndex;
    if (!this.slots[effectiveIndex].value && effectiveIndex > 0) {
      effectiveIndex--;
    }
    for (let i = effectiveIndex; i < this.slots.length - 1; i++) {
      this.slots[i].value = this.slots[i + 1].value;
    }
    this.slots[this.slots.length - 1].value = '';
    this._updateValue();
    this.slots[effectiveIndex].focus();
    this.slots[effectiveIndex].select();
  }

  _onKeyDown(e) {
    const target = e.target;
    if (!target.matches('.input-otp-slot')) return;
    const index = this.slots.indexOf(target);

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      this._handleSelectAll();
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      const selectedSlots = this.slots.filter(s => s.classList.contains('is-selected'));
      if (selectedSlots.length > 0) {
        this._handleMultiDelete(selectedSlots);
      } else {
        this._handleSingleDelete(index);
      }
      return;
    }

    this._clearSelection();

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (index > 0) {
          this.slots[index - 1].focus();
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (index < this.slots.length - 1) {
          this.slots[index + 1].focus();
        }
        break;
    }
  }

  _onInput(e) {
    const target = e.target;
    if (!target.matches('.input-otp-slot')) return;
    this._clearSelection();
    const index = this.slots.indexOf(target);
    if (target.value && index < this.slots.length - 1) {
      this.slots[index + 1].focus();
    } 
    else if (target.value && index === this.slots.length - 1) {
      target.select();
    }
    this._updateValue();
  }

  _onPaste(e) {
    const target = e.target;
    if (!target.matches('.input-otp-slot')) return;
    e.preventDefault();
    this._clearSelection();
    const index = this.slots.indexOf(target);
    const pastedData = e.clipboardData.getData('text').trim().slice(0, this.slots.length - index);
    for (let i = 0; i < pastedData.length; i++) {
      if (this.slots[index + i]) {
        this.slots[index + i].value = pastedData[i];
      }
    }
    const nextFocusIndex = Math.min(index + pastedData.length, this.slots.length - 1);
    this.slots[nextFocusIndex].focus();
    this._updateValue();
  }
  
  _onFocus(e) {
    if (this.isProgrammaticFocus) return;
    if (e.target.matches('.input-otp-slot')) {
      this._clearSelection();
      e.target.select();
    }
  }
  
  _onClick(e) {
    if (e.target.matches('.input-otp-slot')) {
      e.preventDefault();
      const firstEmptySlot = this.slots.find(slot => !slot.value);
      if (firstEmptySlot) {
        firstEmptySlot.focus();
      } else {
        this.slots[this.slots.length - 1].focus();
      }
    }
  }

  // Public API methods
  getValue() {
    return this.slots.map(slot => slot.value).join('');
  }

  setValue(value) {
    const valueStr = String(value);
    for (let i = 0; i < this.slots.length; i++) {
      this.slots[i].value = valueStr[i] || '';
    }
    this._updateValue();
  }

  clear() {
    this.slots.forEach(slot => { slot.value = ''; });
    this._clearSelection();
    this._updateValue();
    this.slots[0].focus();
  }

  focus() {
    const firstEmptySlot = this.slots.find(slot => !slot.value);
    if (firstEmptySlot) {
      firstEmptySlot.focus();
    } else {
      this.slots[0].focus();
    }
  }

  // Custom event system
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`input-otp:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }

  // Cleanup method
  destroy() {
    // Remove event listeners
    this.element.removeEventListener('keydown', this._boundHandlers.keydown);
    this.element.removeEventListener('input', this._boundHandlers.input);
    this.element.removeEventListener('paste', this._boundHandlers.paste);
    this.element.removeEventListener('focusin', this._boundHandlers.focusin);
    this.element.removeEventListener('click', this._boundHandlers.click);

    // Clean up selection handler
    if (this._handleDeselect) {
      document.removeEventListener('click', this._handleDeselect);
    }

    // Clean up DOM
    this.element.classList.remove('input-otp-initialized');
    delete this.element.inputOTP;

    this.emit('destroy');
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.input-otp:not(.input-otp-initialized)').forEach(el => {
    new InputOTP(el);
  });
});

export default InputOTP;
