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
          id: selectedRef.id || selectedRef.number || selectedRef.name,
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
                ? 'text-green-600 border-b-2 border-green-600'
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
            focus:outline-none focus:ring-2 focus:ring-green-500"
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
            <SpinnerIcon size={24} className="text-green-600" />
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
            isSelected={selectedRef?.id === result.id || selectedRef?.number === result.number}
            onSelect={() => handleSelect(result)}
          />
        ))}
      </div>

      {/* Selected ref info */}
      {selectedRef && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckIcon size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-green-800 dark:text-green-200">
                {activeTab === 'pr' && `PR #${selectedRef.number}`}
                {activeTab !== 'pr' && selectedRef.name}
              </p>
              {selectedRef.title && (
                <p className="text-sm text-green-600 dark:text-green-400 truncate">
                  {selectedRef.title}
                </p>
              )}
              {(selectedRef.sha || selectedRef.head?.sha) && (
                <p className="text-xs text-green-500 font-mono">
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
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg border transition-colors
        ${isSelected
          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
    >
      <div className="flex items-start gap-2">
        <GitHubIcon size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white">
              {type === 'pr' && `#${result.number}`}
              {type !== 'pr' && result.name}
            </span>
            {result.state && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                result.state === 'open'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
              }`}>
                {result.state}
              </span>
            )}
            {result.cached && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                cached
              </span>
            )}
          </div>
          {result.title && (
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {result.title}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            {result.user?.login && <span>by {result.user.login}</span>}
            {(result.sha || result.head?.sha) && (
              <span className="font-mono">{(result.sha || result.head?.sha).slice(0, 7)}</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

export default RefDialog;
