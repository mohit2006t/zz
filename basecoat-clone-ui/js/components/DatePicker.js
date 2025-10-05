/**
 * -----------------------------------------------------------------
 * Date Picker
 *
 * A component that allows users to select a date from a calendar
 * interface.
 * -----------------------------------------------------------------
 */

export default class DatePicker {
  constructor(element) {
    this.element = element;
    this.input = this.element.querySelector('.date-picker-input');
    this.trigger = this.element.querySelector('.date-picker-trigger');
    this.prevBtn = this.element.querySelector('.date-picker-prev-btn');
    this.nextBtn = this.element.querySelector('.date-picker-next-btn');
    this.monthYearEl = this.element.querySelector('.date-picker-month-year');
    this.daysContainer = this.element.querySelector('.date-picker-days');

    this.currentDate = new Date();
    this.selectedDate = null;

    this.init();
  }

  init() {
    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = this.element.classList.toggle('open');
      if (isOpen) {
        this.currentDate = this.selectedDate || new Date();
        this.renderCalendar(this.currentDate);
      }
    });

    this.prevBtn.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.renderCalendar(this.currentDate);
    });

    this.nextBtn.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.renderCalendar(this.currentDate);
    });

    document.addEventListener('click', (e) => {
        if (!this.element.contains(e.target)) {
            this.element.classList.remove('open');
        }
    });
  }

  renderCalendar(date) {
    this.daysContainer.innerHTML = '';
    const month = date.getMonth();
    const year = date.getFullYear();

    this.monthYearEl.textContent = `${date.toLocaleString('default', { month: 'long' })} ${year}`;

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Add padding days from previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      const dayEl = document.createElement('div');
      dayEl.classList.add('date-picker-day', 'is-other-month');
      this.daysContainer.appendChild(dayEl);
    }

    // Add days of the current month
    for (let i = 1; i <= daysInMonth; i++) {
      const dayEl = document.createElement('div');
      dayEl.classList.add('date-picker-day');
      dayEl.textContent = i;
      const dayDate = new Date(year, month, i);

      if (dayDate.toDateString() === new Date().toDateString()) {
        dayEl.classList.add('is-today');
      }

      if (this.selectedDate && dayDate.toDateString() === this.selectedDate.toDateString()) {
        dayEl.classList.add('is-selected');
      }

      dayEl.addEventListener('click', () => {
        this.selectedDate = dayDate;
        this.input.value = this.selectedDate.toLocaleDateString();
        this.element.classList.remove('open');
      });

      this.daysContainer.appendChild(dayEl);
    }
  }
}