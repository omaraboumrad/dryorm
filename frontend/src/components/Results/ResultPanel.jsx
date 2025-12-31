import React from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import OutputSection from './OutputSection';
import QueriesSection from './QueriesSection';
import ReturnedData from './ReturnedData';
import { SpinnerIcon } from '../icons';

function ResultPanel() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  // Check if we have any results
  const hasResults = state.rawOutput || state.rawQueries.length > 0 || state.returnedData || state.error;

  if (!hasResults) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 p-8">
        <div className="text-center">
          {state.loading ? (
            <>
              <SpinnerIcon size={32} className="mx-auto mb-3 text-django-secondary" />
              <p className="text-lg">Executing code, please wait!</p>
            </>
          ) : (
            <>
              <p className="text-lg mb-2">No results yet</p>
              <p className="text-sm">
                Write some Python code and press <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">Cmd+Enter</kbd> to run
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Error display */}
      {state.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-3 py-2">
          <h3 className="text-red-800 dark:text-red-200 font-medium mb-1">Error</h3>
          <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap font-mono">
            {state.error}
          </pre>
        </div>
      )}

      {/* Output section */}
      {state.rawOutput && <OutputSection />}

      {/* HTML template link */}
      {state.htmlTemplate && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-theme-border">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_HTML_PREVIEW' })}
            className="text-django-secondary hover:text-django-tertiary underline"
          >
            Show Template Preview
          </button>
        </div>
      )}

      {/* Queries section */}
      {state.rawQueries.length > 0 && <QueriesSection />}

      {/* Returned data tables */}
      {state.returnedData && <ReturnedData data={state.returnedData} />}
    </div>
  );
}

export default ResultPanel;
