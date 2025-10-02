/**
 * @module useClipboard
 * @description A robust, optimized, and versatile utility for copying text. It
 * prioritizes the modern `navigator.clipboard.writeText()` API with a seamless
 * and resilient fallback to the legacy `document.execCommand('copy')`.
 */
export const useClipboard = (options = {}) => {
  const config = {
    onSuccess: () => {},
    onError: () => {},
    ...options,
  };

  const legacyCopy = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    Object.assign(textArea.style, {
      position: 'absolute',
      opacity: '0',
      left: '-9999px',
      top: '-9999px',
    });
    document.body.appendChild(textArea);
    try {
      textArea.select();
      if (!document.execCommand('copy')) {
        throw new Error('Copy command failed.');
      }
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const copy = async (source) => {
    const textToCopy =
      typeof source === 'string'
        ? source
        : source?.getAttribute('data-clipboard-text') ??
          source?.value ??
          source?.textContent;

    if (textToCopy === null || typeof textToCopy !== 'string') {
      const error = new Error('Invalid source for clipboard copy.');
      config.onError(error);
      return;
    }

    try {
      await (navigator.clipboard?.writeText(textToCopy) ?? legacyCopy(textToCopy));
      config.onSuccess(textToCopy);
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      config.onError(error);
    }
  };

  return { copy };
};

export default useClipboard;