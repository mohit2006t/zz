/**
 * -----------------------------------------------------------------
 * Sidebar
 *
 * A collapsible side navigation panel.
 * -----------------------------------------------------------------
 */

export default class Sidebar {
  constructor(element) {
    this.element = element;
    this.toggle = this.element.querySelector('.sidebar-toggle');

    if (!this.toggle) {
      console.warn('Sidebar toggle button not found within', this.element);
      return;
    }

    this.init();
  }

  init() {
    this.toggle.addEventListener('click', () => {
      this.element.classList.toggle('collapsed');
    });
  }
}