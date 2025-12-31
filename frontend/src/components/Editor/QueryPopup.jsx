import React, { useRef, useEffect, useState } from 'react';
import { colorizeSql } from '../../lib/utils';

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

  // Group queries by template
  const templateGroups = groupByTemplate(queries);

  return (
    <div
      ref={popupRef}
      className="query-popup"
      style={{ left: position.left, top: position.top }}
    >
      <div className="space-y-3">
        {templateGroups.map((group, index) => (
          <QueryGroup
            key={index}
            group={group}
            showTemplated={showTemplated}
            isFirst={index === 0}
          />
        ))}
      </div>
    </div>
  );
}

function QueryGroup({ group, showTemplated, isFirst }) {
  const { template, queries, totalTime, count } = group;
  const queryToShow = (showTemplated || count > 1) ? template : queries[0].sql;

  return (
    <div className={!isFirst ? 'border-t border-theme-border pt-2' : ''}>
      <div className="flex items-center justify-between gap-4 mb-1">
        <span className="text-django-primary dark:text-django-secondary font-bold text-sm">
          {totalTime.toFixed(3)}s
        </span>
        {count > 1 && (
          <span className="text-red-600 dark:text-red-400 font-bold text-xs">
            {count} Similar
          </span>
        )}
      </div>
      <pre
        className="text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all text-theme-text m-0"
        dangerouslySetInnerHTML={{ __html: colorizeSql(queryToShow) }}
      />
    </div>
  );
}

// Group queries by their template
function groupByTemplate(queries) {
  const grouped = new Map();

  for (const query of queries) {
    const key = query.template || query.sql;
    if (!grouped.has(key)) {
      grouped.set(key, {
        template: key,
        queries: [],
        totalTime: 0,
        count: 0,
      });
    }
    const group = grouped.get(key);
    group.queries.push(query);
    group.totalTime += parseFloat(query.time) || 0;
    group.count += 1;
  }

  return Array.from(grouped.values());
}

export default QueryPopup;
