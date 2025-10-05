/**
 * -----------------------------------------------------------------
 * Input OTP
 *
 * A set of input fields for entering a one-time password, with
 * automatic focus management.
 * -----------------------------------------------------------------
 */

export default class InputOTP {
  constructor(element) {
    this.element = element;
    this.inputs = [...this.element.querySelectorAll('.input-otp-field')];

    this.init();
  }

  init() {
    this.inputs.forEach((input, index) => {
      // Move to next input on entry
      input.addEventListener('input', () => {
        if (input.value.length === 1 && index < this.inputs.length - 1) {
          this.inputs[index + 1].focus();
        }
      });

      // Handle backspace
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && input.value.length === 0 && index > 0) {
          this.inputs[index - 1].focus();
        }
      });

      // Handle paste
      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        const otpChars = pasteData.replace(/[^a-zA-Z0-9]/g, '').split('');

        this.inputs.forEach((input, i) => {
          if (otpChars[i]) {
            input.value = otpChars[i];
            if (i < this.inputs.length - 1) {
                this.inputs[i + 1].focus();
            }
          }
        });

        // If paste is complete, check if the last input should be focused
        if (pasteData.length >= this.inputs.length) {
            this.inputs[this.inputs.length - 1].focus();
        }
      });
    });
  }
}