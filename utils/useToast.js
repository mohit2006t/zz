/**
 * @module useToast
 * @description A headless, global state management engine for toast notifications.
 * It manages the state, timing, and global configuration (like position) of toasts.
 * Your UI components subscribe to this engine to render the actual toast elements.
 *
 * @example
 * // 1. The Engine is imported and used by a component.
 * import { useToast } from './utils';
 *
 * // 2. A component class subscribes to the engine to render the UI.
 * class ToastContainer {
 *   constructor(element) {
 *     this.element = element;
 *     this.toastEngine = useToast();
 *
 *     // Subscribe to state changes. The engine will call this whenever the
 *     // toasts array or the global config (like position) changes.
 *     this.unsubscribe = this.toastEngine.subscribe(
 *       ({ toasts, config }) => this.render(toasts, config)
 *     );
 *   }
 *
 *   render(toasts, config) {
 *     // The component is 100% in charge of the DOM.
 *     // It uses the config data from the engine to apply styles via attributes.
 *     this.element.dataset.position = config.position;
 *
 *     this.element.innerHTML = toasts.map(toast => `
 *       <div class="toast" data-toast-id="${toast.id}" data-status="${toast.status}">
 *         ${toast.message}
 *       </div>
 *     `).join('');
 *   }
 *
 *   destroy() { this.unsubscribe(); }
 * }
 *
 * // 3. Anywhere in the app, you can show a toast or change the global config.
 * const toastEngine = useToast();
 * toastEngine.add('User saved successfully!');
 * // Change position for all subsequent toasts.
 * toastEngine.updateConfig({ position: 'bottom-center' });
 */
import { useId } from './useId.js';

const initialConfig = {
  timeout: 5000,
  pauseOnHover: true,
  exitDuration: 300,
  position: 'top-end', // e.g., 'top-start', 'top-center', 'bottom-end', etc.
  offset: '1rem',
};

// Singleton pattern: The entire state is managed within this closure.
const createToastManager = () => {
  let state = {
    toasts: [],
    config: { ...initialConfig },
  };
  const subscribers = new Set();

  const notify = () => {
    subscribers.forEach(callback => callback(state));
  };

  const add = (message, options = {}) => {
    return new Promise(resolve => {
      const id = options.id || useId();
      
      const newToast = {
        id,
        message,
        status: 'entering',
        config: { ...state.config, ...options },
        remaining: options.timeout ?? state.config.timeout,
        startTime: Date.now(),
        timer: null,
        onDismiss: resolve,
      };

      state = { ...state, toasts: [...state.toasts, newToast] };
      notify();

      requestAnimationFrame(() => {
        const toast = state.toasts.find(t => t.id === id);
        if (toast) {
          toast.status = 'visible';
          notify();
          if (toast.config.timeout > 0) {
            toast.timer = setTimeout(() => remove(id), toast.remaining);
          }
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
    callback(state); // Immediately send current state
    return () => subscribers.delete(callback); // Return unsubscribe function
  };

  return {
    add,
    remove,
    updateConfig,
    pause,
    resume,
    subscribe,
    clearAll: () => state.toasts.forEach(t => remove(t.id)),
    get state() { return { ...state, toasts: [...state.toasts] }; },
  };
};

let managerInstance;

export const useToast = () => {
  if (!managerInstance) {
    managerInstance = createToastManager();
  }
  return managerInstance;
};

export default useToast;