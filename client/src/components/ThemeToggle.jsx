import React, { useEffect, useState } from 'react';
import { Sun, Moon } from '@phosphor-icons/react';

// Tiny proposal-theme switch — CSS vars do the real work via data-theme on <html>.
export default function ThemeToggle() {
  const [proposalTheme, setProposalTheme] = useState(() => {
    const stored = localStorage.getItem('easydev_theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', proposalTheme);
    localStorage.setItem('easydev_theme', proposalTheme);
  }, [proposalTheme]);

  const flipProposalTheme = () => {
    setProposalTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <button
      onClick={flipProposalTheme}
      className="btn-interactive theme-toggle"
      style={{
        padding: '8px 16px',
        borderRadius: '30px',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-primary)',
        fontSize: '13px',
        fontWeight: '700',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        minWidth: '130px',
        boxShadow: 'var(--card-shadow)'
      }}
      aria-label="Toggle color theme"
    >
      {proposalTheme === 'light' ? (
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