/**
 * @file pagination.js
 * @description Optimized Pagination with class-based architecture.
 */

export class Pagination {
  constructor(paginationElement, options = {}) {
    if (!paginationElement || paginationElement.pagination) return;

    this.element = paginationElement;
    this.id = paginationElement.id || `pagination-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };

    // Core state
    this.totalPages = parseInt(this.element.dataset.totalPages, 10) || this.options.totalPages;
    this.currentPage = parseInt(this.element.dataset.currentPage, 10) || this.options.currentPage;

    // Bound event handlers for proper cleanup
    this._boundHandlers = {
      click: (e) => this._handleClick(e)
    };

    this.init();
    this.element.pagination = this;
  }

  defaults = {
    totalPages: 10,
    currentPage: 1,
    siblingCount: 1,
    onPageChange: () => {}
  }

  init() {
    this.setupEvents();
    this.render();
    
    this.element.classList.add('pagination-initialized');
    this.emit('init');
  }

  setupEvents() {
    this.element.addEventListener('click', this._boundHandlers.click);
  }

  _range(start, end) {
    let length = end - start + 1;
    return Array.from({ length }, (_, idx) => idx + start);
  }

  _getPageNumbers() {
    const siblingCount = this.options.siblingCount;
    const totalVisibleSlots = siblingCount + 5;

    if (this.totalPages <= totalVisibleSlots) {
      return this._range(1, this.totalPages);
    }

    const leftSiblingIndex = Math.max(this.currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(this.currentPage + siblingCount, this.totalPages);

    const shouldShowLeftEllipsis = leftSiblingIndex > 2;
    const shouldShowRightEllipsis = rightSiblingIndex < this.totalPages - 2;

    if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
      let leftItemCount = 3 + 2 * siblingCount;
      let leftRange = this._range(1, leftItemCount);
      return [...leftRange, '...', this.totalPages];
    }

    if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
      let rightItemCount = 3 + 2 * siblingCount;
      let rightRange = this._range(this.totalPages - rightItemCount + 1, this.totalPages);
      return [1, '...', ...rightRange];
    }

    if (shouldShowLeftEllipsis && shouldShowRightEllipsis) {
      let middleRange = this._range(leftSiblingIndex, rightSiblingIndex);
      return [1, '...', ...middleRange, '...', this.totalPages];
    }
  }

  _createLinkItem(page, label, enabled, active) {
    const item = document.createElement('li');
    item.className = 'pagination-item';
    
    const link = document.createElement('a');
    link.href = '#';
    link.className = 'pagination-link';
    link.dataset.page = page;
    link.setAttribute('aria-label', label);

    if (!enabled) link.classList.add('is-disabled');
    if (active) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }

    if (page === 'previous') {
      link.classList.add('is-edge');
      link.innerHTML = `<i data-lucide="chevron-left" style="width:1rem;height:1rem;"></i><span>Previous</span>`;
    } else if (page === 'next') {
      link.classList.add('is-edge');
      link.innerHTML = `<span>Next</span><i data-lucide="chevron-right" style="width:1rem;height:1rem;"></i>`;
    } else {
      link.classList.add('is-page-number');
      link.textContent = page;
    }
    
    item.appendChild(link);
    return item;
  }

  _createEllipsisItem() {
    const item = document.createElement('li');
    item.className = 'pagination-item';
    const span = document.createElement('span');
    span.className = 'pagination-ellipsis';
    span.innerHTML = '&hellip;';
    item.appendChild(span);
    return item;
  }

  _handleClick(e) {
    e.preventDefault();
    const target = e.target.closest('.pagination-link');

    if (!target || target.classList.contains('is-disabled') || target.classList.contains('is-active')) {
      return;
    }

    const newPage = target.dataset.page;
    if (newPage === 'previous') {
      this.currentPage--;
    } else if (newPage === 'next') {
      this.currentPage++;
    } else {
      this.currentPage = parseInt(newPage, 10);
    }

    this.element.dataset.currentPage = this.currentPage;
    this.render();

    this.options.onPageChange(this.currentPage);
    this.emit('page-change', { currentPage: this.currentPage });
  }

  // Public API methods
  render() {
    this.element.innerHTML = '';
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'pagination');
    const paginationList = document.createElement('ul');
    paginationList.className = 'pagination';

    paginationList.appendChild(this._createLinkItem('previous', 'Go to previous page', this.currentPage > 1));
    this._getPageNumbers().forEach(page => {
      const item = (page === '...')
        ? this._createEllipsisItem()
        : this._createLinkItem(page, `Go to page ${page}`, true, page === this.currentPage);
      paginationList.appendChild(item);
    });
    paginationList.appendChild(this._createLinkItem('next', 'Go to next page', this.currentPage < this.totalPages));

    nav.appendChild(paginationList);
    this.element.appendChild(nav);
    
    if (window.lucide) {
      window.lucide.createIcons({ nodes: [nav] });
    }
  }

  goToPage(page) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.element.dataset.currentPage = this.currentPage;
      this.render();
      this.options.onPageChange(this.currentPage);
      this.emit('page-change', { currentPage: this.currentPage });
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  setTotalPages(totalPages) {
    this.totalPages = totalPages;
    this.element.dataset.totalPages = totalPages;
    
    // Adjust current page if it's now out of bounds
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
      this.element.dataset.currentPage = this.currentPage;
    }
    
    this.render();
    this.emit('total-pages-change', { totalPages });
  }

  getCurrentPage() {
    return this.currentPage;
  }

  getTotalPages() {
    return this.totalPages;
  }

  // Custom event system
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`pagination:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }

  // Cleanup method
  destroy() {
    // Remove event listeners
    this.element.removeEventListener('click', this._boundHandlers.click);

    // Clean up DOM
    this.element.classList.remove('pagination-initialized');
    delete this.element.pagination;

    this.emit('destroy');
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.js-pagination:not(.pagination-initialized)').forEach(el => {
    new Pagination(el);
  });
});

export default Pagination;
