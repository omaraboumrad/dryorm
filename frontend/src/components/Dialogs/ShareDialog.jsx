import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Dialog, Button, Checkbox } from '../common';
import { SpinnerIcon, CheckIcon } from '../icons';
import { saveSnippet } from '../../lib/api';
import { copyToClipboard } from '../../lib/utils';

function ShareDialog() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const [title, setTitle] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedUrl, setSavedUrl] = useState(null);

  const handleClose = () => {
    dispatch({ type: 'TOGGLE_SHARE_DIALOG' });
    // Reset state
    setTimeout(() => {
      setTitle('');
      setIsPrivate(false);
      setError(null);
      setSavedUrl(null);
    }, 200);
  };

  const handleSave = async (copyUrl = false) => {
    setSaving(true);
    setError(null);

    try {
      const data = {
        code: state.code,
        name: title || undefined,
        private: isPrivate,
        database: state.database,
        orm_version: state.ormVersion,
      };

      // Add ref info if present
      if (state.currentRefInfo) {
        data.ref_type = state.currentRefInfo.type;
        data.ref_id = state.currentRefInfo.id;
        data.ref_sha = state.currentRefInfo.sha;
      }

      const result = await saveSnippet(data);

      if (result.slug) {
        const url = `${window.location.origin}/${result.slug}`;
        setSavedUrl(url);

        // Update URL
        window.history.pushState({}, '', `/${result.slug}`);

        if (copyUrl) {
          await copyToClipboard(url);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to save snippet');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={state.showShareDialog}
      onClose={handleClose}
      title="Save & Share"
      maxWidth="max-w-md"
    >
      {savedUrl ? (
        // Success state
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckIcon size={24} className="text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Saved!
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Your snippet has been saved and is ready to share.
          </p>

          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
            <input
              type="text"
              readOnly
              value={savedUrl}
              className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 outline-none font-mono"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => copyToClipboard(savedUrl)}
            >
              Copy
            </Button>
          </div>

          <Button variant="secondary" onClick={handleClose}>
            Done
          </Button>
        </div>
      ) : (
        // Form state
        <div className="space-y-4">
          {/* Title input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your snippet a name..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Private checkbox */}
          <div>
            <Checkbox
              checked={isPrivate}
              onChange={setIsPrivate}
              label="Private (unlisted, only accessible via URL)"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleSave(false)}
              disabled={saving || !state.code.trim()}
              loading={saving}
            >
              Save
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSave(true)}
              disabled={saving || !state.code.trim()}
              loading={saving}
            >
              Save & Copy URL
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

export default ShareDialog;
