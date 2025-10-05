/**
 * -----------------------------------------------------------------
 * Toggle
 *
 * A two-state button that can be either on or off. Can be used
 * alone or as part of a Toggle Group.
 * -----------------------------------------------------------------
 */

export default class Toggle {
  constructor(element) {
    this.element = element;
    this.init();
  }

  init() {
    this.element.addEventListener('click', () => {
      const group = this.element.closest('.toggle-group');

      if (group) {
        // It's part of a group, enforce single selection
        const groupToggles = group.querySelectorAll('[data-component="Toggle"]');
        groupToggles.forEach(t => t.setAttribute('aria-pressed', 'false'));
        this.element.setAttribute('aria-pressed', 'true');
      } else {
        // It's a standalone toggle
        const isPressed = this.element.getAttribute('aria-pressed') === 'true';
        this.element.setAttribute('aria-pressed', !isPressed);
      }
    });
  }
}