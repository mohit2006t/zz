/**
 * -----------------------------------------------------------------
 * Drawer
 *
 * A panel that slides in from the side of the screen.
 * -----------------------------------------------------------------
 */

export default class Drawer {
  constructor(element) {
    this.element = element;
    this.closeTriggers = this.element.querySelectorAll('[data-drawer-close]');

    this.init();
  }

  init() {
    this.closeTriggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        this.element.classList.remove('open');
      });
    });

    // Close with Escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.element.classList.contains('open')) {
        this.element.classList.remove('open');
      }
    });
  }
}