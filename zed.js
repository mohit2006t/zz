(function(window, document) {
  'use strict';

  const UI = {
    core: {
      initComponent: function(context, element, name, defaults, options) {
        if (!element || element[name]) {
          return false;
        }
        context.element = element;
        const dataOptions = element.dataset.options ? JSON.parse(element.dataset.options) : {};
        context.options = { ...defaults, ...options, ...dataOptions };
        context.id = element.id || UI.utils.generateId(name);
        element[name] = context;
        return true;
      },
      autoInit: function(selector, ComponentClass, componentName) {
        document.querySelectorAll(`${selector}:not(.${componentName}-initialized)`).forEach(function(el) {
          if (!el[componentName]) {
            new ComponentClass(el);
          }
        });
      }
    },
    utils: {
      generateId: function(prefix) {
        return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
      },
      emitEvent: function(element, eventName, componentName, detail) {
        var instance = element[componentName];
        element.dispatchEvent(new CustomEvent(`${componentName}:${eventName}`, {
          bubbles: true,
          detail: { ...detail,
            instance: instance
          }
        }));
      },
      trapFocus: function(container, e) {
        var focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        var focusables = Array.from(container.querySelectorAll(focusableElements)).filter(function(el) {
          return !el.disabled && el.offsetParent !== null;
        });
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      },
      lockBodyScroll: function(lock) {
        document.body.style.overflow = lock ? 'hidden' : '';
      },
      positionElement: function(trigger, content, _temp) {
        var _temp$side = _temp.side,
          side = _temp$side === void 0 ? 'bottom' : _temp$side,
          _temp$align = _temp.align,
          align = _temp$align === void 0 ? 'start' : _temp$align,
          _temp$sideOffset = _temp.sideOffset,
          sideOffset = _temp$sideOffset === void 0 ? 8 : _temp$sideOffset,
          _temp$viewportPadding = _temp.viewportPadding,
          viewportPadding = _temp$viewportPadding === void 0 ? 8 : _temp$viewportPadding,
          _temp$autoFlip = _temp.autoFlip,
          autoFlip = _temp$autoFlip === void 0 ? true : _temp$autoFlip,
          _temp$fit = _temp.fit,
          fit = _temp$fit === void 0 ? false : _temp$fit;
        if (!trigger || !content) {
          return {
            top: 0,
            left: 0,
            side: side
          };
        }
        var triggerRect = trigger.getBoundingClientRect();
        var contentRect = content.getBoundingClientRect();
        if (fit) {
          content.style.width = "".concat(triggerRect.width, "px");
          contentRect = content.getBoundingClientRect();
        }
        var space = {
          top: triggerRect.top - viewportPadding,
          bottom: window.innerHeight - triggerRect.bottom - viewportPadding,
          left: triggerRect.left - viewportPadding,
          right: window.innerWidth - triggerRect.right - viewportPadding
        };
        var finalSide = side;
        if (autoFlip) {
          var oppositeSide = {
            top: 'bottom',
            bottom: 'top',
            left: 'right',
            right: 'left'
          };
          var isVertical = finalSide === 'top' || finalSide === 'bottom';
          var size = isVertical ? contentRect.height : contentRect.width;
          if (space[finalSide] < size && space[oppositeSide[finalSide]] > size) {
            finalSide = oppositeSide[finalSide];
          }
        }
        var pos = {
          top: 0,
          left: 0
        };
        var _isVertical = finalSide === 'top' || finalSide === 'bottom';
        if (_isVertical) {
          pos.top = finalSide === 'top' ? triggerRect.top - contentRect.height - sideOffset : triggerRect.bottom + sideOffset;
        } else {
          pos.left = finalSide === 'left' ? triggerRect.left - contentRect.width - sideOffset : triggerRect.right + sideOffset;
        }
        if (_isVertical) {
          if (align === 'start') {
            pos.left = triggerRect.left;
          } else if (align === 'center') {
            pos.left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
          } else if (align === 'end') {
            pos.left = triggerRect.right - contentRect.width;
          }
        } else {
          if (align === 'start') {
            pos.top = triggerRect.top;
          } else if (align === 'center') {
            pos.top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
          } else if (align === 'end') {
            pos.top = triggerRect.bottom - contentRect.height;
          }
        }
        pos.left = Math.max(viewportPadding, Math.min(pos.left, window.innerWidth - contentRect.width - viewportPadding));
        pos.top = Math.max(viewportPadding, Math.min(pos.top, window.innerHeight - contentRect.height - viewportPadding));
        return {
          top: pos.top,
          left: pos.left,
          side: finalSide
        };
      }
    }
  };

  class Accordion {
    constructor(element, options) {
      if (!UI.core.initComponent(this, element, 'accordion', this.defaults, options)) return;
      this.type = this._getTypeFromClasses();
      this.items = Array.from(this.element.querySelectorAll('.accordion-item'));
      this._boundHandlers = {
        toggle: this._handleToggle.bind(this),
        keydown: this._handleKeydown.bind(this)
      };
      this.init();
    }
    defaults = {
      type: 'multiple',
      collapsible: true,
      closeOthers: true,
      keyboard: true
    };
    init() {
      this._setupAccessibility();
      this._setupEventListeners();
      this._handleInitialState();
      this.element.classList.add('accordion-initialized');
      this.emit('init', {
        type: this.type,
        totalItems: this.items.length
      });
    }
    open(index) {
      this._setItemState(index, true);
    }
    close(index) {
      this._setItemState(index, false);
    }
    toggle(index) {
      this._setItemState(index, !this.isOpen(index));
    }
    openAll() {
      if (this.type === 'multiple') {
        this.items.forEach(function(item, index) {
          this.open(index);
        }.bind(this));
        this.emit('openAll');
      }
    }
    closeAll() {
      this.items.forEach(function(item, index) {
        this.close(index);
      }.bind(this));
      this.emit('closeAll');
    }
    isOpen(index) {
      return this.items[index]?.open || false;
    }
    _getTypeFromClasses() {
      if (this.element.classList.contains('accordion-single')) return 'single';
      if (this.element.classList.contains('accordion-multiple')) return 'multiple';
      return this.options.type;
    }
    _setupAccessibility() {
      this.element.setAttribute('role', 'presentation');
      this.items.forEach(function(item, index) {
        var trigger = item.querySelector('.accordion-trigger');
        var content = item.querySelector('.accordion-content');
        if (trigger && content) {
          var triggerId = trigger.id || "".concat(this.id, "-trigger-").concat(index);
          var contentId = content.id || "".concat(this.id, "-content-").concat(index);
          trigger.id = triggerId;
          content.id = contentId;
          trigger.setAttribute('aria-controls', contentId);
          content.setAttribute('aria-labelledby', triggerId);
          content.setAttribute('role', 'region');
          this._updateAriaExpanded(item);
        }
      }.bind(this));
    }
    _setupEventListeners() {
      this.items.forEach(function(item) {
        var trigger = item.querySelector('.accordion-trigger');
        if (this.type === 'single') item.addEventListener('toggle', this._boundHandlers.toggle);
        item.addEventListener('toggle', function(e) {
          return this._updateAriaExpanded(e.target);
        }.bind(this));
        if (this.options.keyboard && trigger) {
          trigger.addEventListener('keydown', this._boundHandlers.keydown);
        }
      }.bind(this));
    }
    _handleInitialState() {
      this.items.forEach(function(item) {
        var shouldBeOpen = item.classList.contains('accordion-item-open');
        var shouldBeClosed = item.classList.contains('accordion-item-closed');
        if (shouldBeOpen && !item.open) item.open = true;
        else if (shouldBeClosed && item.open) item.open = false;
        this._updateAriaExpanded(item);
      }.bind(this));
    }
    _handleToggle(event) {
      var currentItem = event.target;
      if (currentItem.open && this.options.closeOthers) {
        this.items.forEach(function(otherItem) {
          if (otherItem !== currentItem && otherItem.open) otherItem.open = false;
        });
      }
      this.emit('toggle', {
        item: currentItem,
        open: currentItem.open,
        index: this.items.indexOf(currentItem)
      });
    }
    _handleKeydown(event) {
      var currentIndex = this.items.indexOf(event.target.closest('.accordion-item'));
      var nextIndex;
      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          nextIndex = (currentIndex + 1) % this.items.length;
          this._focusTrigger(nextIndex);
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          nextIndex = (currentIndex - 1 + this.items.length) % this.items.length;
          this._focusTrigger(nextIndex);
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
      var _item$querySelector;
      (_item$querySelector = item.querySelector('.accordion-trigger')) === null || _item$querySelector === void 0 ? void 0 : _item$querySelector.setAttribute('aria-expanded', item.open ? 'true' : 'false');
    }
    _focusTrigger(index) {
      var _this$items$index$que;
      (_this$items$index$que = this.items[index]?.querySelector('.accordion-trigger')) === null || _this$items$index$que === void 0 ? void 0 : _this$items$index$que.focus();
    }
    _setItemState(index, state) {
      var item = this.items[index];
      if (item && !item.hasAttribute('disabled') && item.open !== state) {
        item.open = state;
        this.emit(state ? 'open' : 'close', {
          item: item,
          index: index
        });
      }
    }
    emit(event, data) {
      UI.utils.emitEvent(this.element, event, 'accordion', data);
    }
    destroy() {
      this.items.forEach(function(item) {
        var _item$querySelector;
        item.removeEventListener('toggle', this._boundHandlers.toggle);
        (_item$querySelector = item.querySelector('.accordion-trigger')) === null || _item$querySelector === void 0 ? void 0 : _item$querySelector.removeEventListener('keydown', this._boundHandlers.keydown);
      }.bind(this));
      this.element.classList.remove('accordion-initialized');
      delete this.element.accordion;
      this.emit('destroy');
    }
  }

  class Calendar {
    constructor(element, options) {
      if (!UI.core.initComponent(this, element, 'calendar', this.defaults, options)) return;
      this.today = new Date();
      this.currentDate = new Date();
      this.selectedDate = null;
      this.MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      this.DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
      this.init();
    }
    defaults = {
      minYear: null,
      maxYear: null,
      onDateSelect: function onDateSelect() {}
    };
    init() {
      this.options.minYear = this.options.minYear || parseInt(this.element.dataset.minYear, 10) || this.today.getFullYear() - 100;
      this.options.maxYear = this.options.maxYear || parseInt(this.element.dataset.maxYear, 10) || this.today.getFullYear() + 10;
      this.element.addEventListener('click', this._handleClick.bind(this));
      this.element.addEventListener('change', this._handleChange.bind(this));
      this.element.classList.add('calendar-initialized');
      this.render();
    }
    render() {
      var calendarEl_ = this;
      this.element.innerHTML = '';
      var calendarEl = document.createElement('div');
      calendarEl.className = 'calendar';
      calendarEl.appendChild(this._createHeader());
      calendarEl.appendChild(this._createGrid());
      this.element.appendChild(calendarEl);
      if (window.lucide) window.lucide.createIcons({
        nodes: [calendarEl]
      });
    }
    _createHeader() {
      var header = document.createElement('div');
      header.className = 'calendar-header';
      var nav = document.createElement('div');
      nav.className = 'calendar-nav';
      nav.appendChild(this._createMonthSelect());
      nav.appendChild(this._createYearSelect());
      var prevButton = this._createNavButton('previous', 'chevron-left');
      var nextButton = this._createNavButton('next', 'chevron-right');
      header.appendChild(prevButton);
      header.appendChild(nav);
      header.appendChild(nextButton);
      return header;
    }
    _createGrid() {
      var table = document.createElement('table');
      table.className = 'calendar-grid';
      var thead = table.createTHead();
      var headRow = thead.insertRow();
      this.DAY_NAMES.forEach(function(day) {
        var th = document.createElement('th');
        th.textContent = day;
        headRow.appendChild(th);
      });
      var tbody = table.createTBody();
      var month = this.currentDate.getMonth();
      var year = this.currentDate.getFullYear();
      var firstDayOfMonth = new Date(year, month, 1);
      var startingDayOfWeek = firstDayOfMonth.getDay();
      var daysInMonth = new Date(year, month + 1, 0).getDate();
      var date = 1;
      for (var i = 0; i < 6; i++) {
        var row = tbody.insertRow();
        for (var j = 0; j < 7; j++) {
          var cell = row.insertCell();
          cell.className = 'calendar-day-cell';
          if (i === 0 && j < startingDayOfWeek) {
            cell.appendChild(this._createDayButton(new Date(year, month, 1 - (startingDayOfWeek - j)), true));
          } else if (date > daysInMonth) {
            cell.appendChild(this._createDayButton(new Date(year, month, date++), true));
          } else {
            cell.appendChild(this._createDayButton(new Date(year, month, date++), false));
          }
        }
        if (date > daysInMonth) {
          break;
        }
      }
      return table;
    }
    _createNavButton(action, icon) {
      var btn = document.createElement('button');
      btn.className = 'calendar-nav-btn';
      btn.dataset.action = action;
      btn.innerHTML = "<i data-lucide=\"".concat(icon, "\"></i>");
      return btn;
    }
    _createDayButton(date, isOutside) {
      var btn = document.createElement('button');
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
      var select = document.createElement('select');
      select.className = 'calendar-select';
      select.dataset.action = 'set-month';
      this.MONTH_NAMES.forEach(function(name, index) {
        var option = document.createElement('option');
        option.value = index;
        option.textContent = name;
        if (index === this.currentDate.getMonth()) {
          option.selected = true;
        }
        select.appendChild(option);
      }.bind(this));
      return select;
    }
    _createYearSelect() {
      var select = document.createElement('select');
      select.className = 'calendar-select';
      select.dataset.action = 'set-year';
      for (var i = this.options.minYear; i <= this.options.maxYear; i++) {
        var option = document.createElement('option');
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
      var navBtn = e.target.closest('.calendar-nav-btn');
      if (navBtn) {
        var newMonth = navBtn.dataset.action === 'previous' ? this.currentDate.getMonth() - 1 : this.currentDate.getMonth() + 1;
        this.currentDate.setMonth(newMonth);
        this.render();
        return;
      }
      var dayBtn = e.target.closest('.calendar-day');
      if (dayBtn) {
        this.selectedDate = new Date(dayBtn.dataset.date);
        if (this.selectedDate.getMonth() !== this.currentDate.getMonth()) {
          this.currentDate = new Date(this.selectedDate);
        }
        this.render();
        this.options.onDateSelect(this.selectedDate);
        this.emit('date-selected', {
          date: this.selectedDate
        });
      }
    }
    _handleChange(e) {
      var selectEl = e.target.closest('.calendar-select');
      if (selectEl) {
        var action = selectEl.dataset.action;
        var value = parseInt(selectEl.value, 10);
        if (action === 'set-month') this.currentDate.setMonth(value);
        else if (action === 'set-year') this.currentDate.setFullYear(value);
        this.render();
      }
    }
    emit(event, data) {
      UI.utils.emitEvent(this.element, event, 'calendar', data);
    }
  }

  class Carousel {
    constructor(element, options) {
      if (!UI.core.initComponent(this, element, 'carousel', this.defaults, options)) return;
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
      this._boundHandlePrev = function() {
        return this.goTo(this.currentIndex - 1, true);
      }.bind(this);
      this._boundHandleNext = function() {
        return this.goTo(this.currentIndex + 1, true);
      }.bind(this);
      this._boundDotHandlers = [];
      this.init();
    }
    defaults = {
      loop: false,
      autoplay: false,
      autoplayDelay: 3000,
      pauseOnHover: true
    };
    init() {
      if (this.items.length <= 1) {
        this.hideControls();
        return;
      }
      this.setupNavigation();
      this.setupDots();
      this.setupAutoplay();
      this.update();
      this.element.classList.add('carousel-initialized');
      this.emit('init', {
        totalItems: this.items.length
      });
    }
    hideControls() {
      if (this.prevButton) this.prevButton.style.display = 'none';
      if (this.nextButton) this.nextButton.style.display = 'none';
      if (this.dotsContainer) this.dotsContainer.style.display = 'none';
    }
    setupNavigation() {
      if (this.prevButton) {
        this.prevButton.addEventListener('click', this._boundHandlePrev);
      }
      if (this.nextButton) {
        this.nextButton.addEventListener('click', this._boundHandleNext);
      }
    }
    setupDots() {
      if (!this.dotsContainer) {
        return;
      }
      this.dotsContainer.innerHTML = '';
      this.dots = [];
      this._boundDotHandlers = [];
      this.items.forEach(function(_, i) {
        var dot = document.createElement('button');
        var handler = function() {
          return this.goTo(i, true);
        }.bind(this);
        dot.classList.add('carousel-dot');
        dot.addEventListener('click', handler);
        this.dotsContainer.appendChild(dot);
        this.dots.push(dot);
        this._boundDotHandlers.push(handler);
      }.bind(this));
    }
    setupAutoplay() {
      if (!this.options.autoplay) {
        return;
      }
      this.startAutoplay();
      if (this.options.pauseOnHover) {
        this.element.addEventListener('mouseenter', function() {
          return this.pauseAutoplay();
        }.bind(this));
        this.element.addEventListener('mouseleave', function() {
          return this.resumeAutoplay();
        }.bind(this));
      }
      this.element.addEventListener('focusin', function() {
        return this.pauseAutoplay();
      }.bind(this));
      this.element.addEventListener('focusout', function() {
        return this.resumeAutoplay();
      }.bind(this));
    }
    startAutoplay() {
      var _this = this;
      if (!this.options.autoplay || this.autoplayTimer) {
        return;
      }
      this.autoplayTimer = setInterval(function() {
        if (!_this.isUserInteracting) {
          var nextIndex = _this.options.loop ? _this.wrapIndex(_this.currentIndex + 1) : Math.min(_this.currentIndex + 1, _this.items.length - 1);
          if (!_this.options.loop && nextIndex === _this.currentIndex) {
            _this.stopAutoplay();
            return;
          }
          _this.goTo(nextIndex, false);
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
      var _this2 = this;
      setTimeout(function() {
        _this2.isUserInteracting = false;
      }, 100);
    }
    goTo(index, isUserAction) {
      var newIndex = this.options.loop ? this.wrapIndex(index) : Math.max(0, Math.min(index, this.items.length - 1));
      if (newIndex !== this.currentIndex) {
        var previousIndex = this.currentIndex;
        this.currentIndex = newIndex;
        this.update();
        if (isUserAction && this.options.autoplay) {
          this.stopAutoplay();
          this.startAutoplay();
        }
        this.emit('slide', {
          currentIndex: this.currentIndex,
          previousIndex: previousIndex,
          currentSlide: this.items[this.currentIndex],
          isUserAction: isUserAction
        });
      }
    }
    wrapIndex(index) {
      var len = this.items.length;
      return (index % len + len) % len;
    }
    next() {
      this.goTo(this.currentIndex + 1, true);
    }
    previous() {
      this.goTo(this.currentIndex - 1, true);
    }
    update() {
      this.content.style.transform = "translateX(".concat(-this.currentIndex * 100, "%)");
      if (this.prevButton) {
        this.prevButton.disabled = !this.options.loop && this.currentIndex === 0;
      }
      if (this.nextButton) {
        this.nextButton.disabled = !this.options.loop && this.currentIndex >= this.items.length - 1;
      }
      this.dots.forEach(function(dot, i) {
        return dot.classList.toggle('is-active', i === this.currentIndex);
      }.bind(this));
    }
    emit(event, data) {
      UI.utils.emitEvent(this.element, event, 'carousel', data);
    }
    destroy() {
      this.stopAutoplay();
      if (this.prevButton) this.prevButton.removeEventListener('click', this._boundHandlePrev);
      if (this.nextButton) this.nextButton.removeEventListener('click', this._boundHandleNext);
      this.dots.forEach(function(dot, i) {
        return dot.removeEventListener('click', this._boundDotHandlers[i]);
      }.bind(this));
      this.element.classList.remove('carousel-initialized');
      delete this.element.carousel;
      this.emit('destroy', {});
    }
  }

  class Combobox {
    constructor(element, options) {
      if (!UI.core.initComponent(this, element, 'combobox', this.defaults, options)) return;
      this.trigger = this.element.querySelector('.combobox-trigger');
      this.triggerText = this.element.querySelector('.combobox-trigger-text');
      this.popoverContent = this.element.querySelector('.popover-content');
      if (!this.trigger || !this.triggerText || !this.popoverContent) return;
      this.isOpen = false;
      this.selectedValue = null;
      this.filteredItems = [];
      this.selectedIndex = -1;
      this.init();
    }
    defaults = {
      placeholder: 'Select an option...',
      searchPlaceholder: 'Search...',
      emptyMessage: 'No results found.',
      items: [],
      groups: [],
      groupHeading: 'Options',
      onSelect: function onSelect() {},
      initialValue: null
    };
    init() {
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
      this.allItems = this.groups.flatMap(function(group) {
        return group.type === 'separator' ? [] : group.items || [];
      });
    }
    setupUI() {
      this.triggerText.textContent = this.options.placeholder;
      this.triggerText.classList.add('combobox-trigger-placeholder');
      this.popoverContent.innerHTML = "\n            <div class=\"combobox-search\">\n                <i data-lucide=\"search\" class=\"combobox-search-icon\"></i>\n                <input type=\"text\" class=\"combobox-search-input\" placeholder=\"".concat(this.options.searchPlaceholder, "\" autocomplete=\"off\">\n            </div>\n            <div class=\"combobox-list\" role=\"listbox\"></div>");
      this.searchInput = this.popoverContent.querySelector('.combobox-search-input');
      this.itemsList = this.popoverContent.querySelector('.combobox-list');
      if (window.lucide) window.lucide.createIcons({
        nodes: [this.popoverContent]
      });
      this.renderItems('');
    }
    setupEvents() {
      this.trigger.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.toggle();
      }.bind(this));
      this.searchInput.addEventListener('input', function(e) {
        this.renderItems(e.target.value);
        this.updateSelectionHighlight(0);
      }.bind(this));
      this.searchInput.addEventListener('keydown', this.handleKeydown.bind(this));
      this.itemsList.addEventListener('mouseleave', function() {
        return this.updateSelectionHighlight(-1);
      }.bind(this));
      document.addEventListener('click', function(e) {
        if (this.isOpen && !this.element.contains(e.target)) this.close();
      }.bind(this));
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
          this.trigger.focus();
        }
      }.bind(this));
    }
    handleKeydown(e) {
      if (!this.isOpen) return;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.updateSelectionHighlight(Math.min(this.selectedIndex + 1, this.filteredItems.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.updateSelectionHighlight(Math.max(this.selectedIndex - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (this.selectedIndex !== -1 && this.filteredItems[this.selectedIndex]) this.selectItem(this.filteredItems[this.selectedIndex]);
          break;
        case 'Escape':
          e.preventDefault();
          this.close();
          this.trigger.focus();
          break;
      }
    }
    renderItems(query) {
      var _this = this;
      if (query === void 0) {
        query = '';
      }
      var normalizedQuery = query.toLowerCase().trim();
      var html = '';
      var hasItems = false;
      this.filteredItems = [];
      this.groups.forEach(function(group) {
        if (group.type === 'separator') {
          if (hasItems) html += '<div class="combobox-separator"></div>';
          return;
        }
        var filteredGroupItems = (group.items || []).filter(function(item) {
          return item.label.toLowerCase().includes(normalizedQuery);
        });
        if (filteredGroupItems.length > 0) {
          if (group.heading && (_this.groups.length > 1 || _this.groups.some(function(g) {
              return g.type === 'separator';
            }))) {
            html += "<div class=\"combobox-group-heading\">".concat(group.heading, "</div>");
          }
          filteredGroupItems.forEach(function(item) {
            var itemIndex = _this.filteredItems.length;
            _this.filteredItems.push(item);
            html += "\n            <div class=\"combobox-item\" \n                 data-value=\"".concat(item.id, "\" \n                 data-index=\"").concat(itemIndex, "\"\n                 role=\"option\" \n                 aria-selected=\"false\">\n              ").concat(item.icon ? "<i data-lucide=\"".concat(item.icon, "\" class=\"combobox-item-icon\"></i>") : '', "\n              <span class=\"combobox-item-label\">").concat(item.label, "</span>\n              ").concat(item.shortcut ? "<span class=\"combobox-item-shortcut\">".concat(item.shortcut, "</span>") : '', "\n            </div>\n          ");
          });
          hasItems = true;
        }
      });
      if (!hasItems) html = "<div class=\"combobox-empty\">".concat(this.options.emptyMessage, "</div>");
      this.itemsList.innerHTML = html;
      this.itemsList.querySelectorAll('.combobox-item').forEach(function(itemEl) {
        itemEl.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          var item = _this.filteredItems.find(function(i) {
            return i.id === itemEl.dataset.value;
          });
          if (item) _this.selectItem(item);
        });
        itemEl.addEventListener('mouseenter', function() {
          return _this.updateSelectionHighlight(parseInt(itemEl.dataset.index));
        });
      });
      if (window.lucide) window.lucide.createIcons({
        nodes: [this.itemsList]
      });
      this.selectedIndex = -1;
    }
    updateSelectionHighlight(index) {
      this.selectedIndex = index;
      this.itemsList.querySelectorAll('.combobox-item').forEach(function(itemEl) {
        return itemEl.classList.remove('combobox-item-selected');
      });
      if (index >= 0 && index < this.filteredItems.length) {
        var selectedElement = this.itemsList.querySelector("[data-index=\"".concat(index, "\"]"));
        if (selectedElement) {
          selectedElement.classList.add('combobox-item-selected');
          selectedElement.scrollIntoView({
            block: 'nearest'
          });
        }
      }
    }
    selectItem(item) {
      this.selectedValue = item;
      this.triggerText.textContent = item.label;
      this.triggerText.classList.remove('combobox-trigger-placeholder');
      this.close();
      setTimeout(function() {
        return this.trigger.focus();
      }.bind(this), 100);
      this.options.onSelect(item);
      this.emit('select', {
        item: item
      });
    }
    setInitialValue() {
      var _this$options$initial;
      if (this.options.initialValue) {
        var item = this.allItems.find(function(item) {
          return item.id === this.options.initialValue;
        }.bind(this));
        if (item) {
          this.selectedValue = item;
          this.triggerText.textContent = item.label;
          this.triggerText.classList.remove('combobox-trigger-placeholder');
        }
      }
    }
    open() {
      if (this.isOpen) return;
      document.querySelectorAll('.combobox-initialized').forEach(function(el) {
        var _el$combobox;
        if (el !== this.element && (_el$combobox = el.combobox) !== null && _el$combobox !== void 0 && _el$combobox.isOpen) el.combobox.close();
      }.bind(this));
      this.isOpen = true;
      this.popoverContent.style.display = 'block';
      this.element.setAttribute('data-state', 'open');
      setTimeout(function() {
        this.searchInput.focus();
        if (this.filteredItems.length > 0) this.updateSelectionHighlight(0);
      }.bind(this), 50);
      this.emit('open');
    }
    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.element.setAttribute('data-state', 'closed');
      setTimeout(function() {
        this.popoverContent.style.display = 'none';
        this.searchInput.value = '';
        this.renderItems('');
      }.bind(this), 150);
      this.emit('close');
    }
    toggle() {
      this.isOpen ? this.close() : this.open();
    }
    emit(event, data) {
      UI.utils.emitEvent(this.element, event, 'combobox', data);
    }
    destroy() {
      this.element.classList.remove('combobox-initialized');
      delete this.element.combobox;
      this.emit('destroy');
    }
  }

  class Command {
    constructor(element, options) {
      if (!UI.core.initComponent(this, element, 'command', this.defaults, options)) return;
      this.groupsData = this.options.groups || [];
      this.filteredItems = [];
      this.selectedIndex = -1;
      this._boundHandlers = {
        input: function(e) {
          return this._handleInput(e);
        }.bind(this),
        keydown: function(e) {
          return this._handleKeydown(e);
        }.bind(this),
        mouseleave: function() {
          return this._updateSelectionHighlight(-1);
        }.bind(this)
      };
      this.init();
    }
    defaults = {
      groups: [],
      onSelect: function onSelect() {},
      placeholder: 'Type a command or search...',
      emptyMessage: 'No results found.'
    };
    init() {
      this._render();
      this._initEventListeners();
      this.element.classList.add('command-initialized');
      this.emit('init');
    }
    _render() {
      this.element.innerHTML = "\n            <div class=\"command-input-wrapper\">\n                <i data-lucide=\"search\" class=\"command-search-icon\"></i>\n                <input type=\"text\" class=\"command-input\" placeholder=\"".concat(this.options.placeholder, "\" autocomplete=\"off\" autocorrect=\"off\" spellcheck=\"false\">\n            </div>\n            <div class=\"command-list js-scroll-area\"></div>");
      this.input = this.element.querySelector('.command-input');
      this.list = this.element.querySelector('.command-list');
      this._renderListContent();
      this._renderEmptyState();
      if (window.lucide) window.lucide.createIcons({
        nodes: [this.element]
      });
    }
    _renderListContent() {
      this.groupsData.forEach(function(groupData) {
        if (groupData.type === 'separator') {
          var separatorEl = document.createElement('div');
          separatorEl.className = 'command-separator';
          this.list.appendChild(separatorEl);
          return;
        }
        var groupEl = document.createElement('div');
        groupEl.className = 'command-group';
        groupEl.innerHTML = "<div class=\"command-group-heading\">".concat(groupData.heading, "</div>");
        groupData.items.forEach(function(itemData) {
          var itemEl = document.createElement('div');
          itemEl.className = 'command-item';
          itemEl.dataset.id = itemData.id;
          itemEl.setAttribute('role', 'option');
          itemEl.setAttribute('aria-selected', 'false');
          itemEl.innerHTML = "<i data-lucide=\"".concat(itemData.icon, "\" class=\"command-item-icon\"></i><span>").concat(itemData.label, "</span>").concat(itemData.shortcut ? "<div class=\"command-shortcut\">".concat(itemData.shortcut, "</div>") : '');
          itemEl._itemData = itemData;
          groupEl.appendChild(itemEl);
        });
        this.list.appendChild(groupEl);
      }.bind(this));
    }
    _renderEmptyState() {
      var emptyEl = document.createElement('div');
      emptyEl.className = 'command-empty';
      emptyEl.textContent = this.options.emptyMessage;
      emptyEl.style.display = 'none';
      this.list.appendChild(emptyEl);
    }
    _initEventListeners() {
      this.input.addEventListener('input', this._boundHandlers.input);
      this.input.addEventListener('keydown', this._boundHandlers.keydown);
      this.list.addEventListener('mouseleave', this._boundHandlers.mouseleave);
      this.list.querySelectorAll('.command-item').forEach(function(item) {
        item.addEventListener('click', function() {
          this.options.onSelect(item._itemData);
          this.emit('select', {
            item: item._itemData
          });
        }.bind(this));
        item.addEventListener('mouseenter', function() {
          var index = this.filteredItems.indexOf(item);
          if (index > -1) this._updateSelectionHighlight(index);
        }.bind(this));
      }.bind(this));
      this._filter('');
    }
    _handleInput(e) {
      this._filter(e.target.value);
    }
    _handleKeydown(e) {
      if (!['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.key)) return;
      e.preventDefault();
      switch (e.key) {
        case 'ArrowDown':
          this._updateSelectionHighlight(Math.min(this.selectedIndex + 1, this.filteredItems.length - 1));
          break;
        case 'ArrowUp':
          this._updateSelectionHighlight(Math.max(this.selectedIndex - 1, 0));
          break;
        case 'Enter':
          if (this.selectedIndex !== -1 && this.filteredItems[this.selectedIndex]) this.filteredItems[this.selectedIndex].click();
          break;
        case 'Escape':
          this.close();
          break;
      }
    }
    _filter(query) {
      var normalizedQuery = query.toLowerCase().trim();
      var hasVisibleItems = false;
      this.element.querySelectorAll('.command-group').forEach(function(groupEl) {
        var groupHasVisibleItems = false;
        groupEl.querySelectorAll('.command-item').forEach(function(itemEl) {
          var isVisible = itemEl.textContent.toLowerCase().includes(normalizedQuery);
          itemEl.style.display = isVisible ? '' : 'none';
          if (isVisible) {
            groupHasVisibleItems = true;
            hasVisibleItems = true;
          }
        });
        groupEl.style.display = groupHasVisibleItems ? '' : 'none';
      });
      this.element.querySelector('.command-empty').style.display = hasVisibleItems ? 'none' : 'block';
      this.filteredItems = Array.from(this.element.querySelectorAll('.command-item')).filter(function(item) {
        return item.style.display !== 'none';
      });
      this._updateSelectionHighlight(this.filteredItems.length > 0 ? 0 : -1);
    }
    _updateSelectionHighlight(index) {
      this.selectedIndex = index;
      this.element.querySelectorAll('.command-item').forEach(function(item) {
        return item.setAttribute('aria-selected', 'false');
      });
      if (this.selectedIndex > -1 && this.filteredItems[this.selectedIndex]) {
        var selectedItem = this.filteredItems[this.selectedIndex];
        selectedItem.setAttribute('aria-selected', 'true');
        selectedItem.scrollIntoView({
          block: 'nearest'
        });
      }
    }
    close() {
      this.emit('close');
    }
    emit(event, data) {
      UI.utils.emitEvent(this.element, event, 'command', data);
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

  class ContextMenu {
    static _instances = new Set();
    constructor(element, options) {
      if (!UI.core.initComponent(this, element, 'contextMenu', this.defaults, options)) return;
      this.trigger = this.element.querySelector('[data-context-menu-trigger]');
      this.content = this.element.querySelector('.context-menu-content');
      if (!this.trigger || !this.content) return;
      this.isOpen = false;
      this.submenuCloseTimer = null;
      this._boundHandlers = {
        trigger: this._handleTrigger.bind(this),
        outsideClick: this._handleOutsideClick.bind(this),
        keydown: function(e) {
          if (e.key === 'Escape') this.close();
        }.bind(this)
      };
      this.init();
      ContextMenu._instances.add(this);
    }
    defaults = {
      closeOnItemClick: true,
      submenuDelay: 100
    };
    init() {
      this.content.style.position = 'fixed';
      this.content.setAttribute('data-state', 'closed');
      this.trigger.addEventListener('contextmenu', this._boundHandlers.trigger);
      this.element.querySelectorAll('.context-menu-item, .context-menu-checkbox-item, .context-menu-radio-item').forEach(function(item) {
        item.addEventListener('click', function(e) {
          e.stopPropagation();
          this._handleItemClick(item);
        }.bind(this));
      }.bind(this));
      this.element.querySelectorAll('.context-menu-sub').forEach(function(sub) {
        sub.addEventListener('mouseenter', function() {
          return this._handleSubmenuEnter(sub);
        }.bind(this));
        sub.addEventListener('mouseleave', function() {
          return this._handleSubmenuLeave(sub);
        }.bind(this));
      }.bind(this));
      this.content.addEventListener('mouseover', function(e) {
        if (!e.target.closest('.context-menu-sub')) this._closeAllSubmenus();
      }.bind(this));
      this.element.classList.add('context-menu-initialized');
      this.emit('init');
    }
    open(x, y) {
      if (this.isOpen) return;
      this.isOpen = true;
      var _UI$utils$positionEle = UI.utils.positionElement({
          getBoundingClientRect: function getBoundingClientRect() {
            return {
              top: y,
              left: x,
              bottom: y,
              right: x,
              width: 0,
              height: 0
            };
          }
        }, this.content, {
          side: 'right',
          align: 'start',
          sideOffset: 0
        }),
        top = _UI$utils$positionEle.top,
        left = _UI$utils$positionEle.left;
      this.content.style.top = "".concat(top, "px");
      this.content.style.left = "".concat(left, "px");
      this.content.setAttribute('data-state', 'open');
      setTimeout(function() {
        document.addEventListener('click', this._boundHandlers.outsideClick);
        document.addEventListener('keydown', this._boundHandlers.keydown);
      }.bind(this), 0);
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
      if (this.isOpen && !this.content.contains(e.target)) this.close();
    }
    _handleItemClick(item) {
      if (item.getAttribute('data-disabled') === 'true') return;
      if (item.classList.contains('context-menu-checkbox-item')) {
        var isChecked = item.getAttribute('aria-checked') === 'true';
        item.setAttribute('aria-checked', String(!isChecked));
      } else if (item.classList.contains('context-menu-radio-item')) {
        var group = item.closest('.context-menu-radio-group');
        if (group) group.querySelectorAll('.context-menu-radio-item').forEach(function(radio) {
          radio.setAttribute('aria-checked', 'false');
        });
        item.setAttribute('aria-checked', 'true');
      }
      if (this.options.closeOnItemClick) this.close();
    }
    _handleSubmenuEnter(sub) {
      clearTimeout(this.submenuCloseTimer);
      var trigger = sub.querySelector('.context-menu-sub-trigger');
      var content = sub.querySelector('.context-menu-sub-content');
      if (trigger && content) this._openSubmenu(trigger, content);
    }
    _handleSubmenuLeave(sub) {
      var _this = this;
      var content = sub.querySelector('.context-menu-sub-content');
      this.submenuCloseTimer = setTimeout(function() {
        if (content) content.setAttribute('data-state', 'closed');
      }, this.options.submenuDelay);
    }
    _openSubmenu(trigger, content) {
      this._closeAllSubmenus(content);
      content.setAttribute('data-state', 'open');
      var _UI$utils$positionEle = UI.utils.positionElement(trigger, content, {
          side: 'right',
          align: 'start',
          sideOffset: -4,
          viewportPadding: 8
        }),
        top = _UI$utils$positionEle.top,
        left = _UI$utils$positionEle.left;
      Object.assign(content.style, {
        top: "".concat(top, "px"),
        left: "".concat(left, "px"),
        position: 'fixed'
      });
    }
    _closeAllSubmenus(exclude) {
      this.element.querySelectorAll('.context-menu-sub-content').forEach(function(sub) {
        if (sub !== exclude) sub.setAttribute('data-state', 'closed');
      });
    }
    emit(event, data) {
      UI.utils.emitEvent(this.element, event, 'contextMenu', data);
    }
    destroy() {
      this.trigger.removeEventListener('contextmenu', this._boundHandlers.trigger);
      this.element.classList.remove('context-menu-initialized');
      delete this.element.contextMenu;
      ContextMenu._instances["delete"](this);
      this.emit('destroy');
    }
    static closeAll(exclude) {
      var _iteratorNormalCompletion = true,
        _didIteratorError = false,
        _iteratorError = undefined;
      try {
        for (var _iterator = ContextMenu._instances[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var instance = _step.value;
          if (instance !== exclude) {
            instance.close();
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }

  class Dialog {
    constructor(element, options) {
      if (!UI.core.initComponent(this, element, 'dialog', this.defaults, options)) return;
      this.overlay = this.element.querySelector('.dialog-overlay');
      this.content = this.element.querySelector('.dialog-content');
      if (!this.overlay || !this.content) return;
      this.closeButtons = this.element.querySelectorAll('[data-dialog-close]');
      this.isOpen = false;
      this.lastActiveElement = null;
      this._boundHandlers = {
        close: this.close.bind(this),
        keydown: this._handleKeydown.bind(this),
        overlayClick: function(e) {
          if (e.target === this.overlay) this.close();
        }.bind(this)
      };
      this.init();
    }
    defaults = {
      closeOnOverlayClick: true,
      closeOnEscape: true,
      trapFocus: true,
      lockBodyScroll: true,
      restoreFocus: true
    };
    init() {
      this.element.setAttribute('role', 'dialog');
      this.element.setAttribute('aria-modal', 'true');
      this.element.setAttribute('aria-hidden', 'true');
      this.content.setAttribute('tabindex', '-1');
      this.element.style.display = 'none';
      if (this.element.classList.contains('dialog-no-overlay-close')) this.options.closeOnOverlayClick = false;
      if (this.element.classList.contains('dialog-no-escape')) this.options.closeOnEscape = false;
      if (this.element.classList.contains('dialog-no-focus-trap')) this.options.trapFocus = false;
      this.element.classList.add('dialog-initialized');
      this.emit('init');
    }
    open() {
      var _this = this;
      if (this.isOpen) return;
      this.isOpen = true;
      if (this.options.restoreFocus) this.lastActiveElement = document.activeElement;
      this.element.style.display = 'flex';
      if (this.options.lockBodyScroll) UI.utils.lockBodyScroll(true);
      this.element.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(function() {
        _this.element.setAttribute('data-state', 'open');
        _this._addEventListeners();
        var firstFocusable = _this.content.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        (firstFocusable || _this.content).focus();
      });
      this.emit('open');
    }
    close() {
      var _this2 = this;
      if (!this.isOpen) return;
      this.isOpen = false;
      this.element.setAttribute('data-state', 'closed');
      this._removeEventListeners();
      setTimeout(function() {
        _this2.element.style.display = 'none';
        if (_this2.options.lockBodyScroll) UI.utils.lockBodyScroll(false);
        if (_this2.options.restoreFocus && _this2.lastActiveElement) _this2.lastActiveElement.focus();
        _this2.lastActiveElement = null;
      }, 200);
      this.emit('close');
    }
    toggle() {
      this.isOpen ? this.close() : this.open();
    }
    _addEventListeners() {
      this.closeButtons.forEach(function(btn) {
        btn.addEventListener('click', this._boundHandlers.close);
      }.bind(this));
      if (this.options.closeOnOverlayClick) this.overlay.addEventListener('click', this._boundHandlers.overlayClick);
      document.addEventListener('keydown', this._boundHandlers.keydown);
    }
    _removeEventListeners() {
      this.closeButtons.forEach(function(btn) {
        btn.removeEventListener('click', this._boundHandlers.close);
      }.bind(this));
      this.overlay.removeEventListener('click', this._boundHandlers.overlayClick);
      document.removeEventListener('keydown', this._boundHandlers.keydown);
    }
    _handleKeydown(e) {
      if (e.key === 'Escape' && this.options.closeOnEscape) {
        e.preventDefault();
        this.close();
      } else if (e.key === 'Tab' && this.options.trapFocus) {
        UI.utils.trapFocus(this.content, e);
      }
    }
    emit(event, data) {
      UI.utils.emitEvent(this.element, event, 'dialog', data);
    }
    destroy() {
      if (this.isOpen) this.close();
      this._removeEventListeners();
      this.element.classList.remove('dialog-initialized');
      delete this.element.dialog;
      this.emit('destroy');
    }
  }

  class DropdownMenu {
    static _instances = new Set();
    constructor(element, options) {
      if (!UI.core.initComponent(this, element, 'dropdownMenu', this.defaults, options)) return;
      this.trigger = this.element.querySelector('.dropdown-menu-trigger');
      this.content = this.element.querySelector('.dropdown-menu-content');
      if (!this.trigger || !this.content) return;
      this.isOpen = false;
      this.isPortaled = this.element.querySelector('.dropdown-menu-portal') !== null;
      this.originalParent = this.content.parentElement;
      this.submenuCloseTimer = null;
      this._boundHandlers = {
        triggerClick: this.toggle.bind(this),
        outsideClick: function(e) {
          if (this.isOpen && !this.element.contains(e.target)) this.close();
        }.bind(this),
        keydown: function(e) {
          if (e.key === 'Escape') this.close();
        }.bind(this),
        contentMouseover: function(e) {
          if (!e.target.closest('.dropdown-menu-sub')) this._closeAllSubmenus();
        }.bind(this)
      };
      this.init();
      DropdownMenu._instances.add(this);
    }
    defaults = {
      closeOnSelect: true,
      side: 'bottom',
      align: 'start',
      sideOffset: 4,
      viewportPadding: 8,
      submenuDelay: 100
    };
    init() {
      this._applyClassBasedSettings();
      this.content.setAttribute('data-state', 'closed');
      this.trigger.addEventListener('click', this._boundHandlers.triggerClick);
      this.content.addEventListener('mouseover', this._boundHandlers.contentMouseover);
      this.content.addEventListener('click', function(e) {
        return this._handleItemClick(e);
      }.bind(this));
      this.element.querySelectorAll('.dropdown-menu-sub').forEach(function(sub) {
        return this._setupSubmenu(sub);
      }.bind(this));
      this.element.classList.add('dropdown-menu-initialized');
      this.emit('init');
    }
    toggle() {
      this.isOpen ? this.close() : this.open();
    }
    open() {
      if (this.isOpen) return;
      DropdownMenu.closeAllExcept(this);
      this.isOpen = true;
      if (this.isPortaled) document.body.appendChild(this.content);
      this.content.setAttribute('data-state', 'open');
      this._positionContent();
      this._addGlobalListeners();
      this.emit('open');
    }
    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.content.setAttribute('data-state', 'closed');
      this._closeAllSubmenus();
      this._removeGlobalListeners();
      if (this.isPortaled && this.content.parentElement === document.body) {
        setTimeout(function() {
          return this.originalParent.appendChild(this.content);
        }.bind(this), 150);
      }
      this.emit('close');
    }
    _applyClassBasedSettings() {
      if (this.element.classList.contains('dropdown-menu-top')) this.options.side = 'top';
      if (this.element.classList.contains('dropdown-menu-left')) this.options.side = 'left';
      if (this.element.classList.contains('dropdown-menu-right')) this.options.side = 'right';
      if (this.element.classList.contains('dropdown-menu-align-center')) this.options.align = 'center';
      if (this.element.classList.contains('dropdown-menu-align-end')) this.options.align = 'end';
    }
    _setupSubmenu(sub) {
      var _this = this;
      var trigger = sub.querySelector('.dropdown-menu-sub-trigger');
      var content = sub.querySelector('.dropdown-menu-sub-content');
      if (trigger && content) {
        content.setAttribute('data-state', 'closed');
        sub.addEventListener('mouseenter', function() {
          clearTimeout(_this.submenuCloseTimer);
          _this._openSubmenu(trigger, content);
        });
        sub.addEventListener('mouseleave', function() {
          _this.submenuCloseTimer = setTimeout(function() {
            return content.setAttribute('data-state', 'closed');
          }, _this.options.submenuDelay);
        });
      }
    }
    _handleItemClick(e) {
      var item = e.target.closest('.dropdown-menu-item, .dropdown-menu-checkbox-item, .dropdown-menu-radio-item');
      if (!item || item.hasAttribute('data-disabled')) return;
      if (item.classList.contains('dropdown-menu-checkbox-item')) {
        var isChecked = item.getAttribute('aria-checked') === 'true';
        item.setAttribute('aria-checked', String(!isChecked));
      } else if (item.classList.contains('dropdown-menu-radio-item')) {
        var group = item.closest('.dropdown-menu-radio-group');
        group === null || group === void 0 ? void 0 : group.querySelectorAll('.dropdown-menu-radio-item').forEach(function(radio) {
          radio.setAttribute('aria-checked', 'false');
        });
        item.setAttribute('aria-checked', 'true');
      }
      var keepOpen = item.closest('.dropdown-menu-sub-content') || item.matches('.dropdown-menu-checkbox-item, .dropdown-menu-radio-item');
      this.emit('select', {
        item: item
      });
      if (!keepOpen && this.options.closeOnSelect) {
        this.close();
      }
    }
    _addGlobalListeners() {
      setTimeout(function() {
        document.addEventListener('click', this._boundHandlers.outsideClick);
        document.addEventListener('keydown', this._boundHandlers.keydown);
      }.bind(this), 0);
    }
    _removeGlobalListeners() {
      document.removeEventListener('click', this._boundHandlers.outsideClick);
      document.removeEventListener('keydown', this._boundHandlers.keydown);
    }
    _positionContent() {
      var _UI$utils$positionEle = UI.utils.positionElement(this.trigger, this.content, this.options),
        top = _UI$utils$positionEle.top,
        left = _UI$utils$positionEle.left;
      Object.assign(this.content.style, {
        top: "".concat(top, "px"),
        left: "".concat(left, "px"),
        position: 'fixed'
      });
    }
    _openSubmenu(trigger, content) {
      this._closeAllSubmenus(content);
      content.setAttribute('data-state', 'open');
      var _UI$utils$positionEle2 = UI.utils.positionElement(trigger, content, {
          side: 'right',
          align: 'start',
          sideOffset: -4,
          viewportPadding: 8
        }),
        top = _UI$utils$positionEle2.top,
        left = _UI$utils$positionEle2.left;
      Object.assign(content.style, {
        top: "".concat(top, "px"),
        left: "".concat(left, "px"),
        position: 'fixed'
      });
    }
    _closeAllSubmenus(exclude) {
      this.element.querySelectorAll('.dropdown-menu-sub-content').forEach(function(sub) {
        if (sub !== exclude) sub.setAttribute('data-state', 'closed');
      });
    }
    emit(event, data) {
      UI.utils.emitEvent(this.element, event, 'dropdownMenu', data);
    }
    destroy() {
      clearTimeout(this.submenuCloseTimer);
      this._removeGlobalListeners();
      this.trigger.removeEventListener('click', this._boundHandlers.triggerClick);
      this.element.classList.remove('dropdown-menu-initialized');
      delete this.element.dropdownMenu;
      DropdownMenu._instances["delete"](this);
      this.emit('destroy');
    }
    static closeAllExcept(instanceToKeepOpen) {
      var _iteratorNormalCompletion = true,
        _didIteratorError = false,
        _iteratorError = undefined;
      try {
        for (var _iterator = DropdownMenu._instances[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var instance = _step.value;
          if (instance && instance !== instanceToKeepOpen) {
            instance.close();
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }

  class HoverCard {
    constructor(element, options) {
      if (!UI.core.initComponent(this, element, 'hoverCard', this.defaults, options)) return;
      this.trigger = this.element.querySelector('.hover-card-trigger');
      this.content = this.element.querySelector('.hover-card-content');
      if (!this.trigger || !this.content) return;
      this.isOpen = false;
      this.openTimer = null;
      this.closeTimer = null;
      this._boundHandlers = {
        triggerEnter: this._handleTriggerEnter.bind(this),
        triggerLeave: this._handleTriggerLeave.bind(this),
        contentEnter: function() {
          return clearTimeout(this.closeTimer);
        }.bind(this),
        contentLeave: this._startCloseTimer.bind(this),
        resize: function() {
          if (this.isOpen) this._positionContent();
        }.bind(this)
      };
      this.init();
    }
    defaults = {
      openDelay: 100,
      closeDelay: 300,
      position: 'auto',
      offset: 8
    };
    init() {
      this.content.style.position = 'fixed';
      this.content.style.display = 'none';
      this.content.setAttribute('data-state', 'closed');
      this.trigger.addEventListener('mouseenter', this._boundHandlers.triggerEnter);
      this.trigger.addEventListener('mouseleave', this._boundHandlers.triggerLeave);
      this.content.addEventListener('mouseenter', this._boundHandlers.contentEnter);
      this.content.addEventListener('mouseleave', this._boundHandlers.contentLeave);
      window.addEventListener('resize', this._boundHandlers.resize);
      this.element.classList.add('hover-card-initialized');
      this.emit('init');
    }
    open() {
      if (this.isOpen) return;
      this.isOpen = true;
      this.content.style.display = 'block';
      this._positionContent();
      this.content.setAttribute('data-state', 'open');
      this.emit('open');
    }
    close() {
      var _this = this;
      if (!this.isOpen) return;
      this.isOpen = false;
      clearTimeout(this.openTimer);
      clearTimeout(this.closeTimer);
      this.content.setAttribute('data-state', 'closed');
      setTimeout(function() {
        if (!_this.isOpen) _this.content.style.display = 'none';
      }, 150);
      this.emit('close');
    }
    _handleTriggerEnter() {
      clearTimeout(this.closeTimer);
      if (!this.isOpen) {
        this.openTimer = setTimeout(this.open.bind(this), this.options.openDelay);
      }
    }
    _handleTriggerLeave() {
      clearTimeout(this.openTimer);
      this._startCloseTimer();
    }
    _startCloseTimer() {
      this.closeTimer = setTimeout(this.close.bind(this), this.options.closeDelay);
    }
    _positionContent() {
      var _UI$utils$positionEle = UI.utils.positionElement(this.trigger, this.content, {
          side: this._getSideFromClass(),
          sideOffset: this.options.offset,
          align: 'center'
        }),
        top = _UI$utils$positionEle.top,
        left = _UI$utils$positionEle.left;
      this.content.style.top = "".concat(top, "px");
      this.content.style.left = "".concat(left, "px");
    }
    _getSideFromClass() {
      if (this.element.classList.contains('hover-card-top')) return 'top';
      if (this.element.classList.contains('hover-card-bottom')) return 'bottom';
      if (this.element.classList.contains('hover-card-left')) return 'left';
      if (this.element.classList.contains('hover-card-right')) return 'right';
      return 'bottom';
    }
    emit(event, data) {
      UI.utils.emitEvent(this.element, event, 'hoverCard', data);
    }
    destroy() {
      clearTimeout(this.openTimer);
      clearTimeout(this.closeTimer);
      this.trigger.removeEventListener('mouseenter', this._boundHandlers.triggerEnter);
      this.trigger.removeEventListener('mouseleave', this._boundHandlers.triggerLeave);
      this.content.removeEventListener('mouseenter', this._boundHandlers.contentEnter);
      this.content.removeEventListener('mouseleave', this._boundHandlers.contentLeave);
      window.removeEventListener('resize', this._boundHandlers.resize);
      this.element.classList.remove('hover-card-initialized');
      delete this.element.hoverCard;
      this.emit('destroy');
    }
  }

  class InputOTP {
    constructor(element, options) {
      if (!UI.core.initComponent(this, element, 'inputOTP', this.defaults, options)) return;
      this.slots = Array.from(this.element.querySelectorAll('.input-otp-slot'));
      if (this.slots.length === 0) return;
      this._boundHandlers = {
        keydown: function(e) {
          return this._onKeyDown(e);
        }.bind(this),
        input: function(e) {
          return this._onInput(e);
        }.bind(this),
        paste: function(e) {
          return this._onPaste(e);
        }.bind(this),
        focusin: function(e) {
          return e.target.select();
        },
        click: function(e) {
          return this._onClick(e);
        }.bind(this)
      };
      this.init();
    }
    defaults = {
      onComplete: function onComplete() {},
      onValueChange: function onValueChange() {}
    };
    init() {
      this.element.addEventListener('keydown', this._boundHandlers.keydown);
      this.element.addEventListener('input', this._boundHandlers.input);
      this.element.addEventListener('paste', this._boundHandlers.paste);
      this.element.addEventListener('focusin', this._boundHandlers.focusin);
      this.element.addEventListener('click', this._boundHandlers.click);
      this.element.classList.add('input-otp-initialized');
      this.emit('init');
    }
    _onKeyDown(e) {
      var target = e.target;
      if (!target.matches('.input-otp-slot')) return;
      var index = this.slots.indexOf(target);
      if (e.key === 'Backspace') {
        e.preventDefault();
        if (target.value === '' && index > 0) {
          this.slots[index - 1].focus();
        } else {
          target.value = '';
          this._updateValue();
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        this.slots[index - 1].focus();
      } else if (e.key === 'ArrowRight' && index < this.slots.length - 1) {
        this.slots[index + 1].focus();
      }
    }
    _onInput(e) {
      var target = e.target;
      if (!target.matches('.input-otp-slot')) return;
      var index = this.slots.indexOf(target);
      if (target.value && index < this.slots.length - 1) {
        this.slots[index + 1].focus();
      }
      this._updateValue();
    }
    _onPaste(e) {
      var _this = this;
      e.preventDefault();
      var pastedData = e.clipboardData.getData('text').trim().slice(0, this.slots.length);
      pastedData.split('').forEach(function(char, i) {
        if (_this.slots[i]) _this.slots[i].value = char;
      });
      var nextFocusIndex = Math.min(pastedData.length, this.slots.length - 1);
      this.slots[nextFocusIndex].focus();
      this._updateValue();
    }
    _onClick(e) {
      var _this$slots$find;
      if (e.target.matches('.input-otp-slot')) {
        e.preventDefault();
        (_this$slots$find = this.slots.find(function(slot) {
          return !slot.value;
        })) !== null && _this$slots$find !== void 0 ? _this$slots$find : this.slots[this.slots.length - 1].focus();
      }
    }
    _updateValue() {
      var value = this.slots.map(function(slot) {
        return slot.value;
      }).join('');
      this.options.onValueChange(value);
      this.emit('value-change', {
        value: value
      });
      if (value.length === this.slots.length) {
        this.options.onComplete(value);
        this.emit('complete', {
          value: value
        });
      }
    }
    emit(event, data) {
      UI.utils.emitEvent(this.element, event, 'inputOTP', data);
    }
    destroy() {
      this.element.removeEventListener('keydown', this._boundHandlers.keydown);
      this.element.removeEventListener('input', this._boundHandlers.input);
      this.element.removeEventListener('paste', this._boundHandlers.paste);
      this.element.removeEventListener('focusin', this._boundHandlers.focusin);
      this.element.removeEventListener('click', this._boundHandlers.click);
      this.element.classList.remove('input-otp-initialized');
      delete this.element.inputOTP;
      this.emit('destroy');
    }
  }

  class Menubar {
    constructor(element, options) {
      if (!UI.core.initComponent(this, element, 'menubar', this.defaults, options)) return;
      this.activeMenu = null;
      this.menus = Array.from(this.element.querySelectorAll('.menubar-menu')).map(function(el) {
        return new MenubarMenu(this, el);
      }.bind(this));
      this._boundHandlers = {
        keydown: function(e) {
          if (e.key === 'Escape' && this.activeMenu) this.closeAllMenus();
        }.bind(this),
        click: function(e) {
          if (this.activeMenu && !this.element.contains(e.target)) this.closeAllMenus();
        }.bind(this)
      };
      this.init();
    }
    defaults = {
      closeOnEscape: true,
      closeOnOutsideClick: true
    };
    init() {
      this.element.setAttribute('role', 'menubar');
      document.addEventListener('keydown', this._boundHandlers.keydown);
      document.addEventListener('click', this._boundHandlers.click);
      this.element.classList.add('menubar-initialized');
      this.emit('init');
    }
    openMenu(menuToOpen) {
      if (this.activeMenu && this.activeMenu !== menuToOpen) this.activeMenu.close();
      this.activeMenu = menuToOpen;
      this.activeMenu.open();
      this.emit('menu-open', {
        menu: menuToOpen
      });
    }
    closeAllMenus() {
      if (this.activeMenu) {
        this.activeMenu.close();
        this.activeMenu = null;
        this.emit('menu-close-all');
      }
    }
    emit(event, data) {
      UI.utils.emitEvent(this.element, event, 'menubar', data);
    }
    destroy() {
      this.closeAllMenus();
      document.removeEventListener('keydown', this._boundHandlers.keydown);
      document.removeEventListener('click', this._boundHandlers.click);
      this.menus.forEach(function(menu) {
        return menu.destroy();
      });
      this.element.classList.remove('menubar-initialized');
      delete this.element.menubar;
      this.emit('destroy');
    }
  }

  class MenubarMenu {
    constructor(controller, element) {
      this.controller = controller;
      this.element = element;
      this.trigger = element.querySelector('.menubar-trigger');
      this.content = element.querySelector('.menubar-content');
      if (!this.trigger || !this.content) return;
      this.init();
    }
    init() {
      this.trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        this.controller.activeMenu === this ? this.controller.closeAllMenus() : this.controller.openMenu(this);
      }.bind(this));
      this.trigger.addEventListener('mouseenter', function() {
        if (this.controller.activeMenu && this.controller.activeMenu !== this) this.controller.openMenu(this);
      }.bind(this));
      this.content.addEventListener('click', function(e) {
        if (!e.target.closest('.menubar-sub')) this.controller.closeAllMenus();
      }.bind(this));
    }
    open() {
      this.element.setAttribute('data-state', 'open');
      this.content.setAttribute('data-state', 'open');
      this._positionContent();
    }
    close() {
      this.element.setAttribute('data-state', 'closed');
      this.content.setAttribute('data-state', 'closed');
    }
    _positionContent() {
      var _UI$utils$positionEle = UI.utils.positionElement(this.trigger, this.content, {
          side: 'bottom',
          align: 'start'
        }),
        top = _UI$utils$positionEle.top,
        left = _UI$utils$positionEle.left;
      Object.assign(this.content.style, {
        top: "".concat(top, "px"),
        left: "".concat(left, "px"),
        position: 'fixed'
      });
    }
    destroy() {}
  }

  class NavigationMenu {
    constructor(element, options) {
      if (!UI.core.initComponent(this, element, 'navigationMenu', this.defaults, options)) return;
      this.triggers = Array.from(this.element.querySelectorAll(this.options.triggerSelector));
      this.panel = this.element.querySelector(this.options.panelSelector);
      this.contents = Array.from(this.element.querySelectorAll(this.options.contentSelector));
      if (!this.panel || this.triggers.length === 0 || this.contents.length === 0) return;
      this.activeIndex = -1;
      this.closeTimer = null;
      this._boundHandlers = {
        outsideClick: function(e) {
          if (this.activeIndex !== -1 && !this.element.contains(e.target)) this.close();
        }.bind(this),
        rootEnter: function() {
          return clearTimeout(this.closeTimer);
        }.bind(this),
        rootLeave: function() {
          return this.closeTimer = setTimeout(function() {
            return this.close();
          }.bind(this), this.options.closeDelay);
        }.bind(this)
      };
      this.init();
    }
    defaults = {
      triggerSelector: '[data-nav-trigger]',
      panelSelector: '[data-nav-panel]',
      contentSelector: '[data-nav-content]',
      closeDelay: 200
    };
    init() {
      this.triggers.forEach(function(trigger, i) {
        return trigger.addEventListener('mouseenter', function() {
          return this.open(i);
        }.bind(this));
      }.bind(this));
      this.element.addEventListener('mouseenter', this._boundHandlers.rootEnter);
      this.element.addEventListener('mouseleave', this._boundHandlers.rootLeave);
      document.addEventListener('click', this._boundHandlers.outsideClick);
      this.element.classList.add('navigation-menu-initialized');
      this.emit('init');
    }
    open(index) {
      if (index === this.activeIndex) return;
      clearTimeout(this.closeTimer);
      this.triggers.forEach(function(t, i) {
        return t.setAttribute('aria-expanded', i === index ? 'true' : 'false');
      });
      this.contents.forEach(function(c, i) {
        return c.setAttribute('data-state', i === index ? 'active' : 'inactive');
      });
      this.activeIndex = index;
      this.panel.setAttribute('data-state', 'open');
      this._positionPanel();
      this.emit('open', {
        index: index
      });
    }
    close() {
      if (this.activeIndex === -1) return;
      this.triggers.forEach(function(t) {
        return t.setAttribute('aria-expanded', 'false');
      });
      this.contents.forEach(function(c) {
        return c.setAttribute('data-state', 'inactive');
      });
      this.activeIndex = -1;
      this.panel.setAttribute('data-state', 'closed');
      this.emit('close');
    }
    _positionPanel() {
      var activeTrigger = this.triggers[this.activeIndex];
      var activeContent = this.contents[this.activeIndex];
      if (!activeTrigger || !activeContent) return;
      var triggerRect = activeTrigger.getBoundingClientRect();
      this.panel.style.top = "".concat(triggerRect.bottom + 8, "px");
      this.panel.style.left = "".concat(triggerRect.left, "px");
      this.panel.style.height = "".concat(activeContent.scrollHeight, "px");
    }
    emit(event, data) {
      UI.utils.emitEvent(this.element, event, 'navigationMenu', data);
    }
    destroy() {
      clearTimeout(this.closeTimer);
      this.element.removeEventListener('mouseenter', this._boundHandlers.rootEnter);
      this.element.removeEventListener('mouseleave', this._boundHandlers.rootLeave);
      document.removeEventListener('click', this._boundHandlers.outsideClick);
      this.element.classList.remove('navigation-menu-initialized');
      delete this.element.navigationMenu;
      this.emit('destroy');
    }
  }

  class Pagination {
    constructor(element, options) {
      if (!UI.core.initComponent(this, element, 'pagination', this.defaults, options)) return;
      this.totalPages = parseInt(this.element.dataset.totalPages, 10) || this.options.totalPages;
      this.currentPage = parseInt(this.element.dataset.currentPage, 10) || this.options.currentPage;
      this._boundHandlers = {
        click: function(e) {
          return this._handleClick(e);
        }.bind(this)
      };
      this.init();
    }
    defaults = {
      totalPages: 10,
      currentPage: 1,
      siblingCount: 1,
      onPageChange: function onPageChange() {}
    };
    init() {
      this.element.addEventListener('click', this._boundHandlers.click);
      this.render();
      this.element.classList.add('pagination-initialized');
      this.emit('init');
    }
    goToPage(page) {
      if (page < 1 || page > this.totalPages || page === this.currentPage) return;
      this.currentPage = page;
      this.render();
      this.options.onPageChange(this.currentPage);
      this.emit('page-change', {
        currentPage: this.currentPage
      });
    }
    render() {
      var _this = this;
      this.element.innerHTML = '';
      var ul = document.createElement('ul');
      ul.className = 'pagination';
      ul.appendChild(this._createLinkItem('previous', 'Go to previous page', this.currentPage > 1));
      this._getPageNumbers().forEach(function(page) {
        if (page === '...') ul.insertAdjacentHTML('beforeend', '<li><span class="pagination-ellipsis">&hellip;</span></li>');
        else ul.appendChild(_this._createLinkItem(page, "Go to page ".concat(page), true, page === _this.currentPage));
      });
      ul.appendChild(this._createLinkItem('next', 'Go to next page', this.currentPage < this.totalPages));
      this.element.appendChild(ul);
      if (window.lucide) window.lucide.createIcons({
        nodes: [ul]
      });
    }
    _range(start, end) {
      var length = end - start + 1;
      return Array.from({
        length: length
      }, function(_, idx) {
        return idx + start;
      });
    }
    _getPageNumbers() {
      var _this$options = this.options,
        siblingCount = _this$options.siblingCount,
        totalPages = _this$options.totalPages,
        currentPage = _this$options.currentPage;
      totalPages = this.totalPages;
      currentPage = this.currentPage;
      if (totalPages <= siblingCount + 5) return this._range(1, totalPages);
      var leftSibling = Math.max(currentPage - siblingCount, 1);
      var rightSibling = Math.min(currentPage + siblingCount, totalPages);
      var showLeftDots = leftSibling > 2;
      var showRightDots = rightSibling < totalPages - 2;
      if (!showLeftDots && showRightDots) return [].concat(this._range(1, 3 + 2 * siblingCount), ['...', totalPages]);
      if (showLeftDots && !showRightDots) return [1, '...'].concat(this._range(totalPages - (3 + 2 * siblingCount) + 1, totalPages));
      if (showLeftDots && showRightDots) return [1, '...'].concat(this._range(leftSibling, rightSibling), ['...', totalPages]);
    }
    _createLinkItem(page, label, enabled, active) {
      var li = document.createElement('li');
      li.innerHTML = "<a href=\"#\" class=\"pagination-link\" data-page=\"".concat(page, "\" aria-label=\"").concat(label, "\">").concat(page, "</a>");
      var link = li.firstElementChild;
      if (!enabled) link.classList.add('is-disabled');
      if (active) link.classList.add('is-active');
      if (page === 'previous') link.innerHTML = "<i data-lucide=\"chevron-left\" style=\"width:1rem;height:1rem;\"></i><span>Previous</span>";
      else if (page === 'next') link.innerHTML = "<span>Next</span><i data-lucide=\"chevron-right\" style=\"width:1rem;height:1rem;\"></i>";
      return li;
    }
    _handleClick(e) {
      e.preventDefault();
      var target = e.target.closest('.pagination-link');
      if (!target || target.classList.contains('is-disabled') || target.classList.contains('is-active')) return;
      var newPageStr = target.dataset.page;
      var newPage = this.currentPage;
      if (newPageStr === 'previous') newPage--;
      else if (newPageStr === 'next') newPage++;
      else newPage = parseInt(newPageStr, 10);
      this.goToPage(newPage);
    }
    emit(event, data) {
      UI.utils.emitEvent(this.element, event, 'pagination', data);
    }
    destroy() {
      this.element.removeEventListener('click', this._boundHandlers.click);
      this.element.classList.remove('pagination-initialized');
      delete this.element.pagination;
      this.emit('destroy');
    }
  }

  class PopoverBehavior {
    constructor(element, options) {
      if (!UI.core.initComponent(this, element, 'popoverBehavior', this.defaults, options)) return;
      this.content = this._findContent();
      if (!this.content) return;
      this.isOpen = false;
      this.originalParent = this.content.parentElement;
      this._boundHandlers = {
        trigger: function(e) {
          e.stopPropagation();
          this.toggle();
        }.bind(this),
        outsideClick: function(e) {
          if (!this.content.contains(e.target) && !this.element.contains(e.target)) this.close();
        }.bind(this),
        keydown: function(e) {
          if (e.key === 'Escape') {
            this.close();
            this.element.focus();
          }
        }.bind(this)
      };
      this.init();
    }
    defaults = {
      portal: true,
      keyboard: true,
      closeOnOutsideClick: true,
      trigger: 'click'
    };
    init() {
      this.content.id = this.content.id || "".concat(this.id, "-content");
      this.element.setAttribute('aria-haspopup', 'dialog');
      this.element.setAttribute('aria-expanded', 'false');
      this.element.setAttribute('aria-controls', this.content.id);
      this.content.style.display = 'none';
      if (this.options.trigger === 'click') this.element.addEventListener('click', this._boundHandlers.trigger);
      this.element.classList.add('has-popover', 'popover-initialized');
      this.emit('init');
    }
    open() {
      var _this = this;
      if (this.isOpen) return;
      PopoverBehavior._closeAll();
      this.isOpen = true;
      if (this.options.portal) document.body.appendChild(this.content);
      this.content.style.display = 'block';
      this.element.setAttribute('aria-expanded', 'true');
      this._addGlobalListeners();
      this.emit('open');
    }
    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.content.style.display = 'none';
      this.element.setAttribute('aria-expanded', 'false');
      this._removeGlobalListeners();
      if (this.options.portal && this.content.parentElement === document.body) {
        this.originalParent.appendChild(this.content);
      }
      this.emit('close');
    }
    toggle() {
      this.isOpen ? this.close() : this.open();
    }
    _findContent() {
      var contentId = this.element.getAttribute('data-popover-content');
      return contentId ? document.getElementById(contentId) : this.element.nextElementSibling;
    }
    _addGlobalListeners() {
      setTimeout(function() {
        if (this.options.closeOnOutsideClick) document.addEventListener('click', this._boundHandlers.outsideClick, true);
        if (this.options.keyboard) document.addEventListener('keydown', this._boundHandlers.keydown);
      }.bind(this), 0);
    }
    _removeGlobalListeners() {
      document.removeEventListener('click', this._boundHandlers.outsideClick, true);
      document.removeEventListener('keydown', this._boundHandlers.keydown);
    }
    emit(event, data) {
      UI.utils.emitEvent(this.element, event, 'popover', data);
    }
    destroy() {
      if (this.isOpen) this.close();
      this.element.removeEventListener('click', this._boundHandlers.trigger);
      this._removeGlobalListeners();
      this.element.classList.remove('has-popover', 'popover-initialized');
      delete this.element.popoverBehavior;
      this.emit('destroy');
    }
    static _closeAll() {
      document.querySelectorAll('.has-popover').forEach(function(el) {
        var _el$popoverBehavior;
        return (_el$popoverBehavior = el.popoverBehavior) === null || _el$popoverBehavior === void 0 ? void 0 : _el$popoverBehavior.close();
      });
    }
  }

  class Progress {
    constructor(element, options) {
      if (!UI.core.initComponent(this, element, 'progress', this.defaults, options)) return;
      this.indicator = this.element.querySelector('.progress-indicator');
      if (!this.indicator) return;
      this.value = parseFloat(this.element.getAttribute('data-value')) || this.options.initialValue;
      this.init();
    }
    defaults = {
      initialValue: 0,
      min: 0,
      max: 100,
      onValueChange: function onValueChange() {}
    };
    init() {
      this.element.setAttribute('role', 'progressbar');
      this.element.setAttribute('aria-valuemin', this.options.min);
      this.element.setAttribute('aria-valuemax', this.options.max);
      this.update(this.value);
      this.element.classList.add('progress-initialized');
      this.emit('init');
    }
    update(newValue) {
      var value = Math.max(this.options.min, Math.min(this.options.max, parseFloat(newValue)));
      var previousValue = this.value;
      this.value = value;
      this.element.setAttribute('aria-valuenow', value);
      this.element.setAttribute('data-value', value);
      var percentage = (value - this.options.min) / (this.options.max - this.options.min) * 100;
      this.indicator.style.transform = "translateX(-".concat(100 - percentage, "%)");
      if (value !== previousValue) {
        this.options.onValueChange(value, previousValue);
        this.emit('value-change', {
          value: value,
          previousValue: previousValue
        });
      }
    }
    setValue(value) {
      this.update(value);
    }
    emit(event, data) {
      UI.utils.emitEvent(this.element, event, 'progress', data);
    }
    destroy() {
      this.element.classList.remove('progress-initialized');
      delete this.element.progress;
      this.emit('destroy');
    }
  }

  class Resizable {
    constructor(element, options) {
      if (!UI.core.initComponent(this, element, 'resizable', this.defaults, options)) return;
      this.orientation = this.element.classList.contains('resizable-vertical') ? 'vertical' : 'horizontal';
      this.handles = Array.from(this.element.querySelectorAll(':scope > .resizable-handle'));
      this.panels = Array.from(this.element.querySelectorAll(':scope > .resizable-panel'));
      if (this.panels.length < 2) return;
      this.isDragging = false;
      this._boundHandlers = {
        mousemove: function(e) {
          return this._handleMouseMove(e);
        }.bind(this),
        mouseup: function() {
          return this._handleMouseUp();
        }.bind(this)
      };
      this.init();
    }
    defaults = {
      minPanelSize: 50,
      keyboard: true
    };
    init() {
      this.handles.forEach(function(handle, index) {
        handle.addEventListener('mousedown', function(e) {
          return this._handleMouseDown(e, handle, this.panels[index], this.panels[index + 1]);
        }.bind(this));
      }.bind(this));
      if (this.options.keyboard) this.element.addEventListener('keydown', function(e) {
        return this._handleKeydown(e);
      }.bind(this));
      this.panels.forEach(function(panel) {
        if (!panel.style.flexBasis) panel.style.flexBasis = "".concat(100 / this.panels.length, "%");
      }.bind(this));
      this.element.classList.add('resizable-initialized');
      this.emit('init');
    }
    _handleMouseDown(e, handle, prevPanel, nextPanel) {
      e.preventDefault();
      this.isDragging = true;
      var isHorizontal = this.orientation === 'horizontal';
      this.dragState = {
        handle: handle,
        prevPanel: prevPanel,
        nextPanel: nextPanel,
        startPos: isHorizontal ? e.clientX : e.clientY,
        prevSize: isHorizontal ? prevPanel.offsetWidth : prevPanel.offsetHeight,
        nextSize: isHorizontal ? nextPanel.offsetWidth : nextPanel.offsetHeight
      };
      document.body.style.cursor = isHorizontal ? 'ew-resize' : 'ns-resize';
      document.addEventListener('mousemove', this._boundHandlers.mousemove);
      document.addEventListener('mouseup', this._boundHandlers.mouseup);
    }
    _handleMouseMove(e) {
      if (!this.isDragging) return;
      var _this$dragState = this.dragState,
        startPos = _this$dragState.startPos,
        prevSize = _this$dragState.prevSize,
        nextSize = _this$dragState.nextSize,
        prevPanel = _this$dragState.prevPanel,
        nextPanel = _this$dragState.nextPanel;
      var currentPos = this.orientation === 'horizontal' ? e.clientX : e.clientY;
      var delta = currentPos - startPos;
      var newPrevSize = prevSize + delta;
      var newNextSize = nextSize - delta;
      if (newPrevSize < this.options.minPanelSize || newNextSize < this.options.minPanelSize) return;
      prevPanel.style.flexBasis = "".concat(newPrevSize, "px");
      nextPanel.style.flexBasis = "".concat(newNextSize, "px");
    }
    _handleMouseUp() {
      this.isDragging = false;
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', this._boundHandlers.mousemove);
      document.removeEventListener('mouseup', this._boundHandlers.mouseup);
    }
    _handleKeydown(e) {}
    emit(event, data) {
      UI.utils.emitEvent(this.element, event, 'resizable', data);
    }
    destroy() {
      if (this.isDragging) this._handleMouseUp();
      this.element.classList.remove('resizable-initialized');
      delete this.element.resizable;
      this.emit('destroy');
    }
  }

  class ScrollArea {
    constructor(element, options) {
      if (!UI.core.initComponent(this, element, 'scrollArea', this.defaults, options)) return;
      this.viewport = this.element.querySelector('.scroll-area-viewport');
      if (!this.viewport) {
        var content = Array.from(this.element.childNodes);
        this.viewport = document.createElement('div');
        this.viewport.className = 'scroll-area-viewport';
        content.forEach(function(node) {
          return this.viewport.appendChild(node);
        }.bind(this));
        this.element.appendChild(this.viewport);
      }
      this.vScrollbar = this._getOrCreateScrollbar('vertical');
      this.hScrollbar = this._getOrCreateScrollbar('horizontal');
      this.vThumb = this.vScrollbar.querySelector('.scroll-area-thumb');
      this.hThumb = this.hScrollbar.querySelector('.scroll-area-thumb');
      this._boundHandlers = {
        scroll: function() {
          return this.update();
        }.bind(this),
        resize: function() {
          return this.update();
        }.bind(this)
      };
      this.init();
    }
    defaults = {
      thumbMinSize: 20
    };
    init() {
      this.viewport.addEventListener('scroll', this._boundHandlers.scroll);
      window.addEventListener('resize', this._boundHandlers.resize);
      this.element.classList.add('scroll-area-initialized');
      this.update();
      this.emit('init');
    }
    _getOrCreateScrollbar(orientation) {
      var scrollbar = this.element.querySelector(".scroll-area-scrollbar-".concat(orientation));
      if (!scrollbar) {
        scrollbar = document.createElement('div');
        scrollbar.className = "scroll-area-scrollbar scroll-area-scrollbar-".concat(orientation);
        scrollbar.innerHTML = '<div class="scroll-area-thumb"></div>';
        this.element.appendChild(scrollbar);
      }
      return scrollbar;
    }
    update() {
      var _this = this;
      requestAnimationFrame(function() {
        _this._updateScrollbar('vertical', _this.vScrollbar, _this.vThumb);
        _this._updateScrollbar('horizontal', _this.hScrollbar, _this.hThumb);
      });
    }
    _updateScrollbar(orientation, scrollbar, thumb) {
      var isVertical = orientation === 'vertical';
      var scrollSize = isVertical ? this.viewport.scrollHeight : this.viewport.scrollWidth;
      var clientSize = isVertical ? this.viewport.clientHeight : this.viewport.clientWidth;
      var needsScrollbar = scrollSize > clientSize;
      scrollbar.style.display = needsScrollbar ? '' : 'none';
      if (!needsScrollbar) return;
      var trackLength = isVertical ? scrollbar.clientHeight : scrollbar.clientWidth;
      var thumbLength = Math.max(this.options.thumbMinSize, clientSize / scrollSize * trackLength);
      var scrollPos = isVertical ? this.viewport.scrollTop : this.viewport.scrollLeft;
      var thumbPos = scrollPos / (scrollSize - clientSize) * (trackLength - thumbLength);
      thumb.style[isVertical ? 'height' : 'width'] = "".concat(thumbLength, "px");
      thumb.style.transform = isVertical ? "translateY(".concat(thumbPos, "px)") : "translateX(".concat(thumbPos, "px)");
    }
    emit(event, data) {
      UI.utils.emitEvent(this.element, event, 'scrollArea', data);
    }
    destroy() {
      this.viewport.removeEventListener('scroll', this._boundHandlers.scroll);
      window.removeEventListener('resize', this._boundHandlers.resize);
      this.element.classList.remove('scroll-area-initialized');
      delete this.element.scrollArea;
      this.emit('destroy');
    }
  }

  class Select {
    static _instances = new Set();
    constructor(element, options) {
      if (!UI.core.initComponent(this, element, 'select', this.defaults, options)) return;
      this.trigger = this.element.querySelector('.select-trigger');
      this.content = this.element.querySelector('.select-content');
      this.valueEl = this.element.querySelector('.select-value');
      if (!this.trigger || !this.content || !this.valueEl) return;
      this.isOpen = false;
      this._boundHandlers = {
        toggle: function(e) {
          e.stopPropagation();
          this.toggle();
        }.bind(this),
        contentClick: function(e) {
          return this._handleContentClick(e);
        }.bind(this),
        outsideClick: function(e) {
          if (!this.element.contains(e.target)) this.close();
        }.bind(this)
      };
      this.init();
      Select._instances.add(this);
    }
    defaults = {
      closeOnSelect: true,
      placeholder: 'Select an option...'
    };
    init() {
      this.trigger.addEventListener('click', this._boundHandlers.toggle);
      this.content.addEventListener('click', this._boundHandlers.contentClick);
      var selectedItem = this.content.querySelector('.select-item-selected');
      if (selectedItem) this.selectItem(selectedItem, false);
      else this.valueEl.classList.add('select-value-placeholder');
      this.element.classList.add('select-initialized');
      this.emit('init');
    }
    selectItem(item, shouldEmit) {
      var _item$querySelector;
      if (shouldEmit === void 0) {
        shouldEmit = true;
      }
      var newValue = (_item$querySelector = item.querySelector('.select-item-text')) === null || _item$querySelector === void 0 ? void 0 : _item$querySelector.textContent;
      if (!newValue || this.valueEl.textContent === newValue) return;
      this.valueEl.textContent = newValue;
      this.valueEl.classList.remove('select-value-placeholder');
      var _this$content$querySe;
      (_this$content$querySe = this.content.querySelector('.select-item-selected')) === null || _this$content$querySe === void 0 ? void 0 : _this$content$querySe.classList.remove('select-item-selected');
      item.classList.add('select-item-selected');
      if (shouldEmit) this.emit('select', {
        item: item,
        value: newValue
      });
    }
    open() {
      if (this.isOpen) return;
      Select.closeAllExcept(this);
      this.isOpen = true;
      this.element.setAttribute('data-state', 'open');
      document.addEventListener('click', this._boundHandlers.outsideClick);
      this.emit('open');
    }
    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.element.setAttribute('data-state', 'closed');
      document.removeEventListener('click', this._boundHandlers.outsideClick);
      this.emit('close');
    }
    toggle() {
      this.isOpen ? this.close() : this.open();
    }
    _handleContentClick(e) {
      var item = e.target.closest('.select-item');
      if (!item) return;
      e.stopPropagation();
      this.selectItem(item);
      if (this.options.closeOnSelect) this.close();
    }
    emit(event, data) {
      UI.utils.emitEvent(this.element, event, 'select', data);
    }
    destroy() {
      this.trigger.removeEventListener('click', this._boundHandlers.toggle);
      this.content.removeEventListener('click', this._boundHandlers.contentClick);
      document.removeEventListener('click', this._boundHandlers.outsideClick);
      this.element.classList.remove('select-initialized');
      Select._instances["delete"](this);
      delete this.element.select;
      this.emit('destroy');
    }
    static closeAllExcept(instance) {
      var _iteratorNormalCompletion = true,
        _didIteratorError = false,
        _iteratorError = undefined;
      try {
        for (var _iterator = Select._instances[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var i = _step.value;
          if (i !== instance) i.close();
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }

  class Sheet {
    constructor(element, options) {
      if (!UI.core.initComponent(this, element, 'sheet', this.defaults, options)) return;
      this.isOpen = false;
      this._boundHandlers = {
        keydown: function(e) {
          if (e.key === 'Escape') this.close();
        }.bind(this),
        close: this.close.bind(this),
        overlayClick: function(e) {
          if (e.target === this.overlay) this.close();
        }.bind(this)
      };
      this.init();
    }
    defaults = {
      side: 'right',
      content: '',
      closeOnOverlayClick: true,
      lockBodyScroll: true,
      restoreFocus: true
    };
    init() {
      this.element.classList.add('sheet-initialized');
      this.emit('init');
    }
    open() {
      var _this = this;
      if (this.isOpen) return;
      this._build();
      this.isOpen = true;
      if (this.options.restoreFocus) this.lastActiveElement = document.activeElement;
      document.body.appendChild(this.overlay);
      document.body.appendChild(this.content);
      if (this.options.lockBodyScroll) UI.utils.lockBodyScroll(true);
      document.addEventListener('keydown', this._boundHandlers.keydown);
      requestAnimationFrame(function() {
        _this.overlay.setAttribute('data-state', 'open');
        _this.content.setAttribute('data-state', 'open');
      });
      this.emit('open');
    }
    close() {
      var _this2 = this;
      var _this$overlay;
      var _this$content;
      if (!this.isOpen) return;
      this.isOpen = false;
      this.overlay.setAttribute('data-state', 'closed');
      this.content.setAttribute('data-state', 'closed');
      document.removeEventListener('keydown', this._boundHandlers.keydown);
      setTimeout(function() {
        (_this2$overlay = _this2.overlay) === null || _this2$overlay === void 0 ? void 0 : _this2$overlay.remove();
        (_this2$content = _this2.content) === null || _this2$content === void 0 ? void 0 : _this2$content.remove();
        if (_this2.options.lockBodyScroll) UI.utils.lockBodyScroll(false);
        if (_this2.options.restoreFocus && _this2.lastActiveElement) _this2.lastActiveElement.focus();
      }, 200);
      this.emit('close');
    }
    toggle() {
      this.isOpen ? this.close() : this.open();
    }
    _build() {
      this.overlay = document.createElement('div');
      this.overlay.className = 'sheet-overlay';
      this.content = document.createElement('div');
      this.content.className = 'sheet-content';
      this.content.setAttribute('data-side', this.options.side);
      this.content.innerHTML = this.options.content;
      if (this.options.closeOnOverlayClick) this.overlay.addEventListener('click', this._boundHandlers.overlayClick);
      this.content.querySelectorAll('[data-sheet-close]').forEach(function(btn) {
        btn.addEventListener('click', this._boundHandlers.close);
      }.bind(this));
    }
    emit(event, data) {
      UI.utils.emitEvent(this.element, event, 'sheet', data);
    }
    destroy() {
      if (this.isOpen) this.close();
      this.element.classList.remove('sheet-initialized');
      delete this.element.sheet;
      this.emit('destroy');
    }
  }

  class Sidebar {
    constructor(element, options) {
      if (!UI.core.initComponent(this, element, 'sidebar', this.defaults, options)) return;
      this.state = this.loadState();
      this.provider = this.element.closest('.sidebar-provider');
      this.overlay = this.provider === null || this.provider === void 0 ? void 0 : this.provider.querySelector('.sidebar-overlay');
      this.init();
    }
    defaults = {
      breakpoint: 768,
      saveState: true
    };
    init() {
      this.applyState();
      this.element.classList.add('sidebar-initialized');
    }
    toggle() {
      var isMobile = window.innerWidth <= this.options.breakpoint;
      this.state = isMobile ? this.state === 'open' ? 'closed' : 'open' : this.state === 'collapsed' ? 'expanded' : 'collapsed';
      this.applyState();
      if (!isMobile && this.options.saveState) this.saveState();
      this.emit('toggle', {
        state: this.state
      });
    }
    saveState() {
      try {
        localStorage.setItem("sidebar-".concat(this.id), this.state);
      } catch (e) {}
    }
    loadState() {
      try {
        return localStorage.getItem("sidebar-".concat(this.id)) || 'expanded';
      } catch (e) {
        return 'expanded';
      }
    }
    applyState() {
      var _this$overlay;
      var isMobile = window.innerWidth <= this.options.breakpoint;
      this.element.classList.toggle('open', isMobile && this.state === 'open');
      (_this$overlay = this.overlay) === null || _this$overlay === void 0 ? void 0 : _this$overlay.classList.toggle('open', isMobile && this.state === 'open');
      this.element.classList.toggle('collapsed', !isMobile && this.state === 'collapsed');
    }
    emit(event, data) {
      UI.utils.emitEvent(this.element, event, 'sidebar', data);
    }
    destroy() {
      this.element.classList.remove('sidebar-initialized');
      delete this.element.sidebar;
    }
  }

  class Slider {
    constructor(element) {
      if (!UI.core.initComponent(this, element, 'slider', {}, {})) return;
      this.input = this.element.querySelector('input[type=range]');
      this.track = this.element.querySelector('.slider-track');
      this.range = this.element.querySelector('.slider-range');
      if (!this.input || !this.track || !this.range) return;
      this.init();
    }
    init() {
      this.input.addEventListener('input', function() {
        return this.update();
      }.bind(this));
      this.track.addEventListener('click', function(e) {
        return this._handleTrackClick(e);
      }.bind(this));
      this.update();
      this.element.classList.add('slider-initialized');
    }
    update() {
      var min = parseFloat(this.input.min);
      var max = parseFloat(this.input.max);
      var value = parseFloat(this.input.value);
      var percent = (value - min) / (max - min) * 100;
      this.range.style.width = "".concat(percent, "%");
      this.input.style.setProperty('--value', "".concat(percent, "%"));
    }
    _handleTrackClick(e) {
      var rect = this.track.getBoundingClientRect();
      var percent = (e.clientX - rect.left) / rect.width;
      var min = parseFloat(this.input.min);
      var max = parseFloat(this.input.max);
      var step = parseFloat(this.input.step || '1');
      var value = min + percent * (max - min);
      value = Math.round(value / step) * step;
      this.input.value = Math.max(min, Math.min(max, value));
      this.input.dispatchEvent(new Event('input', {
        bubbles: true
      }));
    }
  }

  class ToastManager {
    constructor(options) {
      this.options = { ...this.defaults,
        ...options
      };
      this.toasts = new Map();
      this.container = this._getOrCreateContainer(this.options.position);
    }
    defaults = {
      position: 'bottom-right',
      duration: 4000,
      maxToasts: 5,
      pauseOnHover: true
    };
    show(titleOrOptions, options) {
      if (options === void 0) {
        options = {};
      }
      var toastOptions = typeof titleOrOptions === 'object' ? titleOrOptions : { ...options,
        title: titleOrOptions
      };
      if (!toastOptions.title) return null;
      return this._createToast(toastOptions);
    }
    success(title, options) {
      if (options === void 0) {
        options = {};
      }
      return this.show({ ...options,
        title: title,
        type: 'success'
      });
    }
    error(title, options) {
      if (options === void 0) {
        options = {};
      }
      return this.show({ ...options,
        title: title,
        type: 'error'
      });
    }
    info(title, options) {
      if (options === void 0) {
        options = {};
      }
      return this.show({ ...options,
        title: title,
        type: 'info'
      });
    }
    warning(title, options) {
      if (options === void 0) {
        options = {};
      }
      return this.show({ ...options,
        title: title,
        type: 'warning'
      });
    }
    dismiss(toastId) {
      if (toastId) this.toasts.get(toastId)?.();
      else this.toasts.forEach(function(remove) {
        return remove();
      });
    }
    _getOrCreateContainer(position) {
      if (position === void 0) {
        position = 'bottom-right';
      }
      var container = document.querySelector(".sonner-container.sonner-container-".concat(position));
      if (!container) {
        container = document.createElement('div');
        container.className = "sonner-container sonner-container-".concat(position);
        document.body.appendChild(container);
      }
      return container;
    }
    _createToast(options) {
      var _this = this;
      var title = options.title,
        description = options.description,
        _options$duration = options.duration,
        duration = _options$duration === void 0 ? this.options.duration : _options$duration,
        icon = options.icon,
        type = options.type,
        action = options.action,
        position = options.position;
      if (position) this.container = this._getOrCreateContainer(position);
      var toastId = UI.utils.generateId('toast');
      var toastEl = document.createElement('div');
      toastEl.className = "sonner sonner-".concat(type || 'default');
      toastEl.dataset.toastId = toastId;
      var defaultIcons = {
        success: 'check-circle',
        error: 'x-circle',
        warning: 'alert-triangle',
        info: 'info'
      };
      var iconName = icon || defaultIcons[type];
      var html = "".concat(iconName ? "<i data-lucide=\"".concat(iconName, "\" class=\"sonner-icon\"></i>") : '', "\n            <div class=\"sonner-content\">\n                <div class=\"sonner-title\">").concat(title, "</div>\n                ").concat(description ? "<div class=\"sonner-description\">".concat(description, "</div>") : '', "\n            </div>\n            ").concat(action ? "<div class=\"sonner-action-wrapper\"><button class=\"btn btn-sm\">".concat(action.label, "</button></div>") : '', "\n            <button class=\"sonner-close-button\" aria-label=\"Close\"><i data-lucide=\"x\"></i></button>");
      toastEl.innerHTML = html;
      var removeToast = function removeToast() {
        if (toastEl.isRemoving) return;
        toastEl.isRemoving = true;
        clearTimeout(toastEl.timeoutId);
        toastEl.setAttribute('data-state', 'closed');
        setTimeout(function() {
          toastEl.remove();
          _this.toasts["delete"](toastId);
        }, 250);
      };
      if (this.options.pauseOnHover) {
        toastEl.addEventListener('mouseenter', function() {
          return clearTimeout(toastEl.timeoutId);
        });
        toastEl.addEventListener('mouseleave', function() {
          return toastEl.timeoutId = setTimeout(removeToast, duration);
        });
      }
      toastEl.querySelector('.sonner-close-button').addEventListener('click', removeToast);
      if (action !== null && action !== void 0 && action.onClick) toastEl.querySelector('.sonner-action-wrapper button').addEventListener('click', function(e) {
        e.stopPropagation();
        action.onClick();
      });
      toastEl.timeoutId = setTimeout(removeToast, duration);
      if (this.toasts.size >= this.options.maxToasts) {
        this.dismiss(this.toasts.keys().next().value);
      }
      this.container.appendChild(toastEl);
      this.toasts.set(toastId, removeToast);
      requestAnimationFrame(function() {
        toastEl.setAttribute('data-state', 'open');
        if (window.lucide) window.lucide.createIcons({
          nodes: [toastEl]
        });
      });
      return toastId;
    }
  }

  class Tabs {
    constructor(element, options) {
      if (!UI.core.initComponent(this, element, 'tabs', this.defaults, options)) return;
      this.tabsList = this.element.querySelector('.tabs-list');
      if (!this.tabsList) return;
      this.triggers = Array.from(this.tabsList.querySelectorAll('.tabs-trigger'));
      this.tabsData = this.triggers.map(function(trigger) {
        return {
          trigger: trigger,
          content: this.element.querySelector("#".concat(trigger.getAttribute('aria-controls')))
        };
      }.bind(this)).filter(function(tab) {
        return tab.content;
      });
      if (this.tabsData.length === 0) return;
      this._boundHandlers = {
        click: function(e) {
          var trigger = e.target.closest('.tabs-trigger');
          if (trigger && !trigger.disabled) this.activateTab(trigger);
        }.bind(this),
        keydown: function(e) {
          return this._handleKeydown(e);
        }.bind(this)
      };
      this.init();
    }
    defaults = {
      onTabChange: function onTabChange() {},
      activateOnFocus: false
    };
    init() {
      this.tabsList.addEventListener('click', this._boundHandlers.click);
      this.tabsList.addEventListener('keydown', this._boundHandlers.keydown);
      var initialTab = this.tabsData.find(function(tab) {
        return tab.trigger.classList.contains('tabs-trigger-active');
      }) || this.tabsData[0];
      this._activateTab(initialTab);
      this.element.classList.add('tabs-initialized');
      this.emit('init');
    }
    activateTab(triggerOrIndex) {
      var tabData = typeof triggerOrIndex === 'number' ? this.tabsData[triggerOrIndex] : this.tabsData.find(function(tab) {
        return tab.trigger === triggerOrIndex;
      });
      if (tabData && !tabData.trigger.disabled) this._activateTab(tabData);
    }
    _handleKeydown(e) {
      var activeTriggers = this.tabsData.filter(function(tab) {
        return !tab.trigger.disabled;
      });
      var currentIndex = activeTriggers.findIndex(function(tab) {
        return tab.trigger.getAttribute('aria-selected') === 'true';
      });
      var nextIndex = currentIndex;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextIndex = (currentIndex + 1) % activeTriggers.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        nextIndex = (currentIndex - 1 + activeTriggers.length) % activeTriggers.length;
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = activeTriggers.length - 1;
      } else {
        return;
      }
      e.preventDefault();
      activeTriggers[nextIndex].trigger.focus();
      this.activateTab(activeTriggers[nextIndex].trigger);
    }
    _activateTab(tabData) {
      this.tabsData.forEach(function(_ref) {
        var trigger = _ref.trigger,
          content = _ref.content;
        var isActive = trigger === tabData.trigger;
        trigger.setAttribute('aria-selected', isActive);
        trigger.setAttribute('tabindex', isActive ? '0' : '-1');
        content.hidden = !isActive;
      });
      this.activeTab = tabData;
      this.emit('tab-change', {
        trigger: tabData.trigger,
        content: tabData.content
      });
    }
    emit(event, data) {
      UI.utils.emitEvent(this.element, event, 'tabs', data);
    }
    destroy() {
      this.tabsList.removeEventListener('click', this._boundHandlers.click);
      this.tabsList.removeEventListener('keydown', this._boundHandlers.keydown);
      this.element.classList.remove('tabs-initialized');
      delete this.element.tabs;
      this.emit('destroy');
    }
  }

  class Toggle {
    constructor(element, options) {
      if (!UI.core.initComponent(this, element, 'toggle', this.defaults, options)) return;
      this.pressed = this.element.dataset.state === 'on';
      this.init();
    }
    defaults = {
      onToggle: function onToggle() {}
    };
    init() {
      this.element.addEventListener('click', function() {
        return this.toggle();
      }.bind(this));
      this.updateState();
      this.element.classList.add('toggle-initialized');
      this.emit('init');
    }
    updateState() {
      this.element.dataset.state = this.pressed ? 'on' : 'off';
      this.element.setAttribute('aria-pressed', this.pressed.toString());
    }
    toggle() {
      if (this.element.disabled) return;
      this.pressed = !this.pressed;
      this.updateState();
      this.options.onToggle(this.pressed);
      this.emit('toggle', {
        pressed: this.pressed
      });
    }
    emit(event, data) {
      UI.utils.emitEvent(this.element, event, 'toggle', data);
    }
    destroy() {
      this.element.removeEventListener('click', this.toggle);
      this.element.classList.remove('toggle-initialized');
      delete this.element.toggle;
      this.emit('destroy');
    }
  }

  class ToggleGroup {
    constructor(element, options) {
      if (!UI.core.initComponent(this, element, 'toggleGroup', this.defaults, options)) return;
      this.items = Array.from(this.element.querySelectorAll('.toggle-group-item'));
      if (this.items.length === 0) return;
      this.isSingleSelection = this.element.classList.contains('toggle-group-single');
      this.init();
    }
    defaults = {
      onToggle: function onToggle() {}
    };
    init() {
      this.element.addEventListener('click', function(e) {
        return this._handleClick(e);
      }.bind(this));
      this.element.classList.add('toggle-group-initialized');
      this.emit('init');
    }
    _handleClick(e) {
      var clickedItem = e.target.closest('.toggle-group-item');
      if (!clickedItem || clickedItem.disabled) return;
      var isOn = clickedItem.classList.contains('is-active');
      if (this.isSingleSelection) {
        if (isOn) return;
        this.items.forEach(function(item) {
          return item.classList.remove('is-active');
        });
        clickedItem.classList.add('is-active');
      } else {
        clickedItem.classList.toggle('is-active');
      }
      this.emit('toggle', {
        item: clickedItem,
        pressed: !isOn
      });
    }
    emit(event, data) {
      UI.utils.emitEvent(this.element, event, 'toggleGroup', data);
    }
    destroy() {
      this.element.removeEventListener('click', this._handleClick);
      this.element.classList.remove('toggle-group-initialized');
      delete this.element.toggleGroup;
      this.emit('destroy');
    }
  }

  class Tooltip {
    constructor(element, options) {
      if (!UI.core.initComponent(this, element, 'tooltip', this.defaults, options)) return;
      this.trigger = this.element.querySelector('.tooltip-trigger');
      this.content = this.element.querySelector('.tooltip-content');
      if (!this.trigger || !this.content) return;
      this.isVisible = false;
      this.originalParent = this.content.parentElement;
      this.showTimer = null;
      this.hideTimer = null;
      this._boundHandlers = {
        show: function() {
          return this._handleShow();
        }.bind(this),
        hide: function() {
          return this._handleHide();
        }.bind(this),
        position: function() {
          return this._positionTooltip();
        }.bind(this),
        keydown: function(e) {
          if (e.key === 'Escape') this.hide();
        }.bind(this)
      };
      this.init();
    }
    defaults = {
      showDelay: 300,
      hideDelay: 100,
      sideOffset: 8,
      portal: true,
      fit: false
    };
    init() {
      this._applyClassBasedSettings();
      this.content.id = this.content.id || "".concat(this.id, "-content");
      this.trigger.setAttribute('aria-describedby', this.content.id);
      this.content.style.display = 'none';
      this.trigger.addEventListener('mouseenter', this._boundHandlers.show);
      this.trigger.addEventListener('mouseleave', this._boundHandlers.hide);
      this.trigger.addEventListener('focus', this._boundHandlers.show);
      this.trigger.addEventListener('blur', this._boundHandlers.hide);
      this.trigger.addEventListener('keydown', this._boundHandlers.keydown);
      this.element.classList.add('tooltip-initialized');
      this.emit('init');
    }
    show() {
      var _this = this;
      if (this.isVisible) return;
      Tooltip._hideAll();
      this.isVisible = true;
      if (this.options.portal) document.body.appendChild(this.content);
      this.content.style.display = 'block';
      this.element.setAttribute('data-state', 'open');
      this._positionTooltip();
      window.addEventListener('scroll', this._boundHandlers.position, true);
      window.addEventListener('resize', this._boundHandlers.position, true);
      this.emit('show');
    }
    hide() {
      var _this2 = this;
      if (!this.isVisible) return;
      this.isVisible = false;
      this.element.setAttribute('data-state', 'closed');
      setTimeout(function() {
        if (!_this2.isVisible) _this2.content.style.display = 'none';
        if (_this2.options.portal && _this2.content.parentElement === document.body) {
          _this2.originalParent.appendChild(_this2.content);
        }
      }, 150);
      window.removeEventListener('scroll', this._boundHandlers.position, true);
      window.removeEventListener('resize', this._boundHandlers.position, true);
      this.emit('hide');
    }
    _applyClassBasedSettings() {
      if (this.element.classList.contains('tooltip-no-portal')) this.options.portal = false;
      if (this.element.classList.contains('tooltip-fit')) this.options.fit = true;
    }
    _getSideFromClasses() {
      if (this.trigger.classList.contains('tooltip-bottom')) return 'bottom';
      if (this.trigger.classList.contains('tooltip-left')) return 'left';
      if (this.trigger.classList.contains('tooltip-right')) return 'right';
      return 'top';
    }
    _handleShow() {
      clearTimeout(this.hideTimer);
      this.showTimer = setTimeout(this.show.bind(this), this.options.showDelay);
    }
    _handleHide() {
      clearTimeout(this.showTimer);
      this.hideTimer = setTimeout(this.hide.bind(this), this.options.hideDelay);
    }
    _positionTooltip() {
      if (!this.isVisible) return;
      var _UI$utils$positionEle = UI.utils.positionElement(this.trigger, this.content, {
          side: this._getSideFromClasses(),
          align: 'center',
          sideOffset: this.options.sideOffset,
          fit: this.options.fit
        }),
        top = _UI$utils$positionEle.top,
        left = _UI$utils$positionEle.left;
      Object.assign(this.content.style, {
        top: "".concat(top, "px"),
        left: "".concat(left, "px"),
        position: 'fixed',
        zIndex: '9999'
      });
    }
    emit(event, data) {
      UI.utils.emitEvent(this.element, event, 'tooltip', data);
    }
    destroy() {
      clearTimeout(this.showTimer);
      clearTimeout(this.hideTimer);
      if (this.isVisible) this.hide();
      this.trigger.removeEventListener('mouseenter', this._boundHandlers.show);
      this.trigger.removeEventListener('mouseleave', this._boundHandlers.hide);
      this.trigger.removeEventListener('focus', this._boundHandlers.show);
      this.trigger.removeEventListener('blur', this._boundHandlers.hide);
      this.trigger.removeEventListener('keydown', this._boundHandlers.keydown);
      this.element.classList.remove('tooltip-initialized');
      delete this.element.tooltip;
      this.emit('destroy');
    }
    static _hideAll() {
      document.querySelectorAll('.tooltip-initialized').forEach(function(el) {
        var _el$tooltip;
        return (_el$tooltip = el.tooltip) === null || _el$tooltip === void 0 ? void 0 : _el$tooltip.hide();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    var componentMap = {
      '.accordion': {
        C: Accordion,
        name: 'accordion'
      },
      '.calendar-container': {
        C: Calendar,
        name: 'calendar'
      },
      '.carousel': {
        C: Carousel,
        name: 'carousel'
      },
      '.combobox': {
        C: Combobox,
        name: 'combobox'
      },
      '.command': {
        C: Command,
        name: 'command'
      },
      '.context-menu': {
        C: ContextMenu,
        name: 'contextMenu'
      },
      '.dialog': {
        C: Dialog,
        name: 'dialog'
      },
      '.dropdown-menu': {
        C: DropdownMenu,
        name: 'dropdownMenu'
      },
      '.hover-card': {
        C: HoverCard,
        name: 'hoverCard'
      },
      '.input-otp': {
        C: InputOTP,
        name: 'inputOTP'
      },
      '[data-menubar]': {
        C: Menubar,
        name: 'menubar'
      },
      '.navmenu': {
        C: NavigationMenu,
        name: 'navigationMenu'
      },
      '.js-pagination': {
        C: Pagination,
        name: 'pagination'
      },
      '[data-popover], .has-popover': {
        C: PopoverBehavior,
        name: 'popoverBehavior'
      },
      '.progress': {
        C: Progress,
        name: 'progress'
      },
      '.resizable-root': {
        C: Resizable,
        name: 'resizable'
      },
      '.js-scroll-area, .scroll-area': {
        C: ScrollArea,
        name: 'scrollArea'
      },
      '.select': {
        C: Select,
        name: 'select'
      },
      '.sidebar': {
        C: Sidebar,
        name: 'sidebar'
      },
      '.slider': {
        C: Slider,
        name: 'slider'
      },
      '.tabs': {
        C: Tabs,
        name: 'tabs'
      },
      '.toggle-group': {
        C: ToggleGroup,
        name: 'toggleGroup'
      },
      '.toggle': {
        C: Toggle,
        name: 'toggle'
      },
      '.tooltip': {
        C: Tooltip,
        name: 'tooltip'
      }
    };
    for (var selector in componentMap) {
      var _componentMap$selector = componentMap[selector],
        C = _componentMap$selector.C,
        name = _componentMap$selector.name;
      UI.core.autoInit(selector, C, name);
    }
    var dialogs = new Map();
    document.querySelectorAll('.dialog.dialog-initialized').forEach(function(el) {
      if (el.id) dialogs.set(el.id, el.dialog);
    });
    document.querySelectorAll('[data-dialog-trigger]').forEach(function(trigger) {
      var dialog = dialogs.get(trigger.getAttribute('data-dialog-trigger'));
      if (dialog) trigger.addEventListener('click', function(e) {
        e.preventDefault();
        dialog.open();
      });
    });
    window.Sheet = new class Sheet {
      constructor(element, options) {
        if (!UI.core.initComponent(this, element, 'sheet', this.defaults, options)) return;
        this.isOpen = false;
        this._boundHandlers = {
          keydown: function(e) {
            if (e.key === 'Escape') this.close();
          }.bind(this),
          close: this.close.bind(this),
          overlayClick: function(e) {
            if (e.target === this.overlay) this.close();
          }.bind(this)
        };
        this.init();
      }
      defaults = {
        side: 'right',
        content: '',
        closeOnOverlayClick: true,
        lockBodyScroll: true,
        restoreFocus: true
      };
      init() {
        this.element.classList.add('sheet-initialized');
        this.emit('init');
      }
      open() {
        var _this = this;
        if (this.isOpen) return;
        this._build();
        this.isOpen = true;
        if (this.options.restoreFocus) this.lastActiveElement = document.activeElement;
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.content);
        if (this.options.lockBodyScroll) UI.utils.lockBodyScroll(true);
        document.addEventListener('keydown', this._boundHandlers.keydown);
        requestAnimationFrame(function() {
          _this.overlay.setAttribute('data-state', 'open');
          _this.content.setAttribute('data-state', 'open');
        });
        this.emit('open');
      }
      close() {
        var _this2 = this;
        var _this2$overlay;
        var _this2$content;
        if (!this.isOpen) return;
        this.isOpen = false;
        this.overlay.setAttribute('data-state', 'closed');
        this.content.setAttribute('data-state', 'closed');
        document.removeEventListener('keydown', this._boundHandlers.keydown);
        setTimeout(function() {
          (_this2$overlay = _this2.overlay) === null || _this2$overlay === void 0 ? void 0 : _this2$overlay.remove();
          (_this2$content = _this2.content) === null || _this2$content === void 0 ? void 0 : _this2$content.remove();
          if (_this2.options.lockBodyScroll) UI.utils.lockBodyScroll(false);
          if (_this2.options.restoreFocus && _this2.lastActiveElement) _this2.lastActiveElement.focus();
        }, 200);
        this.emit('close');
      }
      toggle() {
        this.isOpen ? this.close() : this.open();
      }
      _build() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'sheet-overlay';
        this.content = document.createElement('div');
        this.content.className = 'sheet-content';
        this.content.setAttribute('data-side', this.options.side);
        this.content.innerHTML = this.options.content;
        if (this.options.closeOnOverlayClick) this.overlay.addEventListener('click', this._boundHandlers.overlayClick);
        this.content.querySelectorAll('[data-sheet-close]').forEach(function(btn) {
          btn.addEventListener('click', this._boundHandlers.close);
        }.bind(this));
      }
      emit(event, data) {
        UI.utils.emitEvent(this.element, event, 'sheet', data);
      }
      destroy() {
        if (this.isOpen) this.close();
        this.element.classList.remove('sheet-initialized');
        delete this.element.sheet;
        this.emit('destroy');
      }
      setSide(side) {
        this.options.side = side;
        this.content.setAttribute('data-side', side);
      }
      setContent(content) {
        this.options.content = content;
        this.content.innerHTML = content;
        this.content.querySelectorAll('[data-sheet-close]').forEach(function(btn) {
          btn.removeEventListener('click', this._boundHandlers.close);
        }.bind(this));
        this.content.querySelectorAll('[data-sheet-close]').forEach(function(btn) {
          btn.addEventListener('click', this._boundHandlers.close);
        }.bind(this));
      }
    }(document.createElement('div'));
    document.querySelectorAll('[data-sheet-trigger]').forEach(function(trigger) {
      trigger.addEventListener('click', function() {
        var _document$querySelector;
        var side = trigger.dataset.sheetSide || 'right';
        var content = ((_document$querySelector = document.querySelector(trigger.dataset.sheetContent)) === null || _document$querySelector === void 0 ? void 0 : _document$querySelector.innerHTML) || '';
        window.Sheet.setSide(side);
        window.Sheet.setContent(content);
        window.Sheet.open();
      });
    });
    var resizeTimeout;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function() {
        document.querySelectorAll('.sidebar-initialized').forEach(function(el) {
          var _el$sidebar;
          return (_el$sidebar = el.sidebar) === null || _el$sidebar === void 0 ? void 0 : _el$sidebar.applyState();
        });
      }, 100);
    });
    document.addEventListener('click', function(e) {
      var _e$target$closest;
      var trigger = e.target.closest('.sidebar-trigger');
      if (trigger) {
        var _document$getElementById;
        (_document$getElementById = document.getElementById(trigger.dataset.controls)) === null || _document$getElementById === void 0 ? void 0 : _document$getElementById.sidebar.toggle();
      }
      if (e.target.matches('.sidebar-overlay.open')) {
        var _e$target$closest2;
        var openSidebar = (_e$target$closest = e.target.closest('.sidebar-provider')) === null || _e$target$closest === void 0 ? void 0 : _e$target$closest.querySelector('.sidebar.open');
        openSidebar === null || openSidebar === void 0 ? void 0 : (_e$target$closest2 = openSidebar.sidebar) === null || _e$target$closest2 === void 0 ? void 0 : _e$target$closest2.toggle();
      }
    });
    var html = document.documentElement;
    try {
      html.dataset.theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } catch (e) {
      html.dataset.theme = 'light';
    }
    document.addEventListener('click', function(_ref) {
      var target = _ref.target;
      if (target.closest('[data-theme-toggle]')) {
        var newTheme = html.dataset.theme === 'dark' ? 'light' : 'dark';
        html.dataset.theme = newTheme;
        localStorage.setItem('theme', newTheme);
      }
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
    document.body.classList.add('js-loaded');
  });

  var globalToastManager = new ToastManager();
  var toast = function toast(titleOrOptions, options) {
    if (options === void 0) {
      options = {};
    }
    return globalToastManager.show(titleOrOptions, options);
  };
  ['success', 'error', 'info', 'warning'].forEach(function(type) {
    toast[type] = function(title, options) {
      if (options === void 0) {
        options = {};
      }
      return globalToastManager[type](title, options);
    };
  });
  toast.dismiss = function(id) {
    return globalToastManager.dismiss(id);
  };

  var componentsToExport = {
    Accordion: Accordion,
    Calendar: Calendar,
    Carousel: Carousel,
    Combobox: Combobox,
    Command: Command,
    ContextMenu: ContextMenu,
    Dialog: Dialog,
    DropdownMenu: DropdownMenu,
    HoverCard: HoverCard,
    InputOTP: InputOTP,
    Menubar: Menubar,
    NavigationMenu: NavigationMenu,
    Pagination: Pagination,
    PopoverBehavior: PopoverBehavior,
    Progress: Progress,
    Resizable: Resizable,
    ScrollArea: ScrollArea,
    Select: Select,
    Sheet: window.Sheet,
    Sidebar: Sidebar,
    Slider: Slider,
    ToastManager: ToastManager,
    Tabs: Tabs,
    ToggleGroup: ToggleGroup,
    Toggle: Toggle,
    Tooltip: Tooltip,
    toast: toast
  };
  Object.assign(window, componentsToExport);

})(window, document);
