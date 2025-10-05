/**
 * -----------------------------------------------------------------
 * Dialog
 *
 * A window overlaid on either the primary window or another dialog
 * window, rendering the content underneath inert.
 * -----------------------------------------------------------------
 */

export default class Dialog {
  constructor(element) {
    this.element = element; // The <dialog> element
    this.closeTriggers = this.element.querySelectorAll('[data-dialog-close]');

    this.init();
  }

  init() {
    // Close on backdrop click
    this.element.addEventListener('click', (event) => {
      if (event.target === this.element) {
        this.element.close();
      }
    });

    // Close with buttons inside the dialog
    this.closeTriggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        this.element.close();
      });
    });

    // Close with Escape key (native <dialog> behavior, but good to be explicit)
    this.element.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            this.element.close();
        }
    });
  }
}