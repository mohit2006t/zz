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
  initSelects();
  initResizable();
  initTabs();
  initToggles();
  initDrawers();
  initDropdowns();
  initPopovers();
  initCollapsibles();
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


/**
 * -----------------------------------------------------------------
 * Select
 *
 * Handles the functionality for custom select/dropdown components.
 * - Toggles the dropdown visibility on trigger click.
 * - Updates the hidden native select when a custom option is chosen.
 * - Closes the dropdown when clicking outside of it.
 * -----------------------------------------------------------------
 */
const initSelects = () => {
  const selectContainers = document.querySelectorAll('[data-select]');

  selectContainers.forEach(container => {
    const nativeSelect = container.querySelector('.hidden-select');
    const trigger = container.querySelector('.select-trigger');
    const valueDisplay = container.querySelector('.select-value');
    const options = container.querySelectorAll('.select-option');

    // Set initial value
    const selectedOption = Array.from(nativeSelect.options).find(o => o.selected);
    if (selectedOption) {
        valueDisplay.textContent = selectedOption.textContent;
        const customOption = container.querySelector(`.select-option[data-value="${selectedOption.value}"]`);
        if(customOption) customOption.classList.add('selected');
    }

    // Toggle popover
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      container.classList.toggle('open');
    });

    // Handle option selection
    options.forEach(option => {
      option.addEventListener('click', () => {
        const value = option.getAttribute('data-value');

        // Update native select
        nativeSelect.value = value;

        // Update displayed value
        valueDisplay.textContent = option.textContent;

        // Update selected classes
        options.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');

        // Close popover
        container.classList.remove('open');
      });
    });
  });

  // Global click listener to close open selects
  document.addEventListener('click', () => {
    selectContainers.forEach(container => {
      container.classList.remove('open');
    });
  });
};

/**
 * -----------------------------------------------------------------
 * Resizable
 *
 * Handles the drag-to-resize functionality for resizable panels.
 * -----------------------------------------------------------------
 */
const initResizable = () => {
  const resizableContainers = document.querySelectorAll('[data-resizable]');

  resizableContainers.forEach(container => {
    const handle = container.querySelector('.resizable-handle');
    let isResizing = false;

    handle.addEventListener('mousedown', (e) => {
      isResizing = true;
      handle.classList.add('resizing');
      const startX = e.clientX;
      const startWidth = container.offsetWidth;

      const doDrag = (e) => {
        if (!isResizing) return;
        const newWidth = startWidth + (e.clientX - startX);
        container.style.width = `${newWidth}px`;
      };

      const stopDrag = () => {
        isResizing = false;
        handle.classList.remove('resizing');
        document.removeEventListener('mousemove', doDrag);
        document.removeEventListener('mouseup', stopDrag);
      };

      document.addEventListener('mousemove', doDrag);
      document.addEventListener('mouseup', stopDrag);
    });
  });
};

/**
 * -----------------------------------------------------------------
 * Tabs
 *
 * Handles the logic for switching between tab panels.
 * -----------------------------------------------------------------
 */
const initTabs = () => {
  const tabContainers = document.querySelectorAll('[data-tabs]');

  tabContainers.forEach(container => {
    const triggers = container.querySelectorAll('.tab-trigger');
    const panels = container.querySelectorAll('.tab-content');

    triggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        // Deactivate all triggers
        triggers.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
          t.setAttribute('tabindex', '-1');
        });

        // Activate the clicked trigger
        trigger.classList.add('active');
        trigger.setAttribute('aria-selected', 'true');
        trigger.setAttribute('tabindex', '0');

        // Hide all panels
        panels.forEach(panel => {
          panel.classList.add('hidden');
        });

        // Show the associated panel
        const panelId = trigger.getAttribute('aria-controls');
        const panel = document.getElementById(panelId);
        if (panel) {
          panel.classList.remove('hidden');
        }
      });
    });
  });
};

/**
 * -----------------------------------------------------------------
 * Toggle & Toggle Group
 *
 * Handles the pressed state for toggle buttons.
 * -----------------------------------------------------------------
 */
const initToggles = () => {
  const toggles = document.querySelectorAll('[data-toggle]');

  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const isPressed = toggle.getAttribute('aria-pressed') === 'true';
      toggle.setAttribute('aria-pressed', !isPressed);
    });
  });
};

/**
 * -----------------------------------------------------------------
 * Drawer / Sheet
 *
 * Handles the opening and closing of drawer components.
 * -----------------------------------------------------------------
 */
const initDrawers = () => {
  const openTriggers = document.querySelectorAll('[data-drawer-target]');
  const drawers = document.querySelectorAll('[data-drawer]');

  openTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const drawerId = trigger.getAttribute('data-drawer-target');
      const drawer = document.querySelector(drawerId);
      if (drawer) {
        drawer.classList.add('open');
      }
    });
  });

  drawers.forEach(drawer => {
    const closeTriggers = drawer.querySelectorAll('[data-drawer-close]');
    closeTriggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        drawer.classList.remove('open');
      });
    });
  });

  // Close with Escape key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      drawers.forEach(drawer => {
        if (drawer.classList.contains('open')) {
          drawer.classList.remove('open');
        }
      });
    }
  });
};

/**
 * -----------------------------------------------------------------
 * Dropdown Menu
 *
 * Handles the functionality for dropdown menus.
 * -----------------------------------------------------------------
 */
const initDropdowns = () => {
  const dropdowns = document.querySelectorAll('[data-dropdown]');

  dropdowns.forEach(dropdown => {
    const trigger = dropdown.querySelector('.dropdown-trigger');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close other open dropdowns first
      dropdowns.forEach(d => {
        if (d !== dropdown) {
          d.classList.remove('open');
        }
      });
      dropdown.classList.toggle('open');
    });
  });

  // Global click listener to close open dropdowns
  document.addEventListener('click', () => {
    dropdowns.forEach(dropdown => {
      dropdown.classList.remove('open');
    });
  });
};

/**
 * -----------------------------------------------------------------
 * Popover
 *
 * Handles the functionality for popover components.
 * -----------------------------------------------------------------
 */
const initPopovers = () => {
  const popovers = document.querySelectorAll('[data-popover]');

  popovers.forEach(popover => {
    const trigger = popover.querySelector('.popover-trigger');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close other open popovers first
      popovers.forEach(p => {
        if (p !== popover) {
          p.classList.remove('open');
        }
      });
      popover.classList.toggle('open');
    });
  });

  // Global click listener to close open popovers
  document.addEventListener('click', (e) => {
    popovers.forEach(popover => {
      // Do not close if the click is inside the popover content
      if (!popover.contains(e.target)) {
        popover.classList.remove('open');
      }
    });
  });
};

/**
 * -----------------------------------------------------------------
 * Collapsible
 *
 * Handles the expand and collapse functionality for collapsible sections.
 * -----------------------------------------------------------------
 */
const initCollapsibles = () => {
  const collapsibles = document.querySelectorAll('[data-collapsible]');

  collapsibles.forEach(collapsible => {
    const trigger = collapsible.querySelector('.collapsible-trigger');
    if (trigger) {
      trigger.addEventListener('click', () => {
        collapsible.classList.toggle('open');
      });
    }
  });
};

// Run initialization once the DOM is fully loaded.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initComponents);
} else {
  initComponents();
}