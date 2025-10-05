/**
 * -----------------------------------------------------------------
 * Dropdown
 *
 * A menu that appears when a trigger element is clicked,
 * displaying a list of actions or options.
 * -----------------------------------------------------------------
 */

export default class Dropdown {
  constructor(element) {
    this.element = element;
    this.trigger = this.element.querySelector('.dropdown-trigger');

    this.init();
  }

  init() {
    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasOpen = this.element.classList.contains('open');

      // Close all other dropdowns first
      document.querySelectorAll('[data-component="Dropdown"]').forEach(d => {
        d.classList.remove('open');
      });

      if (!wasOpen) {
        this.element.classList.add('open');
      }
    });

    // Global click listener to close open dropdowns
    document.addEventListener('click', () => {
      if (this.element.classList.contains('open')) {
        this.element.classList.remove('open');
      }
    });
  }
}