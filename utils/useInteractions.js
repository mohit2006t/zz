/**
 * @module useInteractions
 * @description A feature-rich engine for managing a comprehensive set of UI
 * interactions, including hover, focus, press (mouse & keyboard), and long press.
 * It provides detailed state updates to empower fully accessible and dynamic components.
 *
 * @example
 * // In your Custom Button Component Class...
 * import { useInteractions } from './utils';
 *
 * class CustomButton {
 *   constructor(element) {
 *     this.element = element;
 *     this.state = {}; // Internal state for our component
 *
 *     this.interactionsEngine = useInteractions(this.element, {
 *       longPressDelay: 500,
 *       onChange: (newState) => {
 *         // The engine gives us the state; the component decides what to do.
 *         this.updateAppearance(newState);
 *       },
 *       onLongPress: () => {
 *         console.log('Long press detected!');
 *         // e.g., show a context menu
 *       }
 *     });
 *
 *     this.interactionsEngine.activate();
 *   }
 *
 *   updateAppearance(state) {
 *     this.state = state;
 *     this.element.classList.toggle('is-hovered', state.isHovered);
 *     this.element.classList.toggle('is-focused', state.isFocused);
 *     this.element.classList.toggle('is-pressed', state.isPressed);
 *     this.element.setAttribute('aria-pressed', state.isPressed);
 *   }
 *
 *   disable() {
 *     this.interactionsEngine.update({ isDisabled: true });
 *     this.element.setAttribute('aria-disabled', 'true');
 *   }
 *
 *   destroy() {
 *     this.interactionsEngine.destroy();
 *   }
 * }
 */

const defaultConfig = {
  isDisabled: false,
  longPressDelay: 0,
  onChange: () => {},
  onLongPress: () => {},
};

export const useInteractions = (element, options = {}) => {
  if (!element) {
    throw new Error('useInteractions requires an element to manage.');
  }

  const config = { ...defaultConfig, ...options };
  let isActive = false;
  let longPressTimeout = null;

  let state = {
    isHovered: false,
    isFocused: false,
    isPressed: false,
    isLongPressed: false,
  };

  const updateState = (updates) => {
    const oldState = { ...state };
    const newState = { ...state, ...updates };

    // Only notify if the state has actually changed.
    if (JSON.stringify(oldState) !== JSON.stringify(newState)) {
      state = newState;
      config.onChange(state);
    }
  };

  const handlePointerEnter = () => updateState({ isHovered: true });
  const handlePointerLeave = () => {
    clearTimeout(longPressTimeout);
    updateState({ isHovered: false, isPressed: false, isLongPressed: false });
  };
  const handleFocus = () => updateState({ isFocused: true });
  const handleBlur = () => updateState({ isFocused: false, isPressed: false });

  const handlePointerDown = (event) => {
    if (event.button !== 0) return; // Only main button
    updateState({ isPressed: true });

    if (config.longPressDelay > 0) {
      longPressTimeout = setTimeout(() => {
        updateState({ isLongPressed: true });
        config.onLongPress(event);
      }, config.longPressDelay);
    }
  };

  const handlePointerUp = () => {
    clearTimeout(longPressTimeout);
    updateState({ isPressed: false, isLongPressed: false });
  };
  
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      if (event.repeat) return;
      event.preventDefault();
      updateState({ isPressed: true });
    }
  };

  const handleKeyUp = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      updateState({ isPressed: false });
    }
  };

  const events = {
    pointerenter: handlePointerEnter,
    pointerleave: handlePointerLeave,
    pointerdown: handlePointerDown,
    pointerup: handlePointerUp,
    focus: handleFocus,
    blur: handleBlur,
    keydown: handleKeyDown,
    keyup: handleKeyUp,
  };

  const activate = () => {
    if (isActive || config.isDisabled) return;
    isActive = true;
    for (const [eventName, handler] of Object.entries(events)) {
      element.addEventListener(eventName, handler);
    }
  };

  const deactivate = () => {
    if (!isActive) return;
    isActive = false;
    clearTimeout(longPressTimeout);
    for (const [eventName, handler] of Object.entries(events)) {
      element.removeEventListener(eventName, handler);
    }
    // Reset to initial state
    updateState({ isHovered: false, isFocused: false, isPressed: false, isLongPressed: false });
  };
  
  const update = (newOptions) => {
    const wasDisabled = config.isDisabled;
    Object.assign(config, newOptions);

    if (config.isDisabled && !wasDisabled) {
      deactivate();
    } else if (!config.isDisabled && wasDisabled) {
      activate();
    }
  };

  return {
    activate,
    deactivate,
    update,
    destroy: deactivate,
    get state() {
      return { ...state }; // Return a copy to prevent mutation
    },
  };
};

export default useInteractions;