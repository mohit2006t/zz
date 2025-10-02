/**
 * @module useTheme
 * @description A PURE, headless, global state management engine for themes. It manages
 * persistence and system preference, but performs ZERO DOM manipulation. A subscriber
 * is responsible for applying the theme to the document.
 */
import { useState } from './useState.js';

const defaultConfig = {
  themes: ['light', 'dark'],
  defaultTheme: 'system',
  storageKey: 'ui-theme',
};

const createThemeManager = (options = {}) => {
  const config = { ...defaultConfig, ...options };
  let mediaQuery;

  // The entire complex state object is managed by our generic useState engine.
  const state = useState({
    theme: config.defaultTheme, // User's preference: 'light', 'dark', or 'system'
    resolvedTheme: 'light',      // The actual theme to be rendered: 'light' or 'dark'
  });

  // This function NO LONGER touches the DOM. It is a pure state calculator.
  const syncState = (themePreference) => {
    let resolved = themePreference;
    if (themePreference === 'system' && mediaQuery) {
      resolved = mediaQuery.matches ? 'dark' : 'light';
    }
    // Update the state object in one atomic operation.
    state.set({ theme: themePreference, resolvedTheme: resolved });
  };

  const set = (newTheme) => {
    if (![...config.themes, 'system'].includes(newTheme)) return;
    try {
      localStorage.setItem(config.storageKey, newTheme);
    } catch (e) {}
    syncState(newTheme);
  };

  const toggle = () => {
    const nextTheme = state.get().resolvedTheme === 'dark' ? 'light' : 'dark';
    set(nextTheme);
  };
  
  const initialize = () => {
    let initialTheme = config.defaultTheme;
    try {
      const storedTheme = localStorage.getItem(config.storageKey);
      if(storedTheme) initialTheme = storedTheme;
    } catch (e) {}

    if (window.matchMedia) {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => syncState(state.get().theme));
    }
    syncState(initialTheme);
  };
  
  initialize();

  return { 
    set, 
    toggle, 
    subscribe: state.subscribe,
    get state() { return state.get(); } 
  };
};

let managerInstance;

export const useTheme = (options) => {
  if (!managerInstance) {
    managerInstance = createThemeManager(options);
  }
  return managerInstance;
};

export default useTheme;