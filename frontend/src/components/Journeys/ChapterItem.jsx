import React from 'react';
import { useAppDispatch } from '../../context/AppContext';
import { fetchJourneyChapter } from '../../lib/api';

function ChapterItem({ chapter, journeySlug, isCurrent, index }) {
  const dispatch = useAppDispatch();

  const handleClick = async () => {
    const chapterId = chapter.id || chapter.slug || `chapter-${index}`;

    try {
      // Fetch chapter content
      const data = await fetchJourneyChapter(journeySlug, chapterId);

      // Update code in editor
      if (data.code) {
        dispatch({ type: 'SET_CODE', payload: data.code });
      }

      // Update current journey/chapter
      dispatch({
        type: 'SET_CURRENT_JOURNEY',
        payload: { slug: journeySlug, chapter: chapterId },
      });

      // Update URL
      const url = `/j/${journeySlug}#${chapterId}`;
      window.history.pushState({}, '', url);
    } catch (err) {
      console.error('Failed to load chapter:', err);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-6 py-1.5 text-sm transition-colors
        ${isCurrent
          ? 'bg-django-secondary/20 text-django-secondary font-medium'
          : 'text-white/60 hover:bg-django-primary-light hover:text-white/90'
        }`}
    >
      <span className="mr-2 text-white/40">{index + 1}.</span>
      {chapter.title || chapter.name || `Chapter ${index + 1}`}
    </button>
  );
}

export default ChapterItem;
