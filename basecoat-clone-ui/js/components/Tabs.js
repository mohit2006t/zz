/**
 * -----------------------------------------------------------------
 * Tabs
 *
 * A set of layered sections of content, known as tab panels,
 * that are displayed one at a time.
 * -----------------------------------------------------------------
 */

export default class Tabs {
  constructor(element) {
    this.element = element;
    this.triggers = this.element.querySelectorAll('.tab-trigger');
    this.panels = this.element.querySelectorAll('.tab-content');

    if (this.triggers.length === 0 || this.panels.length === 0) {
      console.warn('Tabs component is missing triggers or panels.', this.element);
      return;
    }

    this.init();
  }

  init() {
    this.triggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        this.activateTab(trigger);
      });
    });
  }

  activateTab(trigger) {
    // Deactivate all other triggers
    this.triggers.forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
      t.setAttribute('tabindex', '-1');
    });

    // Activate the clicked trigger
    trigger.classList.add('active');
    trigger.setAttribute('aria-selected', 'true');
    trigger.setAttribute('tabindex', '0');

    // Hide all panels
    this.panels.forEach(panel => {
      panel.classList.add('hidden');
    });

    // Show the associated panel
    const panelId = trigger.getAttribute('aria-controls');
    const panel = this.element.querySelector(`#${panelId}`);
    if (panel) {
      panel.classList.remove('hidden');
    }
  }
}