/**
 * @file accordion.js
 * @description Encapsulated setup for an accessible accordion component.
 */
function accordion() {
  document.querySelectorAll('.accordion').forEach((accordionElement, accordionIndex) => {
    const isSingleToggle = accordionElement.classList.contains('accordion-single-toggle');
    const items = Array.from(accordionElement.querySelectorAll('.accordion-item'));

    const setItemState = (item, isActive) => {
      const trigger = item.querySelector('.accordion-trigger');
      const content = item.querySelector('.accordion-content');
      if (!trigger || !content) return;

      trigger.setAttribute('aria-expanded', isActive);
      content.style.height = isActive ? `${content.scrollHeight}px` : '0';
    };

    items.forEach((item, itemIndex) => {
      const trigger = item.querySelector('.accordion-trigger');
      const content = item.querySelector('.accordion-content');
      const uniqueId = `accordion-${accordionIndex}-item-${itemIndex}`;

      if (!trigger || !content) return;

      trigger.id = `${uniqueId}-trigger`;
      content.id = `${uniqueId}-content`;
      trigger.setAttribute('aria-controls', content.id);
      content.setAttribute('aria-labelledby', trigger.id);
      
      setItemState(item, trigger.getAttribute('aria-expanded') === 'true');
    });

    accordionElement.addEventListener('click', (event) => {
      const trigger = event.target.closest('.accordion-trigger');
      if (!trigger || trigger.closest('.is-disabled')) return;

      const item = trigger.closest('.accordion-item');
      
      if (isSingleToggle) {
        items.forEach(otherItem => {
          if (otherItem !== item) setItemState(otherItem, false);
        });
      }
      
      setItemState(item, trigger.getAttribute('aria-expanded') !== 'true');
    });
  });
}

document.addEventListener('DOMContentLoaded', accordion);
