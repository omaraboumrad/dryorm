import React, { useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { ReverseIcon } from '../icons';
import { getQueryType } from '../../lib/utils';

const FILTER_TYPES = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DDL', 'TCL'];

function QueryFilters() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  // Count queries by type
  const typeCounts = useMemo(() => {
    const counts = {};
    FILTER_TYPES.forEach(type => counts[type] = 0);
    state.rawQueries.forEach(query => {
      const type = getQueryType(query.sql);
      if (counts[type] !== undefined) {
        counts[type]++;
      }
    });
    return counts;
  }, [state.rawQueries]);

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
    <div className="flex flex-wrap items-center gap-2">
      {FILTER_TYPES.map((type) => (
        <button
          key={type}
          onClick={() => toggleFilter(type)}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors
            ${state.queryFilters[type]
              ? 'bg-django-secondary/20 dark:bg-django-primary text-django-primary dark:text-django-secondary ring-1 ring-django-secondary/50 dark:ring-django-primary'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
        >
          {type}
          {typeCounts[type] > 0 && (
            <span className="ml-1 opacity-70">{typeCounts[type]}</span>
          )}
        </button>
      ))}

      <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

      <button
        onClick={() => toggleFilter('reverse')}
        className={`p-1.5 rounded transition-colors
          ${state.queryFilters.reverse
            ? 'bg-django-secondary/20 dark:bg-django-primary text-django-tertiary dark:text-django-secondary'
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
