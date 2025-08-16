/**
 * @file tabs.js
 * @description Optimized Tabs with class-based architecture.
 */

export class Tabs {
  constructor(tabsElement, options = {}) {
    if (!tabsElement || tabsElement.tabs) return;

    this.element = tabsElement;
    this.id = tabsElement.id || `tabs-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };

    // Core elements
    this.tabsList = this.element.querySelector('.tabs-list');
    
    if (!this.tabsList) {
      console.error('Tabs missing required element: .tabs-list', this.element);
      return;
    }

    // Build tabs data
    this.triggers = Array.from(this.tabsList.querySelectorAll('.tabs-trigger'));
    this.tabsData = this.triggers.map(trigger => {
      const contentId = trigger.getAttribute('aria-controls');
      const content = contentId ? this.element.querySelector(`#${contentId}`) : null;
      return { trigger, content };
    }).filter(tab => tab.content);

    if (this.tabsData.length === 0) {
      console.error('Tabs: No valid tab pairs found', this.element);
      return;
    }

    // State
    this.activeTab = null;

    // Bound event handlers for proper cleanup
    this._boundHandlers = {
      click: (e) => this._handleClick(e),
      keydown: (e) => this._handleKeydown(e)
    };

    this.init();
    this.element.tabs = this;
  }

  defaults = {
    onTabChange: () => {},
    activateOnFocus: false
  }

  init() {
    this.setupStructure();
    this.setupEvents();
    this.setInitialTab();
    
    this.element.classList.add('tabs-initialized');
    this.emit('init');
  }

  setupStructure() {
    // Ensure proper ARIA attributes
    this.tabsList.setAttribute('role', 'tablist');
    
    this.tabsData.forEach(({ trigger, content }, index) => {
      // Setup trigger attributes
      trigger.setAttribute('role', 'tab');
      trigger.setAttribute('tabindex', '-1');
      
      // Setup content attributes
      content.setAttribute('role', 'tabpanel');
      content.setAttribute('tabindex', '0');
      
      // Ensure IDs are set for aria-controls relationship
      if (!content.id) {
        content.id = `${this.id}-content-${index}`;
      }
      if (!trigger.getAttribute('aria-controls')) {
        trigger.setAttribute('aria-controls', content.id);
      }
    });
  }

  setupEvents() {
    this.tabsList.addEventListener('click', this._boundHandlers.click);
    this.tabsList.addEventListener('keydown', this._boundHandlers.keydown);
    
    // Optional: activate on focus instead of click
    if (this.options.activateOnFocus) {
      this.tabsData.forEach(({ trigger }) => {
        trigger.addEventListener('focus', () => {
          if (!trigger.disabled) {
            this.activateTab(trigger);
          }
        });
      });
    }
  }

  setInitialTab() {
    // Find initial active tab (either marked with class or first one)
    const initialTab = this.tabsData.find(tab => 
      tab.trigger.classList.contains('tabs-trigger-active')
    ) || this.tabsData[0];
    
    this._activateTab(initialTab);
  }

  _handleClick(e) {
    const clickedTrigger = e.target.closest('.tabs-trigger');
    if (clickedTrigger && !clickedTrigger.disabled) {
      const tabToActivate = this.tabsData.find(tab => tab.trigger === clickedTrigger);
      if (tabToActivate) {
        this.activateTab(clickedTrigger);
      }
    }
  }

  _handleKeydown(e) {
    const activeTriggers = this.tabsData.filter(tab => !tab.trigger.disabled);
    const currentIndex = activeTriggers.findIndex(tab => 
      tab.trigger.getAttribute('aria-selected') === 'true'
    );
    let nextIndex = currentIndex;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % activeTriggers.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + activeTriggers.length) % activeTriggers.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = activeTriggers.length - 1;
    } else {
      return;
    }

    const nextTab = activeTriggers[nextIndex];
    nextTab.trigger.focus();
    this.activateTab(nextTab.trigger);
  }

  _activateTab(tabData) {
    const previousTab = this.activeTab;
    
    this.tabsData.forEach(({ trigger, content }) => {
      const isActive = (trigger === tabData.trigger);
      
      // Update trigger state
      trigger.classList.toggle('tabs-trigger-active', isActive);
      trigger.setAttribute('aria-selected', isActive.toString());
      trigger.setAttribute('tabindex', isActive ? '0' : '-1');
      
      // Update content state
      content.hidden = !isActive;
    });

    this.activeTab = tabData;
    
    // Trigger callbacks and events
    if (previousTab !== tabData) {
      this.options.onTabChange(tabData.trigger, tabData.content);
      this.emit('tab-change', { 
        trigger: tabData.trigger, 
        content: tabData.content,
        previousTab 
      });
    }
  }

  // Public API methods
  activateTab(triggerOrIndex) {
    let tabData;
    
    if (typeof triggerOrIndex === 'number') {
      // Activate by index
      tabData = this.tabsData[triggerOrIndex];
    } else if (typeof triggerOrIndex === 'string') {
      // Activate by content ID or trigger ID
      tabData = this.tabsData.find(tab => 
        tab.content.id === triggerOrIndex || 
        tab.trigger.id === triggerOrIndex
      );
    } else {
      // Activate by trigger element
      tabData = this.tabsData.find(tab => tab.trigger === triggerOrIndex);
    }
    
    if (tabData && !tabData.trigger.disabled) {
      this._activateTab(tabData);
    }
  }

  getActiveTab() {
    return this.activeTab ? {
      trigger: this.activeTab.trigger,
      content: this.activeTab.content,
      index: this.tabsData.indexOf(this.activeTab)
    } : null;
  }

  getTabByIndex(index) {
    return this.tabsData[index] || null;
  }

  getTabCount() {
    return this.tabsData.length;
  }

  enableTab(triggerOrIndex) {
    const tabData = this._findTab(triggerOrIndex);
    if (tabData) {
      tabData.trigger.disabled = false;
      tabData.trigger.removeAttribute('disabled');
    }
  }

  disableTab(triggerOrIndex) {
    const tabData = this._findTab(triggerOrIndex);
    if (tabData) {
      tabData.trigger.disabled = true;
      tabData.trigger.setAttribute('disabled', 'true');
      
      // If disabling the active tab, activate the first available tab
      if (tabData === this.activeTab) {
        const availableTab = this.tabsData.find(tab => !tab.trigger.disabled);
        if (availableTab) {
          this._activateTab(availableTab);
        }
      }
    }
  }

  _findTab(triggerOrIndex) {
    if (typeof triggerOrIndex === 'number') {
      return this.tabsData[triggerOrIndex];
    } else if (typeof triggerOrIndex === 'string') {
      return this.tabsData.find(tab => 
        tab.content.id === triggerOrIndex || 
        tab.trigger.id === triggerOrIndex
      );
    } else {
      return this.tabsData.find(tab => tab.trigger === triggerOrIndex);
    }
  }

  // Custom event system
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`tabs:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }

  // Cleanup method
  destroy() {
    // Remove event listeners
    this.tabsList.removeEventListener('click', this._boundHandlers.click);
    this.tabsList.removeEventListener('keydown', this._boundHandlers.keydown);

    // Clean up DOM
    this.element.classList.remove('tabs-initialized');
    delete this.element.tabs;

    this.emit('destroy');
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tabs:not(.tabs-initialized)').forEach(el => {
    new Tabs(el);
  });
});

export default Tabs;
