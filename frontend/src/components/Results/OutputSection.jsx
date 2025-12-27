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
        <span className="flex items-center gap-2 font-bold text-django-text dark:text-green-100">
          <TerminalIcon size={18} />
          Output
        </span>
      }
      defaultOpen={true}
      className=""
      headerClassName="px-4 py-2 bg-django-secondary/20 dark:bg-green-800 border-b border-django-primary/10 dark:border-green-700"
      contentClassName=""
      rightContent={
        <CopyButton text={state.rawOutput} className="hover:bg-gray-200 dark:hover:bg-gray-600" />
      }
    >
      <pre className="p-3 text-sm font-mono whitespace-pre-wrap text-django-text dark:text-green-100 overflow-x-auto custom-scrollbar">
        {state.rawOutput || <span className="text-django-text/50 dark:text-green-300">No output</span>}
      </pre>
    </Collapsible>
  );
}

export default OutputSection;
