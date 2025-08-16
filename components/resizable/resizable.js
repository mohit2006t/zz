/**
 * @file resizable.js
 * @description Optimized Resizable with class-based architecture and configuration.
 */

export class Resizable {
  constructor(resizableElement, options = {}) {
    if (!resizableElement || resizableElement.resizable) return;

    this.element = resizableElement;
    this.id = resizableElement.id || `resizable-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };

    // Core elements
    this.handles = [];
    this.panels = [];
    this.orientation = this._getOrientationFromClasses();

    // State
    this.isDragging = false;
    this.isCornerDragging = false;
    this.dragState = null;

    // Bound event handlers for proper cleanup
    this._boundHandlers = {
      mousedown: new Map(),
      mousemove: (e) => this._handleMouseMove(e),
      mouseup: () => this._handleMouseUp(),
      keydown: (e) => this._handleKeydown(e)
    };

    this.init();
    this.element.resizable = this;
  }

  defaults = {
    orientation: 'horizontal',
    minPanelSize: 50,
    keyboard: true,
    cornerResize: true,
    constrainDrag: true
  }

  init() {
    this.setupStructure();
    this.setupEvents();
    this.setupInitialState();
    this._applyClassBasedSettings();
    
    this.element.classList.add('resizable-initialized');
    this.emit('init', { 
      orientation: this.orientation,
      panels: this.panels.length,
      handles: this.handles.length
    });
  }

  _getOrientationFromClasses() {
    if (this.element.classList.contains('resizable-vertical')) return 'vertical';
    return 'horizontal'; // Default
  }

  setupStructure() {
    // Cache handles and panels
    this.handles = Array.from(this.element.querySelectorAll(':scope > .resizable-handle'));
    this.panels = Array.from(this.element.querySelectorAll(':scope > .resizable-panel'));

    // Validate structure
    if (this.panels.length < 2) {
      console.warn('Resizable needs at least 2 panels to function properly');
      return;
    }

    if (this.handles.length !== this.panels.length - 1) {
      console.warn('Resizable should have exactly (panels - 1) handles');
    }
  }

  setupEvents() {
    // Setup handle events
    this.handles.forEach((handle, index) => {
      const prevPanel = this.panels[index];
      const nextPanel = this.panels[index + 1];

      if (!prevPanel || !nextPanel) return;

      const boundMouseDown = (e) => this._handleMouseDown(e, handle, prevPanel, nextPanel);
      this._boundHandlers.mousedown.set(handle, boundMouseDown);
      handle.addEventListener('mousedown', boundMouseDown);

      // Setup corner detection if enabled
      if (this.options.cornerResize) {
        this._initCornerDetection(handle, prevPanel, nextPanel);
      }

      // Add accessibility attributes
      handle.setAttribute('role', 'separator');
      handle.setAttribute('aria-orientation', this.orientation);
      handle.setAttribute('tabindex', '0');
    });

    // Keyboard support
    if (this.options.keyboard) {
      this.handles.forEach(handle => {
        handle.addEventListener('keydown', this._boundHandlers.keydown);
      });
    }
  }

  setupInitialState() {
    this.element.classList.add('resizable-root');
    
    // Apply orientation class
    if (this.orientation === 'vertical') {
      this.element.classList.add('resizable-vertical');
    } else {
      this.element.classList.add('resizable-horizontal');
    }

    // Set initial flex styles on panels
    this.panels.forEach(panel => {
      if (!panel.style.flexBasis) {
        panel.style.flexBasis = `${100 / this.panels.length}%`;
      }
    });
  }

  _applyClassBasedSettings() {
    // Corner resize
    if (this.element.classList.contains('resizable-no-corner')) {
      this.options.cornerResize = false;
    }

    // Keyboard
    if (this.element.classList.contains('resizable-no-keyboard')) {
      this.options.keyboard = false;
    }

    // Constrain drag
    if (this.element.classList.contains('resizable-no-constrain')) {
      this.options.constrainDrag = false;
    }

    // Update orientation from classes
    this.orientation = this._getOrientationFromClasses();
  }

  _handleMouseDown(e, handle, prevPanel, nextPanel) {
    e.preventDefault();
    
    let cornerTarget = null;
    
    // Check for corner drag if enabled
    if (this.options.cornerResize && this.orientation === 'horizontal') {
      cornerTarget = this._findCornerTarget(e, prevPanel, nextPanel);
    }
    
    if (cornerTarget) {
      this._startCornerDrag(e, prevPanel, nextPanel, cornerTarget);
    } else {
      this._startDrag(e, handle, prevPanel, nextPanel);
    }
  }

  _findCornerTarget(e, prevPanel, nextPanel) {
    const verticalHandles = [
      ...prevPanel.querySelectorAll('.resizable-vertical .resizable-handle'),
      ...nextPanel.querySelectorAll('.resizable-vertical .resizable-handle')
    ];
    
    for (const vHandle of verticalHandles) {
      if (this._isMouseEventOnCorner(e, vHandle)) {
        return vHandle;
      }
    }
    
    return null;
  }

  _initCornerDetection(handle, prevPanel, nextPanel) {
    if (this.orientation !== 'horizontal') return;
    
    const verticalHandles = [
      ...prevPanel.querySelectorAll('.resizable-vertical .resizable-handle'),
      ...nextPanel.querySelectorAll('.resizable-vertical .resizable-handle')
    ];
    
    if (verticalHandles.length === 0) return;
    
    handle.addEventListener('mousemove', (e) => {
      let isOverAnyCorner = false;
      for (const vHandle of verticalHandles) {
        if (this._isMouseEventOnCorner(e, vHandle)) {
          isOverAnyCorner = true;
          break;
        }
      }
      handle.style.cursor = isOverAnyCorner ? 'all-scroll' : (this.orientation === 'horizontal' ? 'ew-resize' : 'ns-resize');
    });
    
    handle.addEventListener('mouseleave', () => {
      handle.style.cursor = this.orientation === 'horizontal' ? 'ew-resize' : 'ns-resize';
    });
  }

  _isMouseEventOnCorner(event, verticalHandle) {
    const vRect = verticalHandle.getBoundingClientRect();
    const hitArea = 4;
    return event.clientY >= vRect.top - hitArea && event.clientY <= vRect.bottom + hitArea;
  }

  _startDrag(e, handle, prevPanel, nextPanel) {
    this.isDragging = true;
    const isHorizontal = this.orientation === 'horizontal';
    
    this.dragState = {
      handle,
      prevPanel,
      nextPanel,
      startPos: isHorizontal ? e.clientX : e.clientY,
      prevSize: isHorizontal ? prevPanel.offsetWidth : prevPanel.offsetHeight,
      nextSize: isHorizontal ? nextPanel.offsetWidth : nextPanel.offsetHeight,
      isHorizontal
    };

    handle.classList.add('resizable-handle-dragging');
    document.body.style.cursor = isHorizontal ? 'ew-resize' : 'ns-resize';
    document.body.style.userSelect = 'none';

    // Add global listeners
    document.addEventListener('mousemove', this._boundHandlers.mousemove);
    document.addEventListener('mouseup', this._boundHandlers.mouseup);

    this.emit('drag-start', { 
      handle, 
      prevPanel, 
      nextPanel, 
      orientation: this.orientation 
    });
  }

  _startCornerDrag(e, leftPanel, rightPanel, verticalHandle) {
    this.isCornerDragging = true;
    const topPanel = verticalHandle.previousElementSibling;
    const bottomPanel = verticalHandle.nextElementSibling;
    
    if (!topPanel || !bottomPanel) return;

    this.dragState = {
      leftPanel,
      rightPanel,
      topPanel,
      bottomPanel,
      verticalHandle,
      startX: e.clientX,
      startY: e.clientY,
      leftStartWidth: leftPanel.offsetWidth,
      rightStartWidth: rightPanel.offsetWidth,
      topStartHeight: topPanel.offsetHeight,
      bottomStartHeight: bottomPanel.offsetHeight
    };

    document.body.style.cursor = 'all-scroll';
    document.body.style.userSelect = 'none';

    // Add global listeners
    document.addEventListener('mousemove', this._boundHandlers.mousemove);
    document.addEventListener('mouseup', this._boundHandlers.mouseup);

    this.emit('corner-drag-start', { 
      leftPanel, 
      rightPanel, 
      topPanel, 
      bottomPanel 
    });
  }

  _handleMouseMove(e) {
    if (!this.isDragging && !this.isCornerDragging) return;
    e.preventDefault();

    if (this.isCornerDragging) {
      this._updateCornerDrag(e);
    } else {
      this._updateDrag(e);
    }
  }

  _updateDrag(e) {
    const { startPos, prevSize, nextSize, prevPanel, nextPanel, isHorizontal } = this.dragState;
    const currentPos = isHorizontal ? e.clientX : e.clientY;
    const delta = currentPos - startPos;

    let newPrevSize = prevSize + delta;
    let newNextSize = nextSize - delta;

    // Apply constraints if enabled
    if (this.options.constrainDrag) {
      const minSize = this.options.minPanelSize;
      
      if (newPrevSize < minSize) {
        newNextSize += newPrevSize - minSize;
        newPrevSize = minSize;
      }
      if (newNextSize < minSize) {
        newPrevSize += newNextSize - minSize;
        newNextSize = minSize;
      }
    }

    prevPanel.style.flexBasis = `${Math.max(0, newPrevSize)}px`;
    nextPanel.style.flexBasis = `${Math.max(0, newNextSize)}px`;

    this.emit('drag', { 
      prevSize: newPrevSize, 
      nextSize: newNextSize, 
      delta 
    });
  }

  _updateCornerDrag(e) {
    const {
      leftPanel, rightPanel, topPanel, bottomPanel,
      startX, startY, leftStartWidth, rightStartWidth,
      topStartHeight, bottomStartHeight
    } = this.dragState;

    // Handle horizontal resize
    const deltaX = e.clientX - startX;
    let newLeftWidth = leftStartWidth + deltaX;
    let newRightWidth = rightStartWidth - deltaX;

    if (this.options.constrainDrag) {
      const minSize = this.options.minPanelSize;
      
      if (newLeftWidth < minSize) {
        newRightWidth += newLeftWidth - minSize;
        newLeftWidth = minSize;
      }
      if (newRightWidth < minSize) {
        newLeftWidth += newRightWidth - minSize;
        newRightWidth = minSize;
      }
    }

    leftPanel.style.flexBasis = `${Math.max(0, newLeftWidth)}px`;
    rightPanel.style.flexBasis = `${Math.max(0, newRightWidth)}px`;

    // Handle vertical resize
    const deltaY = e.clientY - startY;
    let newTopHeight = topStartHeight + deltaY;
    let newBottomHeight = bottomStartHeight - deltaY;

    if (this.options.constrainDrag) {
      const minSize = this.options.minPanelSize;
      
      if (newTopHeight < minSize) {
        newBottomHeight += newTopHeight - minSize;
        newTopHeight = minSize;
      }
      if (newBottomHeight < minSize) {
        newTopHeight += newBottomHeight - minSize;
        newBottomHeight = minSize;
      }
    }

    topPanel.style.flexBasis = `${Math.max(0, newTopHeight)}px`;
    bottomPanel.style.flexBasis = `${Math.max(0, newBottomHeight)}px`;

    this.emit('corner-drag', { 
      deltaX, 
      deltaY, 
      leftWidth: newLeftWidth, 
      rightWidth: newRightWidth,
      topHeight: newTopHeight, 
      bottomHeight: newBottomHeight 
    });
  }

  _handleMouseUp() {
    if (!this.isDragging && !this.isCornerDragging) return;

    // Clean up dragging state
    if (this.isDragging) {
      this.dragState.handle?.classList.remove('resizable-handle-dragging');
      this.emit('drag-end', this.dragState);
    }

    if (this.isCornerDragging) {
      this.emit('corner-drag-end', this.dragState);
    }

    // Reset state
    this.isDragging = false;
    this.isCornerDragging = false;
    this.dragState = null;

    // Clean up global styles and listeners
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', this._boundHandlers.mousemove);
    document.removeEventListener('mouseup', this._boundHandlers.mouseup);
  }

  _handleKeydown(e) {
    const handle = e.target;
    const index = this.handles.indexOf(handle);
    
    if (index === -1) return;

    const prevPanel = this.panels[index];
    const nextPanel = this.panels[index + 1];
    
    if (!prevPanel || !nextPanel) return;

    let handled = false;
    const step = 10; // pixels to move per keypress
    const isHorizontal = this.orientation === 'horizontal';

    switch (e.key) {
      case 'ArrowLeft':
        if (isHorizontal) {
          this._adjustPanelSizes(prevPanel, nextPanel, -step);
          handled = true;
        }
        break;
      case 'ArrowRight':
        if (isHorizontal) {
          this._adjustPanelSizes(prevPanel, nextPanel, step);
          handled = true;
        }
        break;
      case 'ArrowUp':
        if (!isHorizontal) {
          this._adjustPanelSizes(prevPanel, nextPanel, -step);
          handled = true;
        }
        break;
      case 'ArrowDown':
        if (!isHorizontal) {
          this._adjustPanelSizes(prevPanel, nextPanel, step);
          handled = true;
        }
        break;
      case 'Home':
        this._adjustPanelSizes(prevPanel, nextPanel, -999999);
        handled = true;
        break;
      case 'End':
        this._adjustPanelSizes(prevPanel, nextPanel, 999999);
        handled = true;
        break;
    }

    if (handled) {
      e.preventDefault();
      this.emit('keyboard-resize', { 
        key: e.key, 
        prevPanel, 
        nextPanel, 
        step 
      });
    }
  }

  _adjustPanelSizes(prevPanel, nextPanel, delta) {
    const isHorizontal = this.orientation === 'horizontal';
    const prevSize = isHorizontal ? prevPanel.offsetWidth : prevPanel.offsetHeight;
    const nextSize = isHorizontal ? nextPanel.offsetWidth : nextPanel.offsetHeight;

    let newPrevSize = prevSize + delta;
    let newNextSize = nextSize - delta;

    // Apply constraints
    if (this.options.constrainDrag) {
      const minSize = this.options.minPanelSize;
      
      if (newPrevSize < minSize) {
        newNextSize += newPrevSize - minSize;
        newPrevSize = minSize;
      }
      if (newNextSize < minSize) {
        newPrevSize += newNextSize - minSize;
        newNextSize = minSize;
      }
    }

    prevPanel.style.flexBasis = `${Math.max(0, newPrevSize)}px`;
    nextPanel.style.flexBasis = `${Math.max(0, newNextSize)}px`;
  }

  // Public API methods
  setOrientation(orientation) {
    if (!['horizontal', 'vertical'].includes(orientation)) return;

    this.orientation = orientation;
    
    // Update classes
    this.element.classList.remove('resizable-horizontal', 'resizable-vertical');
    this.element.classList.add(`resizable-${orientation}`);

    // Update handle ARIA
    this.handles.forEach(handle => {
      handle.setAttribute('aria-orientation', orientation);
    });

    this.emit('orientation-change', { orientation });
  }

  getPanelSizes() {
    return this.panels.map((panel, index) => {
      const isHorizontal = this.orientation === 'horizontal';
      return {
        index,
        size: isHorizontal ? panel.offsetWidth : panel.offsetHeight,
        flexBasis: panel.style.flexBasis
      };
    });
  }

  setPanelSize(panelIndex, size) {
    const panel = this.panels[panelIndex];
    if (!panel) return;

    panel.style.flexBasis = typeof size === 'number' ? `${size}px` : size;
    this.emit('panel-resize', { panelIndex, size });
  }

  resetPanelSizes() {
    const equalSize = `${100 / this.panels.length}%`;
    this.panels.forEach(panel => {
      panel.style.flexBasis = equalSize;
    });
    this.emit('reset');
  }

  // Custom event system
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`resizable:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }

  // Cleanup method
  destroy() {
    // Clean up ongoing drags
    if (this.isDragging || this.isCornerDragging) {
      this._handleMouseUp();
    }

    // Remove event listeners
    this._boundHandlers.mousedown.forEach((handler, handle) => {
      handle.removeEventListener('mousedown', handler);
    });

    this.handles.forEach(handle => {
      handle.removeEventListener('keydown', this._boundHandlers.keydown);
    });

    document.removeEventListener('mousemove', this._boundHandlers.mousemove);
    document.removeEventListener('mouseup', this._boundHandlers.mouseup);

    // Clean up DOM
    this.element.classList.remove('resizable-initialized');
    delete this.element.resizable;

    this.emit('destroy');
  }
}

// Auto-initialize resizable panels
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.resizable-root:not(.resizable-initialized)').forEach(el => {
    el.resizable = new Resizable(el);
  });
});

export default Resizable;
