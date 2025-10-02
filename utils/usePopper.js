/**
 * @module usePopper
 * @description A feature-rich engine to manage the lifecycle and positioning of
 * floating elements. It composes usePosition, useDismiss, and useInteractions to
 * handle all logic, providing style and attribute data to the consuming component
 * for application.
 *
 * @example
 * // In your Tooltip Component Class...
 * import { usePopper } from './utils';
 *
 * class Tooltip {
 *   constructor(trigger, popper) {
 *     this.trigger = trigger;
 *     this.popper = popper;
 *
 *     this.popperEngine = usePopper(
 *       { trigger: this.trigger, popper: this.popper },
 *       {
 *         placement: 'top',
 *         trigger: 'hover',
 *         onUpdate: (data) => this.applyPopperData(data),
 *       }
 *     );
 *   }
 *
 *   // The component is responsible for applying the data from the engine.
 *   applyPopperData({ styles, attributes, state }) {
 *     Object.assign(this.popper.style, styles.popper);
 *     Object.assign(this.trigger.attributes, attributes.trigger);
 *     this.popper.dataset.state = state; // e.g., 'open', 'closing'
 *   }
 *
 *   destroy() {
 *     this.popperEngine.destroy();
 *   }
 * }
 */
import { usePosition } from './usePosition.js';
import { useDismiss } from './useDismiss.js';
import { useInteractions } from './useInteractions.js';
import { awaitMotion } from './useMotion.js';

const defaultConfig = {
  placement: 'bottom',
  trigger: 'click', // 'click', 'hover', 'focus', 'manual'
  delay: 0, // number or [show, hide]
  interactive: false,
  onUpdate: () => {},
  onShow: () => {},
  onShown: () => {},
  onHide: () => {},
  onHidden: () => {},
  // Pass-through configs for composed engines
  position: { offset: 4, flip: true, shift: true },
  dismiss: {},
};

export const usePopper = (elements, options = {}) => {
  const { trigger, popper, arrow } = elements;
  if (!trigger || !popper) {
    throw new Error('usePopper requires a trigger and a popper element.');
  }

  const config = { ...defaultConfig, ...options };
  let state = 'closed'; // 'closed', 'opening', 'open', 'closing'
  let showTimeout, hideTimeout;

  const positionEngine = usePosition(config.position);
  const dismissEngine = useDismiss(popper, {
    exclude: [trigger],
    ...config.dismiss,
    onDismiss: () => hide(),
  });

  const getDelay = (type) => {
    const d = config.delay;
    return Array.isArray(d) ? (type === 'show' ? d[0] : d[1]) : d;
  };

  const updatePosition = () => {
    const positionData = positionEngine.compute(trigger, popper, { arrowElement: arrow });
    const data = {
      state,
      styles: {
        popper: {
          left: `${positionData.x}px`,
          top: `${positionData.y}px`,
        },
        arrow: positionData.arrow ? {
          left: `${positionData.arrow.x}px`,
          top: `${positionData.arrow.y}px`,
        } : {},
      },
      attributes: {
        popper: { 'data-placement': positionData.placement },
        trigger: { 'aria-expanded': String(state === 'open' || state === 'opening') },
      },
    };
    config.onUpdate(data);
  };

  const show = () => {
    if (state !== 'closed') return;

    clearTimeout(hideTimeout);
    showTimeout = setTimeout(async () => {
      state = 'opening';
      config.onShow();
      updatePosition();

      // Listeners must be active before animation
      dismissEngine.activate({ triggerElement: trigger });
      window.addEventListener('resize', updatePosition);

      await awaitMotion(popper);

      state = 'open';
      config.onShown();
      config.onUpdate({ state }); // Final state update
    }, getDelay('show'));
  };

  const hide = () => {
    if (state !== 'open') return;

    clearTimeout(showTimeout);
    hideTimeout = setTimeout(async () => {
      state = 'closing';
      config.onHide();
      config.onUpdate({ state }); // Update state for closing animation

      dismissEngine.deactivate();
      window.removeEventListener('resize', updatePosition);

      await awaitMotion(popper);

      state = 'closed';
      config.onHidden();
      // Final update to clear styles if needed by the component
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

  return {
    show,
    hide,
    update: updatePosition,
    destroy,
    get state() { return state; },
  };
};

export default usePopper;