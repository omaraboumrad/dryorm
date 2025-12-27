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
        <span className={`text-sm ${isCurrentJourney ? 'text-django-primary dark:text-django-secondary font-medium' : 'text-django-text dark:text-green-100'}`}>
          {journey.title || slug}
        </span>
      }
      defaultOpen={isCurrentJourney}
      className="border-b border-django-primary/10 dark:border-green-700"
      headerClassName="px-4 py-2 hover:bg-django-primary/10 dark:hover:bg-green-800"
      iconClassName="text-django-text/50 dark:text-green-300"
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
