import React, { useState } from 'react';

export function RefreshButton({ onRefresh }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    await onRefresh();
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="px-3 py-1.5 bg-tarkov-gold text-black font-semibold rounded text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
    >
      {loading ? 'Refreshing...' : 'Refresh'}
    </button>
  );
}
