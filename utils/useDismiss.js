/**
 * @module useDismiss
 * @description A feature-rich engine to detect dismissal events. It is a critical
 * utility for any temporary or layered UI, handling outside clicks, the Escape key,
 * and providing the necessary hooks for robust accessibility patterns like focus restoration.
 *
 * @example
 * // In your Dropdown Component Class...
 * import { useDismiss } from './utils';
 *
 * class Dropdown {
 *   constructor(triggerElement, contentElement) {
 *     this.trigger = triggerElement;
 *     this.content = contentElement;
 *
 *     this.dismissEngine = useDismiss(this.content, {
 *       // The engine receives the trigger on activation, but we also exclude it
 *       // from initial pointer events to be safe.
 *       exclude: [this.trigger],
 *       onDismiss: ({ trigger }) => {
 *         console.log('Dismissed!');
 *         this.hide();
 *         // CRITICAL ACCESSIBILITY WIN: The engine makes it easy to return focus.
 *         trigger?.focus();
 *       }
 *     });
 *
 *     this.trigger.addEventListener('click', () => this.toggle());
 *   }
 *
 *   show() {
 *     this.content.hidden = false;
 *     // When showing, we activate the engine and tell it what triggered the dropdown.
 *     this.dismissEngine.activate({ triggerElement: this.trigger });
 *   }
 *
 *   hide() {
 *     this.content.hidden = true;
 *     this.dismissEngine.deactivate();
 *   }
 *
 *   toggle() {
 *     this.content.hidden ? this.show() : this.hide();
 *   }
 *
 *   destroy() {
 *     this.dismissEngine.destroy();
 *   }
 * }
 */

const defaultConfig = {
  exclude: [],
  closeOnEscape: true,
  closeOnPointerDownOutside: true,
  onDismiss: () => {},
};

export const useDismiss = (element, options = {}) => {
  if (!element) {
    throw new Error('useDismiss requires an element to manage.');
  }

  const config = { ...defaultConfig, ...options };
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

    // Flatten to handle both single elements and arrays gracefully.
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

    // Use setTimeout to prevent a click that opens an element from immediately closing it.
    setTimeout(() => {
      if (!isActive) return; // Deactivated before listeners were added.
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
    destroy: deactivate, // API consistency
    get isActive() {
      return isActive;
    },
  };
};

export default useDismiss;