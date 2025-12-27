import React from 'react';
import { useAppState } from '../../context/AppContext';
import CodeEditor from '../Editor/CodeEditor';
import ResultPanel from '../Results/ResultPanel';

function SplitPane() {
  const state = useAppState();

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-57px)]">
      {/* Editor pane */}
      <div
        className={`lg:w-1/2 h-full lg:border-r border-gray-200 dark:border-gray-700 ${
          state.showCode ? 'block' : 'hidden lg:block'
        }`}
      >
        <CodeEditor />
      </div>

      {/* Results pane */}
      <div
        className={`lg:w-1/2 h-full ${
          state.showResult ? 'block' : 'hidden lg:block'
        }`}
      >
        <ResultPanel />
      </div>
    </div>
  );
}

export default SplitPane;
