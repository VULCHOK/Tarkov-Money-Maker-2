import React from 'react';

export function KofiButton({ pillBase, pillOff }) {
  return (
    <a
      href="https://ko-fi.com/vulchok"
      target="_blank"
      rel="noopener noreferrer"
      className={`${pillBase} ${pillOff}`}
      title="Support the project on Ko-fi"
      style={{ textDecoration: 'none', gap: '5px' }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14"
        fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        style={{ color: '#ff5e5b', flexShrink: 0 }}
      >
        <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
        <line x1="6" y1="2" x2="6" y2="4" />
        <line x1="10" y1="2" x2="10" y2="4" />
        <line x1="14" y1="2" x2="14" y2="4" />
      </svg>
      <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em' }}>Ko-fi</span>
    </a>
  );
}
