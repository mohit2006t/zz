/**
 * @module useModal
 * @description An un-opinionated engine for orchestrating modal behavior. It is not
 * a component. It manages state, composes other utility engines (focus, dismiss, scroll),
 * and provides lifecycle callbacks for a component to hook into.
 *
 * @example
 * // In your Modal Component Class...
 * import { useModal } from './utils';
 *
 * class ModalComponent {
 *   constructor(element) {
 *     this.element = element; // The main container element
 *     this.dialog = element.querySelector('[role="dialog"]');
 *     this.trigger = document.querySelector(`[aria-controls="${element.id}"]`);
 *
 *     this.modalEngine = useModal(
 *       { container: this.element, dialog: this.dialog },
 *       {
 *         onHidden: () => console.log('Modal is now fully closed and hidden.'),
 *         // The dismiss engine needs to know not to fire when the trigger is clicked.
 *         dismiss: { exclude: [this.trigger] }
 *       }
 *     );
 *
 *     this.trigger.addEventListener('click', () => this.show());
 *   }
 *
 *   show() {
 *     // The component tells the engine to start the show sequence.
 *     // The engine handles all the complex logic.
 *     this.modalEngine.show({ triggerElement: this.trigger });
 *   }
 *
 *   hide() {
 *     this.modalEngine.hide();
 *   }
 *
 *   destroy() {
 *     this.modalEngine.destroy();
 *   }
 * }
 */
import { useState } from './useState.js';
import { useFocus } from './useFocus.js';
import { useDismiss } from './useDismiss.js';
import { useScroll } from './useScroll.js';
import { awaitMotion } from './useMotion.js';

const defaultConfig = {
  openingClass: 'is-opening',
  shownClass: 'is-shown',
  closingClass: 'is-closing',
  onShow: () => {},
  onShown: () => {},
  onHide: () => {},
  onHidden: () => {},
  // Allow passing config to composed engines
  focus: {},
  dismiss: {},
  scrollLock: {},
};

export const useModal = (elements, options = {}) => {
  const { container, dialog } = elements;
  if (!container || !dialog) {
    throw new Error('useModal requires a container and a dialog element.');
  }

  const config = { ...defaultConfig, ...options };
  const state = useState('closed'); // 'closed', 'opening', 'open', 'closing'

  const focusEngine = useFocus(dialog, config.focus);
  const scrollLockEngine = useScroll.lock(config.scrollLock);
  const dismissEngine = useDismiss(dialog, {
    ...config.dismiss,
    onDismiss: ({ trigger }) => hide({ triggerElement: trigger }),
  });

  const show = async ({ triggerElement } = {}) => {
    if (state.get() !== 'closed') return;

    state.set('opening');
    config.onShow();
    scrollLockEngine.lock();

    container.hidden = false;
    container.classList.add(config.openingClass);
    requestAnimationFrame(() => {
      container.classList.add(config.shownClass);
    });

    await awaitMotion(container);

    container.classList.remove(config.openingClass);
    state.set('open');
    focusEngine.activate({ initialFocus: triggerElement });
    dismissEngine.activate({ triggerElement });
    config.onShown();
  };

  const hide = async ({ triggerElement } = {}) => {
    if (state.get() !== 'open') return;

    state.set('closing');
    config.onHide();

    // Deactivate engines first to prevent race conditions
    dismissEngine.deactivate();
    focusEngine.deactivate(); // This will handle focus restoration

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
    // Ensure cleanup even if the modal is open
    container.hidden = true;
    focusEngine.destroy();
    scrollLockEngine.destroy();
    dismissEngine.destroy();
    state.destroy();
  };

  return {
    show,
    hide,
    destroy,
    get state() {
      return state.get();
    },
    get isVisible() {
      const current = state.get();
      return current === 'open' || current === 'opening';
    },
  };
};

export default useModal;