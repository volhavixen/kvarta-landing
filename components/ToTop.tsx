'use client';

import { useEffect, useState } from 'react';

export function ToTop() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      className={`to-top${shown ? ' on' : ''}`}
      aria-label="Наверх"
      tabIndex={shown ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0 })}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M9 15V3M3 8.5 9 3l6 5.5" />
      </svg>
    </button>
  );
}
