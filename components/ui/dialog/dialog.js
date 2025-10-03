/**
 * @file dialog.js
 * @description Manages accessible dialog behavior using class-based selectors.
 */
function dialog() {
  const dialogTriggers = document.querySelectorAll('.dialog-trigger');

  dialogTriggers.forEach(trigger => {
    const dialogId = trigger.getAttribute('data-target');
    const dialogElement = document.querySelector(dialogId);
    if (!dialogElement) return;

    const closeButtons = dialogElement.querySelectorAll('.dialog-close-btn');
    const overlay = dialogElement.querySelector('.dialog-overlay');
    
    const focusableSelector = 'a[href], button:not([disabled]), input, textarea, select, details, [tabindex]:not([tabindex="-1"])';
    let focusableElements, firstFocusableElement, lastFocusableElement;

    /**
     * Opens the dialog and traps focus inside it.
     */
    const openDialog = () => {
      dialogElement.style.display = 'block';
      document.body.style.overflow = 'hidden';

      focusableElements = Array.from(dialogElement.querySelectorAll(focusableSelector));
      firstFocusableElement = focusableElements[0];
      lastFocusableElement = focusableElements[focusableElements.length - 1];

      setTimeout(() => firstFocusableElement?.focus(), 50);
    };

    /**
     * Closes the dialog and returns focus to the trigger element.
     */
    const closeDialog = () => {
      // Find and pause any video or audio elements to stop background playback.
      const mediaElements = dialogElement.querySelectorAll('video, audio');
      mediaElements.forEach(media => {
        if (!media.paused) {
          media.pause();
        }
        media.currentTime = 0; // Reset media to the beginning
      });

      dialogElement.style.display = 'none';
      document.body.style.overflow = '';
      trigger.focus();
    };

    /**
     * Handles keyboard events for accessibility (Escape key and Tab trapping).
     * @param {KeyboardEvent} e - The keyboard event.
     */
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        closeDialog();
        return;
      }
      
      if (e.key === 'Tab' && focusableElements.length) {
        const { activeElement } = document;
        if (e.shiftKey && activeElement === firstFocusableElement) {
          lastFocusableElement.focus();
          e.preventDefault();
        } else if (!e.shiftKey && activeElement === lastFocusableElement) {
          firstFocusableElement.focus();
          e.preventDefault();
        }
      }
    };
    
    trigger.addEventListener('click', openDialog);
    closeButtons.forEach(btn => btn.addEventListener('click', closeDialog));
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeDialog();
      });
    }
    dialogElement.addEventListener('keydown', handleKeydown);
  });
}

document.addEventListener('DOMContentLoaded', dialog);