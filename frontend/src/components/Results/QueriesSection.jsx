import React, { useMemo, useState } from 'react';
import { useAppState } from '../../context/AppContext';
import { CopyButton } from '../common';
import { DbIcon, ChevronDownIcon, ChevronRightIcon } from '../icons';
import QueryFilters from './QueryFilters';
import QueryItem from './QueryItem';
import { getQueryType } from '../../lib/utils';

function QueriesSection() {
  const state = useAppState();
  const [isOpen, setIsOpen] = useState(true);

  // Filter and sort queries
  const filteredQueries = useMemo(() => {
    let queries = state.rawQueries.map((q, idx) => ({ ...q, originalIndex: idx }));

    // Filter by type
    queries = queries.filter((query) => {
      const type = getQueryType(query.sql);
      return state.queryFilters[type];
    });

    // Reverse if needed
    if (state.queryFilters.reverse) {
      queries = [...queries].reverse();
    }

    return queries;
  }, [state.rawQueries, state.queryFilters]);

  // Get all SQL for copy button
  const allSql = useMemo(() => {
    return filteredQueries.map((q) => q.sql).join('\n\n');
  }, [filteredQueries]);

  const totalCount = state.rawQueries.length;
  const shownCount = filteredQueries.length;

  const IconComponent = isOpen ? ChevronDownIcon : ChevronRightIcon;

  return (
    <div>
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group h-10 w-full flex items-center justify-between text-left px-3 bg-results-header border-b border-theme-border"
      >
        <div className="flex items-center gap-2">
          <IconComponent size={16} className="text-theme-text flex-shrink-0" />
          <span className="flex items-center gap-2 font-bold text-theme-text">
            <DbIcon size={18} />
            Queries
            <span className="text-sm font-normal text-theme-text-secondary">
              ({shownCount === totalCount ? totalCount : `${shownCount}/${totalCount}`})
            </span>
          </span>
        </div>
        <div onClick={(e) => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton
            text={allSql}
            className="hover:bg-gray-200 dark:hover:bg-gray-600"
            label="Copy all"
          />
        </div>
      </button>

      {/* Content */}
      {isOpen && (
        <div>
          <div className="h-10 flex items-center px-3 border-b border-theme-border">
            <QueryFilters />
          </div>

          {filteredQueries.length === 0 ? (
            <p className="px-3 py-2 text-gray-400 dark:text-gray-500 text-sm italic">
              No queries match the current filters
            </p>
          ) : (
            <div>
              {filteredQueries.map((query) => (
                <QueryItem
                  key={query.originalIndex}
                  query={query}
                  index={query.originalIndex}
                  isHighlighted={state.highlightedQueryIndex === query.originalIndex}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QueriesSection;
