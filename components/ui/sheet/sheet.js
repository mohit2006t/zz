/**
 * @file sheet.js
 * @description Manages the behavior of a side panel (sheet) component.
 */
function sheet() {
  const triggers = document.querySelectorAll('[data-sheet-trigger]');
  
  const openSheet = (sheetId) => {
    const sheet = document.getElementById(sheetId);
    if (!sheet) return;
    
    const overlay = sheet.querySelector('.sheet-overlay');
    const content = sheet.querySelector('.sheet-content');
    
    sheet.setAttribute('data-state', 'open');
    if (overlay) overlay.setAttribute('data-state', 'open');
    if (content) content.setAttribute('data-state', 'open');
    
    document.body.style.overflow = 'hidden';
  };

  const closeSheet = (sheet) => {
    const overlay = sheet.querySelector('.sheet-overlay');
    const content = sheet.querySelector('.sheet-content');

    sheet.setAttribute('data-state', 'closed');
    if (overlay) overlay.setAttribute('data-state', 'closed');
    if (content) content.setAttribute('data-state', 'closed');

    // Only unlock scroll if no other sheets are open
    if (document.querySelectorAll('.sheet[data-state="open"]').length === 0) {
      document.body.style.overflow = '';
    }
  };

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const sheetId = trigger.getAttribute('data-sheet-trigger');
      openSheet(sheetId);
    });
  });

  document.querySelectorAll('.sheet').forEach(sheet => {
    const closeButton = sheet.querySelector('.sheet-close');
    const overlay = sheet.querySelector('.sheet-overlay');

    if (closeButton) {
      closeButton.addEventListener('click', () => closeSheet(sheet));
    }
    if (overlay) {
      overlay.addEventListener('click', () => closeSheet(sheet));
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.sheet[data-state="open"]').forEach(closeSheet);
    }
  });
}

document.addEventListener('DOMContentLoaded', sheet);
