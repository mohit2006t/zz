/**
 * @file menubar.js
 * @description Controls the behavior of a custom menubar with nested submenus.
 */
function menubar() {
  const updateScrollLock = () => {
    const isOpen = !!document.querySelector('.menubar-content[data-state="open"], .menubar-sub-content[data-state="open"]');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  const getPositioning = (content) => {
    const c = content.classList;
    const side = c.contains('side-top') ? 'top' : c.contains('side-right') ? 'right' : c.contains('side-left') ? 'left' : 'bottom';
    const align = c.contains('align-center') ? 'center' : c.contains('align-end') ? 'end' : 'start';
    return { side, align };
  };

  const positionContent = (trigger, content) => {
    const rect = trigger.getBoundingClientRect();
    const { innerHeight: vh, innerWidth: vw } = window;
    const margin = 8;
    const isSubMenu = content.classList.contains('menubar-sub-content');
    const offset = isSubMenu ? 0 : (parseInt(getComputedStyle(content).getPropertyValue('--offset'), 10) || 0);
    
    const tempContent = content.cloneNode(true);
    tempContent.style.opacity = '0';
    tempContent.style.pointerEvents = 'none';
    document.body.appendChild(tempContent);
    const contentRect = tempContent.getBoundingClientRect();
    document.body.removeChild(tempContent);
    
    let top, left;

    if (isSubMenu) {
      left = rect.right + offset;
      if (left + contentRect.width > vw - margin && rect.left - contentRect.width > margin) {
        left = rect.left - contentRect.width - offset;
      }
      top = Math.max(margin, Math.min(rect.top, vh - contentRect.height - margin));
    } else {
      left = rect.left;
      if (left + contentRect.width > vw - margin) left = vw - contentRect.width - margin;
      if (left < margin) left = margin;

      top = rect.bottom + offset;
      if (top + contentRect.height > vh - margin && rect.top - contentRect.height > margin) {
        top = rect.top - contentRect.height - offset;
      }
    }
    
    Object.assign(content.style, { top: `${top}px`, left: `${left}px` });
  };

  const closeAllMenus = (except = null) => {
    document.querySelectorAll('.menubar-menu').forEach(menu => {
      if (except && menu.contains(except)) return;
      const trigger = menu.querySelector('.menubar-trigger');
      const content = menu.querySelector('.menubar-content');
      if (trigger && content) {
        trigger.setAttribute('data-state', 'closed');
        content.setAttribute('data-state', 'closed');
      }
    });
    updateScrollLock();
  };

  const openMenu = (menu) => {
    closeAllMenus(menu);
    const trigger = menu.querySelector('.menubar-trigger');
    const content = menu.querySelector('.menubar-content');
    if(trigger && content) {
        trigger.setAttribute('data-state', 'open');
        content.setAttribute('data-state', 'open');
        positionContent(trigger, content);
        updateScrollLock();
    }
  };

  document.body.addEventListener('click', (e) => {
    const trigger = e.target.closest('.menubar-trigger');
    if (trigger) {
      e.stopPropagation();
      const menu = trigger.closest('.menubar-menu');
      const isOpen = trigger.getAttribute('data-state') === 'open';
      isOpen ? closeAllMenus() : openMenu(menu);
      return;
    }

    if (e.target.closest('.menubar-item') && !e.target.closest('.menubar-sub-trigger')) {
      closeAllMenus();
      return;
    }
    
    if (!e.target.closest('.menubar-menu')) {
      closeAllMenus();
    }
  });

  let activeMenubar = null;
  document.querySelectorAll('.menubar').forEach(menubar => {
    menubar.addEventListener('mouseover', () => activeMenubar = menubar);
    menubar.querySelectorAll('.menubar-menu .menubar-trigger').forEach(trigger => {
      trigger.addEventListener('mouseenter', () => {
        if (activeMenubar && activeMenubar.querySelector('.menubar-content[data-state="open"]')) {
          openMenu(trigger.closest('.menubar-menu'));
        }
      });
    });
  });

  document.querySelectorAll('.menubar-sub').forEach(sub => {
    const trigger = sub.querySelector('.menubar-sub-trigger');
    const content = sub.querySelector('.menubar-sub-content');
    let timer;

    const openSub = (e) => {
      e.stopPropagation();
      clearTimeout(timer);
      const parentContent = sub.closest('.menubar-content, .menubar-sub-content');
      if (!parentContent) return;

      parentContent.querySelectorAll('.menubar-sub-content[data-state="open"]').forEach(c => {
        if (c !== content) {
          c.setAttribute('data-state', 'closed');
          c.previousElementSibling.setAttribute('data-state', 'closed');
        }
      });
      
      content.setAttribute('data-state', 'open');
      trigger.setAttribute('data-state', 'open');
      positionContent(trigger, content);
    };

    const closeSub = () => {
      timer = setTimeout(() => {
        content.setAttribute('data-state', 'closed');
        trigger.setAttribute('data-state', 'closed');
      }, 100);
    };

    sub.addEventListener('mouseenter', openSub);
    sub.addEventListener('mouseleave', closeSub);
  });
  
  const reposition = () => {
    document.querySelectorAll('.menubar-content[data-state="open"], .menubar-sub-content[data-state="open"]').forEach(content => {
      const trigger = content.previousElementSibling;
      if(trigger) positionContent(trigger, content);
    });
  };

  window.addEventListener('resize', reposition);
  window.addEventListener('scroll', reposition, true);
}

document.addEventListener('DOMContentLoaded', menubar);
