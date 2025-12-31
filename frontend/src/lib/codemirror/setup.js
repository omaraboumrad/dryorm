import { keymap, highlightActiveLine, lineNumbers, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { indentOnInput, bracketMatching, foldGutter, foldKeymap } from '@codemirror/language';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { getTheme, getHighlighting } from './theme';
import { getQueryGutterExtensions } from './queryGutter';

/**
 * Create base extensions for the editor
 */
export function createBaseExtensions(isDark = false) {
  return [
    // Line numbers and active line highlighting
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightActiveLine(),

    // Query line gutter markers
    ...getQueryGutterExtensions(),

    // History (undo/redo)
    history(),

    // Code folding
    foldGutter(),

    // Bracket matching
    bracketMatching(),

    // Auto-indent on input
    indentOnInput(),

    // Python language support
    python(),

    // Theme
    getTheme(isDark),
    getHighlighting(isDark),

    // Keymaps
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...foldKeymap,
      indentWithTab,
    ]),

    // Tab size
    EditorState.tabSize.of(4),
  ];
}

/**
 * Create execute keymap
 */
export function createExecuteKeymap(onExecute, onForceExecute) {
  return keymap.of([
    {
      key: 'Mod-Enter',
      run: () => {
        onExecute();
        return true;
      },
    },
    {
      key: 'Ctrl-Enter',
      run: () => {
        onExecute();
        return true;
      },
    },
    {
      key: 'Shift-Mod-Enter',
      run: () => {
        onForceExecute();
        return true;
      },
    },
    {
      key: 'Shift-Ctrl-Enter',
      run: () => {
        onForceExecute();
        return true;
      },
    },
  ]);
}
