import React, { useState, useEffect, useRef } from 'react';

const FlagGB = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" width="20" height="10" style={{flexShrink:0,borderRadius:'2px'}}>
    <clipPath id="gb-t"><path d="M0,0 v30 h60 v-30 z"/></clipPath>
    <clipPath id="gb-c"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>
    <g clipPath="url(#gb-t)">
      <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" clipPath="url(#gb-c)"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
    </g>
  </svg>
);
const FlagFR = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" width="20" height="14" style={{flexShrink:0,borderRadius:'2px'}}>
    <rect width="10" height="20" fill="#002395"/>
    <rect x="10" width="10" height="20" fill="#fff"/>
    <rect x="20" width="10" height="20" fill="#ED2939"/>
  </svg>
);
const FlagDE = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" width="20" height="14" style={{flexShrink:0,borderRadius:'2px'}}>
    <rect width="30" height="7" fill="#000"/>
    <rect y="7" width="30" height="7" fill="#D00"/>
    <rect y="14" width="30" height="6" fill="#FFCE00"/>
  </svg>
);
const FlagRU = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" width="20" height="14" style={{flexShrink:0,borderRadius:'2px'}}>
    <rect width="30" height="7" fill="#fff"/>
    <rect y="7" width="30" height="7" fill="#0039A6"/>
    <rect y="14" width="30" height="6" fill="#D52B1E"/>
  </svg>
);
const FlagPL = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" width="20" height="14" style={{flexShrink:0,borderRadius:'2px'}}>
    <rect width="30" height="10" fill="#fff"/>
    <rect y="10" width="30" height="10" fill="#DC143C"/>
  </svg>
);
const FlagES = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" width="20" height="14" style={{flexShrink:0,borderRadius:'2px'}}>
    <rect width="30" height="20" fill="#AA151B"/>
    <rect y="5" width="30" height="10" fill="#F1BF00"/>
  </svg>
);

export const LANGS = [
  { code: 'en', Flag: FlagGB, label: 'English' },
  { code: 'fr', Flag: FlagFR, label: 'Français' },
  { code: 'de', Flag: FlagDE, label: 'Deutsch' },
  { code: 'ru', Flag: FlagRU, label: 'Русский' },
  { code: 'pl', Flag: FlagPL, label: 'Polski' },
  { code: 'es', Flag: FlagES, label: 'Español' },
];

export function LangSelector({ lang, setLang, pillBase, pillOff }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGS.find((l) => l.code === lang) || LANGS[0];
  const CurrentFlag = current.Flag;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const select = (code) => { setLang(code); setOpen(false); };

  return (
    <div ref={ref} style={{position:'relative'}}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`${pillBase} ${pillOff}`}
        style={{gap:'6px'}}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Language / Langue"
      >
        <CurrentFlag />
        <span style={{fontWeight:600,fontSize:'11px',letterSpacing:'0.05em',textTransform:'uppercase'}}>
          {current.code}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10" height="10"
          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{opacity:0.5, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 150ms'}}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Select language"
          style={{
            position:'absolute', right:0, marginTop:'4px', zIndex:50,
            background:'#1a1a1a', border:'1px solid rgba(255,255,255,0.15)',
            borderRadius:'8px', boxShadow:'0 8px 24px rgba(0,0,0,0.6)',
            minWidth:'140px', overflow:'hidden', padding:'4px 0',
          }}
        >
          {LANGS.map(({ code, Flag, label }) => (
            <li key={code} role="option" aria-selected={code === lang}>
              <button
                onClick={() => select(code)}
                style={{
                  width:'100%', display:'flex', alignItems:'center', gap:'10px',
                  padding:'6px 12px', fontSize:'12px', cursor:'pointer', border:'none',
                  background: code === lang ? 'rgba(201,168,84,0.12)' : 'transparent',
                  color: code === lang ? '#c9a854' : '#ccc',
                  fontWeight: code === lang ? 600 : 400,
                  transition:'background 120ms, color 120ms',
                }}
                onMouseEnter={e => { if (code !== lang) { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='#fff'; }}}
                onMouseLeave={e => { if (code !== lang) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#ccc'; }}}
              >
                <Flag />
                <span>{label}</span>
                {code === lang && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10" height="10"
                    fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                    style={{marginLeft:'auto'}}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
