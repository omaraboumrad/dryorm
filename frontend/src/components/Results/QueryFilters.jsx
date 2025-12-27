import React from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { ReverseIcon } from '../icons';

const FILTER_TYPES = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DDL', 'TCL'];

function QueryFilters() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const toggleFilter = (filter) => {
    dispatch({
      type: 'SET_QUERY_FILTER',
      payload: {
        filter,
        value: !state.queryFilters[filter],
      },
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      {FILTER_TYPES.map((type) => (
        <button
          key={type}
          onClick={() => toggleFilter(type)}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors
            ${state.queryFilters[type]
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 ring-1 ring-green-300 dark:ring-green-700'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
        >
          {type}
        </button>
      ))}

      <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

      <button
        onClick={() => toggleFilter('reverse')}
        className={`p-1.5 rounded transition-colors
          ${state.queryFilters.reverse
            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        title="Reverse order"
      >
        <ReverseIcon size={16} />
      </button>
    </div>
  );
}

export default QueryFilters;
