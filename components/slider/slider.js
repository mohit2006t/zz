/**
 * @file slider.js
 * @description Manages the state and behavior of slider components.
 */

export class Slider {
  constructor(sliderElement) {
    if (sliderElement.dataset.initialized) return;
    this.slider = sliderElement;
    this.slider.dataset.initialized = 'true';

    this.input = this.slider.querySelector('.slider-input');
    this.track = this.slider.querySelector('.slider-track, .slider-track-vertical');
    this.range = this.slider.querySelector('.slider-range, .slider-range-vertical');
    this.thumb = this.slider.querySelector('.slider-thumb, .slider-thumb-vertical');
    
    if (!this.input || !this.track || !this.range || !this.thumb) return;

    this.isVertical = this.slider.classList.contains('vertical');
    this.valueDisplay = this.slider.parentElement.querySelector('.slider-value');

    this.bindEvents();
    this.update();
  }

  bindEvents() {
    this.input.addEventListener('input', this.update.bind(this));
    this.track.addEventListener('click', this.handleTrackClick.bind(this));
  }

  update() {
    const value = parseFloat(this.input.value);
    const min = parseFloat(this.input.min);
    const max = parseFloat(this.input.max);
    const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;

    if (this.isVertical) {
      this.range.style.height = `${percent}%`;
      this.thumb.style.bottom = `${percent}%`;
    } else {
      this.range.style.width = `${percent}%`;
      this.thumb.style.left = `${percent}%`;
    }

    if (this.valueDisplay) {
      this.valueDisplay.textContent = value;
    }
    
    this.input.setAttribute('aria-valuenow', value);
  }

  handleTrackClick(e) {
    if (this.input.disabled) return;
    
    e.preventDefault();
    const rect = this.track.getBoundingClientRect();
    const step = parseFloat(this.input.step || '1');
    let percent;

    if (this.isVertical) {
      percent = 1 - ((e.clientY - rect.top) / rect.height);
    } else {
      percent = (e.clientX - rect.left) / rect.width;
    }

    percent = Math.max(0, Math.min(1, percent));
    const min = parseFloat(this.input.min);
    const max = parseFloat(this.input.max);
    let value = min + percent * (max - min);
    value = Math.round(value / step) * step;
    value = Math.max(min, Math.min(max, value));

    this.input.value = value;
    this.input.dispatchEvent(new Event('input', { bubbles: true }));
    this.input.focus();
  }

  // Public API methods
  setValue(value) {
    const min = parseFloat(this.input.min);
    const max = parseFloat(this.input.max);
    value = Math.max(min, Math.min(max, parseFloat(value)));
    this.input.value = value;
    this.update();
  }

  getValue() {
    return parseFloat(this.input.value);
  }

  setDisabled(disabled) {
    this.input.disabled = disabled;
  }
}

// Initialize sliders when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.slider').forEach(sliderElement => new Slider(sliderElement));
});

// Re-initialize sliders when new ones are added to the DOM
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) { // Element node
        if (node.classList && node.classList.contains('slider')) {
          new Slider(node);
        }
        node.querySelectorAll && node.querySelectorAll('.slider').forEach(slider => new Slider(slider));
      }
    });
  });
});

observer.observe(document.body, { childList: true, subtree: true });

export default Slider;
