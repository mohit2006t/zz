/**
 * @file tabs.js
 * @description Manages the behavior of an accessible tabs component.
 */
function tabs() {
  document.querySelectorAll('.tabs:not(.tabs-initialized)').forEach(tabsContainer => {
    const tabList = tabsContainer.querySelector('.tabs-list');
    if (!tabList) return;

    const triggers = Array.from(tabList.querySelectorAll('.tabs-trigger'));
    const contentPanels = Array.from(tabsContainer.querySelectorAll('.tabs-content'));

    const update = (activeTrigger) => {
      const value = activeTrigger.dataset.value;

      triggers.forEach(trigger => {
        const isActive = trigger === activeTrigger;
        trigger.setAttribute('data-state', isActive ? 'active' : 'inactive');
        trigger.setAttribute('aria-selected', isActive.toString());
      });

      contentPanels.forEach(panel => {
        const isActive = panel.dataset.value === value;
        panel.setAttribute('data-state', isActive ? 'active' : 'inactive');
      });
    };

    tabList.addEventListener('click', (e) => {
      const clickedTrigger = e.target.closest('.tabs-trigger');
      if (clickedTrigger) {
        update(clickedTrigger);
      }
    });

    const defaultValue = tabsContainer.dataset.defaultValue;
    const initialTrigger = triggers.find(t => t.dataset.value === defaultValue) || triggers[0];
    if (initialTrigger) {
      update(initialTrigger);
    }
    
    tabsContainer.classList.add('tabs-initialized');
  });
}

document.addEventListener('DOMContentLoaded', tabs);
