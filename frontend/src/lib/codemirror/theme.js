import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

// Django green theme colors
const djangoGreen = '#44b78b';
const djangoGreenDark = '#0C4B33';
const djangoGreenLight = '#86efac';
const djangoTeal = '#14b8a6';
const djangoEmerald = '#10b981';
const djangoForest = '#166534';

// Light theme
export const lightTheme = EditorView.theme({
  '&': {
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  '.cm-content': {
    caretColor: djangoGreen,
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: djangoGreen,
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'rgba(68, 183, 139, 0.2)',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(68, 183, 139, 0.05)',
  },
  '.cm-gutters': {
    backgroundColor: '#f9fafb',
    color: '#9ca3af',
    border: 'none',
    borderRight: '1px solid #e5e7eb',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(68, 183, 139, 0.1)',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 8px 0 16px',
  },
}, { dark: false });

// Dark theme
export const darkTheme = EditorView.theme({
  '&': {
    color: '#e5e7eb',
    backgroundColor: '#1f2937',
  },
  '.cm-content': {
    caretColor: djangoGreen,
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: djangoGreen,
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'rgba(68, 183, 139, 0.3)',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(68, 183, 139, 0.1)',
  },
  '.cm-gutters': {
    backgroundColor: '#111827',
    color: '#6b7280',
    border: 'none',
    borderRight: '1px solid #374151',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(68, 183, 139, 0.15)',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 8px 0 16px',
  },
}, { dark: true });

// Syntax highlighting for light mode - Django green theme (matching master)
export const lightHighlighting = HighlightStyle.define([
  { tag: tags.keyword, color: '#0C4B33', fontWeight: '700' },
  { tag: tags.controlKeyword, color: '#0C4B33', fontWeight: '700' },
  { tag: tags.operatorKeyword, color: '#0C4B33', fontWeight: '700' },
  { tag: tags.definitionKeyword, color: '#0C4B33', fontWeight: '700' },
  { tag: tags.moduleKeyword, color: '#0C4B33', fontWeight: '700' },
  { tag: tags.string, color: '#116644', fontWeight: '500' },
  { tag: tags.number, color: '#116644' },
  { tag: tags.bool, color: '#0C4B33', fontWeight: '700' },
  { tag: tags.null, color: '#0C4B33', fontWeight: '700' },
  { tag: tags.comment, color: 'gray', fontStyle: 'italic' },
  { tag: tags.function(tags.variableName), color: '#116644' },
  { tag: tags.className, color: '#0C4B33', fontWeight: '700' },
  { tag: tags.definition(tags.variableName), color: '#1f2937' },
  { tag: tags.propertyName, color: '#1f2937' },
  { tag: tags.operator, color: '#1f2937' },
  { tag: tags.self, color: '#0C4B33', fontWeight: '700' },
  { tag: tags.special(tags.variableName), color: djangoGreen },
]);

// Syntax highlighting for dark mode - Django green theme
export const darkHighlighting = HighlightStyle.define([
  { tag: tags.keyword, color: djangoGreen, fontWeight: '700' },
  { tag: tags.controlKeyword, color: djangoGreen, fontWeight: '700' },
  { tag: tags.operatorKeyword, color: djangoGreen, fontWeight: '700' },
  { tag: tags.definitionKeyword, color: djangoGreen, fontWeight: '700' },
  { tag: tags.moduleKeyword, color: djangoGreen, fontWeight: '700' },
  { tag: tags.string, color: djangoGreenLight },
  { tag: tags.number, color: '#5eead4' },
  { tag: tags.bool, color: '#6ee7b7', fontWeight: '700' },
  { tag: tags.null, color: '#6ee7b7', fontWeight: '700' },
  { tag: tags.comment, color: '#6b7280', fontStyle: 'italic' },
  { tag: tags.function(tags.variableName), color: '#34d399' },
  { tag: tags.className, color: djangoGreen, fontWeight: '700' },
  { tag: tags.definition(tags.variableName), color: '#e5e7eb' },
  { tag: tags.propertyName, color: '#e5e7eb' },
  { tag: tags.operator, color: '#9ca3af' },
  { tag: tags.self, color: '#fbbf24', fontWeight: '700' },
  { tag: tags.special(tags.variableName), color: djangoGreenLight },
]);

export function getTheme(isDark) {
  return isDark ? darkTheme : lightTheme;
}

export function getHighlighting(isDark) {
  return syntaxHighlighting(isDark ? darkHighlighting : lightHighlighting);
}
