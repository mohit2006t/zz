/**
 * @file tooltip.js
 * @description Manages interactive tooltips with hover-intent and auto-positioning.
 */
function tooltip() {
  const showDelay = 100;
  const hideDelay = 100;

  const autoPositionTooltip = (trigger, content) => {
    const preferredPosition = trigger.parentElement.querySelector('.tooltip-content').dataset.position || 'top';
    const triggerRect = trigger.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const margin = 8; // 0.5rem

    let bestPosition = preferredPosition;

    const positions = {
      top: () => triggerRect.top - contentRect.height - margin > 0,
      bottom: () => triggerRect.bottom + contentRect.height + margin < viewport.height,
      left: () => triggerRect.left - contentRect.width - margin > 0,
      right: () => triggerRect.right + contentRect.width + margin < viewport.width,
    };

    // Check if the preferred position is viable
    if (!positions[preferredPosition]()) {
      const opposites = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
      // Try the opposite position
      if (positions[opposites[preferredPosition]]()) {
        bestPosition = opposites[preferredPosition];
      } else {
        // Find any available position as a fallback
        const fallbackOrder = ['bottom', 'top', 'right', 'left'];
        bestPosition = fallbackOrder.find(pos => positions[pos]()) || 'bottom';
      }
    }
    
    content.dataset.position = bestPosition;
  };

  document.querySelectorAll('.tooltip').forEach((tooltipWrapper, index) => {
    const trigger = tooltipWrapper.querySelector('.tooltip-trigger');
    const content = tooltipWrapper.querySelector('.tooltip-content');
    const uniqueId = `tooltip-${index}`;

    if (!trigger || !content) return;

    content.setAttribute('id', uniqueId);
    content.setAttribute('role', 'tooltip');
    trigger.setAttribute('aria-describedby', uniqueId);

    let showTimeoutId;
    let hideTimeoutId;

    const show = () => {
      clearTimeout(hideTimeoutId);
      showTimeoutId = setTimeout(() => {
        autoPositionTooltip(trigger, content);
        content.classList.add('is-active');
      }, showDelay);
    };

    const hide = () => {
      clearTimeout(showTimeoutId);
      hideTimeoutId = setTimeout(() => {
        content.classList.remove('is-active');
      }, hideDelay);
    };

    trigger.addEventListener('mouseenter', show);
    trigger.addEventListener('focus', show);
    trigger.addEventListener('mouseleave', hide);
    trigger.addEventListener('blur', hide);

    content.addEventListener('mouseenter', () => clearTimeout(hideTimeoutId));
    content.addEventListener('mouseleave', hide);
  });
}

document.addEventListener('DOMContentLoaded', tooltip);
