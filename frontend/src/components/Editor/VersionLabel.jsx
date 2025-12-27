import React from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';

function VersionLabel() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const handleClick = () => {
    dispatch({ type: 'TOGGLE_REF_DIALOG' });
  };

  // Determine what to display
  let label = state.ormVersion || 'django-5.2';
  let badge = null;

  if (state.currentRefInfo) {
    const { type, id, title } = state.currentRefInfo;
    if (type === 'pr') {
      label = `PR #${id}`;
      badge = title ? title.slice(0, 30) + (title.length > 30 ? '...' : '') : null;
    } else if (type === 'branch') {
      label = id;
    } else if (type === 'tag') {
      label = id;
    }
  }

  return (
    <button
      onClick={handleClick}
      className="absolute bottom-4 right-4 px-3 py-1.5 rounded-md text-sm font-mono
        bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
        text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600
        transition-colors shadow-sm flex items-center gap-2"
      title="Change Django ORM version or select a GitHub ref"
    >
      <span className="text-django-secondary">{label}</span>
      {badge && (
        <span className="text-xs text-gray-500 dark:text-gray-400 max-w-[150px] truncate">
          {badge}
        </span>
      )}
    </button>
  );
}

export default VersionLabel;
