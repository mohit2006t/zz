/**
 * @module useMachine
 * @description A finite state machine (FSM) engine for managing components with
 * complex, explicit states. It prevents impossible states and makes logic robust
 * and predictable by defining all possible states and transitions.
 *
 * @example
 * // In a FileUploader component...
 * const uploaderMachine = useMachine({
 *   initial: 'idle',
 *   context: { progress: 0, error: null },
 *   states: {
 *     idle: {
 *       on: { UPLOAD: 'uploading' }
 *     },
 *     uploading: {
 *       entry: 'startUpload', // Action to run on entry
 *       on: {
 *         UPLOAD_SUCCESS: 'success',
 *         UPLOAD_FAILURE: { target: 'failure', actions: 'setErrorMessage' },
 *         UPDATE_PROGRESS: { actions: 'setProgress' }
 *       }
 *     },
 *     success: {
 *       on: { UPLOAD_ANOTHER: 'idle' }
 *     },
 *     failure: {
 *       on: { RETRY: 'uploading' }
 *     }
 *   }
 * });
 *
 * // The component sends events to the machine
 * uploaderMachine.send('UPLOAD');
 */
import { useState } from './useState.js';

export const useMachine = (machineConfig) => {
  const { initial, states, context } = machineConfig;
  
  // The state holds the current state's name (value) and its data (context)
  const state = useState({ value: initial, context: context || {} });

  const send = (event, payload = {}) => {
    const currentStateValue = state.get().value;
    const currentStateDefinition = states[currentStateValue];
    
    if (!currentStateDefinition?.on) return;
    
    const transition = currentStateDefinition.on[event];
    if (!transition) return;
    
    const targetStateValue = typeof transition === 'string' ? transition : transition.target;
    
    // Check guards (conditions)
    if (transition.cond && !transition.cond(state.get().context, payload)) {
      return;
    }
    
    // Create a mutable copy for this transition
    let newContext = { ...state.get().context };
    
    // Execute actions
    if (transition.actions) {
      const actions = Array.isArray(transition.actions) ? transition.actions : [transition.actions];
      actions.forEach(actionName => {
        const actionFn = machineConfig.actions?.[actionName];
        if (actionFn) {
          newContext = actionFn(newContext, payload) || newContext;
        }
      });
    }

    state.set({ value: targetStateValue, context: newContext });
  };

  return {
    send,
    subscribe: state.subscribe,
    get state() { return state.get(); }
  };
};

export default useMachine;