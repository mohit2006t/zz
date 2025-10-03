/**
 * @file popover.js
 * @description Controls the behavior of dynamically positioned popover components.
 */
function popover() {
  /**
   * Toggles body scroll lock based on whether any popover is open.
   */
  const updateScrollLock = () => {
    const isOpen = !!document.querySelector('.popover-content[data-state="open"]');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  /**
   * Determines the desired side and alignment from the content element's classes.
   * @param {HTMLElement} content - The popover content element.
   * @returns {{side: 'top'|'bottom'|'left'|'right', align: 'start'|'center'|'end'}}
   */
  const getPositioning = (content) => {
    const classList = content.classList;
    const side = classList.contains('side-top') ? 'top'
               : classList.contains('side-right') ? 'right'
               : classList.contains('side-left') ? 'left' : 'bottom';
    const align = classList.contains('align-center') ? 'center'
                : classList.contains('align-end') ? 'end' : 'start';
    return { side, align };
  };

  /**
   * Calculates and applies the optimal position for the popover content.
   * @param {HTMLElement} trigger - The element that triggers the popover.
   * @param {HTMLElement} content - The popover content element.
   */
  const positionContent = (trigger, content) => {
    const rect = trigger.getBoundingClientRect();
    const { innerHeight: vh, innerWidth: vw } = window;
    const margin = 8;
    const offset = parseInt(getComputedStyle(content).getPropertyValue('--offset'), 10) || 0;
    let { side, align } = getPositioning(content);
    let top, left;

    // A temporary clone is used to get the dimensions without causing a reflow
    const tempContent = content.cloneNode(true);
    tempContent.style.opacity = '0';
    tempContent.style.pointerEvents = 'none';
    document.body.appendChild(tempContent);
    const contentRect = tempContent.getBoundingClientRect();
    document.body.removeChild(tempContent);

    // Auto-flip if there is not enough space
    if (side === 'bottom' && rect.bottom + contentRect.height + margin > vh) side = 'top';
    else if (side === 'top' && rect.top - contentRect.height - margin < 0) side = 'bottom';
    else if (side === 'right' && rect.right + contentRect.width + margin > vw) side = 'left';
    else if (side === 'left' && rect.left - contentRect.width - margin < 0) side = 'right';

    if (side === 'left' || side === 'right') {
      top = align === 'start' ? rect.top : align === 'end' ? rect.bottom - contentRect.height : rect.top + rect.height / 2 - contentRect.height / 2;
      left = side === 'right' ? rect.right + offset : rect.left - contentRect.width - offset;
    } else {
      left = align === 'start' ? rect.left : align === 'end' ? rect.right - contentRect.width : rect.left + rect.width / 2 - contentRect.width / 2;
      top = side === 'bottom' ? rect.bottom + offset : rect.top - contentRect.height - offset;
    }
    
    Object.assign(content.style, {
      top: `${Math.max(margin, Math.min(top, vh - contentRect.height - margin))}px`,
      left: `${Math.max(margin, Math.min(left, vw - contentRect.width - margin))}px`,
    });
  };

  document.body.addEventListener('click', (e) => {
    const target = e.target;
    const trigger = target.closest('.popover-trigger');
    const activePopoverContent = document.querySelector('.popover-content[data-state="open"]');

    if (trigger) {
      const content = trigger.nextElementSibling;
      const isExpanded = content.getAttribute('data-state') === 'open';

      if (activePopoverContent && activePopoverContent !== content) {
        activePopoverContent.setAttribute('data-state', 'closed');
      }

      content.setAttribute('data-state', isExpanded ? 'closed' : 'open');
      if (!isExpanded) {
        positionContent(trigger, content);
      }
      updateScrollLock();
    } else if (activePopoverContent && !activePopoverContent.contains(target)) {
      activePopoverContent.setAttribute('data-state', 'closed');
      updateScrollLock();
    }
  });

  const repositionActivePopovers = () => {
    document.querySelectorAll('.popover-content[data-state="open"]').forEach(content => {
      const trigger = content.previousElementSibling;
      if (trigger?.classList.contains('popover-trigger')) {
        positionContent(trigger, content);
      }
    });
  };

  window.addEventListener('resize', repositionActivePopovers);
  window.addEventListener('scroll', repositionActivePopovers, true);
}

document.addEventListener('DOMContentLoaded', popover);
