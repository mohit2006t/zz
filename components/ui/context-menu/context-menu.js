/**
 * @file context-menu.js
 * @description Controls the behavior of a custom context menu component.
 */
function contextMenu() {
  const updateScrollLock = () => {
    const isOpen = !!document.querySelector('.context-menu-content[data-state="open"]');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  const checkForIcons = menuContent => {
    if (!menuContent) return;
    const hasIcons = menuContent.querySelector('.context-menu-item > i, .context-menu-item > svg, .context-menu-sub-trigger > i, .context-menu-sub-trigger > svg');
    menuContent.classList.toggle('has-icons', !!hasIcons);
  };

  const positionContent = (content, x, y) => {
    const { innerWidth: vw, innerHeight: vh } = window;
    const margin = 8;
    
    const tempContent = content.cloneNode(true);
    tempContent.style.visibility = 'hidden';
    document.body.appendChild(tempContent);
    const menuRect = tempContent.getBoundingClientRect();
    document.body.removeChild(tempContent);

    let left = x + 2;
    if (x + menuRect.width > vw - margin) {
      left = vw - menuRect.width - margin;
    }

    let top = y + 2;
    if (y + menuRect.height > vh - margin) {
      top = vh - menuRect.height - margin;
    }

    Object.assign(content.style, { top: `${top}px`, left: `${left}px` });
  };
  
  const positionSubContent = (trigger, content) => {
    const rect = trigger.getBoundingClientRect();
    const { innerHeight: vh, innerWidth: vw } = window;
    const margin = 8;
    
    const tempContent = content.cloneNode(true);
    tempContent.style.visibility = 'hidden';
    document.body.appendChild(tempContent);
    const contentRect = tempContent.getBoundingClientRect();
    document.body.removeChild(tempContent);

    let left = rect.right;
    if (left + contentRect.width > vw - margin) {
        left = rect.left - contentRect.width;
    }
    let top = Math.max(margin, Math.min(rect.top, vh - contentRect.height - margin));
    
    Object.assign(content.style, { top: `${top}px`, left: `${left}px` });
  };

  document.body.addEventListener('contextmenu', e => {
    const trigger = e.target.closest('.context-menu-trigger');
    if (trigger) {
      e.preventDefault();
      
      document.querySelectorAll('.context-menu-content[data-state="open"]').forEach(m => m.setAttribute('data-state', 'closed'));
      
      const menuContentId = trigger.dataset.target;
      const content = document.getElementById(menuContentId);
      
      if (content) {
        content.setAttribute('data-state', 'open');
        checkForIcons(content);
        positionContent(content, e.clientX, e.clientY);
        updateScrollLock();
      }
    }
  });

  document.body.addEventListener('click', e => {
    if (!e.target.closest('.context-menu-content')) {
      document.querySelectorAll('.context-menu-content[data-state="open"]').forEach(el => el.setAttribute('data-state', 'closed'));
      updateScrollLock();
    } else if (e.target.closest('.context-menu-item:not(.context-menu-sub-trigger)')) {
      document.querySelectorAll('.context-menu-content[data-state="open"]').forEach(el => el.setAttribute('data-state', 'closed'));
      updateScrollLock();
    }
  });

  document.querySelectorAll('.context-menu-sub').forEach(sub => {
    const trigger = sub.querySelector('.context-menu-sub-trigger');
    const content = sub.querySelector('.context-menu-sub-content');
    let timer;

    const open = e => {
      e.stopPropagation();
      clearTimeout(timer);
      const parentMenu = sub.closest('[data-state="open"]');
      if (!parentMenu) return;

      parentMenu.querySelectorAll('.context-menu-sub-content[data-state="open"]').forEach(c => {
        if (c !== content) {
          c.setAttribute('data-state', 'closed');
          c.previousElementSibling.setAttribute('data-state', 'closed');
        }
      });

      content.setAttribute('data-state', 'open');
      trigger.setAttribute('data-state', 'open');
      checkForIcons(content);
      positionSubContent(trigger, content);
    };

    const close = () => {
      timer = setTimeout(() => {
        content.setAttribute('data-state', 'closed');
        trigger.setAttribute('data-state', 'closed');
      }, 100);
    };

    sub.addEventListener('mouseenter', open);
    sub.addEventListener('mouseleave', close);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.context-menu-content[data-state="open"]').forEach(el => el.setAttribute('data-state', 'closed'));
      updateScrollLock();
    }
  });
}

document.addEventListener('DOMContentLoaded', contextMenu);
