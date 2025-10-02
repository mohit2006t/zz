/**
 * @module useFocus
 * @description A high-level engine for managing focus within a component. It
 * simplifies the use of the powerful `useFocusTrap` engine for common scenarios
 * like modals, dialogs, and menus.
 *
 * @example
 * // In your Modal Component Class...
 * import { useFocus } from './utils';
 *
 * class Modal {
 *   constructor(element) {
 *     this.element = element;
 *     this.focusEngine = useFocus(this.element, {
 *       // Default config for all activations of this modal
 *       initialFocus: '[data-modal-close]',
 *       onActivate: () => console.log('Focus is now trapped.'),
 *       onDeactivate: () => console.log('Focus has been released.'),
 *     });
 *   }
 *
 *   open() {
 *     this.element.hidden = false;
 *     this.focusEngine.activate();
 *   }
 *
 *   close() {
 *     this.element.hidden = true;
 *     this.focusEngine.deactivate();
 *   }
 *
 *   destroy() {
 *     this.focusEngine.destroy();
 *   }
 * }
 */
import { useFocusTrap } from './useFocusTrap.js';

const defaultConfig = {
  initialFocus: null, // Can be boolean, string selector, or HTMLElement
  returnFocus: true,
  onActivate: () => {},
  onDeactivate: () => {},
};

export const useFocus = (container, options = {}) => {
  if (!container) {
    throw new Error('useFocus requires a container element.');
  }

  const config = { ...defaultConfig, ...options };
  let isActive = false;

  // The focus engine creates and owns its underlying trap instance.
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
    // Note: Some options of the underlying trap are set at instantiation.
    // A full update might require re-instantiating the trap if needed.
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

export default useFocus;