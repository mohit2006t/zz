/**
 * @module useFocusTrap
 * @description A low-level, high-performance engine for trapping focus within a
 * container. It handles dynamic content, pausing/resuming, and is the core
 * technology behind accessible overlay components.
 */
const FOCUSABLE_SELECTORS = [
  'a[href]', 'area[href]', 'input:not([disabled])', 'select:not([disabled])',
  'textarea:not([disabled])', 'button:not([disabled])', 'iframe', '[tabindex]',
  '[contenteditable]',
].filter(Boolean).join(',');

export const useFocusTrap = (container, options = {}) => {
  if (!container) throw new Error('useFocusTrap requires a container element.');

  const config = { returnFocus: true, ...options };
  let isActive = false;
  let isPaused = false;
  let previouslyFocusedElement = null;
  let lastFocusedElementInTrap = null;

  const getFocusableElements = () => {
    return Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS))
      .filter(el => el.offsetParent !== null && !el.hasAttribute('disabled') && el.getAttribute('tabindex') !== '-1');
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Tab' || !isActive || isPaused) return;

    const focusable = getFocusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const activeEl = document.activeElement;

    if (event.shiftKey && activeEl === first) {
      last.focus();
      event.preventDefault();
    } else if (!event.shiftKey && activeEl === last) {
      first.focus();
      event.preventDefault();
    } else if (focusable.includes(activeEl)) {
      lastFocusedElementInTrap = activeEl;
    }
  };

  const activate = (activateOptions = {}) => {
    if (isActive) return;
    isActive = true;
    isPaused = false;
    previouslyFocusedElement = document.activeElement;

    document.addEventListener('keydown', handleKeyDown, true);

    const { initialFocus } = activateOptions;
    if (initialFocus === false) return; // Explicitly do not focus anything

    const target = typeof initialFocus === 'string'
      ? container.querySelector(initialFocus)
      : initialFocus instanceof HTMLElement
      ? initialFocus
      : getFocusableElements()[0];

    requestAnimationFrame(() => target?.focus());
  };

  const deactivate = () => {
    if (!isActive) return;
    document.removeEventListener('keydown', handleKeyDown, true);

    if (config.returnFocus && previouslyFocusedElement instanceof HTMLElement) {
      previouslyFocusedElement.focus();
    }

    isActive = false;
    isPaused = false;
    previouslyFocusedElement = null;
    lastFocusedElementInTrap = null;
  };

  const pause = () => {
    if (isActive && !isPaused) isPaused = true;
  };

  const resume = () => {
    if (isActive && isPaused) {
      isPaused = false;
      requestAnimationFrame(() => lastFocusedElementInTrap?.focus());
    }
  };

  return { activate, deactivate, pause, resume, destroy: deactivate };
};

export default useFocusTrap;