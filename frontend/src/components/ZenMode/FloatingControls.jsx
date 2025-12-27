import React from 'react';
import { useAppState } from '../../context/AppContext';
import { useExecute } from '../../hooks/useExecute';
import { useZenMode } from '../../hooks/useZenMode';
import { PlayIcon, SpinnerIcon, CompressIcon } from '../icons';

function FloatingControls() {
  const state = useAppState();
  const { execute, loading } = useExecute();
  const { exitZenMode } = useZenMode();

  return (
    <div className="floating-controls">
      {/* Query count badge */}
      {state.rawQueries.length > 0 && (
        <div className="bg-gray-800/80 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
          {state.rawQueries.length} {state.rawQueries.length === 1 ? 'query' : 'queries'}
        </div>
      )}

      {/* Exit zen mode button */}
      <button
        onClick={exitZenMode}
        className="bg-gray-800/80 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg backdrop-blur-sm transition-all hover:scale-105"
        title="Exit Zen Mode (Escape)"
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
