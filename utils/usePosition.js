/**
 * @module usePosition
 * @description A feature-rich engine for calculating the optimal position of a
 * floating element relative to a trigger. It includes smart auto-placement (flip),
 * collision avoidance (shift), dynamic sizing, and arrow positioning. This is the
 * core engine for building popovers, tooltips, and dropdowns.
 *
 * @example
 * // In your Popover Component Class...
 * import { usePosition } from './utils';
 *
 * class Popover {
 *   constructor(trigger, content, arrow) {
 *     this.trigger = trigger;
 *     this.content = content;
 *     this.arrow = arrow;
 *
 *     this.positionEngine = usePosition({
 *       placement: 'bottom-start',
 *       offset: 8,
 *       flip: true,
 *       shift: true,
 *       size: true,
 *       arrow: true,
 *     });
 *
 *     window.addEventListener('scroll', () => this.update(), true);
 *   }
 *
 *   update() {
 *     const { x, y, placement, arrow, size, isHidden } = this.positionEngine.compute(
 *       this.trigger,
 *       this.content,
 *       { arrowElement: this.arrow }
 *     );
 *
 *     if (isHidden) {
 *       this.hide();
 *       return;
 *     }
 *
 *     // The component takes the data from the engine and applies it.
 *     Object.assign(this.content.style, {
 *       left: `${x}px`,
 *       top: `${y}px`,
 *       maxWidth: size.maxWidth,
 *       maxHeight: size.maxHeight,
 *     });
 *
 *     if (this.arrow && arrow) {
 *       Object.assign(this.arrow.style, {
 *         left: `${arrow.x}px`,
 *         top: `${arrow.y}px`,
 *       });
 *     }
 *   }
 *
 *   destroy() {
 *      this.positionEngine.destroy();
 *      window.removeEventListener('scroll', () => this.update(), true);
 *   }
 * }
 */

const defaultConfig = {
  placement: 'bottom',
  offset: 0,
  skidding: 0,
  flip: true,
  flipPadding: 8,
  shift: true,
  shiftPadding: 8,
  size: false,
  arrow: false,
  arrowPadding: 4,
  boundary: 'viewport',
};

const PLACEMENT_ORDER = {
  top: ['top', 'bottom', 'right', 'left'],
  bottom: ['bottom', 'top', 'right', 'left'],
  left: ['left', 'right', 'top', 'bottom'],
  right: ['right', 'left', 'top', 'bottom'],
};

const getBoundaryRect = (boundary) => {
  if (boundary === 'viewport') {
    return { top: 0, left: 0, right: window.innerWidth, bottom: window.innerHeight };
  }
  return boundary.getBoundingClientRect();
};

export const usePosition = (globalConfig = {}) => {
  const engineConfig = { ...defaultConfig, ...globalConfig };

  const compute = (trigger, floating, perCallConfig = {}) => {
    if (!trigger || !floating) {
      throw new Error('usePosition compute requires a trigger and a floating element.');
    }
    const config = { ...engineConfig, ...perCallConfig };
    
    const triggerRect = trigger.getBoundingClientRect();
    const floatingRect = floating.getBoundingClientRect();
    const boundaryRect = getBoundaryRect(config.boundary);
    const arrowEl = config.arrowElement;
    const arrowRect = arrowEl ? { width: arrowEl.offsetWidth, height: arrowEl.offsetHeight } : { width: 0, height: 0 };

    let [side, align = 'center'] = config.placement.split('-');
    
    // --- PIPELINE START ---
    
    // 1. FLIP: Determine the best placement if the preferred one lacks space.
    if (config.flip) {
      const space = {
        top: triggerRect.top - boundaryRect.top - config.flipPadding,
        bottom: boundaryRect.bottom - triggerRect.bottom - config.flipPadding,
        left: triggerRect.left - boundaryRect.left - config.flipPadding,
        right: boundaryRect.right - triggerRect.right - config.flipPadding,
      };

      const requiredSpace = (s) => (s === 'top' || s === 'bottom') ? floatingRect.height : floatingRect.width;
      
      const fallbacks = PLACEMENT_ORDER[side] || PLACEMENT_ORDER.bottom;
      side = fallbacks.find(s => space[s] >= requiredSpace(s)) || fallbacks[0];
    }
    
    // 2. COMPUTE BASE: Calculate the initial ideal coordinates.
    let x, y;
    const alignX = () => {
      if (align === 'start') return triggerRect.left + config.skidding;
      if (align === 'end') return triggerRect.right - floatingRect.width + config.skidding;
      return triggerRect.left + (triggerRect.width - floatingRect.width) / 2 + config.skidding;
    };
    const alignY = () => {
      if (align === 'start') return triggerRect.top + config.skidding;
      if (align === 'end') return triggerRect.bottom - floatingRect.height + config.skidding;
      return triggerRect.top + (triggerRect.height - floatingRect.height) / 2 + config.skidding;
    };

    switch (side) {
      case 'top': x = alignX(); y = triggerRect.top - floatingRect.height - config.offset; break;
      case 'bottom': x = alignX(); y = triggerRect.bottom + config.offset; break;
      case 'left': x = triggerRect.left - floatingRect.width - config.offset; y = alignY(); break;
      case 'right': x = triggerRect.right + config.offset; y = alignY(); break;
    }

    const middlewareData = { x, y, initialPlacement: `${side}-${align}` };
    
    // 3. SHIFT: Adjust coordinates to prevent overflow.
    if (config.shift) {
        const overflow = {
            left: x < boundaryRect.left + config.shiftPadding,
            right: x + floatingRect.width > boundaryRect.right - config.shiftPadding,
            top: y < boundaryRect.top + config.shiftPadding,
            bottom: y + floatingRect.height > boundaryRect.bottom - config.shiftPadding
        };
        if(overflow.left) x = boundaryRect.left + config.shiftPadding;
        if(overflow.right) x = boundaryRect.right - floatingRect.width - config.shiftPadding;
        if(overflow.top) y = boundaryRect.top + config.shiftPadding;
        if(overflow.bottom) y = boundaryRect.bottom - floatingRect.height - config.shiftPadding;
    }
    
    // 4. SIZE: Calculate max dimensions to fit available space.
    const size = {};
    if (config.size) {
        const availableHeight = boundaryRect.bottom - y - config.shiftPadding;
        const availableWidth = boundaryRect.right - x - config.shiftPadding;
        size.maxHeight = `${Math.floor(availableHeight)}px`;
        size.maxWidth = `${Math.floor(availableWidth)}px`;
    }

    // 5. ARROW: Calculate arrow position.
    const arrow = {};
    if (config.arrow && arrowEl) {
        const staticSide = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[side];
        const clamp = (val, min, max) => Math.max(min, Math.min(val, max));
        
        arrow.x = clamp(
            triggerRect.left + triggerRect.width / 2 - x,
            config.arrowPadding,
            floatingRect.width - arrowRect.width - config.arrowPadding
        );
        arrow.y = clamp(
            triggerRect.top + triggerRect.height / 2 - y,
            config.arrowPadding,
            floatingRect.height - arrowRect.height - config.arrowPadding
        );
        
        if (staticSide === 'bottom') arrow.y = floatingRect.height - arrowRect.height / 2;
        if (staticSide === 'top') arrow.y = -arrowRect.height / 2;
        if (staticSide === 'right') arrow.x = floatingRect.width - arrowRect.width / 2;
        if (staticSide === 'left') arrow.x = -arrowRect.width / 2;
    }

    // 6. HIDE: Check if the trigger is out of view.
    const isHidden = triggerRect.bottom < boundaryRect.top || triggerRect.top > boundaryRect.bottom ||
                     triggerRect.right < boundaryRect.left || triggerRect.left > boundaryRect.right;
    
    return {
      x: Math.round(x),
      y: Math.round(y),
      placement: `${side}-${align}`,
      arrow,
      size,
      isHidden,
      middlewareData,
    };
  };

  // The engine itself doesn't need resize/scroll listeners. The consuming component is
  // responsible for calling `compute` when updates are needed (on scroll, resize, etc).
  // This makes the engine purer and more performant.
  const destroy = () => {};

  return { compute, destroy };
};

export default usePosition;