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
    <div className="space-y-4">
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
        <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
          <GridIcon size={18} />
          {name || 'Data'}
          <span className="text-sm font-normal text-gray-500">
            ({rows.length} row{rows.length !== 1 ? 's' : ''})
          </span>
        </span>
      }
      defaultOpen={true}
      className="bg-gray-50 dark:bg-gray-800 rounded-lg"
      headerClassName="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
      contentClassName="border-t border-gray-200 dark:border-gray-700"
      rightContent={
        <CopyButton
          text={tsvData}
          className="hover:bg-gray-200 dark:hover:bg-gray-600"
          label="Copy as TSV"
        />
      }
    >
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {headers.map((header, colIdx) => (
                  <td
                    key={colIdx}
                    className="px-3 py-2 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap"
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
  if (value === null) return <span className="text-gray-400 italic">null</span>;
  if (value === undefined) return <span className="text-gray-400 italic">undefined</span>;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default ReturnedData;
