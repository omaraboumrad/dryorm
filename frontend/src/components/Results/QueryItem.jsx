import React, { useRef, useEffect, useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Collapsible, QueryTypeBadge, CopyButton } from '../common';
import { colorizeSql, getQueryType, isMobile } from '../../lib/utils';

function QueryItem({ query, index, isHighlighted }) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const itemRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  // Auto-expand and scroll into view when highlighted
  useEffect(() => {
    if (isHighlighted) {
      setIsOpen(true);
      // Scroll into view with a small delay to allow expansion animation
      setTimeout(() => {
        itemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
  }, [isHighlighted]);

  const type = getQueryType(query.sql);

  const handleLineClick = () => {
    if (query.line_number && state.editorView) {
      // Navigate to line in editor
      const line = state.editorView.state.doc.line(query.line_number);
      state.editorView.dispatch({
        selection: { anchor: line.from },
        scrollIntoView: true,
      });

      // Focus the editor
      state.editorView.focus();

      // Switch to code tab on mobile
      if (isMobile()) {
        dispatch({ type: 'SET_SHOW_CODE', payload: true });
      }
    }
  };

  return (
    <div
      ref={itemRef}
      className={`border-b border-theme-border last:border-b-0 hover:bg-results-surface transition-colors ${
        isHighlighted ? 'bg-results-surface query-highlight' : ''
      }`}
    >
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        title={
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <QueryTypeBadge type={type} />
            <span className="text-xs font-semibold text-django-primary dark:text-theme-text whitespace-nowrap">
              {query.time}s
            </span>
            {query.line_number && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLineClick();
                }}
                className="text-xs text-django-primary dark:text-django-secondary hover:text-django-tertiary font-mono hover:underline"
              >
                L{query.line_number}
              </button>
            )}
            <span className="text-xs text-django-primary dark:text-theme-text truncate font-mono mr-4">
              {query.sql.replace(/\s+/g, ' ').trim()}
            </span>
          </div>
        }
        headerClassName="px-3 py-2"
        rightContent={
          <CopyButton text={query.sql} size={16} />
        }
      >
        <div className="pl-8 pr-3 pb-3">
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
      </Collapsible>
    </div>
  );
}

export default QueryItem;
