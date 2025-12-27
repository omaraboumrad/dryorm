import React from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { useExecute } from '../../hooks/useExecute';
import { useZenMode } from '../../hooks/useZenMode';
import { Button } from '../common';
import {
  DryormIcon,
  PlayIcon,
  CogIcon,
  ShareIcon,
  JourneyIcon,
  MoonIcon,
  SunIcon,
  ExpandIcon,
  SpinnerIcon,
} from '../icons';

function Header() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { execute, loading } = useExecute();
  const { toggleZenMode } = useZenMode();

  const handleRun = () => {
    execute(false);
  };

  const handleForceRun = (e) => {
    if (e.shiftKey) {
      execute(true);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Left: Logo and title */}
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 text-gray-900 dark:text-white">
            <DryormIcon size={32} className="text-green-600" />
            <span className="font-semibold text-lg hidden sm:inline">DryORM</span>
          </a>
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-2">
          {/* Journey toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dispatch({ type: 'TOGGLE_JOURNEY_NAV' })}
            title="Learning Journeys"
            className="hidden lg:flex"
          >
            <JourneyIcon size={20} className={state.showJourneyNav ? 'text-green-600' : ''} />
          </Button>

          {/* Zen mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleZenMode}
            title="Zen Mode (Cmd+.)"
          >
            <ExpandIcon size={20} />
          </Button>

          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
            title={state.darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {state.darkMode ? <SunIcon size={20} /> : <MoonIcon size={20} />}
          </Button>

          {/* Share button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dispatch({ type: 'TOGGLE_SHARE_DIALOG' })}
            title="Share"
          >
            <ShareIcon size={20} />
          </Button>

          {/* Settings toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}
            title="Settings"
          >
            <CogIcon size={20} className={state.showSettings ? 'text-green-600' : ''} />
          </Button>

          {/* Run button */}
          <Button
            variant="primary"
            onClick={handleRun}
            onKeyDown={handleForceRun}
            disabled={loading}
            title="Run (Cmd+Enter)"
            className="gap-2"
          >
            {loading ? (
              <SpinnerIcon size={18} />
            ) : (
              <PlayIcon size={18} />
            )}
            <span className="hidden sm:inline">Run</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Header;
