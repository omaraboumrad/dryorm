import React, { useRef, useEffect, useCallback } from 'react';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { useExecute } from '../../hooks/useExecute';
import { createBaseExtensions, createExecuteKeymap } from '../../lib/codemirror/setup';
import VersionLabel from './VersionLabel';

function CodeEditor() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { execute } = useExecute();

  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const darkModeRef = useRef(state.darkMode);
  const executeRef = useRef(execute);

  // Keep executeRef up to date
  useEffect(() => {
    executeRef.current = execute;
  }, [execute]);

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
      ...createBaseExtensions(state.darkMode),
      // Update state when content changes
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          dispatch({ type: 'SET_CODE', payload: update.state.doc.toString() });
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
    darkModeRef.current = state.darkMode;
    dispatch({ type: 'SET_EDITOR_VIEW', payload: view });

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [state.darkMode]); // Recreate editor when dark mode changes

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
    </div>
  );
}

export default CodeEditor;
