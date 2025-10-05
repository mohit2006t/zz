/**
 * -----------------------------------------------------------------
 * Combobox
 *
 * An input field that combines a text input with a filterable
 * list of options that appears in a popover.
 * -----------------------------------------------------------------
 */

export default class Combobox {
  constructor(element) {
    this.element = element;
    this.input = this.element.querySelector('.combobox-input');
    this.trigger = this.element.querySelector('.combobox-trigger');
    this.items = this.element.querySelectorAll('.combobox-item');
    this.highlightedIndex = -1;

    this.init();
  }

  init() {
    this.input.addEventListener('focus', () => this.open());
    this.input.addEventListener('input', () => this.filter());
    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    this.items.forEach((item) => {
      item.addEventListener('click', () => this.selectItem(item));
    });

    this.element.addEventListener('keydown', (e) => this.handleKeydown(e));

    document.addEventListener('click', (e) => {
      if (!this.element.contains(e.target)) {
        this.close();
      }
    });
  }

  open() {
    this.element.classList.add('open');
    this.filter();
  }

  close() {
    this.element.classList.remove('open');
    this.highlightedIndex = -1;
    this.items.forEach(item => item.classList.remove('highlighted'));
  }

  toggle() {
    this.element.classList.toggle('open');
  }

  filter() {
    const filter = this.input.value.toLowerCase();
    this.items.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.classList.toggle('hidden', !text.includes(filter));
    });
  }

  selectItem(item) {
    if (item) {
      this.input.value = item.textContent;
      this.items.forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      this.close();
    }
  }

  handleKeydown(e) {
    const visibleItems = Array.from(this.items).filter(i => !i.classList.contains('hidden'));
    if (!visibleItems.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.highlightedIndex = (this.highlightedIndex + 1) % visibleItems.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.highlightedIndex = (this.highlightedIndex - 1 + visibleItems.length) % visibleItems.length;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.highlightedIndex > -1) {
        this.selectItem(visibleItems[this.highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      this.close();
    }

    visibleItems.forEach((item, index) => {
      item.classList.toggle('highlighted', index === this.highlightedIndex);
    });
  }
}