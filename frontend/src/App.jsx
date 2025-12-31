import React, { useEffect } from 'react';
import { Routes, Route, useParams, useSearchParams } from 'react-router-dom';
import { useAppState, useAppDispatch } from './context/AppContext';
import Header from './components/Layout/Header';
import MobileTabs from './components/Layout/MobileTabs';
import SplitPane from './components/Layout/SplitPane';
import JourneyNav from './components/Journeys/JourneyNav';
import SettingsPanel from './components/Settings/SettingsPanel';
import RefDialog from './components/Dialogs/RefDialog';
import ShareDialog from './components/Dialogs/ShareDialog';
import HtmlPreview from './components/Dialogs/HtmlPreview';
import FloatingControls from './components/ZenMode/FloatingControls';
import AboutPage from './components/Pages/AboutPage';
import BrowsePage from './components/Pages/BrowsePage';
import { fetchConfig, fetchSnippet, fetchJourneys, fetchJourneyChapter } from './lib/api';

// Home page component (editor)
function HomePage() {
  const state = useAppState();

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {state.showJourneyNav && !state.zenMode && <JourneyNav />}
      <main className="flex-1 min-w-0 overflow-hidden">
        <div className="lg:hidden">
          <MobileTabs />
        </div>
        <SplitPane />
      </main>
    </div>
  );
}

// Snippet page - loads snippet and renders editor
function SnippetPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const state = useAppState();
  const shouldRun = searchParams.has('run');
  const snippetLoadedRef = React.useRef(false);

  useEffect(() => {
    snippetLoadedRef.current = false;
    const loadSnippet = async () => {
      try {
        const snippet = await fetchSnippet(slug);
        dispatch({ type: 'LOAD_SNIPPET', payload: snippet });
        snippetLoadedRef.current = true;
        if (shouldRun) {
          dispatch({ type: 'SET_SHOULD_AUTO_RUN', payload: true });
        }
      } catch (err) {
        console.error('Failed to load snippet:', err);
      }
    };
    loadSnippet();
  }, [slug, shouldRun, dispatch]);

  // Auto-run effect
  useEffect(() => {
    if (state.shouldAutoRun && snippetLoadedRef.current && state.code) {
      dispatch({ type: 'SET_SHOULD_AUTO_RUN', payload: false });
      window.dispatchEvent(new CustomEvent('dryorm:execute'));
    }
  }, [state.shouldAutoRun, state.code, dispatch]);

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {state.showJourneyNav && !state.zenMode && <JourneyNav />}
      <main className="flex-1 min-w-0 overflow-hidden">
        <div className="lg:hidden">
          <MobileTabs />
        </div>
        <SplitPane />
      </main>
    </div>
  );
}

// Snippet run page - loads and auto-runs
function SnippetRunPage() {
  const { slug } = useParams();
  const dispatch = useAppDispatch();
  const state = useAppState();
  const snippetLoadedRef = React.useRef(false);

  useEffect(() => {
    snippetLoadedRef.current = false;
    const loadSnippet = async () => {
      try {
        const snippet = await fetchSnippet(slug);
        dispatch({ type: 'LOAD_SNIPPET', payload: snippet });
        snippetLoadedRef.current = true;
        dispatch({ type: 'SET_SHOULD_AUTO_RUN', payload: true });
      } catch (err) {
        console.error('Failed to load snippet:', err);
      }
    };
    loadSnippet();
  }, [slug, dispatch]);

  // Auto-run effect - executes when shouldAutoRun becomes true and snippet is loaded
  useEffect(() => {
    if (state.shouldAutoRun && snippetLoadedRef.current && state.code) {
      dispatch({ type: 'SET_SHOULD_AUTO_RUN', payload: false });
      // Trigger execution via a custom event or directly
      window.dispatchEvent(new CustomEvent('dryorm:execute'));
    }
  }, [state.shouldAutoRun, state.code, dispatch]);

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {state.showJourneyNav && !state.zenMode && <JourneyNav />}
      <main className="flex-1 min-w-0 overflow-hidden">
        <div className="lg:hidden">
          <MobileTabs />
        </div>
        <SplitPane />
      </main>
    </div>
  );
}

// Journey page
function JourneyPage() {
  const { slug } = useParams();
  const dispatch = useAppDispatch();
  const state = useAppState();

  useEffect(() => {
    const loadJourney = async () => {
      const hash = window.location.hash.slice(1);
      dispatch({ type: 'SET_CURRENT_JOURNEY', payload: { slug, chapter: hash || null } });

      try {
        const data = await fetchJourneys();
        dispatch({ type: 'SET_JOURNEYS', payload: data.journeys || data });
      } catch (err) {
        console.error('Failed to load journeys:', err);
      }

      if (hash) {
        try {
          const chapterData = await fetchJourneyChapter(slug, hash);
          if (chapterData.code) {
            dispatch({ type: 'SET_CODE', payload: chapterData.code });
          }
        } catch (err) {
          console.error('Failed to load chapter:', err);
        }
      }

      // Open journey nav
      if (!state.showJourneyNav) {
        dispatch({ type: 'TOGGLE_JOURNEY_NAV' });
      }
    };
    loadJourney();
  }, [slug, dispatch]);

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {state.showJourneyNav && !state.zenMode && <JourneyNav />}
      <main className="flex-1 min-w-0 overflow-hidden">
        <div className="lg:hidden">
          <MobileTabs />
        </div>
        <SplitPane />
      </main>
    </div>
  );
}

function App() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  // Load config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await fetchConfig();
        dispatch({ type: 'SET_CONFIG', payload: config });
      } catch (err) {
        console.error('Failed to load config:', err);
      }
    };
    loadConfig();
  }, [dispatch]);

  // Apply dark mode class based on themeMode
  useEffect(() => {
    const applyTheme = () => {
      let isDark;
      if (state.themeMode === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = state.themeMode === 'dark';
      }

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (state.themeMode === 'system') {
        applyTheme();
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [state.themeMode]);

  return (
    <div className={`h-screen flex flex-col bg-theme-page overflow-hidden ${state.zenMode ? 'zen-mode' : ''}`}>
      {!state.zenMode && <Header />}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/j/:slug" element={<JourneyPage />} />
        <Route path="/:slug/run" element={<SnippetRunPage />} />
        <Route path="/:slug" element={<SnippetPage />} />
      </Routes>

      {/* Zen mode floating controls */}
      {state.zenMode && <FloatingControls />}

      {/* Modals */}
      {state.showSettings && <SettingsPanel />}
      {state.showRefDialog && <RefDialog />}
      {state.showShareDialog && <ShareDialog />}
      {state.showHtmlPreview && <HtmlPreview />}
    </div>
  );
}

export default App;
