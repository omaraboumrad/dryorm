import { StateField, StateEffect } from '@codemirror/state';
import { GutterMarker, gutter } from '@codemirror/view';
import { RangeSet } from '@codemirror/state';

// Effect to update query line markers
export const setQueryLines = StateEffect.define();

// Custom gutter marker for query lines
class QueryLineMarker extends GutterMarker {
  constructor(count) {
    super();
    this.count = count;
  }

  toDOM() {
    const span = document.createElement('span');
    span.className = 'query-gutter-marker';
    span.textContent = this.count > 1 ? this.count.toString() : '\u25CF'; // bullet or count
    span.title = this.count > 1 ? `${this.count} queries on this line` : 'Query on this line';
    return span;
  }
}

// State field to track query line markers
export const queryLinesField = StateField.define({
  create() {
    return RangeSet.empty;
  },
  update(markers, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setQueryLines)) {
        const lineQueryCounts = effect.value;
        const ranges = [];

        for (const [lineNum, count] of Object.entries(lineQueryCounts)) {
          try {
            const lineNumber = parseInt(lineNum);
            if (lineNumber >= 1 && lineNumber <= tr.state.doc.lines) {
              const line = tr.state.doc.line(lineNumber);
              if (line) {
                const marker = new QueryLineMarker(count);
                ranges.push(marker.range(line.from));
              }
            }
          } catch (e) {
            // Skip invalid lines
          }
        }

        // Sort by position and create RangeSet
        ranges.sort((a, b) => a.from - b.from);
        return RangeSet.of(ranges);
      }
    }
    return markers;
  },
});

// Query line gutter
export const queryLineGutter = gutter({
  class: 'cm-query-gutter',
  markers: (view) => view.state.field(queryLinesField),
  initialSpacer: () => {
    const span = document.createElement('span');
    span.className = 'query-gutter-marker';
    span.textContent = '\u25CF';
    return span;
  },
});

/**
 * Update query markers in the editor
 * @param {EditorView} view - The CodeMirror editor view
 * @param {Map} lineToQueryMap - Map of line numbers to query arrays
 */
export function updateQueryMarkers(view, lineToQueryMap) {
  if (!view) return;

  const lineQueryCounts = {};

  for (const [line, queries] of lineToQueryMap.entries()) {
    lineQueryCounts[line] = queries.length;
  }

  view.dispatch({
    effects: setQueryLines.of(lineQueryCounts),
  });
}

/**
 * Get query gutter extensions
 */
export function getQueryGutterExtensions() {
  return [queryLinesField, queryLineGutter];
}
