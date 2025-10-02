/**
 * @module useThrottle
 * @description A feature-rich engine for creating debounced or throttled functions.
 * It provides a complete API with lifecycle controls like `cancel` and `flush`, and
 * fine-grained options for leading/trailing edge execution.
 *
 * @example
 * // In a SearchInput Component Class...
 * import { useThrottle } from './utils';
 *
 * class SearchInput {
 *   constructor(inputElement) {
 *     this.input = inputElement;
 *
 *     // Create a debounced function for fetching search results.
 *     this.throttledFetch = useThrottle(
 *       (query) => this.fetchResults(query),
 *       { delay: 300, mode: 'debounce' }
 *     );
 *
 *     this.input.addEventListener('input', (e) => {
 *       // The engine provides a `call` method to execute the function.
 *       this.throttledFetch.call(e.target.value);
 *     });
 *   }
 *
 *   fetchResults(query) {
 *     console.log(`Fetching results for: ${query}`);
 *   }
 *
 *   destroy() {
 *     // Essential for preventing memory leaks on component destruction.
 *     this.throttledFetch.cancel();
 *   }
 * }
 */

const defaultConfig = {
  delay: 200,
  mode: 'throttle', // 'throttle' or 'debounce'
  leading: true,
  trailing: true,
};

export const useThrottle = (fn, options = {}) => {
  if (typeof fn !== 'function') {
    throw new Error('useThrottle requires a function to be provided.');
  }

  const config = { ...defaultConfig, ...options };
  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;
  let result;
  let lastCallTime = 0;

  const later = (context) => {
    lastCallTime = config.leading === false ? 0 : Date.now();
    timeoutId = null;
    result = fn.apply(context, lastArgs);
    lastArgs = null;
    lastThis = null;
  };

  const call = function(...args) {
    const now = Date.now();
    if (!lastCallTime && config.leading === false) {
      lastCallTime = now;
    }

    lastArgs = args;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    lastThis = this; // Capture the `this` context from the call site

    if (config.mode === 'debounce') {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => later(lastThis), config.delay);
      return result;
    }

    const remaining = config.delay - (now - lastCallTime);
    if (remaining <= 0 || remaining > config.delay) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCallTime = now;
      result = fn.apply(lastThis, lastArgs);
      if (!timeoutId) {
        lastArgs = null;
        lastThis = null;
      }
    } else if (!timeoutId && config.trailing !== false) {
      timeoutId = setTimeout(() => later(lastThis), remaining);
    }
    
    return result;
  };

  const cancel = () => {
    clearTimeout(timeoutId);
    lastCallTime = 0;
    timeoutId = null;
    lastArgs = null;
    lastThis = null;
  };

  const flush = () => {
    if (!timeoutId) return result;
    
    clearTimeout(timeoutId);
    later(lastThis);
    
    return result;
  };

  return {
    call,
    cancel,
    flush,
    destroy: cancel, // API consistency
  };
};

export default useThrottle;