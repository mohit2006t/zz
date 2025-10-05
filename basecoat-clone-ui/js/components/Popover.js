/**
 * -----------------------------------------------------------------
 * Popover
 *
 * A floating card that appears in relation to a trigger element.
 * -----------------------------------------------------------------
 */

export default class Popover {
  constructor(element) {
    this.element = element;
    this.trigger = this.element.querySelector('.popover-trigger');

    this.init();
  }

  init() {
    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasOpen = this.element.classList.contains('open');

      // Close all other popovers first
      document.querySelectorAll('[data-component="Popover"]').forEach(p => {
        p.classList.remove('open');
      });

      if (!wasOpen) {
        this.element.classList.add('open');
      }
    });

    // Global click listener to close open popovers
    document.addEventListener('click', (e) => {
        if (!this.element.contains(e.target)) {
            this.element.classList.remove('open');
        }
    });
  }
}