import React from 'react';
import { useAppState } from '../../context/AppContext';
import { Collapsible } from '../common';
import ChapterItem from './ChapterItem';

function JourneyList() {
  const state = useAppState();

  // Convert journeys object to array
  const journeyEntries = Object.entries(state.journeys);

  return (
    <div>
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
        <span className={`text-sm ${isCurrentJourney ? 'text-brand font-medium' : 'text-theme-text'}`}>
          {journey.title || slug}
        </span>
      }
      defaultOpen={isCurrentJourney}
      className="border-b border-theme-border"
      headerClassName="px-3 py-1.5 hover:bg-theme-surface"
      iconClassName="text-theme-text-muted"
    >
      <div>
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
