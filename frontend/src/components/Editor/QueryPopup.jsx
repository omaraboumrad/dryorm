import React, { useRef, useEffect, useState } from 'react';
import { colorizeSql, getQueryType, formatTime } from '../../lib/utils';
import { QueryTypeBadge } from '../common';

function QueryPopup({ queries, x, y, showTemplated }) {
  const popupRef = useRef(null);
  const [position, setPosition] = useState({ left: x, top: y });

  // Adjust position to stay within viewport
  useEffect(() => {
    if (!popupRef.current) return;

    const rect = popupRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = x + 10;
    let top = y + 10;

    // Adjust horizontal position
    if (left + rect.width > viewportWidth - 20) {
      left = x - rect.width - 10;
    }

    // Adjust vertical position
    if (top + rect.height > viewportHeight - 20) {
      top = y - rect.height - 10;
    }

    // Ensure minimum margins
    left = Math.max(10, left);
    top = Math.max(10, top);

    setPosition({ left, top });
  }, [x, y, queries]);

  if (!queries || queries.length === 0) return null;

  // Group queries by template if showing templated view
  const displayQueries = showTemplated
    ? groupByTemplate(queries)
    : queries;

  return (
    <div
      ref={popupRef}
      className="query-popup"
      style={{ left: position.left, top: position.top }}
    >
      <div className="space-y-3">
        {displayQueries.map((query, index) => (
          <QueryItem key={index} query={query} showTemplated={showTemplated} />
        ))}
      </div>
    </div>
  );
}

function QueryItem({ query, showTemplated }) {
  const sql = showTemplated ? (query.template || query.sql) : query.sql;
  const type = getQueryType(sql);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs">
        <QueryTypeBadge type={type} />
        {query.time !== undefined && (
          <span className="text-gray-500 dark:text-gray-400">
            {formatTime(query.time)}
          </span>
        )}
        {query.count && query.count > 1 && (
          <span className="text-gray-500 dark:text-gray-400">
            x{query.count}
          </span>
        )}
      </div>
      <pre
        className="text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all text-gray-800 dark:text-gray-200"
        dangerouslySetInnerHTML={{ __html: colorizeSql(sql) }}
      />
    </div>
  );
}

// Group queries by their template
function groupByTemplate(queries) {
  const grouped = new Map();

  for (const query of queries) {
    const key = query.template || query.sql;
    if (grouped.has(key)) {
      const existing = grouped.get(key);
      existing.count = (existing.count || 1) + 1;
      existing.time = (existing.time || 0) + (query.time || 0);
    } else {
      grouped.set(key, { ...query, count: 1 });
    }
  }

  return Array.from(grouped.values());
}

export default QueryPopup;
