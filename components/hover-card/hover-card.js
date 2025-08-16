/**
 * @file hover-card.js
 * @description Optimized HoverCard with class-based architecture and configuration.
 */

export class HoverCard {
  constructor(hoverCardElement, options = {}) {
    if (!hoverCardElement || hoverCardElement.hoverCard) return;

    this.element = hoverCardElement;
    this.id = hoverCardElement.id || `hover-card-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };

    // Core elements
    this.trigger = this.element.querySelector('.hover-card-trigger');
    this.content = this.element.querySelector('.hover-card-content');
    
    if (!this.trigger || !this.content) {
      console.error('HoverCard missing required elements: .hover-card-trigger or .hover-card-content', this.element);
      return;
    }

    // State
    this.isOpen = false;
    this.openTimer = null;
    this.closeTimer = null;

    // Bound event handlers for proper cleanup
    this._boundHandlers = {
      triggerEnter: () => this._handleTriggerEnter(),
      triggerLeave: () => this._handleTriggerLeave(),
      contentEnter: () => this._handleContentEnter(),
      contentLeave: () => this._handleContentLeave(),
      windowResize: () => this._handleWindowResize()
    };

    this.init();
    this.element.hoverCard = this;
  }

  defaults = {
    openDelay: 100,
    closeDelay: 300,
    positioning: 'auto', // 'auto', 'top', 'bottom', 'left', 'right'
    offset: 8,
    closeOnClick: false,
    disabled: false
  }

  init() {
    this.setupStructure();
    this.setupEvents();
    this.setupInitialState();
    this._applyClassBasedSettings();
    
    this.element.classList.add('hover-card-initialized');
    this.emit('init');
  }

  setupStructure() {
    // Ensure content is positioned properly
    this.content.style.position = 'fixed';
    this.content.style.zIndex = '50';
    
    // Add ARIA attributes for accessibility
    const contentId = this.content.id || `${this.id}-content`;
    this.content.id = contentId;
    this.trigger.setAttribute('aria-describedby', contentId);
    this.content.setAttribute('role', 'tooltip');
  }

  setupEvents() {
    // Trigger events
    this.trigger.addEventListener('mouseenter', this._boundHandlers.triggerEnter);
    this.trigger.addEventListener('mouseleave', this._boundHandlers.triggerLeave);
    
    // Content events to keep it open when hovering over it
    this.content.addEventListener('mouseenter', this._boundHandlers.contentEnter);
    this.content.addEventListener('mouseleave', this._boundHandlers.contentLeave);
    
    // Optional click to close
    if (this.options.closeOnClick) {
      this.content.addEventListener('click', () => this.close());
    }
    
    // Reposition on window resize
    window.addEventListener('resize', this._boundHandlers.windowResize);
  }

  setupInitialState() {
    // Hide content initially
    this.content.style.display = 'none';
    this.content.setAttribute('data-state', 'closed');
  }

  _applyClassBasedSettings() {
    // Check for class-based configuration
    if (this.element.classList.contains('hover-card-disabled')) {
      this.options.disabled = true;
    }
    
    if (this.element.classList.contains('hover-card-click-close')) {
      this.options.closeOnClick = true;
    }
    
    if (this.element.classList.contains('hover-card-no-delay')) {
      this.options.openDelay = 0;
      this.options.closeDelay = 0;
    }
    
    if (this.element.classList.contains('hover-card-fast')) {
      this.options.openDelay = 50;
      this.options.closeDelay = 150;
    }
    
    if (this.element.classList.contains('hover-card-slow')) {
      this.options.openDelay = 300;
      this.options.closeDelay = 500;
    }

    // Positioning classes
    if (this.element.classList.contains('hover-card-top')) {
      this.options.positioning = 'top';
    } else if (this.element.classList.contains('hover-card-bottom')) {
      this.options.positioning = 'bottom';
    } else if (this.element.classList.contains('hover-card-left')) {
      this.options.positioning = 'left';
    } else if (this.element.classList.contains('hover-card-right')) {
      this.options.positioning = 'right';
    }
  }

  _handleTriggerEnter() {
    if (this.options.disabled) return;
    
    this._clearCloseTimer();
    
    // Don't re-open if already open
    if (this.isOpen) return;
    
    this.openTimer = setTimeout(() => {
      this.open();
    }, this.options.openDelay);
  }

  _handleTriggerLeave() {
    if (this.options.disabled) return;
    
    this._clearOpenTimer();
    this._startCloseTimer();
  }

  _handleContentEnter() {
    if (this.options.disabled) return;
    
    this._clearCloseTimer();
  }

  _handleContentLeave() {
    if (this.options.disabled) return;
    
    this._startCloseTimer();
  }

  _handleWindowResize() {
    if (this.isOpen) {
      this._positionContent();
    }
  }

  _clearOpenTimer() {
    if (this.openTimer) {
      clearTimeout(this.openTimer);
      this.openTimer = null;
    }
  }

  _clearCloseTimer() {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  _startCloseTimer() {
    this.closeTimer = setTimeout(() => {
      this.close();
    }, this.options.closeDelay);
  }

  // Public API methods
  open() {
    if (this.isOpen || this.options.disabled) return;

    this.isOpen = true;
    
    // Show content
    this.content.style.display = 'block';
    
    // Position content
    this._positionContent();
    
    // Animate in
    requestAnimationFrame(() => {
      this.content.setAttribute('data-state', 'open');
    });

    this.emit('open');
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    
    // Clear any pending timers
    this._clearOpenTimer();
    this._clearCloseTimer();
    
    // Animate out
    this.content.setAttribute('data-state', 'closed');
    
    // Hide after animation
    setTimeout(() => {
      if (this.content.getAttribute('data-state') === 'closed') {
        this.content.style.display = 'none';
      }
    }, 150); // Match animation duration

    this.emit('close');
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  _positionContent() {
    const triggerRect = this.trigger.getBoundingClientRect();
    const contentRect = this.content.getBoundingClientRect();
    const viewportPadding = this.options.offset;
    
    let position = this._calculateOptimalPosition(triggerRect, contentRect, viewportPadding);
    
    this.content.style.top = `${position.top}px`;
    this.content.style.left = `${position.left}px`;
    
    // Add positioning class for styling
    this.content.setAttribute('data-position', position.placement);
  }

  _calculateOptimalPosition(triggerRect, contentRect, viewportPadding) {
    const positions = {
      bottom: {
        top: triggerRect.bottom + viewportPadding,
        left: triggerRect.left + (triggerRect.width / 2) - (contentRect.width / 2),
        placement: 'bottom'
      },
      top: {
        top: triggerRect.top - contentRect.height - viewportPadding,
        left: triggerRect.left + (triggerRect.width / 2) - (contentRect.width / 2),
        placement: 'top'
      },
      right: {
        top: triggerRect.top + (triggerRect.height / 2) - (contentRect.height / 2),
        left: triggerRect.right + viewportPadding,
        placement: 'right'
      },
      left: {
        top: triggerRect.top + (triggerRect.height / 2) - (contentRect.height / 2),
        left: triggerRect.left - contentRect.width - viewportPadding,
        placement: 'left'
      }
    };

    // If specific positioning is requested, use it
    if (this.options.positioning !== 'auto' && positions[this.options.positioning]) {
      const position = positions[this.options.positioning];
      return this._adjustForViewport(position, contentRect, viewportPadding);
    }

    // Auto positioning - try bottom first, then other positions
    const preferredOrder = ['bottom', 'top', 'right', 'left'];
    
    for (const placement of preferredOrder) {
      const position = positions[placement];
      if (this._fitsInViewport(position, contentRect, viewportPadding)) {
        return this._adjustForViewport(position, contentRect, viewportPadding);
      }
    }

    // Fallback to bottom with adjustments
    return this._adjustForViewport(positions.bottom, contentRect, viewportPadding);
  }

  _fitsInViewport(position, contentRect, viewportPadding) {
    return (
      position.top >= viewportPadding &&
      position.left >= viewportPadding &&
      position.top + contentRect.height <= window.innerHeight - viewportPadding &&
      position.left + contentRect.width <= window.innerWidth - viewportPadding
    );
  }

  _adjustForViewport(position, contentRect, viewportPadding) {
    // Adjust horizontal position
    if (position.left < viewportPadding) {
      position.left = viewportPadding;
    } else if (position.left + contentRect.width > window.innerWidth - viewportPadding) {
      position.left = window.innerWidth - contentRect.width - viewportPadding;
    }

    // Adjust vertical position
    if (position.top < viewportPadding) {
      position.top = viewportPadding;
    } else if (position.top + contentRect.height > window.innerHeight - viewportPadding) {
      position.top = window.innerHeight - contentRect.height - viewportPadding;
    }

    return position;
  }

  // Public utility methods
  setContent(content) {
    if (typeof content === 'string') {
      this.content.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      this.content.innerHTML = '';
      this.content.appendChild(content);
    }
  }

  enable() {
    this.options.disabled = false;
    this.element.classList.remove('hover-card-disabled');
  }

  disable() {
    this.options.disabled = true;
    this.element.classList.add('hover-card-disabled');
    if (this.isOpen) {
      this.close();
    }
  }

  updatePosition() {
    if (this.isOpen) {
      this._positionContent();
    }
  }

  getState() {
    return {
      isOpen: this.isOpen,
      disabled: this.options.disabled,
      hasTimer: !!(this.openTimer || this.closeTimer),
      options: { ...this.options }
    };
  }

  // Custom event system
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`hover-card:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }

  // Cleanup method
  destroy() {
    // Clear timers
    this._clearOpenTimer();
    this._clearCloseTimer();

    // Close if open
    if (this.isOpen) {
      this.close();
    }

    // Remove event listeners
    this.trigger.removeEventListener('mouseenter', this._boundHandlers.triggerEnter);
    this.trigger.removeEventListener('mouseleave', this._boundHandlers.triggerLeave);
    this.content.removeEventListener('mouseenter', this._boundHandlers.contentEnter);
    this.content.removeEventListener('mouseleave', this._boundHandlers.contentLeave);
    window.removeEventListener('resize', this._boundHandlers.windowResize);

    // Clean up DOM
    this.element.classList.remove('hover-card-initialized');
    delete this.element.hoverCard;

    this.emit('destroy');
  }
}

// Auto-initialize hover cards
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.hover-card:not(.hover-card-initialized)').forEach(el => {
    new HoverCard(el);
  });
});

export default HoverCard;
