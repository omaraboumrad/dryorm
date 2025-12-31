import React, { useRef, useEffect, useCallback, useState } from 'react';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { useExecute } from '../../hooks/useExecute';
import { createBaseExtensions, createExecuteKeymap } from '../../lib/codemirror/setup';
import { updateQueryMarkers } from '../../lib/codemirror/queryGutter';
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

  // Hover popup state
  const [hoverQueries, setHoverQueries] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [isAltPressed, setIsAltPressed] = useState(false);

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

  // Alt key listener for query popup toggle
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Alt') setIsAltPressed(true);
    };
    const handleKeyUp = (e) => {
      if (e.key === 'Alt') setIsAltPressed(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mouse hover handlers for query popup
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
            return;
          }
        }
      }
      setHoverQueries(null);
    };

    const handleMouseLeave = (e) => {
      if (!editorElement.contains(e.relatedTarget)) {
        setHoverQueries(null);
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
      ...createBaseExtensions(isDark),
      // Update state when content changes or cursor moves
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          dispatch({ type: 'SET_CODE', payload: update.state.doc.toString() });
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
          } else {
            dispatch({ type: 'SET_HIGHLIGHTED_QUERY', payload: null });
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
  }, [isDark]); // Recreate editor when dark mode changes

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

  return (
    <div className="h-full flex flex-col">
      <VersionLabel />
      <div
        ref={editorRef}
        className="flex-1 overflow-auto"
      />
      {hoverQueries && (
        <QueryPopup
          queries={hoverQueries}
          x={hoverPosition.x}
          y={hoverPosition.y}
          showTemplated={isAltPressed}
        />
      )}
    </div>
  );
}

export default CodeEditor;
