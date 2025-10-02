/**
 * @module useDnd
 * @description A collection of feature-rich, un-opinionated engines for managing
 * every aspect of drag-and-drop. Built for the complex requirements of a production
 * UI library, these engines handle the logic and provide data, leaving DOM updates
 * to your components.
 *
 * @example
 * // In your Kanban Board Component Class...
 * import { useDnd } from './utils';
 *
 * class KanbanColumn {
 *   constructor(element) {
 *     this.element = element;
 *     this.columnType = element.dataset.columnType; // e.g., 'task' or 'bug'
 *
 *     this.droppableEngine = useDnd.droppable(this.element, {
 *       accepts: ['task', 'bug'], // Accepts both types
 *       onDrop: ({ payload }) => {
 *         // The engine provides the data; the component handles the logic.
 *         console.log(`Received item ${payload.id} in column ${this.columnType}`);
 *         this.addTask(payload);
 *       }
 *     });
 *   }
 * }
 *
 * class KanbanCard {
 *   constructor(element) {
 *     this.element = element;
 *     const cardId = element.dataset.id;
 *     const cardType = element.dataset.cardType; // 'task'
 *
 *     this.draggableEngine = useDnd.draggable(this.element, {
 *       handleSelector: '.drag-handle',
 *       dragType: cardType,
 *       payload: { id: cardId, title: 'Refactor the API' },
 *       onDragStart: () => this.element.classList.add('is-ghosted'),
 *       onDragEnd: () => this.element.classList.remove('is-ghosted'),
 *     });
 *   }
 * }
 */

// A lightweight, module-scoped state manager for communication between engines.
const dndState = {
  isDragging: false,
  dragType: null,
  payload: null,
  sourceElement: null,
};

// ============================================================================
// DRAGGABLE ENGINE
// ============================================================================
const useDraggable = (element, options = {}) => {
  if (!element) throw new Error('useDraggable requires an element.');

  const config = {
    handleSelector: null,
    draggingClass: 'is-dragging',
    dragType: 'application/json',
    payload: {},
    dragDelay: 0,
    onDragStart: () => {},
    onDragMove: () => {},
    onDragEnd: () => {},
    ...options,
  };

  let isDragging = false;
  let delayTimeout = null;

  const startDrag = (event) => {
    isDragging = true;
    dndState.isDragging = true;
    dndState.dragType = config.dragType;
    dndState.payload = config.payload;
    dndState.sourceElement = element;

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp, { once: true });
    element.classList.add(config.draggingClass);
    config.onDragStart({ event, element, payload: config.payload });
  };

  const handlePointerDown = (event) => {
    if (config.handleSelector && !event.target.closest(config.handleSelector)) {
      return;
    }
    event.preventDefault();

    if (config.dragDelay > 0) {
      delayTimeout = setTimeout(() => startDrag(event), config.dragDelay);
    } else {
      startDrag(event);
    }
  };

  const handlePointerMove = (event) => {
    if (isDragging) {
      config.onDragMove({ event, element });
    }
  };
  
  const handlePointerUp = (event) => {
    clearTimeout(delayTimeout);
    if (!isDragging) return;

    isDragging = false;
    document.removeEventListener('pointermove', handlePointerMove);
    element.classList.remove(config.draggingClass);
    
    config.onDragEnd({ event, element });

    // Reset global state after the event cycle
    setTimeout(() => {
      dndState.isDragging = false;
      dndState.dragType = null;
      dndState.payload = null;
      dndState.sourceElement = null;
    }, 0);
  };

  element.addEventListener('pointerdown', handlePointerDown);
  
  return {
    destroy: () => element.removeEventListener('pointerdown', handlePointerDown),
    get isDragging() { return isDragging; },
  };
};

// ============================================================================
// DROPPABLE ENGINE
// ============================================================================
const useDroppable = (element, options = {}) => {
  if (!element) throw new Error('useDroppable requires an element.');

  const config = {
    hoverClass: 'is-drop-target',
    accepts: [], // Array of strings (dragTypes) or function
    onDrop: () => {},
    onDragEnter: () => {},
    onDragLeave: () => {},
    ...options,
  };

  const canAccept = (type, files) => {
    if (files.length > 0) return true; // Always accept file drops initially
    if (!config.accepts || config.accepts.length === 0) return true;
    if (typeof config.accepts === 'function') return config.accepts(type);
    return config.accepts.includes(type);
  };

  const handleDragEnter = (e) => {
    if (canAccept(dndState.dragType, e.dataTransfer.files)) {
      element.classList.add(config.hoverClass);
      config.onDragEnter({ dragType: dndState.dragType, payload: dndState.payload });
    }
  };

  const handleDragLeave = () => {
    element.classList.remove(config.hoverClass);
    config.onDragLeave();
  };

  const handleDragOver = (e) => {
    if (canAccept(dndState.dragType, e.dataTransfer.files)) {
      e.preventDefault(); // This is crucial to allow a drop
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    element.classList.remove(config.hoverClass);
    
    if (e.dataTransfer.files.length > 0) {
        // Handle file drops
        config.onDrop({ files: Array.from(e.dataTransfer.files) });
    } else if (dndState.isDragging && canAccept(dndState.dragType)) {
        // Handle internal drops
        config.onDrop({ payload: dndState.payload, dragType: dndState.dragType });
    }
  };

  const events = { dragenter: handleDragEnter, dragleave: handleDragLeave, dragover: handleDragOver, drop: handleDrop };
  Object.entries(events).forEach(([name, handler]) => element.addEventListener(name, handler));

  return {
    destroy: () => Object.entries(events).forEach(([name, handler]) => element.removeEventListener(name, handler)),
  };
};

// ============================================================================
// SORTABLE ENGINE
// ============================================================================
const useSortable = (container, options = {}) => {
  if (!container) throw new Error('useSortable requires a container element.');

  const config = {
    itemSelector: '[data-sortable-item]',
    handleSelector: null,
    disabledSelector: '[aria-disabled="true"]',
    draggingClass: 'is-sorting',
    placeholderClass: 'sortable-placeholder',
    onDragStart: () => {},
    onSort: () => {},
    onSortEnd: () => {},
    ...options,
  };

  let draggedItem = null;
  let placeholder = null;
  let initialIndex = -1;

  const getItems = () => Array.from(container.querySelectorAll(config.itemSelector));
  const getDragAfterElement = (y) => {
    const otherItems = getItems().filter(item => item !== draggedItem && !item.contains(draggedItem));
    const closest = otherItems.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      return (offset < 0 && offset > closest.offset) ? { offset, element: child } : closest;
    }, { offset: Number.NEGATIVE_INFINITY });
    return closest.element;
  };

  const handleDragStart = (e) => {
    if (e.target.closest(config.disabledSelector)) return;
    if (config.handleSelector && !e.target.closest(config.handleSelector)) return;
    
    const item = e.target.closest(config.itemSelector);
    if (!item) return;
    
    draggedItem = item;
    initialIndex = getItems().indexOf(draggedItem);
    e.dataTransfer.effectAllowed = 'move';

    placeholder = document.createElement('div');
    placeholder.className = config.placeholderClass;
    placeholder.style.height = `${draggedItem.offsetHeight}px`;
    
    draggedItem.classList.add(config.draggingClass);
    config.onDragStart({ item: draggedItem, index: initialIndex });
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    if (!draggedItem) return;
    draggedItem.hidden = true; // Hide original while placeholder is visible
    container.insertBefore(placeholder, getDragAfterElement(e.clientY));
  };
  
  const handleDragEnd = (e) => {
    if (!draggedItem) return;

    draggedItem.hidden = false;
    const finalItems = getItems().filter(i => i !== draggedItem);
    const newIndex = finalItems.indexOf(placeholder) > -1 ? finalItems.indexOf(placeholder) : getItems().indexOf(placeholder);

    // Let the consuming component know the sort is complete
    config.onSortEnd({ item: draggedItem, oldIndex: initialIndex, newIndex });

    // Cleanup
    draggedItem.classList.remove(config.draggingClass);
    placeholder?.remove();
    draggedItem = null;
    placeholder = null;
    initialIndex = -1;
  };

  const handleDrop = (e) => {
      e.preventDefault();
      if (!draggedItem) return;
      
      const itemsBeforeDrop = getItems();
      const newIndex = itemsBeforeDrop.indexOf(placeholder);

      // The engine provides the data needed for the component to re-render.
      config.onSort({
        item: draggedItem,
        oldIndex: initialIndex,
        newIndex,
        getFinalOrder: () => {
           const reordered = [...itemsBeforeDrop.filter(i => i !== placeholder && i !== draggedItem)];
           reordered.splice(newIndex, 0, draggedItem);
           return reordered;
        }
      });
  };

  container.addEventListener('dragstart', handleDragStart);
  container.addEventListener('dragover', handleDragOver);
  container.addEventListener('dragend', handleDragEnd);
  container.addEventListener('drop', handleDrop);

  return {
    destroy: () => {
      container.removeEventListener('dragstart', handleDragStart);
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('dragend', handleDragEnd);
      container.removeEventListener('drop', handleDrop);
    },
  };
};

// ============================================================================
// MAIN EXPORT
// ============================================================================
export const useDnd = {
  draggable: useDraggable,
  droppable: useDroppable,
  sortable: useSortable,
};

export default useDnd;