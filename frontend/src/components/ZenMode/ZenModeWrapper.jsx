import React from 'react';
import { useAppState } from '../../context/AppContext';
import FloatingControls from './FloatingControls';
import SlidePanel from './SlidePanel';

function ZenModeWrapper({ children }) {
  const state = useAppState();

  if (!state.zenMode) {
    return children;
  }

  return (
    <div className="zen-mode fixed inset-0 z-30">
      {/* Full-screen editor */}
      <div className="h-full">
        {children}
      </div>

      {/* Floating controls */}
      <FloatingControls />

      {/* Slide panel for results */}
      <SlidePanel />
    </div>
  );
}

export default ZenModeWrapper;
