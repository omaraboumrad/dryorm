import React from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { useExecute } from '../../hooks/useExecute';
import { useZenMode } from '../../hooks/useZenMode';
import { PlayIcon, SpinnerIcon, CompressIcon, CogIcon, ShareIcon } from '../icons';

function FloatingControls() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { execute, loading } = useExecute();
  const { exitZenMode } = useZenMode();

  // Get version label
  let versionLabel;
  if (state.currentRefInfo) {
    const { type, id } = state.currentRefInfo;
    if (type === 'pr') {
      versionLabel = `PR #${id}`;
    } else {
      versionLabel = id;
    }
  } else {
    const ormVersion = state.ormVersions?.find((v) => (v.value || v) === state.ormVersion);
    versionLabel = ormVersion?.label || state.ormVersion || 'Django 5.2';
  }

  // Get database label
  const db = state.databases?.find((d) => (d.value || d) === state.database);
  const dbLabel = db?.label || state.database || 'SQLite';

  return (
    <div className="floating-controls">
      {/* Version and settings */}
      <div className="bg-gray-800/80 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm flex items-center gap-2">
        <span>{versionLabel}</span>
        <span className="text-gray-400">·</span>
        <span>{dbLabel}</span>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}
          className="p-1 hover:bg-white/20 rounded transition-colors"
          title="Open settings"
        >
          <CogIcon size={16} />
        </button>
      </div>

      {/* Share button */}
      <button
        onClick={() => dispatch({ type: 'TOGGLE_SHARE_DIALOG' })}
        className="bg-gray-800/80 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg backdrop-blur-sm transition-all hover:scale-105"
        title="Share"
      >
        <ShareIcon size={20} />
      </button>

      {/* Exit zen mode button */}
      <button
        onClick={exitZenMode}
        className="bg-gray-800/80 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg backdrop-blur-sm transition-all hover:scale-105"
        title="Exit Zen Mode (Cmd+.)"
      >
        <CompressIcon size={20} />
      </button>

      {/* Run button */}
      <button
        onClick={() => execute(false)}
        disabled={loading}
        className="floating-run-btn"
        title="Run (Cmd+Enter)"
      >
        {loading ? (
          <SpinnerIcon size={24} />
        ) : (
          <PlayIcon size={24} />
        )}
      </button>
    </div>
  );
}

export default FloatingControls;
