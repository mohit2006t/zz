/**
 * @file select.js
 * @description Manages the behavior of a custom, accessible select (dropdown) component.
 */
function select() {
    const closeAllSelects = (except) => {
        document.querySelectorAll('.select.select-initialized').forEach(sel => {
            if (sel !== except && sel.classList.contains('is-open')) {
                sel.close();
            }
        });
    };

    const positionContent = (trigger, content) => {
        const rect = trigger.getBoundingClientRect();
        const offset = parseInt(getComputedStyle(content).getPropertyValue('--offset'), 10) || 0;
        
        content.style.setProperty('--trigger-width', `${rect.width}px`);
        
        // Use a temporary clone to get dimensions without a reflow
        const tempContent = content.cloneNode(true);
        tempContent.style.opacity = '0';
        tempContent.style.pointerEvents = 'none';
        document.body.appendChild(tempContent);
        const contentRect = tempContent.getBoundingClientRect();
        document.body.removeChild(tempContent);
        
        const { innerHeight: vh } = window;
        
        let top = rect.bottom + offset;
        // If it overflows, position it above the trigger
        if (top + contentRect.height > vh) {
            top = rect.top - contentRect.height - offset;
        }

        content.style.left = `${rect.left}px`;
        content.style.top = `${top}px`;
    };

    document.querySelectorAll('.select:not(.select-initialized)').forEach(selectElement => {
        const trigger = selectElement.querySelector('.select-trigger');
        const content = selectElement.querySelector('.select-content');
        const valueEl = selectElement.querySelector('.select-value');

        if (!trigger || !content || trigger.disabled) {
            return;
        }

        let isOpen = false;

        const openMenu = () => {
            if (isOpen) return;
            closeAllSelects(selectElement);
            isOpen = true;
            selectElement.classList.add('is-open');
            selectElement.classList.remove('has-hovered');
            trigger.setAttribute('aria-expanded', 'true');
            content.classList.add('select-content-open');
            positionContent(trigger, content);
        };

        const closeMenu = () => {
            if (!isOpen) return;
            isOpen = false;
            selectElement.classList.remove('is-open', 'has-hovered');
            trigger.setAttribute('aria-expanded', 'false');
            content.classList.remove('select-content-open');
        };

        const selectItem = (item) => {
            const textEl = item.querySelector('.select-item-text');
            if (!textEl) return;

            valueEl.textContent = textEl.textContent;
            valueEl.classList.remove('select-value-placeholder');

            const currentSelected = content.querySelector('.select-item-selected');
            if (currentSelected) {
                currentSelected.classList.remove('select-item-selected');
                currentSelected.setAttribute('aria-selected', 'false');
            }

            item.classList.add('select-item-selected');
            item.setAttribute('aria-selected', 'true');
        };

        selectElement.close = closeMenu;

        trigger.setAttribute('aria-haspopup', 'listbox');
        content.setAttribute('role', 'listbox');
        content.querySelectorAll('.select-item').forEach((item, index) => {
            item.setAttribute('role', 'option');
            if (!item.id) item.id = `select-item-${index}-${Math.random()}`;
        });

        content.addEventListener('mouseover', (e) => {
            if (e.target.closest('.select-item') && isOpen) {
                selectElement.classList.add('has-hovered');
            }
        });

        const initialSelected = content.querySelector('.select-item-selected');
        if (initialSelected) {
            selectItem(initialSelected);
        } else if (valueEl) {
            valueEl.textContent = trigger.getAttribute('data-placeholder') || 'Select an option...';
            valueEl.classList.add('select-value-placeholder');
        }

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            isOpen ? closeMenu() : openMenu();
        });

        content.addEventListener('click', (e) => {
            const item = e.target.closest('.select-item');
            if (item) {
                selectItem(item);
                closeMenu();
            }
        });
        
        selectElement.classList.add('select-initialized');
    });

    const repositionActiveMenus = () => {
        document.querySelectorAll('.select.is-open').forEach(selectElement => {
            const trigger = selectElement.querySelector('.select-trigger');
            const content = selectElement.querySelector('.select-content');
            if (trigger && content) {
                positionContent(trigger, content);
            }
        });
    };

    window.addEventListener('resize', repositionActiveMenus);
    window.addEventListener('scroll', repositionActiveMenus, true);

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.select')) {
            closeAllSelects(null);
        }
    });
}

document.addEventListener('DOMContentLoaded', select);
