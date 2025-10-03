/**
 * @file navigation-menu.js
 * @description Controls the behavior of a fully ARIA-compliant navigation menu component.
 */
function navigationMenu() {
  document.querySelectorAll('.navigation-menu-list').forEach(list => {
    const items = Array.from(list.querySelectorAll('.navigation-menu-item'));
    let openTrigger = null;
    let timer;

    const closeAllMenus = () => {
      items.forEach(item => {
        const trigger = item.querySelector('.navigation-menu-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
      openTrigger = null;
    };

    const open = (trigger) => {
      if (openTrigger === trigger) return;
      closeAllMenus();
      trigger.setAttribute('aria-expanded', 'true');
      openTrigger = trigger;
    };

    items.forEach(item => {
      const trigger = item.querySelector('.navigation-menu-trigger');
      if (trigger) {
        item.addEventListener('mouseenter', () => {
          clearTimeout(timer);
          open(trigger);
        });

        item.addEventListener('mouseleave', () => {
          timer = setTimeout(closeAllMenus, 150);
        });
        
        trigger.addEventListener('focus', () => open(trigger));
      }
    });

    document.addEventListener('click', (e) => {
      if (!list.contains(e.target)) {
        closeAllMenus();
      }
    }, true);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllMenus();
        }
    });
  });
}

document.addEventListener('DOMContentLoaded', navigationMenu);
