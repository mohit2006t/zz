/**
 * @file carousel.js
 * @description Encapsulated and optimized logic for a feature-rich carousel component.
 */
function carousel() {
  document.querySelectorAll('.carousel:not(.carousel-initialized)').forEach(carouselElement => {
    const content = carouselElement.querySelector('.carousel-content');
    const items = Array.from(content.children);
    
    if (items.length <= 1) {
      // No need for a carousel with one or zero items.
      return;
    }

    const options = {
      loop: carouselElement.classList.contains('carousel-loop'),
      autoplay: carouselElement.classList.contains('carousel-autoplay'),
      autoplayDelay: 3000,
      pauseOnHover: true,
    };

    const prevButton = carouselElement.querySelector('.carousel-previous');
    const nextButton = carouselElement.querySelector('.carousel-next');
    const dotsContainer = carouselElement.querySelector('.carousel-dots');
    
    let dots = [];
    let currentIndex = 0;
    let autoplayTimer = null;
    let isUserInteracting = false;

    /**
     * Navigates to a specific slide.
     * @param {number} index - The index of the slide to go to.
     * @param {boolean} [isUserAction=false] - Whether the navigation was triggered by the user.
     */
    const goTo = (index, isUserAction = false) => {
      const newIndex = options.loop
        ? (index + items.length) % items.length
        : Math.max(0, Math.min(index, items.length - 1));

      if (newIndex === currentIndex) return;
      
      currentIndex = newIndex;
      update();

      if (isUserAction && options.autoplay) {
        stopAutoplay();
        startAutoplay();
      }
    };

    /**
     * Updates the carousel's visual state (transform, ARIA attributes, buttons, dots).
     */
    const update = () => {
      content.style.transform = `translateX(${-currentIndex * 100}%)`;

      items.forEach((item, i) => {
        item.setAttribute('aria-hidden', (i !== currentIndex).toString());
      });

      if (prevButton) {
        const isDisabled = !options.loop && currentIndex === 0;
        prevButton.disabled = isDisabled;
        prevButton.setAttribute('data-disabled', isDisabled.toString());
      }

      if (nextButton) {
        const isDisabled = !options.loop && currentIndex >= items.length - 1;
        nextButton.disabled = isDisabled;
        nextButton.setAttribute('data-disabled', isDisabled.toString());
      }

      dots.forEach((dot, i) => {
        const isActive = i === currentIndex;
        dot.setAttribute('data-active', isActive.toString());
        dot.setAttribute('aria-selected', isActive.toString());
      });
    };

    /** Starts the autoplay timer. */
    const startAutoplay = () => {
      if (!options.autoplay || autoplayTimer) return;
      autoplayTimer = setInterval(() => {
        if (!isUserInteracting) {
          goTo(currentIndex + 1);
        }
      }, options.autoplayDelay);
    };

    /** Stops the autoplay timer. */
    const stopAutoplay = () => {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    };

    /** Initializes the carousel. */
    const init = () => {
      // Set up navigation buttons
      if (prevButton) prevButton.addEventListener('click', () => goTo(currentIndex - 1, true));
      if (nextButton) nextButton.addEventListener('click', () => goTo(currentIndex + 1, true));

      // Set up dots indicator
      if (dotsContainer) {
        dotsContainer.innerHTML = '';
        dots = items.map((_, i) => {
          const dot = document.createElement('button');
          dot.className = 'carousel-dot';
          dot.setAttribute('role', 'tab');
          dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
          dot.addEventListener('click', () => goTo(i, true));
          dotsContainer.appendChild(dot);
          return dot;
        });
        dotsContainer.setAttribute('role', 'tablist');
      }

      // Set up autoplay and pause-on-hover behavior
      if (options.autoplay && options.pauseOnHover) {
        carouselElement.addEventListener('mouseenter', () => isUserInteracting = true);
        carouselElement.addEventListener('mouseleave', () => isUserInteracting = false);
      }
      
      update();
      startAutoplay();
      
      carouselElement.classList.add('carousel-initialized');
      carouselElement.carousel = { 
        goTo, 
        next: () => goTo(currentIndex + 1, true), 
        previous: () => goTo(currentIndex - 1, true), 
        destroy: stopAutoplay 
      };
    };

    init();
  });
}

document.addEventListener('DOMContentLoaded', carousel);
