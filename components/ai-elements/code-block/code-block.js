function codeBlock() {
  document.addEventListener('click', async (event) => {
    const copyButton = event.target.closest('.code-block-copy-button');

    if (!copyButton) {
      return;
    }

    const block = copyButton.closest('.code-block');
    const code = block?.querySelector('pre > code');

    if (!code || copyButton.disabled) {
      return;
    }

    try {
      await navigator.clipboard.writeText(code.innerText);

      const originalIconHTML = copyButton.innerHTML;
      copyButton.innerHTML = '<i data-lucide="check"></i>';
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      copyButton.disabled = true;

      setTimeout(() => {
        copyButton.innerHTML = originalIconHTML;
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
        copyButton.disabled = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  });
}

document.addEventListener('DOMContentLoaded', codeBlock);