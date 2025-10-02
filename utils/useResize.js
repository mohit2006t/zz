/**
 * @module useResize
 * @description A feature-rich, un-opinionated engine for managing resizable panel
 * layouts. It provides the logic for pointer and keyboard resizing, respecting complex
 * constraints, and gives the layout data to the consuming component for rendering.
 *
 * @example
 * // In your SplitPanel Component Class...
 * import { useResize } from './utils';
 *
 * class SplitPanel {
 *   constructor(container) {
 *     this.container = container;
 *     this.panels = Array.from(container.querySelectorAll('.resizable-panel'));
 *
 *     this.resizeEngine = useResize(this.container, {
 *       onLayoutChange: (newSizes) => {
 *         // The engine gives us the data. The component applies it.
 *         this.applyLayout(newSizes);
 *       }
 *     });
 *   }
 *
 *   applyLayout(sizes) {
 *     sizes.forEach((size, index) => {
 *       if (this.panels[index]) {
 *         this.panels[index].style.flexBasis = `${size}%`;
 *       }
 *     });
 *   }
 *
 *   destroy() {
 *     this.resizeEngine.destroy();
 *   }
 * }
 */

const defaultConfig = {
  orientation: 'horizontal',
  handleSelector: '.resize-handle',
  panelSelector: '.resizable-panel',
  draggingClass: 'is-dragging-handle',
  keyboardStep: 5, // Percentage
  onLayoutChange: () => {},
  onResizeStart: () => {},
  onResizeEnd: () => {},
};

export const useResize = (container, options = {}) => {
  if (!container) throw new Error('useResize requires a container element.');

  const config = { ...defaultConfig, ...options };
  const panelStates = new Map();
  let panels = [];
  let handles = [];

  const getConstraint = (panel, type) => {
    const attr = panel.dataset[type === 'min' ? 'minSize' : 'maxSize'] || '';
    if (attr.endsWith('%')) {
      return { value: parseFloat(attr), unit: '%' };
    }
    if (attr.endsWith('px')) {
      return { value: parseFloat(attr), unit: 'px' };
    }
    return { value: type === 'min' ? 0 : Infinity, unit: 'px' };
  };

  const getSizes = () => panels.map(p => parseFloat(p.style.flexBasis) || 100 / panels.length);

  const distributeSizes = (sizes) => {
    const containerSize = config.orientation === 'horizontal' ? container.clientWidth : container.clientHeight;
    
    // Convert all to pixels for initial calculation
    let pixelSizes = sizes.map(s => (s / 100) * containerSize);

    // Clamp against constraints
    for (let i = 0; i < panels.length; i++) {
        const panel = panels[i];
        const min = getConstraint(panel, 'min');
        const max = getConstraint(panel, 'max');
        const minPx = min.unit === '%' ? (min.value / 100) * containerSize : min.value;
        const maxPx = max.unit === '%' ? (max.value / 100) * containerSize : max.value;
        pixelSizes[i] = Math.max(minPx, Math.min(pixelSizes[i], maxPx));
    }

    const totalPixelSize = pixelSizes.reduce((a, b) => a + b, 0);
    // Convert back to percentages
    return pixelSizes.map(px => (px / totalPixelSize) * 100);
  };

  const attachHandleListeners = (handle, panelBefore, panelAfter) => {
    const onPointerDown = (e) => {
      const startPos = config.orientation === 'horizontal' ? e.clientX : e.clientY;
      const initialSizes = getSizes();
      const beforeIndex = panels.indexOf(panelBefore);
      const afterIndex = panels.indexOf(panelAfter);
      handle.classList.add(config.draggingClass);
      handle.setPointerCapture(e.pointerId);
      config.onResizeStart();

      const onPointerMove = (moveEvent) => {
        const currentPos = config.orientation === 'horizontal' ? moveEvent.clientX : moveEvent.clientY;
        const delta = currentPos - startPos;
        const containerSize = config.orientation === 'horizontal' ? container.clientWidth : container.clientHeight;
        const deltaPercent = (delta / containerSize) * 100;

        let newSizes = [...initialSizes];
        newSizes[beforeIndex] += deltaPercent;
        newSizes[afterIndex] -= deltaPercent;
        
        config.onLayoutChange(distributeSizes(newSizes));
      };
      
      const onPointerUp = () => {
        handle.classList.remove(config.draggingClass);
        handle.releasePointerCapture(e.pointerId);
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        config.onResizeEnd();
      };
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    };
    
    const onKeyDown = (e) => {
        const { key } = e;
        const dir = (key === 'ArrowLeft' || key === 'ArrowUp') ? -1 : (key === 'ArrowRight' || key === 'ArrowDown') ? 1 : 0;
        if (!dir && key !== 'Home' && key !== 'End') return;

        e.preventDefault();
        const initialSizes = getSizes();
        const beforeIndex = panels.indexOf(panelBefore);
        const afterIndex = panels.indexOf(panelAfter);
        let newSizes = [...initialSizes];

        if (key === 'Home') {
            newSizes[afterIndex] += newSizes[beforeIndex];
            newSizes[beforeIndex] = 0;
        } else if (key === 'End') {
            newSizes[beforeIndex] += newSizes[afterIndex];
            newSizes[afterIndex] = 0;
        } else {
            newSizes[beforeIndex] += dir * config.keyboardStep;
            newSizes[afterIndex] -= dir * config.keyboardStep;
        }
        config.onLayoutChange(distributeSizes(newSizes));
    };

    handle.addEventListener('pointerdown', onPointerDown);
    handle.addEventListener('keydown', onKeyDown);
    return { onPointerDown, onKeyDown }; // Return for easy cleanup
  };

  const initialize = () => {
    panels = Array.from(container.querySelectorAll(config.panelSelector));
    handles = Array.from(container.querySelectorAll(config.handleSelector));
    
    handles.forEach((handle, i) => {
      const panelBefore = panels[i];
      const panelAfter = panels[i+1];
      if (!panelBefore || !panelAfter) return;
      
      handle.setAttribute('role', 'separator');
      handle.setAttribute('tabindex', '0');
      
      const listeners = attachHandleListeners(handle, panelBefore, panelAfter);
      panelStates.set(handle, { listeners }); // Store for cleanup
    });
  };

  const setSizes = (sizes) => config.onLayoutChange(distributeSizes(sizes));

  const collapse = (panelIndex, toSize = 0) => {
      const currentSizes = getSizes();
      const preCollapseSize = currentSizes[panelIndex];
      panelStates.set(panels[panelIndex], { preCollapseSize });

      const sizeToCollapse = preCollapseSize - toSize;
      currentSizes[panelIndex] = toSize;
      
      const otherPanelsCount = panels.length - 1;
      for(let i=0; i < panels.length; i++) {
          if (i !== panelIndex) {
              currentSizes[i] += sizeToCollapse / otherPanelsCount;
          }
      }
      setSizes(currentSizes);
  };
  
  const expand = (panelIndex) => {
      const state = panelStates.get(panels[panelIndex]);
      if (!state || state.preCollapseSize === undefined) return;
      
      const currentSizes = getSizes();
      const sizeToExpand = state.preCollapseSize - currentSizes[panelIndex];
      currentSizes[panelIndex] = state.preCollapseSize;

      const otherPanelsCount = panels.length - 1;
      for(let i=0; i < panels.length; i++) {
          if (i !== panelIndex) {
              currentSizes[i] -= sizeToExpand / otherPanelsCount;
          }
      }
      setSizes(currentSizes);
  };

  const destroy = () => {
    handles.forEach(handle => {
        const state = panelStates.get(handle);
        if (state && state.listeners) {
            handle.removeEventListener('pointerdown', state.listeners.onPointerDown);
            handle.removeEventListener('keydown', state.listeners.onKeyDown);
        }
    });
    panels = [];
    handles = [];
    panelStates.clear();
  };

  initialize();
  
  return {
    setSizes,
    collapse,
    expand,
    refresh: () => { destroy(); initialize(); },
    destroy,
    getSizes,
  };
};

export default useResize;