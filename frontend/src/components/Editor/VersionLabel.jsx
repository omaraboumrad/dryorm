import React from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { CogIcon } from '../icons';

function VersionLabel() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const handleClick = () => {
    dispatch({ type: 'TOGGLE_SETTINGS' });
  };

  // Determine what to display
  let versionLabel;
  let sha = null;

  if (state.currentRefInfo) {
    const { type, id } = state.currentRefInfo;
    if (type === 'pr') {
      versionLabel = `PR #${id}`;
    } else if (type === 'branch') {
      versionLabel = id;
    } else if (type === 'tag') {
      versionLabel = id;
    }
    if (state.currentRefInfo.sha) {
      sha = state.currentRefInfo.sha.slice(0, 7);
    }
  } else {
    // Get ORM version label (verbose version)
    const ormVersion = state.ormVersions?.find((v) => (v.value || v) === state.ormVersion);
    versionLabel = ormVersion?.label || 'Django 5.2.8';
  }

  // Get database label (verbose version)
  const db = state.databases?.find((d) => (d.value || d) === state.database);
  const dbLabel = db?.label || 'SQLite';

  return (
    <div className="flex items-center justify-end gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={handleClick}
        className="flex items-center gap-2 text-sm font-mono text-gray-700 dark:text-gray-300 hover:text-django-primary dark:hover:text-django-secondary transition-colors"
        title="Open settings"
      >
        <span className="text-django-secondary">{versionLabel}</span>
        {sha && (
          <span className="text-xs text-gray-500 dark:text-gray-400">({sha})</span>
        )}
        <span className="text-gray-400">·</span>
        <span className="text-django-secondary">{dbLabel}</span>
        <CogIcon size={16} className="text-gray-500 dark:text-gray-400" />
      </button>
    </div>
  );
}

export default VersionLabel;
