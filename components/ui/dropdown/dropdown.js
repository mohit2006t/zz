/**
 * @file dropdown.js
 * @description Definitive dropdown with CSS class-based trigger selection and automatic icon spacing.
 */
function dropdown() {
  const updateScrollLock = (lock) => {
    const overflow = lock ? 'hidden' : '';
    document.documentElement.style.overflow = overflow;
    document.body.style.overflow = overflow;
  };

  const manageIconSpacing = (menuContent) => {
    const hasAnyIcon = [...menuContent.querySelectorAll('.dropdown-menu-item')]
      .some(item => item.parentElement === menuContent && item.querySelector('i, svg'));
    
    menuContent.classList.toggle('has-icons', hasAnyIcon);
  };

  const positionContent = (trigger, content) => {
    const rect = trigger.getBoundingClientRect();
    const { innerHeight: vh, innerWidth: vw } = window;
    const margin = 8;
    const isSubMenu = content.classList.contains('dropdown-menu-sub-content');
    const offset = isSubMenu ? -6 : 6;
    
    let top, left;

    if (isSubMenu) {
      const parentMenuRect = trigger.closest('.dropdown-menu-content, .dropdown-menu-sub-content').getBoundingClientRect();
      left = parentMenuRect.right + offset;
      if (left + content.offsetWidth > vw) {
        left = parentMenuRect.left - content.offsetWidth - offset;
      }
      top = rect.top;
    } else {
      top = rect.bottom + offset;
      if (top + content.offsetHeight > vh) {
        top = rect.top - content.offsetHeight - offset;
      }
      left = rect.left;
      if (left + content.offsetWidth > vw) {
        left = vw - content.offsetWidth - margin;
      }
    }

    Object.assign(content.style, { top: `${top}px`, left: `${left}px` });
  };

  const openMenu = (trigger, content) => {
    document.querySelectorAll('.dropdown-menu-content.is-active').forEach(activeContent => {
        if (activeContent !== content) {
            activeContent.classList.remove('is-active');
        }
    });
    content.classList.add('is-active');
    manageIconSpacing(content);
    positionContent(trigger, content);
    updateScrollLock(true);
  };
  
  const closeAllMenus = () => {
    document.querySelectorAll('.is-active').forEach(el => el.classList.remove('is-active'));
    updateScrollLock(false);
  };

  // --- CSS Class-Based Trigger Logic ---
  document.querySelectorAll('.dropdown-menu').forEach(menuContainer => {
    const trigger = menuContainer.querySelector('.dropdown-menu-trigger');
    const content = menuContainer.querySelector('.dropdown-menu-content');
    const isHoverTrigger = menuContainer.classList.contains('trigger-hover');
    let leaveTimeout;

    if (trigger && content) {
      if (isHoverTrigger) {
        // --- Hover Logic ---
        menuContainer.addEventListener('mouseenter', () => {
            clearTimeout(leaveTimeout);
            openMenu(trigger, content);
        });

        menuContainer.addEventListener('mouseleave', () => {
            leaveTimeout = setTimeout(() => {
                content.classList.remove('is-active');
                if (!document.querySelector('.dropdown-menu-content.is-active')) {
                    updateScrollLock(false);
                }
            }, 200);
        });
      } else {
        // --- Click Logic (Default) ---
        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          const isActive = content.classList.contains('is-active');
          if (isActive) {
            closeAllMenus();
          } else {
            openMenu(trigger, content);
          }
        });
      }
    }
  });

  // Global click to close for all dropdowns
  document.body.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-menu')) {
      closeAllMenus();
    } else if (e.target.closest('.dropdown-menu-item:not(.dropdown-menu-sub-trigger)')) {
        closeAllMenus();
    }
  });

  // Submenu hover logic (remains the same)
  document.querySelectorAll('.dropdown-menu-sub').forEach(sub => {
    const trigger = sub.querySelector('.dropdown-menu-sub-trigger');
    const content = sub.querySelector('.dropdown-menu-sub-content');

    sub.addEventListener('mouseenter', () => {
      const parentMenu = sub.parentElement;
      parentMenu.querySelectorAll('.dropdown-menu-sub-content.is-active').forEach(c => {
        if (c !== content) {
          c.classList.remove('is-active');
          c.previousElementSibling.classList.remove('is-active');
        }
      });
      
      content.classList.add('is-active');
      trigger.classList.add('is-active');
      manageIconSpacing(content);
      positionContent(trigger, content);
    });

    sub.addEventListener('mouseleave', () => {
      content.classList.remove('is-active');
      trigger.classList.remove('is-active');
    });
  });
  
  const reposition = () => document.querySelectorAll('.dropdown-menu-content.is-active').forEach(menu => positionContent(menu.previousElementSibling, menu));
  window.addEventListener('resize', reposition);
  window.addEventListener('scroll', reposition, true);
}

document.addEventListener('DOMContentLoaded', dropdown);
