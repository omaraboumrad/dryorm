import React, { useState, useEffect, useCallback } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Dialog, Button } from '../common';
import { SearchIcon, GitHubIcon, CheckIcon, SpinnerIcon } from '../icons';
import { searchRefs, fetchRef } from '../../lib/api';
import { useDebounce } from '../../hooks/useDebounce';

const TABS = [
  { id: 'pr', label: 'Pull Requests' },
  { id: 'branch', label: 'Branches' },
  { id: 'tag', label: 'Tags' },
];

function RefDialog() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState('pr');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRef, setSelectedRef] = useState(null);

  const debouncedQuery = useDebounce(searchQuery, 300);

  const handleClose = () => {
    dispatch({ type: 'TOGGLE_REF_DIALOG' });
  };

  // Search when query or tab changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchRefs(activeTab, debouncedQuery);
        setResults(data.results || []);
      } catch (err) {
        setError(err.message || 'Search failed');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    search();
  }, [debouncedQuery, activeTab]);

  // Handle direct fetch by ID
  const handleFetch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await fetchRef(activeTab, searchQuery.trim());
      if (data.result) {
        setSelectedRef(data.result);
      } else {
        setError('Not found');
      }
    } catch (err) {
      setError(err.message || 'Fetch failed');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeTab]);

  // Handle selection
  const handleSelect = (ref) => {
    setSelectedRef(ref);
  };

  // Handle confirm
  const handleConfirm = () => {
    if (selectedRef) {
      dispatch({
        type: 'SET_CURRENT_REF',
        payload: {
          type: activeTab,
          id: selectedRef.id || selectedRef.name,
          sha: selectedRef.sha || selectedRef.head?.sha,
          title: selectedRef.title,
          cached: selectedRef.cached,
        },
      });
      handleClose();
    }
  };

  return (
    <Dialog
      open={state.showRefDialog}
      onClose={handleClose}
      title="Select GitHub Reference"
      maxWidth="max-w-xl"
    >
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setResults([]);
              setSelectedRef(null);
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors
              ${activeTab === tab.id
                ? 'text-django-secondary border-b-2 border-django-secondary'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="relative mb-4">
        <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            activeTab === 'pr'
              ? 'Search by PR number or title...'
              : `Search ${activeTab}es...`
          }
          className="w-full pl-10 pr-20 py-2 border border-gray-300 dark:border-gray-600 rounded-md
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-django-secondary"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={handleFetch}
          disabled={loading || !searchQuery.trim()}
          className="absolute right-1 top-1"
        >
          Fetch
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Results */}
      <div className="max-h-64 overflow-y-auto mb-4 space-y-2">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <SpinnerIcon size={24} className="text-django-secondary" />
          </div>
        )}

        {!loading && results.length === 0 && searchQuery && (
          <p className="text-center py-8 text-gray-500 dark:text-gray-400">
            No results found
          </p>
        )}

        {!loading && results.map((result, index) => (
          <RefResultItem
            key={index}
            result={result}
            type={activeTab}
            isSelected={selectedRef?.id === result.id || selectedRef?.name === result.name}
            onSelect={() => handleSelect(result)}
          />
        ))}
      </div>

      {/* Selected ref info */}
      {selectedRef && (
        <div className="mb-4 p-3 bg-django-secondary/10 dark:bg-django-primary/20 border border-django-secondary/30 dark:border-django-primary rounded-lg">
          <div className="flex items-start gap-2">
            <CheckIcon size={18} className="text-django-secondary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-django-primary dark:text-django-secondary">
                {activeTab === 'pr' && `PR #${selectedRef.id}`}
                {activeTab !== 'pr' && selectedRef.name}
              </p>
              {selectedRef.title && (
                <p className="text-sm text-django-secondary dark:text-django-secondary truncate">
                  {selectedRef.title}
                </p>
              )}
              {(selectedRef.sha || selectedRef.head?.sha) && (
                <p className="text-xs text-django-secondary font-mono">
                  {(selectedRef.sha || selectedRef.head?.sha).slice(0, 12)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={!selectedRef}
        >
          Use this version
        </Button>
      </div>
    </Dialog>
  );
}

function RefResultItem({ result, type, isSelected, onSelect }) {
  const sha = result.sha || result.head?.sha;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg border transition-colors
        ${isSelected
          ? 'border-django-secondary bg-django-secondary/10 dark:bg-django-primary/20'
          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
    >
      <div className="flex items-start gap-2">
        <GitHubIcon size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {/* Row 1: Title/Name, state badge, cached badge */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-white truncate">
              {type === 'pr' ? result.title : result.name}
            </span>
            {result.state && (
              <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                result.state === 'open'
                  ? 'bg-django-secondary/20 text-django-tertiary dark:bg-django-primary dark:text-django-secondary'
                  : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
              }`}>
                {result.state}
              </span>
            )}
            {result.cached && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex-shrink-0">
                cached
              </span>
            )}
          </div>
          {/* Row 2: SHA and author */}
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
            {sha && (
              <span className="font-mono">{sha.slice(0, 7)}</span>
            )}
            {result.author && <span>by {result.author}</span>}
          </div>
        </div>
      </div>
    </button>
  );
}

export default RefDialog;
