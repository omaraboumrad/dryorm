import React from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Dialog } from '../common';

function HtmlPreview() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const handleClose = () => {
    dispatch({ type: 'TOGGLE_HTML_PREVIEW' });
  };

  if (!state.htmlTemplate) return null;

  return (
    <Dialog
      open={state.showHtmlPreview}
      onClose={handleClose}
      title="Template Preview"
      maxWidth="max-w-4xl"
    >
      <div className="h-[60vh] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <iframe
          srcDoc={state.htmlTemplate}
          title="HTML Template Preview"
          className="w-full h-full bg-white"
          sandbox="allow-scripts"
        />
      </div>
    </Dialog>
  );
}

export default HtmlPreview;
