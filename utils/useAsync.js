/**
 * @module useAsync
 * @description A powerful engine for managing the state of asynchronous operations.
 * It handles the full lifecycle (idle, loading, success, error) and prevents race
 * conditions from stale promises.
 *
 * @example
 * // In a component that fetches user data...
 * import { useAsync } from './utils';
 *
 * class UserProfile {
 *   constructor(element) {
 *     this.element = element;
 *     this.asyncEngine = useAsync();
 *
 *     this.unsubscribe = this.asyncEngine.subscribe(({ status, data, error }) => {
 *       this.render(status, data, error);
 *     });
 *   }
 *
 *   fetchUser(userId) {
 *     this.asyncEngine.run(() => 
 *       fetch(`https://api.example.com/users/${userId}`).then(res => res.json())
 *     );
 *   }
 *
 *   render(status, data, error) {
 *     if (status === 'idle') this.element.innerHTML = 'Please fetch a user.';
 *     if (status === 'loading') this.element.innerHTML = 'Loading...';
 *     if (status === 'error') this.element.innerHTML = `Error: ${error.message}`;
 *     if (status === 'success') this.element.innerHTML = `<h1>${data.name}</h1>`;
 *   }
 *
 *   destroy() { this.unsubscribe(); }
 * }
 */
import { useState } from './useState.js';

const initialState = {
  status: 'idle', // 'idle' | 'loading' | 'success' | 'error'
  data: null,
  error: null,
};

export const useAsync = (initialStateOptions = {}) => {
  const state = useState({ ...initialState, ...initialStateOptions });
  let counter = 0; // For preventing race conditions

  const run = async (promiseFn) => {
    if (!promiseFn || typeof promiseFn !== 'function') {
      throw new Error('useAsync.run requires a function that returns a promise.');
    }
    
    counter++;
    const currentCounter = counter;
    
    state.set(s => ({ ...s, status: 'loading' }));
    
    try {
      const data = await promiseFn();
      if (currentCounter === counter) { // Only update if this is the latest request
        state.set({ status: 'success', data, error: null });
      }
      return { data };
    } catch (error) {
      if (currentCounter === counter) { // Only update if this is the latest request
        state.set({ status: 'error', error, data: null });
      }
      return { error };
    }
  };
  
  const setData = (newData) => {
    state.set(s => ({ ...s, data: newData }));
  };
  
  const setError = (newError) => {
    state.set(s => ({ ...s, error: newError }));
  };
  
  const reset = () => {
    state.set(initialState);
  };
  
  return {
    run,
    reset,
    setData,
    setError,
    subscribe: state.subscribe,
    get state() { return state.get(); }
  };
};

export default useAsync;