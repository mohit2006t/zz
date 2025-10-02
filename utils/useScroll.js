/**
 * @module useScroll
 * @description A comprehensive module providing powerful, un-opinionated engines for
 * both tracking scroll behavior and locking scroll on any element.
 *
 * @example
 * // 1. Using the Tracker Engine
 * const scrollTracker = useScroll.tracker({
 *   target: document.getElementById('my-scroll-container'),
 *   onScroll: ({ y, directionY, isScrolling }) => {
 *     // This callback is throttled for performance
 *     header.classList.toggle('is-hidden', y > 100 && directionY === 'down');
 *     console.log('Is user actively scrolling?', isScrolling);
 *   }
 * });
 * scrollTracker.activate();
 *
 * // 2. Using the Lock Engine
 * const scrollLock = useScroll.lock({ target: document.body });
 *
 * myModal.on('open', () => scrollLock.lock());
 * myModal.on('close', () => scrollLock.unlock());
 */

// ============================================================================
// SCROLL LOCK ENGINE
// ============================================================================
const useScrollLock = (options = {}) => {
  const config = {
    target: document.documentElement, // Usually body or documentElement
    reserveScrollBarGap: true,
    ...options,
  };

  let isLocked = false;
  let originalStyles = {};
  let scrollbarWidth = 0;

  const getScrollbarWidth = () => {
    return window.innerWidth - config.target.clientWidth;
  };

  const lock = () => {
    if (isLocked) return;

    originalStyles.overflow = config.target.style.overflow;
    originalStyles.paddingRight = config.target.style.paddingRight;
    scrollbarWidth = getScrollbarWidth();

    if (config.reserveScrollBarGap && scrollbarWidth > 0) {
      config.target.style.paddingRight = `${scrollbarWidth}px`;
    }
    config.target.style.overflow = 'hidden';
    isLocked = true;
  };

  const unlock = () => {
    if (!isLocked) return;
    config.target.style.overflow = originalStyles.overflow;
    config.target.style.paddingRight = originalStyles.paddingRight;
    isLocked = false;
  };

  return {
    lock,
    unlock,
    destroy: unlock,
    get isLocked() { return isLocked; },
  };
};

// ============================================================================
// SCROLL TRACKER ENGINE
// ============================================================================
const useScrollTracker = (options = {}) => {
  const config = {
    target: window,
    throttleDelay: 16, // ~60fps
    scrollEndDelay: 150,
    onScroll: () => {},
    onScrollEnd: () => {},
    ...options,
  };

  let isActive = false;
  let scrollEndTimeout = null;
  const state = {
    x: 0, y: 0,
    lastX: 0, lastY: 0,
    directionX: null, directionY: null,
    isScrolling: false,
  };

  const getScrollPosition = () => {
    if (config.target === window) {
      return { y: window.scrollY, x: window.scrollX };
    }
    return { y: config.target.scrollTop, x: config.target.scrollLeft };
  };

  const handleScroll = () => {
    const { x, y } = getScrollPosition();
    state.x = x;
    state.y = y;
    state.directionX = x > state.lastX ? 'right' : x < state.lastX ? 'left' : null;
    state.directionY = y > state.lastY ? 'down' : y < state.lastY ? 'up' : null;

    if (!state.isScrolling) {
      state.isScrolling = true;
    }

    config.onScroll({ ...state });

    state.lastX = x;
    state.lastY = y;

    clearTimeout(scrollEndTimeout);
    scrollEndTimeout = setTimeout(() => {
      state.isScrolling = false;
      config.onScrollEnd({ ...state });
    }, config.scrollEndDelay);
  };

  // Simple throttle implementation
  let lastCall = 0;
  const throttledScrollHandler = () => {
    const now = Date.now();
    if (now - lastCall >= config.throttleDelay) {
      lastCall = now;
      handleScroll();
    }
  };

  const scrollTo = (posOptions) => {
    config.target.scrollTo({ behavior: 'smooth', ...posOptions });
  };
  
  const scrollToElement = (element, scrollOptions = {}) => {
    if (!element) return;
    const isWindow = config.target === window;
    const containerRect = isWindow ? null : config.target.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    const offsetTop = isWindow ? elementRect.top + window.scrollY : elementRect.top - containerRect.top + config.target.scrollTop;
    
    scrollTo({ top: offsetTop + (scrollOptions.offset || 0), ...scrollOptions });
  };

  const activate = () => {
    if (isActive) return;
    const { x, y } = getScrollPosition();
    state.x = state.lastX = x;
    state.y = state.lastY = y;
    config.target.addEventListener('scroll', throttledScrollHandler, { passive: true });
    isActive = true;
  };

  const deactivate = () => {
    if (!isActive) return;
    config.target.removeEventListener('scroll', throttledScrollHandler);
    clearTimeout(scrollEndTimeout);
    isActive = false;
  };

  return {
    activate,
    deactivate,
    destroy: deactivate,
    scrollTo,
    scrollToElement,
    get state() { return { ...state }; },
  };
};

// ============================================================================
// MAIN EXPORT
// ============================================================================
export const useScroll = {
  lock: useScrollLock,
  tracker: useScrollTracker,
};

export default useScroll;