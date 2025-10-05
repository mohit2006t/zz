/**
 * -----------------------------------------------------------------
 * Collapsible
 *
 * A content area which can be collapsed and expanded.
 * -----------------------------------------------------------------
 */

export default class Collapsible {
  constructor(element) {
    this.element = element;
    this.trigger = this.element.querySelector('.collapsible-trigger');

    if (!this.trigger) {
      console.warn('Collapsible trigger not found within', this.element);
      return;
    }

    this.init();
  }

  init() {
    this.trigger.addEventListener('click', () => {
      this.element.classList.toggle('open');
    });
  }
}