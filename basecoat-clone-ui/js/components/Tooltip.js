/**
 * -----------------------------------------------------------------
 * Tooltip
 *
 * A popup that displays information related to an element
 * when the element receives keyboard focus or the mouse hovers over it.
 * -----------------------------------------------------------------
 */

export default class Tooltip {
  constructor(element) {
    this.element = element; // The tooltip container with [data-component="Tooltip"]
    this.trigger = this.element.querySelector('.tooltip-trigger');

    if (!this.trigger) {
      console.warn('Tooltip trigger not found within', this.element);
      return;
    }

    this.init();
  }

  init() {
    const showTooltip = () => this.element.classList.add('visible');
    const hideTooltip = () => this.element.classList.remove('visible');

    // Show on hover or focus
    this.trigger.addEventListener('mouseenter', showTooltip);
    this.trigger.addEventListener('focus', showTooltip);

    // Hide on mouse leave or blur
    this.trigger.addEventListener('mouseleave', hideTooltip);
    this.trigger.addEventListener('blur', hideTooltip);
  }
}