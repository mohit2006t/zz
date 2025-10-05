/**
 * -----------------------------------------------------------------
 * Resizable
 *
 * A component that allows the user to drag a handle to resize a panel.
 * -----------------------------------------------------------------
 */

export default class Resizable {
  constructor(element) {
    this.element = element;
    this.handle = this.element.querySelector('.resizable-handle');
    this.isResizing = false;

    if (!this.handle) {
      console.warn('Resizable handle not found within', this.element);
      return;
    }

    this.init();
  }

  init() {
    this.handle.addEventListener('mousedown', (e) => {
      this.isResizing = true;
      this.handle.classList.add('resizing');
      const startX = e.clientX;
      const startWidth = this.element.offsetWidth;

      const doDrag = (e) => {
        if (!this.isResizing) return;
        const newWidth = startWidth + (e.clientX - startX);
        this.element.style.width = `${newWidth}px`;
      };

      const stopDrag = () => {
        this.isResizing = false;
        this.handle.classList.remove('resizing');
        document.removeEventListener('mousemove', doDrag);
        document.removeEventListener('mouseup', stopDrag);
      };

      document.addEventListener('mousemove', doDrag);
      document.addEventListener('mouseup', stopDrag);
    });
  }
}