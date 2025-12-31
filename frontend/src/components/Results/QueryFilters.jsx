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

  // Short labels for smaller screens
  const shortLabels = {
    SELECT: 'SEL',
    INSERT: 'INS',
    UPDATE: 'UPD',
    DELETE: 'DEL',
    DDL: 'DDL',
    TCL: 'TCL',
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
      {FILTER_TYPES.map((type) => (
        <button
          key={type}
          onClick={() => toggleFilter(type)}
          className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded transition-colors whitespace-nowrap flex-shrink-0
            ${state.queryFilters[type]
              ? 'bg-django-primary text-white'
              : 'bg-theme-surface/50 text-theme-text-muted hover:bg-theme-surface hover:text-theme-text'
            }`}
        >
          <span className="sm:hidden">{shortLabels[type]}</span>
          <span className="hidden sm:inline">{type}</span>
          {typeCounts[type] > 0 && (
            <span className="ml-0.5 sm:ml-1 opacity-70">{typeCounts[type]}</span>
          )}
        </button>
      ))}

      <div className="w-px h-4 sm:h-5 bg-theme-border mx-0.5 sm:mx-1 flex-shrink-0" />

      <button
        onClick={() => toggleFilter('reverse')}
        className={`p-1 sm:p-1.5 rounded transition-colors flex-shrink-0
          ${state.queryFilters.reverse
            ? 'bg-django-primary text-white'
            : 'bg-theme-surface/50 text-theme-text-muted hover:bg-theme-surface hover:text-theme-text'
          }`}
        title="Reverse order"
      >
        <ReverseIcon size={14} className="sm:w-4 sm:h-4" />
      </button>
    </div>
  );
}

export default QueryFilters;
