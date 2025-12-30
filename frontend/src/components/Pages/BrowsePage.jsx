import React, { useState, useEffect } from 'react';
import { SearchIcon, SpinnerIcon } from '../icons';

function BrowsePage() {
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSnippets = async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.set('q', search);
        const response = await fetch(`/api/snippets?${params}`);
        if (!response.ok) throw new Error('Failed to fetch snippets');
        const data = await response.json();
        setSnippets(data.snippets || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchSnippets, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  return (
    <div className="h-full overflow-auto bg-theme-page">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-theme-text mb-6">Browse Snippets</h1>

        {/* Search */}
        <div className="relative mb-6">
          <SearchIcon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search snippets..."
            className="w-full pl-10 pr-4 py-2 bg-theme-surface border border-theme-border rounded-lg text-theme-text placeholder:text-theme-text-muted focus:outline-none focus:ring-2 focus:ring-django-secondary"
          />
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <SpinnerIcon size={32} className="text-django-secondary" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : snippets.length === 0 ? (
          <div className="text-center py-12 text-theme-text-muted">
            {search ? 'No snippets found matching your search' : 'No snippets available'}
          </div>
        ) : (
          <div className="space-y-3">
            {snippets.map((snippet) => (
              <a
                key={snippet.slug}
                href={`/${snippet.slug}`}
                className="block p-4 bg-theme-surface border border-theme-border rounded-lg hover:border-django-secondary transition-colors"
              >
                <h3 className="font-medium text-theme-text mb-1">
                  {snippet.name || snippet.slug}
                </h3>
                <p className="text-sm text-theme-text-secondary truncate font-mono">
                  {snippet.code?.slice(0, 100)}...
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-theme-text-muted">
                  <span>{snippet.database}</span>
                  <span>{snippet.orm_version}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BrowsePage;
