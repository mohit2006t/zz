/**
 * @file sonner.js
 * @description A flexible toast notification system with a global API.
 */
function sonner() {
    let container = null;
    let currentPosition = 'bottom-right';
    const toasts = new Map();
    
    const defaults = {
        position: 'bottom-right',
        duration: 4000,
        maxToasts: 5,
        pauseOnHover: true
    };
  
    const getOrCreateContainer = (position = 'bottom-right') => {
        if (container && currentPosition === position) {
            return container;
        }
        
        const className = `sonner-container sonner-container-${position}`;
        if (container) {
            container.className = className;
        } else {
            container = document.createElement('div');
            container.className = className;
            document.body.appendChild(container);
        }
        
        currentPosition = position;
        return container;
    };
  
    const createToast = (options) => {
        const { 
            title, 
            description, 
            duration = defaults.duration, 
            icon, 
            type = 'default', 
            action, 
            position 
        } = options;
        
        if (position && position !== currentPosition) {
            container = getOrCreateContainer(position);
        }
        
        const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const sonnerElement = document.createElement('div');
        sonnerElement.className = `sonner sonner-${type}`;
        sonnerElement.setAttribute('data-toast-id', toastId);
        
        const defaultIcons = { 
            success: 'check-circle', 
            error: 'x-circle', 
            warning: 'alert-triangle', 
            info: 'info' 
        };
        
        const iconName = icon || defaultIcons[type];
        if (iconName && type !== 'default') {
            const iconEl = document.createElement('i');
            iconEl.className = 'sonner-icon';
            iconEl.setAttribute('data-lucide', iconName);
            sonnerElement.appendChild(iconEl);
        }
        
        const content = document.createElement('div');
        content.className = 'sonner-content';
        content.innerHTML = `
            <div class="sonner-title">${title}</div>
            ${description ? `<div class="sonner-description">${description}</div>` : ''}
        `;
        sonnerElement.appendChild(content);
        
        if (action && action.label && typeof action.onClick === 'function') {
            const actionWrapper = document.createElement('div');
            actionWrapper.className = 'sonner-action-wrapper';
            
            const actionButton = document.createElement('button');
            actionButton.className = action.class || 'btn btn-sm';
            actionButton.textContent = action.label;
            actionButton.addEventListener('click', (e) => {
                e.stopPropagation();
                action.onClick();
                if (action.dismiss !== false) {
                    removeToast();
                }
            });
            
            actionWrapper.appendChild(actionButton);
            sonnerElement.appendChild(actionWrapper);
        }
        
        const closeButton = document.createElement('button');
        closeButton.className = 'sonner-close-button btn-dim';
        closeButton.setAttribute('aria-label', 'Close');
        closeButton.innerHTML = '<i data-lucide="x" style="width: 1rem; height: 1rem;"></i>';
        sonnerElement.appendChild(closeButton);
        
        const removeToast = () => {
            if (sonnerElement.isRemoving) return;
            sonnerElement.isRemoving = true;
            clearTimeout(sonnerElement.timeoutId);
            sonnerElement.setAttribute('data-state', 'closed');
            
            setTimeout(() => {
                if (sonnerElement.parentNode) {
                    sonnerElement.remove();
                }
                toasts.delete(toastId);
            }, 250);
        };
        
        if (defaults.pauseOnHover) {
            sonnerElement.addEventListener('mouseenter', () => clearTimeout(sonnerElement.timeoutId));
            sonnerElement.addEventListener('mouseleave', () => {
                if (duration > 0) sonnerElement.timeoutId = setTimeout(removeToast, duration);
            });
        }
        
        closeButton.addEventListener('click', removeToast);
        
        if (duration > 0) sonnerElement.timeoutId = setTimeout(removeToast, duration);
        
        if (toasts.size >= defaults.maxToasts) {
            const oldestToast = toasts.values().next().value;
            if (oldestToast && oldestToast.element) {
                oldestToast.removeToast();
            }
        }
        
        container.appendChild(sonnerElement);
        
        toasts.set(toastId, {
            id: toastId,
            element: sonnerElement,
            removeToast,
            options
        });
        
        requestAnimationFrame(() => {
            sonnerElement.setAttribute('data-state', 'open');
            if (window.lucide) {
                window.lucide.createIcons({ nodes: [sonnerElement] });
            }
        });
        
        return toastId;
    };
  
    const show = (titleOrOptions, options = {}) => {
        const toastOptions = typeof titleOrOptions === 'object' ? titleOrOptions : { ...options, title: titleOrOptions };
        if (!toastOptions.title) {
            console.error('Toast must have a title.');
            return null;
        }
        return createToast(toastOptions);
    };
  
    const success = (title, options = {}) => show({ title, ...options, type: 'success' });
    const error = (title, options = {}) => show({ title, ...options, type: 'error' });
    const info = (title, options = {}) => show({ title, ...options, type: 'info' });
    const warning = (title, options = {}) => show({ title, ...options, type: 'warning' });
  
    const dismiss = (toastId) => {
        if (toastId) {
            const toast = toasts.get(toastId);
            if (toast) toast.removeToast();
        } else {
            toasts.forEach(toast => toast.removeToast());
        }
    };
  
    const setPosition = (position) => {
        defaults.position = position;
        container = getOrCreateContainer(position);
    };
  
    getOrCreateContainer(defaults.position);
  
    window.toast = show;
    window.toast.success = success;
    window.toast.error = error;
    window.toast.info = info;
    window.toast.warning = warning;
    window.toast.dismiss = dismiss;
    window.toast.setPosition = setPosition;
  }
  
  document.addEventListener('DOMContentLoaded', sonner);
  