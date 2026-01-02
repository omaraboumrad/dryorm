import { keymap, highlightActiveLine, lineNumbers, highlightActiveLineGutter, EditorView } from '@codemirror/view';
import { EditorState, Prec } from '@codemirror/state';
import { indentOnInput, bracketMatching, foldGutter, foldKeymap } from '@codemirror/language';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { vim } from '@replit/codemirror-vim';
import { getTheme, getHighlighting } from './theme';
import { getQueryGutterExtensions } from './queryGutter';
import { getInlineResultsExtensions } from './inlineResults';

// Override vim's pink fat cursor with Django green
// Must use Prec.highest to override the vim extension's built-in styling
const vimCursorOverride = Prec.highest(EditorView.theme({
  ".cm-fat-cursor": {
    background: "rgba(110, 231, 183, 0.6) !important",
  },
  "&:not(.cm-focused) .cm-fat-cursor": {
    background: "none !important",
    outline: "solid 1px rgba(110, 231, 183, 0.7) !important",
  },
}));

/**
 * Create base extensions for the editor
 */
export function createBaseExtensions(isDark = false, editorMode = 'default') {
  const extensions = [
    // Line numbers and active line highlighting
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightActiveLine(),

    // Query line gutter markers
    ...getQueryGutterExtensions(),

    // Inline results and line highlights (for zen mode)
    ...getInlineResultsExtensions(),

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

  // Add vim mode if selected
  if (editorMode === 'vim') {
    extensions.unshift(vim());
    // Add cursor color override after vim to ensure it takes precedence
    extensions.push(vimCursorOverride);
  }

  return extensions;
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
