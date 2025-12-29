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
              ? 'bg-django-primary text-white'
              : 'bg-theme-surface/50 text-theme-text-muted hover:bg-theme-surface hover:text-theme-text'
            }`}
        >
          {type}
          {typeCounts[type] > 0 && (
            <span className="ml-1 opacity-70">{typeCounts[type]}</span>
          )}
        </button>
      ))}

      <div className="w-px h-5 bg-theme-border mx-1" />

      <button
        onClick={() => toggleFilter('reverse')}
        className={`p-1.5 rounded transition-colors
          ${state.queryFilters.reverse
            ? 'bg-django-primary text-white'
            : 'bg-theme-surface/50 text-theme-text-muted hover:bg-theme-surface hover:text-theme-text'
          }`}
        title="Reverse order"
      >
        <ReverseIcon size={16} />
      </button>
    </div>
  );
}

export default QueryFilters;
