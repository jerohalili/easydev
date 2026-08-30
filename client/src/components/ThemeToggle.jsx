import React, { useEffect, useState } from 'react';
import { Sun, Moon } from '@phosphor-icons/react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('easydev_theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('easydev_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <button
      onClick={toggleTheme}
      className="btn-interactive theme-toggle"
      style={{
        padding: '8px 16px',
        borderRadius: '30px',
        border: 'none',
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-primary)',
        fontSize: '13px',
        fontWeight: '700',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        minWidth: '130px'
      }}
      aria-label="Toggle color theme"
    >
      {theme === 'light' ? (
        <>
          <Moon size={16} weight="duotone" style={{ color: 'var(--primary-accent)' }} />
          <span>Dark Mode</span>
        </>
      ) : (
        <>
          <Sun size={16} weight="duotone" style={{ color: 'var(--primary-accent)' }} />
          <span>Light Mode</span>
        </>
      )}
    </button>
  );
}