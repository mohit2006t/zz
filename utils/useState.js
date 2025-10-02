/**
 * @module useState
 * @description A generic, observable state container. This is the foundational
 * engine for creating any piece of reactive state. It holds a value and notifies
 * subscribers when that value is updated, supporting functional updates and
 * providing a robust subscription model for memory-safe reactivity.
 *
 * @example
 * // In a Counter Component Class...
 * import { useState } from './utils';
 *
 * class Counter {
 *   constructor(element) {
 *     this.element = element;
 *     this.count = useState(0);
 *
 *     this.unsubscribe = this.count.subscribe(currentValue => {
 *       // This is our render function, triggered by state changes.
 *       this.element.textContent = `Count: ${currentValue}`;
 *     });
 *
 *     this.element.addEventListener('click', () => {
 *       // Use a functional update to safely increment from the previous state.
 *       this.count.set(c => c + 1);
 *     });
 *   }
 *
 *   destroy() {
 *     // CRITICAL: Clean up the subscription to prevent memory leaks.
 *     this.unsubscribe();
 *   }
 * }
 */
export const useState = (initialValue) => {
    let value = initialValue;
    const subscribers = new Set();
  
    /**
     * Updates the state. Can accept a new value or an updater function.
     * @param {any | function(any): any} newValue - The new value or a function that receives the previous state and returns the new state.
     */
    const set = (newValue) => {
      const oldValue = value;
      
      value = (typeof newValue === 'function')
        ? newValue(oldValue)
        : newValue;
  
      // Only notify subscribers if the value has actually changed.
      if (oldValue !== value) {
        // Notify all subscribers with the new value.
        subscribers.forEach(callback => callback(value));
      }
    };
  
    /**
     * Subscribes to state changes.
     * @param {function(any): void} callback - The function to call when the state changes.
     * @returns {function(): void} A function to call to unsubscribe.
     */
    const subscribe = (callback) => {
      subscribers.add(callback);
      callback(value); // Immediately notify with the current value.
      
      // Return the unsubscribe function for cleanup.
      return () => subscribers.delete(callback);
    };
  
    return {
      set,
      get: () => value,
      subscribe,
      destroy: () => subscribers.clear(),
    };
  };
  
  export default useState;