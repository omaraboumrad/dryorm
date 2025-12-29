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
      className={`border-b border-theme-border last:border-b-0 ${
        isHighlighted ? 'bg-results-surface query-highlight' : ''
      }`}
    >
      <Collapsible
        title={
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <QueryTypeBadge type={type} />
            <span className="text-xs font-semibold text-django-primary dark:text-theme-text whitespace-nowrap">
              {formatTime(query.time)}
            </span>
            {query.line && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLineClick();
                }}
                className="text-xs text-django-primary dark:text-django-secondary hover:text-django-tertiary font-mono hover:underline"
              >
                L{query.line}
              </button>
            )}
            <span className="text-xs text-django-primary dark:text-theme-text truncate">
              {truncateSql(query.sql, 60)}
            </span>
          </div>
        }
        defaultOpen={false}
        headerClassName="py-3 hover:bg-results-surface rounded-sm"
        rightContent={
          <CopyButton text={query.sql} size={16} />
        }
      >
        <div className="pb-3">
          <div className="bg-results-surface p-3 rounded border border-theme-border">
            <pre
              className="whitespace-pre-wrap text-xs font-mono text-theme-text overflow-auto"
              dangerouslySetInnerHTML={{ __html: colorizeSql(query.sql) }}
            />
            {query.params && query.params.length > 0 && (
              <div className="mt-2 pt-2 border-t border-theme-border">
                <span className="text-xs text-theme-text-muted">Params: </span>
                <code className="text-xs font-mono text-theme-text">
                  {JSON.stringify(query.params)}
                </code>
              </div>
            )}
          </div>
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
