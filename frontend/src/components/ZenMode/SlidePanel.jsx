import React, { useState } from 'react';
import { useAppState } from '../../context/AppContext';
import { XIcon } from '../icons';
import OutputSection from '../Results/OutputSection';
import QueriesSection from '../Results/QueriesSection';

function SlidePanel() {
  const state = useAppState();
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
      {/* Backdrop - transparent, just for click-to-close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-35"
          onClick={handleClose}
        />
      )}

      {/* Panel */}
      <div className={`slide-panel ${isOpen ? 'open' : ''} z-40`}>
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 z-10"
        >
          <XIcon size={18} />
        </button>

        {/* Content */}
        <div className="space-y-4">
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
