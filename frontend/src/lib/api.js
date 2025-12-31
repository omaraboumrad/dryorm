// API client for DryORM

/**
 * Get CSRF token from cookies
 */
function getCsrfToken() {
  const name = 'csrftoken';
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(name + '=')) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
}

/**
 * Base fetch wrapper with CSRF and error handling
 */
async function apiFetch(url, options = {}) {
  const csrfToken = getCsrfToken();

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken && { 'X-CSRFToken': csrfToken }),
    },
    credentials: 'same-origin',
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
    error.status = response.status;
    try {
      error.data = await response.json();
    } catch {
      error.data = null;
    }
    throw error;
  }

  return response.json();
}

/**
 * Fetch app configuration (templates, databases, ORM versions)
 */
export async function fetchConfig() {
  return apiFetch('/api/config');
}

/**
 * Fetch a snippet by slug
 */
export async function fetchSnippet(slug) {
  return apiFetch(`/api/snippet/${slug}`);
}

/**
 * Execute code
 */
export async function execute(payload) {
  return apiFetch('/execute', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Save a snippet
 */
export async function saveSnippet(data) {
  return apiFetch('/save', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Search GitHub refs (PRs, branches, tags)
 */
export async function searchRefs(type, query) {
  const params = new URLSearchParams({ type, q: query });
  return apiFetch(`/search-refs?${params}`);
}

/**
 * Fetch a specific GitHub ref by ID
 */
export async function fetchRef(type, id) {
  const params = new URLSearchParams({ type, id });
  return apiFetch(`/search-refs?${params}`);
}

/**
 * Fetch all journeys
 */
export async function fetchJourneys() {
  return apiFetch('/api/journeys');
}

/**
 * Fetch a journey chapter
 */
export async function fetchJourneyChapter(slug, chapter) {
  return apiFetch(`/api/journey/${slug}/${chapter}`);
}

export default {
  fetchConfig,
  fetchSnippet,
  execute,
  saveSnippet,
  searchRefs,
  fetchRef,
  fetchJourneys,
  fetchJourneyChapter,
};
