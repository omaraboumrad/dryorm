import React from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { useExecute } from '../../hooks/useExecute';
import { useZenMode } from '../../hooks/useZenMode';
import { Button } from '../common';
import {
  DryormIcon,
  PlayIcon,
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
    <header className="bg-django-primary px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Left: Logo and title */}
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 text-white">
            <DryormIcon size={32} className="text-white" />
            <span className="font-semibold text-lg hidden sm:inline">DryORM</span>
          </a>
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-2">
          {/* Journey toggle */}
          <Button
            variant="header"
            size="icon"
            onClick={() => dispatch({ type: 'TOGGLE_JOURNEY_NAV' })}
            title="Learning Journeys"
            className="hidden lg:flex"
          >
            <JourneyIcon size={20} className={state.showJourneyNav ? 'text-django-secondary' : 'text-white'} />
          </Button>

          {/* Zen mode toggle */}
          <Button
            variant="header"
            size="icon"
            onClick={toggleZenMode}
            title="Zen Mode (Cmd+.)"
          >
            <ExpandIcon size={20} className="text-white" />
          </Button>

          {/* Dark mode toggle */}
          <Button
            variant="header"
            size="icon"
            onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
            title={state.darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {state.darkMode ? <SunIcon size={20} className="text-white" /> : <MoonIcon size={20} className="text-white" />}
          </Button>

          {/* Share button */}
          <Button
            variant="header"
            size="icon"
            onClick={() => dispatch({ type: 'TOGGLE_SHARE_DIALOG' })}
            title="Share"
          >
            <ShareIcon size={20} className="text-white" />
          </Button>

          {/* Run button */}
          <Button
            variant="primary"
            onClick={handleRun}
            onKeyDown={handleForceRun}
            disabled={loading}
            title="Run (Cmd+Enter)"
          >
            {loading ? (
              <SpinnerIcon size={18} className="text-white" />
            ) : (
              <PlayIcon size={18} className="text-white" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Header;
