/**
 * Optimized and concise input component logic.
 */
function input() {
  document.body.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.copy-btn, .input-copy-btn');
    const clearBtn = e.target.closest('.clear-btn, .input-clear-btn');
    const toggleBtn = e.target.closest('.password-toggle, .password-toggle-btn');

    if (copyBtn) {
      const input = copyBtn.closest('.input-wrapper')?.querySelector('.input');
      if (input) {
        navigator.clipboard.writeText(input.value).then(() => {
          copyBtn.classList.add('is-copied');
          setTimeout(() => copyBtn.classList.remove('is-copied'), 1500);
        }).catch(console.error);
      }
    }

    if (clearBtn) {
      const wrapper = clearBtn.closest('.input-wrapper');
      const input = wrapper?.querySelector('.input');
      if (input) {
        input.value = '';
        input.focus();
        wrapper.classList.remove('has-value');
      }
    }

    if (toggleBtn) {
      const input = toggleBtn.closest('.input-wrapper')?.querySelector('.input');
      if (input) {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        toggleBtn.classList.toggle('toggled', isPassword);
        toggleBtn.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
      }
    }
  });

  // Listen to input events to toggle clear button visibility
  document.body.addEventListener('input', (e) => {
    if (e.target.matches('.input-wrapper .input')) {
      const wrapper = e.target.closest('.input-wrapper');
      if (wrapper.querySelector('.input-clear-btn')) {
        wrapper.classList.toggle('has-value', e.target.value.length > 0);
      }
    }
  });

  // Pre-check inputs with pre-filled values to show clear buttons
  document.querySelectorAll('.input-wrapper .input').forEach(input => {
    if (input.value.length > 0 && input.closest('.input-wrapper').querySelector('.input-clear-btn')) {
      input.closest('.input-wrapper').classList.add('has-value');
    }
  });

  // File input custom text display
  document.querySelectorAll('.input-file input[type=file]').forEach(fileInput => {
    const textEl = fileInput.parentElement.querySelector('.input-file-text');
    const defaultText = textEl?.textContent || 'Select file(s)';
    fileInput.addEventListener('change', () => {
      textEl.textContent = fileInput.files.length ? [...fileInput.files].map(f => f.name).join(', ') : defaultText;
    });
  });
}

document.addEventListener('DOMContentLoaded', input);
