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
          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 font-medium'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
    >
      <span className="mr-2 text-gray-400 dark:text-gray-500">{index + 1}.</span>
      {chapter.title || chapter.name || `Chapter ${index + 1}`}
    </button>
  );
}

export default ChapterItem;
