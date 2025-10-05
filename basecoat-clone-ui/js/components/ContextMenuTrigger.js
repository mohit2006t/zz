/**
 * -----------------------------------------------------------------
 * Context Menu Trigger
 *
 * An element that triggers a custom context menu on right-click.
 * It uses the `data-context-menu-trigger` attribute to identify
 * which menu popover to display.
 * -----------------------------------------------------------------
 */

export default class ContextMenuTrigger {
  constructor(element) {
    this.element = element;
    this.menuId = this.element.dataset.contextMenuTrigger;
    this.menu = document.getElementById(this.menuId);

    if (!this.menu) {
      console.warn(`Context menu with ID "${this.menuId}" not found.`);
      return;
    }

    this.init();
  }

  init() {
    this.element.addEventListener('contextmenu', (e) => {
      e.preventDefault();

      // Hide all other context menus first
      document.querySelectorAll('.context-menu-popover').forEach(m => m.classList.remove('open'));

      this.menu.classList.add('open');
      // Position the menu at the cursor
      this.menu.style.top = `${e.clientY}px`;
      this.menu.style.left = `${e.clientX}px`;
    });

    // Global listeners to close the menu
    document.addEventListener('click', () => {
      if (this.menu.classList.contains('open')) {
        this.menu.classList.remove('open');
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.menu.classList.contains('open')) {
        this.menu.classList.remove('open');
      }
    });
  }
}