import React, { useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { XIcon, JourneyIcon, SpinnerIcon } from '../icons';
import JourneyList from './JourneyList';
import { fetchJourneys } from '../../lib/api';

function JourneyNav() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  // Fetch journeys on first open
  useEffect(() => {
    if (state.showJourneyNav && !state.journeysLoaded) {
      const loadJourneys = async () => {
        try {
          const data = await fetchJourneys();
          dispatch({ type: 'SET_JOURNEYS', payload: data.journeys || data });
        } catch (err) {
          console.error('Failed to load journeys:', err);
        }
      };
      loadJourneys();
    }
  }, [state.showJourneyNav, state.journeysLoaded, dispatch]);

  const handleClose = () => {
    dispatch({ type: 'TOGGLE_JOURNEY_NAV' });
  };

  return (
    <aside className="w-80 flex-shrink-0 bg-theme-panel border-r border-theme-border h-full overflow-hidden flex flex-col">
      {/* Header */}
      <div className="h-10 flex items-center justify-between px-3 border-b border-theme-border">
        <div className="flex items-center gap-2 text-theme-text">
          <JourneyIcon size={20} className="text-django-secondary" />
          <span className="font-medium">Learning Journeys</span>
        </div>
        <button
          onClick={handleClose}
          className="p-1 rounded hover:bg-theme-surface text-theme-text-secondary hover:text-theme-text"
        >
          <XIcon size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {!state.journeysLoaded ? (
          <div className="flex items-center justify-center py-12">
            <SpinnerIcon size={24} className="text-django-secondary" />
          </div>
        ) : Object.keys(state.journeys).length === 0 ? (
          <div className="p-4 text-center text-theme-text-muted">
            No journeys available
          </div>
        ) : (
          <JourneyList />
        )}
      </div>
    </aside>
  );
}

export default JourneyNav;
