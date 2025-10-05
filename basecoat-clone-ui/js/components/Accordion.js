/**
 * -----------------------------------------------------------------
 * Accordion
 *
 * A vertically stacked set of interactive headings that each reveal
 * a section of content.
 * -----------------------------------------------------------------
 */

export default class Accordion {
  constructor(element) {
    this.element = element;
    this.triggers = this.element.querySelectorAll('.accordion-trigger');
    this.items = this.element.querySelectorAll('.accordion-item');

    this.init();
  }

  init() {
    this.element.addEventListener('click', (event) => {
      const summary = event.target.closest('.accordion-trigger');
      if (!summary) return;

      event.preventDefault();

      const details = summary.closest('.accordion-item');
      if (!details) return;

      const wasOpen = details.hasAttribute('open');

      // Close all other details elements within this accordion
      this.items.forEach(item => {
        if (item !== details) {
          item.removeAttribute('open');
        }
      });

      // If it wasn't open, open it. If it was open, it's now closed.
      if (!wasOpen) {
        details.setAttribute('open', '');
      }
    });
  }
}