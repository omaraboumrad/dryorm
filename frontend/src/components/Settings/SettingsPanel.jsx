import React from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Dialog, Select, GroupedSelect, Checkbox, Button } from '../common';
import { XIcon } from '../icons';

function SettingsPanel() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const handleClose = () => {
    dispatch({ type: 'TOGGLE_SETTINGS' });
  };

  // Build database options
  const databaseOptions = state.databases.map((db) => ({
    value: db.value || db,
    label: db.label || db,
  }));

  // Build ORM version options
  const ormVersionOptions = state.ormVersions.map((v) => ({
    value: v.value || v,
    label: v.label || v,
  }));

  // Build template options grouped by ORM version
  const templateGroups = {};
  if (state.templates) {
    for (const [ormVersion, templates] of Object.entries(state.templates)) {
      if (templates && templates.length > 0) {
        templateGroups[ormVersion] = templates.map((t) => ({
          value: t.value || t.name || t,
          label: t.label || t.name || t,
        }));
      }
    }
  }

  return (
    <Dialog
      open={state.showSettings}
      onClose={handleClose}
      title="Settings"
      maxWidth="max-w-md"
    >
      <div className="space-y-6">
        {/* Database selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Database
          </label>
          <Select
            value={state.database}
            onChange={(value) => dispatch({ type: 'SET_DATABASE', payload: value })}
            options={databaseOptions}
            placeholder="Select database..."
          />
        </div>

        {/* ORM Version selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Django ORM Version
          </label>
          <Select
            value={state.ormVersion}
            onChange={(value) => dispatch({ type: 'SET_ORM_VERSION', payload: value })}
            options={ormVersionOptions}
            placeholder="Select version..."
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Or use a{' '}
            <button
              onClick={() => {
                handleClose();
                dispatch({ type: 'TOGGLE_REF_DIALOG' });
              }}
              className="text-django-secondary hover:underline"
            >
              GitHub ref (PR/branch/tag)
            </button>
          </p>
        </div>

        {/* Template selection */}
        {Object.keys(templateGroups).length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Code Template
            </label>
            <GroupedSelect
              value=""
              onChange={(value) => {
                // Load template code
                const template = findTemplate(state.templates, value);
                if (template && template.code) {
                  dispatch({ type: 'SET_CODE', payload: template.code });
                }
              }}
              groups={templateGroups}
              placeholder="Load a template..."
            />
          </div>
        )}

        {/* No-cache checkbox */}
        <div>
          <Checkbox
            checked={state.ignoreCache}
            onChange={(checked) => dispatch({ type: 'SET_IGNORE_CACHE', payload: checked })}
            label="Ignore cache (always re-run)"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-7">
            Force re-execution even if the code was run before
          </p>
        </div>

        {/* GitHub ref info */}
        {state.currentRefInfo && (
          <div className="bg-theme-surface border border-theme-border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-theme-text">
                  Using GitHub {state.currentRefInfo.type}
                </p>
                <p className="text-xs text-theme-text-secondary">
                  {state.currentRefInfo.type === 'pr' && `#${state.currentRefInfo.id}`}
                  {state.currentRefInfo.type !== 'pr' && state.currentRefInfo.id}
                  {state.currentRefInfo.sha && ` (${state.currentRefInfo.sha.slice(0, 7)})`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dispatch({ type: 'CLEAR_CURRENT_REF' })}
              >
                <XIcon size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}

// Helper to find a template by value
function findTemplate(templates, value) {
  for (const ormTemplates of Object.values(templates)) {
    const template = ormTemplates.find((t) => (t.value || t.name || t) === value);
    if (template) return template;
  }
  return null;
}

export default SettingsPanel;
