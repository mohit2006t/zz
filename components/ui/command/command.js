/**
 * @file command.js
 * @description Controls a command palette with real-time filtering and keyboard navigation.
 */
function command() {
    document.querySelectorAll('.command:not(.command-initialized)').forEach(commandElement => {
        const input = commandElement.querySelector('.command-input');
        const list = commandElement.querySelector('.command-list');
        const emptyState = commandElement.querySelector('.command-empty');
        
        if (!input || !list) return;
  
        const allItems = Array.from(commandElement.querySelectorAll('.command-item'));
        const allGroups = Array.from(commandElement.querySelectorAll('.command-group'));
        const allSeparators = Array.from(commandElement.querySelectorAll('.command-separator'));
        
        let filteredItems = [];
        let selectedIndex = -1;
  
        const updateSelection = (newIndex) => {
            if (selectedIndex > -1 && filteredItems[selectedIndex]) {
                filteredItems[selectedIndex].removeAttribute('aria-selected');
            }
            selectedIndex = newIndex;
            if (selectedIndex > -1 && filteredItems[selectedIndex]) {
                const selectedItem = filteredItems[selectedIndex];
                selectedItem.setAttribute('aria-selected', 'true');
                selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        };
  
        const updateVisibility = () => {
            const query = input.value.toLowerCase().trim();
            
            filteredItems = [];
            allItems.forEach(item => {
                const isMatch = !query || item.textContent.toLowerCase().includes(query);
                item.style.display = isMatch ? 'flex' : 'none';
                if (isMatch) filteredItems.push(item);
            });
  
            allGroups.forEach(group => {
                const hasVisibleItems = Array.from(group.querySelectorAll('.command-item')).some(item => item.style.display !== 'none');
                group.style.display = hasVisibleItems ? 'block' : 'none';
            });
            
            allSeparators.forEach((sep, index) => {
                const nextGroup = sep.nextElementSibling;
                sep.style.display = (nextGroup && nextGroup.style.display !== 'none') ? 'block' : 'none';
            });
  
            if (emptyState) {
                emptyState.style.display = filteredItems.length === 0 ? 'block' : 'none';
            }
            updateSelection(-1);
        };
  
        const executeItem = (item) => {
            if (item && !item.dataset.disabled) {
                item.click();
            }
        };
  
        input.addEventListener('input', updateVisibility);
  
        input.addEventListener('keydown', (e) => {
            if (filteredItems.length === 0) return;
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    updateSelection((selectedIndex + 1) % filteredItems.length);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    updateSelection((selectedIndex - 1 + filteredItems.length) % filteredItems.length);
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (selectedIndex > -1) executeItem(filteredItems[selectedIndex]);
                    break;
            }
        });
  
        list.addEventListener('mousemove', (e) => {
            const targetItem = e.target.closest('.command-item');
            if (targetItem && filteredItems.includes(targetItem)) {
                const index = filteredItems.indexOf(targetItem);
                if (index !== selectedIndex) {
                    updateSelection(index);
                }
            }
        });
        
        list.addEventListener('click', (e) => {
            const targetItem = e.target.closest('.command-item');
            if (targetItem) executeItem(targetItem);
        });
  
        updateVisibility();
        commandElement.classList.add('command-initialized');
    });
  }
  
  document.addEventListener('DOMContentLoaded', command);
  