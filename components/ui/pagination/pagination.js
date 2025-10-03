/**
 * @file pagination.js
 * @description Encapsulated setup for a fixed-width, smart, dynamic pagination component.
 */
function pagination() {
  document.querySelectorAll('.pagination').forEach(renderPagination);

  document.body.addEventListener('click', (event) => {
    const item = event.target.closest('.pagination-item');
    const paginationContainer = event.target.closest('.pagination');

    if (!item || !paginationContainer || item.disabled || item.getAttribute('aria-current') === 'page') {
      return;
    }
    
    const currentPage = parseInt(paginationContainer.dataset.currentPage, 10);
    let newPage;

    if (item.classList.contains('pagination-prev')) {
      newPage = currentPage - 1;
    } else if (item.classList.contains('pagination-next')) {
      newPage = currentPage + 1;
    } else {
      newPage = parseInt(item.textContent, 10);
    }
    
    paginationContainer.dataset.currentPage = newPage;
    renderPagination(paginationContainer);
  });
}

function renderPagination(container) {
  const currentPage = parseInt(container.dataset.currentPage, 10);
  const totalPages = parseInt(container.dataset.totalPages, 10);
  const prevButton = container.querySelector('.pagination-prev');
  const nextButton = container.querySelector('.pagination-next');
  
  container.querySelectorAll('.pagination-item:not(.pagination-prev):not(.pagination-next), .pagination-ellipsis').forEach(el => el.remove());
  
  const pageNumbers = getPageNumbers(currentPage, totalPages);
  
  pageNumbers.forEach(page => {
    if (page === '...') {
      const ellipsis = document.createElement('span');
      ellipsis.className = 'pagination-ellipsis';
      ellipsis.textContent = '...';
      container.insertBefore(ellipsis, nextButton);
    } else {
      const button = document.createElement('button');
      button.className = 'pagination-item';
      button.textContent = page;
      if (page === currentPage) {
        button.setAttribute('aria-current', 'page');
      }
      container.insertBefore(button, nextButton);
    }
  });

  if (prevButton) prevButton.disabled = currentPage <= 1;
  if (nextButton) nextButton.disabled = currentPage >= totalPages;
}

/**
 * The core logic that calculates which page numbers and ellipses to show with a fixed width.
 * @param {number} currentPage - The current active page.
 * @param {number} totalPages - The total number of pages.
 * @returns {Array<number|string>} - An array of items to render.
 */
function getPageNumbers(currentPage, totalPages) {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
        return [1, 2, 3, 4, 5, '...', totalPages];
    }
    
    if (currentPage >= totalPages - 3) {
        return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

document.addEventListener('DOMContentLoaded', pagination);
