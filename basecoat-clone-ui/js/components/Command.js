/**
 * -----------------------------------------------------------------
 * Command
 *
 * A searchable command palette that allows users to find and
 * execute actions.
 * -----------------------------------------------------------------
 */

export default class Command {
  constructor(element) {
    this.element = element; // The dialog element with [data-component="Command"]
    this.input = this.element.querySelector('.command-input');
    this.list = this.element.querySelector('.command-list');
    this.items = this.list.querySelectorAll('.command-item');
    this.groups = this.list.querySelectorAll('.command-group');
    this.emptyState = this.list.querySelector('.command-empty');
    this.highlightedIndex = 0;

    this.init();
  }

  init() {
    this.input.addEventListener('input', () => this.filter());
    this.element.addEventListener('keydown', (e) => this.handleKeydown(e));

    // Initial filter call
    this.filter();
  }

  filter() {
    const query = this.input.value.toLowerCase();
    let hasVisibleItems = false;

    this.groups.forEach(group => {
      const groupItems = group.querySelectorAll('.command-item');
      let visibleInGroup = 0;

      groupItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        const isVisible = text.includes(query);
        item.style.display = isVisible ? '' : 'none';
        if (isVisible) {
          visibleInGroup++;
          hasVisibleItems = true;
        }
      });

      const heading = group.querySelector('.command-group-heading');
      if (heading) {
        heading.style.display = visibleInGroup > 0 ? '' : 'none';
      }
    });

    this.emptyState.style.display = hasVisibleItems ? 'none' : 'block';
    this.updateHighlight();
  }

  updateHighlight() {
    const visibleItems = Array.from(this.items).filter(item => item.style.display !== 'none');

    visibleItems.forEach((item, index) => {
      item.classList.toggle('highlighted', index === this.highlightedIndex);
    });
  }

  handleKeydown(e) {
    const visibleItems = Array.from(this.items).filter(item => item.style.display !== 'none');
    if (!visibleItems.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.highlightedIndex = (this.highlightedIndex + 1) % visibleItems.length;
      this.updateHighlight();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.highlightedIndex = (this.highlightedIndex - 1 + visibleItems.length) % visibleItems.length;
      this.updateHighlight();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.highlightedIndex > -1 && visibleItems[this.highlightedIndex]) {
        visibleItems[this.highlightedIndex].click();
         const dialog = this.element.closest('dialog');
         if(dialog) dialog.close();
      }
    }
  }
}