/**
 * @file toggle.js
 * @description Encapsulated setup for the toggle button component.
 */
function toggle() {
  // Set an initial 'aria-pressed' state for any toggle buttons that don't have one.
  document.querySelectorAll('.toggle:not([aria-pressed])').forEach(button => {
    button.setAttribute('aria-pressed', 'false');
  });

  // Use a single event listener on the body for optimal performance.
  document.body.addEventListener('click', (event) => {
    const button = event.target.closest('.toggle');

    // If a toggle button was clicked and it's not disabled, toggle its state.
    if (button && !button.disabled) {
      const isPressed = button.getAttribute('aria-pressed') === 'true';
      button.setAttribute('aria-pressed', String(!isPressed));
    }
  });
}

// Self-initialize the toggle logic when the DOM is ready.
document.addEventListener('DOMContentLoaded', toggle);
