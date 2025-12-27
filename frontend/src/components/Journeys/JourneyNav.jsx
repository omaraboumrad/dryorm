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
    <aside className="w-72 flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-[calc(100vh-57px)] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <JourneyIcon size={20} />
          <span className="font-medium">Learning Journeys</span>
        </div>
        <button
          onClick={handleClose}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
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
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
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
