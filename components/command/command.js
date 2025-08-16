/**
 * @file command.js
 * @description Optimized Command component with class-based architecture like shadcn.
 */

export class Command {
  constructor(commandElement, options = {}) {
    if (!commandElement || commandElement.command) return;

    this.element = commandElement;
    this.id = commandElement.id || `command-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };

    // Core state
    this.groupsData = this.options.groups || [];
    this.items = [];
    this.filteredItems = [];
    this.selectedIndex = -1;

    // Bound event handlers for proper cleanup
    this._boundHandlers = {
      input: (e) => this._handleInput(e),
      keydown: (e) => this._handleKeydown(e),
      mouseleave: () => this._handleMouseLeave(),
      itemClick: (item, itemData) => this._handleItemClick(item, itemData)
    };

    this.init();
    this.element.command = this;
  }

  defaults = {
    groups: [],
    onSelect: (item) => console.log('Selected:', item),
    placeholder: 'Type a command or search...',
    emptyMessage: 'No results found.',
    searchable: true,
    keyboard: true
  }

  init() {
    this.setupInitialState();
    this._render();
    this._initEventListeners();
    
    this.element.classList.add('command-initialized');
    this.emit('init', { 
      totalItems: this.items.length,
      totalGroups: this.groupsData.length 
    });
  }

  setupInitialState() {
    this.element.classList.add('command');
  }

  _render() {
    this.element.innerHTML = `
      <div class="command-input-wrapper">
        <i data-lucide="search" class="command-search-icon"></i>
        <input class="command-input" 
               placeholder="${this.options.placeholder}" 
               autocomplete="off" 
               autocorrect="off" 
               spellcheck="false">
      </div>
      <div class="command-list js-scroll-area"></div>
    `;

    // Cache DOM elements
    this.input = this.element.querySelector('.command-input');
    this.list = this.element.querySelector('.command-list');
    
    this._renderListContent();
    this._renderEmptyState();

    // Initialize Lucide icons if available
    if (window.lucide) {
      window.lucide.createIcons({ nodes: [this.element] });
    }
  }

  _renderListContent() {
    this.groupsData.forEach(groupData => {
      if (groupData.type === 'separator') {
        const separatorEl = document.createElement('div');
        separatorEl.className = 'command-separator';
        this.list.appendChild(separatorEl);
        return;
      }
      
      const groupEl = document.createElement('div');
      groupEl.className = 'command-group';
      
      const headingEl = document.createElement('div');
      headingEl.className = 'command-group-heading';
      headingEl.textContent = groupData.heading;
      groupEl.appendChild(headingEl);
      
      groupData.items.forEach(itemData => {
        const itemEl = document.createElement('div');
        itemEl.className = 'command-item';
        itemEl.dataset.id = itemData.id;
        itemEl.setAttribute('role', 'option');
        itemEl.setAttribute('aria-selected', 'false');
        
        itemEl.innerHTML = `
          <i data-lucide="${itemData.icon}" class="command-item-icon"></i>
          <span>${itemData.label}</span>
          ${itemData.shortcut ? `<div class="command-shortcut">${itemData.shortcut}</div>` : ''}
        `;
        
        // Store item data for event handling
        itemEl._itemData = itemData;
        groupEl.appendChild(itemEl);
      });
      
      this.list.appendChild(groupEl);
    });
  }

  _renderEmptyState() {
    const emptyEl = document.createElement('div');
    emptyEl.className = 'command-empty';
    emptyEl.textContent = this.options.emptyMessage;
    emptyEl.style.display = 'none';
    this.list.appendChild(emptyEl);
  }

  _initEventListeners() {
    // Cache items after rendering
    this.items = Array.from(this.element.querySelectorAll('.command-item'));
    
    // Setup accessibility
    this.element.setAttribute('role', 'combobox');
    this.element.setAttribute('aria-expanded', 'true');
    this.input.setAttribute('role', 'searchbox');
    this.list.setAttribute('role', 'listbox');

    // Input events
    if (this.options.searchable) {
      this.input.addEventListener('input', this._boundHandlers.input);
    }
    
    if (this.options.keyboard) {
      this.input.addEventListener('keydown', this._boundHandlers.keydown);
    }

    // Mouse events
    this.list.addEventListener('mouseleave', this._boundHandlers.mouseleave);
    
    this.items.forEach(item => {
      // Click events
      item.addEventListener('click', () => {
        this._boundHandlers.itemClick(item, item._itemData);
      });

      // Hover events
      item.addEventListener('mouseenter', () => {
        const index = this.filteredItems.indexOf(item);
        if (index > -1) this._updateSelectionHighlight(index);
      });
    });

    // Initial filter to set up filteredItems
    this._filter('');
  }

  _handleInput(e) {
    this._filter(e.target.value);
    this.emit('search', { query: e.target.value, results: this.filteredItems.length });
  }

  _handleKeydown(e) {
    if (!['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.key)) return;
    e.preventDefault();

    switch (e.key) {
      case 'ArrowDown':
        this._navigateDown();
        break;
      case 'ArrowUp':
        this._navigateUp();
        break;
      case 'Enter':
        this._selectCurrent();
        break;
      case 'Escape':
        this.close();
        break;
    }
  }

  _handleMouseLeave() {
    this._updateSelectionHighlight(-1);
  }

  _handleItemClick(item, itemData) {
    this.emit('select', { item: itemData, element: item });
    if (this.options.onSelect) {
      this.options.onSelect(itemData);
    }
  }

  _navigateDown() {
    const newIndex = Math.min(this.selectedIndex + 1, this.filteredItems.length - 1);
    this._updateSelectionHighlight(newIndex);
  }

  _navigateUp() {
    const newIndex = Math.max(this.selectedIndex - 1, 0);
    this._updateSelectionHighlight(newIndex);
  }

  _selectCurrent() {
    if (this.selectedIndex !== -1 && this.filteredItems[this.selectedIndex]) {
      this.filteredItems[this.selectedIndex].click();
    }
  }

  _filter(query) {
    const normalizedQuery = query.toLowerCase().trim();
    const emptyState = this.element.querySelector('.command-empty');
    let hasVisibleItems = false;
    const visibleGroups = [];

    this.element.querySelectorAll('.command-group').forEach(groupEl => {
      let groupHasVisibleItems = false;
      
      groupEl.querySelectorAll('.command-item').forEach(itemEl => {
        const isVisible = itemEl.textContent.toLowerCase().includes(normalizedQuery);
        itemEl.style.display = isVisible ? '' : 'none';
        if (isVisible) {
          groupHasVisibleItems = true;
          hasVisibleItems = true;
        }
      });
      
      groupEl.style.display = groupHasVisibleItems ? '' : 'none';
      if (groupHasVisibleItems) visibleGroups.push(groupEl);
    });

    // Handle separators
    this.element.querySelectorAll('.command-separator').forEach(separatorEl => {
      const nextGroup = separatorEl.nextElementSibling;
      separatorEl.style.display = (nextGroup && visibleGroups.includes(nextGroup) && nextGroup !== visibleGroups[0]) ? '' : 'none';
    });

    // Update empty state
    emptyState.style.display = hasVisibleItems ? 'none' : 'block';
    
    // Update filtered items and selection
    this.filteredItems = this.items.filter(item => item.style.display !== 'none');
    this._updateSelectionHighlight(this.filteredItems.length > 0 ? 0 : -1);
  }

  _updateSelectionHighlight(index) {
    this.selectedIndex = index;
    
    this.items.forEach((item, i) => {
      const isSelected = this.filteredItems[this.selectedIndex] === item;
      item.setAttribute('aria-selected', isSelected);
    });
    
    if (this.selectedIndex > -1 && this.filteredItems[this.selectedIndex]) {
      this.filteredItems[this.selectedIndex].scrollIntoView({ 
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }

  // Public API methods
  search(query) {
    this.input.value = query;
    this._filter(query);
  }

  focus() {
    this.input.focus();
  }

  close() {
    this.emit('close');
  }

  updateGroups(newGroups) {
    this.groupsData = newGroups;
    this.options.groups = newGroups;
    
    // Clear current content
    this.list.innerHTML = '';
    
    // Re-render
    this._renderListContent();
    this._renderEmptyState();
    this._initEventListeners();

    // Re-initialize icons
    if (window.lucide) {
      window.lucide.createIcons({ nodes: [this.element] });
    }

    this.emit('update', { groups: newGroups });
  }

  getSelectedItem() {
    if (this.selectedIndex === -1 || !this.filteredItems[this.selectedIndex]) {
      return null;
    }
    return this.filteredItems[this.selectedIndex]._itemData;
  }

  selectItem(itemId) {
    const item = this.items.find(item => item.dataset.id === itemId);
    if (item && item.style.display !== 'none') {
      item.click();
    }
  }

  // Custom event system
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`command:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }

  // Cleanup method
  destroy() {
    // Remove event listeners
    this.input.removeEventListener('input', this._boundHandlers.input);
    this.input.removeEventListener('keydown', this._boundHandlers.keydown);
    this.list.removeEventListener('mouseleave', this._boundHandlers.mouseleave);

    // Clean up DOM
    this.element.classList.remove('command-initialized');
    delete this.element.command;

    this.emit('destroy');
  }
}

// Auto-initialize commands on the page
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.command:not(.command-initialized)').forEach(el => {
    // Only auto-initialize if it has the basic structure or data attribute
    if (el.hasAttribute('data-command') || el.querySelector('.command-input, .command-list')) {
      el.command = new Command(el);
    }
  });
});

export default Command;
