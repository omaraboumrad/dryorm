import React, { useEffect } from 'react';
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

  // Check URL for routing on mount
  useEffect(() => {
    const path = window.location.pathname;

    const loadInitialData = async () => {
      // Static pages
      if (path === '/about') {
        dispatch({ type: 'SET_PAGE', payload: 'about' });
        return;
      }
      if (path === '/browse') {
        dispatch({ type: 'SET_PAGE', payload: 'browse' });
        return;
      }

      // Journey path
      if (path === '/j/' || path.startsWith('/j/')) {
        dispatch({ type: 'SET_PAGE', payload: 'home' });
        const slug = path.slice(3);
        const hash = window.location.hash.slice(1);

        if (slug) {
          dispatch({ type: 'SET_CURRENT_JOURNEY', payload: { slug, chapter: hash || null } });

          // Load journeys list for the sidebar
          try {
            const data = await fetchJourneys();
            dispatch({ type: 'SET_JOURNEYS', payload: data.journeys || data });
          } catch (err) {
            console.error('Failed to load journeys:', err);
          }

          // If there's a chapter, load its content
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
        }

        dispatch({ type: 'TOGGLE_JOURNEY_NAV' });
        return;
      }

      // Home
      if (path === '/' || path === '') {
        dispatch({ type: 'SET_PAGE', payload: 'home' });
        return;
      }

      // Snippet detail
      const slug = path.slice(1).replace(/\/run$/, '');
      const shouldRun = path.endsWith('/run') || window.location.search.includes('run');

      if (slug) {
        dispatch({ type: 'SET_PAGE', payload: 'home' });
        try {
          const snippet = await fetchSnippet(slug);
          dispatch({ type: 'LOAD_SNIPPET', payload: snippet });

          if (shouldRun) {
            dispatch({ type: 'SET_SHOULD_AUTO_RUN', payload: true });
          }
        } catch (err) {
          console.error('Failed to load snippet:', err);
        }
      }
    };
    loadInitialData();
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

    // Listen for system preference changes when in system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (state.themeMode === 'system') {
        applyTheme();
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [state.themeMode]);

  // Handle popstate for browser navigation
  useEffect(() => {
    const handlePopState = async () => {
      const path = window.location.pathname;
      if (path.startsWith('/j/')) {
        const slug = path.slice(3);
        const hash = window.location.hash.slice(1);
        dispatch({ type: 'SET_CURRENT_JOURNEY', payload: { slug, chapter: hash || null } });

        // Load chapter content if there's a hash
        if (slug && hash) {
          try {
            const chapterData = await fetchJourneyChapter(slug, hash);
            if (chapterData.code) {
              dispatch({ type: 'SET_CODE', payload: chapterData.code });
            }
          } catch (err) {
            console.error('Failed to load chapter:', err);
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [dispatch]);

  // Render page content based on current page
  const renderPage = () => {
    switch (state.currentPage) {
      case 'about':
        return <AboutPage />;
      case 'browse':
        return <BrowsePage />;
      default:
        return (
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {state.showJourneyNav && !state.zenMode && <JourneyNav />}

            <main className="flex-1 min-w-0 overflow-hidden">
              {/* Mobile tabs */}
              <div className="lg:hidden">
                <MobileTabs />
              </div>

              {/* Desktop split pane / Mobile content */}
              <SplitPane />
            </main>
          </div>
        );
    }
  };

  return (
    <div className={`h-screen flex flex-col bg-theme-page overflow-hidden ${state.zenMode ? 'zen-mode' : ''}`}>
      {!state.zenMode && <Header />}

      {renderPage()}

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
