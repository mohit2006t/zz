class Accordion {
  constructor(accordionElement, options = {}) {
    if (!accordionElement || accordionElement.accordion) return;
    this.element = accordionElement;
    this.id = accordionElement.id || `accordion-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };
    this.type = this._getTypeFromClasses();
    this.items = Array.from(this.element.querySelectorAll('.accordion-item'));
    this._boundHandleToggle = this._handleToggle.bind(this);
    this._boundHandleKeydown = this._handleKeydown.bind(this);
    this.init();
    this.element.accordion = this;
  }
  defaults = {
    type: 'multiple',
    collapsible: true,
    closeOthers: true,
    keyboard: true,
    animate: true
  }
  init() {
    this.setupAccessibility();
    this.setupEventListeners();
    this.handleInitialState();
    this.element.classList.add('accordion-initialized');
    this.emit('init', { 
      type: this.type, 
      totalItems: this.items.length,
      options: this.options 
    });
  }
  _getTypeFromClasses() {
    if (this.element.classList.contains('accordion-single')) return 'single';
    if (this.element.classList.contains('accordion-multiple')) return 'multiple';
    return this.options.type;
  }
  setupAccessibility() {
    this.element.setAttribute('role', 'presentation');
    this.items.forEach((item, index) => {
      const trigger = item.querySelector('.accordion-trigger');
      const content = item.querySelector('.accordion-content');
      if (trigger && content) {
        const triggerId = trigger.id || `${this.id}-trigger-${index}`;
        const contentId = content.id || `${this.id}-content-${index}`;
        trigger.id = triggerId;
        content.id = contentId;
        trigger.setAttribute('aria-controls', contentId);
        trigger.setAttribute('aria-expanded', item.open ? 'true' : 'false');
        content.setAttribute('aria-labelledby', triggerId);
        content.setAttribute('role', 'region');
      }
    });
  }
  setupEventListeners() {
    if (this.type === 'single') {
      this.items.forEach(item => {
        item.addEventListener('toggle', this._boundHandleToggle);
      });
    }
    this.items.forEach(item => {
      item.addEventListener('toggle', (e) => this._updateAriaExpanded(e.target));
    });
    if (this.options.keyboard) {
      this.items.forEach(item => {
        const trigger = item.querySelector('.accordion-trigger');
        if (trigger) {
          trigger.addEventListener('keydown', this._boundHandleKeydown);
        }
      });
    }
  }
  handleInitialState() {
    this.items.forEach(item => {
      const shouldBeOpen = item.classList.contains('accordion-item-open');
      const shouldBeClosed = item.classList.contains('accordion-item-closed');
      if (shouldBeOpen && !item.open) {
        item.open = true;
      } else if (shouldBeClosed && item.open) {
        item.open = false;
      }
      this._updateAriaExpanded(item);
    });
  }
  _handleToggle(event) {
    const currentItem = event.target;
    if (currentItem.open && this.options.closeOthers) {
      this.items.forEach(otherItem => {
        if (otherItem !== currentItem && otherItem.open) {
          otherItem.open = false;
          this._updateAriaExpanded(otherItem);
        }
      });
    }
    this.emit('toggle', { 
      item: currentItem, 
      open: currentItem.open,
      index: this.items.indexOf(currentItem)
    });
  }
  _handleKeydown(event) {
    const trigger = event.target;
    const item = trigger.closest('.accordion-item');
    const currentIndex = this.items.indexOf(item);
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        this._focusNextTrigger(currentIndex);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        this._focusPreviousTrigger(currentIndex);
        break;
      case 'Home':
        event.preventDefault();
        this._focusTrigger(0);
        break;
      case 'End':
        event.preventDefault();
        this._focusTrigger(this.items.length - 1);
        break;
    }
  }
  _updateAriaExpanded(item) {
    const trigger = item.querySelector('.accordion-trigger');
    if (trigger) {
      trigger.setAttribute('aria-expanded', item.open ? 'true' : 'false');
    }
  }
  _focusNextTrigger(currentIndex) {
    const nextIndex = (currentIndex + 1) % this.items.length;
    this._focusTrigger(nextIndex);
  }
  _focusPreviousTrigger(currentIndex) {
    const prevIndex = currentIndex === 0 ? this.items.length - 1 : currentIndex - 1;
    this._focusTrigger(prevIndex);
  }
  _focusTrigger(index) {
    const trigger = this.items[index]?.querySelector('.accordion-trigger');
    if (trigger && !this.items[index].hasAttribute('disabled')) {
      trigger.focus();
    }
  }
  open(index) {
    const item = this.items[index];
    if (item && !item.hasAttribute('disabled')) {
      item.open = true;
      this._updateAriaExpanded(item);
      this.emit('open', { item, index });
    }
  }
  close(index) {
    const item = this.items[index];
    if (item && !item.hasAttribute('disabled')) {
      item.open = false;
      this._updateAriaExpanded(item);
      this.emit('close', { item, index });
    }
  }
  toggle(index) {
    const item = this.items[index];
    if (item && !item.hasAttribute('disabled')) {
      item.open ? this.close(index) : this.open(index);
    }
  }
  openAll() {
    if (this.type === 'multiple') {
      this.items.forEach((item, index) => {
        if (!item.hasAttribute('disabled')) {
          this.open(index);
        }
      });
      this.emit('openAll');
    }
  }
  closeAll() {
    this.items.forEach((item, index) => {
      if (!item.hasAttribute('disabled')) {
        this.close(index);
      }
    });
    this.emit('closeAll');
  }
  getOpenItems() {
    return this.items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.open);
  }
  isOpen(index) {
    return this.items[index]?.open || false;
  }
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`accordion:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }
  destroy() {
    this.items.forEach(item => {
      item.removeEventListener('toggle', this._boundHandleToggle);
      const trigger = item.querySelector('.accordion-trigger');
      if (trigger) {
        trigger.removeEventListener('keydown', this._boundHandleKeydown);
      }
    });
    this.element.classList.remove('accordion-initialized');
    delete this.element.accordion;
    this.emit('destroy');
  }
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.accordion:not(.accordion-initialized)').forEach(el => {
    el.accordion = new Accordion(el);
  });
});
class Calendar {
    constructor(calendarElement, options = {}) {
      if (!calendarElement || calendarElement.calendar) return;
      this.element = calendarElement;
      this.options = { ...this.defaults, ...options };
      this.today = new Date();
      this.currentDate = new Date();
      this.selectedDate = null;
      this.MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      this.DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
      this.init();
      this.element.calendar = this;
    }
    defaults = {
      minYear: null,
      maxYear: null,
      onDateSelect: () => {}
    }
    init() {
      this.options.minYear = this.options.minYear || 
        parseInt(this.element.dataset.minYear, 10) || 
        (this.today.getFullYear() - 100);
      this.options.maxYear = this.options.maxYear || 
        parseInt(this.element.dataset.maxYear, 10) || 
        (this.today.getFullYear() + 10);
      this.element.addEventListener('click', (e) => this._handleClick(e));
      this.element.addEventListener('change', (e) => this._handleChange(e));
      this.element.classList.add('calendar-initialized');
      this.render();
    }
    render() {
      this.element.innerHTML = '';
      const calendarEl = document.createElement('div');
      calendarEl.className = 'calendar';
      calendarEl.appendChild(this._createHeader());
      calendarEl.appendChild(this._createGrid());
      this.element.appendChild(calendarEl);
      if (window.lucide) {
        window.lucide.createIcons({ nodes: [calendarEl] });
      }
    }
    _createHeader() {
      const header = document.createElement('div');
      header.className = 'calendar-header';
      const nav = document.createElement('div');
      nav.className = 'calendar-nav';
      nav.appendChild(this._createMonthSelect());
      nav.appendChild(this._createYearSelect());
      const prevButton = this._createNavButton('previous', 'chevron-left');
      const nextButton = this._createNavButton('next', 'chevron-right');
      header.appendChild(prevButton);
      header.appendChild(nav);
      header.appendChild(nextButton);
      return header;
    }
    _createGrid() {
      const table = document.createElement('table');
      table.className = 'calendar-grid';
      const thead = table.createTHead();
      const headRow = thead.insertRow();
      this.DAY_NAMES.forEach(day => {
        const th = document.createElement('th');
        th.textContent = day;
        headRow.appendChild(th);
      });
      const tbody = table.createTBody();
      const month = this.currentDate.getMonth();
      const year = this.currentDate.getFullYear();
      const firstDayOfMonth = new Date(year, month, 1);
      const startingDayOfWeek = firstDayOfMonth.getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      let date = 1;
      for (let i = 0; i < 6; i++) {
        const row = tbody.insertRow();
        for (let j = 0; j < 7; j++) {
          const cell = row.insertCell();
          cell.className = 'calendar-day-cell';
          if (i === 0 && j < startingDayOfWeek) {
            const prevMonthDate = new Date(year, month, 1 - (startingDayOfWeek - j));
            cell.appendChild(this._createDayButton(prevMonthDate, true));
          } else if (date > daysInMonth) {
            const nextMonthDate = new Date(year, month, date++);
            cell.appendChild(this._createDayButton(nextMonthDate, true));
          } else {
            const currentMonthDate = new Date(year, month, date++);
            cell.appendChild(this._createDayButton(currentMonthDate, false));
          }
        }
        if (date > daysInMonth) break;
      }
      return table;
    }
    _createNavButton(action, icon) {
      const btn = document.createElement('button');
      btn.className = 'calendar-nav-btn';
      btn.dataset.action = action;
      btn.innerHTML = `<i data-lucide="${icon}"></i>`;
      return btn;
    }
    _createDayButton(date, isOutside) {
      const btn = document.createElement('button');
      btn.className = 'calendar-day';
      btn.textContent = date.getDate();
      btn.dataset.date = date.toISOString();
      if (isOutside) btn.classList.add('is-outside');
      if (date.toDateString() === this.today.toDateString()) btn.classList.add('is-today');
      if (this.selectedDate && date.toDateString() === this.selectedDate.toDateString()) {
        btn.classList.add('is-selected');
      }
      return btn;
    }
    _createMonthSelect() {
      const select = document.createElement('select');
      select.className = 'calendar-select';
      select.dataset.action = 'set-month';
      this.MONTH_NAMES.forEach((name, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = name;
        if (index === this.currentDate.getMonth()) {
          option.selected = true;
        }
        select.appendChild(option);
      });
      return select;
    }
    _createYearSelect() {
      const select = document.createElement('select');
      select.className = 'calendar-select';
      select.dataset.action = 'set-year';
      for (let i = this.options.minYear; i <= this.options.maxYear; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        if (i === this.currentDate.getFullYear()) {
          option.selected = true;
        }
        select.appendChild(option);
      }
      return select;
    }
    _handleClick(e) {
      const navBtn = e.target.closest('.calendar-nav-btn');
      if (navBtn) {
        const newMonth = navBtn.dataset.action === 'previous' ? 
          this.currentDate.getMonth() - 1 : 
          this.currentDate.getMonth() + 1;
        this.currentDate.setMonth(newMonth);
        this.render();
        return;
      }
      const dayBtn = e.target.closest('.calendar-day');
      if (dayBtn) {
        this.selectedDate = new Date(dayBtn.dataset.date);
        if (this.selectedDate.getMonth() !== this.currentDate.getMonth()) {
          this.currentDate = new Date(this.selectedDate);
        }
        this.render();
        this.options.onDateSelect(this.selectedDate);
        this.element.dispatchEvent(new CustomEvent('date-selected', {
          detail: { date: this.selectedDate },
          bubbles: true
        }));
      }
    }
    _handleChange(e) {
      const selectEl = e.target.closest('.calendar-select');
      if (selectEl) {
        const action = selectEl.dataset.action;
        const value = parseInt(selectEl.value, 10);
        if (action === 'set-month') {
          this.currentDate.setMonth(value);
        } else if (action === 'set-year') {
          this.currentDate.setFullYear(value);
        }
        this.render();
      }
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.calendar-container:not(.calendar-initialized)').forEach(el => {
      new Calendar(el);
    });
  });
class Carousel {
  constructor(carouselElement, options = {}) {
    if (!carouselElement || carouselElement.carousel) return;
    this.element = carouselElement;
    this.id = carouselElement.id || `carousel-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };
    this.viewport = this.element.querySelector('.carousel-viewport');
    this.content = this.element.querySelector('.carousel-content');
    this.items = Array.from(this.content.children);
    this.prevButton = this.element.querySelector('.carousel-previous');
    this.nextButton = this.element.querySelector('.carousel-next');
    this.dotsContainer = this.element.querySelector('.carousel-dots');
    this.dots = [];
    this.currentIndex = 0;
    this.autoplayTimer = null;
    this.isUserInteracting = false;
    this._boundHandlePrev = () => this.goTo(this.currentIndex - 1, true);
    this._boundHandleNext = () => this.goTo(this.currentIndex + 1, true);
    this._boundDotHandlers = [];
    this.init();
    this.element.carousel = this;
  }
  defaults = {
    loop: false,
    autoplay: false,
    autoplayDelay: 3000,
    swipeEnabled: true,
    pauseOnHover: true
  }
  init() {
    if (this.items.length <= 1) {
      this.hideControls();
      return;
    }
    this.setupAccessibility();
    this.setupNavigation();
    this.setupDots();
    this.setupAutoplay();
    this.update();
    this.element.classList.add('carousel-initialized');
    this.emit('init', { totalItems: this.items.length });
  }
  hideControls() {
    if (this.prevButton) this.prevButton.style.display = 'none';
    if (this.nextButton) this.nextButton.style.display = 'none';
    if (this.dotsContainer) this.dotsContainer.style.display = 'none';
  }
  setupAccessibility() {
    this.element.setAttribute('role', 'region');
    this.element.setAttribute('aria-roledescription', 'carousel');
    this.element.setAttribute('aria-label', `Carousel with ${this.items.length} slides`);
    this.items.forEach((item, i) => {
      item.setAttribute('role', 'group');
      item.setAttribute('aria-roledescription', 'slide');
      item.setAttribute('aria-label', `${i + 1} of ${this.items.length}`);
    });
  }
  setupNavigation() {
    if (this.prevButton) {
      this.prevButton.addEventListener('click', this._boundHandlePrev);
      this.prevButton.setAttribute('aria-label', 'Previous slide');
    }
    if (this.nextButton) {
      this.nextButton.addEventListener('click', this._boundHandleNext);
      this.nextButton.setAttribute('aria-label', 'Next slide');
    }
  }
  setupDots() {
    if (!this.dotsContainer) return;
    this.dotsContainer.innerHTML = ''; 
    this.dots = [];
    this._boundDotHandlers = [];
    this.items.forEach((_, i) => {
      const dot = document.createElement('button');
      const handler = () => this.goTo(i, true);
      dot.classList.add('carousel-dot');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', handler);
      this.dotsContainer.appendChild(dot);
      this.dots.push(dot);
      this._boundDotHandlers.push(handler);
    });
    this.dotsContainer.setAttribute('role', 'tablist');
    this.dotsContainer.setAttribute('aria-label', 'Carousel navigation');
  }
  setupAutoplay() {
    if (!this.options.autoplay) return;
    this.startAutoplay();
    if (this.options.pauseOnHover) {
      this.element.addEventListener('mouseenter', () => this.pauseAutoplay());
      this.element.addEventListener('mouseleave', () => this.resumeAutoplay());
    }
    this.element.addEventListener('focusin', () => this.pauseAutoplay());
    this.element.addEventListener('focusout', () => this.resumeAutoplay());
  }
  startAutoplay() {
    if (!this.options.autoplay || this.autoplayTimer) return;
    this.autoplayTimer = setInterval(() => {
      if (!this.isUserInteracting) {
        const nextIndex = this.options.loop 
          ? this.wrapIndex(this.currentIndex + 1)
          : Math.min(this.currentIndex + 1, this.items.length - 1);
        if (!this.options.loop && nextIndex === this.currentIndex) {
          this.stopAutoplay();
          return;
        }
        this.goTo(nextIndex, false);
      }
    }, this.options.autoplayDelay);
    this.emit('autoplay:start', {});
  }
  stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
      this.emit('autoplay:stop', {});
    }
  }
  pauseAutoplay() {
    this.isUserInteracting = true;
  }
  resumeAutoplay() {
    setTimeout(() => {
      this.isUserInteracting = false;
    }, 100);
  }
  toggleAutoplay(enable = null) {
    const shouldEnable = enable !== null ? enable : !this.options.autoplay;
    this.options.autoplay = shouldEnable;
    if (shouldEnable) {
      this.startAutoplay();
    } else {
      this.stopAutoplay();
    }
    this.emit('autoplay:toggle', { enabled: shouldEnable });
  }
  goTo(index, isUserAction = false) {
    const newIndex = this.options.loop 
      ? this.wrapIndex(index)
      : Math.max(0, Math.min(index, this.items.length - 1));
    if (newIndex !== this.currentIndex) {
      const previousIndex = this.currentIndex;
      this.currentIndex = newIndex;
      this.update();
      if (isUserAction && this.options.autoplay) {
        this.stopAutoplay();
        this.startAutoplay();
      }
      this.emit('slide', { 
        currentIndex: this.currentIndex, 
        previousIndex,
        currentSlide: this.items[this.currentIndex],
        isUserAction
      });
    }
  }
  wrapIndex(index) {
    if (index < 0) return this.items.length - 1;
    if (index >= this.items.length) return 0;
    return index;
  }
  next() {
    this.goTo(this.currentIndex + 1, true);
  }
  previous() {
    this.goTo(this.currentIndex - 1, true);
  }
  update() {
    const offset = -this.currentIndex * 100;
    this.content.style.transform = `translateX(${offset}%)`;
    this.items.forEach((item, i) => {
      item.setAttribute('aria-hidden', (i !== this.currentIndex).toString());
    });
    if (this.prevButton) {
      const isDisabled = !this.options.loop && this.currentIndex === 0;
      this.prevButton.setAttribute('data-disabled', isDisabled.toString());
      this.prevButton.disabled = isDisabled;
    }
    if (this.nextButton) {
      const isDisabled = !this.options.loop && this.currentIndex >= this.items.length - 1;
      this.nextButton.setAttribute('data-disabled', isDisabled.toString());
      this.nextButton.disabled = isDisabled;
    }
    if (this.dots.length > 0) {
      this.dots.forEach((dot, i) => {
        const isActive = i === this.currentIndex;
        dot.setAttribute('data-active', isActive.toString());
        dot.setAttribute('aria-selected', isActive.toString());
      });
    }
  }
  emit(event, data) {
    this.element.dispatchEvent(new CustomEvent(`carousel:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }
  destroy() {
    this.stopAutoplay();
    if (this.prevButton) {
      this.prevButton.removeEventListener('click', this._boundHandlePrev);
    }
    if (this.nextButton) {
      this.nextButton.removeEventListener('click', this._boundHandleNext);
    }
    this.dots.forEach((dot, i) => {
      if (this._boundDotHandlers[i]) {
        dot.removeEventListener('click', this._boundDotHandlers[i]);
      }
    });
    this.element.classList.remove('carousel-initialized');
    delete this.element.carousel;
    this.emit('destroy', {});
  }
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.carousel:not(.carousel-initialized)').forEach(el => {
    el.carousel = new Carousel(el);
  });
});
class Combobox {
  constructor(comboboxElement, options = {}) {
    if (!comboboxElement || comboboxElement.combobox) return;
    this.element = comboboxElement;
    this.options = { ...this.defaults, ...options };
    this.trigger = this.element.querySelector('.combobox-trigger');
    this.triggerText = this.element.querySelector('.combobox-trigger-text');
    this.popoverContent = this.element.querySelector('.popover-content');
    if (!this.trigger || !this.triggerText || !this.popoverContent) {
      console.error('Combobox missing required elements');
      return;
    }
    this.isOpen = false;
    this.selectedValue = null;
    this.filteredItems = [];
    this.selectedIndex = -1;
    this.init();
    this.element.combobox = this;
  }
  defaults = {
    placeholder: 'Select an option...',
    searchPlaceholder: 'Search...',
    emptyMessage: 'No results found.',
    items: [],
    groups: [],
    groupHeading: 'Options',
    onSelect: () => {},
    initialValue: null
  }
  init() {
    console.log('🚀 Initializing combobox with data:', {
      items: this.options.items.length,
      groups: this.options.groups.length
    });
    this.prepareData();
    this.setupUI();
    this.setupEvents();
    this.setInitialValue();
    this.element.classList.add('combobox-initialized');
  }
  prepareData() {
    if (this.options.groups && this.options.groups.length > 0) {
      this.groups = this.options.groups;
    } else if (this.options.items && this.options.items.length > 0) {
      this.groups = [{
        heading: this.options.groupHeading,
        items: this.options.items
      }];
    } else {
      this.groups = [];
    }
    this.allItems = this.groups.flatMap(group => 
      group.type === 'separator' ? [] : (group.items || [])
    );
    console.log('📊 Data prepared:', {
      groups: this.groups.length,
      totalItems: this.allItems.length
    });
  }
  setupUI() {
    this.triggerText.textContent = this.options.placeholder;
    this.triggerText.classList.add('combobox-trigger-placeholder');
    this.popoverContent.innerHTML = `
      <div class="combobox-search">
        <i data-lucide="search" class="combobox-search-icon"></i>
        <input type="text" class="combobox-search-input" placeholder="${this.options.searchPlaceholder}" autocomplete="off" role="searchbox">
      </div>
      <div class="combobox-list" role="listbox"></div>
    `;
    this.searchInput = this.popoverContent.querySelector('.combobox-search-input');
    this.itemsList = this.popoverContent.querySelector('.combobox-list');
    if (window.lucide) {
      window.lucide.createIcons({ nodes: [this.popoverContent] });
    }
    this.renderItems('');
  }
  setupEvents() {
    this.trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggle();
    });
    this.searchInput.addEventListener('input', (e) => {
      this.renderItems(e.target.value);
      this.updateSelectionHighlight(0); 
    });
    this.searchInput.addEventListener('keydown', (e) => {
      this.handleKeydown(e);
    });
    this.itemsList.addEventListener('mouseleave', () => {
      this.updateSelectionHighlight(-1);
    });
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.element.contains(e.target)) {
        this.close();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
        this.trigger.focus();
      }
    });
  }
  handleKeydown(e) {
    if (!this.isOpen) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const newIndexDown = Math.min(this.selectedIndex + 1, this.filteredItems.length - 1);
        this.updateSelectionHighlight(newIndexDown);
        break;
      case 'ArrowUp':
        e.preventDefault();
        const newIndexUp = Math.max(this.selectedIndex - 1, 0);
        this.updateSelectionHighlight(newIndexUp);
        break;
      case 'Enter':
        e.preventDefault();
        if (this.selectedIndex !== -1 && this.filteredItems[this.selectedIndex]) {
          this.selectItemByElement(this.filteredItems[this.selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        this.close();
        this.trigger.focus();
        break;
    }
  }
  renderItems(query = '') {
    const normalizedQuery = query.toLowerCase().trim();
    let html = '';
    let hasItems = false;
    this.filteredItems = []; 
    console.log('🔍 Rendering items with query:', query);
    this.groups.forEach((group, groupIndex) => {
      if (group.type === 'separator') {
        if (hasItems) {
          html += '<div class="combobox-separator"></div>';
        }
        return;
      }
      const filteredGroupItems = (group.items || []).filter(item =>
        item.label.toLowerCase().includes(normalizedQuery)
      );
      if (filteredGroupItems.length > 0) {
        if (group.heading && (this.groups.length > 1 || this.groups.some(g => g.type === 'separator'))) {
          html += `<div class="combobox-group-heading">${group.heading}</div>`;
        }
        filteredGroupItems.forEach(item => {
          const itemIndex = this.filteredItems.length;
          this.filteredItems.push(item); 
          html += `
            <div class="combobox-item" 
                 data-value="${item.id}" 
                 data-index="${itemIndex}"
                 role="option" 
                 aria-selected="false">
              ${item.icon ? `<i data-lucide="${item.icon}" class="combobox-item-icon"></i>` : ''}
              <span class="combobox-item-label">${item.label}</span>
              ${item.shortcut ? `<span class="combobox-item-shortcut">${item.shortcut}</span>` : ''}
            </div>
          `;
        });
        hasItems = true;
      }
    });
    if (!hasItems) {
      html = `<div class="combobox-empty">${this.options.emptyMessage}</div>`;
    }
    this.itemsList.innerHTML = html;
    this.itemsList.querySelectorAll('.combobox-item').forEach((itemEl, index) => {
      itemEl.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.selectItemByElement(itemEl);
      });
      itemEl.addEventListener('mouseenter', () => {
        const itemIndex = parseInt(itemEl.dataset.index);
        this.updateSelectionHighlight(itemIndex);
      });
    });
    if (window.lucide) {
      window.lucide.createIcons({ nodes: [this.itemsList] });
    }
    this.selectedIndex = -1;
    console.log('✅ Rendered', hasItems ? `${this.filteredItems.length} items` : 'empty state');
  }
  updateSelectionHighlight(index) {
    this.selectedIndex = index;
    this.itemsList.querySelectorAll('.combobox-item').forEach(itemEl => {
      itemEl.setAttribute('aria-selected', 'false');
      itemEl.classList.remove('combobox-item-selected');
    });
    if (index >= 0 && index < this.filteredItems.length) {
      const selectedElement = this.itemsList.querySelector(`[data-index="${index}"]`);
      if (selectedElement) {
        selectedElement.setAttribute('aria-selected', 'true');
        selectedElement.classList.add('combobox-item-selected');
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }
  selectItemByElement(itemEl) {
    const itemId = itemEl.dataset.value;
    const item = this.filteredItems.find(item => item.id === itemId);
    if (item) {
      this.selectItem(item);
    }
  }
  selectItem(item) {
    console.log('🎯 Selecting item:', item);
    this.selectedValue = item;
    this.triggerText.textContent = item.label;
    this.triggerText.classList.remove('combobox-trigger-placeholder');
    this.close();
    setTimeout(() => this.trigger.focus(), 100);
    this.options.onSelect(item);
    this.emit('select', { item });
  }
  setInitialValue() {
    if (this.options.initialValue) {
      const item = this.allItems.find(item => item.id === this.options.initialValue);
      if (item) {
        this.selectedValue = item;
        this.triggerText.textContent = item.label;
        this.triggerText.classList.remove('combobox-trigger-placeholder');
        console.log('🎯 Initial value set:', item);
      }
    }
  }
  open() {
    if (this.isOpen) return;
    console.log('📂 Opening combobox');
    document.querySelectorAll('.combobox-initialized').forEach(el => {
      if (el !== this.element && el.combobox && el.combobox.isOpen) {
        el.combobox.close();
      }
    });
    this.isOpen = true;
    this.popoverContent.style.display = 'block';
    this.popoverContent.classList.add('combobox-open');
    setTimeout(() => {
      this.searchInput.focus();
      if (this.filteredItems.length > 0) {
        this.updateSelectionHighlight(0);
      }
    }, 50);
    this.emit('open');
  }
  close() {
    if (!this.isOpen) return;
    console.log('📁 Closing combobox');
    this.isOpen = false;
    this.popoverContent.classList.remove('combobox-open');
    setTimeout(() => {
      this.popoverContent.style.display = 'none';
      this.searchInput.value = '';
      this.renderItems('');
    }, 150);
    this.emit('close');
  }
  toggle() {
    this.isOpen ? this.close() : this.open();
  }
  getValue() {
    return this.selectedValue;
  }
  clear() {
    this.selectedValue = null;
    this.triggerText.textContent = this.options.placeholder;
    this.triggerText.classList.add('combobox-trigger-placeholder');
    this.emit('clear');
  }
  selectItemById(itemId) {
    const item = this.allItems.find(item => item.id === itemId);
    if (item) {
      this.selectItem(item);
    }
  }
  updateItems(newItems) {
    this.options.items = newItems;
    this.prepareData();
    this.renderItems('');
    this.emit('update', { items: newItems });
  }
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`combobox:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }
  destroy() {
    this.element.classList.remove('combobox-initialized');
    delete this.element.combobox;
    this.emit('destroy');
  }
}
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.querySelectorAll('.combobox:not(.combobox-initialized)').forEach(el => {
      new Combobox(el);
    });
  }, 100);
});
window.Combobox = Combobox;
class Command {
  constructor(commandElement, options = {}) {
    if (!commandElement || commandElement.command) return;
    this.element = commandElement;
    this.id = commandElement.id || `command-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };
    this.groupsData = this.options.groups || [];
    this.items = [];
    this.filteredItems = [];
    this.selectedIndex = -1;
    this._boundHandlers = {
      input: (e) => this._handleInput(e),
      keydown: (e) => this._handleKeydown(e),
      mouseleave: () => this._handleMouseLeave(),
      itemClick: (item, itemData) => this._handleItemClick(item, itemData)
    };
    this.init();
    this.element.command = this;
  }
  defaults = {
    groups: [],
    onSelect: (item) => console.log('Selected:', item),
    placeholder: 'Type a command or search...',
    emptyMessage: 'No results found.',
    searchable: true,
    keyboard: true
  }
  init() {
    this.setupInitialState();
    this._render();
    this._initEventListeners();
    this.element.classList.add('command-initialized');
    this.emit('init', { 
      totalItems: this.items.length,
      totalGroups: this.groupsData.length 
    });
  }
  setupInitialState() {
    this.element.classList.add('command');
  }
  _render() {
    this.element.innerHTML = `
      <div class="command-input-wrapper">
        <i data-lucide="search" class="command-search-icon"></i>
        <input class="command-input" 
               placeholder="${this.options.placeholder}" 
               autocomplete="off" 
               autocorrect="off" 
               spellcheck="false">
      </div>
      <div class="command-list js-scroll-area"></div>
    `;
    this.input = this.element.querySelector('.command-input');
    this.list = this.element.querySelector('.command-list');
    this._renderListContent();
    this._renderEmptyState();
    if (window.lucide) {
      window.lucide.createIcons({ nodes: [this.element] });
    }
  }
  _renderListContent() {
    this.groupsData.forEach(groupData => {
      if (groupData.type === 'separator') {
        const separatorEl = document.createElement('div');
        separatorEl.className = 'command-separator';
        this.list.appendChild(separatorEl);
        return;
      }
      const groupEl = document.createElement('div');
      groupEl.className = 'command-group';
      const headingEl = document.createElement('div');
      headingEl.className = 'command-group-heading';
      headingEl.textContent = groupData.heading;
      groupEl.appendChild(headingEl);
      groupData.items.forEach(itemData => {
        const itemEl = document.createElement('div');
        itemEl.className = 'command-item';
        itemEl.dataset.id = itemData.id;
        itemEl.setAttribute('role', 'option');
        itemEl.setAttribute('aria-selected', 'false');
        itemEl.innerHTML = `
          <i data-lucide="${itemData.icon}" class="command-item-icon"></i>
          <span>${itemData.label}</span>
          ${itemData.shortcut ? `<div class="command-shortcut">${itemData.shortcut}</div>` : ''}
        `;
        itemEl._itemData = itemData;
        groupEl.appendChild(itemEl);
      });
      this.list.appendChild(groupEl);
    });
  }
  _renderEmptyState() {
    const emptyEl = document.createElement('div');
    emptyEl.className = 'command-empty';
    emptyEl.textContent = this.options.emptyMessage;
    emptyEl.style.display = 'none';
    this.list.appendChild(emptyEl);
  }
  _initEventListeners() {
    this.items = Array.from(this.element.querySelectorAll('.command-item'));
    this.element.setAttribute('role', 'combobox');
    this.element.setAttribute('aria-expanded', 'true');
    this.input.setAttribute('role', 'searchbox');
    this.list.setAttribute('role', 'listbox');
    if (this.options.searchable) {
      this.input.addEventListener('input', this._boundHandlers.input);
    }
    if (this.options.keyboard) {
      this.input.addEventListener('keydown', this._boundHandlers.keydown);
    }
    this.list.addEventListener('mouseleave', this._boundHandlers.mouseleave);
    this.items.forEach(item => {
      item.addEventListener('click', () => {
        this._boundHandlers.itemClick(item, item._itemData);
      });
      item.addEventListener('mouseenter', () => {
        const index = this.filteredItems.indexOf(item);
        if (index > -1) this._updateSelectionHighlight(index);
      });
    });
    this._filter('');
  }
  _handleInput(e) {
    this._filter(e.target.value);
    this.emit('search', { query: e.target.value, results: this.filteredItems.length });
  }
  _handleKeydown(e) {
    if (!['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.key)) return;
    e.preventDefault();
    switch (e.key) {
      case 'ArrowDown':
        this._navigateDown();
        break;
      case 'ArrowUp':
        this._navigateUp();
        break;
      case 'Enter':
        this._selectCurrent();
        break;
      case 'Escape':
        this.close();
        break;
    }
  }
  _handleMouseLeave() {
    this._updateSelectionHighlight(-1);
  }
  _handleItemClick(item, itemData) {
    this.emit('select', { item: itemData, element: item });
    if (this.options.onSelect) {
      this.options.onSelect(itemData);
    }
  }
  _navigateDown() {
    const newIndex = Math.min(this.selectedIndex + 1, this.filteredItems.length - 1);
    this._updateSelectionHighlight(newIndex);
  }
  _navigateUp() {
    const newIndex = Math.max(this.selectedIndex - 1, 0);
    this._updateSelectionHighlight(newIndex);
  }
  _selectCurrent() {
    if (this.selectedIndex !== -1 && this.filteredItems[this.selectedIndex]) {
      this.filteredItems[this.selectedIndex].click();
    }
  }
  _filter(query) {
    const normalizedQuery = query.toLowerCase().trim();
    const emptyState = this.element.querySelector('.command-empty');
    let hasVisibleItems = false;
    const visibleGroups = [];
    this.element.querySelectorAll('.command-group').forEach(groupEl => {
      let groupHasVisibleItems = false;
      groupEl.querySelectorAll('.command-item').forEach(itemEl => {
        const isVisible = itemEl.textContent.toLowerCase().includes(normalizedQuery);
        itemEl.style.display = isVisible ? '' : 'none';
        if (isVisible) {
          groupHasVisibleItems = true;
          hasVisibleItems = true;
        }
      });
      groupEl.style.display = groupHasVisibleItems ? '' : 'none';
      if (groupHasVisibleItems) visibleGroups.push(groupEl);
    });
    this.element.querySelectorAll('.command-separator').forEach(separatorEl => {
      const nextGroup = separatorEl.nextElementSibling;
      separatorEl.style.display = (nextGroup && visibleGroups.includes(nextGroup) && nextGroup !== visibleGroups[0]) ? '' : 'none';
    });
    emptyState.style.display = hasVisibleItems ? 'none' : 'block';
    this.filteredItems = this.items.filter(item => item.style.display !== 'none');
    this._updateSelectionHighlight(this.filteredItems.length > 0 ? 0 : -1);
  }
  _updateSelectionHighlight(index) {
    this.selectedIndex = index;
    this.items.forEach((item, i) => {
      const isSelected = this.filteredItems[this.selectedIndex] === item;
      item.setAttribute('aria-selected', isSelected);
    });
    if (this.selectedIndex > -1 && this.filteredItems[this.selectedIndex]) {
      this.filteredItems[this.selectedIndex].scrollIntoView({ 
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }
  search(query) {
    this.input.value = query;
    this._filter(query);
  }
  focus() {
    this.input.focus();
  }
  close() {
    this.emit('close');
  }
  updateGroups(newGroups) {
    this.groupsData = newGroups;
    this.options.groups = newGroups;
    this.list.innerHTML = '';
    this._renderListContent();
    this._renderEmptyState();
    this._initEventListeners();
    if (window.lucide) {
      window.lucide.createIcons({ nodes: [this.element] });
    }
    this.emit('update', { groups: newGroups });
  }
  getSelectedItem() {
    if (this.selectedIndex === -1 || !this.filteredItems[this.selectedIndex]) {
      return null;
    }
    return this.filteredItems[this.selectedIndex]._itemData;
  }
  selectItem(itemId) {
    const item = this.items.find(item => item.dataset.id === itemId);
    if (item && item.style.display !== 'none') {
      item.click();
    }
  }
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`command:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }
  destroy() {
    this.input.removeEventListener('input', this._boundHandlers.input);
    this.input.removeEventListener('keydown', this._boundHandlers.keydown);
    this.list.removeEventListener('mouseleave', this._boundHandlers.mouseleave);
    this.element.classList.remove('command-initialized');
    delete this.element.command;
    this.emit('destroy');
  }
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.command:not(.command-initialized)').forEach(el => {
    if (el.hasAttribute('data-command') || el.querySelector('.command-input, .command-list')) {
      el.command = new Command(el);
    }
  });
});
class ContextMenu {
  static #instances = new Set();
  constructor(contextMenuElement, options = {}) {
    if (!contextMenuElement || contextMenuElement.contextMenu) return;
    this.element = contextMenuElement;
    this.id = contextMenuElement.id || `context-menu-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };
    this.trigger = this.element.querySelector('[data-context-menu-trigger]');
    this.content = this.element.querySelector('.context-menu-content');
    if (!this.trigger || !this.content) {
      console.error('ContextMenu missing required elements.', this.element);
      return;
    }
    this.isOpen = false;
    this.submenuCloseTimer = null;
    this._boundHandlers = {
      trigger: (e) => this._handleTrigger(e),
      outsideClick: (e) => this._handleOutsideClick(e),
      keydown: (e) => this._handleKeydown(e),
    };
    this.init();
    this.element.contextMenu = this;
    ContextMenu.#instances.add(this); 
  }
  defaults = {
    closeOnItemClick: true,
    submenuDelay: 100,
  }
  init() {
    this.setupStructure();
    this.setupEvents();
    this.element.classList.add('context-menu-initialized');
    this.emit('init');
  }
  setupStructure() {
    this.content.style.position = 'fixed';
    this.content.setAttribute('role', 'menu');
    this.content.setAttribute('data-state', 'closed');
  }
  setupEvents() {
    this.trigger.addEventListener('contextmenu', this._boundHandlers.trigger);
    this.element.querySelectorAll('.context-menu-item, .context-menu-checkbox-item, .context-menu-radio-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        this._handleItemClick(item);
      });
    });
    this.element.querySelectorAll('.context-menu-sub').forEach(sub => {
      sub.addEventListener('mouseenter', () => this._handleSubmenuEnter(sub));
      sub.addEventListener('mouseleave', () => this._handleSubmenuLeave(sub));
    });
    this.content.addEventListener('mouseover', (e) => {
      if (!e.target.closest('.context-menu-sub')) {
        this._closeAllSubmenus();
      }
    });
  }
  _handleTrigger(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.isOpen) {
        this.close();
        return;
    }
    ContextMenu.closeAll(this);
    this.open(e.clientX, e.clientY);
  }
  _handleOutsideClick(e) {
    if (this.isOpen && !this.content.contains(e.target)) {
      this.close();
    }
  }
  _handleKeydown(e) {
    if (e.key === 'Escape') {
      this.close();
    }
  }
  _handleItemClick(item) {
    if (item.getAttribute('data-disabled') === 'true') return;
    if (item.classList.contains('context-menu-checkbox-item')) {
      const isChecked = item.getAttribute('aria-checked') === 'true';
      item.setAttribute('aria-checked', String(!isChecked));
    } else if (item.classList.contains('context-menu-radio-item')) {
      const group = item.closest('.context-menu-radio-group');
      if (group) {
        group.querySelectorAll('.context-menu-radio-item').forEach(radio => {
          radio.setAttribute('aria-checked', 'false');
        });
      }
      item.setAttribute('aria-checked', 'true');
    }
    if (this.options.closeOnItemClick) {
      this.close();
    }
  }
  _handleSubmenuEnter(sub) {
    clearTimeout(this.submenuCloseTimer);
    const trigger = sub.querySelector('.context-menu-sub-trigger');
    const content = sub.querySelector('.context-menu-sub-content');
    if (trigger && content) {
      this._openSubmenu(trigger, content);
    }
  }
  _handleSubmenuLeave(sub) {
    const content = sub.querySelector('.context-menu-sub-content');
    this.submenuCloseTimer = setTimeout(() => {
        if(content) content.setAttribute('data-state', 'closed');
    }, this.options.submenuDelay);
  }
  open(x, y) {
    if (this.isOpen) return;
    this.isOpen = true;
    this._positionContent(this.content, x, y);
    this.content.setAttribute('data-state', 'open');
    setTimeout(() => {
        document.addEventListener('click', this._boundHandlers.outsideClick);
        document.addEventListener('keydown', this._boundHandlers.keydown);
    }, 0);
    this.emit('open');
  }
  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.content.setAttribute('data-state', 'closed');
    this._closeAllSubmenus();
    document.removeEventListener('click', this._boundHandlers.outsideClick);
    document.removeEventListener('keydown', this._boundHandlers.keydown);
    this.emit('close');
  }
  _positionContent(element, x, y) {
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    const rect = element.getBoundingClientRect();
    if (rect.right > window.innerWidth - 8) {
      element.style.left = `${window.innerWidth - rect.width - 8}px`;
    }
    if (rect.bottom > window.innerHeight - 8) {
      element.style.top = `${window.innerHeight - rect.height - 8}px`;
    }
  }
  _openSubmenu(trigger, content) {
    this._closeAllSubmenus(content);
    content.setAttribute('data-state', 'open');
    const triggerRect = trigger.getBoundingClientRect();
    content.style.left = `${triggerRect.right - 4}px`;
    content.style.top = `${triggerRect.top - 5}px`;
    const contentRect = content.getBoundingClientRect();
    if (contentRect.right > window.innerWidth - 8) {
      content.style.left = `${triggerRect.left - contentRect.width + 4}px`;
    }
    if (contentRect.bottom > window.innerHeight - 8) {
      content.style.top = `${window.innerHeight - contentRect.height - 8}px`;
    }
  }
  _closeAllSubmenus(exclude = null) {
    this.element.querySelectorAll('.context-menu-sub-content').forEach(sub => {
      if (sub !== exclude) sub.setAttribute('data-state', 'closed');
    });
  }
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`context-menu:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }
  destroy() {
    this.trigger.removeEventListener('contextmenu', this._boundHandlers.trigger);
    this.element.classList.remove('context-menu-initialized');
    delete this.element.contextMenu;
    ContextMenu.#instances.delete(this);
    this.emit('destroy');
  }
  static closeAll(exclude = null) {
    for (const instance of this.#instances) {
      if (instance !== exclude) {
        instance.close();
      }
    }
  }
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.context-menu:not(.context-menu-initialized)').forEach(el => {
    new ContextMenu(el);
  });
});
class Dialog {
  constructor(dialogElement, options = {}) {
    if (!dialogElement || dialogElement.dialog) return;
    this.element = dialogElement;
    this.id = dialogElement.id || `dialog-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };
    this.overlay = this.element.querySelector('.dialog-overlay');
    this.content = this.element.querySelector('.dialog-content');
    this.closeButtons = this.element.querySelectorAll('[data-dialog-close]');
    if (!this.overlay || !this.content) {
      console.error('Dialog missing required elements: .dialog-overlay or .dialog-content', this.element);
      return;
    }
    this.isOpen = false;
    this.lastActiveElement = null;
    this.focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    this._boundHandlers = {
      close: () => this.close(),
      keydown: (e) => this._handleKeydown(e),
      overlayClick: (e) => this._handleOverlayClick(e)
    };
    this.init();
    this.element.dialog = this;
  }
  defaults = {
    closeOnOverlayClick: true,
    closeOnEscape: true,
    trapFocus: true,
    lockBodyScroll: true,
    restoreFocus: true
  }
  init() {
    this.setupStructure();
    this.setupInitialState();
    this._applyClassBasedSettings();
    this.element.classList.add('dialog-initialized');
    this.emit('init');
  }
  setupStructure() {
    this.element.setAttribute('role', 'dialog');
    this.element.setAttribute('aria-modal', 'true');
    this.element.setAttribute('aria-hidden', 'true');
    this.content.setAttribute('tabindex', '-1');
  }
  setupInitialState() {
    this.element.style.display = 'none';
  }
  _applyClassBasedSettings() {
    if (this.element.classList.contains('dialog-no-overlay-close')) {
      this.options.closeOnOverlayClick = false;
    }
    if (this.element.classList.contains('dialog-no-escape')) {
      this.options.closeOnEscape = false;
    }
    if (this.element.classList.contains('dialog-no-focus-trap')) {
      this.options.trapFocus = false;
    }
    if (this.element.classList.contains('dialog-no-body-lock')) {
      this.options.lockBodyScroll = false;
    }
  }
  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    if (this.options.restoreFocus) {
      this.lastActiveElement = document.activeElement;
    }
    this.element.style.display = 'block';
    if (this.options.lockBodyScroll) {
      document.body.style.overflow = 'hidden';
    }
    requestAnimationFrame(() => {
      this.overlay.classList.add('open');
      this.content.classList.add('open');
    });
    this.element.setAttribute('aria-hidden', 'false');
    this._addEventListeners();
    this._focusFirstElement();
    this.emit('open');
  }
  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.overlay.classList.remove('open');
    this.content.classList.remove('open');
    this.element.setAttribute('aria-hidden', 'true');
    this._removeEventListeners();
    setTimeout(() => {
      this.element.style.display = 'none';
      if (this.options.lockBodyScroll) {
        document.body.style.overflow = '';
      }
      if (this.options.restoreFocus && this.lastActiveElement) {
        this.lastActiveElement.focus();
        this.lastActiveElement = null;
      }
    }, 200); 
    this.emit('close');
  }
  toggle() {
    this.isOpen ? this.close() : this.open();
  }
  _addEventListeners() {
    this.closeButtons.forEach(btn => {
      btn.addEventListener('click', this._boundHandlers.close);
    });
    if (this.options.closeOnOverlayClick) {
      this.overlay.addEventListener('click', this._boundHandlers.overlayClick);
    }
    document.addEventListener('keydown', this._boundHandlers.keydown);
  }
  _removeEventListeners() {
    this.closeButtons.forEach(btn => {
      btn.removeEventListener('click', this._boundHandlers.close);
    });
    this.overlay.removeEventListener('click', this._boundHandlers.overlayClick);
    document.removeEventListener('keydown', this._boundHandlers.keydown);
  }
  _handleOverlayClick(e) {
    if (e.target === this.overlay) {
      this.close();
    }
  }
  _handleKeydown(e) {
    if (!this.isOpen) return;
    if (e.key === 'Escape' && this.options.closeOnEscape) {
      e.preventDefault();
      this.close();
      return;
    }
    if (e.key === 'Tab' && this.options.trapFocus) {
      this._handleTabKey(e);
    }
  }
  _handleTabKey(e) {
    const focusables = Array.from(this.content.querySelectorAll(this.focusableElements))
      .filter(el => !el.disabled && el.offsetParent !== null);
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
  _focusFirstElement() {
    const firstFocusable = this.content.querySelector(this.focusableElements);
    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      this.content.focus();
    }
  }
  setTitle(title) {
    const titleElement = this.element.querySelector('.dialog-title');
    if (titleElement) {
      titleElement.textContent = title;
    }
  }
  setDescription(description) {
    const descElement = this.element.querySelector('.dialog-description');
    if (descElement) {
      descElement.textContent = description;
    }
  }
  getState() {
    return {
      isOpen: this.isOpen,
      hasOverlay: !!this.overlay,
      hasCloseButtons: this.closeButtons.length > 0,
      options: { ...this.options }
    };
  }
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`dialog:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }
  destroy() {
    if (this.isOpen) {
      this.close();
    }
    this._removeEventListeners();
    this.element.classList.remove('dialog-initialized');
    delete this.element.dialog;
    this.emit('destroy');
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const dialogs = new Map();
  document.querySelectorAll('.dialog:not(.dialog-initialized)').forEach(el => {
    const dialog = new Dialog(el);
    if (el.id) {
      dialogs.set(el.id, dialog);
    }
  });
  document.querySelectorAll('[data-dialog-trigger]').forEach(trigger => {
    const dialogId = trigger.getAttribute('data-dialog-trigger');
    const dialog = dialogs.get(dialogId);
    if (dialog) {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        dialog.open();
      });
    }
  });
  window.AppDialogs = Object.fromEntries(dialogs);
});
class DropdownMenu {
  constructor(dropdownElement, options = {}) {
    if (!dropdownElement || dropdownElement.dropdownMenu) return;
    this.element = dropdownElement;
    this.id = dropdownElement.id || `dropdown-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };
    this.trigger = this.element.querySelector('.dropdown-menu-trigger');
    this.content = this.element.querySelector('.dropdown-menu-content');
    if (!this.trigger || !this.content) {
      console.error('DropdownMenu is missing trigger or content element.', this.element);
      return;
    }
    this.isPortaled = this.element.querySelector('.dropdown-menu-portal') !== null;
    this.originalParent = this.content.parentElement;
    this.submenuCloseTimer = null;
    this._isOpen = false;
    this._boundHandlers = {
      triggerClick: (e) => this._handleTriggerClick(e),
      outsideClick: (e) => this._handleOutsideClick(e),
      keydown: (e) => this._handleKeydown(e),
      contentMouseover: (e) => this._handleContentMouseover(e)
    };
    this._cachedElements = {
      items: null,
      submenus: null
    };
    this.init();
    this.element.dropdownMenu = this;
  }
  defaults = {
    closeOnSelect: true,
    sideOffset: 4,
    viewportPadding: 8,
    submenuDelay: 100
  }
  get isOpen() {
    return this._isOpen;
  }
  get items() {
    if (!this._cachedElements.items) {
      this._cachedElements.items = Array.from(
        this.element.querySelectorAll('.dropdown-menu-item, .dropdown-menu-checkbox-item, .dropdown-menu-radio-item')
      );
    }
    return this._cachedElements.items;
  }
  get submenus() {
    if (!this._cachedElements.submenus) {
      this._cachedElements.submenus = Array.from(this.element.querySelectorAll('.dropdown-menu-sub'));
    }
    return this._cachedElements.submenus;
  }
  init() {
    this.setupInitialState();
    this.setupEvents();
    this.setupSubmenus();
    this.element.classList.add('dropdown-menu-initialized');
    this.emit('init', { totalItems: this.items.length });
  }
  setupInitialState() {
    this.content.setAttribute('data-state', 'closed');
  }
  setupEvents() {
    this.trigger.addEventListener('mousedown', this._boundHandlers.triggerClick);
    this.content.addEventListener('click', (e) => {
      const item = e.target.closest('.dropdown-menu-item, .dropdown-menu-checkbox-item, .dropdown-menu-radio-item');
      if (item) this._handleItemClick(item);
    });
    this.content.addEventListener('mouseover', this._boundHandlers.contentMouseover);
  }
  setupSubmenus() {
    this.submenus.forEach(sub => {
      const trigger = sub.querySelector('.dropdown-menu-sub-trigger');
      const content = sub.querySelector('.dropdown-menu-sub-content');
      if (trigger && content) {
        content.setAttribute('data-state', 'closed');
        sub.addEventListener('mouseenter', () => {
          clearTimeout(this.submenuCloseTimer);
          this.openSubmenu(trigger, content);
        }, { passive: true });
        sub.addEventListener('mouseleave', () => {
          this.submenuCloseTimer = setTimeout(() => {
            if(content) content.setAttribute('data-state', 'closed');
          }, this.options.submenuDelay);
        }, { passive: true });
      }
    });
  }
  _handleTriggerClick(e) {
    e.stopPropagation();
    this.toggle();
  }
  _handleOutsideClick(e) {
    if (this.isOpen && !this.content.contains(e.target)) {
      this.close();
    }
  }
  _handleKeydown(e) {
    if (e.key === 'Escape') {
      this.close();
    }
  }
  _handleContentMouseover(e) {
    if (!e.target.closest('.dropdown-menu-sub')) {
      this.closeAllSubmenus();
    }
  }
  _handleItemClick(item) {
    if (item.classList.contains('dropdown-menu-item-disabled')) return;
    this._handleItemState(item);
    const shouldKeepOpen = this._shouldKeepOpen(item);
    this.emit('select', {
      item,
      value: item.textContent?.trim(),
      shouldKeepOpen
    });
    if (!shouldKeepOpen && this.options.closeOnSelect) {
      this.close();
    }
  }
  _handleItemState(item) {
    if (item.classList.contains('dropdown-menu-checkbox-item')) {
      const isChecked = item.getAttribute('aria-checked') === 'true';
      item.setAttribute('aria-checked', String(!isChecked));
    } else if (item.classList.contains('dropdown-menu-radio-item')) {
      const group = item.closest('.dropdown-menu-radio-group');
      if (group) {
        const radios = group.querySelectorAll('.dropdown-menu-radio-item');
        radios.forEach(radio => radio.setAttribute('aria-checked', 'false'));
      }
      item.setAttribute('aria-checked', 'true');
    }
  }
  _shouldKeepOpen(item) {
    return item.closest('.dropdown-menu-sub-content') ||
           item.classList.contains('dropdown-menu-checkbox-item') ||
           item.classList.contains('dropdown-menu-radio-item');
  }
  toggle() {
    this.isOpen ? this.close() : this.open();
  }
  open() {
    if (this.isOpen) return;
    DropdownMenu._closeAllExcept(this.element);
    this._isOpen = true;
    if (this.isPortaled) {
      document.body.appendChild(this.content);
    }
    document.body.style.overflow = 'hidden';
    this.content.setAttribute('data-state', 'open');
    this.positionContent();
    this._addGlobalListeners();
    this.emit('open');
  }
  close() {
    if (!this.isOpen) return;
    this._isOpen = false;
    document.body.style.overflow = '';
    this.content.setAttribute('data-state', 'closed');
    this.closeAllSubmenus();
    this._removeGlobalListeners();
    if (this.isPortaled && this.content.parentElement === document.body) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          this.originalParent.appendChild(this.content);
        }, 150);
      });
    }
    this.emit('close');
  }
  static _closeAllExcept(exceptElement) {
    const openDropdowns = document.querySelectorAll('.dropdown-menu-initialized');
    for (const dropdown of openDropdowns) {
      if (dropdown !== exceptElement && dropdown.dropdownMenu?.isOpen) {
        dropdown.dropdownMenu.close();
      }
    }
  }
  _addGlobalListeners() {
    setTimeout(() => {
      document.addEventListener('mousedown', this._boundHandlers.outsideClick);
      document.addEventListener('keydown', this._boundHandlers.keydown);
    }, 0);
  }
  _removeGlobalListeners() {
    document.removeEventListener('mousedown', this._boundHandlers.outsideClick);
    document.removeEventListener('keydown', this._boundHandlers.keydown);
  }
  positionContent() {
    this.content.style.minWidth = this.content.style.width ? '0' : '';
    const position = this._calculatePosition();
    Object.assign(this.content.style, {
      maxHeight: `${window.innerHeight - 2 * this.options.viewportPadding}px`,
      top: `${position.top}px`,
      left: `${position.left}px`
    });
  }
  _calculatePosition() {
    const side = this._getSide();
    const align = this._getAlignment();
    const triggerRect = this.trigger.getBoundingClientRect();
    const contentRect = this.content.getBoundingClientRect();
    let { top, left } = this._getPositionForSide(side, triggerRect, contentRect);
    ({ top, left } = this._adjustForAlignment(side, align, top, left, triggerRect, contentRect));
    ({ top, left } = this._constrainToViewport(top, left, contentRect));
    return { top, left };
  }
  _getSide() {
    if (this.element.classList.contains('dropdown-menu-top')) return 'top';
    if (this.element.classList.contains('dropdown-menu-left')) return 'left';
    if (this.element.classList.contains('dropdown-menu-right')) return 'right';
    return 'bottom';
  }
  _getAlignment() {
    if (this.element.classList.contains('dropdown-menu-align-center')) return 'center';
    if (this.element.classList.contains('dropdown-menu-align-end')) return 'end';
    return 'start';
  }
  _getPositionForSide(side, triggerRect, contentRect) {
    const { sideOffset } = this.options;
    switch (side) {
      case 'top':
        return { top: triggerRect.top - contentRect.height - sideOffset, left: 0 };
      case 'bottom':
        return { top: triggerRect.bottom + sideOffset, left: 0 };
      case 'left':
        return { top: 0, left: triggerRect.left - contentRect.width - sideOffset };
      case 'right':
        return { top: 0, left: triggerRect.right + sideOffset };
      default:
        return { top: 0, left: 0 };
    }
  }
  _adjustForAlignment(side, align, top, left, triggerRect, contentRect) {
    if (side === 'top' || side === 'bottom') {
      switch (align) {
        case 'start':
          left = triggerRect.left;
          break;
        case 'center':
          left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
          break;
        case 'end':
          left = triggerRect.right - contentRect.width;
          break;
      }
    } else {
      switch (align) {
        case 'start':
          top = triggerRect.top;
          break;
        case 'center':
          top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
          break;
        case 'end':
          top = triggerRect.bottom - contentRect.height;
          break;
      }
    }
    return { top, left };
  }
  _constrainToViewport(top, left, contentRect) {
    const { viewportPadding } = this.options;
    if (left + contentRect.width > window.innerWidth - viewportPadding) {
      left = window.innerWidth - contentRect.width - viewportPadding;
    }
    if (left < viewportPadding) left = viewportPadding;
    if (top < viewportPadding) top = viewportPadding;
    return { top, left };
  }
  openSubmenu(trigger, content) {
    this.closeAllSubmenus(content);
    content.setAttribute('data-state', 'open');
    const triggerRect = trigger.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    let left = triggerRect.right - 4;
    let top = triggerRect.top - 5;
    if (left + contentRect.width > window.innerWidth - 8) {
      left = triggerRect.left - contentRect.width + 4;
    }
    if (top + contentRect.height > window.innerHeight - 8) {
      top = window.innerHeight - contentRect.height - 8;
    }
    if (top < 8) top = 8;
    Object.assign(content.style, {
      left: `${left}px`,
      top: `${top}px`
    });
    this.emit('submenu:open', { trigger, content });
  }
  closeAllSubmenus(exclude = null) {
    const subcontents = this.element.querySelectorAll('.dropdown-menu-sub-content');
    for (const sub of subcontents) {
      if (sub !== exclude) {
        sub.setAttribute('data-state', 'closed');
      }
    }
  }
  _clearCache() {
    this._cachedElements.items = null;
    this._cachedElements.submenus = null;
  }
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`dropdown:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }
  destroy() {
    clearTimeout(this.submenuCloseTimer);
    this.trigger.removeEventListener('mousedown', this._boundHandlers.triggerClick);
    this.content.removeEventListener('mouseover', this._boundHandlers.contentMouseover);
    this._removeGlobalListeners();
    this._clearCache();
    this.element.classList.remove('dropdown-menu-initialized');
    delete this.element.dropdownMenu;
    this.emit('destroy');
  }
}
const dropdownGlobals = {
  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.autoInit);
    } else {
      this.autoInit();
    }
  },
  autoInit() {
    const dropdowns = document.querySelectorAll('.dropdown-menu:not(.dropdown-menu-initialized)');
    for (const el of dropdowns) {
      el.dropdownMenu = new DropdownMenu(el);
    }
  }
};
dropdownGlobals.init();
class HoverCard {
  constructor(hoverCardElement, options = {}) {
    if (!hoverCardElement || hoverCardElement.hoverCard) return;
    this.element = hoverCardElement;
    this.id = hoverCardElement.id || `hover-card-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };
    this.trigger = this.element.querySelector('.hover-card-trigger');
    this.content = this.element.querySelector('.hover-card-content');
    if (!this.trigger || !this.content) {
      console.error('HoverCard missing required elements: .hover-card-trigger or .hover-card-content', this.element);
      return;
    }
    this.isOpen = false;
    this.openTimer = null;
    this.closeTimer = null;
    this._boundHandlers = {
      triggerEnter: () => this._handleTriggerEnter(),
      triggerLeave: () => this._handleTriggerLeave(),
      contentEnter: () => this._handleContentEnter(),
      contentLeave: () => this._handleContentLeave(),
      windowResize: () => this._handleWindowResize()
    };
    this.init();
    this.element.hoverCard = this;
  }
  defaults = {
    openDelay: 100,
    closeDelay: 300,
    positioning: 'auto', 
    offset: 8,
    closeOnClick: false,
    disabled: false
  }
  init() {
    this.setupStructure();
    this.setupEvents();
    this.setupInitialState();
    this._applyClassBasedSettings();
    this.element.classList.add('hover-card-initialized');
    this.emit('init');
  }
  setupStructure() {
    this.content.style.position = 'fixed';
    this.content.style.zIndex = '50';
    const contentId = this.content.id || `${this.id}-content`;
    this.content.id = contentId;
    this.trigger.setAttribute('aria-describedby', contentId);
    this.content.setAttribute('role', 'tooltip');
  }
  setupEvents() {
    this.trigger.addEventListener('mouseenter', this._boundHandlers.triggerEnter);
    this.trigger.addEventListener('mouseleave', this._boundHandlers.triggerLeave);
    this.content.addEventListener('mouseenter', this._boundHandlers.contentEnter);
    this.content.addEventListener('mouseleave', this._boundHandlers.contentLeave);
    if (this.options.closeOnClick) {
      this.content.addEventListener('click', () => this.close());
    }
    window.addEventListener('resize', this._boundHandlers.windowResize);
  }
  setupInitialState() {
    this.content.style.display = 'none';
    this.content.setAttribute('data-state', 'closed');
  }
  _applyClassBasedSettings() {
    if (this.element.classList.contains('hover-card-disabled')) {
      this.options.disabled = true;
    }
    if (this.element.classList.contains('hover-card-click-close')) {
      this.options.closeOnClick = true;
    }
    if (this.element.classList.contains('hover-card-no-delay')) {
      this.options.openDelay = 0;
      this.options.closeDelay = 0;
    }
    if (this.element.classList.contains('hover-card-fast')) {
      this.options.openDelay = 50;
      this.options.closeDelay = 150;
    }
    if (this.element.classList.contains('hover-card-slow')) {
      this.options.openDelay = 300;
      this.options.closeDelay = 500;
    }
    if (this.element.classList.contains('hover-card-top')) {
      this.options.positioning = 'top';
    } else if (this.element.classList.contains('hover-card-bottom')) {
      this.options.positioning = 'bottom';
    } else if (this.element.classList.contains('hover-card-left')) {
      this.options.positioning = 'left';
    } else if (this.element.classList.contains('hover-card-right')) {
      this.options.positioning = 'right';
    }
  }
  _handleTriggerEnter() {
    if (this.options.disabled) return;
    this._clearCloseTimer();
    if (this.isOpen) return;
    this.openTimer = setTimeout(() => {
      this.open();
    }, this.options.openDelay);
  }
  _handleTriggerLeave() {
    if (this.options.disabled) return;
    this._clearOpenTimer();
    this._startCloseTimer();
  }
  _handleContentEnter() {
    if (this.options.disabled) return;
    this._clearCloseTimer();
  }
  _handleContentLeave() {
    if (this.options.disabled) return;
    this._startCloseTimer();
  }
  _handleWindowResize() {
    if (this.isOpen) {
      this._positionContent();
    }
  }
  _clearOpenTimer() {
    if (this.openTimer) {
      clearTimeout(this.openTimer);
      this.openTimer = null;
    }
  }
  _clearCloseTimer() {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }
  _startCloseTimer() {
    this.closeTimer = setTimeout(() => {
      this.close();
    }, this.options.closeDelay);
  }
  open() {
    if (this.isOpen || this.options.disabled) return;
    this.isOpen = true;
    this.content.style.display = 'block';
    this._positionContent();
    requestAnimationFrame(() => {
      this.content.setAttribute('data-state', 'open');
    });
    this.emit('open');
  }
  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this._clearOpenTimer();
    this._clearCloseTimer();
    this.content.setAttribute('data-state', 'closed');
    setTimeout(() => {
      if (this.content.getAttribute('data-state') === 'closed') {
        this.content.style.display = 'none';
      }
    }, 150); 
    this.emit('close');
  }
  toggle() {
    this.isOpen ? this.close() : this.open();
  }
  _positionContent() {
    const triggerRect = this.trigger.getBoundingClientRect();
    const contentRect = this.content.getBoundingClientRect();
    const viewportPadding = this.options.offset;
    let position = this._calculateOptimalPosition(triggerRect, contentRect, viewportPadding);
    this.content.style.top = `${position.top}px`;
    this.content.style.left = `${position.left}px`;
    this.content.setAttribute('data-position', position.placement);
  }
  _calculateOptimalPosition(triggerRect, contentRect, viewportPadding) {
    const positions = {
      bottom: {
        top: triggerRect.bottom + viewportPadding,
        left: triggerRect.left + (triggerRect.width / 2) - (contentRect.width / 2),
        placement: 'bottom'
      },
      top: {
        top: triggerRect.top - contentRect.height - viewportPadding,
        left: triggerRect.left + (triggerRect.width / 2) - (contentRect.width / 2),
        placement: 'top'
      },
      right: {
        top: triggerRect.top + (triggerRect.height / 2) - (contentRect.height / 2),
        left: triggerRect.right + viewportPadding,
        placement: 'right'
      },
      left: {
        top: triggerRect.top + (triggerRect.height / 2) - (contentRect.height / 2),
        left: triggerRect.left - contentRect.width - viewportPadding,
        placement: 'left'
      }
    };
    if (this.options.positioning !== 'auto' && positions[this.options.positioning]) {
      const position = positions[this.options.positioning];
      return this._adjustForViewport(position, contentRect, viewportPadding);
    }
    const preferredOrder = ['bottom', 'top', 'right', 'left'];
    for (const placement of preferredOrder) {
      const position = positions[placement];
      if (this._fitsInViewport(position, contentRect, viewportPadding)) {
        return this._adjustForViewport(position, contentRect, viewportPadding);
      }
    }
    return this._adjustForViewport(positions.bottom, contentRect, viewportPadding);
  }
  _fitsInViewport(position, contentRect, viewportPadding) {
    return (
      position.top >= viewportPadding &&
      position.left >= viewportPadding &&
      position.top + contentRect.height <= window.innerHeight - viewportPadding &&
      position.left + contentRect.width <= window.innerWidth - viewportPadding
    );
  }
  _adjustForViewport(position, contentRect, viewportPadding) {
    if (position.left < viewportPadding) {
      position.left = viewportPadding;
    } else if (position.left + contentRect.width > window.innerWidth - viewportPadding) {
      position.left = window.innerWidth - contentRect.width - viewportPadding;
    }
    if (position.top < viewportPadding) {
      position.top = viewportPadding;
    } else if (position.top + contentRect.height > window.innerHeight - viewportPadding) {
      position.top = window.innerHeight - contentRect.height - viewportPadding;
    }
    return position;
  }
  setContent(content) {
    if (typeof content === 'string') {
      this.content.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      this.content.innerHTML = '';
      this.content.appendChild(content);
    }
  }
  enable() {
    this.options.disabled = false;
    this.element.classList.remove('hover-card-disabled');
  }
  disable() {
    this.options.disabled = true;
    this.element.classList.add('hover-card-disabled');
    if (this.isOpen) {
      this.close();
    }
  }
  updatePosition() {
    if (this.isOpen) {
      this._positionContent();
    }
  }
  getState() {
    return {
      isOpen: this.isOpen,
      disabled: this.options.disabled,
      hasTimer: !!(this.openTimer || this.closeTimer),
      options: { ...this.options }
    };
  }
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`hover-card:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }
  destroy() {
    this._clearOpenTimer();
    this._clearCloseTimer();
    if (this.isOpen) {
      this.close();
    }
    this.trigger.removeEventListener('mouseenter', this._boundHandlers.triggerEnter);
    this.trigger.removeEventListener('mouseleave', this._boundHandlers.triggerLeave);
    this.content.removeEventListener('mouseenter', this._boundHandlers.contentEnter);
    this.content.removeEventListener('mouseleave', this._boundHandlers.contentLeave);
    window.removeEventListener('resize', this._boundHandlers.windowResize);
    this.element.classList.remove('hover-card-initialized');
    delete this.element.hoverCard;
    this.emit('destroy');
  }
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.hover-card:not(.hover-card-initialized)').forEach(el => {
    new HoverCard(el);
  });
});
class InputOTP {
  constructor(otpElement, options = {}) {
    if (!otpElement || otpElement.inputOTP) return;
    this.element = otpElement;
    this.id = otpElement.id || `input-otp-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };
    this.slots = Array.from(this.element.querySelectorAll('.input-otp-slot'));
    this.valueInput = this.element.querySelector('input[type="hidden"]');
    if (this.slots.length === 0) {
      console.error('InputOTP missing required elements: .input-otp-slot', this.element);
      return;
    }
    this.isProgrammaticFocus = false;
    this._handleDeselect = null;
    this._boundHandlers = {
      keydown: (e) => this._onKeyDown(e),
      input: (e) => this._onInput(e),
      paste: (e) => this._onPaste(e),
      focusin: (e) => this._onFocus(e),
      click: (e) => this._onClick(e)
    };
    this.init();
    this.element.inputOTP = this;
  }
  defaults = {
    onComplete: () => {},
    onValueChange: () => {}
  }
  init() {
    this.setupEvents();
    this.element.classList.add('input-otp-initialized');
    this.emit('init');
  }
  setupEvents() {
    this.element.addEventListener('keydown', this._boundHandlers.keydown);
    this.element.addEventListener('input', this._boundHandlers.input);
    this.element.addEventListener('paste', this._boundHandlers.paste);
    this.element.addEventListener('focusin', this._boundHandlers.focusin);
    this.element.addEventListener('click', this._boundHandlers.click);
  }
  _clearSelection() {
    this.slots.forEach(s => s.classList.remove('is-selected'));
    if (this._handleDeselect) {
      document.removeEventListener('click', this._handleDeselect);
      this._handleDeselect = null;
    }
  }
  _updateValue() {
    const value = this.slots.map(slot => slot.value).join('');
    if (this.valueInput) {
      this.valueInput.value = value;
    }
    this.options.onValueChange(value);
    this.emit('value-change', { value });
    if (value.length === this.slots.length && value.split('').every(char => char !== '')) {
      this.options.onComplete(value);
      this.emit('complete', { value });
    }
  }
  _handleSelectAll() {
    this._clearSelection();
    const filledSlots = this.slots.filter(slot => slot.value);
    if (filledSlots.length > 0) {
      filledSlots.forEach(slot => slot.classList.add('is-selected'));
      this.isProgrammaticFocus = true;
      filledSlots[filledSlots.length - 1].focus();
      this.isProgrammaticFocus = false;
      this._handleDeselect = (e) => {
        if (!this.element.contains(e.target)) {
          this._clearSelection();
        }
      };
      document.addEventListener('click', this._handleDeselect);
    }
  }
  _handleMultiDelete(selectedSlots) {
    selectedSlots.forEach(slot => { slot.value = ''; });
    this._clearSelection();
    this._updateValue();
    this.slots[0].focus();
  }
  _handleSingleDelete(currentIndex) {
    let effectiveIndex = currentIndex;
    if (!this.slots[effectiveIndex].value && effectiveIndex > 0) {
      effectiveIndex--;
    }
    for (let i = effectiveIndex; i < this.slots.length - 1; i++) {
      this.slots[i].value = this.slots[i + 1].value;
    }
    this.slots[this.slots.length - 1].value = '';
    this._updateValue();
    this.slots[effectiveIndex].focus();
    this.slots[effectiveIndex].select();
  }
  _onKeyDown(e) {
    const target = e.target;
    if (!target.matches('.input-otp-slot')) return;
    const index = this.slots.indexOf(target);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      this._handleSelectAll();
      return;
    }
    if (e.key === 'Backspace') {
      e.preventDefault();
      const selectedSlots = this.slots.filter(s => s.classList.contains('is-selected'));
      if (selectedSlots.length > 0) {
        this._handleMultiDelete(selectedSlots);
      } else {
        this._handleSingleDelete(index);
      }
      return;
    }
    this._clearSelection();
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (index > 0) {
          this.slots[index - 1].focus();
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (index < this.slots.length - 1) {
          this.slots[index + 1].focus();
        }
        break;
    }
  }
  _onInput(e) {
    const target = e.target;
    if (!target.matches('.input-otp-slot')) return;
    this._clearSelection();
    const index = this.slots.indexOf(target);
    if (target.value && index < this.slots.length - 1) {
      this.slots[index + 1].focus();
    } 
    else if (target.value && index === this.slots.length - 1) {
      target.select();
    }
    this._updateValue();
  }
  _onPaste(e) {
    const target = e.target;
    if (!target.matches('.input-otp-slot')) return;
    e.preventDefault();
    this._clearSelection();
    const index = this.slots.indexOf(target);
    const pastedData = e.clipboardData.getData('text').trim().slice(0, this.slots.length - index);
    for (let i = 0; i < pastedData.length; i++) {
      if (this.slots[index + i]) {
        this.slots[index + i].value = pastedData[i];
      }
    }
    const nextFocusIndex = Math.min(index + pastedData.length, this.slots.length - 1);
    this.slots[nextFocusIndex].focus();
    this._updateValue();
  }
  _onFocus(e) {
    if (this.isProgrammaticFocus) return;
    if (e.target.matches('.input-otp-slot')) {
      this._clearSelection();
      e.target.select();
    }
  }
  _onClick(e) {
    if (e.target.matches('.input-otp-slot')) {
      e.preventDefault();
      const firstEmptySlot = this.slots.find(slot => !slot.value);
      if (firstEmptySlot) {
        firstEmptySlot.focus();
      } else {
        this.slots[this.slots.length - 1].focus();
      }
    }
  }
  getValue() {
    return this.slots.map(slot => slot.value).join('');
  }
  setValue(value) {
    const valueStr = String(value);
    for (let i = 0; i < this.slots.length; i++) {
      this.slots[i].value = valueStr[i] || '';
    }
    this._updateValue();
  }
  clear() {
    this.slots.forEach(slot => { slot.value = ''; });
    this._clearSelection();
    this._updateValue();
    this.slots[0].focus();
  }
  focus() {
    const firstEmptySlot = this.slots.find(slot => !slot.value);
    if (firstEmptySlot) {
      firstEmptySlot.focus();
    } else {
      this.slots[0].focus();
    }
  }
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`input-otp:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }
  destroy() {
    this.element.removeEventListener('keydown', this._boundHandlers.keydown);
    this.element.removeEventListener('input', this._boundHandlers.input);
    this.element.removeEventListener('paste', this._boundHandlers.paste);
    this.element.removeEventListener('focusin', this._boundHandlers.focusin);
    this.element.removeEventListener('click', this._boundHandlers.click);
    if (this._handleDeselect) {
      document.removeEventListener('click', this._handleDeselect);
    }
    this.element.classList.remove('input-otp-initialized');
    delete this.element.inputOTP;
    this.emit('destroy');
  }
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.input-otp:not(.input-otp-initialized)').forEach(el => {
    new InputOTP(el);
  });
});
class Menubar {
  constructor(menubarElement, options = {}) {
    if (!menubarElement || menubarElement.menubar) return;
    this.element = menubarElement;
    this.id = menubarElement.id || `menubar-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };
    this.activeMenu = null;
    this.submenuCloseTimer = null;
    this.menus = [];
    this._boundHandlers = {
      keydown: (e) => this._handleGlobalKeydown(e),
      click: (e) => this._handleGlobalClick(e)
    };
    this.init();
    this.element.menubar = this;
  }
  defaults = {
    closeOnEscape: true,
    closeOnOutsideClick: true
  }
  init() {
    this.setupStructure();
    this.setupMenus();
    this.setupGlobalEvents();
    this.element.classList.add('menubar-initialized');
    this.emit('init');
  }
  setupStructure() {
    this.element.setAttribute('role', 'menubar');
    if (!this.element.hasAttribute('aria-label')) {
      this.element.setAttribute('aria-label', 'Main menu');
    }
  }
  setupMenus() {
    const menuElements = Array.from(this.element.querySelectorAll('.menubar-menu'));
    this.menus = menuElements.map(el => new MenubarMenu(this, el));
  }
  setupGlobalEvents() {
    document.addEventListener('keydown', this._boundHandlers.keydown);
    document.addEventListener('click', this._boundHandlers.click);
  }
  _handleGlobalKeydown(e) {
    if (e.key === 'Escape' && this.activeMenu && this.options.closeOnEscape) {
      this.closeAllMenus();
    }
  }
  _handleGlobalClick(e) {
    if (this.activeMenu && !this.element.contains(e.target) && this.options.closeOnOutsideClick) {
      this.closeAllMenus();
    }
  }
  openMenu(menuToOpen) {
    if (this.activeMenu && this.activeMenu !== menuToOpen) {
      this.activeMenu.close();
    }
    this.activeMenu = menuToOpen;
    this.activeMenu.open();
    this.emit('menu-open', { menu: menuToOpen });
  }
  closeAllMenus() {
    if (this.activeMenu) {
      this.activeMenu.close();
      this.activeMenu = null;
      this.emit('menu-close-all');
    }
  }
  closeSubMenus(parentMenu) {
    clearTimeout(this.submenuCloseTimer);
    this.submenuCloseTimer = setTimeout(() => {
      parentMenu.subMenus.forEach(sub => sub.close());
    }, 100);
  }
  openSubMenu(submenuToOpen) {
    clearTimeout(this.submenuCloseTimer);
    submenuToOpen.parentMenu.subMenus.forEach(sub => {
      if (sub !== submenuToOpen) sub.close();
    });
    submenuToOpen.open();
    this.emit('submenu-open', { submenu: submenuToOpen });
  }
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`menubar:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }
  destroy() {
    clearTimeout(this.submenuCloseTimer);
    this.closeAllMenus();
    document.removeEventListener('keydown', this._boundHandlers.keydown);
    document.removeEventListener('click', this._boundHandlers.click);
    this.menus.forEach(menu => menu.destroy());
    this.element.classList.remove('menubar-initialized');
    delete this.element.menubar;
    this.emit('destroy');
  }
}
class MenubarMenu {
  constructor(controller, menuElement) {
    this.controller = controller;
    this.element = menuElement;
    this.trigger = menuElement.querySelector('.menubar-trigger');
    this.content = menuElement.querySelector('.menubar-content');
    this.subMenus = [];
    if (!this.trigger || !this.content) {
      console.error('MenubarMenu missing required elements', menuElement);
      return;
    }
    this.init();
  }
  init() {
    this.setupStructure();
    this.setupEvents();
    this.setupSubMenus();
  }
  setupStructure() {
    this.trigger.setAttribute('role', 'menuitem');
    this.trigger.setAttribute('aria-haspopup', 'true');
    this.trigger.setAttribute('aria-expanded', 'false');
    this.content.setAttribute('role', 'menu');
  }
  setupEvents() {
    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.controller.activeMenu === this ? 
        this.controller.closeAllMenus() : 
        this.controller.openMenu(this);
    });
    this.trigger.addEventListener('mouseenter', () => {
      if (this.controller.activeMenu && this.controller.activeMenu !== this) {
        this.controller.openMenu(this);
      }
    });
    this.content.addEventListener('click', (e) => {
      const item = e.target.closest('.menubar-item, .menubar-checkbox-item, .menubar-radio-item');
      if (!item || item.classList.contains('menubar-item-disabled')) return;
      if (item.classList.contains('menubar-checkbox-item')) {
        const isChecked = item.getAttribute('aria-checked') === 'true';
        item.setAttribute('aria-checked', String(!isChecked));
        this.controller.emit('checkbox-change', { item, checked: !isChecked });
      } else if (item.classList.contains('menubar-radio-item')) {
        const group = item.closest('.menubar-radio-group');
        if (group) {
          group.querySelectorAll('.menubar-radio-item').forEach(radio => {
            radio.setAttribute('aria-checked', 'false');
          });
        }
        item.setAttribute('aria-checked', 'true');
        this.controller.emit('radio-change', { item, group });
      }
      this.controller.emit('item-click', { item });
      if (!e.target.closest('.menubar-sub')) {
        this.controller.closeAllMenus();
      }
    });
  }
  setupSubMenus() {
    const subElements = Array.from(this.element.querySelectorAll('.menubar-sub'));
    this.subMenus = subElements.map(el => new MenubarSub(this, el));
  }
  open() {
    this.trigger.setAttribute('data-state', 'open');
    this.trigger.setAttribute('aria-expanded', 'true');
    this.content.setAttribute('data-state', 'open');
    this._positionContent();
  }
  close() {
    this.trigger.setAttribute('data-state', 'closed');
    this.trigger.setAttribute('aria-expanded', 'false');
    this.content.setAttribute('data-state', 'closed');
    this.subMenus.forEach(sub => sub.close());
  }
  _positionContent() {
    const sideOffset = 8;
    const viewportPadding = 8;
    const triggerRect = this.trigger.getBoundingClientRect();
    this.content.style.maxHeight = `${window.innerHeight - 2 * viewportPadding}px`;
    const contentRect = this.content.getBoundingClientRect();
    const space = {
      above: triggerRect.top - viewportPadding,
      below: window.innerHeight - triggerRect.bottom - viewportPadding,
    };
    let finalSide = 'bottom';
    if (space.below < contentRect.height && space.above > space.below) {
      finalSide = 'top';
    }
    let top = (finalSide === 'top') ? 
      triggerRect.top - contentRect.height - sideOffset : 
      triggerRect.bottom + sideOffset;
    let left = triggerRect.left;
    if (left + contentRect.width > window.innerWidth - viewportPadding) {
      left = window.innerWidth - contentRect.width - viewportPadding;
    }
    if (left < viewportPadding) {
      left = viewportPadding;
    }
    this.content.style.top = `${top}px`;
    this.content.style.left = `${left}px`;
  }
  destroy() {
    this.subMenus.forEach(sub => sub.destroy());
  }
}
class MenubarSub {
  constructor(parentMenu, subElement) {
    this.parentMenu = parentMenu;
    this.element = subElement;
    this.trigger = this.element.querySelector('.menubar-sub-trigger');
    this.content = this.element.querySelector('.menubar-sub-content');
    if (!this.trigger || !this.content) {
      console.error('MenubarSub missing required elements', subElement);
      return;
    }
    this.init();
  }
  init() {
    this.setupStructure();
    this.setupEvents();
  }
  setupStructure() {
    this.trigger.setAttribute('role', 'menuitem');
    this.trigger.setAttribute('aria-haspopup', 'true');
    this.trigger.setAttribute('aria-expanded', 'false');
    this.content.setAttribute('role', 'menu');
  }
  setupEvents() {
    this.element.addEventListener('mouseenter', () => {
      this.parentMenu.controller.openSubMenu(this);
    });
    this.element.addEventListener('mouseleave', () => {
      this.parentMenu.controller.closeSubMenus(this.parentMenu);
    });
  }
  open() {
    this.trigger.setAttribute('aria-expanded', 'true');
    this.content.setAttribute('data-state', 'open');
    this._positionContent();
  }
  close() {
    this.trigger.setAttribute('aria-expanded', 'false');
    this.content.setAttribute('data-state', 'closed');
  }
  _positionContent() {
    const triggerRect = this.trigger.getBoundingClientRect();
    this.content.style.left = `${triggerRect.right - 4}px`;
    this.content.style.top = `${triggerRect.top - 5}px`;
    const contentRect = this.content.getBoundingClientRect();
    if (contentRect.right > window.innerWidth - 8) {
      this.content.style.left = `${triggerRect.left - contentRect.width + 4}px`;
    }
    if (contentRect.bottom > window.innerHeight - 8) {
      this.content.style.top = `${window.innerHeight - contentRect.height - 8}px`;
    }
    if (contentRect.top < 8) {
      this.content.style.top = '8px';
    }
  }
  destroy() {
  }
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-menubar]:not(.menubar-initialized)').forEach(el => {
    new Menubar(el);
  });
});
class NavigationMenu {
  constructor(navElement, options = {}) {
    if (!navElement || navElement.navigationMenu) return;
    this.element = navElement;
    this.id = navElement.id || `navigation-menu-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };
    this.triggers = Array.from(this.element.querySelectorAll(this.options.triggerSelector));
    this.links = Array.from(this.element.querySelectorAll(this.options.linkSelector));
    this.panel = this.element.querySelector(this.options.panelSelector);
    this.contents = Array.from(this.element.querySelectorAll(this.options.contentSelector));
    if (!this.panel || this.triggers.length === 0 || this.contents.length === 0) {
      console.warn('NavigationMenu: Missing required elements.', {
        panel: this.panel,
        triggers: this.triggers.length,
        contents: this.contents.length
      });
      return;
    }
    this.activeIndex = -1;
    this.closeTimer = null;
    this.heightTimer = null;
    this._boundHandlers = {
      keydown: (e) => this._handleKeydown(e),
      resize: () => this._handleResize(),
      scroll: () => this._handleScroll(),
      outsideClick: (e) => this._handleOutsideClick(e),
      rootEnter: () => this._handleRootEnter(),
      rootLeave: () => this._handleRootLeave()
    };
    this.init();
    this.element.navigationMenu = this;
  }
  defaults = {
    triggerSelector: '[data-nav-trigger]',
    linkSelector: '[data-nav-link]',
    panelSelector: '[data-nav-panel]',
    contentSelector: '[data-nav-content]',
    closeDelay: 200,
    heightCalculationDelay: 50,
    animationDuration: 250,
    panelOffset: 8,
    viewportPadding: 8,
    onOpen: () => {},
    onClose: () => {},
    onContentChange: () => {}
  }
  init() {
    this.setupStructure();
    this.setupEvents();
    this.setupInitialState();
    this.element.classList.add('navigation-menu-initialized');
    this.emit('init');
  }
  setupStructure() {
    this.panel.setAttribute('role', 'menu');
    this.panel.setAttribute('aria-hidden', 'true');
  }
  setupEvents() {
    this.triggers.forEach((trigger, i) => {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('data-nav-index', String(i));
      trigger.setAttribute('role', 'menuitem');
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.addEventListener('mouseenter', () => this.open(i));
    });
    this.links.forEach(link => {
      link.addEventListener('mouseenter', () => {
        if (this.activeIndex !== -1) this.close();
      });
    });
    this.element.addEventListener('mouseenter', this._boundHandlers.rootEnter);
    this.element.addEventListener('mouseleave', this._boundHandlers.rootLeave);
    document.addEventListener('click', this._boundHandlers.outsideClick);
    document.addEventListener('keydown', this._boundHandlers.keydown);
    window.addEventListener('resize', this._boundHandlers.resize);
    window.addEventListener('scroll', this._boundHandlers.scroll, true);
  }
  setupInitialState() {
    this.contents.forEach(content => {
      content.setAttribute('data-state', 'inactive');
      content.setAttribute('role', 'menu');
    });
  }
  _handleRootEnter() {
    clearTimeout(this.closeTimer);
  }
  _handleRootLeave() {
    this.closeTimer = setTimeout(() => this.close(), this.options.closeDelay);
  }
  _handleOutsideClick(e) {
    if (this.activeIndex !== -1 && !this.element.contains(e.target)) {
      this.close();
    }
  }
  _handleKeydown(e) {
    if (document.activeElement && this.triggers.includes(document.activeElement)) {
      const idx = this.triggers.indexOf(document.activeElement);
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = (idx + 1) % this.triggers.length;
        this.triggers[next].focus();
        if (this.activeIndex !== -1) this.open(next);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = (idx - 1 + this.triggers.length) % this.triggers.length;
        this.triggers[prev].focus();
        if (this.activeIndex !== -1) this.open(prev);
      }
    }
    if (e.key === 'Escape') {
      this.close();
    }
  }
  _handleResize() {
    if (this.activeIndex !== -1) {
      this._positionPanel();
    }
  }
  _handleScroll() {
    if (this.activeIndex !== -1) {
      this._positionPanel();
    }
  }
  open(index) {
    if (index === this.activeIndex) return;
    clearTimeout(this.closeTimer);
    clearTimeout(this.heightTimer);
    const previousIndex = this.activeIndex;
    if (previousIndex !== -1 && previousIndex !== index) {
      const direction = index > previousIndex ? 'forward' : 'backward';
      const outgoingContent = this.contents[previousIndex];
      const incomingContent = this.contents[index];
      outgoingContent.setAttribute('data-motion', direction === 'forward' ? 'to-start' : 'to-end');
      incomingContent.setAttribute('data-motion', direction === 'forward' ? 'from-end' : 'from-start');
      setTimeout(() => {
        outgoingContent.removeAttribute('data-motion');
        incomingContent.removeAttribute('data-motion');
      }, this.options.animationDuration);
      this.options.onContentChange(index, previousIndex, direction);
      this.emit('content-change', { index, previousIndex, direction });
    }
    this.triggers.forEach((trigger, i) => {
      trigger.setAttribute('aria-expanded', i === index ? 'true' : 'false');
    });
    this.contents.forEach((content, i) => {
      content.setAttribute('data-state', i === index ? 'active' : 'inactive');
    });
    this.activeIndex = index;
    this.panel.setAttribute('data-state', 'open');
    this.panel.setAttribute('aria-hidden', 'false');
    this._deferredPositionPanel();
    this.options.onOpen(index, this.contents[index]);
    this.emit('open', { index, content: this.contents[index] });
  }
  close() {
    if (this.activeIndex === -1) return;
    clearTimeout(this.heightTimer);
    const outgoingContent = this.contents[this.activeIndex];
    const previousIndex = this.activeIndex;
    if (outgoingContent) {
      outgoingContent.setAttribute('data-motion', 'to-panel');
    }
    this.triggers.forEach(trigger => trigger.setAttribute('aria-expanded', 'false'));
    this.contents.forEach(content => content.setAttribute('data-state', 'inactive'));
    this.activeIndex = -1;
    this.panel.setAttribute('data-state', 'closed');
    this.panel.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      if (this.activeIndex === -1 && outgoingContent) {
        outgoingContent.removeAttribute('data-motion');
      }
    }, this.options.animationDuration);
    this.options.onClose(previousIndex);
    this.emit('close', { previousIndex });
  }
  _deferredPositionPanel() {
    clearTimeout(this.heightTimer);
    this._calculatePosition();
    this.heightTimer = setTimeout(() => {
      this._calculateHeight();
    }, this.options.heightCalculationDelay);
  }
  _positionPanel() {
    this._calculatePosition();
    this._calculateHeight();
  }
  _calculatePosition() {
    const activeTrigger = this.triggers[this.activeIndex];
    if (!activeTrigger) return;
    const triggerRect = activeTrigger.getBoundingClientRect();
    const panelWidth = this.panel.offsetWidth;
    const top = triggerRect.bottom + this.options.panelOffset;
    let left = triggerRect.left;
    if (left + panelWidth > window.innerWidth - this.options.viewportPadding) {
      left = window.innerWidth - panelWidth - this.options.viewportPadding;
    }
    left = Math.max(this.options.viewportPadding, left);
    this.panel.style.top = `${top}px`;
    this.panel.style.left = `${left}px`;
  }
  _calculateHeight() {
    const activeContent = this.contents[this.activeIndex];
    if (!activeContent) return;
    activeContent.offsetHeight;
    const newHeight = activeContent.scrollHeight;
    this.panel.style.height = `${newHeight}px`;
  }
  openPanel(index) {
    if (index >= 0 && index < this.triggers.length) {
      this.open(index);
    }
  }
  closePanel() {
    this.close();
  }
  getActiveIndex() {
    return this.activeIndex;
  }
  isOpen() {
    return this.activeIndex !== -1;
  }
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`navigation-menu:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }
  destroy() {
    clearTimeout(this.closeTimer);
    clearTimeout(this.heightTimer);
    if (this.isOpen()) {
      this.close();
    }
    this.element.removeEventListener('mouseenter', this._boundHandlers.rootEnter);
    this.element.removeEventListener('mouseleave', this._boundHandlers.rootLeave);
    document.removeEventListener('click', this._boundHandlers.outsideClick);
    document.removeEventListener('keydown', this._boundHandlers.keydown);
    window.removeEventListener('resize', this._boundHandlers.resize);
    window.removeEventListener('scroll', this._boundHandlers.scroll, true);
    this.element.classList.remove('navigation-menu-initialized');
    delete this.element.navigationMenu;
    this.emit('destroy');
  }
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.navmenu:not(.navigation-menu-initialized)').forEach(el => {
    new NavigationMenu(el);
  });
});
class Pagination {
  constructor(paginationElement, options = {}) {
    if (!paginationElement || paginationElement.pagination) return;
    this.element = paginationElement;
    this.id = paginationElement.id || `pagination-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };
    this.totalPages = parseInt(this.element.dataset.totalPages, 10) || this.options.totalPages;
    this.currentPage = parseInt(this.element.dataset.currentPage, 10) || this.options.currentPage;
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
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`pagination:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }
  destroy() {
    this.element.removeEventListener('click', this._boundHandlers.click);
    this.element.classList.remove('pagination-initialized');
    delete this.element.pagination;
    this.emit('destroy');
  }
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.js-pagination:not(.pagination-initialized)').forEach(el => {
    new Pagination(el);
  });
});
class PopoverBehavior {
  constructor(element, options = {}) {
    if (!element || element.popoverBehavior) return;
    this.element = element;
    this.options = { ...this.defaults, ...options };
    this.content = this._findContent();
    if (!this.content) {
      console.warn('Popover behavior: No content element found for', element);
      return;
    }
    this.isOpen = false;
    this.originalParent = this.content.parentElement;
    this._boundHandlers = {
      trigger: (e) => this._handleTrigger(e),
      outsideClick: (e) => this._handleOutsideClick(e),
      keydown: (e) => this._handleKeydown(e)
    };
    this.init();
    this.element.popoverBehavior = this;
  }
  defaults = {
    portal: true,
    keyboard: true,
    closeOnOutsideClick: true,
    trigger: 'click' 
  }
  init() {
    this.setupAccessibility();
    this.setupEvents();
    this.setupInitialState();
    this._applyClassBasedSettings();
    this.element.classList.add('has-popover');
    this.emit('init');
  }
  _findContent() {
    const contentId = this.element.getAttribute('data-popover-content');
    if (contentId) {
      return document.getElementById(contentId);
    }
    let sibling = this.element.nextElementSibling;
    while (sibling) {
      if (sibling.classList.contains('popover-content')) {
        return sibling;
      }
      sibling = sibling.nextElementSibling;
    }
    return this.element.querySelector('.popover-content');
  }
  _applyClassBasedSettings() {
    if (this.element.classList.contains('popover-no-portal')) {
      this.options.portal = false;
    }
    if (this.element.classList.contains('popover-no-keyboard')) {
      this.options.keyboard = false;
    }
    if (this.element.classList.contains('popover-no-outside-click')) {
      this.options.closeOnOutsideClick = false;
    }
    if (this.element.classList.contains('popover-hover')) {
      this.options.trigger = 'hover';
    }
    if (this.element.classList.contains('popover-focus')) {
      this.options.trigger = 'focus';
    }
  }
  setupAccessibility() {
    const contentId = this.content.id || `popover-${Math.random().toString(36).substr(2, 9)}-content`;
    this.content.id = contentId;
    this.element.setAttribute('aria-haspopup', 'dialog');
    this.element.setAttribute('aria-expanded', 'false');
    this.element.setAttribute('aria-controls', contentId);
    this.content.setAttribute('role', 'dialog');
  }
  setupEvents() {
    switch (this.options.trigger) {
      case 'hover':
        this.element.addEventListener('mouseenter', this._boundHandlers.trigger);
        this.element.addEventListener('mouseleave', () => this.close());
        this.content.addEventListener('mouseenter', () => clearTimeout(this._hideTimer));
        this.content.addEventListener('mouseleave', () => this.close());
        break;
      case 'focus':
        this.element.addEventListener('focus', this._boundHandlers.trigger);
        this.element.addEventListener('blur', () => this.close());
        break;
      case 'click':
      default:
        this.element.addEventListener('click', this._boundHandlers.trigger);
        break;
    }
  }
  setupInitialState() {
    this.content.classList.add('popover-closed', 'popover-hidden');
  }
  _handleTrigger(e) {
    if (this.options.trigger === 'click') {
      e.stopPropagation();
    }
    this.toggle();
  }
  _handleOutsideClick(e) {
    if (!this.options.closeOnOutsideClick) return;
    if (!this.content.contains(e.target) && !this.element.contains(e.target)) {
      this.close();
    }
  }
  _handleKeydown(e) {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
      this.element.focus();
    }
  }
  open() {
    if (this.isOpen) return;
    PopoverBehavior._closeAll();
    this.isOpen = true;
    if (this.options.portal) {
      document.body.appendChild(this.content);
    }
    this.content.classList.remove('popover-closed', 'popover-hidden');
    this.content.classList.add('popover-open', 'popover-visible');
    this.element.setAttribute('aria-expanded', 'true');
    this._addGlobalListeners();
    this.emit('open');
  }
  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.content.classList.remove('popover-open', 'popover-visible');
    this.content.classList.add('popover-closed', 'popover-hidden');
    this.element.setAttribute('aria-expanded', 'false');
    this._removeGlobalListeners();
    if (this.options.portal) {
      setTimeout(() => {
        if (this.content.parentElement === document.body) {
          this.originalParent.appendChild(this.content);
        }
      }, 150);
    }
    this.emit('close');
  }
  toggle() {
    this.isOpen ? this.close() : this.open();
  }
  static _closeAll() {
    const elements = document.querySelectorAll('.has-popover');
    for (const el of elements) {
      if (el.popoverBehavior?.isOpen) {
        el.popoverBehavior.close();
      }
    }
  }
  _addGlobalListeners() {
    setTimeout(() => {
      if (this.options.closeOnOutsideClick) {
        document.addEventListener('click', this._boundHandlers.outsideClick, true);
      }
      if (this.options.keyboard) {
        document.addEventListener('keydown', this._boundHandlers.keydown);
      }
    }, 0);
  }
  _removeGlobalListeners() {
    document.removeEventListener('click', this._boundHandlers.outsideClick, true);
    document.removeEventListener('keydown', this._boundHandlers.keydown);
  }
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`popover:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }
  destroy() {
    if (this.isOpen) this.close();
    this.element.removeEventListener('click', this._boundHandlers.trigger);
    this.element.removeEventListener('mouseenter', this._boundHandlers.trigger);
    this.element.removeEventListener('focus', this._boundHandlers.trigger);
    this._removeGlobalListeners();
    this.element.classList.remove('has-popover');
    delete this.element.popoverBehavior;
    this.emit('destroy');
  }
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-popover], .has-popover').forEach(el => {
    if (!el.popoverBehavior) {
      new PopoverBehavior(el);
    }
  });
});
class Progress {
  constructor(progressElement, options = {}) {
    if (!progressElement || progressElement.progress) return;
    this.element = progressElement;
    this.id = progressElement.id || `progress-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };
    this.indicator = this.element.querySelector('.progress-indicator');
    if (!this.indicator) {
      console.error('Progress missing required element: .progress-indicator', this.element);
      return;
    }
    this.value = parseFloat(this.element.getAttribute('data-value')) || this.options.initialValue;
    this.init();
    this.element.progress = this;
  }
  defaults = {
    initialValue: 0,
    min: 0,
    max: 100,
    onValueChange: () => {}
  }
  init() {
    this.setupStructure();
    this.update(this.value);
    this.element.classList.add('progress-initialized');
    this.emit('init');
  }
  setupStructure() {
    this.element.setAttribute('role', 'progressbar');
    this.element.setAttribute('aria-valuemin', this.options.min);
    this.element.setAttribute('aria-valuemax', this.options.max);
  }
  update(newValue) {
    const value = Math.max(this.options.min, Math.min(this.options.max, parseFloat(newValue)));
    const previousValue = this.value;
    this.value = value;
    this.element.setAttribute('aria-valuenow', value);
    this.element.setAttribute('data-value', value);
    if (this.indicator) {
      const percentage = ((value - this.options.min) / (this.options.max - this.options.min)) * 100;
      this.indicator.style.transform = `translateX(-${100 - percentage}%)`;
    }
    if (value !== previousValue) {
      this.options.onValueChange(value, previousValue);
      this.emit('value-change', { value, previousValue });
    }
  }
  setValue(value) {
    this.update(value);
  }
  getValue() {
    return this.value;
  }
  getPercentage() {
    return ((this.value - this.options.min) / (this.options.max - this.options.min)) * 100;
  }
  increment(amount = 1) {
    this.update(this.value + amount);
  }
  decrement(amount = 1) {
    this.update(this.value - amount);
  }
  reset() {
    this.update(this.options.initialValue);
  }
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`progress:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }
  destroy() {
    this.element.classList.remove('progress-initialized');
    delete this.element.progress;
    this.emit('destroy');
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const progressBars = {};
  document.querySelectorAll('.progress:not(.progress-initialized)').forEach((progressEl, i) => {
    const id = progressEl.id || `progress-${i}`;
    progressBars[id] = new Progress(progressEl);
  });
  window.AppProgress = progressBars;
});
class Resizable {
  constructor(resizableElement, options = {}) {
    if (!resizableElement || resizableElement.resizable) return;
    this.element = resizableElement;
    this.id = resizableElement.id || `resizable-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };
    this.handles = [];
    this.panels = [];
    this.orientation = this._getOrientationFromClasses();
    this.isDragging = false;
    this.isCornerDragging = false;
    this.dragState = null;
    this._boundHandlers = {
      mousedown: new Map(),
      mousemove: (e) => this._handleMouseMove(e),
      mouseup: () => this._handleMouseUp(),
      keydown: (e) => this._handleKeydown(e)
    };
    this.init();
    this.element.resizable = this;
  }
  defaults = {
    orientation: 'horizontal',
    minPanelSize: 50,
    keyboard: true,
    cornerResize: true,
    constrainDrag: true
  }
  init() {
    this.setupStructure();
    this.setupEvents();
    this.setupInitialState();
    this._applyClassBasedSettings();
    this.element.classList.add('resizable-initialized');
    this.emit('init', { 
      orientation: this.orientation,
      panels: this.panels.length,
      handles: this.handles.length
    });
  }
  _getOrientationFromClasses() {
    if (this.element.classList.contains('resizable-vertical')) return 'vertical';
    return 'horizontal'; 
  }
  setupStructure() {
    this.handles = Array.from(this.element.querySelectorAll(':scope > .resizable-handle'));
    this.panels = Array.from(this.element.querySelectorAll(':scope > .resizable-panel'));
    if (this.panels.length < 2) {
      console.warn('Resizable needs at least 2 panels to function properly');
      return;
    }
    if (this.handles.length !== this.panels.length - 1) {
      console.warn('Resizable should have exactly (panels - 1) handles');
    }
  }
  setupEvents() {
    this.handles.forEach((handle, index) => {
      const prevPanel = this.panels[index];
      const nextPanel = this.panels[index + 1];
      if (!prevPanel || !nextPanel) return;
      const boundMouseDown = (e) => this._handleMouseDown(e, handle, prevPanel, nextPanel);
      this._boundHandlers.mousedown.set(handle, boundMouseDown);
      handle.addEventListener('mousedown', boundMouseDown);
      if (this.options.cornerResize) {
        this._initCornerDetection(handle, prevPanel, nextPanel);
      }
      handle.setAttribute('role', 'separator');
      handle.setAttribute('aria-orientation', this.orientation);
      handle.setAttribute('tabindex', '0');
    });
    if (this.options.keyboard) {
      this.handles.forEach(handle => {
        handle.addEventListener('keydown', this._boundHandlers.keydown);
      });
    }
  }
  setupInitialState() {
    this.element.classList.add('resizable-root');
    if (this.orientation === 'vertical') {
      this.element.classList.add('resizable-vertical');
    } else {
      this.element.classList.add('resizable-horizontal');
    }
    this.panels.forEach(panel => {
      if (!panel.style.flexBasis) {
        panel.style.flexBasis = `${100 / this.panels.length}%`;
      }
    });
  }
  _applyClassBasedSettings() {
    if (this.element.classList.contains('resizable-no-corner')) {
      this.options.cornerResize = false;
    }
    if (this.element.classList.contains('resizable-no-keyboard')) {
      this.options.keyboard = false;
    }
    if (this.element.classList.contains('resizable-no-constrain')) {
      this.options.constrainDrag = false;
    }
    this.orientation = this._getOrientationFromClasses();
  }
  _handleMouseDown(e, handle, prevPanel, nextPanel) {
    e.preventDefault();
    let cornerTarget = null;
    if (this.options.cornerResize && this.orientation === 'horizontal') {
      cornerTarget = this._findCornerTarget(e, prevPanel, nextPanel);
    }
    if (cornerTarget) {
      this._startCornerDrag(e, prevPanel, nextPanel, cornerTarget);
    } else {
      this._startDrag(e, handle, prevPanel, nextPanel);
    }
  }
  _findCornerTarget(e, prevPanel, nextPanel) {
    const verticalHandles = [
      ...prevPanel.querySelectorAll('.resizable-vertical .resizable-handle'),
      ...nextPanel.querySelectorAll('.resizable-vertical .resizable-handle')
    ];
    for (const vHandle of verticalHandles) {
      if (this._isMouseEventOnCorner(e, vHandle)) {
        return vHandle;
      }
    }
    return null;
  }
  _initCornerDetection(handle, prevPanel, nextPanel) {
    if (this.orientation !== 'horizontal') return;
    const verticalHandles = [
      ...prevPanel.querySelectorAll('.resizable-vertical .resizable-handle'),
      ...nextPanel.querySelectorAll('.resizable-vertical .resizable-handle')
    ];
    if (verticalHandles.length === 0) return;
    handle.addEventListener('mousemove', (e) => {
      let isOverAnyCorner = false;
      for (const vHandle of verticalHandles) {
        if (this._isMouseEventOnCorner(e, vHandle)) {
          isOverAnyCorner = true;
          break;
        }
      }
      handle.style.cursor = isOverAnyCorner ? 'all-scroll' : (this.orientation === 'horizontal' ? 'ew-resize' : 'ns-resize');
    });
    handle.addEventListener('mouseleave', () => {
      handle.style.cursor = this.orientation === 'horizontal' ? 'ew-resize' : 'ns-resize';
    });
  }
  _isMouseEventOnCorner(event, verticalHandle) {
    const vRect = verticalHandle.getBoundingClientRect();
    const hitArea = 4;
    return event.clientY >= vRect.top - hitArea && event.clientY <= vRect.bottom + hitArea;
  }
  _startDrag(e, handle, prevPanel, nextPanel) {
    this.isDragging = true;
    const isHorizontal = this.orientation === 'horizontal';
    this.dragState = {
      handle,
      prevPanel,
      nextPanel,
      startPos: isHorizontal ? e.clientX : e.clientY,
      prevSize: isHorizontal ? prevPanel.offsetWidth : prevPanel.offsetHeight,
      nextSize: isHorizontal ? nextPanel.offsetWidth : nextPanel.offsetHeight,
      isHorizontal
    };
    handle.classList.add('resizable-handle-dragging');
    document.body.style.cursor = isHorizontal ? 'ew-resize' : 'ns-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', this._boundHandlers.mousemove);
    document.addEventListener('mouseup', this._boundHandlers.mouseup);
    this.emit('drag-start', { 
      handle, 
      prevPanel, 
      nextPanel, 
      orientation: this.orientation 
    });
  }
  _startCornerDrag(e, leftPanel, rightPanel, verticalHandle) {
    this.isCornerDragging = true;
    const topPanel = verticalHandle.previousElementSibling;
    const bottomPanel = verticalHandle.nextElementSibling;
    if (!topPanel || !bottomPanel) return;
    this.dragState = {
      leftPanel,
      rightPanel,
      topPanel,
      bottomPanel,
      verticalHandle,
      startX: e.clientX,
      startY: e.clientY,
      leftStartWidth: leftPanel.offsetWidth,
      rightStartWidth: rightPanel.offsetWidth,
      topStartHeight: topPanel.offsetHeight,
      bottomStartHeight: bottomPanel.offsetHeight
    };
    document.body.style.cursor = 'all-scroll';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', this._boundHandlers.mousemove);
    document.addEventListener('mouseup', this._boundHandlers.mouseup);
    this.emit('corner-drag-start', { 
      leftPanel, 
      rightPanel, 
      topPanel, 
      bottomPanel 
    });
  }
  _handleMouseMove(e) {
    if (!this.isDragging && !this.isCornerDragging) return;
    e.preventDefault();
    if (this.isCornerDragging) {
      this._updateCornerDrag(e);
    } else {
      this._updateDrag(e);
    }
  }
  _updateDrag(e) {
    const { startPos, prevSize, nextSize, prevPanel, nextPanel, isHorizontal } = this.dragState;
    const currentPos = isHorizontal ? e.clientX : e.clientY;
    const delta = currentPos - startPos;
    let newPrevSize = prevSize + delta;
    let newNextSize = nextSize - delta;
    if (this.options.constrainDrag) {
      const minSize = this.options.minPanelSize;
      if (newPrevSize < minSize) {
        newNextSize += newPrevSize - minSize;
        newPrevSize = minSize;
      }
      if (newNextSize < minSize) {
        newPrevSize += newNextSize - minSize;
        newNextSize = minSize;
      }
    }
    prevPanel.style.flexBasis = `${Math.max(0, newPrevSize)}px`;
    nextPanel.style.flexBasis = `${Math.max(0, newNextSize)}px`;
    this.emit('drag', { 
      prevSize: newPrevSize, 
      nextSize: newNextSize, 
      delta 
    });
  }
  _updateCornerDrag(e) {
    const {
      leftPanel, rightPanel, topPanel, bottomPanel,
      startX, startY, leftStartWidth, rightStartWidth,
      topStartHeight, bottomStartHeight
    } = this.dragState;
    const deltaX = e.clientX - startX;
    let newLeftWidth = leftStartWidth + deltaX;
    let newRightWidth = rightStartWidth - deltaX;
    if (this.options.constrainDrag) {
      const minSize = this.options.minPanelSize;
      if (newLeftWidth < minSize) {
        newRightWidth += newLeftWidth - minSize;
        newLeftWidth = minSize;
      }
      if (newRightWidth < minSize) {
        newLeftWidth += newRightWidth - minSize;
        newRightWidth = minSize;
      }
    }
    leftPanel.style.flexBasis = `${Math.max(0, newLeftWidth)}px`;
    rightPanel.style.flexBasis = `${Math.max(0, newRightWidth)}px`;
    const deltaY = e.clientY - startY;
    let newTopHeight = topStartHeight + deltaY;
    let newBottomHeight = bottomStartHeight - deltaY;
    if (this.options.constrainDrag) {
      const minSize = this.options.minPanelSize;
      if (newTopHeight < minSize) {
        newBottomHeight += newTopHeight - minSize;
        newTopHeight = minSize;
      }
      if (newBottomHeight < minSize) {
        newTopHeight += newBottomHeight - minSize;
        newBottomHeight = minSize;
      }
    }
    topPanel.style.flexBasis = `${Math.max(0, newTopHeight)}px`;
    bottomPanel.style.flexBasis = `${Math.max(0, newBottomHeight)}px`;
    this.emit('corner-drag', { 
      deltaX, 
      deltaY, 
      leftWidth: newLeftWidth, 
      rightWidth: newRightWidth,
      topHeight: newTopHeight, 
      bottomHeight: newBottomHeight 
    });
  }
  _handleMouseUp() {
    if (!this.isDragging && !this.isCornerDragging) return;
    if (this.isDragging) {
      this.dragState.handle?.classList.remove('resizable-handle-dragging');
      this.emit('drag-end', this.dragState);
    }
    if (this.isCornerDragging) {
      this.emit('corner-drag-end', this.dragState);
    }
    this.isDragging = false;
    this.isCornerDragging = false;
    this.dragState = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', this._boundHandlers.mousemove);
    document.removeEventListener('mouseup', this._boundHandlers.mouseup);
  }
  _handleKeydown(e) {
    const handle = e.target;
    const index = this.handles.indexOf(handle);
    if (index === -1) return;
    const prevPanel = this.panels[index];
    const nextPanel = this.panels[index + 1];
    if (!prevPanel || !nextPanel) return;
    let handled = false;
    const step = 10; 
    const isHorizontal = this.orientation === 'horizontal';
    switch (e.key) {
      case 'ArrowLeft':
        if (isHorizontal) {
          this._adjustPanelSizes(prevPanel, nextPanel, -step);
          handled = true;
        }
        break;
      case 'ArrowRight':
        if (isHorizontal) {
          this._adjustPanelSizes(prevPanel, nextPanel, step);
          handled = true;
        }
        break;
      case 'ArrowUp':
        if (!isHorizontal) {
          this._adjustPanelSizes(prevPanel, nextPanel, -step);
          handled = true;
        }
        break;
      case 'ArrowDown':
        if (!isHorizontal) {
          this._adjustPanelSizes(prevPanel, nextPanel, step);
          handled = true;
        }
        break;
      case 'Home':
        this._adjustPanelSizes(prevPanel, nextPanel, -999999);
        handled = true;
        break;
      case 'End':
        this._adjustPanelSizes(prevPanel, nextPanel, 999999);
        handled = true;
        break;
    }
    if (handled) {
      e.preventDefault();
      this.emit('keyboard-resize', { 
        key: e.key, 
        prevPanel, 
        nextPanel, 
        step 
      });
    }
  }
  _adjustPanelSizes(prevPanel, nextPanel, delta) {
    const isHorizontal = this.orientation === 'horizontal';
    const prevSize = isHorizontal ? prevPanel.offsetWidth : prevPanel.offsetHeight;
    const nextSize = isHorizontal ? nextPanel.offsetWidth : nextPanel.offsetHeight;
    let newPrevSize = prevSize + delta;
    let newNextSize = nextSize - delta;
    if (this.options.constrainDrag) {
      const minSize = this.options.minPanelSize;
      if (newPrevSize < minSize) {
        newNextSize += newPrevSize - minSize;
        newPrevSize = minSize;
      }
      if (newNextSize < minSize) {
        newPrevSize += newNextSize - minSize;
        newNextSize = minSize;
      }
    }
    prevPanel.style.flexBasis = `${Math.max(0, newPrevSize)}px`;
    nextPanel.style.flexBasis = `${Math.max(0, newNextSize)}px`;
  }
  setOrientation(orientation) {
    if (!['horizontal', 'vertical'].includes(orientation)) return;
    this.orientation = orientation;
    this.element.classList.remove('resizable-horizontal', 'resizable-vertical');
    this.element.classList.add(`resizable-${orientation}`);
    this.handles.forEach(handle => {
      handle.setAttribute('aria-orientation', orientation);
    });
    this.emit('orientation-change', { orientation });
  }
  getPanelSizes() {
    return this.panels.map((panel, index) => {
      const isHorizontal = this.orientation === 'horizontal';
      return {
        index,
        size: isHorizontal ? panel.offsetWidth : panel.offsetHeight,
        flexBasis: panel.style.flexBasis
      };
    });
  }
  setPanelSize(panelIndex, size) {
    const panel = this.panels[panelIndex];
    if (!panel) return;
    panel.style.flexBasis = typeof size === 'number' ? `${size}px` : size;
    this.emit('panel-resize', { panelIndex, size });
  }
  resetPanelSizes() {
    const equalSize = `${100 / this.panels.length}%`;
    this.panels.forEach(panel => {
      panel.style.flexBasis = equalSize;
    });
    this.emit('reset');
  }
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`resizable:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }
  destroy() {
    if (this.isDragging || this.isCornerDragging) {
      this._handleMouseUp();
    }
    this._boundHandlers.mousedown.forEach((handler, handle) => {
      handle.removeEventListener('mousedown', handler);
    });
    this.handles.forEach(handle => {
      handle.removeEventListener('keydown', this._boundHandlers.keydown);
    });
    document.removeEventListener('mousemove', this._boundHandlers.mousemove);
    document.removeEventListener('mouseup', this._boundHandlers.mouseup);
    this.element.classList.remove('resizable-initialized');
    delete this.element.resizable;
    this.emit('destroy');
  }
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.resizable-root:not(.resizable-initialized)').forEach(el => {
    el.resizable = new Resizable(el);
  });
});
class ScrollArea {
  constructor(scrollAreaElement, options = {}) {
    if (!scrollAreaElement || scrollAreaElement.scrollArea) return;
    this.element = scrollAreaElement;
    this.id = scrollAreaElement.id || `scroll-area-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };
    this.viewport = null;
    this.vScrollbar = null;
    this.hScrollbar = null;
    this.vThumb = null;
    this.hThumb = null;
    this.isDragging = false;
    this.dragAxis = null;
    this.dragOffset = 0;
    this.isVisible = { vertical: false, horizontal: false };
    this._boundHandlers = {
      scroll: () => this._handleScroll(),
      resize: () => this._handleResize(),
      mousemove: (e) => this._handleMouseMove(e),
      mouseup: () => this._handleMouseUp(),
      vThumbMouseDown: (e) => this._handleThumbMouseDown(e, 'vertical'),
      hThumbMouseDown: (e) => this._handleThumbMouseDown(e, 'horizontal')
    };
    this.init();
    this.element.scrollArea = this;
  }
  defaults = {
    showScrollbars: 'hover', 
    hideDelay: 1000,
    thumbMinSize: 20,
    trackSize: 10,
    thumbSize: 6,
    smooth: true
  }
  init() {
    this.setupStructure();
    this.setupEvents();
    this.setupInitialState();
    this._applyClassBasedSettings();
    this.element.classList.add('scroll-area-initialized');
    this.emit('init', { 
      hasVerticalScroll: this._needsScrollbar('vertical'),
      hasHorizontalScroll: this._needsScrollbar('horizontal')
    });
  }
  setupStructure() {
    if (this.element.querySelector('.scroll-area-viewport')) {
      this._cacheElements();
      return;
    }
    const contentWrapper = document.createElement('div');
    const viewport = document.createElement('div');
    viewport.className = 'scroll-area-viewport';
    viewport.appendChild(contentWrapper);
    while (this.element.firstChild) {
      contentWrapper.appendChild(this.element.firstChild);
    }
    this.element.appendChild(viewport);
    this.element.insertAdjacentHTML('beforeend', `
      <div class="scroll-area-scrollbar scroll-area-scrollbar-vertical">
        <div class="scroll-area-thumb"></div>
      </div>
      <div class="scroll-area-scrollbar scroll-area-scrollbar-horizontal">
        <div class="scroll-area-thumb"></div>
      </div>
    `);
    this._cacheElements();
  }
  _cacheElements() {
    this.viewport = this.element.querySelector('.scroll-area-viewport');
    this.vScrollbar = this.element.querySelector('.scroll-area-scrollbar-vertical');
    this.hScrollbar = this.element.querySelector('.scroll-area-scrollbar-horizontal');
    this.vThumb = this.vScrollbar?.querySelector('.scroll-area-thumb');
    this.hThumb = this.hScrollbar?.querySelector('.scroll-area-thumb');
  }
  setupEvents() {
    this.viewport.addEventListener('scroll', this._boundHandlers.scroll);
    window.addEventListener('resize', this._boundHandlers.resize);
    if (this.vThumb) {
      this.vThumb.addEventListener('mousedown', this._boundHandlers.vThumbMouseDown);
    }
    if (this.hThumb) {
      this.hThumb.addEventListener('mousedown', this._boundHandlers.hThumbMouseDown);
    }
    document.addEventListener('mousemove', this._boundHandlers.mousemove);
    document.addEventListener('mouseup', this._boundHandlers.mouseup);
  }
  setupInitialState() {
    this.element.classList.add('scroll-area');
    this.update();
  }
  _applyClassBasedSettings() {
    if (this.element.classList.contains('scroll-area-always-show')) {
      this.options.showScrollbars = 'always';
    } else if (this.element.classList.contains('scroll-area-auto-hide')) {
      this.options.showScrollbars = 'auto';
    }
    if (this.element.classList.contains('scroll-area-no-smooth')) {
      this.options.smooth = false;
    }
    if (this.options.smooth) {
      this.viewport.style.scrollBehavior = 'smooth';
    }
    this._updateScrollbarVisibility();
  }
  _handleScroll() {
    this.update();
    this.emit('scroll', {
      scrollTop: this.viewport.scrollTop,
      scrollLeft: this.viewport.scrollLeft,
      scrollHeight: this.viewport.scrollHeight,
      scrollWidth: this.viewport.scrollWidth
    });
  }
  _handleResize() {
    this.update();
    this.emit('resize');
  }
  _handleThumbMouseDown(e, axis) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = true;
    this.dragAxis = axis;
    document.body.style.userSelect = 'none';
    const thumb = axis === 'vertical' ? this.vThumb : this.hThumb;
    const scrollbar = axis === 'vertical' ? this.vScrollbar : this.hScrollbar;
    thumb.classList.add('scroll-area-thumb-dragging');
    scrollbar.classList.add('scroll-area-scrollbar-dragging');
    const rect = thumb.getBoundingClientRect();
    this.dragOffset = axis === 'vertical' ? e.clientY - rect.top : e.clientX - rect.left;
    this.emit('drag-start', { axis });
  }
  _handleMouseMove(e) {
    if (!this.isDragging) return;
    e.preventDefault();
    const isVertical = this.dragAxis === 'vertical';
    const scrollbar = isVertical ? this.vScrollbar : this.hScrollbar;
    const trackRect = scrollbar.getBoundingClientRect();
    const thumb = isVertical ? this.vThumb : this.hThumb;
    const thumbLength = isVertical ? thumb.offsetHeight : thumb.offsetWidth;
    const maxThumbPos = (isVertical ? trackRect.height : trackRect.width) - thumbLength;
    const mousePos = isVertical ? e.clientY - trackRect.top : e.clientX - trackRect.left;
    const thumbPos = Math.max(0, Math.min(mousePos - this.dragOffset, maxThumbPos));
    const scrollRatio = maxThumbPos > 0 ? thumbPos / maxThumbPos : 0;
    const maxScroll = (isVertical ? this.viewport.scrollHeight : this.viewport.scrollWidth) - 
                     (isVertical ? this.viewport.clientHeight : this.viewport.clientWidth);
    this.viewport[isVertical ? 'scrollTop' : 'scrollLeft'] = scrollRatio * maxScroll;
    this.emit('drag', { axis: this.dragAxis, ratio: scrollRatio });
  }
  _handleMouseUp() {
    if (!this.isDragging) return;
    this.isDragging = false;
    document.body.style.userSelect = '';
    this.vThumb?.classList.remove('scroll-area-thumb-dragging');
    this.hThumb?.classList.remove('scroll-area-thumb-dragging');
    this.vScrollbar?.classList.remove('scroll-area-scrollbar-dragging');
    this.hScrollbar?.classList.remove('scroll-area-scrollbar-dragging');
    this.emit('drag-end', { axis: this.dragAxis });
    this.dragAxis = null;
  }
  update() {
    if (!this.viewport) return;
    requestAnimationFrame(() => {
      this._updateScrollbar('vertical');
      this._updateScrollbar('horizontal');
      this._updateScrollbarVisibility();
    });
  }
  _updateScrollbar(axis) {
    const isVertical = axis === 'vertical';
    const scrollbar = isVertical ? this.vScrollbar : this.hScrollbar;
    const thumb = isVertical ? this.vThumb : this.hThumb;
    if (!scrollbar || !thumb) return;
    const scrollSize = isVertical ? this.viewport.scrollHeight : this.viewport.scrollWidth;
    const clientSize = isVertical ? this.viewport.clientHeight : this.viewport.clientWidth;
    const needsScrollbar = scrollSize > clientSize;
    this.isVisible[axis] = needsScrollbar;
    if (!needsScrollbar) {
      scrollbar.classList.add('scroll-area-scrollbar-hidden');
      return;
    }
    scrollbar.classList.remove('scroll-area-scrollbar-hidden');
    const trackLength = isVertical ? scrollbar.clientHeight : scrollbar.clientWidth;
    const thumbLength = Math.max(this.options.thumbMinSize, (clientSize / scrollSize) * trackLength);
    const scrollPos = isVertical ? this.viewport.scrollTop : this.viewport.scrollLeft;
    const maxScroll = scrollSize - clientSize;
    const thumbPos = maxScroll > 0 ? (scrollPos / maxScroll) * (trackLength - thumbLength) : 0;
    thumb.style[isVertical ? 'height' : 'width'] = `${thumbLength}px`;
    thumb.style.transform = isVertical ? `translateY(${thumbPos}px)` : `translateX(${thumbPos}px)`;
  }
  _updateScrollbarVisibility() {
    const vNeedsScrollbar = this._needsScrollbar('vertical');
    const hNeedsScrollbar = this._needsScrollbar('horizontal');
    switch (this.options.showScrollbars) {
      case 'always':
        this.vScrollbar?.classList.toggle('scroll-area-scrollbar-always', vNeedsScrollbar);
        this.hScrollbar?.classList.toggle('scroll-area-scrollbar-always', hNeedsScrollbar);
        break;
      case 'auto':
        this._autoHideScrollbars();
        break;
      case 'hover':
      default:
        break;
    }
  }
  _needsScrollbar(axis) {
    if (!this.viewport) return false;
    const isVertical = axis === 'vertical';
    const scrollSize = isVertical ? this.viewport.scrollHeight : this.viewport.scrollWidth;
    const clientSize = isVertical ? this.viewport.clientHeight : this.viewport.clientWidth;
    return scrollSize > clientSize;
  }
  _autoHideScrollbars() {
    clearTimeout(this._hideTimer);
    this.vScrollbar?.classList.add('scroll-area-scrollbar-auto');
    this.hScrollbar?.classList.add('scroll-area-scrollbar-auto');
    this._hideTimer = setTimeout(() => {
      this.vScrollbar?.classList.remove('scroll-area-scrollbar-auto');
      this.hScrollbar?.classList.remove('scroll-area-scrollbar-auto');
    }, this.options.hideDelay);
  }
  scrollTo(options) {
    if (typeof options === 'number') {
      this.viewport.scrollTo({ top: options, behavior: this.options.smooth ? 'smooth' : 'auto' });
    } else {
      this.viewport.scrollTo({
        behavior: this.options.smooth ? 'smooth' : 'auto',
        ...options
      });
    }
    this.emit('scroll-to', options);
  }
  scrollToTop() {
    this.scrollTo({ top: 0 });
  }
  scrollToBottom() {
    this.scrollTo({ top: this.viewport.scrollHeight });
  }
  scrollToLeft() {
    this.scrollTo({ left: 0 });
  }
  scrollToRight() {
    this.scrollTo({ left: this.viewport.scrollWidth });
  }
  getScrollPosition() {
    return {
      top: this.viewport.scrollTop,
      left: this.viewport.scrollLeft,
      maxTop: this.viewport.scrollHeight - this.viewport.clientHeight,
      maxLeft: this.viewport.scrollWidth - this.viewport.clientWidth
    };
  }
  setScrollbarVisibility(mode) {
    this.options.showScrollbars = mode;
    this._updateScrollbarVisibility();
    this.emit('visibility-change', { mode });
  }
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`scroll-area:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }
  destroy() {
    clearTimeout(this._hideTimer);
    this.viewport?.removeEventListener('scroll', this._boundHandlers.scroll);
    window.removeEventListener('resize', this._boundHandlers.resize);
    this.vThumb?.removeEventListener('mousedown', this._boundHandlers.vThumbMouseDown);
    this.hThumb?.removeEventListener('mousedown', this._boundHandlers.hThumbMouseDown);
    document.removeEventListener('mousemove', this._boundHandlers.mousemove);
    document.removeEventListener('mouseup', this._boundHandlers.mouseup);
    this.element.classList.remove('scroll-area-initialized');
    delete this.element.scrollArea;
    this.emit('destroy');
  }
}
const scrollAreaGlobals = {
  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.autoInit.bind(this));
    } else {
      this.autoInit();
    }
  },
  autoInit() {
    document.querySelectorAll('.js-scroll-area:not(.scroll-area-initialized)').forEach(el => {
      el.scrollArea = new ScrollArea(el);
    });
    document.querySelectorAll('.scroll-area:not(.scroll-area-initialized)').forEach(el => {
      if (el.querySelector('.scroll-area-viewport')) {
        el.scrollArea = new ScrollArea(el);
      }
    });
  }
};
scrollAreaGlobals.init();
class Select {
  constructor(selectElement, options = {}) {
    if (!selectElement || selectElement.select) return;
    this.element = selectElement;
    this.id = selectElement.id || `select-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };
    this.trigger = this.element.querySelector('.select-trigger');
    this.content = this.element.querySelector('.select-content');
    this.valueEl = this.element.querySelector('.select-value');
    if (!this.trigger || !this.content || this.trigger.disabled) return;
    this.isOpen = false;
    this._items = null; 
    this._boundHandlers = {
      toggle: (e) => this._handleToggle(e),
      contentClick: (e) => this._handleContentClick(e),
      initialHover: () => this._handleInitialHover()
    };
    this.init();
    this.element.select = this;
  }
  defaults = {
    closeOnSelect: true,
    placeholder: 'Select an option...'
  }
  init() {
    this.setupAccessibility();
    this.setupEvents();
    this.setupInitialState();
    this.element.classList.add('select-initialized');
    this.emit('init', { totalOptions: this.items.length });
  }
  get items() {
    if (!this._items) {
      this._items = Array.from(this.content.querySelectorAll('.select-item'));
    }
    return this._items;
  }
  _clearItemsCache() {
    this._items = null;
  }
  setupAccessibility() {
    this.trigger.setAttribute('aria-haspopup', 'listbox');
    this.trigger.setAttribute('aria-expanded', 'false');
    this.content.setAttribute('role', 'listbox');
    this.items.forEach((item, index) => {
      const updates = {
        'role': 'option',
        'aria-selected': 'false'
      };
      if (!item.id) {
        updates.id = `${this.id}-option-${index}`;
      }
      Object.entries(updates).forEach(([attr, value]) => {
        item.setAttribute(attr, value);
      });
    });
  }
  setupEvents() {
    this.trigger.addEventListener('click', this._boundHandlers.toggle);
    this.content.addEventListener('click', this._boundHandlers.contentClick);
  }
  setupInitialState() {
    const selectedItem = this.content.querySelector('.select-item-selected');
    if (selectedItem) {
      this.selectItem(selectedItem, false);
    } else if (this.valueEl?.textContent?.trim() === '') {
      this.valueEl.classList.add('select-value-placeholder');
    }
  }
  _handleToggle(e) {
    e.stopPropagation();
    this.toggle();
  }
  _handleContentClick(e) {
    const item = e.target.closest('.select-item');
    if (!item) return;
    e.stopPropagation();
    this.selectItem(item);
    if (this.options.closeOnSelect) {
      this.close();
    }
  }
  _handleInitialHover() {
    this.content.classList.add('is-hovering');
  }
  selectItem(item, shouldEmit = true) {
    const textEl = item.querySelector('.select-item-text');
    if (!textEl) return;
    const newValue = textEl.textContent;
    if (this.valueEl.textContent === newValue) return;
    this.valueEl.textContent = newValue;
    this.valueEl.classList.remove('select-value-placeholder');
    const currentSelected = this.content.querySelector('.select-item-selected');
    if (currentSelected && currentSelected !== item) {
      currentSelected.classList.remove('select-item-selected');
      currentSelected.setAttribute('aria-selected', 'false');
    }
    item.classList.add('select-item-selected');
    item.setAttribute('aria-selected', 'true');
    if (shouldEmit) {
      this.emit('select', {
        item,
        value: newValue,
        index: this.items.indexOf(item)
      });
    }
  }
  open() {
    if (this.isOpen) return;
    Select._closeAllExcept(this.element);
    this.isOpen = true;
    this.trigger.setAttribute('aria-expanded', 'true');
    this.content.classList.add('select-content-open');
    this.content.classList.remove('is-hovering');
    this.content.addEventListener('mouseover', this._boundHandlers.initialHover, { once: true });
    this.emit('open');
  }
  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.trigger.setAttribute('aria-expanded', 'false');
    this.content.classList.remove('select-content-open', 'is-hovering');
    this.content.removeEventListener('mouseover', this._boundHandlers.initialHover);
    this.emit('close');
  }
  toggle() {
    this.isOpen ? this.close() : this.open();
  }
  static _closeAllExcept(exceptElement) {
    const openSelects = document.querySelectorAll('.select-initialized');
    for (const sel of openSelects) {
      if (sel !== exceptElement && sel.select?.isOpen) {
        sel.select.close();
      }
    }
  }
  getValue() {
    const selectedItem = this.content.querySelector('.select-item-selected');
    return selectedItem?.querySelector('.select-item-text')?.textContent || null;
  }
  setValue(value) {
    const targetItem = this.items.find(item => 
      item.querySelector('.select-item-text')?.textContent === value
    );
    if (targetItem) {
      this.selectItem(targetItem);
    }
  }
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`select:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }
  destroy() {
    this.trigger.removeEventListener('click', this._boundHandlers.toggle);
    this.content.removeEventListener('click', this._boundHandlers.contentClick);
    this.content.removeEventListener('mouseover', this._boundHandlers.initialHover);
    this.element.classList.remove('select-initialized');
    this._clearItemsCache();
    delete this.element.select;
    this.emit('destroy');
  }
}
const selectGlobals = {
  _clickHandler: null,
  init() {
    this._clickHandler = (e) => {
      if (!e.target.closest('.select')) {
        Select._closeAllExcept(null);
      }
    };
    document.addEventListener('click', this._clickHandler);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.autoInit);
    } else {
      this.autoInit();
    }
  },
  autoInit() {
    const selects = document.querySelectorAll('.select:not(.select-initialized)');
    for (const el of selects) {
      el.select = new Select(el);
    }
  }
};
selectGlobals.init();
class Sheet {
  constructor(sheetElement, options = {}) {
    if (!sheetElement || sheetElement.sheet) return;
    this.element = sheetElement;
    this.id = sheetElement.id || `sheet-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };
    this.isOpen = false;
    this.overlay = null;
    this.content = null;
    this.closeButtons = [];
    this._boundHandlers = {
      keydown: (e) => this._handleKeydown(e),
      close: () => this.close(),
      overlayClick: (e) => this._handleOverlayClick(e)
    };
    this.init();
    this.element.sheet = this;
  }
  defaults = {
    side: 'right',
    content: '',
    closeOnOverlayClick: true,
    closeOnEscape: true,
    lockBodyScroll: true,
    restoreFocus: true
  }
  init() {
    this._build();
    this.element.classList.add('sheet-initialized');
    this.emit('init');
  }
  _build() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'sheet-overlay';
    this.content = document.createElement('div');
    this.content.className = 'sheet-content';
    this.content.setAttribute('data-side', this.options.side);
    this.content.innerHTML = this.options.content;
    this.closeButtons = Array.from(this.content.querySelectorAll('[data-sheet-close]'));
    if (this.options.closeOnOverlayClick) {
      this.overlay.addEventListener('click', this._boundHandlers.overlayClick);
    }
    this.closeButtons.forEach(btn => {
      btn.addEventListener('click', this._boundHandlers.close);
    });
  }
  _handleOverlayClick(e) {
    if (e.target === this.overlay) {
      this.close();
    }
  }
  _handleKeydown(e) {
    if (e.key === 'Escape' && this.options.closeOnEscape) {
      this.close();
    }
  }
  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    if (this.options.restoreFocus) {
      this.lastActiveElement = document.activeElement;
    }
    document.body.appendChild(this.overlay);
    document.body.appendChild(this.content);
    if (this.options.lockBodyScroll) {
      document.body.style.overflow = 'hidden';
    }
    document.addEventListener('keydown', this._boundHandlers.keydown);
    requestAnimationFrame(() => {
      this.overlay.setAttribute('data-state', 'open');
      this.content.setAttribute('data-state', 'open');
    });
    const firstFocusable = this.content.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), 100);
    }
    this.emit('open');
  }
  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.overlay.setAttribute('data-state', 'closed');
    this.content.setAttribute('data-state', 'closed');
    if (this.options.lockBodyScroll) {
      document.body.style.overflow = '';
    }
    document.removeEventListener('keydown', this._boundHandlers.keydown);
    setTimeout(() => {
      if (this.overlay.parentNode) {
        this.overlay.remove();
      }
      if (this.content.parentNode) {
        this.content.remove();
      }
      if (this.options.restoreFocus && this.lastActiveElement) {
        this.lastActiveElement.focus();
        this.lastActiveElement = null;
      }
    }, 200); 
    this.emit('close');
  }
  toggle() {
    this.isOpen ? this.close() : this.open();
  }
  setSide(side) {
    this.options.side = side;
    this.content.setAttribute('data-side', side);
  }
  setContent(content) {
    this.options.content = content;
    this.content.innerHTML = content;
    this.closeButtons.forEach(btn => {
      btn.removeEventListener('click', this._boundHandlers.close);
    });
    this.closeButtons = Array.from(this.content.querySelectorAll('[data-sheet-close]'));
    this.closeButtons.forEach(btn => {
      btn.addEventListener('click', this._boundHandlers.close);
    });
  }
  getState() {
    return {
      isOpen: this.isOpen,
      side: this.options.side,
      options: { ...this.options }
    };
  }
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`sheet:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }
  destroy() {
    if (this.isOpen) {
      this.close();
    }
    if (this.overlay) {
      this.overlay.removeEventListener('click', this._boundHandlers.overlayClick);
    }
    this.closeButtons.forEach(btn => {
      btn.removeEventListener('click', this._boundHandlers.close);
    });
    this.element.classList.remove('sheet-initialized');
    delete this.element.sheet;
    this.emit('destroy');
  }
}
window.Sheet = Sheet;
class Sidebar {
  constructor(element, options = {}) {
    if (!element || element.sidebar) return;
    this.element = element;
    this.id = element.id || `sidebar-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };
    this.state = this.loadState();
    this.init();
    element.sidebar = this;
  }
  defaults = {
    breakpoint: 768,
    saveState: true,
    overlay: true
  }
  init() {
    this.provider = this.element.closest('.sidebar-provider');
    this.overlay = this.provider?.querySelector('.sidebar-overlay');
    this.applyState();
    this.element.classList.add('sidebar-initialized');
  }
  toggle() {
    const isMobile = window.innerWidth <= this.options.breakpoint;
    if (isMobile) {
      this.toggleMobile();
    } else {
      this.toggleDesktop();
    }
    this.emit('toggle', { state: this.state });
  }
  toggleMobile() {
    this.state = this.state === 'open' ? 'closed' : 'open';
    this.element.classList.toggle('open', this.state === 'open');
    this.overlay?.classList.toggle('open', this.state === 'open');
  }
  toggleDesktop() {
    this.state = this.state === 'collapsed' ? 'expanded' : 'collapsed';
    this.element.classList.toggle('collapsed', this.state === 'collapsed');
    if (this.options.saveState) {
      this.saveState();
    }
  }
  saveState() {
    if (!this.options.saveState) return;
    try {
      localStorage.setItem(`sidebar-${this.id}`, this.state);
    } catch (e) {
      console.warn('Could not save sidebar state');
    }
  }
  loadState() {
    if (!this.options.saveState) return 'expanded';
    try {
      return localStorage.getItem(`sidebar-${this.id}`) || 'expanded';
    } catch (e) {
      return 'expanded';
    }
  }
  applyState() {
    const isMobile = window.innerWidth <= this.options.breakpoint;
    if (isMobile) {
      this.element.classList.remove('collapsed');
      this.element.classList.toggle('open', this.state === 'open');
    } else {
      this.element.classList.remove('open');
      this.element.classList.toggle('collapsed', this.state === 'collapsed');
    }
  }
  emit(event, data) {
    this.element.dispatchEvent(new CustomEvent(`sidebar:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }
  destroy() {
    this.element.classList.remove('sidebar-initialized');
    delete this.element.sidebar;
  }
}
const sidebarGlobals = {
  resizeTimeout: null,
  init() {
    window.addEventListener('resize', this.handleResize.bind(this));
    document.addEventListener('click', this.handleClick.bind(this));
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.autoInit.bind(this));
    } else {
      this.autoInit();
    }
  },
  handleResize() {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      document.querySelectorAll('.sidebar-initialized').forEach(sidebar => {
        sidebar.sidebar?.applyState();
      });
    }, 100);
  },
  handleClick(e) {
    const trigger = e.target.closest('.sidebar-trigger');
    if (trigger) {
      const sidebarId = trigger.dataset.controls;
      const sidebar = sidebarId ? document.getElementById(sidebarId) : null;
      sidebar?.sidebar?.toggle();
      return;
    }
    if (e.target.classList.contains('sidebar-overlay')) {
      const provider = e.target.closest('.sidebar-provider');
      const openSidebar = provider?.querySelector('.sidebar.open');
      if (openSidebar?.sidebar) {
        openSidebar.sidebar.state = 'closed';
        openSidebar.sidebar.applyState();
      }
    }
  },
  autoInit() {
    document.querySelectorAll('.sidebar:not(.sidebar-initialized)').forEach(el => {
      new Sidebar(el);
    });
  }
};
sidebarGlobals.init();
class Slider {
  constructor(sliderElement) {
    if (sliderElement.dataset.initialized) return;
    this.slider = sliderElement;
    this.slider.dataset.initialized = 'true';
    this.input = this.slider.querySelector('.slider-input');
    this.track = this.slider.querySelector('.slider-track, .slider-track-vertical');
    this.range = this.slider.querySelector('.slider-range, .slider-range-vertical');
    this.thumb = this.slider.querySelector('.slider-thumb, .slider-thumb-vertical');
    if (!this.input || !this.track || !this.range || !this.thumb) return;
    this.isVertical = this.slider.classList.contains('vertical');
    this.valueDisplay = this.slider.parentElement.querySelector('.slider-value');
    this.bindEvents();
    this.update();
  }
  bindEvents() {
    this.input.addEventListener('input', this.update.bind(this));
    this.track.addEventListener('click', this.handleTrackClick.bind(this));
  }
  update() {
    const value = parseFloat(this.input.value);
    const min = parseFloat(this.input.min);
    const max = parseFloat(this.input.max);
    const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;
    if (this.isVertical) {
      this.range.style.height = `${percent}%`;
      this.thumb.style.bottom = `${percent}%`;
    } else {
      this.range.style.width = `${percent}%`;
      this.thumb.style.left = `${percent}%`;
    }
    if (this.valueDisplay) {
      this.valueDisplay.textContent = value;
    }
    this.input.setAttribute('aria-valuenow', value);
  }
  handleTrackClick(e) {
    if (this.input.disabled) return;
    e.preventDefault();
    const rect = this.track.getBoundingClientRect();
    const step = parseFloat(this.input.step || '1');
    let percent;
    if (this.isVertical) {
      percent = 1 - ((e.clientY - rect.top) / rect.height);
    } else {
      percent = (e.clientX - rect.left) / rect.width;
    }
    percent = Math.max(0, Math.min(1, percent));
    const min = parseFloat(this.input.min);
    const max = parseFloat(this.input.max);
    let value = min + percent * (max - min);
    value = Math.round(value / step) * step;
    value = Math.max(min, Math.min(max, value));
    this.input.value = value;
    this.input.dispatchEvent(new Event('input', { bubbles: true }));
    this.input.focus();
  }
  setValue(value) {
    const min = parseFloat(this.input.min);
    const max = parseFloat(this.input.max);
    value = Math.max(min, Math.min(max, parseFloat(value)));
    this.input.value = value;
    this.update();
  }
  getValue() {
    return parseFloat(this.input.value);
  }
  setDisabled(disabled) {
    this.input.disabled = disabled;
  }
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.slider').forEach(sliderElement => new Slider(sliderElement));
});
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) { 
        if (node.classList && node.classList.contains('slider')) {
          new Slider(node);
        }
        node.querySelectorAll && node.querySelectorAll('.slider').forEach(slider => new Slider(slider));
      }
    });
  });
});
observer.observe(document.body, { childList: true, subtree: true });
class Sonner {
  constructor(options = {}) {
    this.options = { ...this.defaults, ...options };
    this.container = null;
    this.currentPosition = '';
    this.toasts = new Map(); 
    this.init();
  }
  defaults = {
    position: 'bottom-right',
    duration: 4000,
    maxToasts: 5,
    pauseOnHover: true
  }
  init() {
    this.setupContainer();
    this.emit('init');
  }
  setupContainer() {
    this.container = this._getOrCreateContainer(this.options.position);
  }
  _getOrCreateContainer(position = 'bottom-right') {
    if (this.container && this.currentPosition === position) {
      return this.container;
    }
    const className = `sonner-container sonner-container-${position}`;
    if (this.container) {
      this.container.className = className;
    } else {
      this.container = document.createElement('div');
      this.container.className = className;
      document.body.appendChild(this.container);
    }
    this.currentPosition = position;
    return this.container;
  }
  show(titleOrOptions, options = {}) {
    let toastOptions;
    if (typeof titleOrOptions === 'object') {
      toastOptions = titleOrOptions;
    } else {
      toastOptions = { ...options, title: titleOrOptions };
    }
    if (!toastOptions.title) {
      console.error('Toast must have a title.');
      return null;
    }
    return this._createToast(toastOptions);
  }
  success(title, options = {}) {
    return this.show({ title, ...options, type: 'success' });
  }
  error(title, options = {}) {
    return this.show({ title, ...options, type: 'error' });
  }
  info(title, options = {}) {
    return this.show({ title, ...options, type: 'info' });
  }
  warning(title, options = {}) {
    return this.show({ title, ...options, type: 'warning' });
  }
  _createToast(options) {
    const { title, description, duration = this.options.duration, icon, type, action, position } = options;
    if (position && position !== this.currentPosition) {
      this.container = this._getOrCreateContainer(position);
    }
    const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const sonnerElement = document.createElement('div');
    sonnerElement.className = `sonner sonner-${type || 'default'}`;
    sonnerElement.setAttribute('data-toast-id', toastId);
    const defaultIcons = { 
      success: 'check-circle', 
      error: 'x-circle', 
      warning: 'alert-triangle', 
      info: 'info' 
    };
    const iconName = icon || defaultIcons[type];
    if (iconName) {
      const iconEl = document.createElement('i');
      iconEl.className = 'sonner-icon';
      iconEl.setAttribute('data-lucide', iconName);
      sonnerElement.appendChild(iconEl);
    }
    const content = document.createElement('div');
    content.className = 'sonner-content';
    content.innerHTML = `
      <div class="sonner-title">${title}</div>
      ${description ? `<div class="sonner-description">${description}</div>` : ''}
    `;
    sonnerElement.appendChild(content);
    if (action && action.label && typeof action.onClick === 'function') {
      const actionWrapper = document.createElement('div');
      actionWrapper.className = 'sonner-action-wrapper';
      const actionButton = document.createElement('button');
      actionButton.className = action.class || 'btn btn-sm';
      actionButton.textContent = action.label;
      actionButton.addEventListener('click', (e) => {
        e.stopPropagation();
        action.onClick();
      });
      actionWrapper.appendChild(actionButton);
      sonnerElement.appendChild(actionWrapper);
    }
    const closeButton = document.createElement('button');
    closeButton.className = 'sonner-close-button';
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.innerHTML = '<i data-lucide="x" style="width: 1rem; height: 1rem;"></i>';
    sonnerElement.appendChild(closeButton);
    const removeToast = () => {
      if (sonnerElement.isRemoving) return;
      sonnerElement.isRemoving = true;
      clearTimeout(sonnerElement.timeoutId);
      sonnerElement.setAttribute('data-state', 'closed');
      setTimeout(() => {
        if (sonnerElement.parentNode) {
          sonnerElement.remove();
        }
        this.toasts.delete(toastId);
        this.emit('toast-removed', { id: toastId });
      }, 250);
      this.emit('toast-close', { id: toastId, element: sonnerElement });
    };
    if (this.options.pauseOnHover) {
      sonnerElement.addEventListener('mouseenter', () => {
        clearTimeout(sonnerElement.timeoutId);
      });
      sonnerElement.addEventListener('mouseleave', () => {
        sonnerElement.timeoutId = setTimeout(removeToast, duration);
      });
    }
    closeButton.addEventListener('click', removeToast);
    sonnerElement.timeoutId = setTimeout(removeToast, duration);
    if (this.toasts.size >= this.options.maxToasts) {
      const oldestToast = this.toasts.values().next().value;
      if (oldestToast && oldestToast.element) {
        this._removeToast(oldestToast.id);
      }
    }
    this.container.appendChild(sonnerElement);
    this.toasts.set(toastId, {
      id: toastId,
      element: sonnerElement,
      removeToast,
      options
    });
    requestAnimationFrame(() => {
      sonnerElement.setAttribute('data-state', 'open');
      if (window.lucide) {
        window.lucide.createIcons({ nodes: [sonnerElement] });
      }
    });
    this.emit('toast-show', { id: toastId, element: sonnerElement, options });
    return toastId;
  }
  dismiss(toastId) {
    if (toastId) {
      this._removeToast(toastId);
    } else {
      this.dismissAll();
    }
  }
  dismissAll() {
    this.toasts.forEach((toast) => {
      toast.removeToast();
    });
  }
  _removeToast(toastId) {
    const toast = this.toasts.get(toastId);
    if (toast) {
      toast.removeToast();
    }
  }
  setPosition(position) {
    this.options.position = position;
    this.container = this._getOrCreateContainer(position);
  }
  getToasts() {
    return Array.from(this.toasts.values()).map(toast => ({
      id: toast.id,
      options: toast.options
    }));
  }
  getToastCount() {
    return this.toasts.size;
  }
  emit(event, data = {}) {
    document.dispatchEvent(new CustomEvent(`sonner:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }
  destroy() {
    this.dismissAll();
    if (this.container && this.container.parentNode) {
      this.container.remove();
    }
    this.toasts.clear();
    this.emit('destroy');
  }
}
const globalSonner = new Sonner();
const toast = (titleOrOptions, options = {}) => {
  return globalSonner.show(titleOrOptions, options);
};
['success', 'error', 'info', 'warning'].forEach(type => {
  toast[type] = (title, options = {}) => globalSonner[type](title, options);
});
toast.dismiss = (id) => globalSonner.dismiss(id);
toast.dismissAll = () => globalSonner.dismissAll();
window.toast = toast;
class Tabs {
  constructor(tabsElement, options = {}) {
    if (!tabsElement || tabsElement.tabs) return;
    this.element = tabsElement;
    this.id = tabsElement.id || `tabs-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };
    this.tabsList = this.element.querySelector('.tabs-list');
    if (!this.tabsList) {
      console.error('Tabs missing required element: .tabs-list', this.element);
      return;
    }
    this.triggers = Array.from(this.tabsList.querySelectorAll('.tabs-trigger'));
    this.tabsData = this.triggers.map(trigger => {
      const contentId = trigger.getAttribute('aria-controls');
      const content = contentId ? this.element.querySelector(`#${contentId}`) : null;
      return { trigger, content };
    }).filter(tab => tab.content);
    if (this.tabsData.length === 0) {
      console.error('Tabs: No valid tab pairs found', this.element);
      return;
    }
    this.activeTab = null;
    this._boundHandlers = {
      click: (e) => this._handleClick(e),
      keydown: (e) => this._handleKeydown(e)
    };
    this.init();
    this.element.tabs = this;
  }
  defaults = {
    onTabChange: () => {},
    activateOnFocus: false
  }
  init() {
    this.setupStructure();
    this.setupEvents();
    this.setInitialTab();
    this.element.classList.add('tabs-initialized');
    this.emit('init');
  }
  setupStructure() {
    this.tabsList.setAttribute('role', 'tablist');
    this.tabsData.forEach(({ trigger, content }, index) => {
      trigger.setAttribute('role', 'tab');
      trigger.setAttribute('tabindex', '-1');
      content.setAttribute('role', 'tabpanel');
      content.setAttribute('tabindex', '0');
      if (!content.id) {
        content.id = `${this.id}-content-${index}`;
      }
      if (!trigger.getAttribute('aria-controls')) {
        trigger.setAttribute('aria-controls', content.id);
      }
    });
  }
  setupEvents() {
    this.tabsList.addEventListener('click', this._boundHandlers.click);
    this.tabsList.addEventListener('keydown', this._boundHandlers.keydown);
    if (this.options.activateOnFocus) {
      this.tabsData.forEach(({ trigger }) => {
        trigger.addEventListener('focus', () => {
          if (!trigger.disabled) {
            this.activateTab(trigger);
          }
        });
      });
    }
  }
  setInitialTab() {
    const initialTab = this.tabsData.find(tab => 
      tab.trigger.classList.contains('tabs-trigger-active')
    ) || this.tabsData[0];
    this._activateTab(initialTab);
  }
  _handleClick(e) {
    const clickedTrigger = e.target.closest('.tabs-trigger');
    if (clickedTrigger && !clickedTrigger.disabled) {
      const tabToActivate = this.tabsData.find(tab => tab.trigger === clickedTrigger);
      if (tabToActivate) {
        this.activateTab(clickedTrigger);
      }
    }
  }
  _handleKeydown(e) {
    const activeTriggers = this.tabsData.filter(tab => !tab.trigger.disabled);
    const currentIndex = activeTriggers.findIndex(tab => 
      tab.trigger.getAttribute('aria-selected') === 'true'
    );
    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % activeTriggers.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + activeTriggers.length) % activeTriggers.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = activeTriggers.length - 1;
    } else {
      return;
    }
    const nextTab = activeTriggers[nextIndex];
    nextTab.trigger.focus();
    this.activateTab(nextTab.trigger);
  }
  _activateTab(tabData) {
    const previousTab = this.activeTab;
    this.tabsData.forEach(({ trigger, content }) => {
      const isActive = (trigger === tabData.trigger);
      trigger.classList.toggle('tabs-trigger-active', isActive);
      trigger.setAttribute('aria-selected', isActive.toString());
      trigger.setAttribute('tabindex', isActive ? '0' : '-1');
      content.hidden = !isActive;
    });
    this.activeTab = tabData;
    if (previousTab !== tabData) {
      this.options.onTabChange(tabData.trigger, tabData.content);
      this.emit('tab-change', { 
        trigger: tabData.trigger, 
        content: tabData.content,
        previousTab 
      });
    }
  }
  activateTab(triggerOrIndex) {
    let tabData;
    if (typeof triggerOrIndex === 'number') {
      tabData = this.tabsData[triggerOrIndex];
    } else if (typeof triggerOrIndex === 'string') {
      tabData = this.tabsData.find(tab => 
        tab.content.id === triggerOrIndex || 
        tab.trigger.id === triggerOrIndex
      );
    } else {
      tabData = this.tabsData.find(tab => tab.trigger === triggerOrIndex);
    }
    if (tabData && !tabData.trigger.disabled) {
      this._activateTab(tabData);
    }
  }
  getActiveTab() {
    return this.activeTab ? {
      trigger: this.activeTab.trigger,
      content: this.activeTab.content,
      index: this.tabsData.indexOf(this.activeTab)
    } : null;
  }
  getTabByIndex(index) {
    return this.tabsData[index] || null;
  }
  getTabCount() {
    return this.tabsData.length;
  }
  enableTab(triggerOrIndex) {
    const tabData = this._findTab(triggerOrIndex);
    if (tabData) {
      tabData.trigger.disabled = false;
      tabData.trigger.removeAttribute('disabled');
    }
  }
  disableTab(triggerOrIndex) {
    const tabData = this._findTab(triggerOrIndex);
    if (tabData) {
      tabData.trigger.disabled = true;
      tabData.trigger.setAttribute('disabled', 'true');
      if (tabData === this.activeTab) {
        const availableTab = this.tabsData.find(tab => !tab.trigger.disabled);
        if (availableTab) {
          this._activateTab(availableTab);
        }
      }
    }
  }
  _findTab(triggerOrIndex) {
    if (typeof triggerOrIndex === 'number') {
      return this.tabsData[triggerOrIndex];
    } else if (typeof triggerOrIndex === 'string') {
      return this.tabsData.find(tab => 
        tab.content.id === triggerOrIndex || 
        tab.trigger.id === triggerOrIndex
      );
    } else {
      return this.tabsData.find(tab => tab.trigger === triggerOrIndex);
    }
  }
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`tabs:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }
  destroy() {
    this.tabsList.removeEventListener('click', this._boundHandlers.click);
    this.tabsList.removeEventListener('keydown', this._boundHandlers.keydown);
    this.element.classList.remove('tabs-initialized');
    delete this.element.tabs;
    this.emit('destroy');
  }
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tabs:not(.tabs-initialized)').forEach(el => {
    new Tabs(el);
  });
});
class ToggleGroup {
  constructor(toggleGroupElement, options = {}) {
    if (!toggleGroupElement || toggleGroupElement.toggleGroup) return;
    this.element = toggleGroupElement;
    this.id = toggleGroupElement.id || `toggle-group-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };
    this.items = Array.from(this.element.querySelectorAll('.toggle-group-item'));
    if (this.items.length === 0) {
      console.error('ToggleGroup missing required elements: .toggle-group-item', this.element);
      return;
    }
    this.isSingleSelection = this.element.classList.contains('toggle-group-single');
    this.isDisabled = this.element.classList.contains('toggle-group-disabled');
    this._boundHandlers = {
      click: (e) => this._handleClick(e)
    };
    this.init();
    this.element.toggleGroup = this;
  }
  defaults = {
    onToggle: () => {},
    onSelectionChange: () => {}
  }
  init() {
    if (this.isDisabled) return;
    this.setupStructure();
    this.setupEvents();
    this.element.classList.add('toggle-group-initialized');
    this.emit('init');
  }
  setupStructure() {
    this.element.setAttribute('role', this.isSingleSelection ? 'radiogroup' : 'group');
    this.items.forEach((item, index) => {
      item.setAttribute('role', this.isSingleSelection ? 'radio' : 'button');
      item.setAttribute('aria-pressed', item.classList.contains('toggle-group-item-on').toString());
      if (!item.id) {
        item.id = `${this.id}-item-${index}`;
      }
    });
  }
  setupEvents() {
    this.element.addEventListener('click', this._boundHandlers.click);
  }
  _handleClick(e) {
    if (this.isDisabled) return;
    const clickedItem = e.target.closest('.toggle-group-item');
    if (!clickedItem) return;
    this._toggleItem(clickedItem);
  }
  _toggleItem(clickedItem) {
    const isOn = clickedItem.classList.contains('toggle-group-item-on');
    const previousSelection = this.getSelectedItems();
    if (this.isSingleSelection) {
      if (isOn) {
        return;
      }
      this.items.forEach(item => {
        item.classList.remove('toggle-group-item-on');
        item.setAttribute('aria-pressed', 'false');
      });
      clickedItem.classList.add('toggle-group-item-on');
      clickedItem.setAttribute('aria-pressed', 'true');
    } else {
      clickedItem.classList.toggle('toggle-group-item-on');
      clickedItem.setAttribute('aria-pressed', (!isOn).toString());
    }
    const newSelection = this.getSelectedItems();
    this.options.onToggle(clickedItem, !isOn);
    this.options.onSelectionChange(newSelection, previousSelection);
    this.emit('toggle', { 
      item: clickedItem, 
      pressed: !isOn,
      selection: newSelection,
      previousSelection 
    });
  }
  selectItem(itemOrIndex) {
    const item = this._findItem(itemOrIndex);
    if (item && !item.classList.contains('toggle-group-item-on')) {
      this._toggleItem(item);
    }
  }
  deselectItem(itemOrIndex) {
    const item = this._findItem(itemOrIndex);
    if (item && item.classList.contains('toggle-group-item-on')) {
      if (this.isSingleSelection) {
        return;
      }
      this._toggleItem(item);
    }
  }
  toggleItem(itemOrIndex) {
    const item = this._findItem(itemOrIndex);
    if (item) {
      this._toggleItem(item);
    }
  }
  getSelectedItems() {
    return this.items.filter(item => item.classList.contains('toggle-group-item-on'));
  }
  getSelectedValues() {
    return this.getSelectedItems().map(item => item.dataset.value || item.textContent.trim());
  }
  clearSelection() {
    this.items.forEach(item => {
      item.classList.remove('toggle-group-item-on');
      item.setAttribute('aria-pressed', 'false');
    });
    this.options.onSelectionChange([], this.getSelectedItems());
    this.emit('selection-clear');
  }
  setSelection(itemsOrIndices) {
    this.clearSelection();
    if (this.isSingleSelection && itemsOrIndices.length > 1) {
      console.warn('ToggleGroup: Single selection mode allows only one item');
      itemsOrIndices = [itemsOrIndices[0]];
    }
    itemsOrIndices.forEach(itemOrIndex => {
      this.selectItem(itemOrIndex);
    });
  }
  enable() {
    this.isDisabled = false;
    this.element.classList.remove('toggle-group-disabled');
    this.setupEvents();
  }
  disable() {
    this.isDisabled = true;
    this.element.classList.add('toggle-group-disabled');
    this.element.removeEventListener('click', this._boundHandlers.click);
  }
  setSingleSelection(single) {
    this.isSingleSelection = single;
    if (single) {
      this.element.classList.add('toggle-group-single');
      this.element.setAttribute('role', 'radiogroup');
      const selectedItems = this.getSelectedItems();
      if (selectedItems.length > 1) {
        this.clearSelection();
        this.selectItem(selectedItems[0]);
      }
      this.items.forEach(item => {
        item.setAttribute('role', 'radio');
      });
    } else {
      this.element.classList.remove('toggle-group-single');
      this.element.setAttribute('role', 'group');
      this.items.forEach(item => {
        item.setAttribute('role', 'button');
      });
    }
  }
  _findItem(itemOrIndex) {
    if (typeof itemOrIndex === 'number') {
      return this.items[itemOrIndex];
    } else if (typeof itemOrIndex === 'string') {
      return this.items.find(item => 
        item.id === itemOrIndex || 
        item.dataset.value === itemOrIndex
      );
    } else {
      return this.items.find(item => item === itemOrIndex);
    }
  }
  getItemCount() {
    return this.items.length;
  }
  isItemSelected(itemOrIndex) {
    const item = this._findItem(itemOrIndex);
    return item ? item.classList.contains('toggle-group-item-on') : false;
  }
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`toggle-group:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }
  destroy() {
    this.element.removeEventListener('click', this._boundHandlers.click);
    this.element.classList.remove('toggle-group-initialized');
    delete this.element.toggleGroup;
    this.emit('destroy');
  }
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.toggle-group:not(.toggle-group-initialized):not(.toggle-group-disabled)').forEach(el => {
    new ToggleGroup(el);
  });
});
class Toggle {
  constructor(toggleElement, options = {}) {
    if (!toggleElement || toggleElement.toggle) return;
    this.element = toggleElement;
    this.id = toggleElement.id || `toggle-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };
    this.pressed = this.element.dataset.state === 'on';
    this._boundHandlers = {
      click: (e) => this._handleClick(e)
    };
    this.init();
    this.element.toggle = this;
  }
  defaults = {
    onToggle: () => {}
  }
  init() {
    this.setupStructure();
    this.setupEvents();
    this.updateState();
    this.element.classList.add('toggle-initialized');
    this.emit('init');
  }
  setupStructure() {
    this.element.setAttribute('role', 'button');
    this.element.setAttribute('type', 'button');
  }
  setupEvents() {
    this.element.addEventListener('click', this._boundHandlers.click);
  }
  updateState() {
    this.element.dataset.state = this.pressed ? 'on' : 'off';
    this.element.setAttribute('aria-pressed', this.pressed.toString());
  }
  _handleClick(e) {
    if (this.element.disabled) return;
    e.preventDefault();
    this.toggle();
  }
  toggle() {
    if (this.element.disabled) return;
    const previousState = this.pressed;
    this.pressed = !this.pressed;
    this.updateState();
    this.options.onToggle(this.pressed, previousState);
    this.emit('toggle', { pressed: this.pressed, previousState });
  }
  setPressed(pressed) {
    if (this.element.disabled) return;
    const previousState = this.pressed;
    this.pressed = Boolean(pressed);
    this.updateState();
    if (previousState !== this.pressed) {
      this.options.onToggle(this.pressed, previousState);
      this.emit('toggle', { pressed: this.pressed, previousState });
    }
  }
  isPressed() {
    return this.pressed;
  }
  enable() {
    this.element.disabled = false;
    this.element.removeAttribute('disabled');
  }
  disable() {
    this.element.disabled = true;
    this.element.setAttribute('disabled', 'true');
  }
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`toggle:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }
  destroy() {
    this.element.removeEventListener('click', this._boundHandlers.click);
    this.element.classList.remove('toggle-initialized');
    delete this.element.toggle;
    this.emit('destroy');
  }
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.toggle:not(.toggle-initialized)').forEach(el => {
    new Toggle(el);
  });
});
class Tooltip {
  constructor(tooltipElement, options = {}) {
    if (!tooltipElement || tooltipElement.tooltip) return;
    this.element = tooltipElement;
    this.id = tooltipElement.id || `tooltip-${Math.random().toString(36).substr(2, 9)}`;
    this.options = { ...this.defaults, ...options };
    this.trigger = this.element.querySelector('.tooltip-trigger');
    this.content = this.element.querySelector('.tooltip-content');
    if (!this.trigger || !this.content) {
      console.warn('Tooltip is missing trigger or content element.', this.element);
      return;
    }
    this.isVisible = false;
    this.originalParent = this.content.parentElement;
    this.preferredSide = this._getSideFromClasses();
    this.showTimer = null;
    this.hideTimer = null;
    this._boundHandlers = {
      mouseenter: () => this._handleShow(),
      mouseleave: () => this._handleHide(),
      focus: () => this._handleShow(),
      blur: () => this._handleHide(),
      position: () => this._positionTooltip(),
      keydown: (e) => this._handleKeydown(e)
    };
    this.init();
    this.element.tooltip = this;
  }
  defaults = {
    showDelay: 300,
    hideDelay: 100,
    sideOffset: 8,
    viewportPadding: 8,
    portal: true,
    keyboard: true,
    fit: false
  }
  init() {
    this.setupAccessibility();
    this.setupEvents();
    this.setupInitialState();
    this._applyClassBasedSettings();
    this.element.classList.add('tooltip-initialized');
    this.emit('init', { side: this.preferredSide, fit: this.options.fit });
  }
  _getSideFromClasses() {
    if (this.trigger.classList.contains('tooltip-bottom')) return 'bottom';
    if (this.trigger.classList.contains('tooltip-left')) return 'left';
    if (this.trigger.classList.contains('tooltip-right')) return 'right';
    return 'top'; 
  }
  _applyClassBasedSettings() {
    if (this.content.classList.contains('tooltip-fit')) {
      this.options.fit = true;
    }
    if (this.element.classList.contains('tooltip-no-portal')) {
      this.options.portal = false;
    }
    if (this.element.classList.contains('tooltip-no-keyboard')) {
      this.options.keyboard = false;
    }
    if (this.element.classList.contains('tooltip-fast')) {
      this.options.showDelay = 100;
      this.options.hideDelay = 50;
    }
    if (this.element.classList.contains('tooltip-slow')) {
      this.options.showDelay = 600;
      this.options.hideDelay = 200;
    }
    if (this.element.classList.contains('tooltip-instant')) {
      this.options.showDelay = 0;
      this.options.hideDelay = 0;
    }
  }
  setupAccessibility() {
    const contentId = this.content.id || `${this.id}-content`;
    this.content.id = contentId;
    this.trigger.setAttribute('aria-describedby', contentId);
    this.content.setAttribute('role', 'tooltip');
    this.content.classList.add('tooltip-hidden'); 
  }
  setupEvents() {
    this.trigger.addEventListener('mouseenter', this._boundHandlers.mouseenter);
    this.trigger.addEventListener('mouseleave', this._boundHandlers.mouseleave);
    this.trigger.addEventListener('focus', this._boundHandlers.focus);
    this.trigger.addEventListener('blur', this._boundHandlers.blur);
    if (this.options.keyboard) {
      this.trigger.addEventListener('keydown', this._boundHandlers.keydown);
    }
  }
  setupInitialState() {
    this.content.classList.add('tooltip-closed'); 
    this.content.classList.add('tooltip-hidden');
  }
  _handleShow() {
    clearTimeout(this.hideTimer);
    if (this.isVisible) return;
    this.showTimer = setTimeout(() => {
      this.show();
    }, this.options.showDelay);
  }
  _handleHide() {
    clearTimeout(this.showTimer);
    if (!this.isVisible) return;
    this.hideTimer = setTimeout(() => {
      this.hide();
    }, this.options.hideDelay);
  }
  _handleKeydown(event) {
    if (event.key === 'Escape' && this.isVisible) {
      this.hide();
    }
  }
  show() {
    if (this.isVisible) return;
    Tooltip._hideAll();
    this.isVisible = true;
    if (this.options.portal) {
      document.body.appendChild(this.content);
    }
    this._positionTooltip();
    this.content.classList.remove('tooltip-closed', 'tooltip-hidden');
    this.content.classList.add('tooltip-open', 'tooltip-visible');
    window.addEventListener('scroll', this._boundHandlers.position, true);
    window.addEventListener('resize', this._boundHandlers.position, true);
    this.emit('show', { side: this.preferredSide });
  }
  hide() {
    if (!this.isVisible) return;
    this.isVisible = false;
    this.content.classList.remove('tooltip-open', 'tooltip-visible');
    this.content.classList.add('tooltip-closed', 'tooltip-hidden');
    window.removeEventListener('scroll', this._boundHandlers.position, true);
    window.removeEventListener('resize', this._boundHandlers.position, true);
    if (this.options.portal) {
      setTimeout(() => {
        if (this.content.parentElement === document.body) {
          this.originalParent.appendChild(this.content);
        }
      }, 150);
    }
    this.emit('hide');
  }
  toggle() {
    this.isVisible ? this.hide() : this.show();
  }
  static _hideAll() {
    const tooltips = document.querySelectorAll('.tooltip-initialized');
    for (const tooltip of tooltips) {
      if (tooltip.tooltip?.isVisible) {
        tooltip.tooltip.hide();
      }
    }
  }
  _positionTooltip() {
    if (!this.isVisible) return;
    const position = this._calculatePosition();
    Object.assign(this.content.style, {
      top: `${position.top}px`,
      left: `${position.left}px`,
      position: 'fixed',
      zIndex: '9999'
    });
  }
  _calculatePosition() {
    const triggerRect = this.trigger.getBoundingClientRect();
    const contentRect = this.content.getBoundingClientRect();
    const space = this._getAvailableSpace(triggerRect);
    const finalSide = this._chooseBestSide(space, contentRect);
    let { top, left } = this._getPositionForSide(finalSide, triggerRect, contentRect);
    ({ top, left } = this._constrainToViewport(top, left, contentRect));
    return { top, left, side: finalSide };
  }
  _getAvailableSpace(triggerRect) {
    const { viewportPadding } = this.options;
    return {
      top: triggerRect.top - viewportPadding,
      bottom: window.innerHeight - triggerRect.bottom - viewportPadding,
      left: triggerRect.left - viewportPadding,
      right: window.innerWidth - triggerRect.right - viewportPadding
    };
  }
  _chooseBestSide(space, contentRect) {
    let finalSide = this.preferredSide;
    if (this.preferredSide === 'top' && space.top < contentRect.height && space.bottom > space.top) {
      finalSide = 'bottom';
    }
    if (this.preferredSide === 'bottom' && space.bottom < contentRect.height && space.top > space.bottom) {
      finalSide = 'top';
    }
    if (this.preferredSide === 'left' && space.left < contentRect.width && space.right > space.left) {
      finalSide = 'right';
    }
    if (this.preferredSide === 'right' && space.right < contentRect.width && space.left > space.right) {
      finalSide = 'left';
    }
    return finalSide;
  }
  _getPositionForSide(side, triggerRect, contentRect) {
    const { sideOffset } = this.options;
    switch (side) {
      case 'top':
        return {
          top: triggerRect.top - contentRect.height - sideOffset,
          left: triggerRect.left + (triggerRect.width - contentRect.width) / 2
        };
      case 'bottom':
        return {
          top: triggerRect.bottom + sideOffset,
          left: triggerRect.left + (triggerRect.width - contentRect.width) / 2
        };
      case 'left':
        return {
          left: triggerRect.left - contentRect.width - sideOffset,
          top: triggerRect.top + (triggerRect.height - contentRect.height) / 2
        };
      case 'right':
        return {
          left: triggerRect.right + sideOffset,
          top: triggerRect.top + (triggerRect.height - contentRect.height) / 2
        };
      default:
        return { top: 0, left: 0 };
    }
  }
  _constrainToViewport(top, left, contentRect) {
    const { viewportPadding } = this.options;
    if (left < viewportPadding) left = viewportPadding;
    if (top < viewportPadding) top = viewportPadding;
    if (left + contentRect.width > window.innerWidth - viewportPadding) {
      left = window.innerWidth - contentRect.width - viewportPadding;
    }
    if (top + contentRect.height > window.innerHeight - viewportPadding) {
      top = window.innerHeight - contentRect.height - viewportPadding;
    }
    return { top, left };
  }
  updateContent(newContent) {
    if (typeof newContent === 'string') {
      this.content.textContent = newContent;
    } else if (newContent instanceof HTMLElement) {
      this.content.innerHTML = '';
      this.content.appendChild(newContent);
    }
    if (this.isVisible) {
      this._positionTooltip();
    }
    this.emit('update', { content: newContent });
  }
  setSide(side) {
    const validSides = ['top', 'bottom', 'left', 'right'];
    if (validSides.includes(side)) {
      validSides.forEach(s => {
        this.trigger.classList.remove(`tooltip-${s}`);
      });
      this.trigger.classList.add(`tooltip-${side}`);
      this.preferredSide = side;
      if (this.isVisible) {
        this._positionTooltip();
      }
      this.emit('side-change', { side });
    }
  }
  setFit(fit = true) {
    this.options.fit = fit;
    this.content.classList.toggle('tooltip-fit', fit);
    if (this.isVisible) {
      this._positionTooltip();
    }
    this.emit('fit-change', { fit });
  }
  emit(event, data = {}) {
    this.element.dispatchEvent(new CustomEvent(`tooltip:${event}`, {
      bubbles: true,
      detail: { ...data, instance: this }
    }));
  }
  destroy() {
    clearTimeout(this.showTimer);
    clearTimeout(this.hideTimer);
    if (this.isVisible) {
      this.hide();
    }
    this.trigger.removeEventListener('mouseenter', this._boundHandlers.mouseenter);
    this.trigger.removeEventListener('mouseleave', this._boundHandlers.mouseleave);
    this.trigger.removeEventListener('focus', this._boundHandlers.focus);
    this.trigger.removeEventListener('blur', this._boundHandlers.blur);
    this.trigger.removeEventListener('keydown', this._boundHandlers.keydown);
    window.removeEventListener('scroll', this._boundHandlers.position, true);
    window.removeEventListener('resize', this._boundHandlers.position, true);
    this.element.classList.remove('tooltip-initialized');
    delete this.element.tooltip;
    this.emit('destroy');
  }
}
const tooltipGlobals = {
  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.autoInit);
    } else {
      this.autoInit();
    }
  },
  autoInit() {
    const tooltips = document.querySelectorAll('.tooltip:not(.tooltip-initialized)');
    for (const el of tooltips) {
      const trigger = el.querySelector('.tooltip-trigger');
      const content = el.querySelector('.tooltip-content');
      if (trigger && content) {
        el.tooltip = new Tooltip(el);
      }
    }
  }
};
tooltipGlobals.init();
const html = document.documentElement;
try {
  html.dataset.theme = localStorage.getItem('theme') ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
} catch (e) {
  html.dataset.theme = 'light';
}
document.addEventListener('click', ({ target }) => {
  if (target.closest('[data-theme-toggle]')) {
    const newTheme = html.dataset.theme === 'dark' ? 'light' : 'dark';
    html.dataset.theme = newTheme;
    localStorage.setItem('theme', newTheme);
  }
});
document.body.classList.add('js-loaded');
document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});
(function() {
  if (typeof window !== 'undefined') {
    if (typeof Accordion !== 'undefined') { window.Accordion = Accordion; }
    if (typeof Calendar !== 'undefined') { window.Calendar = Calendar; }
    if (typeof Carousel !== 'undefined') { window.Carousel = Carousel; }
    if (typeof Combobox !== 'undefined') { window.Combobox = Combobox; }
    if (typeof Command !== 'undefined') { window.Command = Command; }
    if (typeof ContextMenu !== 'undefined') { window.ContextMenu = ContextMenu; }
    if (typeof Dialog !== 'undefined') { window.Dialog = Dialog; }
    if (typeof DropdownMenu !== 'undefined') { window.DropdownMenu = DropdownMenu; }
    if (typeof HoverCard !== 'undefined') { window.HoverCard = HoverCard; }
    if (typeof InputOTP !== 'undefined') { window.InputOTP = InputOTP; }
    if (typeof Menubar !== 'undefined') { window.Menubar = Menubar; }
    if (typeof NavigationMenu !== 'undefined') { window.NavigationMenu = NavigationMenu; }
    if (typeof Pagination !== 'undefined') { window.Pagination = Pagination; }
    if (typeof PopoverBehavior !== 'undefined') { window.PopoverBehavior = PopoverBehavior; }
    if (typeof Progress !== 'undefined') { window.Progress = Progress; }
    if (typeof Resizable !== 'undefined') { window.Resizable = Resizable; }
    if (typeof ScrollArea !== 'undefined') { window.ScrollArea = ScrollArea; }
    if (typeof Select !== 'undefined') { window.Select = Select; }
    if (typeof Sheet !== 'undefined') { window.Sheet = Sheet; }
    if (typeof Sidebar !== 'undefined') { window.Sidebar = Sidebar; }
    if (typeof Slider !== 'undefined') { window.Slider = Slider; }
    if (typeof Sonner !== 'undefined') { window.Sonner = Sonner; }
    if (typeof Tabs !== 'undefined') { window.Tabs = Tabs; }
    if (typeof ToggleGroup !== 'undefined') { window.ToggleGroup = ToggleGroup; }
    if (typeof Toggle !== 'undefined') { window.Toggle = Toggle; }
    if (typeof Tooltip !== 'undefined') { window.Tooltip = Tooltip; }
    if (typeof toast !== 'undefined') { window.toast = toast; }
  }
})();
