/**
 * @file tree.js
 * @description Initializes a fully ARIA-compliant tree view component.
 */
function tree() {
  const initTreeItem = (item) => {
    const header = item.querySelector(':scope > .tree-item-header');
    const submenu = item.querySelector(':scope > .tree-submenu');
    if (submenu) {
      if (item.getAttribute('aria-expanded') === null) {
        item.setAttribute('aria-expanded', 'false');
      }
      header.addEventListener('click', (e) => {
        if (item.hasAttribute('aria-expanded')) {
            e.preventDefault();
        }
        
        const isExpanded = item.getAttribute('aria-expanded') === 'true';
        item.setAttribute('aria-expanded', !isExpanded);
      });
    }
  };
  document.querySelectorAll('.tree:not(.tree-initialized)').forEach(treeRoot => {
    treeRoot.setAttribute('role', 'tree');
    treeRoot.querySelectorAll(':scope .tree-item').forEach(item => {
      item.setAttribute('role', 'treeitem');
      initTreeItem(item);
    });
    treeRoot.classList.add('tree-initialized');
  });
}
document.addEventListener('DOMContentLoaded', tree);
