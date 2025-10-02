// index.js
/**
 * @module Utility Engine
 * @description This file serves as the single entry point (a "barrel" file) for the entire
 * utility engine. It exports all the core utilities so that components can import
 * them from a single, consistent location.
 *
 * @example
 * import { useModal, useTheme, useInteractions } from './utils/index.js';
 *
 * // Example usage of a modal with theme
 * const { show, hide } = useModal({ container, dialog, backdrop });
 * const theme = useTheme({ defaultTheme: 'light' });
 * 
 * // Example of interaction utilities
 * const interactions = useInteractions(element, {
 *   hover: true,
 *   clickOutside: true
 * });
 */

// ============================================================================
// CORE UTILITIES
// ============================================================================
export { default as useId } from './useId.js';
export { default as useClipboard } from './useClipboard.js';

// ============================================================================
// PORTAL
// ============================================================================
export { default as usePortal } from './usePortal.js';

// ============================================================================
// STATE MANAGEMENT
// ============================================================================
export { default as useToggle } from './useToggle.js';

// ============================================================================
// THEME MANAGEMENT
// ============================================================================
export { default as useTheme } from './useTheme.js';

// ============================================================================
// INTERACTION UTILITIES
// ============================================================================
export { default as useInteractions } from './useInteractions.js';

// ============================================================================
// DRAG & DROP
// ============================================================================
export { default as useDnd } from './useDnd.js';

// ============================================================================
// KEYBOARD MANAGEMENT
// ============================================================================
export { default as useKeyboard } from './useKeyboard.js';

// ============================================================================
// PERFORMANCE OPTIMIZATION
// ============================================================================
export { default as useThrottle } from './useThrottle.js';

// ============================================================================
// FOCUS MANAGEMENT
// ============================================================================
export { default as useFocus } from './useFocus.js';
export { default as useRovingFocus } from './useRovingFocus.js';

// ============================================================================
// POSITIONING
// ============================================================================
export { default as usePosition } from './usePosition.js';
export { default as usePopper } from './usePopper.js';

// ============================================================================
// DISMISSAL
// ============================================================================
export { default as useDismiss } from './useDismiss.js';

// ============================================================================
// RESIZING
// ============================================================================
export { default as useResize } from './useResize.js';

// ============================================================================
// ANIMATION
// ============================================================================
export { default as useMotion, awaitMotion } from './useMotion.js';

// ============================================================================
// SCROLL MANAGEMENT
// ============================================================================
export { default as useScroll } from './useScroll.js';

// ============================================================================
// UI COMPONENTS (Legacy - kept for backward compatibility)
// ============================================================================
export { default as useModal } from './useModal.js';
export { default as useCollapsible } from './useCollapsible.js';
export { default as useToast } from './useToast.js';
export { default as useSelection } from './useSelection.js';