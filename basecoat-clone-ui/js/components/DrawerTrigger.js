/**
 * -----------------------------------------------------------------
 * Drawer Trigger
 *
 * A button that opens a drawer panel. It uses the `data-drawer-target`
 * attribute to know which drawer to open.
 * -----------------------------------------------------------------
 */

export default class DrawerTrigger {
  constructor(element) {
    this.element = element; // The trigger button
    this.targetId = this.element.dataset.drawerTarget;
    this.drawer = document.querySelector(this.targetId);

    if (!this.drawer) {
      console.warn(`Drawer with selector "${this.targetId}" not found.`);
      return;
    }

    this.init();
  }

  init() {
    this.element.addEventListener('click', () => {
      this.drawer.classList.add('open');
    });
  }
}