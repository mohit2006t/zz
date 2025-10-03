/**
 * @file input-otp.js
 * @description Manages the behavior of a multi-input One-Time Password (OTP) component.
 */
function inputOTP() {
    document.querySelectorAll('.input-otp:not(.input-otp-initialized)').forEach(otpElement => {
      const slots = Array.from(otpElement.querySelectorAll('.input-otp-slot'));
      const valueInput = otpElement.querySelector('input[type="hidden"]');
      
      if (slots.length === 0) return;
  
      let isProgrammaticFocus = false;
      let deselectHandler = null;
  
      const clearSelection = () => {
        slots.forEach(s => s.classList.remove('is-selected'));
        if (deselectHandler) {
          document.removeEventListener('click', deselectHandler);
          deselectHandler = null;
        }
      };
  
      const updateValue = () => {
        const value = slots.map(slot => slot.value).join('');
        if (valueInput) {
          valueInput.value = value;
        }
      };
  
      const handleSelectAll = () => {
        clearSelection();
        const filledSlots = slots.filter(slot => slot.value);
        if (filledSlots.length > 0) {
          filledSlots.forEach(slot => slot.classList.add('is-selected'));
          isProgrammaticFocus = true;
          filledSlots[filledSlots.length - 1].focus();
          isProgrammaticFocus = false;
  
          deselectHandler = (e) => {
            if (!otpElement.contains(e.target)) {
              clearSelection();
            }
          };
          document.addEventListener('click', deselectHandler);
        }
      };
      
      const handleMultiDelete = (selectedSlots) => {
        selectedSlots.forEach(slot => { slot.value = ''; });
        clearSelection();
        updateValue();
        slots[0].focus();
      };
  
      const handleSingleDelete = (currentIndex) => {
        let effectiveIndex = currentIndex;
        if (!slots[effectiveIndex].value && effectiveIndex > 0) {
          effectiveIndex--;
        }
        slots[effectiveIndex].value = '';
        updateValue();
        slots[effectiveIndex].focus();
      };
  
      otpElement.addEventListener('keydown', (e) => {
        const target = e.target;
        if (!target.matches('.input-otp-slot')) return;
        const index = slots.indexOf(target);
  
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
          e.preventDefault();
          handleSelectAll();
          return;
        }
  
        if (e.key === 'Backspace') {
          e.preventDefault();
          const selectedSlots = slots.filter(s => s.classList.contains('is-selected'));
          if (selectedSlots.length > 0) {
            handleMultiDelete(selectedSlots);
          } else {
            handleSingleDelete(index);
          }
          return;
        }
        
        clearSelection();
  
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            if (index > 0) slots[index - 1].focus();
            break;
          case 'ArrowRight':
            e.preventDefault();
            if (index < slots.length - 1) slots[index + 1].focus();
            break;
        }
      });
  
      otpElement.addEventListener('input', (e) => {
        const target = e.target;
        if (!target.matches('.input-otp-slot')) return;
        clearSelection();
        const index = slots.indexOf(target);
        if (target.value && index < slots.length - 1) {
          slots[index + 1].focus();
        }
        updateValue();
      });
  
      otpElement.addEventListener('paste', (e) => {
        e.preventDefault();
        clearSelection();
        const pastedData = e.clipboardData.getData('text').trim().slice(0, slots.length);
        pastedData.split('').forEach((char, i) => {
          if (slots[i]) {
            slots[i].value = char;
          }
        });
        const nextFocusIndex = Math.min(pastedData.length, slots.length - 1);
        slots[nextFocusIndex].focus();
        updateValue();
      });
  
      otpElement.addEventListener('focusin', (e) => {
        if (isProgrammaticFocus) return;
        if (e.target.matches('.input-otp-slot')) {
          clearSelection();
          setTimeout(() => e.target.select(), 0);
        }
      });
  
      otpElement.addEventListener('mousedown', (e) => {
        if (e.target.matches('.input-otp-slot')) {
          e.preventDefault();
          const firstEmptySlot = slots.find(slot => !slot.value);
          if (firstEmptySlot) {
            firstEmptySlot.focus();
          } else {
            slots[slots.length - 1].focus();
          }
        }
      });
      
      otpElement.classList.add('input-otp-initialized');
    });
  }
  
  document.addEventListener('DOMContentLoaded', inputOTP);
  