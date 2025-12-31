import React from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { CogIcon, GitHubIcon } from '../icons';

function VersionLabel() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const handleClick = () => {
    dispatch({ type: 'TOGGLE_SETTINGS' });
  };

  // Determine what to display
  let versionLabel;
  let sha = null;
  let title = null;
  let githubUrl = null;

  if (state.currentRefInfo) {
    const { type, id } = state.currentRefInfo;
    if (type === 'pr') {
      versionLabel = `PR #${id}`;
      githubUrl = `https://github.com/django/django/pull/${id}`;
    } else if (type === 'branch') {
      versionLabel = id;
      githubUrl = `https://github.com/django/django/tree/${id}`;
    } else if (type === 'tag') {
      versionLabel = id;
      githubUrl = `https://github.com/django/django/releases/tag/${id}`;
    }
    if (state.currentRefInfo.sha) {
      sha = state.currentRefInfo.sha.slice(0, 7);
    }
    if (state.currentRefInfo.title) {
      title = state.currentRefInfo.title;
    }
  } else {
    // Get ORM version label (verbose version)
    const ormVersion = state.ormVersions?.find((v) => (v.value || v) === state.ormVersion);
    versionLabel = ormVersion?.label || 'Django 5.2.8';
  }

  // Get database label (verbose version)
  const db = state.databases?.find((d) => (d.value || d) === state.database);
  const dbLabel = db?.label || 'SQLite';

  const versionContent = (
    <>
      {githubUrl && <GitHubIcon size={16} className="text-gray-600 dark:text-gray-400" />}
      <span className={githubUrl ? "text-django-secondary" : ""}>{versionLabel}</span>
      {sha && (
        <span className="text-xs text-gray-500 dark:text-gray-400">({sha})</span>
      )}
      {title && (
        <span className="text-xs text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{title}</span>
      )}
    </>
  );

  return (
    <div className="h-10 flex items-center justify-end gap-2 px-3 bg-theme-surface border-b border-theme-border">
      <div className="flex items-center gap-2 text-sm font-mono text-gray-700 dark:text-gray-300">
        {githubUrl ? (
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-django-primary dark:hover:text-django-secondary transition-colors"
            title="View on GitHub"
          >
            {versionContent}
          </a>
        ) : (
          <span className="flex items-center gap-2">{versionContent}</span>
        )}
        <span className="text-gray-400">·</span>
        <span>{dbLabel}</span>
        <button
          onClick={handleClick}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title="Open settings"
        >
          <CogIcon size={20} className="text-django-primary dark:text-django-secondary" />
        </button>
      </div>
    </div>
  );
}

export default VersionLabel;
