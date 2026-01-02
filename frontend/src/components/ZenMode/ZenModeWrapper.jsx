import React from 'react';
import { useAppState } from '../../context/AppContext';
import FloatingControls from './FloatingControls';

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

      {/* Results shown inline via Alt key - no slide panel needed */}
    </div>
  );
}

export default ZenModeWrapper;
