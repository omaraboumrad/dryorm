import React from 'react';
import { useAppState } from '../../context/AppContext';
import { Collapsible } from '../common';
import ChapterItem from './ChapterItem';

function JourneyList() {
  const state = useAppState();

  // Convert journeys object to array
  const journeyEntries = Object.entries(state.journeys);

  return (
    <div className="py-2">
      {journeyEntries.map(([slug, journey]) => (
        <JourneyItem
          key={slug}
          slug={slug}
          journey={journey}
          isCurrentJourney={state.currentJourney === slug}
          currentChapter={state.currentChapter}
        />
      ))}
    </div>
  );
}

function JourneyItem({ slug, journey, isCurrentJourney, currentChapter }) {
  const chapters = journey.chapters || [];

  return (
    <Collapsible
      title={
        <span className={`text-sm ${isCurrentJourney ? 'text-green-600 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
          {journey.title || slug}
        </span>
      }
      defaultOpen={isCurrentJourney}
      className="border-b border-gray-200 dark:border-gray-700"
      headerClassName="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50"
    >
      <div className="pb-2">
        {chapters.map((chapter, index) => (
          <ChapterItem
            key={chapter.id || index}
            chapter={chapter}
            journeySlug={slug}
            isCurrent={isCurrentJourney && currentChapter === (chapter.id || chapter.slug)}
            index={index}
          />
        ))}
      </div>
    </Collapsible>
  );
}

export default JourneyList;
