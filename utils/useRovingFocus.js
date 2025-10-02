/**
 * @module useRovingFocus
 * @description A comprehensive engine for managing focus in a collection of items,
 * implementing the "roving tabindex" pattern. It handles dynamic/disabled items,
 * arrow key navigation, and typeahead search. It is a pure engine that only manages
 * tabindex and focus.
 *
 * @example
 * // In your Menu Component Class...
 * import { useRovingFocus } from './utils';
 *
 * class Menu {
 *   constructor(element) {
 *     this.element = element;
 *     this.rovingFocusEngine = useRovingFocus(this.element, {
 *       searchable: true,
 *       onFocusChange: (item, index) => {
 *         // The component, not the engine, updates its state and appearance.
 *         console.log(`Focus moved to ${item.textContent} at index ${index}`);
 *         this.updateActiveDescendant(item.id);
 *       },
 *       isDisabled: (item) => item.hasAttribute('aria-disabled'),
 *     });
 *   }
 *
 *   // If menu items are added/removed, tell the engine to update its internal list.
 *   updateMenuItems() {
 *     this.rovingFocusEngine.refresh();
 *   }
 *
 *   destroy() {
 *     this.rovingFocusEngine.destroy();
 *   }
 * }
 */

const defaultConfig = {
  orientation: 'vertical',
  wrap: true,
  initialIndex: 0,
  searchable: false,
  searchTimeout: 500,
  itemSelector: '[role="menuitem"], [role="option"], [role="tab"]',
  onFocusChange: () => {},
  isDisabled: (item) => item.disabled || item.getAttribute('aria-disabled') === 'true',
};

export const useRovingFocus = (container, options = {}) => {
  if (!container) throw new Error('useRovingFocus requires a container element.');

  const config = { ...defaultConfig, ...options };
  let items = [];
  let currentIndex = -1;
  let searchQuery = '';
  let searchTimeout = null;

  const findNextFocusableIndex = (startIndex, direction) => {
    const len = items.length;
    let i = (startIndex + direction + len) % len;
    for (let j = 0; j < len; j++) {
      if (!config.isDisabled(items[i])) return i;
      i = (i + direction + len) % len;
    }
    return -1; // No focusable items
  };

  const focusItemByIndex = (index) => {
    if (index === -1 || index === currentIndex) return;

    if (currentIndex > -1 && items[currentIndex]) {
      items[currentIndex].setAttribute('tabindex', '-1');
    }

    const newItem = items[index];
    if (newItem) {
      newItem.setAttribute('tabindex', '0');
      newItem.focus();
      currentIndex = index;
      config.onFocusChange(newItem, index);
    }
  };

  const handleSearch = (key) => {
    clearTimeout(searchTimeout);
    searchQuery += key.toLowerCase();
    searchTimeout = setTimeout(() => { searchQuery = ''; }, config.searchTimeout);

    const orderedItems = [...items.slice(currentIndex + 1), ...items.slice(0, currentIndex + 1)];
    const foundItem = orderedItems.find(item =>
      !config.isDisabled(item) && item.textContent.trim().toLowerCase().startsWith(searchQuery)
    );

    if (foundItem) {
      focusItemByIndex(items.indexOf(foundItem));
    }
  };

  const handleKeyDown = (e) => {
    const keyMap = {
      'ArrowUp': config.orientation !== 'horizontal' ? -1 : 0,
      'ArrowDown': config.orientation !== 'horizontal' ? 1 : 0,
      'ArrowLeft': config.orientation !== 'vertical' ? -1 : 0,
      'ArrowRight': config.orientation !== 'vertical' ? 1 : 0,
    };

    const direction = keyMap[e.key] || 0;

    if (direction) {
      e.preventDefault();
      const nextIndex = findNextFocusableIndex(currentIndex, direction);
      focusItemByIndex(nextIndex);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusItemByIndex(findNextFocusableIndex(-1, 1));
    } else if (e.key === 'End') {
      e.preventDefault();
      focusItemByIndex(findNextFocusableIndex(items.length, -1));
    } else if (config.searchable && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      handleSearch(e.key);
    }
  };
  
  const handleClick = (e) => {
      const item = e.target.closest(config.itemSelector);
      if(item && items.includes(item) && !config.isDisabled(item)) {
          focusItemByIndex(items.indexOf(item));
      }
  };

  const refresh = () => {
    items = Array.from(container.querySelectorAll(config.itemSelector));
    items.forEach(item => item.setAttribute('tabindex', '-1'));
    
    let initial = Math.min(Math.max(0, config.initialIndex), items.length - 1);
    let focusableIndex = items.findIndex((item, i) => i >= initial && !config.isDisabled(item));
    if (focusableIndex === -1) { // If no focusable after initial, check from start
        focusableIndex = items.findIndex(item => !config.isDisabled(item));
    }
    
    currentIndex = -1; // Force update
    focusItemByIndex(focusableIndex);
  };
  
  container.addEventListener('keydown', handleKeyDown);
  container.addEventListener('click', handleClick);

  refresh(); // Initial setup

  return {
    refresh,
    focusNext: () => focusItemByIndex(findNextFocusableIndex(currentIndex, 1)),
    focusPrev: () => focusItemByIndex(findNextFocusableIndex(currentIndex, -1)),
    focusFirst: () => focusItemByIndex(findNextFocusableIndex(-1, 1)),
    focusLast: () => focusItemByIndex(findNextFocusableIndex(items.length, -1)),
    focusItem: (item) => focusItemByIndex(items.indexOf(item)),
    destroy: () => {
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('click', handleClick);
      clearTimeout(searchTimeout);
    },
    get activeItem() { return items[currentIndex] || null; }
  };
};

export default useRovingFocus;