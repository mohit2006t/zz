/**
 * -----------------------------------------------------------------
 * Select
 *
 * A custom select/dropdown component that enhances a native <select>
 * element with custom styling and behavior.
 * -----------------------------------------------------------------
 */

export default class Select {
  constructor(element) {
    this.element = element;
    this.nativeSelect = this.element.querySelector('.hidden-select');
    this.trigger = this.element.querySelector('.select-trigger');
    this.valueDisplay = this.element.querySelector('.select-value');
    this.options = this.element.querySelectorAll('.select-option');

    this.init();
  }

  init() {
    // Set initial value from the native select
    const selectedOption = Array.from(this.nativeSelect.options).find(o => o.selected);
    if (selectedOption) {
        this.valueDisplay.textContent = selectedOption.textContent;
        const customOption = this.element.querySelector(`.select-option[data-value="${selectedOption.value}"]`);
        if(customOption) customOption.classList.add('selected');
    }

    // Toggle popover on trigger click
    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.element.classList.toggle('open');
    });

    // Handle option selection
    this.options.forEach(option => {
      option.addEventListener('click', () => {
        const value = option.getAttribute('data-value');

        this.nativeSelect.value = value;
        this.valueDisplay.textContent = option.textContent;

        this.options.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');

        this.element.classList.remove('open');
      });
    });

    // Global click listener to close open selects
    document.addEventListener('click', () => {
      if (this.element.classList.contains('open')) {
        this.element.classList.remove('open');
      }
    });
  }
}