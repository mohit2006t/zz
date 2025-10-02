/**
 * @module Utility Engine
 * @description This file contains the entire utility engine, consolidated into a single module.
 * It includes all core utilities for state management, interactions, positioning, and more.
 */

// ============================================================================
// CORE STATE MANAGEMENT
// ============================================================================

/**
 * @module useState
 * @description A generic, observable state container. This is the foundational
 * engine for creating any piece of reactive state. It holds a value and notifies
 * subscribers when that value is updated, supporting functional updates and
 * providing a robust subscription model for memory-safe reactivity.
 */
export const useState = (initialValue) => {
    let value = initialValue;
    const subscribers = new Set();

    const set = (newValue) => {
      const oldValue = value;

      value = (typeof newValue === 'function')
        ? newValue(oldValue)
        : newValue;

      if (oldValue !== value) {
        subscribers.forEach(callback => callback(value));
      }
    };

    const subscribe = (callback) => {
      subscribers.add(callback);
      callback(value);
      return () => subscribers.delete(callback);
    };

    return {
      set,
      get: () => value,
      subscribe,
      destroy: () => subscribers.clear(),
    };
};

/**
 * @module useId
 * @description Generates a unique ID string, prioritizing crypto.randomUUID for
 * randomness and providing a fallback for older browsers. Essential for ARIA attributes.
 */
export const useId = (length = 8) => {
  const id =
    crypto?.randomUUID?.() ??
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) =>
      ((c === 'x' ? Math.random() * 16 : (Math.random() * 16) & 0x3) | 0x8).toString(16)
    );
  return id.replace(/-/g, '').substring(0, length);
};

// ============================================================================
// FOCUS MANAGEMENT
// ============================================================================

const FOCUSABLE_SELECTORS = [
  'a[href]', 'area[href]', 'input:not([disabled])', 'select:not([disabled])',
  'textarea:not([disabled])', 'button:not([disabled])', 'iframe', '[tabindex]',
  '[contenteditable]',
].filter(Boolean).join(',');

/**
 * @module useFocusTrap
 * @description A low-level, high-performance engine for trapping focus within a
 * container. It handles dynamic content, pausing/resuming, and is the core
 * technology behind accessible overlay components.
 */
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
    if (initialFocus === false) return;

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

/**
 * @module useFocus
 * @description A high-level engine for managing focus within a component. It
 * simplifies the use of the powerful `useFocusTrap` engine for common scenarios
 * like modals, dialogs, and menus.
 */
export const useFocus = (container, options = {}) => {
  if (!container) {
    throw new Error('useFocus requires a container element.');
  }

  const config = {
    initialFocus: null,
    returnFocus: true,
    onActivate: () => {},
    onDeactivate: () => {},
    ...options
  };
  let isActive = false;

  const focusTrap = useFocusTrap(container, {
    returnFocus: config.returnFocus,
  });

  const activate = (overrideOptions = {}) => {
    if (isActive) return;
    isActive = true;
    config.onActivate();

    focusTrap.activate({
      initialFocus: overrideOptions.initialFocus ?? config.initialFocus,
    });
  };

  const deactivate = () => {
    if (!isActive) return;
    isActive = false;
    config.onDeactivate();
    focusTrap.deactivate();
  };

  const update = (newOptions) => {
    Object.assign(config, newOptions);
  };

  return {
    activate,
    deactivate,
    update,
    pause: focusTrap.pause,
    resume: focusTrap.resume,
    destroy: deactivate,
    get isActive() {
      return isActive;
    },
  };
};

// ============================================================================
// ANIMATION
// ============================================================================

const motionDefaultConfig = {
  propertyName: null,
  timeoutBuffer: 50,
};

/**
 * A simple, promise-based function that waits for a CSS transition or animation to end.
 */
export const awaitMotion = (element, options = {}) => {
  return new Promise(resolve => {
    const { propertyName, timeoutBuffer } = { ...motionDefaultConfig, ...options };

    const styles = getComputedStyle(element);
    const transitionDuration = parseFloat(styles.transitionDuration) * 1000;
    const animationDuration = parseFloat(styles.animationDuration) * 1000;
    const maxDuration = Math.max(transitionDuration, animationDuration);

    if (maxDuration === 0) {
      resolve();
      return;
    }

    let timeoutId;
    const eventNames = ['transitionend', 'animationend'];

    const handleEnd = (event) => {
      if (event.target !== element) return;
      if (propertyName && event.propertyName !== propertyName) return;
      cleanup();
      resolve();
    };

    const cleanup = () => {
      clearTimeout(timeoutId);
      eventNames.forEach(name => element.removeEventListener(name, handleEnd));
    };

    eventNames.forEach(name => element.addEventListener(name, handleEnd));

    timeoutId = setTimeout(() => {
      cleanup();
      resolve();
    }, maxDuration + timeoutBuffer);
  });
};

/**
 * @module useMotion
 * @description Creates a stateful motion controller for an element.
 */
export const useMotion = (element, options = {}) => {
  if (!element) {
    throw new Error('useMotion requires an element to manage.');
  }

  const config = {
    onStart: () => {},
    onEnd: () => {},
    onCancel: () => {},
    ...options,
  };

  let isAnimating = false;
  let animationPromise = null;
  let resolveAnimation = null;

  const run = (triggerFn) => {
    if (isAnimating) {
      cancel();
    }

    isAnimating = true;
    config.onStart(element);

    animationPromise = new Promise(resolve => {
      resolveAnimation = resolve;

      requestAnimationFrame(() => {
        awaitMotion(element, config).then(() => {
          if (!isAnimating) return;
          isAnimating = false;
          config.onEnd(element);
          if (resolveAnimation) resolveAnimation();
        });

        triggerFn(element);
      });
    });

    return animationPromise;
  };

  const cancel = () => {
    if (!isAnimating) return;
    isAnimating = false;
    config.onCancel(element);
    if (resolveAnimation) {
      resolveAnimation();
    }
  };

  return {
    run,
    cancel,
    destroy: cancel,
    get isAnimating() {
      return isAnimating;
    },
  };
};

// ============================================================================
// POSITIONING
// ============================================================================

const positionDefaultConfig = {
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

/**
 * @module usePosition
 * @description A feature-rich engine for calculating the optimal position of a
 * floating element relative to a trigger.
 */
export const usePosition = (globalConfig = {}) => {
  const engineConfig = { ...positionDefaultConfig, ...globalConfig };

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

    const size = {};
    if (config.size) {
        const availableHeight = boundaryRect.bottom - y - config.shiftPadding;
        const availableWidth = boundaryRect.right - x - config.shiftPadding;
        size.maxHeight = `${Math.floor(availableHeight)}px`;
        size.maxWidth = `${Math.floor(availableWidth)}px`;
    }

    const arrow = {};
    if (config.arrow && arrowEl) {
        const staticSide = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[side];
        const clamp = (val, min, max) => Math.max(min, Math.min(val, max));

        arrow.x = clamp(triggerRect.left + triggerRect.width / 2 - x, config.arrowPadding, floatingRect.width - arrowRect.width - config.arrowPadding);
        arrow.y = clamp(triggerRect.top + triggerRect.height / 2 - y, config.arrowPadding, floatingRect.height - arrowRect.height - config.arrowPadding);

        if (staticSide === 'bottom') arrow.y = floatingRect.height - arrowRect.height / 2;
        if (staticSide === 'top') arrow.y = -arrowRect.height / 2;
        if (staticSide === 'right') arrow.x = floatingRect.width - arrowRect.width / 2;
        if (staticSide === 'left') arrow.x = -arrowRect.width / 2;
    }

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

  const destroy = () => {};

  return { compute, destroy };
};

// ============================================================================
// INTERACTIONS & DISMISSAL
// ============================================================================

/**
 * @module useDismiss
 * @description A feature-rich engine to detect dismissal events (outside click, Escape key).
 */
export const useDismiss = (element, options = {}) => {
  if (!element) {
    throw new Error('useDismiss requires an element to manage.');
  }

  const config = {
    exclude: [],
    closeOnEscape: true,
    closeOnPointerDownOutside: true,
    onDismiss: () => {},
    ...options
  };
  let isActive = false;
  let activeTrigger = null;

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      config.onDismiss({ event, trigger: activeTrigger });
    }
  };

  const handlePointerDown = (event) => {
    const target = event.target;
    if (element.contains(target)) return;

    const excludedElements = [config.exclude].flat();
    if (excludedElements.some(el => el?.contains(target))) {
      return;
    }

    config.onDismiss({ event, trigger: activeTrigger });
  };

  const activate = ({ triggerElement } = {}) => {
    if (isActive) return;
    isActive = true;
    activeTrigger = triggerElement || null;

    setTimeout(() => {
      if (!isActive) return;
      if (config.closeOnPointerDownOutside) {
        document.addEventListener('pointerdown', handlePointerDown, true);
      }
      if (config.closeOnEscape) {
        document.addEventListener('keydown', handleKeyDown, true);
      }
    }, 0);
  };

  const deactivate = () => {
    if (!isActive) return;
    isActive = false;
    activeTrigger = null;
    document.removeEventListener('pointerdown', handlePointerDown, true);
    document.removeEventListener('keydown', handleKeyDown, true);
  };

  const update = (newOptions) => {
    Object.assign(config, newOptions);
  };

  return {
    activate,
    deactivate,
    update,
    destroy: deactivate,
    get isActive() {
      return isActive;
    },
  };
};

/**
 * @module useInteractions
 * @description A feature-rich engine for managing a comprehensive set of UI
 * interactions, including hover, focus, press, and long press.
 */
export const useInteractions = (element, options = {}) => {
  if (!element) {
    throw new Error('useInteractions requires an element to manage.');
  }

  const config = {
    isDisabled: false,
    longPressDelay: 0,
    onChange: () => {},
    onLongPress: () => {},
    ...options
  };
  let isActive = false;
  let longPressTimeout = null;

  const state = useState({
    isHovered: false,
    isFocused: false,
    isPressed: false,
    isLongPressed: false,
  });

  const unsubscribe = state.subscribe(config.onChange);

  const handlePointerEnter = () => state.set(s => ({ ...s, isHovered: true }));
  const handlePointerLeave = () => {
    clearTimeout(longPressTimeout);
    state.set(s => ({ ...s, isHovered: false, isPressed: false, isLongPressed: false }));
  };
  const handleFocus = () => state.set(s => ({ ...s, isFocused: true }));
  const handleBlur = () => state.set(s => ({ ...s, isFocused: false, isPressed: false }));

  const handlePointerDown = (event) => {
    if (event.button !== 0) return;
    state.set(s => ({ ...s, isPressed: true }));

    if (config.longPressDelay > 0) {
      longPressTimeout = setTimeout(() => {
        state.set(s => ({ ...s, isLongPressed: true }));
        config.onLongPress(event);
      }, config.longPressDelay);
    }
  };

  const handlePointerUp = () => {
    clearTimeout(longPressTimeout);
    state.set(s => ({ ...s, isPressed: false, isLongPressed: false }));
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      if (event.repeat) return;
      event.preventDefault();
      state.set(s => ({ ...s, isPressed: true }));
    }
  };

  const handleKeyUp = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      state.set(s => ({ ...s, isPressed: false }));
    }
  };

  const events = {
    pointerenter: handlePointerEnter,
    pointerleave: handlePointerLeave,
    pointerdown: handlePointerDown,
    pointerup: handlePointerUp,
    focus: handleFocus,
    blur: handleBlur,
    keydown: handleKeyDown,
    keyup: handleKeyUp,
  };

  const activate = () => {
    if (isActive || config.isDisabled) return;
    isActive = true;
    for (const [eventName, handler] of Object.entries(events)) {
      element.addEventListener(eventName, handler);
    }
  };

  const deactivate = () => {
    if (!isActive) return;
    isActive = false;
    clearTimeout(longPressTimeout);
    for (const [eventName, handler] of Object.entries(events)) {
      element.removeEventListener(eventName, handler);
    }
    state.set({ isHovered: false, isFocused: false, isPressed: false, isLongPressed: false });
  };

  const update = (newOptions) => {
    const wasDisabled = config.isDisabled;
    Object.assign(config, newOptions);

    if (config.isDisabled && !wasDisabled) {
      deactivate();
    } else if (!config.isDisabled && wasDisabled) {
      activate();
    }
  };

  const destroy = () => {
    deactivate();
    unsubscribe();
  };

  return {
    activate,
    deactivate,
    update,
    destroy,
    get state() {
      return state.get();
    },
  };
};

// ============================================================================
// SCROLL MANAGEMENT
// ============================================================================

const useScrollLock = (options = {}) => {
  const config = {
    target: document.documentElement,
    reserveScrollBarGap: true,
    ...options,
  };

  let isLocked = false;
  let originalStyles = {};
  let scrollbarWidth = 0;

  const getScrollbarWidth = () => window.innerWidth - config.target.clientWidth;

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

  return { lock, unlock, destroy: unlock, get isLocked() { return isLocked; } };
};

const useScrollTracker = (options = {}) => {
  const config = {
    target: window,
    throttleDelay: 16,
    scrollEndDelay: 150,
    onScroll: () => {},
    onScrollEnd: () => {},
    ...options,
  };

  let isActive = false;
  let scrollEndTimeout = null;
  const state = { x: 0, y: 0, lastX: 0, lastY: 0, directionX: null, directionY: null, isScrolling: false };

  const getScrollPosition = () => {
    if (config.target === window) return { y: window.scrollY, x: window.scrollX };
    return { y: config.target.scrollTop, x: config.target.scrollLeft };
  };

  const handleScroll = () => {
    const { x, y } = getScrollPosition();
    state.x = x;
    state.y = y;
    state.directionX = x > state.lastX ? 'right' : x < state.lastX ? 'left' : null;
    state.directionY = y > state.lastY ? 'down' : y < state.lastY ? 'up' : null;
    if (!state.isScrolling) state.isScrolling = true;
    config.onScroll({ ...state });
    state.lastX = x;
    state.lastY = y;
    clearTimeout(scrollEndTimeout);
    scrollEndTimeout = setTimeout(() => {
      state.isScrolling = false;
      config.onScrollEnd({ ...state });
    }, config.scrollEndDelay);
  };

  let lastCall = 0;
  const throttledScrollHandler = () => {
    const now = Date.now();
    if (now - lastCall >= config.throttleDelay) {
      lastCall = now;
      handleScroll();
    }
  };

  const scrollTo = (posOptions) => config.target.scrollTo({ behavior: 'smooth', ...posOptions });

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

  return { activate, deactivate, destroy: deactivate, scrollTo, scrollToElement, get state() { return { ...state }; } };
};

/**
 * @module useScroll
 * @description A comprehensive module providing powerful engines for both
 * tracking scroll behavior and locking scroll on any element.
 */
export const useScroll = {
  lock: useScrollLock,
  tracker: useScrollTracker,
};

// ============================================================================
// STATE-BASED HOOKS (DEPEND ON useState)
// ============================================================================

/**
 * @module useToggle
 * @description A specialized state engine for managing boolean values, built upon `useState`.
 */
export const useToggle = (initialValue = false, options = {}) => {
  const state = useState(Boolean(initialValue));
  if (options.onChange) {
    state.subscribe(options.onChange);
  }
  return {
    set: (value) => state.set(Boolean(value)),
    get: state.get,
    on: () => state.set(true),
    off: () => state.set(false),
    toggle: () => state.set(v => !v),
    subscribe: state.subscribe,
    destroy: state.destroy,
  };
};

/**
 * @module useTheme
 * @description A PURE, headless, global state management engine for themes.
 */
const createThemeManager = (options = {}) => {
  const config = {
    themes: ['light', 'dark'],
    defaultTheme: 'system',
    storageKey: 'ui-theme',
    ...options
  };
  let mediaQuery;
  const state = useState({ theme: config.defaultTheme, resolvedTheme: 'light' });

  const syncState = (themePreference) => {
    let resolved = themePreference;
    if (themePreference === 'system' && mediaQuery) {
      resolved = mediaQuery.matches ? 'dark' : 'light';
    }
    state.set({ theme: themePreference, resolvedTheme: resolved });
  };

  const set = (newTheme) => {
    if (![...config.themes, 'system'].includes(newTheme)) return;
    try { localStorage.setItem(config.storageKey, newTheme); } catch (e) {}
    syncState(newTheme);
  };

  const toggle = () => set(state.get().resolvedTheme === 'dark' ? 'light' : 'dark');

  const initialize = () => {
    let initialTheme = config.defaultTheme;
    try {
      const storedTheme = localStorage.getItem(config.storageKey);
      if(storedTheme) initialTheme = storedTheme;
    } catch (e) {}
    if (window.matchMedia) {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => syncState(state.get().theme));
    }
    syncState(initialTheme);
  };

  initialize();
  return { set, toggle, subscribe: state.subscribe, get state() { return state.get(); } };
};
let managerInstance;
export const useTheme = (options) => {
  if (!managerInstance) managerInstance = createThemeManager(options);
  return managerInstance;
};

/**
 * @module useMachine
 * @description A finite state machine (FSM) engine for managing complex, explicit states.
 */
export const useMachine = (machineConfig) => {
  const { initial, states, context } = machineConfig;
  const state = useState({ value: initial, context: context || {} });

  const send = (event, payload = {}) => {
    const currentStateValue = state.get().value;
    const currentStateDefinition = states[currentStateValue];
    if (!currentStateDefinition?.on) return;
    const transition = currentStateDefinition.on[event];
    if (!transition) return;
    const targetStateValue = typeof transition === 'string' ? transition : transition.target;
    if (transition.cond && !transition.cond(state.get().context, payload)) return;
    let newContext = { ...state.get().context };
    if (transition.actions) {
      const actions = Array.isArray(transition.actions) ? transition.actions : [transition.actions];
      actions.forEach(actionName => {
        const actionFn = machineConfig.actions?.[actionName];
        if (actionFn) newContext = actionFn(newContext, payload) || newContext;
      });
    }
    state.set({ value: targetStateValue, context: newContext });
  };

  return { send, subscribe: state.subscribe, get state() { return state.get(); } };
};

/**
 * @module useAsync
 * @description A powerful engine for managing the state of asynchronous operations.
 */
export const useAsync = (initialStateOptions = {}) => {
  const initialState = { status: 'idle', data: null, error: null };
  const state = useState({ ...initialState, ...initialStateOptions });
  let counter = 0;

  const run = async (promiseFn) => {
    if (!promiseFn || typeof promiseFn !== 'function') {
      throw new Error('useAsync.run requires a function that returns a promise.');
    }
    counter++;
    const currentCounter = counter;
    state.set(s => ({ ...s, status: 'loading' }));
    try {
      const data = await promiseFn();
      if (currentCounter === counter) state.set({ status: 'success', data, error: null });
      return { data };
    } catch (error) {
      if (currentCounter === counter) state.set({ status: 'error', error, data: null });
      return { error };
    }
  };

  const setData = (newData) => state.set(s => ({ ...s, data: newData }));
  const setError = (newError) => state.set(s => ({ ...s, error: newError }));
  const reset = () => state.set(initialState);

  return { run, reset, setData, setError, subscribe: state.subscribe, get state() { return state.get(); } };
};

/**
 * @module usePagination
 * @description A headless engine for managing pagination state and logic.
 */
export const usePagination = (options = {}) => {
  const config = {
    initialPage: 1,
    pageSize: 10,
    totalCount: 0,
    siblings: 1,
    boundaries: 1,
    ...options
  };
  const state = useState({});
  const range = (start, end) => Array.from({ length: end - start + 1 }).map((_, i) => start + i);

  const syncState = (currentPage) => {
    const totalPages = Math.ceil(config.totalCount / config.pageSize);
    const clampedPage = Math.max(1, Math.min(currentPage, totalPages));
    const totalNumbers = config.siblings * 2 + 3 + config.boundaries * 2;
    let pages = [];
    if (totalNumbers >= totalPages) {
      pages = range(1, totalPages);
    } else {
      const startPages = range(1, config.boundaries);
      const endPages = range(totalPages - config.boundaries + 1, totalPages);
      const leftSiblingIndex = Math.max(clampedPage - config.siblings, config.boundaries + 1);
      const rightSiblingIndex = Math.min(clampedPage + config.siblings, totalPages - config.boundaries);
      const showLeftEllipsis = leftSiblingIndex > config.boundaries + 1;
      const showRightEllipsis = rightSiblingIndex < totalPages - config.boundaries;
      if (!showLeftEllipsis && showRightEllipsis) {
        const leftItemCount = config.siblings * 2 + config.boundaries + 2;
        pages = [...range(1, leftItemCount), '...', ...endPages];
      } else if (showLeftEllipsis && !showRightEllipsis) {
        const rightItemCount = config.siblings * 2 + config.boundaries + 2;
        pages = [...startPages, '...', ...range(totalPages - rightItemCount + 1, totalPages)];
      } else {
        pages = [...startPages, '...', ...range(leftSiblingIndex, rightSiblingIndex), '...', ...endPages];
      }
    }
    const startIndex = (clampedPage - 1) * config.pageSize;
    const endIndex = Math.min(startIndex + config.pageSize - 1, config.totalCount - 1);
    state.set({ pages, currentPage: clampedPage, totalPages, totalCount: config.totalCount, pageSize: config.pageSize, isFirstPage: clampedPage === 1, isLastPage: clampedPage === totalPages, startIndex, endIndex });
  };

  const setPage = (page) => syncState(page);
  const nextPage = () => syncState(state.get().currentPage + 1);
  const prevPage = () => syncState(state.get().currentPage - 1);
  const firstPage = () => syncState(1);
  const lastPage = () => syncState(state.get().totalPages);
  const update = (newConfig) => {
    Object.assign(config, newConfig);
    syncState(state.get().currentPage || config.initialPage);
  };

  syncState(config.initialPage);
  return { setPage, nextPage, prevPage, firstPage, lastPage, update, subscribe: state.subscribe, get state() { return state.get(); } };
};

// ============================================================================
// COMPOSITE UTILITY HOOKS
// ============================================================================

/**
 * @module useToast
 * @description A headless, global state management engine for toast notifications.
 */
const createToastManager = () => {
  let state = { toasts: [], config: { timeout: 5000, pauseOnHover: true, exitDuration: 300, position: 'top-end', offset: '1rem' } };
  const subscribers = new Set();
  const notify = () => subscribers.forEach(cb => cb(state));

  const add = (message, options = {}) => {
    return new Promise(resolve => {
      const id = options.id || useId();
      const newToast = { id, message, status: 'entering', config: { ...state.config, ...options }, remaining: options.timeout ?? state.config.timeout, startTime: Date.now(), timer: null, onDismiss: resolve };
      state = { ...state, toasts: [...state.toasts, newToast] };
      notify();
      requestAnimationFrame(() => {
        const toast = state.toasts.find(t => t.id === id);
        if (toast) {
          toast.status = 'visible';
          notify();
          if (toast.config.timeout > 0) toast.timer = setTimeout(() => remove(id), toast.remaining);
        }
      });
      return id;
    });
  };

  const remove = (id) => {
    const toast = state.toasts.find(t => t.id === id);
    if (!toast || toast.status === 'exiting') return;
    clearTimeout(toast.timer);
    toast.status = 'exiting';
    notify();
    setTimeout(() => {
      state = { ...state, toasts: state.toasts.filter(t => t.id !== id) };
      notify();
      toast.onDismiss?.({ dismissedBy: 'timeout' });
    }, toast.config.exitDuration);
  };

  const updateConfig = (newConfig) => {
    state = { ...state, config: { ...state.config, ...newConfig } };
    notify();
  };

  const pause = (id) => {
    const toast = state.toasts.find(t => t.id === id);
    if (!toast || !toast.timer) return;
    clearTimeout(toast.timer);
    toast.remaining -= (Date.now() - toast.startTime);
  };

  const resume = (id) => {
    const toast = state.toasts.find(t => t.id === id);
    if (!toast || toast.timer === null || toast.remaining <= 0) return;
    toast.startTime = Date.now();
    toast.timer = setTimeout(() => remove(id), toast.remaining);
  };

  const subscribe = (callback) => {
    subscribers.add(callback);
    callback(state);
    return () => subscribers.delete(callback);
  };

  return { add, remove, updateConfig, pause, resume, subscribe, clearAll: () => state.toasts.forEach(t => remove(t.id)), get state() { return { ...state, toasts: [...state.toasts] }; } };
};
let toastManagerInstance;
export const useToast = () => {
  if (!toastManagerInstance) toastManagerInstance = createToastManager();
  return toastManagerInstance;
};

/**
 * @module useCollapsible
 * @description A robust utility for managing collapsible content with smooth animations.
 */
export const useCollapsible = (trigger, content, options = {}) => {
  if (!trigger || !content) throw new Error('Collapsible requires a trigger and a content element.');
  const config = { isExpanded: false, transitionDuration: 250, expandedTriggerClass: 'is-expanded', collapsedTriggerClass: 'is-collapsed', onShow: () => {}, onShown: () => {}, onHide: () => {}, onHidden: () => {}, ...options };
  let isExpanded = config.isExpanded;
  let isTransitioning = false;
  let isDisabled = false;

  const show = async () => {
    if (isExpanded || isTransitioning || isDisabled) return;
    isTransitioning = true;
    config.onShow({ trigger, content });
    content.hidden = false;
    trigger.classList.remove(config.collapsedTriggerClass);
    trigger.classList.add(config.expandedTriggerClass);
    trigger.setAttribute('aria-expanded', 'true');
    content.style.height = `${content.scrollHeight}px`;
    await awaitMotion(content, { propertyName: 'height' });
    content.style.height = 'auto';
    isExpanded = true;
    isTransitioning = false;
    config.onShown({ trigger, content });
  };

  const hide = async () => {
    if (!isExpanded || isTransitioning || isDisabled) return;
    isTransitioning = true;
    config.onHide({ trigger, content });
    content.style.height = `${content.scrollHeight}px`;
    void content.offsetHeight;
    content.style.height = '0';
    trigger.classList.remove(config.expandedTriggerClass);
    trigger.classList.add(config.collapsedTriggerClass);
    trigger.setAttribute('aria-expanded', 'false');
    await awaitMotion(content, { propertyName: 'height' });
    content.hidden = true;
    isExpanded = false;
    isTransitioning = false;
    config.onHidden({ trigger, content });
  };

  const toggle = () => (isExpanded ? hide() : show());
  const handleTriggerClick = () => toggle();
  const enable = () => { isDisabled = false; trigger.removeAttribute('aria-disabled'); };
  const disable = () => { isDisabled = true; trigger.setAttribute('aria-disabled', 'true'); };
  const destroy = () => {
    trigger.removeEventListener('click', handleTriggerClick);
    trigger.removeAttribute('aria-expanded');
    trigger.removeAttribute('aria-controls');
    trigger.removeAttribute('aria-disabled');
    trigger.classList.remove(config.expandedTriggerClass, config.collapsedTriggerClass);
    content.removeAttribute('hidden');
    Object.assign(content.style, { height: '', overflow: '', transitionProperty: '', transitionDuration: '' });
  };

  const initialize = () => {
    content.id = content.id || useId('collapsible-content');
    trigger.setAttribute('aria-controls', content.id);
    Object.assign(content.style, { overflow: 'hidden', transitionProperty: 'height', transitionDuration: `${config.transitionDuration}ms` });
    if (isExpanded) {
      content.hidden = false;
      content.style.height = 'auto';
      trigger.setAttribute('aria-expanded', 'true');
      trigger.classList.add(config.expandedTriggerClass);
    } else {
      content.hidden = true;
      content.style.height = '0';
      trigger.setAttribute('aria-expanded', 'false');
      trigger.classList.add(config.collapsedTriggerClass);
    }
    trigger.addEventListener('click', handleTriggerClick);
  };

  initialize();
  return { show, hide, toggle, enable, disable, destroy, get isExpanded() { return isExpanded; }, get isDisabled() { return isDisabled; } };
};

/**
 * @module usePopper
 * @description A feature-rich engine to manage the lifecycle and positioning of floating elements.
 */
export const usePopper = (elements, options = {}) => {
  const { trigger, popper, arrow } = elements;
  if (!trigger || !popper) throw new Error('usePopper requires a trigger and a popper element.');

  const config = { placement: 'bottom', trigger: 'click', delay: 0, interactive: false, onUpdate: () => {}, onShow: () => {}, onShown: () => {}, onHide: () => {}, onHidden: () => {}, position: { offset: 4, flip: true, shift: true }, dismiss: {}, ...options };
  let state = 'closed';
  let showTimeout, hideTimeout;

  const positionEngine = usePosition(config.position);
  const dismissEngine = useDismiss(popper, { exclude: [trigger], ...config.dismiss, onDismiss: () => hide() });

  const getDelay = (type) => Array.isArray(config.delay) ? (type === 'show' ? config.delay[0] : config.delay[1]) : config.delay;

  const updatePosition = () => {
    const positionData = positionEngine.compute(trigger, popper, { arrowElement: arrow });
    const data = { state, styles: { popper: { left: `${positionData.x}px`, top: `${positionData.y}px` }, arrow: positionData.arrow ? { left: `${positionData.arrow.x}px`, top: `${positionData.arrow.y}px` } : {} }, attributes: { popper: { 'data-placement': positionData.placement }, trigger: { 'aria-expanded': String(state === 'open' || state === 'opening') } } };
    config.onUpdate(data);
  };

  const show = () => {
    if (state !== 'closed') return;
    clearTimeout(hideTimeout);
    showTimeout = setTimeout(async () => {
      state = 'opening';
      config.onShow();
      updatePosition();
      dismissEngine.activate({ triggerElement: trigger });
      window.addEventListener('resize', updatePosition);
      await awaitMotion(popper);
      state = 'open';
      config.onShown();
      config.onUpdate({ state });
    }, getDelay('show'));
  };

  const hide = () => {
    if (state !== 'open') return;
    clearTimeout(showTimeout);
    hideTimeout = setTimeout(async () => {
      state = 'closing';
      config.onHide();
      config.onUpdate({ state });
      dismissEngine.deactivate();
      window.removeEventListener('resize', updatePosition);
      await awaitMotion(popper);
      state = 'closed';
      config.onHidden();
      config.onUpdate({ state, styles: { popper: { left: '', top: '' } } });
    }, getDelay('hide'));
  };

  const interactionsEngine = useInteractions(trigger, {
      onChange: ({ isPressed, isHovered, isFocused }) => {
          if (config.trigger === 'click' && isPressed) show();
          if (config.trigger === 'hover' && isHovered) show();
          if (config.trigger === 'hover' && !isHovered) hide();
          if (config.trigger === 'focus' && isFocused) show();
          if (config.trigger === 'focus' && !isFocused) hide();
      }
  });

  if (config.trigger !== 'manual') {
      interactionsEngine.activate();
      if (config.interactive && config.trigger === 'hover') {
          popper.addEventListener('pointerenter', () => clearTimeout(hideTimeout));
          popper.addEventListener('pointerleave', hide);
      }
  }

  const destroy = () => {
    clearTimeout(showTimeout);
    clearTimeout(hideTimeout);
    interactionsEngine.destroy();
    dismissEngine.destroy();
    window.removeEventListener('resize', updatePosition);
  };

  return { show, hide, update: updatePosition, destroy, get state() { return state; } };
};

/**
 * @module useModal
 * @description An un-opinionated engine for orchestrating modal behavior.
 */
export const useModal = (elements, options = {}) => {
  const { container, dialog } = elements;
  if (!container || !dialog) throw new Error('useModal requires a container and a dialog element.');

  const config = { openingClass: 'is-opening', shownClass: 'is-shown', closingClass: 'is-closing', onShow: () => {}, onShown: () => {}, onHide: () => {}, onHidden: () => {}, focus: {}, dismiss: {}, scrollLock: {}, ...options };
  const state = useState('closed');

  const focusEngine = useFocus(dialog, config.focus);
  const scrollLockEngine = useScroll.lock(config.scrollLock);
  const dismissEngine = useDismiss(dialog, { ...config.dismiss, onDismiss: ({ trigger }) => hide({ triggerElement: trigger }) });

  const show = async ({ triggerElement } = {}) => {
    if (state.get() !== 'closed') return;
    state.set('opening');
    config.onShow();
    scrollLockEngine.lock();
    container.hidden = false;
    container.classList.add(config.openingClass);
    requestAnimationFrame(() => container.classList.add(config.shownClass));
    await awaitMotion(container);
    container.classList.remove(config.openingClass);
    state.set('open');
    focusEngine.activate({ initialFocus: triggerElement });
    dismissEngine.activate({ triggerElement });
    config.onShown();
  };

  const hide = async () => {
    if (state.get() !== 'open') return;
    state.set('closing');
    config.onHide();
    dismissEngine.deactivate();
    focusEngine.deactivate();
    container.classList.add(config.closingClass);
    container.classList.remove(config.shownClass);
    await awaitMotion(container);
    container.classList.remove(config.closingClass);
    container.hidden = true;
    scrollLockEngine.unlock();
    state.set('closed');
    config.onHidden();
  };

  const destroy = () => {
    container.hidden = true;
    focusEngine.destroy();
    scrollLockEngine.destroy();
    dismissEngine.destroy();
    state.destroy();
  };

  return { show, hide, destroy, get state() { return state.get(); }, get isVisible() { const current = state.get(); return current === 'open' || current === 'opening'; } };
};

// ============================================================================
// STANDALONE UTILITIES
// ============================================================================

/**
 * @module useClipboard
 * @description A robust utility for copying text to the clipboard.
 */
export const useClipboard = (options = {}) => {
  const config = { onSuccess: () => {}, onError: () => {}, ...options };

  const legacyCopy = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    Object.assign(textArea.style, { position: 'absolute', opacity: '0', left: '-9999px', top: '-9999px' });
    document.body.appendChild(textArea);
    try {
      textArea.select();
      if (!document.execCommand('copy')) throw new Error('Copy command failed.');
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const copy = async (source) => {
    const textToCopy = typeof source === 'string' ? source : source?.getAttribute('data-clipboard-text') ?? source?.value ?? source?.textContent;
    if (textToCopy === null || typeof textToCopy !== 'string') {
      const error = new Error('Invalid source for clipboard copy.');
      config.onError(error);
      return;
    }
    try {
      await (navigator.clipboard?.writeText(textToCopy) ?? legacyCopy(textToCopy));
      config.onSuccess(textToCopy);
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      config.onError(error);
    }
  };

  return { copy };
};

/**
 * @module useDnd
 * @description A collection of engines for managing drag-and-drop.
 */
const dndState = { isDragging: false, dragType: null, payload: null, sourceElement: null };

const useDraggable = (element, options = {}) => {
  if (!element) throw new Error('useDraggable requires an element.');
  const config = { handleSelector: null, draggingClass: 'is-dragging', dragType: 'application/json', payload: {}, dragDelay: 0, onDragStart: () => {}, onDragMove: () => {}, onDragEnd: () => {}, ...options };
  let isDragging = false;
  let delayTimeout = null;

  const startDrag = (event) => {
    isDragging = true;
    dndState.isDragging = true;
    dndState.dragType = config.dragType;
    dndState.payload = config.payload;
    dndState.sourceElement = element;
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp, { once: true });
    element.classList.add(config.draggingClass);
    config.onDragStart({ event, element, payload: config.payload });
  };

  const handlePointerDown = (event) => {
    if (config.handleSelector && !event.target.closest(config.handleSelector)) return;
    event.preventDefault();
    if (config.dragDelay > 0) {
      delayTimeout = setTimeout(() => startDrag(event), config.dragDelay);
    } else {
      startDrag(event);
    }
  };

  const handlePointerMove = (event) => {
    if (isDragging) config.onDragMove({ event, element });
  };

  const handlePointerUp = (event) => {
    clearTimeout(delayTimeout);
    if (!isDragging) return;
    isDragging = false;
    document.removeEventListener('pointermove', handlePointerMove);
    element.classList.remove(config.draggingClass);
    config.onDragEnd({ event, element });
    setTimeout(() => {
      dndState.isDragging = false;
      dndState.dragType = null;
      dndState.payload = null;
      dndState.sourceElement = null;
    }, 0);
  };

  element.addEventListener('pointerdown', handlePointerDown);
  return { destroy: () => element.removeEventListener('pointerdown', handlePointerDown), get isDragging() { return isDragging; } };
};

const useDroppable = (element, options = {}) => {
  if (!element) throw new Error('useDroppable requires an element.');
  const config = { hoverClass: 'is-drop-target', accepts: [], onDrop: () => {}, onDragEnter: () => {}, onDragLeave: () => {}, ...options };
  const canAccept = (type, files) => {
    if (files.length > 0) return true;
    if (!config.accepts || config.accepts.length === 0) return true;
    if (typeof config.accepts === 'function') return config.accepts(type);
    return config.accepts.includes(type);
  };
  const handleDragEnter = (e) => { if (canAccept(dndState.dragType, e.dataTransfer.files)) { element.classList.add(config.hoverClass); config.onDragEnter({ dragType: dndState.dragType, payload: dndState.payload }); } };
  const handleDragLeave = () => { element.classList.remove(config.hoverClass); config.onDragLeave(); };
  const handleDragOver = (e) => { if (canAccept(dndState.dragType, e.dataTransfer.files)) e.preventDefault(); };
  const handleDrop = (e) => {
    e.preventDefault();
    element.classList.remove(config.hoverClass);
    if (e.dataTransfer.files.length > 0) config.onDrop({ files: Array.from(e.dataTransfer.files) });
    else if (dndState.isDragging && canAccept(dndState.dragType)) config.onDrop({ payload: dndState.payload, dragType: dndState.dragType });
  };
  const events = { dragenter: handleDragEnter, dragleave: handleDragLeave, dragover: handleDragOver, drop: handleDrop };
  Object.entries(events).forEach(([name, handler]) => element.addEventListener(name, handler));
  return { destroy: () => Object.entries(events).forEach(([name, handler]) => element.removeEventListener(name, handler)) };
};

const useSortable = (container, options = {}) => {
  if (!container) throw new Error('useSortable requires a container element.');
  const config = { itemSelector: '[data-sortable-item]', handleSelector: null, disabledSelector: '[aria-disabled="true"]', draggingClass: 'is-sorting', placeholderClass: 'sortable-placeholder', onDragStart: () => {}, onSort: () => {}, onSortEnd: () => {}, ...options };
  let draggedItem = null, placeholder = null, initialIndex = -1;
  const getItems = () => Array.from(container.querySelectorAll(config.itemSelector));
  const getDragAfterElement = (y) => {
    const otherItems = getItems().filter(item => item !== draggedItem && !item.contains(draggedItem));
    return otherItems.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      return (offset < 0 && offset > closest.offset) ? { offset, element: child } : closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  };
  const handleDragStart = (e) => {
    if (e.target.closest(config.disabledSelector)) return;
    if (config.handleSelector && !e.target.closest(config.handleSelector)) return;
    const item = e.target.closest(config.itemSelector);
    if (!item) return;
    draggedItem = item;
    initialIndex = getItems().indexOf(draggedItem);
    e.dataTransfer.effectAllowed = 'move';
    placeholder = document.createElement('div');
    placeholder.className = config.placeholderClass;
    placeholder.style.height = `${draggedItem.offsetHeight}px`;
    draggedItem.classList.add(config.draggingClass);
    config.onDragStart({ item: draggedItem, index: initialIndex });
  };
  const handleDragOver = (e) => { e.preventDefault(); if (!draggedItem) return; draggedItem.hidden = true; container.insertBefore(placeholder, getDragAfterElement(e.clientY)); };
  const handleDragEnd = () => {
    if (!draggedItem) return;
    draggedItem.hidden = false;
    const finalItems = getItems().filter(i => i !== draggedItem);
    const newIndex = finalItems.indexOf(placeholder) > -1 ? finalItems.indexOf(placeholder) : getItems().indexOf(placeholder);
    config.onSortEnd({ item: draggedItem, oldIndex: initialIndex, newIndex });
    draggedItem.classList.remove(config.draggingClass);
    placeholder?.remove();
    draggedItem = null;
    placeholder = null;
    initialIndex = -1;
  };
  const handleDrop = (e) => {
      e.preventDefault();
      if (!draggedItem) return;
      const itemsBeforeDrop = getItems();
      const newIndex = itemsBeforeDrop.indexOf(placeholder);
      config.onSort({ item: draggedItem, oldIndex: initialIndex, newIndex, getFinalOrder: () => { const reordered = [...itemsBeforeDrop.filter(i => i !== placeholder && i !== draggedItem)]; reordered.splice(newIndex, 0, draggedItem); return reordered; } });
  };
  container.addEventListener('dragstart', handleDragStart);
  container.addEventListener('dragover', handleDragOver);
  container.addEventListener('dragend', handleDragEnd);
  container.addEventListener('drop', handleDrop);
  return { destroy: () => { container.removeEventListener('dragstart', handleDragStart); container.removeEventListener('dragover', handleDragOver); container.removeEventListener('dragend', handleDragEnd); container.removeEventListener('drop', handleDrop); } };
};

export const useDnd = { draggable: useDraggable, droppable: useDroppable, sortable: useSortable };

/**
 * @module useEffect
 * @description A lifecycle engine for managing side effects with automatic cleanup.
 */
export const useEffect = (setupFn) => {
    if (typeof setupFn !== 'function') throw new Error('useEffect requires a setup function.');
    let isMounted = false;
    let cleanupFn = null;
    const mount = () => { if (isMounted) return; isMounted = true; const potentialCleanup = setupFn(); if (typeof potentialCleanup === 'function') cleanupFn = potentialCleanup; };
    const unmount = () => { if (!isMounted) return; isMounted = false; cleanupFn?.(); cleanupFn = null; };
    const rerun = () => { unmount(); mount(); };
    return { mount, unmount, rerun, destroy: unmount };
};

/**
 * @module useKeyboard
 * @description A comprehensive keyboard command engine.
 */
export const useKeyboard = (options = {}) => {
  const config = { target: document, hotkeys: [], ignoreInputs: true, sequenceTimeout: 500, onKeyDown: () => {}, onKeyUp: () => {}, ...options };
  let isActive = false;
  const pressedKeys = new Set();
  let sequence = [];
  let sequenceTimer = null;
  const KEY_MAP = { ' ': 'space', 'Control': 'ctrl', 'Meta': 'cmd', 'Alt': 'alt', 'Shift': 'shift' };
  const normalizeKey = (key) => KEY_MAP[key] || key.toLowerCase();
  const buildKeyStringFromEvent = (event) => {
    const modifiers = [];
    if (event.ctrlKey) modifiers.push('ctrl');
    if (event.metaKey) modifiers.push('cmd');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');
    const key = normalizeKey(event.key);
    if (!modifiers.includes(key)) modifiers.push(key);
    return modifiers.sort().join('+');
  };
  const handleEvent = (event, eventType) => {
    if (config.ignoreInputs && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
    const eventKey = normalizeKey(event.key);
    if (eventType === 'keydown') {
      pressedKeys.add(eventKey);
      clearTimeout(sequenceTimer);
      sequence.push(eventKey);
      sequenceTimer = setTimeout(() => { sequence = []; }, config.sequenceTimeout);
    } else {
      pressedKeys.delete(eventKey);
    }
    const currentCombo = buildKeyStringFromEvent(event);
    const currentSequence = sequence.join(' ');
    for (const hotkey of config.hotkeys) {
      const triggerType = hotkey.type || 'keydown';
      if (triggerType !== eventType) continue;
      if (hotkey.keys === currentCombo || hotkey.keys === currentSequence) {
        if (hotkey.preventDefault !== false) event.preventDefault();
        hotkey.handler(event);
        if (hotkey.keys === currentSequence) sequence = [];
      }
    }
    if (eventType === 'keydown') config.onKeyDown(event);
    if (eventType === 'keyup') config.onKeyUp(event);
  };
  const handleKeyDown = (e) => handleEvent(e, 'keydown');
  const handleKeyUp = (e) => handleEvent(e, 'keyup');
  const activate = () => { if (isActive) return; isActive = true; config.target.addEventListener('keydown', handleKeyDown); config.target.addEventListener('keyup', handleKeyUp); };
  const deactivate = () => { if (!isActive) return; isActive = false; config.target.removeEventListener('keydown', handleKeyDown); config.target.removeEventListener('keyup', handleKeyUp); pressedKeys.clear(); sequence = []; clearTimeout(sequenceTimer); };
  const update = (newOptions) => Object.assign(config, newOptions);
  return { activate, deactivate, update, destroy: deactivate, get pressedKeys() { return new Set(pressedKeys); } };
};

/**
 * @module usePortal
 * @description A utility for rendering content in a portal.
 */
export class UsePortal {
  constructor(content, options = {}) {
    if (!content) throw new Error('Portal requires content element.');
    this.content = content;
    this.config = { container: null, className: 'portal-root', prepend: false, ...options };
    this.portalContainer = null;
    this.isMounted = false;
  }
  mount() {
    if (this.isMounted) return;
    const targetContainer = this.config.container || document.body;
    if (!this.portalContainer) {
      this.portalContainer = document.createElement('div');
      this.portalContainer.className = this.config.className;
    }
    this.portalContainer.appendChild(this.content);
    if (this.config.prepend) targetContainer.prepend(this.portalContainer);
    else targetContainer.appendChild(this.portalContainer);
    this.isMounted = true;
  }
  unmount() {
    if (!this.isMounted) return;
    if (this.portalContainer && this.portalContainer.parentNode) this.portalContainer.parentNode.removeChild(this.portalContainer);
    this.isMounted = false;
  }
  update(newContent) {
    if (newContent) {
      this.content = newContent;
      if (this.isMounted && this.portalContainer) {
        this.portalContainer.innerHTML = '';
        this.portalContainer.appendChild(this.content);
      }
    }
  }
  destroy() { this.unmount(); this.portalContainer = null; this.content = null; }
  get mounted() { return this.isMounted; }
}
export const usePortal = (content, options = {}) => {
  const portal = new UsePortal(content, options);
  return { mount: () => portal.mount(), unmount: () => portal.unmount(), update: (newContent) => portal.update(newContent), destroy: () => portal.destroy(), get isMounted() { return portal.mounted; } };
};

/**
 * @module useResize
 * @description An engine for managing resizable panel layouts.
 */
export const useResize = (container, options = {}) => {
  if (!container) throw new Error('useResize requires a container element.');
  const config = { orientation: 'horizontal', handleSelector: '.resize-handle', panelSelector: '.resizable-panel', draggingClass: 'is-dragging-handle', keyboardStep: 5, onLayoutChange: () => {}, onResizeStart: () => {}, onResizeEnd: () => {}, ...options };
  const panelStates = new Map();
  let panels = [], handles = [];
  const getConstraint = (panel, type) => {
    const attr = panel.dataset[type === 'min' ? 'minSize' : 'maxSize'] || '';
    if (attr.endsWith('%')) return { value: parseFloat(attr), unit: '%' };
    if (attr.endsWith('px')) return { value: parseFloat(attr), unit: 'px' };
    return { value: type === 'min' ? 0 : Infinity, unit: 'px' };
  };
  const getSizes = () => panels.map(p => parseFloat(p.style.flexBasis) || 100 / panels.length);
  const distributeSizes = (sizes) => {
    const containerSize = config.orientation === 'horizontal' ? container.clientWidth : container.clientHeight;
    let pixelSizes = sizes.map(s => (s / 100) * containerSize);
    for (let i = 0; i < panels.length; i++) {
        const panel = panels[i];
        const min = getConstraint(panel, 'min'), max = getConstraint(panel, 'max');
        const minPx = min.unit === '%' ? (min.value / 100) * containerSize : min.value;
        const maxPx = max.unit === '%' ? (max.value / 100) * containerSize : max.value;
        pixelSizes[i] = Math.max(minPx, Math.min(pixelSizes[i], maxPx));
    }
    const totalPixelSize = pixelSizes.reduce((a, b) => a + b, 0);
    return pixelSizes.map(px => (px / totalPixelSize) * 100);
  };
  const attachHandleListeners = (handle, panelBefore, panelAfter) => {
    const onPointerDown = (e) => {
      const startPos = config.orientation === 'horizontal' ? e.clientX : e.clientY;
      const initialSizes = getSizes();
      const beforeIndex = panels.indexOf(panelBefore), afterIndex = panels.indexOf(panelAfter);
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
        const beforeIndex = panels.indexOf(panelBefore), afterIndex = panels.indexOf(panelAfter);
        let newSizes = [...initialSizes];
        if (key === 'Home') { newSizes[afterIndex] += newSizes[beforeIndex]; newSizes[beforeIndex] = 0; }
        else if (key === 'End') { newSizes[beforeIndex] += newSizes[afterIndex]; newSizes[afterIndex] = 0; }
        else { newSizes[beforeIndex] += dir * config.keyboardStep; newSizes[afterIndex] -= dir * config.keyboardStep; }
        config.onLayoutChange(distributeSizes(newSizes));
    };
    handle.addEventListener('pointerdown', onPointerDown);
    handle.addEventListener('keydown', onKeyDown);
    return { onPointerDown, onKeyDown };
  };
  const initialize = () => {
    panels = Array.from(container.querySelectorAll(config.panelSelector));
    handles = Array.from(container.querySelectorAll(config.handleSelector));
    handles.forEach((handle, i) => {
      const panelBefore = panels[i], panelAfter = panels[i+1];
      if (!panelBefore || !panelAfter) return;
      handle.setAttribute('role', 'separator');
      handle.setAttribute('tabindex', '0');
      panelStates.set(handle, { listeners: attachHandleListeners(handle, panelBefore, panelAfter) });
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
      for(let i=0; i < panels.length; i++) if (i !== panelIndex) currentSizes[i] += sizeToCollapse / otherPanelsCount;
      setSizes(currentSizes);
  };
  const expand = (panelIndex) => {
      const state = panelStates.get(panels[panelIndex]);
      if (!state || state.preCollapseSize === undefined) return;
      const currentSizes = getSizes();
      const sizeToExpand = state.preCollapseSize - currentSizes[panelIndex];
      currentSizes[panelIndex] = state.preCollapseSize;
      const otherPanelsCount = panels.length - 1;
      for(let i=0; i < panels.length; i++) if (i !== panelIndex) currentSizes[i] -= sizeToExpand / otherPanelsCount;
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
    panels = []; handles = []; panelStates.clear();
  };
  initialize();
  return { setSizes, collapse, expand, refresh: () => { destroy(); initialize(); }, destroy, getSizes };
};

/**
 * @module useRovingFocus
 * @description An engine for managing focus in a collection of items (roving tabindex).
 */
export const useRovingFocus = (container, options = {}) => {
  if (!container) throw new Error('useRovingFocus requires a container element.');
  const config = { orientation: 'vertical', wrap: true, initialIndex: 0, searchable: false, searchTimeout: 500, itemSelector: '[role="menuitem"], [role="option"], [role="tab"]', onFocusChange: () => {}, isDisabled: (item) => item.disabled || item.getAttribute('aria-disabled') === 'true', ...options };
  let items = [], currentIndex = -1, searchQuery = '', searchTimeout = null;
  const findNextFocusableIndex = (startIndex, direction) => {
    const len = items.length;
    let i = (startIndex + direction + len) % len;
    for (let j = 0; j < len; j++) {
      if (!config.isDisabled(items[i])) return i;
      i = (i + direction + len) % len;
    }
    return -1;
  };
  const focusItemByIndex = (index) => {
    if (index === -1 || index === currentIndex) return;
    if (currentIndex > -1 && items[currentIndex]) items[currentIndex].setAttribute('tabindex', '-1');
    const newItem = items[index];
    if (newItem) {
      newItem.setAttribute('tabindex', '0');
      newItem.focus();
      currentIndex = index;
      config.onFocusChange(newItem, index);
    }
  };
  const handleSearch = (key) => {
    clearTimeout(searchTimeout);
    searchQuery += key.toLowerCase();
    searchTimeout = setTimeout(() => { searchQuery = ''; }, config.searchTimeout);
    const orderedItems = [...items.slice(currentIndex + 1), ...items.slice(0, currentIndex + 1)];
    const foundItem = orderedItems.find(item => !config.isDisabled(item) && item.textContent.trim().toLowerCase().startsWith(searchQuery));
    if (foundItem) focusItemByIndex(items.indexOf(foundItem));
  };
  const handleKeyDown = (e) => {
    const keyMap = { 'ArrowUp': config.orientation !== 'horizontal' ? -1 : 0, 'ArrowDown': config.orientation !== 'horizontal' ? 1 : 0, 'ArrowLeft': config.orientation !== 'vertical' ? -1 : 0, 'ArrowRight': config.orientation !== 'vertical' ? 1 : 0 };
    const direction = keyMap[e.key] || 0;
    if (direction) { e.preventDefault(); focusItemByIndex(findNextFocusableIndex(currentIndex, direction)); }
    else if (e.key === 'Home') { e.preventDefault(); focusItemByIndex(findNextFocusableIndex(-1, 1)); }
    else if (e.key === 'End') { e.preventDefault(); focusItemByIndex(findNextFocusableIndex(items.length, -1)); }
    else if (config.searchable && e.key.length === 1 && !e.ctrlKey && !e.metaKey) { e.preventDefault(); handleSearch(e.key); }
  };
  const handleClick = (e) => { const item = e.target.closest(config.itemSelector); if(item && items.includes(item) && !config.isDisabled(item)) focusItemByIndex(items.indexOf(item)); };
  const refresh = () => {
    items = Array.from(container.querySelectorAll(config.itemSelector));
    items.forEach(item => item.setAttribute('tabindex', '-1'));
    let initial = Math.min(Math.max(0, config.initialIndex), items.length - 1);
    let focusableIndex = items.findIndex((item, i) => i >= initial && !config.isDisabled(item));
    if (focusableIndex === -1) focusableIndex = items.findIndex(item => !config.isDisabled(item));
    currentIndex = -1;
    focusItemByIndex(focusableIndex);
  };
  container.addEventListener('keydown', handleKeyDown);
  container.addEventListener('click', handleClick);
  refresh();
  return { refresh, focusNext: () => focusItemByIndex(findNextFocusableIndex(currentIndex, 1)), focusPrev: () => focusItemByIndex(findNextFocusableIndex(currentIndex, -1)), focusFirst: () => focusItemByIndex(findNextFocusableIndex(-1, 1)), focusLast: () => focusItemByIndex(findNextFocusableIndex(items.length, -1)), focusItem: (item) => focusItemByIndex(items.indexOf(item)), destroy: () => { container.removeEventListener('keydown', handleKeyDown); container.removeEventListener('click', handleClick); clearTimeout(searchTimeout); }, get activeItem() { return items[currentIndex] || null; } };
};

/**
 * @module useSelection
 * @description A state management engine for handling item selection.
 */
export const useSelection = (initialItems = [], options = {}) => {
  const config = { mode: 'single', initialSelected: [], onSelectionChange: () => {}, isDisabled: (item) => false, ...options };
  let items = [...initialItems];
  const selected = new Set();
  let lastManuallySelectedItem = null;
  const updateItemAria = (item) => item.setAttribute('aria-selected', String(selected.has(item)));
  const notify = () => config.onSelectionChange({ selection: Array.from(selected), lastSelected: lastManuallySelectedItem });
  const clear = () => { if (selected.size === 0) return; selected.forEach(item => { selected.delete(item); updateItemAria(item); }); lastManuallySelectedItem = null; notify(); };
  const select = (item) => { if (config.isDisabled(item) || selected.has(item)) return; if (config.mode === 'single') clear(); selected.add(item); updateItemAria(item); lastManuallySelectedItem = item; notify(); };
  const deselect = (item) => { if (!selected.has(item)) return; selected.delete(item); updateItemAria(item); lastManuallySelectedItem = null; notify(); };
  const toggle = (item) => (selected.has(item) ? deselect(item) : select(item));
  const selectAll = () => { if (config.mode !== 'multiple') return; items.forEach(item => { if (!config.isDisabled(item)) { selected.add(item); updateItemAria(item); } }); notify(); };
  const replace = (newSelection) => { clear(); newSelection.forEach(select); };
  const handlePointerDown = (event) => {
    const item = event.target.closest(items[0]?.tagName);
    if (!item || !items.includes(item) || config.isDisabled(item)) return;
    const { shiftKey, ctrlKey, metaKey } = event;
    const isMultiKey = ctrlKey || metaKey;
    if (config.mode === 'multiple' && shiftKey && lastManuallySelectedItem) {
        event.preventDefault();
        const lastIdx = items.indexOf(lastManuallySelectedItem), currentIdx = items.indexOf(item);
        const start = Math.min(lastIdx, currentIdx), end = Math.max(lastIdx, currentIdx);
        const range = items.slice(start, end + 1);
        if (!isMultiKey) clear();
        range.forEach(select);
    } else if (config.mode === 'multiple' && isMultiKey) {
        toggle(item);
    } else {
        clear();
        select(item);
    }
  };
  items.forEach(item => item.setAttribute('aria-selected', 'false'));
  config.initialSelected.forEach(select);
  return { select, deselect, toggle, selectAll, clear, replace, isSelected: (item) => selected.has(item), setItems: (newItems) => { items = [...newItems]; }, destroy: clear, get selected() { return Array.from(selected); }, getContainerProps: () => ({ onPointerDown: handlePointerDown }) };
};

/**
 * @module useThrottle
 * @description An engine for creating debounced or throttled functions.
 */
export const useThrottle = (fn, options = {}) => {
  if (typeof fn !== 'function') throw new Error('useThrottle requires a function to be provided.');
  const config = { delay: 200, mode: 'throttle', leading: true, trailing: true, ...options };
  let timeoutId = null, lastArgs = null, lastThis = null, result, lastCallTime = 0;
  const later = (context) => { lastCallTime = config.leading === false ? 0 : Date.now(); timeoutId = null; result = fn.apply(context, lastArgs); lastArgs = null; lastThis = null; };
  const call = function(...args) {
    const now = Date.now();
    if (!lastCallTime && config.leading === false) lastCallTime = now;
    lastArgs = args;
    lastThis = this;
    if (config.mode === 'debounce') {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => later(lastThis), config.delay);
      return result;
    }
    const remaining = config.delay - (now - lastCallTime);
    if (remaining <= 0 || remaining > config.delay) {
      if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
      lastCallTime = now;
      result = fn.apply(lastThis, lastArgs);
      if (!timeoutId) { lastArgs = null; lastThis = null; }
    } else if (!timeoutId && config.trailing !== false) {
      timeoutId = setTimeout(() => later(lastThis), remaining);
    }
    return result;
  };
  const cancel = () => { clearTimeout(timeoutId); lastCallTime = 0; timeoutId = null; lastArgs = null; lastThis = null; };
  const flush = () => { if (!timeoutId) return result; clearTimeout(timeoutId); later(lastThis); return result; };
  return { call, cancel, flush, destroy: cancel };
};