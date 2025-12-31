import React from 'react';
import { Link } from 'react-router-dom';
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
  MonitorIcon,
  ExpandIcon,
  SpinnerIcon,
  InfoIcon,
  GridIcon,
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
          <Link to="/" className="flex items-center gap-2">
            <DryormIcon size={32} className="text-white" />
            <span className="font-semibold text-lg text-white hidden sm:inline">DryORM</span>
          </Link>
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-2">
          {/* Theme toggle - cycles through system -> light -> dark */}
          <Button
            variant="header"
            size="icon"
            onClick={() => {
              const nextMode = { system: 'light', light: 'dark', dark: 'system' };
              dispatch({ type: 'SET_THEME_MODE', payload: nextMode[state.themeMode] });
            }}
            title={{ system: 'System Theme', light: 'Light Mode', dark: 'Dark Mode' }[state.themeMode]}
          >
            {state.themeMode === 'system' && <MonitorIcon size={20} className="text-white" />}
            {state.themeMode === 'light' && <SunIcon size={20} className="text-white" />}
            {state.themeMode === 'dark' && <MoonIcon size={20} className="text-white" />}
          </Button>

          {/* Browse - always visible */}
          <Link
            to="/browse"
            className="p-2 rounded hover:bg-white/10 transition-colors flex"
            title="Browse Snippets"
          >
            <GridIcon size={20} className="text-white" />
          </Link>

          {/* About - always visible */}
          <Link
            to="/about"
            className="p-2 rounded hover:bg-white/10 transition-colors flex"
            title="About"
          >
            <InfoIcon size={20} className="text-white" />
          </Link>

          {/* Code-related buttons - only on home page */}
          {state.currentPage === 'home' && (
            <>
              {/* Journey toggle */}
              <Button
                variant="header"
                size="icon"
                onClick={() => dispatch({ type: 'TOGGLE_JOURNEY_NAV' })}
                title="Learning Journeys"
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
