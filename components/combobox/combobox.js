/**
 * @file combobox.js
 * @description Combobox with proper keyboard navigation and item selection like command component.
 */

export class Combobox {
  constructor(comboboxElement, options = {}) {
    if (!comboboxElement || comboboxElement.combobox) return;

    this.element = comboboxElement;
    this.options = { ...this.defaults, ...options };

    // Find elements
    this.trigger = this.element.querySelector('.combobox-trigger');
    this.triggerText = this.element.querySelector('.combobox-trigger-text');
    this.popoverContent = this.element.querySelector('.popover-content');
    
    if (!this.trigger || !this.triggerText || !this.popoverContent) {
      console.error('Combobox missing required elements');
      return;
    }

    // State
    this.isOpen = false;
    this.selectedValue = null;
    this.filteredItems = [];
    this.selectedIndex = -1;

    this.init();
    this.element.combobox = this;
  }

  defaults = {
    placeholder: 'Select an option...',
    searchPlaceholder: 'Search...',
    emptyMessage: 'No results found.',
    items: [],
    groups: [],
    groupHeading: 'Options',
    onSelect: () => {},
    initialValue: null
  }

  init() {
    console.log('🚀 Initializing combobox with data:', {
      items: this.options.items.length,
      groups: this.options.groups.length
    });

    this.prepareData();
    this.setupUI();
    this.setupEvents();
    this.setInitialValue();
    
    this.element.classList.add('combobox-initialized');
  }

  prepareData() {
    // Convert items/groups to unified format
    if (this.options.groups && this.options.groups.length > 0) {
      this.groups = this.options.groups;
    } else if (this.options.items && this.options.items.length > 0) {
      this.groups = [{
        heading: this.options.groupHeading,
        items: this.options.items
      }];
    } else {
      this.groups = [];
    }

    // Flatten all items
    this.allItems = this.groups.flatMap(group => 
      group.type === 'separator' ? [] : (group.items || [])
    );

    console.log('📊 Data prepared:', {
      groups: this.groups.length,
      totalItems: this.allItems.length
    });
  }

  setupUI() {
    // Set placeholder
    this.triggerText.textContent = this.options.placeholder;
    this.triggerText.classList.add('combobox-trigger-placeholder');

    // Create popover content structure
    this.popoverContent.innerHTML = `
      <div class="combobox-search">
        <i data-lucide="search" class="combobox-search-icon"></i>
        <input type="text" class="combobox-search-input" placeholder="${this.options.searchPlaceholder}" autocomplete="off" role="searchbox">
      </div>
      <div class="combobox-list" role="listbox"></div>
    `;

    // Get references
    this.searchInput = this.popoverContent.querySelector('.combobox-search-input');
    this.itemsList = this.popoverContent.querySelector('.combobox-list');

    // Initialize icons
    if (window.lucide) {
      window.lucide.createIcons({ nodes: [this.popoverContent] });
    }

    // Initial render
    this.renderItems('');
  }

  setupEvents() {
    // Trigger click
    this.trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggle();
    });

    // Search input events
    this.searchInput.addEventListener('input', (e) => {
      this.renderItems(e.target.value);
      this.updateSelectionHighlight(0); // Auto-select first item
    });

    // Keyboard navigation in search input
    this.searchInput.addEventListener('keydown', (e) => {
      this.handleKeydown(e);
    });

    // Mouse leave - clear selection
    this.itemsList.addEventListener('mouseleave', () => {
      this.updateSelectionHighlight(-1);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.element.contains(e.target)) {
        this.close();
      }
    });

    // Close on escape (also handled in handleKeydown)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
        this.trigger.focus();
      }
    });
  }

  handleKeydown(e) {
    if (!this.isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const newIndexDown = Math.min(this.selectedIndex + 1, this.filteredItems.length - 1);
        this.updateSelectionHighlight(newIndexDown);
        break;

      case 'ArrowUp':
        e.preventDefault();
        const newIndexUp = Math.max(this.selectedIndex - 1, 0);
        this.updateSelectionHighlight(newIndexUp);
        break;

      case 'Enter':
        e.preventDefault();
        if (this.selectedIndex !== -1 && this.filteredItems[this.selectedIndex]) {
          this.selectItemByElement(this.filteredItems[this.selectedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        this.close();
        this.trigger.focus();
        break;
    }
  }

  renderItems(query = '') {
    const normalizedQuery = query.toLowerCase().trim();
    let html = '';
    let hasItems = false;
    this.filteredItems = []; // Reset filtered items array

    console.log('🔍 Rendering items with query:', query);

    this.groups.forEach((group, groupIndex) => {
      if (group.type === 'separator') {
        if (hasItems) {
          html += '<div class="combobox-separator"></div>';
        }
        return;
      }

      const filteredGroupItems = (group.items || []).filter(item =>
        item.label.toLowerCase().includes(normalizedQuery)
      );

      if (filteredGroupItems.length > 0) {
        // Group heading
        if (group.heading && (this.groups.length > 1 || this.groups.some(g => g.type === 'separator'))) {
          html += `<div class="combobox-group-heading">${group.heading}</div>`;
        }

        // Group items
        filteredGroupItems.forEach(item => {
          const itemIndex = this.filteredItems.length;
          this.filteredItems.push(item); // Add to filtered items for keyboard navigation

          html += `
            <div class="combobox-item" 
                 data-value="${item.id}" 
                 data-index="${itemIndex}"
                 role="option" 
                 aria-selected="false">
              ${item.icon ? `<i data-lucide="${item.icon}" class="combobox-item-icon"></i>` : ''}
              <span class="combobox-item-label">${item.label}</span>
              ${item.shortcut ? `<span class="combobox-item-shortcut">${item.shortcut}</span>` : ''}
            </div>
          `;
        });

        hasItems = true;
      }
    });

    // Empty state
    if (!hasItems) {
      html = `<div class="combobox-empty">${this.options.emptyMessage}</div>`;
    }

    this.itemsList.innerHTML = html;

    // Add event handlers to items
    this.itemsList.querySelectorAll('.combobox-item').forEach((itemEl, index) => {
      // Click handler
      itemEl.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.selectItemByElement(itemEl);
      });

      // Mouse enter handler - highlight on hover
      itemEl.addEventListener('mouseenter', () => {
        const itemIndex = parseInt(itemEl.dataset.index);
        this.updateSelectionHighlight(itemIndex);
      });
    });

    // Initialize icons for new content
    if (window.lucide) {
      window.lucide.createIcons({ nodes: [this.itemsList] });
    }

    // Reset selection
    this.selectedIndex = -1;

    console.log('✅ Rendered', hasItems ? `${this.filteredItems.length} items` : 'empty state');
  }

  updateSelectionHighlight(index) {
    this.selectedIndex = index;
    
    // Remove selection from all items
    this.itemsList.querySelectorAll('.combobox-item').forEach(itemEl => {
      itemEl.setAttribute('aria-selected', 'false');
      itemEl.classList.remove('combobox-item-selected');
    });
    
    // Highlight selected item
    if (index >= 0 && index < this.filteredItems.length) {
      const selectedElement = this.itemsList.querySelector(`[data-index="${index}"]`);
      if (selectedElement) {
        selectedElement.setAttribute('aria-selected', 'true');
        selectedElement.classList.add('combobox-item-selected');
        
        // Scroll into view if needed
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }

  selectItemByElement(itemEl) {
    const itemId = itemEl.dataset.value;
    const item = this.filteredItems.find(item => item.id === itemId);
    if (item) {
      this.selectItem(item);
    }
  }

  selectItem(item) {
    console.log('🎯 Selecting item:', item);
    
    this.selectedValue = item;
    this.triggerText.textContent = item.label;
    this.triggerText.classList.remove('combobox-trigger-placeholder');
    
    this.close();
    
    setTimeout(() => this.trigger.focus(), 100);
    
    this.options.onSelect(item);
    this.emit('select', { item });
  }

  setInitialValue() {
    if (this.options.initialValue) {
      const item = this.allItems.find(item => item.id === this.options.initialValue);
      if (item) {
        this.selectedValue = item;
        this.triggerText.textContent = item.label;
        this.triggerText.classList.remove('combobox-trigger-placeholder');
        console.log('🎯 Initial value set:', item);
      }
    }
  }

  open() {
    if (this.isOpen) return;

    console.log('📂 Opening combobox');
    
    // Close other comboboxes
    document.querySelectorAll('.combobox-initialized').forEach(el => {
      if (el !== this.element && el.combobox && el.combobox.isOpen) {
        el.combobox.close();
      }
    });

    this.isOpen = true;
    
    // Show with animation
    this.popoverContent.style.display = 'block';
    this.popoverContent.classList.add('combobox-open');
    
    // Focus search input and auto-select first item
    setTimeout(() => {
      this.searchInput.focus();
      if (this.filteredItems.length > 0) {
        this.updateSelectionHighlight(0);
      }
    }, 50);

    this.emit('open');
  }

  close() {
    if (!this.isOpen) return;

    console.log('📁 Closing combobox');
    
    this.isOpen = false;
    this.popoverContent.classList.remove('combobox-open');
    
    // Hide after animation
    setTimeout(() => {
      this.popoverContent.style.display = 'none';
      this.searchInput.value = '';
      this.renderItems('');
    }, 150);

    this.emit('close');
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  // Public API
  getValue() {
    return this.selectedValue;
  }

  clear() {
    this.selectedValue = null;
    this.triggerText.textContent = this.options.placeholder;
    this.triggerText.classList.add('combobox-trigger-placeholder');
    this.emit('clear');
  }

  selectItemById(itemId) {
    const item = this.allItems.find(item => item.id === itemId);
    if (item) {
      this.selectItem(item);
    }
  }

  updateItems(newItems) {
    this.options.items = newItems;
    this.prepareData();
    this.renderItems('');
    this.emit('update', { items: newItems });
  }

  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`combobox:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }

  destroy() {
    this.element.classList.remove('combobox-initialized');
    delete this.element.combobox;
    this.emit('destroy');
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.querySelectorAll('.combobox:not(.combobox-initialized)').forEach(el => {
      new Combobox(el);
    });
  }, 100);
});

window.Combobox = Combobox;
export default Combobox;
