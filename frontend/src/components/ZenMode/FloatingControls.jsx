import React from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { useExecute } from '../../hooks/useExecute';
import { useZenMode } from '../../hooks/useZenMode';
import { PlayIcon, SpinnerIcon, CompressIcon, CogIcon, ShareIcon, DryormIcon } from '../icons';

function FloatingControls() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { execute, loading } = useExecute();
  const { exitZenMode } = useZenMode();

  return (
    <div className="floating-controls">
      {/* Logo at top */}
      <div className="floating-controls-btn">
        <DryormIcon size={20} className="text-white" />
      </div>

      {/* Run button */}
      <button
        onClick={() => execute(false)}
        disabled={loading}
        className="floating-run-btn"
        title="Run (Cmd+Enter)"
      >
        {loading ? (
          <SpinnerIcon size={20} />
        ) : (
          <PlayIcon size={20} />
        )}
      </button>

      {/* Settings button */}
      <button
        onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}
        className="floating-controls-btn"
        title="Settings"
      >
        <CogIcon size={20} />
      </button>

      {/* Share button */}
      <button
        onClick={() => dispatch({ type: 'TOGGLE_SHARE_DIALOG' })}
        className="floating-controls-btn"
        title="Share"
      >
        <ShareIcon size={20} />
      </button>

      {/* Exit zen mode button */}
      <button
        onClick={exitZenMode}
        className="floating-controls-btn"
        title="Exit Zen Mode (Cmd+.)"
      >
        <CompressIcon size={20} />
      </button>
    </div>
  );
}

export default FloatingControls;
