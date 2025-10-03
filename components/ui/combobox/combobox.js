/**
 * @file combobox.js
 * @description Manages the state and interactions of a combobox component.
 */
function combobox() {
    const closeAllComboboxes = (except) => {
        document.querySelectorAll('.combobox.combobox-initialized').forEach(el => {
            if (el !== except && el.isOpen) {
                el.close();
            }
        });
    };
  
    document.querySelectorAll('.combobox:not(.combobox-initialized)').forEach(comboboxElement => {
        const trigger = comboboxElement.querySelector('.combobox-trigger');
        const content = comboboxElement.querySelector('.combobox-content');
        const valueText = trigger.querySelector('.value-text');
        const commandInput = content.querySelector('.command-input');
        const commandItems = content.querySelectorAll('.command-item');
  
        if (!trigger || !content || !valueText) return;
  
        comboboxElement.isOpen = false;
  
        const checkForIcons = () => {
            const hasIcons = content.querySelector('.item-icon');
            content.classList.toggle('has-icons', !!hasIcons);
        };
  
        const positionContent = () => {
            const rect = trigger.getBoundingClientRect();
            content.style.setProperty('--trigger-width', `${rect.width}px`);
            const top = rect.bottom + 4;
            const left = rect.left;
            Object.assign(content.style, { top: `${top}px`, left: `${left}px` });
        };
  
        const openCombobox = () => {
            if (comboboxElement.isOpen) return;
            closeAllComboboxes(comboboxElement);
            comboboxElement.isOpen = true;
            content.setAttribute('data-state', 'open');
            trigger.setAttribute('aria-expanded', 'true');
            checkForIcons();
            positionContent();
            commandInput?.focus();
        };
  
        const closeCombobox = () => {
            if (!comboboxElement.isOpen) return;
            comboboxElement.isOpen = false;
            content.setAttribute('data-state', 'closed');
            trigger.setAttribute('aria-expanded', 'false');
            if (commandInput) {
              commandInput.value = '';
              commandInput.dispatchEvent(new Event('input'));
            }
        };
  
        comboboxElement.close = closeCombobox;
  
        const updateSelection = (item) => {
            if (!item || item.dataset.disabled === 'true') return;
            
            const newText = item.querySelector('span').textContent.trim();
  
            valueText.textContent = newText;
            valueText.classList.remove('placeholder');
  
            commandItems.forEach(i => i.removeAttribute('data-selected'));
            item.setAttribute('data-selected', 'true');
  
            closeCombobox();
        };
  
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            comboboxElement.isOpen ? closeCombobox() : openCombobox();
        });
  
        content.addEventListener('click', (e) => {
            const targetItem = e.target.closest('.command-item');
            if (targetItem) {
                updateSelection(targetItem);
            }
        });
        
        window.addEventListener('resize', () => {
            if (comboboxElement.isOpen) positionContent();
        });
        
        comboboxElement.classList.add('combobox-initialized');
    });
  
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.combobox')) {
            closeAllComboboxes(null);
        }
    });
  }
  
  document.addEventListener('DOMContentLoaded', combobox);
  