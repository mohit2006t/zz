/**
 * @file carousel.js
 * @description Manages state, navigation, and control visibility for carousels.
 * Features full accessibility (ARIA) support, autoplay control, and a robust destroy method.
 */

export class Carousel {
  constructor(carouselElement, options = {}) {
    if (!carouselElement || carouselElement.carousel) return;

    this.element = carouselElement;
    this.id = carouselElement.id || `carousel-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };
    
    // Core elements
    this.viewport = this.element.querySelector('.carousel-viewport');
    this.content = this.element.querySelector('.carousel-content');
    this.items = Array.from(this.content.children);
    
    // Navigation elements
    this.prevButton = this.element.querySelector('.carousel-previous');
    this.nextButton = this.element.querySelector('.carousel-next');
    this.dotsContainer = this.element.querySelector('.carousel-dots');
    this.dots = [];
    
    // State
    this.currentIndex = 0;
    this.autoplayTimer = null;
    this.isUserInteracting = false;
    
    // Bound event handlers for proper cleanup
    this._boundHandlePrev = () => this.goTo(this.currentIndex - 1, true);
    this._boundHandleNext = () => this.goTo(this.currentIndex + 1, true);
    this._boundDotHandlers = [];
    
    this.init();
    this.element.carousel = this;
  }

  defaults = {
    loop: false,
    autoplay: false,
    autoplayDelay: 3000,
    swipeEnabled: true,
    pauseOnHover: true
  }

  init() {
    // Hide controls if only one item or no items
    if (this.items.length <= 1) {
      this.hideControls();
      return;
    }

    this.setupAccessibility();
    this.setupNavigation();
    this.setupDots();
    this.setupAutoplay();
    this.update();
    
    // Mark as initialized
    this.element.classList.add('carousel-initialized');
    
    this.emit('init', { totalItems: this.items.length });
  }

  hideControls() {
    if (this.prevButton) this.prevButton.style.display = 'none';
    if (this.nextButton) this.nextButton.style.display = 'none';
    if (this.dotsContainer) this.dotsContainer.style.display = 'none';
  }

  setupAccessibility() {
    this.element.setAttribute('role', 'region');
    this.element.setAttribute('aria-roledescription', 'carousel');
    this.element.setAttribute('aria-label', `Carousel with ${this.items.length} slides`);
    
    this.items.forEach((item, i) => {
      item.setAttribute('role', 'group');
      item.setAttribute('aria-roledescription', 'slide');
      item.setAttribute('aria-label', `${i + 1} of ${this.items.length}`);
    });
  }

  setupNavigation() {
    if (this.prevButton) {
      this.prevButton.addEventListener('click', this._boundHandlePrev);
      this.prevButton.setAttribute('aria-label', 'Previous slide');
    }
    
    if (this.nextButton) {
      this.nextButton.addEventListener('click', this._boundHandleNext);
      this.nextButton.setAttribute('aria-label', 'Next slide');
    }
  }

  setupDots() {
    if (!this.dotsContainer) return;

    this.dotsContainer.innerHTML = ''; // Clear existing dots
    this.dots = [];
    this._boundDotHandlers = [];
    
    this.items.forEach((_, i) => {
      const dot = document.createElement('button');
      const handler = () => this.goTo(i, true);
      
      dot.classList.add('carousel-dot');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', handler);
      
      this.dotsContainer.appendChild(dot);
      this.dots.push(dot);
      this._boundDotHandlers.push(handler);
    });
    
    this.dotsContainer.setAttribute('role', 'tablist');
    this.dotsContainer.setAttribute('aria-label', 'Carousel navigation');
  }

  setupAutoplay() {
    if (!this.options.autoplay) return;

    // Start autoplay
    this.startAutoplay();

    // Pause on hover if enabled
    if (this.options.pauseOnHover) {
      this.element.addEventListener('mouseenter', () => this.pauseAutoplay());
      this.element.addEventListener('mouseleave', () => this.resumeAutoplay());
    }

    // Pause on focus (accessibility)
    this.element.addEventListener('focusin', () => this.pauseAutoplay());
    this.element.addEventListener('focusout', () => this.resumeAutoplay());
  }

  startAutoplay() {
    if (!this.options.autoplay || this.autoplayTimer) return;

    this.autoplayTimer = setInterval(() => {
      if (!this.isUserInteracting) {
        const nextIndex = this.options.loop 
          ? this.wrapIndex(this.currentIndex + 1)
          : Math.min(this.currentIndex + 1, this.items.length - 1);
        
        // If not looping and at the end, stop autoplay
        if (!this.options.loop && nextIndex === this.currentIndex) {
          this.stopAutoplay();
          return;
        }
        
        this.goTo(nextIndex, false);
      }
    }, this.options.autoplayDelay);

    this.emit('autoplay:start', {});
  }

  stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
      this.emit('autoplay:stop', {});
    }
  }

  pauseAutoplay() {
    this.isUserInteracting = true;
  }

  resumeAutoplay() {
    // Small delay to avoid immediate resume
    setTimeout(() => {
      this.isUserInteracting = false;
    }, 100);
  }

  toggleAutoplay(enable = null) {
    const shouldEnable = enable !== null ? enable : !this.options.autoplay;
    this.options.autoplay = shouldEnable;

    if (shouldEnable) {
      this.startAutoplay();
    } else {
      this.stopAutoplay();
    }

    this.emit('autoplay:toggle', { enabled: shouldEnable });
  }

  goTo(index, isUserAction = false) {
    const newIndex = this.options.loop 
      ? this.wrapIndex(index)
      : Math.max(0, Math.min(index, this.items.length - 1));
    
    if (newIndex !== this.currentIndex) {
      const previousIndex = this.currentIndex;
      this.currentIndex = newIndex;
      this.update();
      
      // Reset autoplay timer on user interaction
      if (isUserAction && this.options.autoplay) {
        this.stopAutoplay();
        this.startAutoplay();
      }
      
      this.emit('slide', { 
        currentIndex: this.currentIndex, 
        previousIndex,
        currentSlide: this.items[this.currentIndex],
        isUserAction
      });
    }
  }

  wrapIndex(index) {
    if (index < 0) return this.items.length - 1;
    if (index >= this.items.length) return 0;
    return index;
  }

  next() {
    this.goTo(this.currentIndex + 1, true);
  }

  previous() {
    this.goTo(this.currentIndex - 1, true);
  }

  update() {
    const offset = -this.currentIndex * 100;
    this.content.style.transform = `translateX(${offset}%)`;
    
    // Update ARIA states
    this.items.forEach((item, i) => {
      item.setAttribute('aria-hidden', (i !== this.currentIndex).toString());
    });
    
    // Update navigation button states
    if (this.prevButton) {
      const isDisabled = !this.options.loop && this.currentIndex === 0;
      this.prevButton.setAttribute('data-disabled', isDisabled.toString());
      this.prevButton.disabled = isDisabled;
    }
    
    if (this.nextButton) {
      const isDisabled = !this.options.loop && this.currentIndex >= this.items.length - 1;
      this.nextButton.setAttribute('data-disabled', isDisabled.toString());
      this.nextButton.disabled = isDisabled;
    }

    // Update dots
    if (this.dots.length > 0) {
      this.dots.forEach((dot, i) => {
        const isActive = i === this.currentIndex;
        dot.setAttribute('data-active', isActive.toString());
        dot.setAttribute('aria-selected', isActive.toString());
      });
    }
  }

  // Custom event system
  emit(event, data) {
    this.element.dispatchEvent(new CustomEvent(`carousel:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }

  // Cleanup method
  destroy() {
    // Stop autoplay
    this.stopAutoplay();

    // Remove event listeners
    if (this.prevButton) {
      this.prevButton.removeEventListener('click', this._boundHandlePrev);
    }
    
    if (this.nextButton) {
      this.nextButton.removeEventListener('click', this._boundHandleNext);
    }
    
    // Remove dot event listeners
    this.dots.forEach((dot, i) => {
      if (this._boundDotHandlers[i]) {
        dot.removeEventListener('click', this._boundDotHandlers[i]);
      }
    });
    
    // Clean up DOM references
    this.element.classList.remove('carousel-initialized');
    delete this.element.carousel;
    
    this.emit('destroy', {});
  }
}

// Auto-initialize all carousels on the page
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.carousel:not(.carousel-initialized)').forEach(el => {
    el.carousel = new Carousel(el);
  });
});

export default Carousel;
