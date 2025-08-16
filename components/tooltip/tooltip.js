/**
 * @file tooltip.js
 * @description Optimized Tooltip with class-based architecture using CSS classes for all configuration.
 */

export class Tooltip {
  constructor(tooltipElement, options = {}) {
    if (!tooltipElement || tooltipElement.tooltip) return;

    this.element = tooltipElement;
    this.id = tooltipElement.id || `tooltip-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };

    // Core elements
    this.trigger = this.element.querySelector('.tooltip-trigger');
    this.content = this.element.querySelector('.tooltip-content');

    if (!this.trigger || !this.content) {
      console.warn('Tooltip is missing trigger or content element.', this.element);
      return;
    }

    // State
    this.isVisible = false;
    this.originalParent = this.content.parentElement;
    this.preferredSide = this._getSideFromClasses();
    
    // Timers
    this.showTimer = null;
    this.hideTimer = null;

    // Bound event handlers for proper cleanup
    this._boundHandlers = {
      mouseenter: () => this._handleShow(),
      mouseleave: () => this._handleHide(),
      focus: () => this._handleShow(),
      blur: () => this._handleHide(),
      position: () => this._positionTooltip(),
      keydown: (e) => this._handleKeydown(e)
    };

    this.init();
    this.element.tooltip = this;
  }

  defaults = {
    showDelay: 300,
    hideDelay: 100,
    sideOffset: 8,
    viewportPadding: 8,
    portal: true,
    keyboard: true,
    fit: false
  }

  init() {
    this.setupAccessibility();
    this.setupEvents();
    this.setupInitialState();
    this._applyClassBasedSettings();
    
    this.element.classList.add('tooltip-initialized');
    this.emit('init', { side: this.preferredSide, fit: this.options.fit });
  }

  _getSideFromClasses() {
    if (this.trigger.classList.contains('tooltip-bottom')) return 'bottom';
    if (this.trigger.classList.contains('tooltip-left')) return 'left';
    if (this.trigger.classList.contains('tooltip-right')) return 'right';
    return 'top'; // Default
  }

  _applyClassBasedSettings() {
    // Check for fit class
    if (this.content.classList.contains('tooltip-fit')) {
      this.options.fit = true;
    }

    // Check for portal disabled class
    if (this.element.classList.contains('tooltip-no-portal')) {
      this.options.portal = false;
    }

    // Check for keyboard disabled class
    if (this.element.classList.contains('tooltip-no-keyboard')) {
      this.options.keyboard = false;
    }

    // Check for delay classes
    if (this.element.classList.contains('tooltip-fast')) {
      this.options.showDelay = 100;
      this.options.hideDelay = 50;
    }
    if (this.element.classList.contains('tooltip-slow')) {
      this.options.showDelay = 600;
      this.options.hideDelay = 200;
    }
    if (this.element.classList.contains('tooltip-instant')) {
      this.options.showDelay = 0;
      this.options.hideDelay = 0;
    }
  }

  setupAccessibility() {
    // Set ARIA attributes
    const contentId = this.content.id || `${this.id}-content`;
    this.content.id = contentId;
    
    this.trigger.setAttribute('aria-describedby', contentId);
    this.content.setAttribute('role', 'tooltip');
    this.content.classList.add('tooltip-hidden'); // Use class instead of aria-hidden
  }

  setupEvents() {
    // Mouse events
    this.trigger.addEventListener('mouseenter', this._boundHandlers.mouseenter);
    this.trigger.addEventListener('mouseleave', this._boundHandlers.mouseleave);
    
    // Focus events for accessibility
    this.trigger.addEventListener('focus', this._boundHandlers.focus);
    this.trigger.addEventListener('blur', this._boundHandlers.blur);
    
    // Keyboard events
    if (this.options.keyboard) {
      this.trigger.addEventListener('keydown', this._boundHandlers.keydown);
    }
  }

  setupInitialState() {
    this.content.classList.add('tooltip-closed'); // Use class instead of data-state
    this.content.classList.add('tooltip-hidden');
  }

  _handleShow() {
    clearTimeout(this.hideTimer);
    
    if (this.isVisible) return;
    
    this.showTimer = setTimeout(() => {
      this.show();
    }, this.options.showDelay);
  }

  _handleHide() {
    clearTimeout(this.showTimer);
    
    if (!this.isVisible) return;
    
    this.hideTimer = setTimeout(() => {
      this.hide();
    }, this.options.hideDelay);
  }

  _handleKeydown(event) {
    if (event.key === 'Escape' && this.isVisible) {
      this.hide();
    }
  }

  show() {
    if (this.isVisible) return;

    // Close other tooltips
    Tooltip._hideAll();

    this.isVisible = true;

    // Portal to body if enabled
    if (this.options.portal) {
      document.body.appendChild(this.content);
    }

    // Position and show
    this._positionTooltip();
    
    // Use classes instead of data attributes
    this.content.classList.remove('tooltip-closed', 'tooltip-hidden');
    this.content.classList.add('tooltip-open', 'tooltip-visible');

    // Add global listeners for repositioning
    window.addEventListener('scroll', this._boundHandlers.position, true);
    window.addEventListener('resize', this._boundHandlers.position, true);

    this.emit('show', { side: this.preferredSide });
  }

  hide() {
    if (!this.isVisible) return;

    this.isVisible = false;

    // Use classes instead of data attributes
    this.content.classList.remove('tooltip-open', 'tooltip-visible');
    this.content.classList.add('tooltip-closed', 'tooltip-hidden');

    // Remove global listeners
    window.removeEventListener('scroll', this._boundHandlers.position, true);
    window.removeEventListener('resize', this._boundHandlers.position, true);

    // Return to original parent after animation
    if (this.options.portal) {
      setTimeout(() => {
        if (this.content.parentElement === document.body) {
          this.originalParent.appendChild(this.content);
        }
      }, 150);
    }

    this.emit('hide');
  }

  toggle() {
    this.isVisible ? this.hide() : this.show();
  }

  // Static method to hide all tooltips
  static _hideAll() {
    const tooltips = document.querySelectorAll('.tooltip-initialized');
    for (const tooltip of tooltips) {
      if (tooltip.tooltip?.isVisible) {
        tooltip.tooltip.hide();
      }
    }
  }

  _positionTooltip() {
    if (!this.isVisible) return;

    const position = this._calculatePosition();
    
    // Batch style updates
    Object.assign(this.content.style, {
      top: `${position.top}px`,
      left: `${position.left}px`,
      position: 'fixed',
      zIndex: '9999'
    });
  }

  _calculatePosition() {
    const triggerRect = this.trigger.getBoundingClientRect();
    const contentRect = this.content.getBoundingClientRect();
    
    const space = this._getAvailableSpace(triggerRect);
    const finalSide = this._chooseBestSide(space, contentRect);
    
    let { top, left } = this._getPositionForSide(finalSide, triggerRect, contentRect);
    ({ top, left } = this._constrainToViewport(top, left, contentRect));

    return { top, left, side: finalSide };
  }

  _getAvailableSpace(triggerRect) {
    const { viewportPadding } = this.options;
    
    return {
      top: triggerRect.top - viewportPadding,
      bottom: window.innerHeight - triggerRect.bottom - viewportPadding,
      left: triggerRect.left - viewportPadding,
      right: window.innerWidth - triggerRect.right - viewportPadding
    };
  }

  _chooseBestSide(space, contentRect) {
    let finalSide = this.preferredSide;

    // Smart positioning - flip if not enough space
    if (this.preferredSide === 'top' && space.top < contentRect.height && space.bottom > space.top) {
      finalSide = 'bottom';
    }
    if (this.preferredSide === 'bottom' && space.bottom < contentRect.height && space.top > space.bottom) {
      finalSide = 'top';
    }
    if (this.preferredSide === 'left' && space.left < contentRect.width && space.right > space.left) {
      finalSide = 'right';
    }
    if (this.preferredSide === 'right' && space.right < contentRect.width && space.left > space.right) {
      finalSide = 'left';
    }

    return finalSide;
  }

  _getPositionForSide(side, triggerRect, contentRect) {
    const { sideOffset } = this.options;

    switch (side) {
      case 'top':
        return {
          top: triggerRect.top - contentRect.height - sideOffset,
          left: triggerRect.left + (triggerRect.width - contentRect.width) / 2
        };
      case 'bottom':
        return {
          top: triggerRect.bottom + sideOffset,
          left: triggerRect.left + (triggerRect.width - contentRect.width) / 2
        };
      case 'left':
        return {
          left: triggerRect.left - contentRect.width - sideOffset,
          top: triggerRect.top + (triggerRect.height - contentRect.height) / 2
        };
      case 'right':
        return {
          left: triggerRect.right + sideOffset,
          top: triggerRect.top + (triggerRect.height - contentRect.height) / 2
        };
      default:
        return { top: 0, left: 0 };
    }
  }

  _constrainToViewport(top, left, contentRect) {
    const { viewportPadding } = this.options;

    // Constrain to viewport
    if (left < viewportPadding) left = viewportPadding;
    if (top < viewportPadding) top = viewportPadding;
    if (left + contentRect.width > window.innerWidth - viewportPadding) {
      left = window.innerWidth - contentRect.width - viewportPadding;
    }
    if (top + contentRect.height > window.innerHeight - viewportPadding) {
      top = window.innerHeight - contentRect.height - viewportPadding;
    }

    return { top, left };
  }

  // Public API methods
  updateContent(newContent) {
    if (typeof newContent === 'string') {
      this.content.textContent = newContent;
    } else if (newContent instanceof HTMLElement) {
      this.content.innerHTML = '';
      this.content.appendChild(newContent);
    }
    
    // Reposition if visible
    if (this.isVisible) {
      this._positionTooltip();
    }

    this.emit('update', { content: newContent });
  }

  setSide(side) {
    const validSides = ['top', 'bottom', 'left', 'right'];
    if (validSides.includes(side)) {
      // Remove old side classes
      validSides.forEach(s => {
        this.trigger.classList.remove(`tooltip-${s}`);
      });
      
      // Add new side class
      this.trigger.classList.add(`tooltip-${side}`);
      this.preferredSide = side;
      
      // Reposition if visible
      if (this.isVisible) {
        this._positionTooltip();
      }

      this.emit('side-change', { side });
    }
  }

  // Toggle fit behavior
  setFit(fit = true) {
    this.options.fit = fit;
    this.content.classList.toggle('tooltip-fit', fit);
    
    if (this.isVisible) {
      this._positionTooltip();
    }
    
    this.emit('fit-change', { fit });
  }

  // Custom event system
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`tooltip:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }

  // Cleanup method
  destroy() {
    // Clear timers
    clearTimeout(this.showTimer);
    clearTimeout(this.hideTimer);

    // Hide if visible
    if (this.isVisible) {
      this.hide();
    }

    // Remove event listeners
    this.trigger.removeEventListener('mouseenter', this._boundHandlers.mouseenter);
    this.trigger.removeEventListener('mouseleave', this._boundHandlers.mouseleave);
    this.trigger.removeEventListener('focus', this._boundHandlers.focus);
    this.trigger.removeEventListener('blur', this._boundHandlers.blur);
    this.trigger.removeEventListener('keydown', this._boundHandlers.keydown);

    // Remove global listeners (just in case)
    window.removeEventListener('scroll', this._boundHandlers.position, true);
    window.removeEventListener('resize', this._boundHandlers.position, true);

    // Clean up DOM
    this.element.classList.remove('tooltip-initialized');
    delete this.element.tooltip;

    this.emit('destroy');
  }
}

// Optimized global handlers
const tooltipGlobals = {
  init() {
    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.autoInit);
    } else {
      this.autoInit();
    }
  },

  autoInit() {
    const tooltips = document.querySelectorAll('.tooltip:not(.tooltip-initialized)');
    for (const el of tooltips) {
      // Check if it has the required structure
      const trigger = el.querySelector('.tooltip-trigger');
      const content = el.querySelector('.tooltip-content');
      
      if (trigger && content) {
        el.tooltip = new Tooltip(el);
      }
    }
  }
};

// Initialize
tooltipGlobals.init();

export default Tooltip;
