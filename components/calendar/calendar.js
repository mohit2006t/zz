/**
 * @file calendar.js
 * @description Simple default calendar component.
 */

export class Calendar {
    constructor(calendarElement, options = {}) {
      if (!calendarElement || calendarElement.calendar) return;
  
      this.element = calendarElement;
      this.options = { ...this.defaults, ...options };
  
      // Core state
      this.today = new Date();
      this.currentDate = new Date();
      this.selectedDate = null;
  
      // Constants
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
      // Calculate min/max years
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
      // Navigation buttons
      const navBtn = e.target.closest('.calendar-nav-btn');
      if (navBtn) {
        const newMonth = navBtn.dataset.action === 'previous' ? 
          this.currentDate.getMonth() - 1 : 
          this.currentDate.getMonth() + 1;
        this.currentDate.setMonth(newMonth);
        this.render();
        return;
      }
  
      // Day selection
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
  
  // Auto-initialize
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.calendar-container:not(.calendar-initialized)').forEach(el => {
      new Calendar(el);
    });
  });
  
  export default Calendar;
  