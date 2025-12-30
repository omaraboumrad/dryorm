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
import { fetchConfig, fetchSnippet } from './lib/api';

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

  // Check URL for snippet or journey on mount
  useEffect(() => {
    let path = window.location.pathname;

    // Handle /react/ base path - strip it for routing purposes
    const basePath = '/react';
    if (path.startsWith(basePath)) {
      path = path.slice(basePath.length) || '/';
    }

    const loadInitialData = async () => {
      // Check for journey path
      if (path.startsWith('/j/')) {
        const slug = path.slice(3);
        const hash = window.location.hash.slice(1);
        dispatch({ type: 'SET_CURRENT_JOURNEY', payload: { slug, chapter: hash || null } });
        return;
      }

      // Check for snippet (not root, not journey, not empty)
      if (path !== '/' && path !== '' && !path.startsWith('/j/')) {
        const slug = path.slice(1).replace(/\/run$/, '');
        const shouldRun = path.endsWith('/run') || window.location.search.includes('run');

        // Only try to load if slug looks valid (not empty, not a known route)
        if (slug && slug !== 'react') {
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
      }
    };
    loadInitialData();
  }, [dispatch]);

  // Apply dark mode class
  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.darkMode]);

  // Handle popstate for browser navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/j/')) {
        const slug = path.slice(3);
        const hash = window.location.hash.slice(1);
        dispatch({ type: 'SET_CURRENT_JOURNEY', payload: { slug, chapter: hash || null } });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [dispatch]);

  return (
    <div className={`h-screen flex flex-col bg-theme-page overflow-hidden ${state.zenMode ? 'zen-mode' : ''}`}>
      {!state.zenMode && <Header />}

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
