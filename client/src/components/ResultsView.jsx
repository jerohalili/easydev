import React from 'react';

const CATEGORY_COLORS = {
  language: { bg: 'rgba(239, 68, 68, 0.1)', text: '#f87171', border: 'rgba(239, 68, 68, 0.2)' },
  frontend: { bg: 'rgba(59, 130, 246, 0.1)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.2)' },
  backend: { bg: 'rgba(16, 185, 129, 0.1)', text: '#34d399', border: 'rgba(16, 185, 129, 0.2)' },
  database: { bg: 'rgba(245, 158, 11, 0.1)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.2)' },
  infrastructure: { bg: 'rgba(168, 85, 247, 0.1)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.2)' }
};

export default function ResultsView({ results, isStub, onRestart }) {
  return (
    <div
      className="animate-fade-in"
      style={{
        background: 'var(--bg-card)',
        padding: '32px',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
            Recommended Tech Stack
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Tailored recommendations based on your project goals and constraints.
          </p>
        </div>
        {isStub && (
          <span style={{ fontSize: '12px', background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>
            Scoring Stub
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
        {results.map((item) => {
          const styleBadge = CATEGORY_COLORS[item.category] || { bg: 'var(--accent-glow)', text: 'var(--accent-primary)', border: 'transparent' };

          return (
            <div
              key={item.tech_item_id || item.name}
              style={{
                border: '1px solid var(--border-color)',
                padding: '20px',
                borderRadius: '12px',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {item.name}
                </span>
                <span
                  style={{
                    textTransform: 'uppercase',
                    fontSize: '11px',
                    fontWeight: '800',
                    letterSpacing: '0.08em',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: styleBadge.bg,
                    color: styleBadge.text,
                    border: `1px solid ${styleBadge.border}`
                  }}
                >
                  {item.category}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {item.reasoning_text}
              </p>
            </div>
          );
        })}
      </div>

      <button
        onClick={onRestart}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: 'var(--accent-primary)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '10px',
          fontWeight: '600',
          fontSize: '16px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px var(--accent-glow)',
          transition: 'all 0.2s ease'
        }}
      >
        Start New Project
      </button>
    </div>
  );
}