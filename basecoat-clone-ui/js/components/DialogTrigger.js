/**
 * -----------------------------------------------------------------
 * Dialog Trigger
 *
 * A button that opens a dialog. It uses the `data-dialog-target`
 * attribute to know which dialog to open.
 * -----------------------------------------------------------------
 */

export default class DialogTrigger {
  constructor(element) {
    this.element = element; // The trigger button
    this.targetId = this.element.dataset.dialogTarget;
    this.dialog = document.querySelector(this.targetId);

    if (!this.dialog) {
      console.warn(`Dialog with selector "${this.targetId}" not found.`);
      return;
    }

    this.init();
  }

  init() {
    this.element.addEventListener('click', () => {
      this.dialog.showModal();
    });
  }
}