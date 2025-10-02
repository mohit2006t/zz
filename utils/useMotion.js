/**
 * @module useMotion
 * @description A comprehensive utility for orchestrating CSS transitions and awaiting
 * their completion. It offers a powerful hook for managing animation lifecycles and a
 * simple async function for one-off waits.
 *
 * @example
 * // 1. Using the simple await function (most common case)
 * import { awaitMotion } from './utils';
 *
 * async function fadeOutAndHide(element) {
 *   element.classList.add('is-fading-out');
 *   await awaitMotion(element);
 *   element.hidden = true;
 *   console.log('Animation finished and element is hidden.');
 * }
 *
 * @example
 * // 2. Using the hook for full control
 * import { useMotion } from './utils';
 *
 * const element = document.getElementById('my-element');
 * const motion = useMotion(element, { onEnd: () => console.log('Motion ended!') });
 *
 * async function complexAnimation() {
 *   await motion.run(el => el.classList.add('slide-in'));
 *   // ...do something else...
 *   await motion.run(el => el.classList.add('fade-in'));
 * }
 */

const defaultConfig = {
  propertyName: null,
  timeoutBuffer: 50,
};

/**
 * A simple, promise-based function that waits for a CSS transition or animation to end.
 * @param {HTMLElement} element - The element to monitor.
 * @param {object} options - Configuration options.
 * @param {string} [options.propertyName] - If specified, waits only for this CSS property to transition.
 * @param {number} [options.timeoutBuffer] - A safety buffer (in ms) added to the detected duration.
 * @returns {Promise<void>} A promise that resolves when the motion is complete.
 */
export const awaitMotion = (element, options = {}) => {
  return new Promise(resolve => {
    const { propertyName, timeoutBuffer } = { ...defaultConfig, ...options };

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
 * Creates a stateful motion controller for an element.
 * @param {HTMLElement} element - The element to manage.
 * @param {object} [options] - Configuration options.
 * @returns An object with methods to control the motion.
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
      // Allow new animations to interrupt and cancel the previous one
      cancel();
    }

    isAnimating = true;
    config.onStart(element);

    animationPromise = new Promise(resolve => {
      resolveAnimation = resolve;
      
      requestAnimationFrame(() => {
        // Ensure the awaitMotion helper is called *after* styles might have changed
        awaitMotion(element, config).then(() => {
          if (!isAnimating) return; // It was cancelled
          isAnimating = false;
          config.onEnd(element);
          if (resolveAnimation) resolveAnimation();
        });
        
        // Trigger the style change that starts the animation
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
      resolveAnimation(); // Resolve the promise immediately
    }
  };

  return {
    run,
    cancel,
    destroy: cancel, // Destroy is an alias for cancel in this hook
    get isAnimating() {
      return isAnimating;
    },
  };
};

export default useMotion;