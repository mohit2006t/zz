/**
 * @file scroll-area.js
 * @description Optimized ScrollArea with class-based architecture and configuration.
 */

export class ScrollArea {
  constructor(scrollAreaElement, options = {}) {
    if (!scrollAreaElement || scrollAreaElement.scrollArea) return;

    this.element = scrollAreaElement;
    this.id = scrollAreaElement.id || `scroll-area-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };

    // Core elements
    this.viewport = null;
    this.vScrollbar = null;
    this.hScrollbar = null;
    this.vThumb = null;
    this.hThumb = null;

    // State
    this.isDragging = false;
    this.dragAxis = null;
    this.dragOffset = 0;
    this.isVisible = { vertical: false, horizontal: false };

    // Bound event handlers for proper cleanup
    this._boundHandlers = {
      scroll: () => this._handleScroll(),
      resize: () => this._handleResize(),
      mousemove: (e) => this._handleMouseMove(e),
      mouseup: () => this._handleMouseUp(),
      vThumbMouseDown: (e) => this._handleThumbMouseDown(e, 'vertical'),
      hThumbMouseDown: (e) => this._handleThumbMouseDown(e, 'horizontal')
    };

    this.init();
    this.element.scrollArea = this;
  }

  defaults = {
    showScrollbars: 'hover', // 'always', 'hover', 'auto'
    hideDelay: 1000,
    thumbMinSize: 20,
    trackSize: 10,
    thumbSize: 6,
    smooth: true
  }

  init() {
    this.setupStructure();
    this.setupEvents();
    this.setupInitialState();
    this._applyClassBasedSettings();
    
    this.element.classList.add('scroll-area-initialized');
    this.emit('init', { 
      hasVerticalScroll: this._needsScrollbar('vertical'),
      hasHorizontalScroll: this._needsScrollbar('horizontal')
    });
  }

  setupStructure() {
    // If already has structure, just cache elements
    if (this.element.querySelector('.scroll-area-viewport')) {
      this._cacheElements();
      return;
    }

    // Create structure for js-scroll-area elements
    const contentWrapper = document.createElement('div');
    
    const viewport = document.createElement('div');
    viewport.className = 'scroll-area-viewport';
    viewport.appendChild(contentWrapper);
    
    // Move all existing content to content wrapper
    while (this.element.firstChild) {
      contentWrapper.appendChild(this.element.firstChild);
    }
    
    // Add viewport
    this.element.appendChild(viewport);
    
    // Add scrollbars
    this.element.insertAdjacentHTML('beforeend', `
      <div class="scroll-area-scrollbar scroll-area-scrollbar-vertical">
        <div class="scroll-area-thumb"></div>
      </div>
      <div class="scroll-area-scrollbar scroll-area-scrollbar-horizontal">
        <div class="scroll-area-thumb"></div>
      </div>
    `);
    
    this._cacheElements();
  }

  _cacheElements() {
    this.viewport = this.element.querySelector('.scroll-area-viewport');
    this.vScrollbar = this.element.querySelector('.scroll-area-scrollbar-vertical');
    this.hScrollbar = this.element.querySelector('.scroll-area-scrollbar-horizontal');
    this.vThumb = this.vScrollbar?.querySelector('.scroll-area-thumb');
    this.hThumb = this.hScrollbar?.querySelector('.scroll-area-thumb');
  }

  setupEvents() {
    // Viewport scroll
    this.viewport.addEventListener('scroll', this._boundHandlers.scroll);
    
    // Window resize
    window.addEventListener('resize', this._boundHandlers.resize);
    
    // Thumb drag events
    if (this.vThumb) {
      this.vThumb.addEventListener('mousedown', this._boundHandlers.vThumbMouseDown);
    }
    if (this.hThumb) {
      this.hThumb.addEventListener('mousedown', this._boundHandlers.hThumbMouseDown);
    }
    
    // Global drag events
    document.addEventListener('mousemove', this._boundHandlers.mousemove);
    document.addEventListener('mouseup', this._boundHandlers.mouseup);
  }

  setupInitialState() {
    this.element.classList.add('scroll-area');
    this.update();
  }

  _applyClassBasedSettings() {
    // Show scrollbars behavior
    if (this.element.classList.contains('scroll-area-always-show')) {
      this.options.showScrollbars = 'always';
    } else if (this.element.classList.contains('scroll-area-auto-hide')) {
      this.options.showScrollbars = 'auto';
    }

    // Smooth scrolling
    if (this.element.classList.contains('scroll-area-no-smooth')) {
      this.options.smooth = false;
    }

    // Apply smooth scrolling
    if (this.options.smooth) {
      this.viewport.style.scrollBehavior = 'smooth';
    }

    // Apply initial visibility
    this._updateScrollbarVisibility();
  }

  _handleScroll() {
    this.update();
    this.emit('scroll', {
      scrollTop: this.viewport.scrollTop,
      scrollLeft: this.viewport.scrollLeft,
      scrollHeight: this.viewport.scrollHeight,
      scrollWidth: this.viewport.scrollWidth
    });
  }

  _handleResize() {
    this.update();
    this.emit('resize');
  }

  _handleThumbMouseDown(e, axis) {
    e.preventDefault();
    e.stopPropagation();

    this.isDragging = true;
    this.dragAxis = axis;
    document.body.style.userSelect = 'none';

    const thumb = axis === 'vertical' ? this.vThumb : this.hThumb;
    const scrollbar = axis === 'vertical' ? this.vScrollbar : this.hScrollbar;
    
    thumb.classList.add('scroll-area-thumb-dragging');
    scrollbar.classList.add('scroll-area-scrollbar-dragging');

    const rect = thumb.getBoundingClientRect();
    this.dragOffset = axis === 'vertical' ? e.clientY - rect.top : e.clientX - rect.left;

    this.emit('drag-start', { axis });
  }

  _handleMouseMove(e) {
    if (!this.isDragging) return;
    e.preventDefault();

    const isVertical = this.dragAxis === 'vertical';
    const scrollbar = isVertical ? this.vScrollbar : this.hScrollbar;
    const trackRect = scrollbar.getBoundingClientRect();
    const thumb = isVertical ? this.vThumb : this.hThumb;
    const thumbLength = isVertical ? thumb.offsetHeight : thumb.offsetWidth;
    const maxThumbPos = (isVertical ? trackRect.height : trackRect.width) - thumbLength;

    const mousePos = isVertical ? e.clientY - trackRect.top : e.clientX - trackRect.left;
    const thumbPos = Math.max(0, Math.min(mousePos - this.dragOffset, maxThumbPos));
    const scrollRatio = maxThumbPos > 0 ? thumbPos / maxThumbPos : 0;

    const maxScroll = (isVertical ? this.viewport.scrollHeight : this.viewport.scrollWidth) - 
                     (isVertical ? this.viewport.clientHeight : this.viewport.clientWidth);
    
    this.viewport[isVertical ? 'scrollTop' : 'scrollLeft'] = scrollRatio * maxScroll;

    this.emit('drag', { axis: this.dragAxis, ratio: scrollRatio });
  }

  _handleMouseUp() {
    if (!this.isDragging) return;

    this.isDragging = false;
    document.body.style.userSelect = '';
    
    this.vThumb?.classList.remove('scroll-area-thumb-dragging');
    this.hThumb?.classList.remove('scroll-area-thumb-dragging');
    this.vScrollbar?.classList.remove('scroll-area-scrollbar-dragging');
    this.hScrollbar?.classList.remove('scroll-area-scrollbar-dragging');

    this.emit('drag-end', { axis: this.dragAxis });
    this.dragAxis = null;
  }

  update() {
    if (!this.viewport) return;

    requestAnimationFrame(() => {
      this._updateScrollbar('vertical');
      this._updateScrollbar('horizontal');
      this._updateScrollbarVisibility();
    });
  }

  _updateScrollbar(axis) {
    const isVertical = axis === 'vertical';
    const scrollbar = isVertical ? this.vScrollbar : this.hScrollbar;
    const thumb = isVertical ? this.vThumb : this.hThumb;

    if (!scrollbar || !thumb) return;

    const scrollSize = isVertical ? this.viewport.scrollHeight : this.viewport.scrollWidth;
    const clientSize = isVertical ? this.viewport.clientHeight : this.viewport.clientWidth;
    const needsScrollbar = scrollSize > clientSize;

    // Store visibility state
    this.isVisible[axis] = needsScrollbar;

    if (!needsScrollbar) {
      scrollbar.classList.add('scroll-area-scrollbar-hidden');
      return;
    }

    scrollbar.classList.remove('scroll-area-scrollbar-hidden');

    const trackLength = isVertical ? scrollbar.clientHeight : scrollbar.clientWidth;
    const thumbLength = Math.max(this.options.thumbMinSize, (clientSize / scrollSize) * trackLength);
    const scrollPos = isVertical ? this.viewport.scrollTop : this.viewport.scrollLeft;
    const maxScroll = scrollSize - clientSize;
    const thumbPos = maxScroll > 0 ? (scrollPos / maxScroll) * (trackLength - thumbLength) : 0;
    
    // Update thumb size and position
    thumb.style[isVertical ? 'height' : 'width'] = `${thumbLength}px`;
    thumb.style.transform = isVertical ? `translateY(${thumbPos}px)` : `translateX(${thumbPos}px)`;
  }

  _updateScrollbarVisibility() {
    const vNeedsScrollbar = this._needsScrollbar('vertical');
    const hNeedsScrollbar = this._needsScrollbar('horizontal');

    // Apply visibility based on show mode
    switch (this.options.showScrollbars) {
      case 'always':
        this.vScrollbar?.classList.toggle('scroll-area-scrollbar-always', vNeedsScrollbar);
        this.hScrollbar?.classList.toggle('scroll-area-scrollbar-always', hNeedsScrollbar);
        break;
      case 'auto':
        // Auto-hide after delay
        this._autoHideScrollbars();
        break;
      case 'hover':
      default:
        // Default hover behavior (handled by CSS)
        break;
    }
  }

  _needsScrollbar(axis) {
    if (!this.viewport) return false;
    const isVertical = axis === 'vertical';
    const scrollSize = isVertical ? this.viewport.scrollHeight : this.viewport.scrollWidth;
    const clientSize = isVertical ? this.viewport.clientHeight : this.viewport.clientWidth;
    return scrollSize > clientSize;
  }

  _autoHideScrollbars() {
    clearTimeout(this._hideTimer);
    
    this.vScrollbar?.classList.add('scroll-area-scrollbar-auto');
    this.hScrollbar?.classList.add('scroll-area-scrollbar-auto');
    
    this._hideTimer = setTimeout(() => {
      this.vScrollbar?.classList.remove('scroll-area-scrollbar-auto');
      this.hScrollbar?.classList.remove('scroll-area-scrollbar-auto');
    }, this.options.hideDelay);
  }

  // Public API methods
  scrollTo(options) {
    if (typeof options === 'number') {
      // Legacy: scrollTo(top)
      this.viewport.scrollTo({ top: options, behavior: this.options.smooth ? 'smooth' : 'auto' });
    } else {
      // Modern: scrollTo({ top, left, behavior })
      this.viewport.scrollTo({
        behavior: this.options.smooth ? 'smooth' : 'auto',
        ...options
      });
    }

    this.emit('scroll-to', options);
  }

  scrollToTop() {
    this.scrollTo({ top: 0 });
  }

  scrollToBottom() {
    this.scrollTo({ top: this.viewport.scrollHeight });
  }

  scrollToLeft() {
    this.scrollTo({ left: 0 });
  }

  scrollToRight() {
    this.scrollTo({ left: this.viewport.scrollWidth });
  }

  getScrollPosition() {
    return {
      top: this.viewport.scrollTop,
      left: this.viewport.scrollLeft,
      maxTop: this.viewport.scrollHeight - this.viewport.clientHeight,
      maxLeft: this.viewport.scrollWidth - this.viewport.clientWidth
    };
  }

  setScrollbarVisibility(mode) {
    this.options.showScrollbars = mode;
    this._updateScrollbarVisibility();
    this.emit('visibility-change', { mode });
  }

  // Custom event system
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`scroll-area:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }

  // Cleanup method
  destroy() {
    // Clear timers
    clearTimeout(this._hideTimer);

    // Remove event listeners
    this.viewport?.removeEventListener('scroll', this._boundHandlers.scroll);
    window.removeEventListener('resize', this._boundHandlers.resize);
    this.vThumb?.removeEventListener('mousedown', this._boundHandlers.vThumbMouseDown);
    this.hThumb?.removeEventListener('mousedown', this._boundHandlers.hThumbMouseDown);
    document.removeEventListener('mousemove', this._boundHandlers.mousemove);
    document.removeEventListener('mouseup', this._boundHandlers.mouseup);

    // Clean up DOM
    this.element.classList.remove('scroll-area-initialized');
    delete this.element.scrollArea;

    this.emit('destroy');
  }
}

// Optimized global handlers
const scrollAreaGlobals = {
  init() {
    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.autoInit.bind(this));
    } else {
      this.autoInit();
    }
  },

  autoInit() {
    // Auto-initialize js-scroll-area elements
    document.querySelectorAll('.js-scroll-area:not(.scroll-area-initialized)').forEach(el => {
      el.scrollArea = new ScrollArea(el);
    });

    // Auto-initialize scroll-area elements that have the basic structure
    document.querySelectorAll('.scroll-area:not(.scroll-area-initialized)').forEach(el => {
      if (el.querySelector('.scroll-area-viewport')) {
        el.scrollArea = new ScrollArea(el);
      }
    });
  }
};

// Initialize
scrollAreaGlobals.init();

export default ScrollArea;
