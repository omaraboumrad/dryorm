import { useEffect, useCallback } from 'react';
import { useAppState, useAppDispatch } from '../context/AppContext';

/**
 * Hook for managing Zen Mode
 */
export function useZenMode() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const toggleZenMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_ZEN_MODE' });
  }, [dispatch]);

  const exitZenMode = useCallback(() => {
    if (state.zenMode) {
      dispatch({ type: 'TOGGLE_ZEN_MODE' });
    }
  }, [state.zenMode, dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+. or Ctrl+. to toggle zen mode
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault();
        toggleZenMode();
        return;
      }

      // Escape to exit zen mode (only if in zen mode)
      if (e.key === 'Escape' && state.zenMode) {
        e.preventDefault();
        exitZenMode();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.zenMode, toggleZenMode, exitZenMode]);

  return {
    zenMode: state.zenMode,
    toggleZenMode,
    exitZenMode,
  };
}

export default useZenMode;
