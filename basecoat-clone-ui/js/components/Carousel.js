/**
 * -----------------------------------------------------------------
 * Carousel
 *
 * An interactive slideshow for cycling through images or content,
 * with previous/next controls and pagination.
 * -----------------------------------------------------------------
 */

export default class Carousel {
  constructor(element) {
    this.element = element;
    this.track = this.element.querySelector('.carousel-track');
    this.slides = Array.from(this.track.children);
    this.nextButton = this.element.querySelector('.carousel-next-btn');
    this.prevButton = this.element.querySelector('.carousel-prev-btn');
    this.dotsNav = this.element.querySelector('.carousel-pagination');
    this.dots = Array.from(this.dotsNav.children);

    this.currentIndex = 0;
    this.slideWidth = this.slides[0].getBoundingClientRect().width;

    this.init();
  }

  init() {
    // Event listeners
    this.prevButton.addEventListener('click', () => this.moveTo('prev'));
    this.nextButton.addEventListener('click', () => this.moveTo('next'));
    this.dotsNav.addEventListener('click', (e) => {
      const targetDot = e.target.closest('button');
      if (!targetDot) return;
      const targetIndex = this.dots.findIndex(dot => dot === targetDot);
      this.moveTo(targetIndex);
    });

    this.update();
  }

  moveTo(direction) {
    if (direction === 'prev') {
      this.currentIndex = this.currentIndex === 0 ? this.slides.length - 1 : this.currentIndex - 1;
    } else if (direction === 'next') {
      this.currentIndex = this.currentIndex === this.slides.length - 1 ? 0 : this.currentIndex + 1;
    } else {
      this.currentIndex = direction;
    }
    this.update();
  }

  update() {
    this.track.style.transform = `translateX(-${this.slideWidth * this.currentIndex}px)`;

    this.dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === this.currentIndex);
    });
  }
}