/**
 * -----------------------------------------------------------------
 * Menubar
 *
 * A horizontal menu bar that contains a set of triggers that each
 * open a submenu.
 * -----------------------------------------------------------------
 */

export default class Menubar {
  constructor(element) {
    this.element = element;
    this.items = this.element.querySelectorAll('[data-menubar-item]');

    this.init();
  }

  init() {
    this.items.forEach(item => {
      const trigger = item.querySelector('.menubar-trigger');
      if (trigger) {
        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          const wasOpen = item.classList.contains('open');

          // Close all other items first
          this.items.forEach(i => i.classList.remove('open'));

          // If it wasn't already open, open it
          if (!wasOpen) {
            item.classList.add('open');
          }
        });
      }
    });

    // Global listeners to close the menu
    document.addEventListener('click', () => {
      this.items.forEach(item => item.classList.remove('open'));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.items.forEach(item => item.classList.remove('open'));
      }
    });
  }
}