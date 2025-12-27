import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { XIcon } from '../icons';
import OutputSection from '../Results/OutputSection';
import QueriesSection from '../Results/QueriesSection';

function SlidePanel() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);

  // Auto-open when results come in
  React.useEffect(() => {
    if (state.rawQueries.length > 0 || state.rawOutput) {
      setIsOpen(true);
    }
  }, [state.rawQueries, state.rawOutput]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const hasResults = state.rawOutput || state.rawQueries.length > 0 || state.error;

  if (!hasResults) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-35"
          onClick={handleClose}
        />
      )}

      {/* Panel */}
      <div className={`slide-panel ${isOpen ? 'open' : ''} z-40`}>
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <h2 className="font-medium text-gray-900 dark:text-white">Results</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Error display */}
          {state.error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap font-mono">
                {state.error}
              </pre>
            </div>
          )}

          {/* Output */}
          {state.rawOutput && <OutputSection />}

          {/* Queries */}
          {state.rawQueries.length > 0 && <QueriesSection />}
        </div>
      </div>

      {/* Toggle button when panel is closed */}
      {!isOpen && hasResults && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 bg-gray-800/80 hover:bg-gray-700 text-white px-4 py-2 rounded-full shadow-lg backdrop-blur-sm transition-all text-sm"
        >
          Show Results
        </button>
      )}
    </>
  );
}

export default SlidePanel;
