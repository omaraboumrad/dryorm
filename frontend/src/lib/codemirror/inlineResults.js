import { StateField, StateEffect } from '@codemirror/state';
import { Decoration, WidgetType, EditorView } from '@codemirror/view';

// Effects for updating inline results
export const setInlineQueries = StateEffect.define();
export const setInlineOutput = StateEffect.define();
export const toggleQueryExpanded = StateEffect.define();
export const setQueryLineHighlights = StateEffect.define();
export const setZenExpandedLine = StateEffect.define(); // For zen mode Alt+line expansion
export const setZenShowAllQueries = StateEffect.define(); // For Ctrl+Alt toggle all queries
export const setZenActiveHintLine = StateEffect.define(); // Line to show full hint (cursor or hover)

// Track which lines are expanded
const expandedLinesState = StateField.define({
  create() {
    return new Set();
  },
  update(expanded, tr) {
    for (const effect of tr.effects) {
      if (effect.is(toggleQueryExpanded)) {
        const newSet = new Set(expanded);
        if (newSet.has(effect.value)) {
          newSet.delete(effect.value);
        } else {
          newSet.add(effect.value);
        }
        return newSet;
      }
      // Clear expanded state when queries change
      if (effect.is(setInlineQueries)) {
        return new Set();
      }
    }
    return expanded;
  },
});

// Track zen mode expanded line (for Alt key expansion)
const zenExpandedLineState = StateField.define({
  create() {
    return null; // null means no line expanded
  },
  update(lineNum, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setZenExpandedLine)) {
        return effect.value; // line number or null
      }
    }
    return lineNum;
  },
});

// Track whether all queries are shown (Ctrl+Alt toggle)
const zenShowAllQueriesState = StateField.define({
  create() {
    return false;
  },
  update(showAll, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setZenShowAllQueries)) {
        return effect.value;
      }
    }
    return showAll;
  },
});

// Track which line should show full hint (cursor or hover)
const zenActiveHintLineState = StateField.define({
  create() {
    return null;
  },
  update(lineNum, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setZenActiveHintLine)) {
        return effect.value;
      }
    }
    return lineNum;
  },
});

// Widget for zen mode inline query expansion (shows below the line when Alt is pressed)
class ZenInlineQueryWidget extends WidgetType {
  constructor(queries, outputs, indentChars) {
    super();
    this.queries = queries || [];
    this.outputs = outputs || [];
    this.indentChars = indentChars || 0;
  }

  toDOM() {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'block';

    // Match the line's indentation plus gutter offset
    const gutterOffset = 10;
    const marginLeft = `calc(${gutterOffset}px + ${this.indentChars}ch)`;

    // Show outputs in their own purple container
    if (this.outputs.length > 0) {
      const outputContainer = document.createElement('div');
      outputContainer.className = 'cm-zen-inline-outputs';
      outputContainer.style.marginLeft = marginLeft;

      this.outputs.forEach((output) => {
        const text = document.createElement('pre');
        text.className = 'cm-zen-output-text';
        text.textContent = output.output || output;
        outputContainer.appendChild(text);
      });

      wrapper.appendChild(outputContainer);
    }

    // Show queries in green container
    if (this.queries.length > 0) {
      const queryContainer = document.createElement('div');
      queryContainer.className = 'cm-zen-inline-queries';
      queryContainer.style.marginLeft = marginLeft;

      this.queries.forEach((query) => {
        const queryBlock = document.createElement('div');
        queryBlock.className = 'cm-zen-query-block';

        const sql = document.createElement('pre');
        sql.className = 'cm-zen-query-sql';
        sql.textContent = query.sql || query;
        queryBlock.appendChild(sql);

        if (query.time) {
          const time = document.createElement('span');
          time.className = 'cm-zen-query-time';
          time.textContent = `${query.time}ms`;
          queryBlock.appendChild(time);
        }

        queryContainer.appendChild(queryBlock);
      });

      wrapper.appendChild(queryContainer);
    }

    return wrapper;
  }

  eq(other) {
    return this.indentChars === other.indentChars &&
           this.queries.length === other.queries.length &&
           this.outputs.length === other.outputs.length &&
           this.queries.every((q, i) => q.sql === other.queries[i].sql) &&
           this.outputs.every((o, i) => o.output === other.outputs[i].output);
  }
}

// Helper to count leading whitespace characters
function getLineIndent(doc, lineNum) {
  try {
    const line = doc.line(lineNum);
    const text = line.text;
    let indent = 0;
    for (const char of text) {
      if (char === ' ') indent++;
      else if (char === '\t') indent += 4; // Assume 4-space tabs
      else break;
    }
    return indent;
  } catch (e) {
    return 0;
  }
}

// Widget for inline query display
class InlineQueryWidget extends WidgetType {
  constructor(queries, lineNum, expanded) {
    super();
    this.queries = queries;
    this.lineNum = lineNum;
    this.expanded = expanded;
  }

  toDOM(view) {
    const container = document.createElement('div');
    container.className = 'cm-inline-query';

    // Summary line (always visible)
    const summary = document.createElement('div');
    summary.className = 'cm-inline-query-summary';
    summary.innerHTML = `<span class="cm-inline-query-icon">${this.expanded ? '▼' : '▶'}</span> ${this.queries.length} ${this.queries.length === 1 ? 'query' : 'queries'}`;
    summary.onclick = () => {
      view.dispatch({
        effects: toggleQueryExpanded.of(this.lineNum)
      });
    };
    container.appendChild(summary);

    // Query details (visible when expanded)
    if (this.expanded) {
      const details = document.createElement('div');
      details.className = 'cm-inline-query-details';

      this.queries.forEach((query, idx) => {
        const queryBlock = document.createElement('div');
        queryBlock.className = 'cm-inline-query-block';

        const sql = document.createElement('pre');
        sql.className = 'cm-inline-query-sql';
        sql.textContent = query.sql || query;
        queryBlock.appendChild(sql);

        if (query.time) {
          const time = document.createElement('span');
          time.className = 'cm-inline-query-time';
          time.textContent = `${query.time}ms`;
          queryBlock.appendChild(time);
        }

        details.appendChild(queryBlock);
      });

      container.appendChild(details);
    }

    return container;
  }

  eq(other) {
    return this.lineNum === other.lineNum &&
           this.expanded === other.expanded &&
           this.queries.length === other.queries.length;
  }

  ignoreEvent() {
    return false;
  }
}

// Widget for inline output display
class InlineOutputWidget extends WidgetType {
  constructor(output, error) {
    super();
    this.output = output;
    this.error = error;
  }

  toDOM() {
    const container = document.createElement('div');
    container.className = 'cm-inline-output';

    if (this.error) {
      const errorBlock = document.createElement('div');
      errorBlock.className = 'cm-inline-output-error';
      errorBlock.textContent = this.error;
      container.appendChild(errorBlock);
    } else if (this.output) {
      const outputBlock = document.createElement('pre');
      outputBlock.className = 'cm-inline-output-text';
      outputBlock.textContent = this.output;
      container.appendChild(outputBlock);
    }

    return container;
  }

  eq(other) {
    return this.output === other.output && this.error === other.error;
  }
}

// State field for inline queries
const inlineQueriesField = StateField.define({
  create() {
    return { queries: new Map(), output: '', error: null };
  },
  update(state, tr) {
    let newState = state;
    for (const effect of tr.effects) {
      if (effect.is(setInlineQueries)) {
        newState = { ...newState, queries: effect.value };
      }
      if (effect.is(setInlineOutput)) {
        newState = { ...newState, output: effect.value.output, error: effect.value.error };
      }
    }
    return newState;
  },
  provide(field) {
    return EditorView.decorations.from(field, (state) => {
      // This will be computed in the decoration field below
      return Decoration.none;
    });
  },
});

// Decoration field that combines queries and expanded state
const inlineDecorationsField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    const queriesState = tr.state.field(inlineQueriesField);
    const expandedLines = tr.state.field(expandedLinesState);

    // Check if we need to rebuild decorations
    let needsRebuild = false;
    for (const effect of tr.effects) {
      if (effect.is(setInlineQueries) || effect.is(setInlineOutput) || effect.is(toggleQueryExpanded)) {
        needsRebuild = true;
        break;
      }
    }

    if (!needsRebuild && !tr.docChanged) {
      return decorations;
    }

    const widgets = [];

    // Add query widgets
    for (const [lineNum, queries] of queriesState.queries.entries()) {
      if (queries && queries.length > 0) {
        try {
          if (lineNum >= 1 && lineNum <= tr.state.doc.lines) {
            const line = tr.state.doc.line(lineNum);
            const expanded = expandedLines.has(lineNum);
            widgets.push(
              Decoration.widget({
                widget: new InlineQueryWidget(queries, lineNum, expanded),
                block: true,
              }).range(line.to)
            );
          }
        } catch (e) {
          // Skip invalid lines
        }
      }
    }

    // Add output widget at the end
    if (queriesState.output || queriesState.error) {
      const lastLine = tr.state.doc.line(tr.state.doc.lines);
      widgets.push(
        Decoration.widget({
          widget: new InlineOutputWidget(queriesState.output, queriesState.error),
          block: true,
        }).range(lastLine.to)
      );
    }

    widgets.sort((a, b) => a.from - b.from);
    return Decoration.set(widgets);
  },
  provide(field) {
    return EditorView.decorations.from(field);
  },
});

/**
 * Update inline queries in the editor
 */
export function updateInlineQueries(view, lineToQueryMap) {
  if (!view) return;
  view.dispatch({
    effects: setInlineQueries.of(lineToQueryMap),
  });
}

/**
 * Update inline output in the editor
 */
export function updateInlineOutput(view, output, error) {
  if (!view) return;
  view.dispatch({
    effects: setInlineOutput.of({ output, error }),
  });
}

/**
 * Clear all inline results
 */
export function clearInlineResults(view) {
  if (!view) return;
  view.dispatch({
    effects: [
      setInlineQueries.of(new Map()),
      setInlineOutput.of({ output: '', error: null }),
    ],
  });
}

// Line highlight decoration for lines with queries
const queryLineHighlight = Decoration.line({ class: 'cm-query-line-highlight' });
// Line highlight decoration for lines with outputs (purple)
const outputLineHighlight = Decoration.line({ class: 'cm-output-line-highlight' });

// Hint widget shown at end of lines with queries or outputs
class ZenQueryHintWidget extends WidgetType {
  constructor(queryCount, outputCount, isActive) {
    super();
    this.queryCount = queryCount || 0;
    this.outputCount = outputCount || 0;
    this.isActive = isActive;
  }

  toDOM() {
    const container = document.createElement('span');
    container.className = 'cm-zen-query-hint-container';

    // Show output badge if there are outputs
    if (this.outputCount > 0) {
      const outputBadge = document.createElement('span');
      outputBadge.className = 'cm-zen-output-hint';
      outputBadge.textContent = this.outputCount === 1 ? '1 output' : `${this.outputCount} outputs`;
      container.appendChild(outputBadge);
    }

    // Show query badge if there are queries
    if (this.queryCount > 0) {
      const badge = document.createElement('span');
      badge.className = 'cm-zen-query-hint';
      badge.textContent = this.queryCount === 1 ? '1 query' : `${this.queryCount} queries`;
      container.appendChild(badge);
    }

    if (this.isActive) {
      const keys = document.createElement('span');
      keys.className = 'cm-zen-query-keys';
      keys.textContent = 'Alt | Ctrl+Alt all';
      container.appendChild(keys);
    }

    return container;
  }

  eq(other) {
    return this.queryCount === other.queryCount &&
           this.outputCount === other.outputCount &&
           this.isActive === other.isActive;
  }
}

// State field for query line highlights (zen mode background indicators)
// Stores the data needed to rebuild decorations
const queryLineHighlightsDataField = StateField.define({
  create() {
    return { lineNumbers: new Set(), queryCounts: new Map(), outputCounts: new Map() };
  },
  update(data, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setQueryLineHighlights)) {
        return effect.value;
      }
    }
    return data;
  },
});

// Decorations field that combines highlight data with active hint line
const queryLineHighlightsField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    const data = tr.state.field(queryLineHighlightsDataField);
    const activeHintLine = tr.state.field(zenActiveHintLineState);

    // Check if we need to rebuild
    let needsRebuild = false;
    for (const effect of tr.effects) {
      if (effect.is(setQueryLineHighlights) || effect.is(setZenActiveHintLine)) {
        needsRebuild = true;
        break;
      }
    }

    if (!needsRebuild && !tr.docChanged) {
      return decorations;
    }

    if (!data || !data.lineNumbers || data.lineNumbers.size === 0) {
      return Decoration.none;
    }

    const decos = [];
    for (const lineNum of data.lineNumbers) {
      try {
        if (lineNum >= 1 && lineNum <= tr.state.doc.lines) {
          const line = tr.state.doc.line(lineNum);
          const queryCount = data.queryCounts?.get(lineNum) || 0;
          const outputCount = data.outputCounts?.get(lineNum) || 0;
          // Use purple highlight for lines with outputs, green for query-only lines
          const highlight = outputCount > 0 ? outputLineHighlight : queryLineHighlight;
          decos.push(highlight.range(line.from));
          // Add hint widget at end of line
          const isActive = lineNum === activeHintLine;
          decos.push(
            Decoration.widget({
              widget: new ZenQueryHintWidget(queryCount, outputCount, isActive),
              side: 1000, // high value to ensure it stays at end of line content
            }).range(line.to)
          );
        }
      } catch (e) {
        // Skip invalid lines
      }
    }

    decos.sort((a, b) => a.from - b.from);
    return Decoration.set(decos);
  },
  provide(field) {
    return EditorView.decorations.from(field);
  },
});

/**
 * Update query line highlights in the editor (for zen mode)
 * @param {EditorView} view - The CodeMirror editor view
 * @param {Map} lineToQueryMap - Map of line numbers to query arrays
 * @param {Map} lineToOutputMap - Map of line numbers to output arrays
 */
export function updateQueryLineHighlights(view, lineToQueryMap, lineToOutputMap) {
  if (!view) return;

  // Combine line numbers from both maps
  const lineNumbers = new Set();
  const queryCounts = new Map();
  const outputCounts = new Map();

  if (lineToQueryMap) {
    for (const [line, queries] of lineToQueryMap.entries()) {
      lineNumbers.add(line);
      queryCounts.set(line, queries.length);
    }
  }

  if (lineToOutputMap) {
    for (const [line, outputs] of lineToOutputMap.entries()) {
      lineNumbers.add(line);
      outputCounts.set(line, outputs.length);
    }
  }

  view.dispatch({
    effects: setQueryLineHighlights.of({ lineNumbers, queryCounts, outputCounts }),
  });
}

/**
 * Clear query line highlights
 */
export function clearQueryLineHighlights(view) {
  if (!view) return;
  view.dispatch({
    effects: setQueryLineHighlights.of({ lineNumbers: new Set(), queryCounts: new Map(), outputCounts: new Map() }),
  });
}

// Zen mode inline query decorations (shown when Alt is pressed on a line, or all when Ctrl+Alt toggled)
const zenInlineDecorationsField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    const expandedLine = tr.state.field(zenExpandedLineState);
    const showAllQueries = tr.state.field(zenShowAllQueriesState);
    const queriesData = tr.state.field(zenQueriesDataField);
    const outputsData = tr.state.field(zenOutputsDataField);

    // Check if we need to rebuild
    let needsRebuild = false;
    for (const effect of tr.effects) {
      if (effect.is(setZenExpandedLine) || effect.is(setQueryLineHighlights) || effect.is(setZenShowAllQueries) || effect.is(setZenOutputsData)) {
        needsRebuild = true;
        break;
      }
    }

    if (!needsRebuild && !tr.docChanged) {
      return decorations;
    }

    const widgets = [];

    // Collect all line numbers that have queries or outputs
    const allLineNums = new Set([...queriesData.keys(), ...outputsData.keys()]);

    // Show all queries/outputs if Ctrl+Alt toggled
    if (showAllQueries) {
      for (const lineNum of allLineNums) {
        const queries = queriesData.get(lineNum) || [];
        const outputs = outputsData.get(lineNum) || [];
        if (queries.length > 0 || outputs.length > 0) {
          try {
            if (lineNum >= 1 && lineNum <= tr.state.doc.lines) {
              const line = tr.state.doc.line(lineNum);
              const indent = getLineIndent(tr.state.doc, lineNum);
              // Use next line's start position so block appears after current line
              // without interfering with inline widgets at line.to
              const nextLineStart = line.to + 1;
              const pos = nextLineStart <= tr.state.doc.length ? nextLineStart : line.to;
              widgets.push(
                Decoration.widget({
                  widget: new ZenInlineQueryWidget(queries, outputs, indent),
                  block: true,
                  side: -1, // Appear above this position (i.e., after previous line)
                }).range(pos)
              );
            }
          } catch (e) {
            // Skip invalid lines
          }
        }
      }
    } else if (expandedLine !== null) {
      // Show single expanded line (Alt key)
      const queries = queriesData.get(expandedLine) || [];
      const outputs = outputsData.get(expandedLine) || [];
      if (queries.length > 0 || outputs.length > 0) {
        try {
          if (expandedLine >= 1 && expandedLine <= tr.state.doc.lines) {
            const line = tr.state.doc.line(expandedLine);
            const indent = getLineIndent(tr.state.doc, expandedLine);
            // Use next line's start position so block appears after current line
            const nextLineStart = line.to + 1;
            const pos = nextLineStart <= tr.state.doc.length ? nextLineStart : line.to;
            widgets.push(
              Decoration.widget({
                widget: new ZenInlineQueryWidget(queries, outputs, indent),
                block: true,
                side: -1, // Appear above this position (i.e., after previous line)
              }).range(pos)
            );
          }
        } catch (e) {
          // Invalid line
        }
      }
    }

    if (widgets.length === 0) {
      return Decoration.none;
    }

    widgets.sort((a, b) => a.from - b.from);
    return Decoration.set(widgets);
  },
  provide(field) {
    return EditorView.decorations.from(field);
  },
});

// Store queries data for zen mode (line number -> queries)
export const setZenQueriesData = StateEffect.define();
export const setZenOutputsData = StateEffect.define();

const zenQueriesDataField = StateField.define({
  create() {
    return new Map();
  },
  update(data, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setZenQueriesData)) {
        return effect.value;
      }
    }
    return data;
  },
});

const zenOutputsDataField = StateField.define({
  create() {
    return new Map();
  },
  update(data, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setZenOutputsData)) {
        return effect.value;
      }
    }
    return data;
  },
});

/**
 * Expand a line in zen mode to show its queries
 */
export function expandZenLine(view, lineNumber) {
  if (!view) return;
  view.dispatch({
    effects: setZenExpandedLine.of(lineNumber),
  });
}

/**
 * Collapse zen mode expansion
 */
export function collapseZenLine(view) {
  if (!view) return;
  view.dispatch({
    effects: setZenExpandedLine.of(null),
  });
}

/**
 * Toggle showing all queries in zen mode (Ctrl+Alt)
 */
export function toggleAllZenQueries(view) {
  if (!view) return;
  const currentState = view.state.field(zenShowAllQueriesState);
  view.dispatch({
    effects: setZenShowAllQueries.of(!currentState),
  });
}

/**
 * Get whether all queries are currently shown
 */
export function areAllQueriesShown(view) {
  if (!view) return false;
  return view.state.field(zenShowAllQueriesState);
}

/**
 * Set the active hint line (shows full hint text)
 */
export function setActiveHintLine(view, lineNumber) {
  if (!view) return;
  view.dispatch({
    effects: setZenActiveHintLine.of(lineNumber),
  });
}

/**
 * Update zen mode queries data
 */
export function updateZenQueriesData(view, lineToQueryMap) {
  if (!view) return;
  view.dispatch({
    effects: setZenQueriesData.of(lineToQueryMap || new Map()),
  });
}

/**
 * Update zen mode outputs data
 */
export function updateZenOutputsData(view, lineToOutputMap) {
  if (!view) return;
  view.dispatch({
    effects: setZenOutputsData.of(lineToOutputMap || new Map()),
  });
}

/**
 * Get inline results extensions for Zen mode
 */
export function getInlineResultsExtensions() {
  return [
    expandedLinesState,
    inlineQueriesField,
    inlineDecorationsField,
    zenActiveHintLineState,
    queryLineHighlightsDataField,
    queryLineHighlightsField,
    zenExpandedLineState,
    zenShowAllQueriesState,
    zenQueriesDataField,
    zenOutputsDataField,
    zenInlineDecorationsField,
  ];
}
