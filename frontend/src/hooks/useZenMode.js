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

  const toggleJourneyNav = useCallback(() => {
    dispatch({ type: 'TOGGLE_JOURNEY_NAV' });
  }, [dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+. or Ctrl+. to toggle zen mode
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault();
        toggleZenMode();
        return;
      }
      // Cmd+j or Ctrl+j to toggle journey sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        toggleJourneyNav();
        return;
      }
      // Note: Escape does NOT exit zen mode to preserve vim keybindings
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleZenMode, toggleJourneyNav]);

  return {
    zenMode: state.zenMode,
    toggleZenMode,
    exitZenMode,
  };
}

export default useZenMode;
