import React from 'react';
import { useAppState } from '../../context/AppContext';
import CodeEditor from '../Editor/CodeEditor';
import ResultPanel from '../Results/ResultPanel';

function SplitPane() {
  const state = useAppState();

  // Zen mode: editor only, centered
  if (state.zenMode) {
    return (
      <div className="h-full overflow-hidden flex justify-center">
        <div className="zen-editor-container">
          <CodeEditor />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Editor pane */}
      <div
        className={`lg:w-1/2 h-full overflow-auto lg:border-r border-gray-200 dark:border-gray-700 ${
          state.showCode ? 'block' : 'hidden lg:block'
        }`}
      >
        <CodeEditor />
      </div>

      {/* Results pane */}
      <div
        className={`lg:w-1/2 h-full overflow-y-auto overflow-x-hidden bg-results-bg ${
          state.showResult ? 'block' : 'hidden lg:block'
        }`}
      >
        <ResultPanel />
      </div>
    </div>
  );
}

export default SplitPane;
