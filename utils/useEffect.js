/**
 * @module useEffect
 * @description A lifecycle engine for managing side effects with automatic cleanup,
 * inspired by React's useEffect hook. It provides a declarative way to handle setup
 * and teardown logic that is tied to a component's lifecycle.
 *
 * @example
 * // In a component class that needs to observe its own size...
 * import { useEffect } from './utils';
 *
 * class ResizableComponent {
 *   constructor(element) {
 *     this.element = element;
 *
 *     // The effect encapsulates the entire lifecycle of the observer.
 *     this.resizeEffect = useEffect(() => {
 *       // --- SETUP ---
 *       const resizeObserver = new ResizeObserver(entries => {
 *         console.log('Element resized:', entries[0].contentRect);
 *       });
 *       resizeObserver.observe(this.element);
 *
 *       // --- CLEANUP ---
 *       // The engine will call this function automatically on unmount.
 *       return () => resizeObserver.disconnect();
 *     });
 *   }
 *
 *   connectedCallback() {
 *     this.resizeEffect.mount();
 *   }
 *
 *   disconnectedCallback() {
 *     this.resizeEffect.unmount();
 *   }
 * }
 */
export const useEffect = (setupFn) => {
    if (typeof setupFn !== 'function') {
      throw new Error('useEffect requires a setup function.');
    }
  
    let isMounted = false;
    let cleanupFn = null;
  
    const mount = () => {
      if (isMounted) return;
      isMounted = true;
  
      const potentialCleanup = setupFn();
      if (typeof potentialCleanup === 'function') {
        cleanupFn = potentialCleanup;
      }
    };
  
    const unmount = () => {
      if (!isMounted) return;
      isMounted = false;
  
      cleanupFn?.();
      cleanupFn = null;
    };
  
    const rerun = () => {
      unmount();
      mount();
    };
  
    return {
      mount,
      unmount,
      rerun,
      destroy: unmount, // API consistency
    };
  };
  
  export default useEffect;