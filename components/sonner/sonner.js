/**
 * @file sonner.js
 * @description Optimized Sonner (Toast) with class-based architecture.
 */

export class Sonner {
  constructor(options = {}) {
    this.options = { ...this.defaults, ...options };
    this.container = null;
    this.currentPosition = '';
    this.toasts = new Map(); // Track active toasts
    
    this.init();
  }

  defaults = {
    position: 'bottom-right',
    duration: 4000,
    maxToasts: 5,
    pauseOnHover: true
  }

  init() {
    this.setupContainer();
    this.emit('init');
  }

  setupContainer() {
    this.container = this._getOrCreateContainer(this.options.position);
  }

  _getOrCreateContainer(position = 'bottom-right') {
    if (this.container && this.currentPosition === position) {
      return this.container;
    }
    
    const className = `sonner-container sonner-container-${position}`;

    if (this.container) {
      this.container.className = className;
    } else {
      this.container = document.createElement('div');
      this.container.className = className;
      document.body.appendChild(this.container);
    }
    
    this.currentPosition = position;
    return this.container;
  }

  // Public API methods
  show(titleOrOptions, options = {}) {
    let toastOptions;
    if (typeof titleOrOptions === 'object') {
      toastOptions = titleOrOptions;
    } else {
      toastOptions = { ...options, title: titleOrOptions };
    }
    
    if (!toastOptions.title) {
      console.error('Toast must have a title.');
      return null;
    }
    
    return this._createToast(toastOptions);
  }

  success(title, options = {}) {
    return this.show({ title, ...options, type: 'success' });
  }

  error(title, options = {}) {
    return this.show({ title, ...options, type: 'error' });
  }

  info(title, options = {}) {
    return this.show({ title, ...options, type: 'info' });
  }

  warning(title, options = {}) {
    return this.show({ title, ...options, type: 'warning' });
  }

  _createToast(options) {
    const { title, description, duration = this.options.duration, icon, type, action, position } = options;
    
    // Update container position if needed
    if (position && position !== this.currentPosition) {
      this.container = this._getOrCreateContainer(position);
    }
    
    const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const sonnerElement = document.createElement('div');
    sonnerElement.className = `sonner sonner-${type || 'default'}`;
    sonnerElement.setAttribute('data-toast-id', toastId);
    
    // Create icon
    const defaultIcons = { 
      success: 'check-circle', 
      error: 'x-circle', 
      warning: 'alert-triangle', 
      info: 'info' 
    };
    const iconName = icon || defaultIcons[type];
    if (iconName) {
      const iconEl = document.createElement('i');
      iconEl.className = 'sonner-icon';
      iconEl.setAttribute('data-lucide', iconName);
      sonnerElement.appendChild(iconEl);
    }

    // Create content
    const content = document.createElement('div');
    content.className = 'sonner-content';
    content.innerHTML = `
      <div class="sonner-title">${title}</div>
      ${description ? `<div class="sonner-description">${description}</div>` : ''}
    `;
    sonnerElement.appendChild(content);

    // Create action button if provided
    if (action && action.label && typeof action.onClick === 'function') {
      const actionWrapper = document.createElement('div');
      actionWrapper.className = 'sonner-action-wrapper';
      
      const actionButton = document.createElement('button');
      actionButton.className = action.class || 'btn btn-sm';
      actionButton.textContent = action.label;
      actionButton.addEventListener('click', (e) => {
        e.stopPropagation();
        action.onClick();
      });
      
      actionWrapper.appendChild(actionButton);
      sonnerElement.appendChild(actionWrapper);
    }

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'sonner-close-button';
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.innerHTML = '<i data-lucide="x" style="width: 1rem; height: 1rem;"></i>';
    sonnerElement.appendChild(closeButton);

    // Toast removal function
    const removeToast = () => {
      if (sonnerElement.isRemoving) return;
      sonnerElement.isRemoving = true;
      clearTimeout(sonnerElement.timeoutId);
      sonnerElement.setAttribute('data-state', 'closed');
      
      setTimeout(() => {
        if (sonnerElement.parentNode) {
          sonnerElement.remove();
        }
        this.toasts.delete(toastId);
        this.emit('toast-removed', { id: toastId });
      }, 250);
      
      this.emit('toast-close', { id: toastId, element: sonnerElement });
    };
    
    // Setup pause on hover
    if (this.options.pauseOnHover) {
      sonnerElement.addEventListener('mouseenter', () => {
        clearTimeout(sonnerElement.timeoutId);
      });
      
      sonnerElement.addEventListener('mouseleave', () => {
        sonnerElement.timeoutId = setTimeout(removeToast, duration);
      });
    }
    
    // Event listeners
    closeButton.addEventListener('click', removeToast);
    
    // Auto-remove timer
    sonnerElement.timeoutId = setTimeout(removeToast, duration);
    
    // Handle max toasts limit
    if (this.toasts.size >= this.options.maxToasts) {
      const oldestToast = this.toasts.values().next().value;
      if (oldestToast && oldestToast.element) {
        this._removeToast(oldestToast.id);
      }
    }
    
    // Add to container
    this.container.appendChild(sonnerElement);
    
    // Store toast reference
    this.toasts.set(toastId, {
      id: toastId,
      element: sonnerElement,
      removeToast,
      options
    });
    
    // Animate in
    requestAnimationFrame(() => {
      sonnerElement.setAttribute('data-state', 'open');
      if (window.lucide) {
        window.lucide.createIcons({ nodes: [sonnerElement] });
      }
    });

    this.emit('toast-show', { id: toastId, element: sonnerElement, options });
    return toastId;
  }

  // Public utility methods
  dismiss(toastId) {
    if (toastId) {
      this._removeToast(toastId);
    } else {
      // Dismiss all toasts
      this.dismissAll();
    }
  }

  dismissAll() {
    this.toasts.forEach((toast) => {
      toast.removeToast();
    });
  }

  _removeToast(toastId) {
    const toast = this.toasts.get(toastId);
    if (toast) {
      toast.removeToast();
    }
  }

  setPosition(position) {
    this.options.position = position;
    this.container = this._getOrCreateContainer(position);
  }

  getToasts() {
    return Array.from(this.toasts.values()).map(toast => ({
      id: toast.id,
      options: toast.options
    }));
  }

  getToastCount() {
    return this.toasts.size;
  }

  // Custom event system
  emit(event, data = {}) {
    document.dispatchEvent(new CustomEvent(`sonner:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }

  // Cleanup method
  destroy() {
    this.dismissAll();
    
    if (this.container && this.container.parentNode) {
      this.container.remove();
    }
    
    this.toasts.clear();
    this.emit('destroy');
  }
}

// Create global instance and make it available
const globalSonner = new Sonner();

// Create global toast function (matching your original API)
const toast = (titleOrOptions, options = {}) => {
  return globalSonner.show(titleOrOptions, options);
};

// Add type-specific methods to global toast function
['success', 'error', 'info', 'warning'].forEach(type => {
  toast[type] = (title, options = {}) => globalSonner[type](title, options);
});

// Add utility methods
toast.dismiss = (id) => globalSonner.dismiss(id);
toast.dismissAll = () => globalSonner.dismissAll();

// Make globally available
window.toast = toast;

export default Sonner;
