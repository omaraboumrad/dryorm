import React, { useRef, useEffect, useCallback, useState } from 'react';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { useExecute } from '../../hooks/useExecute';
import { createBaseExtensions, createExecuteKeymap } from '../../lib/codemirror/setup';
import { updateQueryMarkers } from '../../lib/codemirror/queryGutter';
import {
  updateQueryLineHighlights,
  clearQueryLineHighlights,
  expandZenLine,
  collapseZenLine,
  updateZenQueriesData,
  updateZenOutputsData,
  updateZenErrorsData,
  toggleAllZenQueries,
  setActiveHintLine
} from '../../lib/codemirror/inlineResults';
import VersionLabel from './VersionLabel';
import QueryPopup from './QueryPopup';

// Compute actual dark mode from themeMode
function getIsDark(themeMode) {
  if (themeMode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return themeMode === 'dark';
}

function CodeEditor() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { execute } = useExecute();

  // Compute actual dark mode
  const [isDark, setIsDark] = useState(() => getIsDark(state.themeMode));

  // Update isDark when themeMode changes or system preference changes
  useEffect(() => {
    setIsDark(getIsDark(state.themeMode));

    if (state.themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => setIsDark(mediaQuery.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [state.themeMode]);

  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const darkModeRef = useRef(isDark);
  const executeRef = useRef(execute);
  const lineToQueryMapRef = useRef(state.lineToQueryMap);
  const lineToOutputMapRef = useRef(state.lineToOutputMap);
  const lineToErrorMapRef = useRef(state.lineToErrorMap);
  const zenModeRef = useRef(state.zenMode);

  // Hover popup state
  const [hoverQueries, setHoverQueries] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Keep refs up to date
  useEffect(() => {
    executeRef.current = execute;
  }, [execute]);

  useEffect(() => {
    lineToQueryMapRef.current = state.lineToQueryMap;
    // Update query gutter markers when lineToQueryMap changes
    if (viewRef.current && state.lineToQueryMap) {
      updateQueryMarkers(viewRef.current, state.lineToQueryMap);
    }
  }, [state.lineToQueryMap]);

  useEffect(() => {
    lineToOutputMapRef.current = state.lineToOutputMap;
  }, [state.lineToOutputMap]);

  useEffect(() => {
    lineToErrorMapRef.current = state.lineToErrorMap;
  }, [state.lineToErrorMap]);

  useEffect(() => {
    zenModeRef.current = state.zenMode;
  }, [state.zenMode]);

  // Show error modal in zen mode when there's an error with no line number
  useEffect(() => {
    if (state.zenMode && state.error && (!state.lineToErrorMap || state.lineToErrorMap.size === 0)) {
      setShowErrorModal(true);
    } else {
      setShowErrorModal(false);
    }
  }, [state.zenMode, state.error, state.lineToErrorMap]);

  // Alt key listener for query popup toggle / zen mode inline expansion
  // Ctrl+Alt toggles all queries (either key first)
  const ctrlAltToggledRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Alt combination toggles all queries (works regardless of key order)
      if (e.ctrlKey && e.altKey && state.zenMode && viewRef.current && !ctrlAltToggledRef.current) {
        ctrlAltToggledRef.current = true;
        toggleAllZenQueries(viewRef.current);
        return;
      }

      if (e.key === 'Alt') {
        setIsAltPressed(true);
        // In zen mode, expand the current line to show queries/outputs/errors (only if not Ctrl+Alt)
        if (!e.ctrlKey && state.zenMode && viewRef.current) {
          const pos = viewRef.current.state.selection.main.head;
          const line = viewRef.current.state.doc.lineAt(pos);
          const lineNumber = line.number;
          const hasQueries = lineToQueryMapRef.current && lineToQueryMapRef.current.has(lineNumber);
          const hasOutputs = lineToOutputMapRef.current && lineToOutputMapRef.current.has(lineNumber);
          const hasErrors = lineToErrorMapRef.current && lineToErrorMapRef.current.has(lineNumber);
          if (hasQueries || hasOutputs || hasErrors) {
            expandZenLine(viewRef.current, lineNumber);
          }
        }
      }
    };
    const handleKeyUp = (e) => {
      // Reset Ctrl+Alt toggle guard when either key is released
      if (e.key === 'Control' || e.key === 'Alt') {
        ctrlAltToggledRef.current = false;
      }

      if (e.key === 'Alt') {
        setIsAltPressed(false);
        // In zen mode, collapse the expanded line
        if (state.zenMode && viewRef.current) {
          collapseZenLine(viewRef.current);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [state.zenMode]);

  // Mouse hover handlers for query popup and zen mode hint
  useEffect(() => {
    if (!viewRef.current) return;

    const editorElement = viewRef.current.dom;

    const handleMouseMove = (e) => {
      const pos = viewRef.current.posAtCoords({ x: e.clientX, y: e.clientY });
      if (pos !== null) {
        const line = viewRef.current.state.doc.lineAt(pos);
        const lineNumber = line.number;

        if (lineToQueryMapRef.current && lineToQueryMapRef.current.has(lineNumber)) {
          const queries = lineToQueryMapRef.current.get(lineNumber);
          if (queries && queries.length > 0) {
            setHoverQueries(queries);
            setHoverPosition({ x: e.pageX, y: e.pageY });
            // In zen mode, set active hint line on hover
            if (zenModeRef.current) {
              setActiveHintLine(viewRef.current, lineNumber);
            }
            return;
          }
        }
      }
      setHoverQueries(null);
    };

    const handleMouseLeave = (e) => {
      if (!editorElement.contains(e.relatedTarget)) {
        setHoverQueries(null);
        // Reset to cursor line on mouse leave
        if (zenModeRef.current && viewRef.current) {
          const pos = viewRef.current.state.selection.main.head;
          const line = viewRef.current.state.doc.lineAt(pos);
          const lineNumber = line.number;
          if (lineToQueryMapRef.current && lineToQueryMapRef.current.has(lineNumber)) {
            setActiveHintLine(viewRef.current, lineNumber);
          } else {
            setActiveHintLine(viewRef.current, null);
          }
        }
      }
    };

    editorElement.addEventListener('mousemove', handleMouseMove);
    editorElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      editorElement.removeEventListener('mousemove', handleMouseMove);
      editorElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [state.editorView]);

  // Create editor on mount (and recreate when dark mode changes)
  useEffect(() => {
    if (!editorRef.current) return;

    // Clean up existing editor
    if (viewRef.current) {
      viewRef.current.destroy();
      viewRef.current = null;
    }

    const extensions = [
      // Execute keymap must come first to take precedence
      // Use refs to always get the latest execute function
      createExecuteKeymap(
        () => executeRef.current(false),
        () => executeRef.current(true)
      ),
      ...createBaseExtensions(isDark, state.editorMode),
      // Update state when content changes or cursor moves
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          dispatch({ type: 'SET_CODE', payload: update.state.doc.toString() });
          // Clear stale inline results on any edit
          dispatch({ type: 'SET_LINE_TO_QUERY_MAP', payload: new Map() });
          dispatch({ type: 'SET_LINE_TO_OUTPUT_MAP', payload: new Map() });
          dispatch({ type: 'SET_LINE_TO_ERROR_MAP', payload: new Map() });
          // Also clear CodeMirror state directly
          clearQueryLineHighlights(update.view);
          updateZenQueriesData(update.view, new Map());
          updateZenOutputsData(update.view, new Map());
          updateZenErrorsData(update.view, new Map());
          updateQueryMarkers(update.view, new Map());
        }
        // Check for cursor position change
        if (update.selectionSet) {
          const pos = update.state.selection.main.head;
          const line = update.state.doc.lineAt(pos);
          const lineNumber = line.number;
          // Use a ref to get the current lineToQueryMap (will be set via effect)
          if (lineToQueryMapRef.current && lineToQueryMapRef.current.has(lineNumber)) {
            const queries = lineToQueryMapRef.current.get(lineNumber);
            if (queries && queries.length > 0) {
              dispatch({ type: 'SET_HIGHLIGHTED_QUERY', payload: queries[0].index });
            }
            // In zen mode, set this as the active hint line
            if (zenModeRef.current) {
              setActiveHintLine(update.view, lineNumber);
            }
          } else {
            dispatch({ type: 'SET_HIGHLIGHTED_QUERY', payload: null });
            // Clear active hint if not on a query line
            if (zenModeRef.current) {
              setActiveHintLine(update.view, null);
            }
          }
        }
      }),
    ];

    const startState = EditorState.create({
      doc: state.code || '# Write your Django ORM code here\n',
      extensions,
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    viewRef.current = view;
    darkModeRef.current = isDark;
    dispatch({ type: 'SET_EDITOR_VIEW', payload: view });

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [isDark, state.editorMode]); // Recreate editor when dark mode or editor mode changes

  // Update editor content when code changes externally (e.g., loading a snippet)
  useEffect(() => {
    if (viewRef.current && state.code !== undefined) {
      const currentCode = viewRef.current.state.doc.toString();
      if (currentCode !== state.code) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentCode.length,
            insert: state.code || '',
          },
        });
      }
    }
  }, [state.code]);

  // Focus editor when entering zen mode
  useEffect(() => {
    if (state.zenMode && viewRef.current) {
      viewRef.current.focus();
    }
  }, [state.zenMode]);

  // Focus editor when requested via state
  useEffect(() => {
    if (state.shouldFocusEditor && viewRef.current) {
      // Small delay to ensure content is updated first
      setTimeout(() => {
        viewRef.current?.focus();
        dispatch({ type: 'FOCUS_EDITOR', payload: false });
      }, 50);
    }
  }, [state.shouldFocusEditor, dispatch]);

  // Update query line highlights and queries/outputs/errors data in zen mode
  useEffect(() => {
    if (!viewRef.current) return;

    const hasData = (state.lineToQueryMap?.size > 0) ||
                    (state.lineToOutputMap?.size > 0) ||
                    (state.lineToErrorMap?.size > 0);

    if (state.zenMode && hasData) {
      updateQueryLineHighlights(viewRef.current, state.lineToQueryMap, state.lineToOutputMap, state.lineToErrorMap);
      updateZenQueriesData(viewRef.current, state.lineToQueryMap);
      updateZenOutputsData(viewRef.current, state.lineToOutputMap);
      updateZenErrorsData(viewRef.current, state.lineToErrorMap);

      // Auto-expand the first error line if there are errors
      if (state.lineToErrorMap && state.lineToErrorMap.size > 0) {
        const firstErrorLine = state.lineToErrorMap.keys().next().value;
        if (firstErrorLine) {
          expandZenLine(viewRef.current, firstErrorLine);
        }
      }
    } else {
      clearQueryLineHighlights(viewRef.current);
      updateZenQueriesData(viewRef.current, new Map());
      updateZenOutputsData(viewRef.current, new Map());
      updateZenErrorsData(viewRef.current, new Map());
    }
  }, [state.zenMode, state.lineToQueryMap, state.lineToOutputMap, state.lineToErrorMap]);

  return (
    <div className={`h-full flex flex-col ${state.zenMode ? 'zen-editor' : ''}`}>
      {!state.zenMode && <VersionLabel />}
      <div
        ref={editorRef}
        className="flex-1 overflow-auto"
      />
      {/* Query popup on hover (not in zen mode - use Alt inline expansion instead) */}
      {!state.zenMode && hoverQueries && (
        <QueryPopup
          queries={hoverQueries}
          x={hoverPosition.x}
          y={hoverPosition.y}
          showTemplated={isAltPressed}
        />
      )}
      {/* Error modal for zen mode when error has no line number */}
      {state.zenMode && showErrorModal && state.error && (
        <div className="zen-error-modal">
          <div className="zen-error-modal-header">
            <span className="zen-error-modal-title">Error</span>
            <button
              className="zen-error-modal-close"
              onClick={() => setShowErrorModal(false)}
              aria-label="Close error"
            >
              ✕
            </button>
          </div>
          <div className="zen-error-modal-content">{state.error}</div>
        </div>
      )}
    </div>
  );
}

export default CodeEditor;
