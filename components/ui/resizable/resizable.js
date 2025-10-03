/**
 * @file resizable.js
 * @description Manages the behavior of a flexible, nested, resizable panel layout using ARIA attributes.
 */
function resizable() {
  /**
   * Gets the minimum size of a panel from its ARIA attribute.
   * @param {HTMLElement} panel - The resizable panel element.
   * @returns {number} The minimum size in pixels.
   */
  const getMinSize = (panel) => parseInt(panel.getAttribute('aria-valuemin'), 10) || 0;

  /**
   * Sets the global cursor style to provide visual feedback during resizing.
   * @param {string} cursor - The CSS cursor value.
   */
  const setGlobalCursor = (cursor) => {
    document.documentElement.style.cursor = cursor;
    document.body.style.cursor = cursor;
  };

  /**
   * Applies the new flex-basis to the panels being resized.
   */
  const applyResize = (current, start, prevSize, nextSize, prevPanel, nextPanel, prevMin, nextMin) => {
    const delta = current - start;
    const newPrevSize = prevSize + delta;
    const newNextSize = nextSize - delta;

    if (newPrevSize >= prevMin && newNextSize >= nextMin) {
      prevPanel.style.flexBasis = `${newPrevSize}px`;
      nextPanel.style.flexBasis = `${newNextSize}px`;
    }
  };

  document.querySelectorAll('.resizable-root:not(.resizable-initialized)').forEach(resizableElement => {
    if (resizableElement.closest('.resizable-panel-content')) return;

    const handles = Array.from(resizableElement.querySelectorAll(':scope > .resizable-handle'));

    handles.forEach((handle) => {
      let dragState = null;

      /**
       * Detects if the cursor is over a nested vertical handle to enable corner resizing.
       */
      const findNestedVerticalHandle = (e) => {
        const prevPanel = handle.previousElementSibling;
        const nextPanel = handle.nextElementSibling;
        if (!prevPanel || !nextPanel) return null;

        const verticalHandles = [
          ...prevPanel.querySelectorAll('.resizable-vertical > .resizable-handle'),
          ...nextPanel.querySelectorAll('.resizable-vertical > .resizable-handle')
        ];
        
        for (const vHandle of verticalHandles) {
          const vRect = vHandle.getBoundingClientRect();
          if (e.clientY >= vRect.top - 5 && e.clientY <= vRect.bottom + 5) {
            return vHandle;
          }
        }
        return null;
      };
      
      const onMouseMove = (e) => {
        if (!dragState) return;

        if (dragState.type === 'corner') {
          applyResize(e.clientX, dragState.startX, dragState.leftStartWidth, dragState.rightStartWidth, dragState.leftPanel, dragState.rightPanel, dragState.leftMinSize, dragState.rightMinSize);
          applyResize(e.clientY, dragState.startY, dragState.topStartHeight, dragState.bottomStartHeight, dragState.topPanel, dragState.bottomPanel, dragState.topMinSize, dragState.bottomMinSize);
        } else {
          const currentPos = dragState.isHorizontal ? e.clientX : e.clientY;
          applyResize(currentPos, dragState.startPos, dragState.prevSize, dragState.nextSize, dragState.prevPanel, dragState.nextPanel, dragState.prevMinSize, dragState.nextMinSize);
        }
      };

      const onMouseUp = () => {
        if (!dragState) return;
        setGlobalCursor('');
        document.body.style.userSelect = '';
        document.body.style.pointerEvents = '';
        
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        dragState = null;
      };

      const onMouseDown = (e) => {
        e.preventDefault();
        
        const isHorizontal = handle.parentElement.classList.contains('resizable-horizontal');

        if (isHorizontal) {
          const nestedVerticalHandle = findNestedVerticalHandle(e);
          if (nestedVerticalHandle) {
            const leftPanel = handle.previousElementSibling;
            const rightPanel = handle.nextElementSibling;
            const topPanel = nestedVerticalHandle.previousElementSibling;
            const bottomPanel = nestedVerticalHandle.nextElementSibling;
            
            dragState = {
              type: 'corner',
              leftPanel, rightPanel, topPanel, bottomPanel,
              startX: e.clientX, startY: e.clientY,
              leftStartWidth: leftPanel.offsetWidth, rightStartWidth: rightPanel.offsetWidth,
              topStartHeight: topPanel.offsetHeight, bottomStartHeight: bottomPanel.offsetHeight,
              leftMinSize: getMinSize(leftPanel), rightMinSize: getMinSize(rightPanel),
              topMinSize: getMinSize(topPanel), bottomMinSize: getMinSize(bottomPanel)
            };
            setGlobalCursor('all-scroll');
          }
        }
        
        if (!dragState) {
          const prevPanel = handle.previousElementSibling;
          const nextPanel = handle.nextElementSibling;
          dragState = {
            type: 'standard',
            isHorizontal,
            prevPanel, nextPanel,
            startPos: isHorizontal ? e.clientX : e.clientY,
            prevSize: isHorizontal ? prevPanel.offsetWidth : prevPanel.offsetHeight,
            nextSize: isHorizontal ? nextPanel.offsetWidth : nextPanel.offsetHeight,
            prevMinSize: getMinSize(prevPanel),
            nextMinSize: getMinSize(nextPanel)
          };
          setGlobalCursor(isHorizontal ? 'ew-resize' : 'ns-resize');
        }
        
        document.body.style.userSelect = 'none';
        document.body.style.pointerEvents = 'none';

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      };

      handle.addEventListener('mousedown', onMouseDown);

      handle.addEventListener('mousemove', (e) => {
        if (dragState) return;
        const isHorizontal = handle.parentElement.classList.contains('resizable-horizontal');
        handle.style.cursor = isHorizontal ? (findNestedVerticalHandle(e) ? 'all-scroll' : 'ew-resize') : 'ns-resize';
      });

      handle.addEventListener('mouseleave', () => {
        if (dragState) return;
        handle.style.cursor = '';
      });
    });

    resizableElement.classList.add('resizable-initialized');
  });
}

document.addEventListener('DOMContentLoaded', resizable);
