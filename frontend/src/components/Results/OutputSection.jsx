import React from 'react';
import { useAppState } from '../../context/AppContext';
import { Collapsible, CopyButton } from '../common';
import { TerminalIcon } from '../icons';

function OutputSection() {
  const state = useAppState();

  if (!state.rawOutput) {
    return null;
  }

  return (
    <Collapsible
      title={
        <span className="flex items-center gap-2 font-bold text-theme-text">
          <TerminalIcon size={18} />
          Output
        </span>
      }
      defaultOpen={true}
      className=""
      headerClassName="h-10 px-3 bg-results-header border-b border-theme-border"
      contentClassName=""
      rightContent={
        <CopyButton text={state.rawOutput} className="hover:bg-gray-200 dark:hover:bg-gray-600" />
      }
    >
      <pre className="p-3 text-sm font-mono whitespace-pre-wrap text-theme-text overflow-x-auto custom-scrollbar">
        {state.rawOutput || <span className="text-theme-text-muted">No output</span>}
      </pre>
    </Collapsible>
  );
}

export default OutputSection;
