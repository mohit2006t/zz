/**
 * @file navigation-menu.js
 * @description Optimized NavigationMenu with class-based architecture.
 */

export class NavigationMenu {
  constructor(navElement, options = {}) {
    if (!navElement || navElement.navigationMenu) return;

    this.element = navElement;
    this.id = navElement.id || `navigation-menu-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };

    // Core elements
    this.triggers = Array.from(this.element.querySelectorAll(this.options.triggerSelector));
    this.links = Array.from(this.element.querySelectorAll(this.options.linkSelector));
    this.panel = this.element.querySelector(this.options.panelSelector);
    this.contents = Array.from(this.element.querySelectorAll(this.options.contentSelector));

    if (!this.panel || this.triggers.length === 0 || this.contents.length === 0) {
      console.warn('NavigationMenu: Missing required elements.', {
        panel: this.panel,
        triggers: this.triggers.length,
        contents: this.contents.length
      });
      return;
    }

    // State
    this.activeIndex = -1;
    this.closeTimer = null;
    this.heightTimer = null;

    // Bound event handlers for proper cleanup
    this._boundHandlers = {
      keydown: (e) => this._handleKeydown(e),
      resize: () => this._handleResize(),
      scroll: () => this._handleScroll(),
      outsideClick: (e) => this._handleOutsideClick(e),
      rootEnter: () => this._handleRootEnter(),
      rootLeave: () => this._handleRootLeave()
    };

    this.init();
    this.element.navigationMenu = this;
  }

  defaults = {
    triggerSelector: '[data-nav-trigger]',
    linkSelector: '[data-nav-link]',
    panelSelector: '[data-nav-panel]',
    contentSelector: '[data-nav-content]',
    closeDelay: 200,
    heightCalculationDelay: 50,
    animationDuration: 250,
    panelOffset: 8,
    viewportPadding: 8,
    onOpen: () => {},
    onClose: () => {},
    onContentChange: () => {}
  }

  init() {
    this.setupStructure();
    this.setupEvents();
    this.setupInitialState();
    
    this.element.classList.add('navigation-menu-initialized');
    this.emit('init');
  }

  setupStructure() {
    // Set up ARIA attributes for accessibility
    this.panel.setAttribute('role', 'menu');
    this.panel.setAttribute('aria-hidden', 'true');
  }

  setupEvents() {
    // Initialize triggers
    this.triggers.forEach((trigger, i) => {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('data-nav-index', String(i));
      trigger.setAttribute('role', 'menuitem');
      trigger.setAttribute('aria-haspopup', 'true');
      
      trigger.addEventListener('mouseenter', () => this.open(i));
    });

    // Initialize links (non-dropdown items)
    this.links.forEach(link => {
      link.addEventListener('mouseenter', () => {
        if (this.activeIndex !== -1) this.close();
      });
    });

    // Root hover management
    this.element.addEventListener('mouseenter', this._boundHandlers.rootEnter);
    this.element.addEventListener('mouseleave', this._boundHandlers.rootLeave);

    // Global event listeners
    document.addEventListener('click', this._boundHandlers.outsideClick);
    document.addEventListener('keydown', this._boundHandlers.keydown);
    window.addEventListener('resize', this._boundHandlers.resize);
    window.addEventListener('scroll', this._boundHandlers.scroll, true);
  }

  setupInitialState() {
    // Initialize content states
    this.contents.forEach(content => {
      content.setAttribute('data-state', 'inactive');
      content.setAttribute('role', 'menu');
    });
  }

  _handleRootEnter() {
    clearTimeout(this.closeTimer);
  }

  _handleRootLeave() {
    this.closeTimer = setTimeout(() => this.close(), this.options.closeDelay);
  }

  _handleOutsideClick(e) {
    if (this.activeIndex !== -1 && !this.element.contains(e.target)) {
      this.close();
    }
  }

  _handleKeydown(e) {
    if (document.activeElement && this.triggers.includes(document.activeElement)) {
      const idx = this.triggers.indexOf(document.activeElement);
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = (idx + 1) % this.triggers.length;
        this.triggers[next].focus();
        if (this.activeIndex !== -1) this.open(next);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = (idx - 1 + this.triggers.length) % this.triggers.length;
        this.triggers[prev].focus();
        if (this.activeIndex !== -1) this.open(prev);
      }
    }
    if (e.key === 'Escape') {
      this.close();
    }
  }

  _handleResize() {
    if (this.activeIndex !== -1) {
      this._positionPanel();
    }
  }

  _handleScroll() {
    if (this.activeIndex !== -1) {
      this._positionPanel();
    }
  }

  // Public API methods
  open(index) {
    if (index === this.activeIndex) return;

    clearTimeout(this.closeTimer);
    clearTimeout(this.heightTimer);
    
    const previousIndex = this.activeIndex;

    // Handle content transitions with custom animations
    if (previousIndex !== -1 && previousIndex !== index) {
      const direction = index > previousIndex ? 'forward' : 'backward';
      const outgoingContent = this.contents[previousIndex];
      const incomingContent = this.contents[index];

      // Apply motion data attributes for CSS animations
      outgoingContent.setAttribute('data-motion', direction === 'forward' ? 'to-start' : 'to-end');
      incomingContent.setAttribute('data-motion', direction === 'forward' ? 'from-end' : 'from-start');

      setTimeout(() => {
        outgoingContent.removeAttribute('data-motion');
        incomingContent.removeAttribute('data-motion');
      }, this.options.animationDuration);

      this.options.onContentChange(index, previousIndex, direction);
      this.emit('content-change', { index, previousIndex, direction });
    }

    // Update trigger states
    this.triggers.forEach((trigger, i) => {
      trigger.setAttribute('aria-expanded', i === index ? 'true' : 'false');
    });

    // Update content states
    this.contents.forEach((content, i) => {
      content.setAttribute('data-state', i === index ? 'active' : 'inactive');
    });

    this.activeIndex = index;

    // Update panel state and positioning
    this.panel.setAttribute('data-state', 'open');
    this.panel.setAttribute('aria-hidden', 'false');
    this._deferredPositionPanel();

    this.options.onOpen(index, this.contents[index]);
    this.emit('open', { index, content: this.contents[index] });
  }

  close() {
    if (this.activeIndex === -1) return;

    clearTimeout(this.heightTimer);
    const outgoingContent = this.contents[this.activeIndex];
    const previousIndex = this.activeIndex;

    // Apply closing animation
    if (outgoingContent) {
      outgoingContent.setAttribute('data-motion', 'to-panel');
    }

    // Update states
    this.triggers.forEach(trigger => trigger.setAttribute('aria-expanded', 'false'));
    this.contents.forEach(content => content.setAttribute('data-state', 'inactive'));
    
    this.activeIndex = -1;
    this.panel.setAttribute('data-state', 'closed');
    this.panel.setAttribute('aria-hidden', 'true');

    // Clean up after animation
    setTimeout(() => {
      if (this.activeIndex === -1 && outgoingContent) {
        outgoingContent.removeAttribute('data-motion');
      }
    }, this.options.animationDuration);

    this.options.onClose(previousIndex);
    this.emit('close', { previousIndex });
  }

  _deferredPositionPanel() {
    clearTimeout(this.heightTimer);
    this._calculatePosition();
    this.heightTimer = setTimeout(() => {
      this._calculateHeight();
    }, this.options.heightCalculationDelay);
  }

  _positionPanel() {
    this._calculatePosition();
    this._calculateHeight();
  }

  _calculatePosition() {
    const activeTrigger = this.triggers[this.activeIndex];
    if (!activeTrigger) return;

    const triggerRect = activeTrigger.getBoundingClientRect();
    const panelWidth = this.panel.offsetWidth;
    const top = triggerRect.bottom + this.options.panelOffset;
    let left = triggerRect.left;

    // Handle horizontal overflow
    if (left + panelWidth > window.innerWidth - this.options.viewportPadding) {
      left = window.innerWidth - panelWidth - this.options.viewportPadding;
    }
    left = Math.max(this.options.viewportPadding, left);

    this.panel.style.top = `${top}px`;
    this.panel.style.left = `${left}px`;
  }

  _calculateHeight() {
    const activeContent = this.contents[this.activeIndex];
    if (!activeContent) return;

    // Force reflow to get accurate height
    activeContent.offsetHeight;
    const newHeight = activeContent.scrollHeight;
    this.panel.style.height = `${newHeight}px`;
  }

  // Public API methods
  openPanel(index) {
    if (index >= 0 && index < this.triggers.length) {
      this.open(index);
    }
  }

  closePanel() {
    this.close();
  }

  getActiveIndex() {
    return this.activeIndex;
  }

  isOpen() {
    return this.activeIndex !== -1;
  }

  // Custom event system
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`navigation-menu:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }

  // Cleanup method
  destroy() {
    // Clear timers
    clearTimeout(this.closeTimer);
    clearTimeout(this.heightTimer);

    // Close if open
    if (this.isOpen()) {
      this.close();
    }

    // Remove event listeners
    this.element.removeEventListener('mouseenter', this._boundHandlers.rootEnter);
    this.element.removeEventListener('mouseleave', this._boundHandlers.rootLeave);
    document.removeEventListener('click', this._boundHandlers.outsideClick);
    document.removeEventListener('keydown', this._boundHandlers.keydown);
    window.removeEventListener('resize', this._boundHandlers.resize);
    window.removeEventListener('scroll', this._boundHandlers.scroll, true);

    // Clean up DOM
    this.element.classList.remove('navigation-menu-initialized');
    delete this.element.navigationMenu;

    this.emit('destroy');
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.navmenu:not(.navigation-menu-initialized)').forEach(el => {
    new NavigationMenu(el);
  });
});

export default NavigationMenu;
