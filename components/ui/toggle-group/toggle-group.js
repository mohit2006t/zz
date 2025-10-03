/**
 * @file toggle-group.js
 * @description Encapsulated setup for the toggle group component using ARIA attributes.
 */
function toggleGroup() {
  // Initialize aria-pressed for all items that don't have the attribute.
  document.querySelectorAll('.toggle-group-item:not([aria-pressed])').forEach(item => {
    item.setAttribute('aria-pressed', 'false');
  });

  // Use a single event listener on the body for optimal performance.
  document.body.addEventListener('click', (event) => {
    const item = event.target.closest('.toggle-group-item');
    if (!item) return;

    const group = item.closest('.toggle-group');
    // Exit if the group or item is disabled.
    if (!group || group.classList.contains('toggle-group-disabled') || item.disabled) {
      return;
    }

    const isPressed = item.getAttribute('aria-pressed') === 'true';
    // Check for single-selection mode using the standard 'role' attribute.
    const isSingleSelection = group.getAttribute('role') === 'radiogroup';

    if (isSingleSelection) {
      // If it's already pressed in single-selection mode, do nothing.
      if (isPressed) return;
      // De-select all other items in the group.
      group.querySelectorAll('.toggle-group-item').forEach(el => {
        el.setAttribute('aria-pressed', 'false');
      });
      // Select the clicked item.
      item.setAttribute('aria-pressed', 'true');
    } else {
      // For multi-selection mode, just toggle the clicked item.
      item.setAttribute('aria-pressed', String(!isPressed));
    }
  });
}

// Self-initialize the toggle group logic when the DOM is ready.
document.addEventListener('DOMContentLoaded', toggleGroup);
