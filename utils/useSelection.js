/**
 * @module useSelection
 * @description A feature-rich state management engine for handling item selection.
 * It is un-opinionated about the UI and provides a robust API to manage single or
 * multiple selection modes, including keyboard modifiers (Shift & Ctrl/Cmd), while
 * automatically handling ARIA attributes.
 *
 * @example
 * // In your Listbox Component Class...
 * import { useSelection } from './utils';
 *
 * class Listbox {
 *   constructor(element) {
 *     this.element = element;
 *     this.items = Array.from(element.children);
 *
 *     this.selectionEngine = useSelection(this.items, {
 *       mode: 'multiple',
 *       isDisabled: (item) => item.hasAttribute('data-disabled'),
 *       onSelectionChange: ({ selection }) => {
 *         // The component receives the new selection state and updates its view.
 *         console.log(`${selection.length} items selected`);
 *         this.updateVisuals(selection);
 *       }
 *     });
 *   }
 *
 *   updateVisuals(selectedItems) {
 *      this.items.forEach(item => {
 *          item.classList.toggle('is-selected', selectedItems.includes(item));
 *      });
 *   }
 *
 *   destroy() {
 *     this.selectionEngine.destroy();
 *   }
 * }
 */

const defaultConfig = {
  mode: 'single', // 'single' or 'multiple'
  initialSelected: [],
  onSelectionChange: () => {},
  isDisabled: (item) => false,
};

export const useSelection = (initialItems = [], options = {}) => {
  const config = { ...defaultConfig, ...options };
  let items = [...initialItems];
  const selected = new Set();
  let lastManuallySelectedItem = null;

  const updateItemAria = (item) => {
    item.setAttribute('aria-selected', String(selected.has(item)));
  };

  const notify = () => {
    const selection = Array.from(selected);
    config.onSelectionChange({ selection, lastSelected: lastManuallySelectedItem });
  };

  const clear = () => {
    if (selected.size === 0) return;
    selected.forEach(item => {
      selected.delete(item);
      updateItemAria(item);
    });
    lastManuallySelectedItem = null;
    notify();
  };
  
  const select = (item) => {
    if (config.isDisabled(item) || selected.has(item)) return;
    if (config.mode === 'single') clear();

    selected.add(item);
    updateItemAria(item);
    lastManuallySelectedItem = item;
    notify();
  };

  const deselect = (item) => {
    if (!selected.has(item)) return;
    selected.delete(item);
    updateItemAria(item);
    lastManuallySelectedItem = null; // Can't shift-select from a deselected item
    notify();
  };
  
  const toggle = (item) => (selected.has(item) ? deselect(item) : select(item));
  
  const selectAll = () => {
    if (config.mode !== 'multiple') return;
    items.forEach(item => {
      if (!config.isDisabled(item)) {
        selected.add(item);
        updateItemAria(item);
      }
    });
    notify();
  };
  
  const replace = (newSelection) => {
      clear();
      newSelection.forEach(select);
  };

  const handlePointerDown = (event) => {
    const item = event.target.closest(items[0]?.tagName);
    if (!item || !items.includes(item) || config.isDisabled(item)) return;

    const { shiftKey, ctrlKey, metaKey } = event;
    const isMultiKey = ctrlKey || metaKey;
    
    if (config.mode === 'multiple' && shiftKey && lastManuallySelectedItem) {
        event.preventDefault();
        const lastIdx = items.indexOf(lastManuallySelectedItem);
        const currentIdx = items.indexOf(item);
        const start = Math.min(lastIdx, currentIdx);
        const end = Math.max(lastIdx, currentIdx);
        const range = items.slice(start, end + 1);
        
        if (!isMultiKey) clear();
        range.forEach(select);

    } else if (config.mode === 'multiple' && isMultiKey) {
        toggle(item);
    } else {
        clear();
        select(item);
    }
  };

  // Initial setup
  items.forEach(item => item.setAttribute('aria-selected', 'false'));
  config.initialSelected.forEach(select);
  
  // The engine expects the consuming component to add the event listener,
  // but provides the handler for it to use.
  const getContainerProps = () => ({ onPointerDown: handlePointerDown });

  return {
    select,
    deselect,
    toggle,
    selectAll,
    clear,
    replace,
    isSelected: (item) => selected.has(item),
    setItems: (newItems) => { items = [...newItems]; },
    destroy: clear,
    get selected() { return Array.from(selected); },
    // A helper for easy integration
    getContainerProps,
  };
};

export default useSelection;