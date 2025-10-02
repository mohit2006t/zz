// usePortal.js
/**
 * @module usePortal
 * @description A utility for rendering content in a React portal (outside the normal DOM hierarchy).
 * Useful for modals, tooltips, popovers, and other floating UI elements.
 *
 * @example
 * import { usePortal } from './utils/index.js';
 *
 * const content = document.createElement('div');
 * content.textContent = 'Portal content';
 * 
 * const { mount, unmount, destroy } = usePortal(content, {
 *   container: document.body,
 *   className: 'portal-container'
 * });
 * 
 * mount();
 */

const defaultConfig = {
  container: null, // defaults to document.body
  className: 'portal-root',
  prepend: false,
};

export class UsePortal {
  constructor(content, options = {}) {
    if (!content) {
      throw new Error('Portal requires content element.');
    }

    this.content = content;
    this.config = { ...defaultConfig, ...options };
    this.portalContainer = null;
    this.isMounted = false;
  }

  mount() {
    if (this.isMounted) return;

    const targetContainer = this.config.container || document.body;
    
    // Create portal container if it doesn't exist
    if (!this.portalContainer) {
      this.portalContainer = document.createElement('div');
      this.portalContainer.className = this.config.className;
    }

    // Append content to portal container
    this.portalContainer.appendChild(this.content);

    // Mount portal container to target
    if (this.config.prepend) {
      targetContainer.prepend(this.portalContainer);
    } else {
      targetContainer.appendChild(this.portalContainer);
    }

    this.isMounted = true;
  }

  unmount() {
    if (!this.isMounted) return;

    if (this.portalContainer && this.portalContainer.parentNode) {
      this.portalContainer.parentNode.removeChild(this.portalContainer);
    }

    this.isMounted = false;
  }

  update(newContent) {
    if (newContent) {
      this.content = newContent;
      if (this.isMounted && this.portalContainer) {
        this.portalContainer.innerHTML = '';
        this.portalContainer.appendChild(this.content);
      }
    }
  }

  destroy() {
    this.unmount();
    this.portalContainer = null;
    this.content = null;
  }

  get mounted() {
    return this.isMounted;
  }
}

export const usePortal = (content, options = {}) => {
  const portal = new UsePortal(content, options);
  
  return {
    mount: () => portal.mount(),
    unmount: () => portal.unmount(),
    update: (newContent) => portal.update(newContent),
    destroy: () => portal.destroy(),
    get isMounted() { return portal.mounted; },
  };
};

export default usePortal;
