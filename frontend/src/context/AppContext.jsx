import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  // UI State
  loading: false,
  showSettings: false,
  showCode: true,
  showResult: false,
  showJourneyNav: false,
  showRefDialog: false,
  showShareDialog: false,
  showHtmlPreview: false,
  zenMode: false,
  shouldAutoRun: false,

  // Theme
  darkMode: false,

  // Editor
  code: `from django.db import models

class Person(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

def run():
    instance = Person.objects.create(name='John Doe')
    print(f'Created: {instance}')
`,
  editorView: null,

  // Execution Results
  rawOutput: '',
  rawQueries: [],
  returnedData: null,
  erdLink: null,
  htmlTemplate: null,
  error: null,

  // Settings
  database: 'sqlite',
  ormVersion: 'django-5.2',
  ignoreCache: false,
  currentRefInfo: null,

  // Config (from API)
  templates: {},
  databases: [],
  ormVersions: [],

  // Journeys
  journeys: {},
  journeysLoaded: false,
  currentJourney: null,
  currentChapter: null,

  // Query UI
  queryFilters: {
    TCL: false,
    DDL: true,
    SELECT: true,
    INSERT: true,
    UPDATE: true,
    DELETE: true,
    reverse: false,
  },

  // Editor-Query linking
  lineToQueryMap: new Map(),
  highlightedQueryIndex: null,
};

// Load persisted state from localStorage
function loadPersistedState() {
  try {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    const zenMode = localStorage.getItem('zenMode') === 'true';
    return { darkMode, zenMode };
  } catch {
    return {};
  }
}

// Action types
const actions = {
  SET_LOADING: 'SET_LOADING',
  SET_CONFIG: 'SET_CONFIG',
  SET_CODE: 'SET_CODE',
  SET_EDITOR_VIEW: 'SET_EDITOR_VIEW',
  SET_RESULTS: 'SET_RESULTS',
  SET_ERROR: 'SET_ERROR',
  CLEAR_RESULTS: 'CLEAR_RESULTS',
  TOGGLE_SETTINGS: 'TOGGLE_SETTINGS',
  TOGGLE_JOURNEY_NAV: 'TOGGLE_JOURNEY_NAV',
  TOGGLE_REF_DIALOG: 'TOGGLE_REF_DIALOG',
  TOGGLE_SHARE_DIALOG: 'TOGGLE_SHARE_DIALOG',
  TOGGLE_HTML_PREVIEW: 'TOGGLE_HTML_PREVIEW',
  TOGGLE_DARK_MODE: 'TOGGLE_DARK_MODE',
  TOGGLE_ZEN_MODE: 'TOGGLE_ZEN_MODE',
  SET_SHOW_CODE: 'SET_SHOW_CODE',
  SET_SHOW_RESULT: 'SET_SHOW_RESULT',
  SET_DATABASE: 'SET_DATABASE',
  SET_ORM_VERSION: 'SET_ORM_VERSION',
  SET_IGNORE_CACHE: 'SET_IGNORE_CACHE',
  SET_CURRENT_REF: 'SET_CURRENT_REF',
  CLEAR_CURRENT_REF: 'CLEAR_CURRENT_REF',
  SET_QUERY_FILTER: 'SET_QUERY_FILTER',
  SET_LINE_QUERY_MAP: 'SET_LINE_QUERY_MAP',
  SET_HIGHLIGHTED_QUERY: 'SET_HIGHLIGHTED_QUERY',
  SET_JOURNEYS: 'SET_JOURNEYS',
  SET_CURRENT_JOURNEY: 'SET_CURRENT_JOURNEY',
  LOAD_SNIPPET: 'LOAD_SNIPPET',
  SET_SHOULD_AUTO_RUN: 'SET_SHOULD_AUTO_RUN',
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case actions.SET_LOADING:
      return { ...state, loading: action.payload };

    case actions.SET_CONFIG:
      return {
        ...state,
        templates: action.payload.templates || {},
        databases: action.payload.databases || [],
        ormVersions: action.payload.ormVersions || [],
      };

    case actions.SET_CODE:
      return { ...state, code: action.payload };

    case actions.SET_EDITOR_VIEW:
      return { ...state, editorView: action.payload };

    case actions.SET_RESULTS:
      return {
        ...state,
        rawOutput: action.payload.output || '',
        rawQueries: action.payload.queries || [],
        returnedData: action.payload.returnedData || null,
        erdLink: action.payload.erdLink || null,
        htmlTemplate: action.payload.htmlTemplate || null,
        error: null,
      };

    case actions.SET_ERROR:
      return { ...state, error: action.payload };

    case actions.CLEAR_RESULTS:
      return {
        ...state,
        rawOutput: '',
        rawQueries: [],
        returnedData: null,
        erdLink: null,
        htmlTemplate: null,
        error: null,
      };

    case actions.TOGGLE_SETTINGS:
      return { ...state, showSettings: !state.showSettings };

    case actions.TOGGLE_JOURNEY_NAV:
      return { ...state, showJourneyNav: !state.showJourneyNav };

    case actions.TOGGLE_REF_DIALOG:
      return { ...state, showRefDialog: !state.showRefDialog };

    case actions.TOGGLE_SHARE_DIALOG:
      return { ...state, showShareDialog: !state.showShareDialog };

    case actions.TOGGLE_HTML_PREVIEW:
      return { ...state, showHtmlPreview: !state.showHtmlPreview };

    case actions.TOGGLE_DARK_MODE: {
      const newDarkMode = !state.darkMode;
      try {
        localStorage.setItem('darkMode', newDarkMode);
      } catch {}
      return { ...state, darkMode: newDarkMode };
    }

    case actions.TOGGLE_ZEN_MODE: {
      const newZenMode = !state.zenMode;
      try {
        localStorage.setItem('zenMode', newZenMode);
      } catch {}
      return { ...state, zenMode: newZenMode };
    }

    case actions.SET_SHOW_CODE:
      return { ...state, showCode: action.payload, showResult: !action.payload };

    case actions.SET_SHOW_RESULT:
      return { ...state, showResult: action.payload, showCode: !action.payload };

    case actions.SET_DATABASE:
      return { ...state, database: action.payload };

    case actions.SET_ORM_VERSION:
      return { ...state, ormVersion: action.payload };

    case actions.SET_IGNORE_CACHE:
      return { ...state, ignoreCache: action.payload };

    case actions.SET_CURRENT_REF:
      return { ...state, currentRefInfo: action.payload };

    case actions.CLEAR_CURRENT_REF:
      return { ...state, currentRefInfo: null };

    case actions.SET_QUERY_FILTER:
      return {
        ...state,
        queryFilters: {
          ...state.queryFilters,
          [action.payload.filter]: action.payload.value,
        },
      };

    case actions.SET_LINE_QUERY_MAP:
      return { ...state, lineToQueryMap: action.payload };

    case actions.SET_HIGHLIGHTED_QUERY:
      return { ...state, highlightedQueryIndex: action.payload };

    case actions.SET_JOURNEYS:
      return {
        ...state,
        journeys: action.payload,
        journeysLoaded: true,
      };

    case actions.SET_CURRENT_JOURNEY:
      return {
        ...state,
        currentJourney: action.payload.slug,
        currentChapter: action.payload.chapter,
      };

    case actions.LOAD_SNIPPET:
      return {
        ...state,
        code: action.payload.code || '',
        database: action.payload.database || state.database,
        ormVersion: action.payload.ormVersion || state.ormVersion,
        currentRefInfo: action.payload.refInfo || null,
      };

    case actions.SET_SHOULD_AUTO_RUN:
      return { ...state, shouldAutoRun: action.payload };

    default:
      return state;
  }
}

// Context
const AppStateContext = createContext(null);
const AppDispatchContext = createContext(null);

// Provider component
export function AppProvider({ children }) {
  const persistedState = loadPersistedState();
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    ...persistedState,
  });

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

// Hooks for accessing state and dispatch
export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === null) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
}

export function useAppDispatch() {
  const context = useContext(AppDispatchContext);
  if (context === null) {
    throw new Error('useAppDispatch must be used within an AppProvider');
  }
  return context;
}

// Export action types for use in components
export { actions };
