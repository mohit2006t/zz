/**
 * @file sidebar.js
 * @description The definitive script for a stateful sidebar with snap-to-hide resizing.
 */
function sidebar() {
    const updateAria = (sidebarId) => {
      const sidebar = document.getElementById(sidebarId);
      if (!sidebar) return;
      const isExpanded = !sidebar.classList.contains('collapsed') && !sidebar.classList.contains('collapsed-completely');
      document.querySelectorAll(`[aria-controls="${sidebarId}"]`).forEach(btn => btn.setAttribute('aria-expanded', String(isExpanded)));
    };
  
    document.body.addEventListener('click', (e) => {
      const trigger = e.target.closest('.sidebar-trigger-partial, .sidebar-trigger-complete');
      if (!trigger) return;
      const sidebarId = trigger.getAttribute('aria-controls');
      const sidebar = document.getElementById(sidebarId);
      if (!sidebar) return;
  
      const storageKey = `sidebar-collapsed-${sidebarId}`;
      const storageKeyComplete = `sidebar-collapsed-completely-${sidebarId}`;
  
      if (trigger.classList.contains('sidebar-trigger-complete')) {
        const isHidden = sidebar.classList.toggle('collapsed-completely');
        localStorage.setItem(storageKeyComplete, isHidden);
        if (isHidden) {
          sidebar.classList.remove('collapsed');
          localStorage.removeItem(storageKey);
        }
      } else {
        if (sidebar.classList.contains('collapsed-completely')) {
          sidebar.classList.remove('collapsed-completely');
          localStorage.removeItem(storageKeyComplete);
        } else {
          const isPartiallyCollapsed = sidebar.classList.toggle('collapsed');
          localStorage.setItem(storageKey, isPartiallyCollapsed);
        }
      }
      updateAria(sidebarId);
    });
  
    document.querySelectorAll('.sidebar[id]').forEach(sidebar => {
      const sidebarId = sidebar.id;
      const widthStorageKey = `sidebar-width-${sidebarId}`;
  
      if (localStorage.getItem(`sidebar-collapsed-completely-${sidebarId}`) === 'true') {
        sidebar.classList.add('collapsed-completely');
      } else if (localStorage.getItem(`sidebar-collapsed-${sidebarId}`) === 'true') {
        sidebar.classList.add('collapsed');
      }
      updateAria(sidebarId);
  
      if (sidebar.classList.contains('resizable')) {
        const savedWidth = localStorage.getItem(widthStorageKey);
        if (savedWidth && !sidebar.classList.contains('collapsed')) {
          sidebar.style.setProperty('--sidebar-current-width', savedWidth);
        }
  
        const resizer = document.createElement('div');
        resizer.className = 'sidebar-resizer';
        sidebar.appendChild(resizer);
        
        resizer.addEventListener('mousedown', (e) => {
          e.preventDefault();
          sidebar.classList.add('is-resizing');
          const originalTransition = sidebar.style.transition;
          sidebar.style.transition = 'none';
  
          const startX = e.clientX;
          const startWidth = sidebar.offsetWidth;
          const isRight = sidebar.classList.contains('sidebar-right');
          
          const minWidth = parseInt(sidebar.dataset.minWidth) || 54;
          const maxWidth = parseInt(sidebar.dataset.maxWidth) || (window.innerWidth * 0.8);
  
          const doDrag = (e) => {
            const newWidth = isRight ? startWidth - (e.clientX - startX) : startWidth + (e.clientX - startX);
            const clampedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
            sidebar.style.setProperty('--sidebar-current-width', `${clampedWidth}px`);
          };
  
          const stopDrag = () => {
            sidebar.classList.remove('is-resizing');
            sidebar.style.transition = originalTransition;
            
            // --- SNAP-TO-HIDE LOGIC ---
            const finalWidth = sidebar.offsetWidth;
            if (finalWidth <= minWidth) {
                // If dragged to min width, trigger complete collapse
                sidebar.classList.add('collapsed-completely');
                sidebar.classList.remove('collapsed');
                
                localStorage.setItem(`sidebar-collapsed-completely-${sidebarId}`, 'true');
                localStorage.removeItem(`sidebar-collapsed-${sidebarId}`);
                localStorage.removeItem(widthStorageKey);
                
                // Clear the inline style variable so classes take over on next open
                sidebar.style.removeProperty('--sidebar-current-width');
                updateAria(sidebarId);
            } else {
                // Otherwise, just save the new width
                localStorage.setItem(widthStorageKey, sidebar.style.getPropertyValue('--sidebar-current-width'));
            }
  
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
          };
  
          document.addEventListener('mousemove', doDrag);
          document.addEventListener('mouseup', stopDrag);
        });
      }
    });
  }
  
  document.addEventListener('DOMContentLoaded', sidebar);
  