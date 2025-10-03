/**
 * @file slider.js
 * @description Controls the behavior of a custom slider component with step support.
 */
function slider() {
  const sliders = document.querySelectorAll('.slider:not(.slider-initialized)');

  sliders.forEach(slider => {
    const track = slider.querySelector('.slider-track');
    const range = slider.querySelector('.slider-range');
    const thumb = slider.querySelector('.slider-thumb');
    const isVertical = slider.classList.contains('slider-vertical');
    
    let isActive = false;

    const updateSlider = (clientX, clientY) => {
      if (slider.hasAttribute('data-disabled')) return;
      const rect = track.getBoundingClientRect();
      const step = parseFloat(slider.dataset.step) || 1;
      const max = parseFloat(slider.dataset.max) || 100;
      let rawValue;

      if (isVertical) {
        rawValue = 1 - (clientY - rect.top) / rect.height;
      } else {
        rawValue = (clientX - rect.left) / rect.width;
      }
      
      rawValue = Math.max(0, Math.min(1, rawValue));
      
      const value = rawValue * max;
      const numSteps = Math.round(value / step);
      const steppedValue = numSteps * step;
      
      const percent = (steppedValue / max) * 100;

      if (isVertical) {
        range.style.height = `${percent}%`;
        thumb.style.bottom = `${percent}%`;
      } else {
        range.style.width = `${percent}%`;
        thumb.style.left = `${percent}%`;
      }

      slider.setAttribute('data-value', steppedValue);
    };

    const onDragStart = (e) => {
      isActive = true;
      slider.classList.add('is-dragging');
      const clientX = e.clientX ?? e.touches[0].clientX;
      const clientY = e.clientY ?? e.touches[0].clientY;
      updateSlider(clientX, clientY);
    };

    const onDragMove = (e) => {
      if (!isActive) return;
      e.preventDefault();
      const clientX = e.clientX ?? e.touches[0].clientX;
      const clientY = e.clientY ?? e.touches[0].clientY;
      updateSlider(clientX, clientY);
    };

    const onDragEnd = () => {
      isActive = false;
      slider.classList.remove('is-dragging');
    };

    // Event listeners for mouse and touch
    slider.addEventListener('mousedown', onDragStart);
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    slider.addEventListener('touchstart', onDragStart, { passive: false });
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd);

    // Set initial position based on data-value
    const initialValue = parseFloat(slider.dataset.value) || 0;
    const max = parseFloat(slider.dataset.max) || 100;
    const initialPercent = (initialValue / max) * 100;

    if (isVertical) {
      range.style.height = `${initialPercent}%`;
      thumb.style.bottom = `${initialPercent}%`;
    } else {
      range.style.width = `${initialPercent}%`;
      thumb.style.left = `${initialPercent}%`;
    }
    
    slider.classList.add('slider-initialized');
  });
}

document.addEventListener('DOMContentLoaded', slider);
