/**
 * @module usePagination
 * @description A headless engine for managing pagination state and logic. It calculates
 * page numbers, truncation (ellipses), and provides all necessary data for a UI
 * component to render a complete pagination control.
 *
 * @example
 * // In your Pagination Component Class...
 * import { usePagination } from './utils';
 *
 * class Pagination {
 *   constructor(element) {
 *     this.element = element;
 *
 *     this.paginationEngine = usePagination({
 *       totalCount: 1000,
 *       pageSize: 10,
 *       siblings: 1,
 *       boundaries: 1
 *     });
 *
 *     this.unsubscribe = this.paginationEngine.subscribe(state => {
 *       // The engine gives us the data. The component renders it.
 *       this.render(state);
 *     });
 *   }
 *
 *   render({ pages, isFirstPage, isLastPage }) {
 *     const prevDisabled = isFirstPage ? 'disabled' : '';
 *     const nextDisabled = isLastPage ? 'disabled' : '';
 *
 *     this.element.innerHTML = `
 *       <button class="prev" ${prevDisabled}>Prev</button>
 *       ${pages.map(p => typeof p === 'number'
 *         ? `<button class="page" data-page="${p}">${p}</button>`
 *         : `<span class="ellipsis">...</span>`
 *       ).join('')}
 *       <button class="next" ${nextDisabled}>Next</button>
 *     `;
 *   }
 *
 *   destroy() { this.unsubscribe(); }
 * }
 */
import { useState } from './useState.js';

const defaultConfig = {
  initialPage: 1,
  pageSize: 10,
  totalCount: 0,
  siblings: 1,
  boundaries: 1,
};

const range = (start, end) => {
  const length = end - start + 1;
  return Array.from({ length }).map((_, i) => start + i);
};

export const usePagination = (options = {}) => {
  const config = { ...defaultConfig, ...options };

  // The entire state of the pagination is held in our generic useState engine.
  const state = useState({});

  const syncState = (currentPage) => {
    const totalPages = Math.ceil(config.totalCount / config.pageSize);
    const clampedPage = Math.max(1, Math.min(currentPage, totalPages));

    const totalNumbers = config.siblings * 2 + 3 + config.boundaries * 2;
    let pages = [];

    if (totalNumbers >= totalPages) {
      pages = range(1, totalPages);
    } else {
      const startPages = range(1, config.boundaries);
      const endPages = range(totalPages - config.boundaries + 1, totalPages);

      const leftSiblingIndex = Math.max(clampedPage - config.siblings, config.boundaries + 1);
      const rightSiblingIndex = Math.min(clampedPage + config.siblings, totalPages - config.boundaries);
      
      const showLeftEllipsis = leftSiblingIndex > config.boundaries + 1;
      const showRightEllipsis = rightSiblingIndex < totalPages - config.boundaries;

      if (!showLeftEllipsis && showRightEllipsis) {
        const leftItemCount = config.siblings * 2 + config.boundaries + 2;
        const leftRange = range(1, leftItemCount);
        pages = [...leftRange, '...', ...endPages];
      } else if (showLeftEllipsis && !showRightEllipsis) {
        const rightItemCount = config.siblings * 2 + config.boundaries + 2;
        const rightRange = range(totalPages - rightItemCount + 1, totalPages);
        pages = [...startPages, '...', ...rightRange];
      } else {
        const middleRange = range(leftSiblingIndex, rightSiblingIndex);
        pages = [...startPages, '...', ...middleRange, '...', ...endPages];
      }
    }

    const startIndex = (clampedPage - 1) * config.pageSize;
    const endIndex = Math.min(startIndex + config.pageSize - 1, config.totalCount - 1);

    state.set({
      pages,
      currentPage: clampedPage,
      totalPages,
      totalCount: config.totalCount,
      pageSize: config.pageSize,
      isFirstPage: clampedPage === 1,
      isLastPage: clampedPage === totalPages,
      startIndex,
      endIndex,
    });
  };

  const setPage = (page) => syncState(page);
  const nextPage = () => syncState(state.get().currentPage + 1);
  const prevPage = () => syncState(state.get().currentPage - 1);
  const firstPage = () => syncState(1);
  const lastPage = () => syncState(state.get().totalPages);
  
  const update = (newConfig) => {
    Object.assign(config, newConfig);
    syncState(state.get().currentPage || config.initialPage);
  };

  // Initialize
  syncState(config.initialPage);

  return {
    setPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    update,
    subscribe: state.subscribe,
    get state() { return state.get(); },
  };
};

export default usePagination;