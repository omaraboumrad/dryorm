import React from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Collapsible, QueryTypeBadge, CopyButton } from '../common';
import { colorizeSql, getQueryType, formatTime, isMobile } from '../../lib/utils';

function QueryItem({ query, index, isHighlighted }) {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const type = getQueryType(query.sql);

  const handleLineClick = () => {
    if (query.line && state.editorView) {
      // Navigate to line in editor
      const line = state.editorView.state.doc.line(query.line);
      state.editorView.dispatch({
        selection: { anchor: line.from },
        scrollIntoView: true,
      });

      // Switch to code tab on mobile
      if (isMobile()) {
        dispatch({ type: 'SET_SHOW_CODE', payload: true });
      }
    }
  };

  return (
    <div
      className={`rounded-lg border transition-colors ${
        isHighlighted
          ? 'border-django-secondary/50 dark:border-django-primary bg-django-secondary/10/50 dark:bg-django-primary/20 query-highlight'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
      }`}
    >
      <Collapsible
        title={
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <QueryTypeBadge type={type} />
            <span className="text-sm font-mono text-gray-600 dark:text-gray-400 truncate flex-1">
              {truncateSql(query.sql, 60)}
            </span>
          </div>
        }
        defaultOpen={false}
        headerClassName="p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50"
        rightContent={
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {query.time !== undefined && (
              <span>{formatTime(query.time)}</span>
            )}
            {query.line && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLineClick();
                }}
                className="text-django-secondary hover:text-django-tertiary font-mono hover:underline"
              >
                L{query.line}
              </button>
            )}
            <CopyButton text={query.sql} size={16} />
          </div>
        }
      >
        <div className="p-3 border-t border-gray-100 dark:border-gray-700">
          <pre
            className="text-sm font-mono whitespace-pre-wrap break-all text-gray-800 dark:text-gray-200 overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: colorizeSql(query.sql) }}
          />
          {query.params && query.params.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400">Params: </span>
              <code className="text-xs font-mono text-gray-600 dark:text-gray-300">
                {JSON.stringify(query.params)}
              </code>
            </div>
          )}
        </div>
      </Collapsible>
    </div>
  );
}

function truncateSql(sql, maxLength) {
  if (!sql) return '';
  const normalized = sql.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return normalized.slice(0, maxLength) + '...';
}

export default QueryItem;
