/**
 * @file sortable.js
 * @description Initializes the SortableJS library for drag-and-drop functionality.
 */
function sortable() {
  // Guard against running if the Sortable library isn't loaded
  if (typeof Sortable === 'undefined') {
    return;
  }

  document.querySelectorAll('.sortable-list').forEach(list => {
    // Prevent re-initialization on the same element
    if (list.hasAttribute('data-sortable-initialized')) {
      return;
    }

    new Sortable(list, {
      animation: 150,
      handle: '.sortable-handle',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      // Add a global class to the body to manage drag state styles
      onStart: () => document.body.classList.add('sortable-sorting'),
      onEnd: () => document.body.classList.remove('sortable-sorting'),
    });

    list.setAttribute('data-sortable-initialized', 'true');
  });
}

document.addEventListener('DOMContentLoaded', sortable);
