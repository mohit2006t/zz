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
  initInputOTP();
  initContextMenus();
  initMenubar();
  initSidebars();
  initCarousels();
  initComboboxes();
  initCommands();
  initDatePickers();
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

      event.preventDefault();

      const details = summary.closest('.accordion-item');
      if (!details) return;

      const wasOpen = details.hasAttribute('open');

      accordion.querySelectorAll('.accordion-item').forEach(item => {
        if (item !== details) {
          item.removeAttribute('open');
        }
      });

      if (!wasOpen) {
        details.setAttribute('open', '');
      }
    });
  });
};

/**
 * -----------------------------------------------------------------
 * Date Picker
 *
 * Handles the logic for a calendar date picker component.
 * -----------------------------------------------------------------
 */
const initDatePickers = () => {
  const datePickers = document.querySelectorAll('[data-datepicker]');

  datePickers.forEach(picker => {
    const input = picker.querySelector('.date-picker-input');
    const trigger = picker.querySelector('.date-picker-trigger');
    const prevBtn = picker.querySelector('.date-picker-prev-btn');
    const nextBtn = picker.querySelector('.date-picker-next-btn');
    const monthYearEl = picker.querySelector('.date-picker-month-year');
    const daysContainer = picker.querySelector('.date-picker-days');

    let currentDate = new Date();
    let selectedDate = null;

    const renderCalendar = (date) => {
      daysContainer.innerHTML = '';
      const month = date.getMonth();
      const year = date.getFullYear();

      monthYearEl.textContent = `${date.toLocaleString('default', { month: 'long' })} ${year}`;

      const firstDayOfMonth = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let i = 0; i < firstDayOfMonth; i++) {
        const dayEl = document.createElement('div');
        dayEl.classList.add('date-picker-day', 'is-other-month');
        daysContainer.appendChild(dayEl);
      }

      for (let i = 1; i <= daysInMonth; i++) {
        const dayEl = document.createElement('div');
        dayEl.classList.add('date-picker-day');
        dayEl.textContent = i;
        const dayDate = new Date(year, month, i);

        if (dayDate.toDateString() === new Date().toDateString()) {
          dayEl.classList.add('is-today');
        }

        if (selectedDate && dayDate.toDateString() === selectedDate.toDateString()) {
          dayEl.classList.add('is-selected');
        }

        dayEl.addEventListener('click', () => {
          selectedDate = dayDate;
          input.value = selectedDate.toLocaleDateString();
          picker.classList.remove('open');
        });

        daysContainer.appendChild(dayEl);
      }
    };

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = picker.classList.toggle('open');
      if (isOpen) {
        currentDate = selectedDate || new Date();
        renderCalendar(currentDate);
      }
    });

    prevBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar(currentDate);
    });

    nextBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar(currentDate);
    });

    document.addEventListener('click', (e) => {
        if (!picker.contains(e.target)) {
            picker.classList.remove('open');
        }
    });
  });
};

/**
 * -----------------------------------------------------------------
 * Command
 *
 * Handles filtering and keyboard navigation for the command palette.
 * -----------------------------------------------------------------
 */
const initCommands = () => {
  const commands = document.querySelectorAll('[data-command]');

  commands.forEach(command => {
    const input = command.querySelector('.command-input');
    const list = command.querySelector('.command-list');
    const items = list.querySelectorAll('.command-item');
    const groups = list.querySelectorAll('.command-group');
    const emptyState = list.querySelector('.command-empty');
    let highlightedIndex = 0;

    const filter = () => {
      const query = input.value.toLowerCase();
      let hasVisibleItems = false;

      groups.forEach(group => {
        const groupItems = group.querySelectorAll('.command-item');
        let visibleInGroup = 0;

        groupItems.forEach(item => {
          const text = item.textContent.toLowerCase();
          const isVisible = text.includes(query);
          item.style.display = isVisible ? '' : 'none';
          if (isVisible) {
            visibleInGroup++;
            hasVisibleItems = true;
          }
        });

        const heading = group.querySelector('.command-group-heading');
        if (heading) {
          heading.style.display = visibleInGroup > 0 ? '' : 'none';
        }
      });

      emptyState.style.display = hasVisibleItems ? 'none' : 'block';
      updateHighlight();
    };

    const updateHighlight = () => {
      const visibleItems = Array.from(items).filter(item => item.style.display !== 'none');

      visibleItems.forEach((item, index) => {
        item.classList.toggle('highlighted', index === highlightedIndex);
      });
    };

    input.addEventListener('input', filter);

    command.addEventListener('keydown', e => {
      const visibleItems = Array.from(items).filter(item => item.style.display !== 'none');
      if (!visibleItems.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        highlightedIndex = (highlightedIndex + 1) % visibleItems.length;
        updateHighlight();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        highlightedIndex = (highlightedIndex - 1 + visibleItems.length) % visibleItems.length;
        updateHighlight();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex > -1 && visibleItems[highlightedIndex]) {
          visibleItems[highlightedIndex].click();
           const dialog = command.closest('dialog');
           if(dialog) dialog.close();
        }
      }
    });

    filter();
  });
};

/**
 * -----------------------------------------------------------------
 * Combobox
 *
 * Handles the logic for a filterable, accessible combobox.
 * -----------------------------------------------------------------
 */
const initComboboxes = () => {
  const comboboxes = document.querySelectorAll('[data-combobox]');

  comboboxes.forEach(combobox => {
    const input = combobox.querySelector('.combobox-input');
    const trigger = combobox.querySelector('.combobox-trigger');
    const items = combobox.querySelectorAll('.combobox-item');
    let highlightedIndex = -1;

    const openPopover = () => combobox.classList.add('open');
    const closePopover = () => {
      combobox.classList.remove('open');
      highlightedIndex = -1;
      items.forEach(item => item.classList.remove('highlighted'));
    };

    const filterItems = () => {
      const filter = input.value.toLowerCase();
      items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.classList.toggle('hidden', !text.includes(filter));
      });
    };

    const highlightItem = (index, visibleItems) => {
      visibleItems.forEach((item, i) => {
        item.classList.toggle('highlighted', i === index);
      });
    };

    const selectItem = (index, visibleItems) => {
        if (index > -1) {
            const selectedItem = visibleItems[index];
            if(selectedItem) {
                input.value = selectedItem.textContent;
                items.forEach(item => item.classList.remove('selected'));
                selectedItem.classList.add('selected');
                closePopover();
            }
        }
    }

    input.addEventListener('focus', () => {
      openPopover();
      filterItems();
    });

    input.addEventListener('input', () => {
      openPopover();
      filterItems();
    });

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      combobox.classList.toggle('open');
    });

    items.forEach((item, index) => {
      item.addEventListener('click', () => {
        input.value = item.textContent;
        items.forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        closePopover();
      });
    });

    combobox.addEventListener('keydown', (e) => {
        const visibleItems = Array.from(items).filter(i => !i.classList.contains('hidden'));
        if (!visibleItems.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlightedIndex = (highlightedIndex + 1) % visibleItems.length;
            highlightItem(highlightedIndex, visibleItems);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlightedIndex = (highlightedIndex - 1 + visibleItems.length) % visibleItems.length;
            highlightItem(highlightedIndex, visibleItems);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex > -1) {
                selectItem(highlightedIndex, visibleItems);
            }
        } else if (e.key === 'Escape') {
            closePopover();
        }
    });

    document.addEventListener('click', (e) => {
      if (!combobox.contains(e.target)) {
        closePopover();
      }
    });
  });
};

/**
 * -----------------------------------------------------------------
 * Carousel
 *
 * Handles the logic for a sliding image carousel.
 * -----------------------------------------------------------------
 */
const initCarousels = () => {
  const carousels = document.querySelectorAll('[data-carousel]');

  carousels.forEach(carousel => {
    const track = carousel.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const nextButton = carousel.querySelector('.carousel-next-btn');
    const prevButton = carousel.querySelector('.carousel-prev-btn');
    const dotsNav = carousel.querySelector('.carousel-pagination');
    const dots = Array.from(dotsNav.children);
    const slideWidth = slides[0].getBoundingClientRect().width;

    let currentIndex = 0;

    const moveToSlide = (targetIndex) => {
      track.style.transform = 'translateX(-' + (slideWidth * targetIndex) + 'px)';

      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === targetIndex);
      });

      currentIndex = targetIndex;
    };

    prevButton.addEventListener('click', e => {
      const newIndex = currentIndex === 0 ? slides.length - 1 : currentIndex - 1;
      moveToSlide(newIndex);
    });

    nextButton.addEventListener('click', e => {
      const newIndex = currentIndex === slides.length - 1 ? 0 : currentIndex + 1;
      moveToSlide(newIndex);
    });

    dotsNav.addEventListener('click', e => {
      const targetDot = e.target.closest('button');
      if (!targetDot) return;

      const targetIndex = dots.findIndex(dot => dot === targetDot);
      moveToSlide(targetIndex);
    });

    moveToSlide(0);
  });
};

/**
 * -----------------------------------------------------------------
 * Sidebar
 *
 * Handles the expand and collapse functionality for the sidebar.
 * -----------------------------------------------------------------
 */
const initSidebars = () => {
  const sidebars = document.querySelectorAll('[data-sidebar]');

  sidebars.forEach(sidebar => {
    const toggle = sidebar.querySelector('.sidebar-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
      });
    }
  });
};

/**
 * -----------------------------------------------------------------
 * Menubar
 *
 * Handles the functionality for desktop-style menu bars.
 * -----------------------------------------------------------------
 */
const initMenubar = () => {
  const menubars = document.querySelectorAll('[data-menubar]');

  menubars.forEach(menubar => {
    const items = menubar.querySelectorAll('[data-menubar-item]');

    items.forEach(item => {
      const trigger = item.querySelector('.menubar-trigger');
      if (trigger) {
        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          const wasOpen = item.classList.contains('open');

          items.forEach(i => i.classList.remove('open'));

          if (!wasOpen) {
            item.classList.add('open');
          }
        });
      }
    });

    document.addEventListener('click', () => {
      items.forEach(item => item.classList.remove('open'));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        items.forEach(item => item.classList.remove('open'));
      }
    });
  });
};

/**
 * -----------------------------------------------------------------
 * Context Menu
 *
 * Handles the display and positioning of a custom context menu.
 * -----------------------------------------------------------------
 */
const initContextMenus = () => {
  const triggers = document.querySelectorAll('[data-context-menu-trigger]');
  const menus = document.querySelectorAll('.context-menu-popover');

  triggers.forEach(trigger => {
    trigger.addEventListener('contextmenu', (e) => {
      e.preventDefault();

      menus.forEach(menu => menu.classList.remove('open'));

      const menuId = trigger.getAttribute('data-context-menu-trigger');
      const menu = document.getElementById(menuId);

      if (menu) {
        menu.classList.add('open');
        menu.style.top = `${e.clientY}px`;
        menu.style.left = `${e.clientX}px`;
      }
    });
  });

  document.addEventListener('click', () => {
    menus.forEach(menu => menu.classList.remove('open'));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      menus.forEach(menu => menu.classList.remove('open'));
    }
  });
};

/**
 * -----------------------------------------------------------------
 * Dialog (Modal)
 *
 * Handles the opening and closing of dialog elements.
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
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });

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

    trigger.addEventListener('mouseenter', showTooltip);
    trigger.addEventListener('focus', showTooltip);

    trigger.addEventListener('mouseleave', hideTooltip);
    trigger.addEventListener('blur', hideTooltip);
  });
};

/**
 * -----------------------------------------------------------------
 * Sonner
 *
 * Creates and displays a Sonner (toast) notification. This function is exposed
 * globally so it can be called from anywhere (e.g., onclick).
 * Options object can be used to configure title, position, etc.
 * -----------------------------------------------------------------
 */
function showSonner(description, options = {}) {
  const {
    title = 'Notification',
    position = 'bottom-right'
  } = options;

  let container = document.getElementById('sonner-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'sonner-container';
    document.body.appendChild(container);
  }

  container.className = `sonner-container ${position}`;

  const sonner = document.createElement('div');
  sonner.className = 'sonner';
  sonner.setAttribute('role', 'status');

  sonner.innerHTML = `
    <div class="sonner-content">
      <p class="sonner-title">${title}</p>
      <p class="sonner-description">${description}</p>
    </div>
    <button class="sonner-close-btn" aria-label="Close">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
      </svg>
    </button>
  `;

  container.appendChild(sonner);

  const removeSonner = () => {
    sonner.classList.add('removing');
    sonner.addEventListener('animationend', () => {
      sonner.remove();
      if (!container.hasChildNodes()) {
        container.remove();
      }
    });
  };

  const timer = setTimeout(removeSonner, 5000);

  const closeButton = sonner.querySelector('.sonner-close-btn');
  closeButton.addEventListener('click', () => {
    clearTimeout(timer);
    removeSonner();
  });
}


/**
 * -----------------------------------------------------------------
 * Select
 *
 * Handles the functionality for custom select/dropdown components.
 * -----------------------------------------------------------------
 */
const initSelects = () => {
  const selectContainers = document.querySelectorAll('[data-select]');

  selectContainers.forEach(container => {
    const nativeSelect = container.querySelector('.hidden-select');
    const trigger = container.querySelector('.select-trigger');
    const valueDisplay = container.querySelector('.select-value');
    const options = container.querySelectorAll('.select-option');

    const selectedOption = Array.from(nativeSelect.options).find(o => o.selected);
    if (selectedOption) {
        valueDisplay.textContent = selectedOption.textContent;
        const customOption = container.querySelector(`.select-option[data-value="${selectedOption.value}"]`);
        if(customOption) customOption.classList.add('selected');
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      container.classList.toggle('open');
    });

    options.forEach(option => {
      option.addEventListener('click', () => {
        const value = option.getAttribute('data-value');

        nativeSelect.value = value;
        valueDisplay.textContent = option.textContent;

        options.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');

        container.classList.remove('open');
      });
    });
  });

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
        triggers.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
          t.setAttribute('tabindex', '-1');
        });

        trigger.classList.add('active');
        trigger.setAttribute('aria-selected', 'true');
        trigger.setAttribute('tabindex', '0');

        panels.forEach(panel => {
          panel.classList.add('hidden');
        });

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
      const group = toggle.closest('.toggle-group');

      if (group) {
        const groupToggles = group.querySelectorAll('[data-toggle]');
        groupToggles.forEach(t => t.setAttribute('aria-pressed', 'false'));
        toggle.setAttribute('aria-pressed', 'true');
      } else {
        const isPressed = toggle.getAttribute('aria-pressed') === 'true';
        toggle.setAttribute('aria-pressed', !isPressed);
      }
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
      dropdowns.forEach(d => {
        if (d !== dropdown) {
          d.classList.remove('open');
        }
      });
      dropdown.classList.toggle('open');
    });
  });

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
      popovers.forEach(p => {
        if (p !== popover) {
          p.classList.remove('open');
        }
      });
      popover.classList.toggle('open');
    });
  });

  document.addEventListener('click', (e) => {
    popovers.forEach(popover => {
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

/**
 * -----------------------------------------------------------------
 * Input OTP
 *
 * Handles focus management for one-time password input fields.
 * -----------------------------------------------------------------
 */
const initInputOTP = () => {
  const otpContainers = document.querySelectorAll('[data-input-otp]');

  otpContainers.forEach(container => {
    const inputs = [...container.querySelectorAll('.input-otp-field')];

    inputs.forEach((input, index) => {
      input.addEventListener('input', () => {
        if (input.value.length === 1 && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && input.value.length === 0 && index > 0) {
          inputs[index - 1].focus();
        }
      });

      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        const otpChars = pasteData.replace(/[^a-zA-Z0-9]/g, '').split('');

        inputs.forEach((input, i) => {
          if (otpChars[i]) {
            input.value = otpChars[i];
            if (i < inputs.length - 1) {
                inputs[i + 1].focus();
            }
          }
        });
        if (pasteData.length >= inputs.length) {
            inputs[inputs.length - 1].focus();
        }
      });
    });
  });
};

// Run initialization once the DOM is fully loaded.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initComponents);
} else {
  initComponents();
}