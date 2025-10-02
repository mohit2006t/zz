/**
 * @module useCollapsible
 * @description A robust utility for managing collapsible content with smooth animations,
 * lifecycle callbacks, and ARIA attribute handling.
 *
 * @example
 * import { useCollapsible } from './utils';
 *
 * const trigger = document.getElementById('faq-trigger');
 * const content = document.getElementById('faq-content');
 *
 * const { toggle, destroy } = useCollapsible(trigger, content, {
 *   isExpanded: false,
 *   transitionDuration: 300,
 *   onShow: () => console.log('Collapsible is opening...'),
 *   onHidden: () => console.log('Collapsible is fully closed.'),
 * });
 *
 * // The trigger element will now automatically handle toggling.
 * // To programmatically control it or clean up later:
 * // toggle();
 * // destroy();
 */

import { useId } from './useId.js';
import { awaitMotion } from './useMotion.js';

const defaultConfig = {
  isExpanded: false,
  transitionDuration: 250,
  expandedTriggerClass: 'is-expanded',
  collapsedTriggerClass: 'is-collapsed',
  onShow: () => {},
  onShown: () => {},
  onHide: () => {},
  onHidden: () => {},
};

export const useCollapsible = (trigger, content, options = {}) => {
  if (!trigger || !content) {
    throw new Error('Collapsible requires a trigger and a content element.');
  }

  const config = { ...defaultConfig, ...options };
  let isExpanded = config.isExpanded;
  let isTransitioning = false;
  let isDisabled = false;

  const show = async () => {
    if (isExpanded || isTransitioning || isDisabled) return;
    isTransitioning = true;
    config.onShow({ trigger, content });

    content.hidden = false;
    trigger.classList.remove(config.collapsedTriggerClass);
    trigger.classList.add(config.expandedTriggerClass);
    trigger.setAttribute('aria-expanded', 'true');

    const contentHeight = content.scrollHeight;
    content.style.height = `${contentHeight}px`;

    await awaitMotion(content, { propertyName: 'height' });

    content.style.height = 'auto';
    isExpanded = true;
    isTransitioning = false;
    config.onShown({ trigger, content });
  };

  const hide = async () => {
    if (!isExpanded || isTransitioning || isDisabled) return;
    isTransitioning = true;
    config.onHide({ trigger, content });

    content.style.height = `${content.scrollHeight}px`;
    void content.offsetHeight;
    content.style.height = '0';

    trigger.classList.remove(config.expandedTriggerClass);
    trigger.classList.add(config.collapsedTriggerClass);
    trigger.setAttribute('aria-expanded', 'false');

    await awaitMotion(content, { propertyName: 'height' });

    content.hidden = true;
    isExpanded = false;
    isTransitioning = false;
    config.onHidden({ trigger, content });
  };

  const toggle = () => (isExpanded ? hide() : show());
  const handleTriggerClick = () => toggle();

  const enable = () => {
    isDisabled = false;
    trigger.removeAttribute('aria-disabled');
  };

  const disable = () => {
    isDisabled = true;
    trigger.setAttribute('aria-disabled', 'true');
  };

  const destroy = () => {
    trigger.removeEventListener('click', handleTriggerClick);
    trigger.removeAttribute('aria-expanded');
    trigger.removeAttribute('aria-controls');
    trigger.removeAttribute('aria-disabled');
    trigger.classList.remove(config.expandedTriggerClass, config.collapsedTriggerClass);

    content.removeAttribute('hidden');
    Object.assign(content.style, {
      height: '',
      overflow: '',
      transitionProperty: '',
      transitionDuration: '',
    });
  };

  const initialize = () => {
    content.id = content.id || useId('collapsible-content');
    trigger.setAttribute('aria-controls', content.id);

    Object.assign(content.style, {
      overflow: 'hidden',
      transitionProperty: 'height',
      transitionDuration: `${config.transitionDuration}ms`,
    });

    if (isExpanded) {
      content.hidden = false;
      content.style.height = 'auto';
      trigger.setAttribute('aria-expanded', 'true');
      trigger.classList.add(config.expandedTriggerClass);
    } else {
      content.hidden = true;
      content.style.height = '0';
      trigger.setAttribute('aria-expanded', 'false');
      trigger.classList.add(config.collapsedTriggerClass);
    }

    trigger.addEventListener('click', handleTriggerClick);
  };

  initialize();

  return {
    show,
    hide,
    toggle,
    enable,
    disable,
    destroy,
    get isExpanded() {
      return isExpanded;
    },
    get isDisabled() {
      return isDisabled;
    },
  };
};

export default useCollapsible;