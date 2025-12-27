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
        <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
          <TerminalIcon size={18} className="text-django-secondary" />
          Output
        </span>
      }
      defaultOpen={true}
      className="bg-gray-50 dark:bg-gray-800"
      headerClassName="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
      contentClassName="border-t border-gray-200 dark:border-gray-700"
      rightContent={
        <CopyButton text={state.rawOutput} className="hover:bg-gray-200 dark:hover:bg-gray-600" />
      }
    >
      <pre className="px-3 py-2 text-sm font-mono whitespace-pre-wrap text-gray-800 dark:text-gray-200 overflow-x-auto custom-scrollbar">
        {state.rawOutput || <span className="text-gray-400 italic">No output</span>}
      </pre>
    </Collapsible>
  );
}

export default OutputSection;
