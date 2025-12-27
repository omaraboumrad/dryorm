import React, { useMemo, useState } from 'react';
import { useAppState } from '../../context/AppContext';
import { CopyButton } from '../common';
import { ListIcon, ChevronDownIcon, ChevronRightIcon } from '../icons';
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
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-800">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex-shrink-0 w-full flex items-center justify-between text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <div className="flex items-center gap-2">
          <IconComponent size={16} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
            <ListIcon size={18} />
            Queries
            <span className="text-sm font-normal text-gray-500">
              ({shownCount === totalCount ? totalCount : `${shownCount}/${totalCount}`})
            </span>
          </span>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <CopyButton
            text={allSql}
            className="hover:bg-gray-200 dark:hover:bg-gray-600"
            label="Copy all"
          />
        </div>
      </button>

      {/* Content - fills remaining height when open */}
      {isOpen && (
        <div className="flex-1 min-h-0 flex flex-col border-t border-gray-200 dark:border-gray-700">
          <div className="flex-shrink-0 px-3 py-2">
            <QueryFilters />
          </div>

          {filteredQueries.length === 0 ? (
            <p className="px-3 py-2 text-gray-400 dark:text-gray-500 text-sm italic">
              No queries match the current filters
            </p>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto px-3 pb-2 space-y-2">
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
