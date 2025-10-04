/* =================================================================
   BASE.JS
   - Core component initialization and shared logic.
   ================================================================= */

/**
 * -----------------------------------------------------------------
 * Main Initializer
 *
 * This function is the entry point for all component initializations.
 * It runs when the DOM is fully loaded, finds all components that
 * need JavaScript enhancements, and initializes them.
 * -----------------------------------------------------------------
 */
const initComponents = () => {
  initAccordions();
  initDialogs();
  initTooltips();
  // Other component initializers will go here
};

/**
 * -----------------------------------------------------------------
 * Accordion
 *
 * Finds all `.accordion` containers and adds event listeners to
 * ensure only one `<details>` element within it is open at a time.
 * -----------------------------------------------------------------
 */
const initAccordions = () => {
  const accordions = document.querySelectorAll('.accordion');
  accordions.forEach(accordion => {
    accordion.addEventListener('click', (event) => {
      const summary = event.target.closest('.accordion-trigger');
      if (!summary) return;

      // Prevent the default <details> toggling for a moment
      event.preventDefault();

      const details = summary.closest('.accordion-item');
      if (!details) return;

      const wasOpen = details.hasAttribute('open');

      // Close all other details elements within this accordion
      accordion.querySelectorAll('.accordion-item').forEach(item => {
        if (item !== details) {
          item.removeAttribute('open');
        }
      });

      // If it wasn't open, open it. If it was open, it's now closed.
      if (!wasOpen) {
        details.setAttribute('open', '');
      }
    });
  });
};

/**
 * -----------------------------------------------------------------
 * Dialog (Modal)
 *
 * Handles the opening and closing of dialog elements.
 * - Listens for clicks on triggers with `data-dialog-target`.
 * - Listens for clicks on elements with `data-dialog-close`.
 * - Handles closing with the Escape key.
 * - Traps focus within the open dialog for accessibility.
 * -----------------------------------------------------------------
 */
const initDialogs = () => {
  const openTriggers = document.querySelectorAll('[data-dialog-target]');

  openTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const dialogId = trigger.getAttribute('data-dialog-target');
      const dialog = document.querySelector(dialogId);
      if (dialog) {
        dialog.showModal();
      }
    });
  });

  const dialogs = document.querySelectorAll('.dialog');
  dialogs.forEach(dialog => {
    // Close on backdrop click
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });

    // Close with buttons inside the dialog
    const closeTriggers = dialog.querySelectorAll('[data-dialog-close]');
    closeTriggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        dialog.close();
      });
    });
  });
};

/**
 * -----------------------------------------------------------------
 * Tooltip
 *
 * Shows and hides a tooltip on hover or focus of a trigger element.
 * -----------------------------------------------------------------
 */
const initTooltips = () => {
  const tooltipContainers = document.querySelectorAll('[data-tooltip]');

  tooltipContainers.forEach(container => {
    const trigger = container.querySelector('.tooltip-trigger');

    if (!trigger) return;

    const showTooltip = () => container.classList.add('visible');
    const hideTooltip = () => container.classList.remove('visible');

    // Show on hover or focus
    trigger.addEventListener('mouseenter', showTooltip);
    trigger.addEventListener('focus', showTooltip);

    // Hide on mouse leave or blur
    trigger.addEventListener('mouseleave', hideTooltip);
    trigger.addEventListener('blur', hideTooltip);
  });
};

/**
 * -----------------------------------------------------------------
 * Toast
 *
 * Creates and displays a toast notification. This function is exposed
 * globally so it can be called from anywhere (e.g., onclick).
 * -----------------------------------------------------------------
 */
function showToast(description, title = 'Notification') {
  const container = document.getElementById('toast-container');
  if (!container) {
    console.error('Toast container not found. Please add `<div id="toast-container"></div>` to your page.');
    return;
  }

  // Create the toast element
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');

  toast.innerHTML = `
    <div class="toast-content">
      <p class="toast-title">${title}</p>
      <p class="toast-description">${description}</p>
    </div>
    <button class="toast-close-btn" aria-label="Close">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
      </svg>
    </button>
  `;

  // Add to the container
  container.appendChild(toast);

  // Function to remove the toast
  const removeToast = () => {
    toast.classList.add('removing');
    // Wait for animation to finish before removing from DOM
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  };

  // Auto-remove after 5 seconds
  const timer = setTimeout(removeToast, 5000);

  // Remove on close button click
  const closeButton = toast.querySelector('.toast-close-btn');
  closeButton.addEventListener('click', () => {
    clearTimeout(timer); // Cancel auto-removal if closed manually
    removeToast();
  });
}


// Run initialization once the DOM is fully loaded.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initComponents);
} else {
  initComponents();
}