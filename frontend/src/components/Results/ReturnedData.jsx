import React from 'react';
import { Collapsible, CopyButton } from '../common';
import { GridIcon } from '../icons';
import { tableToTsv } from '../../lib/utils';

function ReturnedData({ data }) {
  if (!data) return null;

  // Handle different data formats
  const datasets = normalizeData(data);

  if (datasets.length === 0) return null;

  return (
    <div>
      {datasets.map((dataset, index) => (
        <DataTable key={index} dataset={dataset} />
      ))}
    </div>
  );
}

function DataTable({ dataset }) {
  const { name, headers, rows } = dataset;

  if (!rows || rows.length === 0) return null;

  const tsvData = tableToTsv(headers, rows);

  return (
    <Collapsible
      title={
        <span className="flex items-center gap-2 font-bold text-theme-text">
          <GridIcon size={18} />
          {name || 'Data'}
          <span className="text-sm font-normal text-theme-text-secondary">
            ({rows.length} row{rows.length !== 1 ? 's' : ''})
          </span>
        </span>
      }
      defaultOpen={true}
      className=""
      headerClassName="h-10 px-3 bg-results-header border-b border-theme-border"
      contentClassName=""
      rightContent={
        <CopyButton
          text={tsvData}
          className="hover:bg-gray-200 dark:hover:bg-gray-600"
          label="Copy as TSV"
        />
      }
    >
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-theme-border">
          <thead className="bg-results-surface">
            <tr>
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-3 py-2 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border">
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-theme-surface">
                {headers.map((header, colIdx) => (
                  <td
                    key={colIdx}
                    className="px-3 py-2 text-sm text-theme-text whitespace-nowrap"
                  >
                    {formatCellValue(row[header])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Collapsible>
  );
}

// Normalize different data formats into a consistent structure
function normalizeData(data) {
  const datasets = [];

  if (Array.isArray(data)) {
    // Array of objects
    if (data.length > 0 && typeof data[0] === 'object') {
      const headers = Object.keys(data[0]);
      datasets.push({ name: 'Result', headers, rows: data });
    }
  } else if (typeof data === 'object') {
    // Named datasets
    for (const [name, value] of Object.entries(data)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        const headers = Object.keys(value[0]);
        datasets.push({ name, headers, rows: value });
      }
    }
  }

  return datasets;
}

// Format cell value for display
function formatCellValue(value) {
  if (value === null) return <span className="text-theme-text-muted italic">null</span>;
  if (value === undefined) return <span className="text-theme-text-muted italic">undefined</span>;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default ReturnedData;
