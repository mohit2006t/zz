/**
 * @file dialog.js
 * @description Optimized Dialog with class-based architecture and configuration.
 */

export class Dialog {
  constructor(dialogElement, options = {}) {
    if (!dialogElement || dialogElement.dialog) return;

    this.element = dialogElement;
    this.id = dialogElement.id || `dialog-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };

    // Core elements
    this.overlay = this.element.querySelector('.dialog-overlay');
    this.content = this.element.querySelector('.dialog-content');
    this.closeButtons = this.element.querySelectorAll('[data-dialog-close]');
    
    if (!this.overlay || !this.content) {
      console.error('Dialog missing required elements: .dialog-overlay or .dialog-content', this.element);
      return;
    }

    // State
    this.isOpen = false;
    this.lastActiveElement = null;

    // Focusable elements selector
    this.focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    // Bound event handlers for proper cleanup
    this._boundHandlers = {
      close: () => this.close(),
      keydown: (e) => this._handleKeydown(e),
      overlayClick: (e) => this._handleOverlayClick(e)
    };

    this.init();
    this.element.dialog = this;
  }

  defaults = {
    closeOnOverlayClick: true,
    closeOnEscape: true,
    trapFocus: true,
    lockBodyScroll: true,
    restoreFocus: true
  }

  init() {
    this.setupStructure();
    this.setupInitialState();
    this._applyClassBasedSettings();
    
    this.element.classList.add('dialog-initialized');
    this.emit('init');
  }

  setupStructure() {
    // Ensure proper ARIA attributes
    this.element.setAttribute('role', 'dialog');
    this.element.setAttribute('aria-modal', 'true');
    this.element.setAttribute('aria-hidden', 'true');
    this.content.setAttribute('tabindex', '-1');
  }

  setupInitialState() {
    // Hide dialog initially
    this.element.style.display = 'none';
  }

  _applyClassBasedSettings() {
    // Check for class-based configuration
    if (this.element.classList.contains('dialog-no-overlay-close')) {
      this.options.closeOnOverlayClick = false;
    }
    
    if (this.element.classList.contains('dialog-no-escape')) {
      this.options.closeOnEscape = false;
    }
    
    if (this.element.classList.contains('dialog-no-focus-trap')) {
      this.options.trapFocus = false;
    }
    
    if (this.element.classList.contains('dialog-no-body-lock')) {
      this.options.lockBodyScroll = false;
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

    // Show dialog
    this.element.style.display = 'block';
    
    // Lock body scroll if enabled
    if (this.options.lockBodyScroll) {
      document.body.style.overflow = 'hidden';
    }

    // Allow CSS transitions to play
    requestAnimationFrame(() => {
      this.overlay.classList.add('open');
      this.content.classList.add('open');
    });
    
    // Update ARIA attributes
    this.element.setAttribute('aria-hidden', 'false');
    
    // Add event listeners
    this._addEventListeners();
    
    // Focus management
    this._focusFirstElement();

    this.emit('open');
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    
    // Remove CSS classes for animation
    this.overlay.classList.remove('open');
    this.content.classList.remove('open');
    
    // Update ARIA attributes
    this.element.setAttribute('aria-hidden', 'true');
    
    // Remove event listeners
    this._removeEventListeners();
    
    // Hide after animation completes
    setTimeout(() => {
      this.element.style.display = 'none';
      if (this.options.lockBodyScroll) {
        document.body.style.overflow = '';
      }
      
      // Restore focus
      if (this.options.restoreFocus && this.lastActiveElement) {
        this.lastActiveElement.focus();
        this.lastActiveElement = null;
      }
    }, 200); // Match CSS transition duration

    this.emit('close');
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  _addEventListeners() {
    // Close buttons
    this.closeButtons.forEach(btn => {
      btn.addEventListener('click', this._boundHandlers.close);
    });
    
    // Overlay click (if enabled)
    if (this.options.closeOnOverlayClick) {
      this.overlay.addEventListener('click', this._boundHandlers.overlayClick);
    }
    
    // Keyboard events
    document.addEventListener('keydown', this._boundHandlers.keydown);
  }

  _removeEventListeners() {
    // Close buttons
    this.closeButtons.forEach(btn => {
      btn.removeEventListener('click', this._boundHandlers.close);
    });
    
    // Overlay click
    this.overlay.removeEventListener('click', this._boundHandlers.overlayClick);
    
    // Keyboard events
    document.removeEventListener('keydown', this._boundHandlers.keydown);
  }

  _handleOverlayClick(e) {
    // Only close if clicking directly on overlay, not on content
    if (e.target === this.overlay) {
      this.close();
    }
  }

  _handleKeydown(e) {
    if (!this.isOpen) return;

    // Escape key
    if (e.key === 'Escape' && this.options.closeOnEscape) {
      e.preventDefault();
      this.close();
      return;
    }
    
    // Tab key (focus trapping)
    if (e.key === 'Tab' && this.options.trapFocus) {
      this._handleTabKey(e);
    }
  }

  _handleTabKey(e) {
    const focusables = Array.from(this.content.querySelectorAll(this.focusableElements))
      .filter(el => !el.disabled && el.offsetParent !== null);
    
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  _focusFirstElement() {
    // Try to focus the first focusable element in the content
    const firstFocusable = this.content.querySelector(this.focusableElements);
    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      // Fallback to focusing the content itself
      this.content.focus();
    }
  }

  // Public utility methods
  setTitle(title) {
    const titleElement = this.element.querySelector('.dialog-title');
    if (titleElement) {
      titleElement.textContent = title;
    }
  }

  setDescription(description) {
    const descElement = this.element.querySelector('.dialog-description');
    if (descElement) {
      descElement.textContent = description;
    }
  }

  getState() {
    return {
      isOpen: this.isOpen,
      hasOverlay: !!this.overlay,
      hasCloseButtons: this.closeButtons.length > 0,
      options: { ...this.options }
    };
  }

  // Custom event system
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`dialog:${event}`, {
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

    // Remove all event listeners
    this._removeEventListeners();

    // Clean up DOM
    this.element.classList.remove('dialog-initialized');
    delete this.element.dialog;

    this.emit('destroy');
  }
}

// Auto-initialize dialogs and setup triggers
document.addEventListener('DOMContentLoaded', () => {
  const dialogs = new Map();
  
  // Initialize all dialogs
  document.querySelectorAll('.dialog:not(.dialog-initialized)').forEach(el => {
    const dialog = new Dialog(el);
    if (el.id) {
      dialogs.set(el.id, dialog);
    }
  });

  // Setup triggers
  document.querySelectorAll('[data-dialog-trigger]').forEach(trigger => {
    const dialogId = trigger.getAttribute('data-dialog-trigger');
    const dialog = dialogs.get(dialogId);
    
    if (dialog) {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        dialog.open();
      });
    }
  });

  // Make dialogs globally accessible
  window.AppDialogs = Object.fromEntries(dialogs);
});

export default Dialog;
