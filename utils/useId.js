/**
 * @module useId
 * @description Generates a unique ID string, prioritizing crypto.randomUUID for
 * randomness and providing a fallback for older browsers. Essential for ARIA attributes.
 */
export const useId = (length = 8) => {
  const id =
    crypto?.randomUUID?.() ??
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) =>
      ((c === 'x' ? Math.random() * 16 : (Math.random() * 16) & 0x3) | 0x8).toString(16)
    );
  return id.replace(/-/g, '').substring(0, length);
};

export default useId;