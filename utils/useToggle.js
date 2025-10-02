/**
 * @module useToggle
 * @description A specialized state engine for managing boolean values, built upon the
 * generic `useState` engine. It provides a convenient, declarative API for toggling
 * state and ensures the underlying value is always a boolean.
 *
 * @example
 * // In a Checkbox Component Class...
 * import { useToggle } from './utils';
 *
 * class Checkbox {
 *   constructor(inputElement) {
 *     this.element = inputElement;
 *     this.isChecked = useToggle(this.element.checked);
 *
 *     this.unsubscribe = this.isChecked.subscribe(checked => {
 *       // The component's render logic, triggered by the engine.
 *       this.element.checked = checked;
 *       this.element.setAttribute('aria-checked', String(checked));
 *     });
 *
 *     this.element.addEventListener('click', () => {
 *       // The component tells the engine to change state.
 *       this.isChecked.toggle();
 *     });
 *   }
 *
 *   destroy() {
 *     this.unsubscribe();
 *   }
 * }
 */
import { useState } from './useState.js';

export const useToggle = (initialValue = false, options = {}) => {
  // 1. The core state is now managed by the generic, powerful useState engine.
  //    The initial value is immediately coerced to a boolean for type safety.
  const state = useState(Boolean(initialValue));

  // 2. The `onChange` callback is simply syntactic sugar over a subscription.
  if (options.onChange) {
    state.subscribe(options.onChange);
  }

  // 3. The returned object provides a specialized, declarative API.
  return {
    /** Sets the state, ensuring the new value is always a boolean. */
    set: (value) => state.set(Boolean(value)),

    /** Returns the current boolean state. */
    get: state.get,

    /** Sets the state to true. */
    on: () => state.set(true),

    /** Sets the state to false. */
    off: () => state.set(false),

    /** Toggles the state between true and false. */
    toggle: () => state.set(v => !v),

    /** Subscribes to state changes. Returns an unsubscribe function. */
    subscribe: state.subscribe,

    /** Clears all subscribers to prevent memory leaks. */
    destroy: state.destroy,
  };
};

export default useToggle;