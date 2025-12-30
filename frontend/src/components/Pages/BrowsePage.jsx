import React, { useState, useEffect, useCallback } from 'react';
import { SearchIcon, SpinnerIcon, ChevronRightIcon } from '../icons';

function BrowsePage() {
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchSnippets = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      params.set('page', page);
      const response = await fetch(`/api/snippets?${params}`);
      if (!response.ok) throw new Error('Failed to fetch snippets');
      const data = await response.json();
      setSnippets(data.snippets || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchSnippets(1), 300);
    return () => clearTimeout(debounce);
  }, [search, fetchSnippets]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchSnippets(newPage);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-theme-page">
      {/* Search Header */}
      <div className="flex items-center px-4 py-3 bg-theme-surface border-b border-theme-border">
        {loading && (
          <SpinnerIcon size={20} className="text-django-secondary mr-3 flex-shrink-0" />
        )}
        <SearchIcon size={20} className={`${loading ? 'hidden' : ''} text-theme-text-muted mr-3 flex-shrink-0`} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search snippets..."
          autoFocus
          className="w-full bg-transparent text-theme-text placeholder:text-theme-text-muted focus:outline-none"
        />
        {pagination.total > 0 && (
          <span className="text-sm text-theme-text-muted ml-3 whitespace-nowrap">
            {pagination.total} snippet{pagination.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : snippets.length === 0 && !loading ? (
          <div className="text-center py-12 text-theme-text-muted">
            {search ? 'No snippets found matching your search' : 'No snippets available'}
          </div>
        ) : (
          <ul>
            {snippets.map((snippet) => (
              <SnippetItem key={snippet.slug} snippet={snippet} />
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-theme-border bg-theme-surface">
          <button
            onClick={() => handlePageChange(1)}
            disabled={pagination.page === 1}
            className="px-3 py-1 text-sm border border-theme-border rounded hover:bg-theme-elevated disabled:opacity-50 disabled:cursor-not-allowed text-theme-text"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-3 py-1 text-sm border border-theme-border rounded hover:bg-theme-elevated disabled:opacity-50 disabled:cursor-not-allowed text-theme-text"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-sm text-theme-text">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-1 text-sm border border-theme-border rounded hover:bg-theme-elevated disabled:opacity-50 disabled:cursor-not-allowed text-theme-text"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(pagination.totalPages)}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-1 text-sm border border-theme-border rounded hover:bg-theme-elevated disabled:opacity-50 disabled:cursor-not-allowed text-theme-text"
          >
            Last
          </button>
        </div>
      )}
    </div>
  );
}

function SnippetItem({ snippet }) {
  // Format version display
  const getVersionDisplay = () => {
    if (snippet.ref_type) {
      if (snippet.ref_type === 'pr') {
        return (
          <span className="text-purple-600 dark:text-purple-400">
            PR #{snippet.ref_id}
            {snippet.sha && (
              <span className="hidden sm:inline font-mono ml-1">@ {snippet.sha.slice(0, 7)}</span>
            )}
          </span>
        );
      } else if (snippet.ref_type === 'branch') {
        return <span className="text-purple-600 dark:text-purple-400">{snippet.ref_id}</span>;
      } else if (snippet.ref_type === 'tag') {
        return <span className="text-purple-600 dark:text-purple-400">{snippet.ref_id}</span>;
      }
    }
    return <span>{snippet.orm_version || 'django-5.2'}</span>;
  };

  return (
    <li className="border-b border-theme-border">
      <a
        href={`/${snippet.slug}/run`}
        className="flex items-center px-4 py-3 hover:bg-django-secondary/10 dark:hover:bg-django-secondary/5 transition"
      >
        <div className="flex flex-col flex-grow min-w-0">
          <span className="text-lg font-semibold text-django-primary dark:text-django-secondary truncate">
            {snippet.name || snippet.slug}
          </span>
          <div className="flex items-center gap-2 text-sm text-theme-text-muted">
            <span>{snippet.database || 'sqlite'}</span>
            <span className="text-theme-text-muted">•</span>
            {getVersionDisplay()}
            <span className="text-theme-text-muted">•</span>
            <span>{snippet.created} ago</span>
          </div>
        </div>
        <ChevronRightIcon size={16} className="ml-2 text-theme-text-muted" />
      </a>
    </li>
  );
}

export default BrowsePage;
