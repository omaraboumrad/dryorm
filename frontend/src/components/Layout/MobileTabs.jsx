import React from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { CodeIcon, ListIcon } from '../icons';

function MobileTabs() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <button
        onClick={() => dispatch({ type: 'SET_SHOW_CODE', payload: true })}
        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors
          ${state.showCode
            ? 'text-green-600 border-b-2 border-green-600 bg-white dark:bg-gray-900'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
      >
        <CodeIcon size={18} />
        Code
      </button>
      <button
        onClick={() => dispatch({ type: 'SET_SHOW_RESULT', payload: true })}
        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors
          ${state.showResult
            ? 'text-green-600 border-b-2 border-green-600 bg-white dark:bg-gray-900'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
      >
        <ListIcon size={18} />
        Result
        {state.rawQueries.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
            {state.rawQueries.length}
          </span>
        )}
      </button>
    </div>
  );
}

export default MobileTabs;
