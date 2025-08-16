/**
 * @file toggle-group.js
 * @description Optimized ToggleGroup with class-based architecture.
 */

export class ToggleGroup {
  constructor(toggleGroupElement, options = {}) {
    if (!toggleGroupElement || toggleGroupElement.toggleGroup) return;

    this.element = toggleGroupElement;
    this.id = toggleGroupElement.id || `toggle-group-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };

    // Core elements
    this.items = Array.from(this.element.querySelectorAll('.toggle-group-item'));
    
    if (this.items.length === 0) {
      console.error('ToggleGroup missing required elements: .toggle-group-item', this.element);
      return;
    }

    // State
    this.isSingleSelection = this.element.classList.contains('toggle-group-single');
    this.isDisabled = this.element.classList.contains('toggle-group-disabled');

    // Bound event handlers for proper cleanup
    this._boundHandlers = {
      click: (e) => this._handleClick(e)
    };

    this.init();
    this.element.toggleGroup = this;
  }

  defaults = {
    onToggle: () => {},
    onSelectionChange: () => {}
  }

  init() {
    if (this.isDisabled) return;

    this.setupStructure();
    this.setupEvents();
    
    this.element.classList.add('toggle-group-initialized');
    this.emit('init');
  }

  setupStructure() {
    // Ensure proper ARIA attributes
    this.element.setAttribute('role', this.isSingleSelection ? 'radiogroup' : 'group');
    
    this.items.forEach((item, index) => {
      item.setAttribute('role', this.isSingleSelection ? 'radio' : 'button');
      item.setAttribute('aria-pressed', item.classList.contains('toggle-group-item-on').toString());
      
      if (!item.id) {
        item.id = `${this.id}-item-${index}`;
      }
    });
  }

  setupEvents() {
    this.element.addEventListener('click', this._boundHandlers.click);
  }

  _handleClick(e) {
    if (this.isDisabled) return;

    const clickedItem = e.target.closest('.toggle-group-item');
    if (!clickedItem) return;

    this._toggleItem(clickedItem);
  }

  _toggleItem(clickedItem) {
    const isOn = clickedItem.classList.contains('toggle-group-item-on');
    const previousSelection = this.getSelectedItems();

    if (this.isSingleSelection) {
      // In single selection mode, if the clicked item is already on, do nothing.
      if (isOn) {
        return;
      }
      
      // Turn off all other items in the group.
      this.items.forEach(item => {
        item.classList.remove('toggle-group-item-on');
        item.setAttribute('aria-pressed', 'false');
      });
      
      // Turn on the clicked item.
      clickedItem.classList.add('toggle-group-item-on');
      clickedItem.setAttribute('aria-pressed', 'true');
    } else {
      // For multiple selection, just toggle the individual item's 'on' class.
      clickedItem.classList.toggle('toggle-group-item-on');
      clickedItem.setAttribute('aria-pressed', (!isOn).toString());
    }

    const newSelection = this.getSelectedItems();
    
    // Trigger callbacks and events
    this.options.onToggle(clickedItem, !isOn);
    this.options.onSelectionChange(newSelection, previousSelection);
    
    this.emit('toggle', { 
      item: clickedItem, 
      pressed: !isOn,
      selection: newSelection,
      previousSelection 
    });
  }

  // Public API methods
  selectItem(itemOrIndex) {
    const item = this._findItem(itemOrIndex);
    if (item && !item.classList.contains('toggle-group-item-on')) {
      this._toggleItem(item);
    }
  }

  deselectItem(itemOrIndex) {
    const item = this._findItem(itemOrIndex);
    if (item && item.classList.contains('toggle-group-item-on')) {
      if (this.isSingleSelection) {
        // In single selection mode, we can only deselect if we're selecting another
        return;
      }
      this._toggleItem(item);
    }
  }

  toggleItem(itemOrIndex) {
    const item = this._findItem(itemOrIndex);
    if (item) {
      this._toggleItem(item);
    }
  }

  getSelectedItems() {
    return this.items.filter(item => item.classList.contains('toggle-group-item-on'));
  }

  getSelectedValues() {
    return this.getSelectedItems().map(item => item.dataset.value || item.textContent.trim());
  }

  clearSelection() {
    this.items.forEach(item => {
      item.classList.remove('toggle-group-item-on');
      item.setAttribute('aria-pressed', 'false');
    });
    
    this.options.onSelectionChange([], this.getSelectedItems());
    this.emit('selection-clear');
  }

  setSelection(itemsOrIndices) {
    this.clearSelection();
    
    if (this.isSingleSelection && itemsOrIndices.length > 1) {
      console.warn('ToggleGroup: Single selection mode allows only one item');
      itemsOrIndices = [itemsOrIndices[0]];
    }
    
    itemsOrIndices.forEach(itemOrIndex => {
      this.selectItem(itemOrIndex);
    });
  }

  enable() {
    this.isDisabled = false;
    this.element.classList.remove('toggle-group-disabled');
    this.setupEvents();
  }

  disable() {
    this.isDisabled = true;
    this.element.classList.add('toggle-group-disabled');
    this.element.removeEventListener('click', this._boundHandlers.click);
  }

  setSingleSelection(single) {
    this.isSingleSelection = single;
    
    if (single) {
      this.element.classList.add('toggle-group-single');
      this.element.setAttribute('role', 'radiogroup');
      
      // If multiple items are selected, keep only the first one
      const selectedItems = this.getSelectedItems();
      if (selectedItems.length > 1) {
        this.clearSelection();
        this.selectItem(selectedItems[0]);
      }
      
      // Update ARIA roles
      this.items.forEach(item => {
        item.setAttribute('role', 'radio');
      });
    } else {
      this.element.classList.remove('toggle-group-single');
      this.element.setAttribute('role', 'group');
      
      // Update ARIA roles
      this.items.forEach(item => {
        item.setAttribute('role', 'button');
      });
    }
  }

  _findItem(itemOrIndex) {
    if (typeof itemOrIndex === 'number') {
      return this.items[itemOrIndex];
    } else if (typeof itemOrIndex === 'string') {
      return this.items.find(item => 
        item.id === itemOrIndex || 
        item.dataset.value === itemOrIndex
      );
    } else {
      return this.items.find(item => item === itemOrIndex);
    }
  }

  getItemCount() {
    return this.items.length;
  }

  isItemSelected(itemOrIndex) {
    const item = this._findItem(itemOrIndex);
    return item ? item.classList.contains('toggle-group-item-on') : false;
  }

  // Custom event system
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`toggle-group:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }

  // Cleanup method
  destroy() {
    // Remove event listeners
    this.element.removeEventListener('click', this._boundHandlers.click);

    // Clean up DOM
    this.element.classList.remove('toggle-group-initialized');
    delete this.element.toggleGroup;

    this.emit('destroy');
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.toggle-group:not(.toggle-group-initialized):not(.toggle-group-disabled)').forEach(el => {
    new ToggleGroup(el);
  });
});

export default ToggleGroup;
