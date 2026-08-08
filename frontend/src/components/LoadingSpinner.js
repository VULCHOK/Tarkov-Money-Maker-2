import React from 'react';

export function LoadingSpinner({ label, accentColor }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-white/10" />
        <div className="absolute inset-0 rounded-full border-2 border-t-tarkov-gold border-r-transparent border-b-transparent border-l-transparent animate-spin" />
      </div>
      <p className="text-gray-400 text-sm">
        {label} <span className={accentColor}>...</span>
      </p>
    </div>
  );
}
