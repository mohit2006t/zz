/**
 * @file sheet.js
 * @description Optimized Sheet with class-based architecture.
 */

export class Sheet {
  constructor(sheetElement, options = {}) {
    if (!sheetElement || sheetElement.sheet) return;

    this.element = sheetElement;
    this.id = sheetElement.id || `sheet-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };

    // State
    this.isOpen = false;
    this.overlay = null;
    this.content = null;
    this.closeButtons = [];

    // Bound event handlers for proper cleanup
    this._boundHandlers = {
      keydown: (e) => this._handleKeydown(e),
      close: () => this.close(),
      overlayClick: (e) => this._handleOverlayClick(e)
    };

    this.init();
    this.element.sheet = this;
  }

  defaults = {
    side: 'right',
    content: '',
    closeOnOverlayClick: true,
    closeOnEscape: true,
    lockBodyScroll: true,
    restoreFocus: true
  }

  init() {
    this._build();
    this.element.classList.add('sheet-initialized');
    this.emit('init');
  }

  _build() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'sheet-overlay';
    
    // Create content
    this.content = document.createElement('div');
    this.content.className = 'sheet-content';
    this.content.setAttribute('data-side', this.options.side);
    this.content.innerHTML = this.options.content;
    
    // Find close buttons
    this.closeButtons = Array.from(this.content.querySelectorAll('[data-sheet-close]'));

    // Setup events
    if (this.options.closeOnOverlayClick) {
      this.overlay.addEventListener('click', this._boundHandlers.overlayClick);
    }
    
    this.closeButtons.forEach(btn => {
      btn.addEventListener('click', this._boundHandlers.close);
    });
  }

  _handleOverlayClick(e) {
    // Only close if clicking directly on overlay, not on content
    if (e.target === this.overlay) {
      this.close();
    }
  }

  _handleKeydown(e) {
    if (e.key === 'Escape' && this.options.closeOnEscape) {
      this.close();
    }
  }

  // Public API methods
  open() {
    if (this.isOpen) return;
    this.isOpen = true;

    // Store the currently focused element
    if (this.options.restoreFocus) {
      this.lastActiveElement = document.activeElement;
    }

    // Add to DOM
    document.body.appendChild(this.overlay);
    document.body.appendChild(this.content);
    
    // Lock body scroll
    if (this.options.lockBodyScroll) {
      document.body.style.overflow = 'hidden';
    }
    
    // Add global listeners
    document.addEventListener('keydown', this._boundHandlers.keydown);

    // Allow CSS transitions to play
    requestAnimationFrame(() => {
      this.overlay.setAttribute('data-state', 'open');
      this.content.setAttribute('data-state', 'open');
    });

    // Focus management
    const firstFocusable = this.content.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), 100);
    }

    this.emit('open');
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    
    // Update states
    this.overlay.setAttribute('data-state', 'closed');
    this.content.setAttribute('data-state', 'closed');
    
    // Restore body scroll
    if (this.options.lockBodyScroll) {
      document.body.style.overflow = '';
    }
    
    // Remove global listeners
    document.removeEventListener('keydown', this._boundHandlers.keydown);
    
    // Remove from DOM after animation
    setTimeout(() => {
      if (this.overlay.parentNode) {
        this.overlay.remove();
      }
      if (this.content.parentNode) {
        this.content.remove();
      }
      
      // Restore focus
      if (this.options.restoreFocus && this.lastActiveElement) {
        this.lastActiveElement.focus();
        this.lastActiveElement = null;
      }
    }, 200); // Match transition duration

    this.emit('close');
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  // Public utility methods
  setSide(side) {
    this.options.side = side;
    this.content.setAttribute('data-side', side);
  }

  setContent(content) {
    this.options.content = content;
    this.content.innerHTML = content;
    
    // Re-find close buttons after content change
    this.closeButtons.forEach(btn => {
      btn.removeEventListener('click', this._boundHandlers.close);
    });
    
    this.closeButtons = Array.from(this.content.querySelectorAll('[data-sheet-close]'));
    this.closeButtons.forEach(btn => {
      btn.addEventListener('click', this._boundHandlers.close);
    });
  }

  getState() {
    return {
      isOpen: this.isOpen,
      side: this.options.side,
      options: { ...this.options }
    };
  }

  // Custom event system
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`sheet:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }

  // Cleanup method
  destroy() {
    // Close if open
    if (this.isOpen) {
      this.close();
    }

    // Remove event listeners
    if (this.overlay) {
      this.overlay.removeEventListener('click', this._boundHandlers.overlayClick);
    }
    
    this.closeButtons.forEach(btn => {
      btn.removeEventListener('click', this._boundHandlers.close);
    });

    // Clean up DOM
    this.element.classList.remove('sheet-initialized');
    delete this.element.sheet;

    this.emit('destroy');
  }
}

// Make globally accessible (as per your original design)
window.Sheet = Sheet;

export default Sheet;
