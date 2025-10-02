/**
 * @module useKeyboard
 * @description A comprehensive keyboard command engine. It manages hotkey combos,
 * sequences, active key states, and contextual listening. It's designed to be a
 * central hub for all keyboard interactions in a complex web application.
 *
 * @example
 * // In your main Application Class...
 * import { useKeyboard } from './utils';
 *
 * class App {
 *   constructor() {
 *     this.keyboardEngine = useKeyboard({
 *       hotkeys: [
 *         { keys: 'ctrl+s', handler: (e) => this.save(e), preventDefault: true },
 *         { keys: 'p', handler: () => this.showCommandPalette() },
 *         { keys: 'g i', handler: () => this.goToInbox(), sequenceTimeout: 1000 },
 *         { keys: 'escape', type: 'keyup', handler: () => this.closeAllModals() }
 *       ],
 *       target: document.documentElement // Listen globally
 *     });
 *
 *     this.keyboardEngine.activate();
 *   }
 *
 *   save(event) {
 *     event.preventDefault(); // Handler has full control
 *     console.log('Saving...');
 *   }
 *
 *   destroy() {
 *     this.keyboardEngine.destroy();
 *   }
 * }
 */

const defaultConfig = {
  target: document,
  hotkeys: [],
  ignoreInputs: true,
  sequenceTimeout: 500,
  onKeyDown: () => {},
  onKeyUp: () => {},
};

const KEY_MAP = { ' ': 'space', 'Control': 'ctrl', 'Meta': 'cmd', 'Alt': 'alt', 'Shift': 'shift' };

export const useKeyboard = (options = {}) => {
  const config = { ...defaultConfig, ...options };
  let isActive = false;
  const pressedKeys = new Set();
  let sequence = [];
  let sequenceTimer = null;

  const normalizeKey = (key) => KEY_MAP[key] || key.toLowerCase();

  const buildKeyStringFromEvent = (event) => {
    const modifiers = [];
    if (event.ctrlKey) modifiers.push('ctrl');
    if (event.metaKey) modifiers.push('cmd');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');
    
    const key = normalizeKey(event.key);
    if (!modifiers.includes(key)) {
      modifiers.push(key);
    }
    return modifiers.sort().join('+');
  };

  const handleEvent = (event, eventType) => {
    if (config.ignoreInputs && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
      return;
    }
    
    const eventKey = normalizeKey(event.key);
    if (eventType === 'keydown') {
      pressedKeys.add(eventKey);
      clearTimeout(sequenceTimer);
      sequence.push(eventKey);
      sequenceTimer = setTimeout(() => { sequence = []; }, config.sequenceTimeout);
    } else {
      pressedKeys.delete(eventKey);
    }

    const currentCombo = buildKeyStringFromEvent(event);
    const currentSequence = sequence.join(' ');

    for (const hotkey of config.hotkeys) {
      const triggerType = hotkey.type || 'keydown';
      if (triggerType !== eventType) continue;

      if (hotkey.keys === currentCombo || hotkey.keys === currentSequence) {
        if (hotkey.preventDefault !== false) {
          event.preventDefault();
        }
        hotkey.handler(event);
        if (hotkey.keys === currentSequence) { // Reset sequence after match
            sequence = []; 
        }
      }
    }
    
    if (eventType === 'keydown') config.onKeyDown(event);
    if (eventType === 'keyup') config.onKeyUp(event);
  };

  const handleKeyDown = (e) => handleEvent(e, 'keydown');
  const handleKeyUp = (e) => handleEvent(e, 'keyup');

  const activate = () => {
    if (isActive) return;
    isActive = true;
    config.target.addEventListener('keydown', handleKeyDown);
    config.target.addEventListener('keyup', handleKeyUp);
  };

  const deactivate = () => {
    if (!isActive) return;
    isActive = false;
    config.target.removeEventListener('keydown', handleKeyDown);
    config.target.removeEventListener('keyup', handleKeyUp);
    pressedKeys.clear();
    sequence = [];
    clearTimeout(sequenceTimer);
  };

  const update = (newOptions) => {
    Object.assign(config, newOptions);
  };

  return {
    activate,
    deactivate,
    update,
    destroy: deactivate,
    get pressedKeys() {
      return new Set(pressedKeys); // Return a copy for safety
    },
  };
};

export default useKeyboard;