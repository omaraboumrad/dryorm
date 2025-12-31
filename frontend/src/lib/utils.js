/**
 * Utility functions for DryORM
 */

/**
 * Escape HTML special characters
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

/**
 * Colorize SQL for display
 */
export function colorizeSql(sql) {
  if (!sql) return '';

  // SQL keywords
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN',
    'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'AS', 'ORDER', 'BY',
    'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT', 'INTO', 'VALUES',
    'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'ALTER', 'DROP', 'INDEX',
    'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CONSTRAINT', 'UNIQUE',
    'NULL', 'DEFAULT', 'CASCADE', 'BEGIN', 'COMMIT', 'ROLLBACK', 'SAVEPOINT',
    'TRANSACTION', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'CASE',
    'WHEN', 'THEN', 'ELSE', 'END', 'UNION', 'ALL', 'EXISTS', 'IS', 'TRUE',
    'FALSE', 'ASC', 'DESC', 'NULLS', 'FIRST', 'LAST', 'RETURNING'
  ];

  let result = escapeHtml(sql);

  // Highlight keywords
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
    result = result.replace(regex, '<span class="sql-keyword">$1</span>');
  });

  // Highlight strings (single quotes)
  result = result.replace(/'([^']*)'/g, '<span class="sql-string">\'$1\'</span>');

  // Highlight numbers
  result = result.replace(/\b(\d+\.?\d*)\b/g, '<span class="sql-number">$1</span>');

  // Highlight comments
  result = result.replace(/(--.*$)/gm, '<span class="sql-comment">$1</span>');

  return result;
}

/**
 * Determine query type from SQL
 */
export function getQueryType(sql) {
  if (!sql) return 'DDL';
  const normalized = sql.trim().toUpperCase();

  if (normalized.startsWith('SELECT') || normalized.startsWith('WITH')) return 'SELECT';
  if (normalized.startsWith('INSERT')) return 'INSERT';
  if (normalized.startsWith('UPDATE')) return 'UPDATE';
  if (normalized.startsWith('DELETE')) return 'DELETE';
  if (normalized.startsWith('BEGIN') || normalized.startsWith('COMMIT') ||
      normalized.startsWith('ROLLBACK') || normalized.startsWith('SAVEPOINT')) return 'TCL';

  return 'DDL';
}

/**
 * Format execution time
 */
export function formatTime(ms) {
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Debounce function
 */
export function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Convert table data to TSV format for copying
 */
export function tableToTsv(headers, rows) {
  const headerLine = headers.join('\t');
  const dataLines = rows.map(row =>
    headers.map(h => {
      const value = row[h];
      if (value === null || value === undefined) return '';
      return String(value).replace(/\t/g, ' ').replace(/\n/g, ' ');
    }).join('\t')
  );
  return [headerLine, ...dataLines].join('\n');
}

/**
 * Parse URL for journey navigation
 */
export function parseJourneyUrl(path, hash) {
  if (!path.startsWith('/j/')) return null;
  const slug = path.slice(3);
  const chapter = hash ? hash.slice(1) : null;
  return { slug, chapter };
}

/**
 * Check if device is mobile
 */
export function isMobile() {
  return window.innerWidth < 1024;
}
