/**
 * @file progress.js
 * @description Initializes and dynamically updates progress bars based on data attributes.
 */
function progress() {
    /**
     * Updates the visual state of a single progress bar element.
     * @param {HTMLElement} progressElement - The .progress element to update.
     */
    const updateProgress = (progressElement) => {
      const indicator = progressElement.querySelector('.progress-indicator');
      if (!indicator) return;
  
      const value = Number(progressElement.getAttribute('data-value')) || 0;
      const max = Number(progressElement.getAttribute('data-max')) || 100;
      const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
      // Update the CSS custom property and ARIA attribute for accessibility
      indicator.style.setProperty('--progress-value', `${percentage}%`);
      progressElement.setAttribute('aria-valuenow', percentage);
    };
  
    document.querySelectorAll('.progress:not(.progress-initialized)').forEach(progressElement => {
      updateProgress(progressElement);
  
      // Use a MutationObserver to watch for changes to data-value and data-max
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.type === 'attributes' && (mutation.attributeName === 'data-value' || mutation.attributeName === 'data-max')) {
            updateProgress(progressElement);
          }
        });
      });
  
      observer.observe(progressElement, { attributes: true });
      progressElement.classList.add('progress-initialized');
    });
  }
  
  document.addEventListener('DOMContentLoaded', progress);
  