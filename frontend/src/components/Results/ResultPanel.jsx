import React from 'react';
import { useAppState } from '../../context/AppContext';
import OutputSection from './OutputSection';
import QueriesSection from './QueriesSection';
import ReturnedData from './ReturnedData';
import { ErdIcon, ExternalLinkIcon } from '../icons';

function ResultPanel() {
  const state = useAppState();

  // Check if we have any results
  const hasResults = state.rawOutput || state.rawQueries.length > 0 || state.returnedData || state.error;

  if (!hasResults) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 p-8">
        <div className="text-center">
          <p className="text-lg mb-2">No results yet</p>
          <p className="text-sm">
            Write some Python code and press <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">Cmd+Enter</kbd> to run
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Error display */}
      {state.error && (
        <div className="flex-shrink-0 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-3 py-2">
          <h3 className="text-red-800 dark:text-red-200 font-medium mb-1">Error</h3>
          <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap font-mono">
            {state.error}
          </pre>
        </div>
      )}

      {/* Output section */}
      {state.rawOutput && (
        <div className="flex-shrink-0">
          <OutputSection />
        </div>
      )}

      {/* ERD link */}
      {state.erdLink && (
        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-django-primary/10 dark:border-green-700">
          <ErdIcon size={20} className="text-django-secondary" />
          <a
            href={state.erdLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-django-secondary hover:text-django-tertiary flex items-center gap-1"
          >
            View ERD Diagram
            <ExternalLinkIcon size={16} />
          </a>
        </div>
      )}

      {/* HTML template link */}
      {state.htmlTemplate && (
        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-django-primary/10 dark:border-green-700">
          <button
            onClick={() => state.dispatch({ type: 'TOGGLE_HTML_PREVIEW' })}
            className="text-django-secondary hover:text-django-tertiary underline"
          >
            Show Template Preview
          </button>
        </div>
      )}

      {/* Queries section - fills remaining space */}
      {state.rawQueries.length > 0 && (
        <div className="flex-1 min-h-0">
          <QueriesSection />
        </div>
      )}

      {/* Returned data tables */}
      {state.returnedData && <div className="flex-shrink-0"><ReturnedData data={state.returnedData} /></div>}
    </div>
  );
}

export default ResultPanel;
