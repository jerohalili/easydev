import React from 'react';
import ComparisonView from './ComparisonView';

const CATEGORY_STYLES = {
  language: { bg: 'var(--badge-lang-bg)', text: 'var(--badge-lang-text)', border: 'var(--badge-lang-border)' },
  frontend: { bg: 'var(--badge-front-bg)', text: 'var(--badge-front-text)', border: 'var(--badge-front-border)' },
  backend: { bg: 'var(--badge-back-bg)', text: 'var(--badge-back-text)', border: 'var(--badge-back-border)' },
  database: { bg: 'var(--badge-db-bg)', text: 'var(--badge-db-text)', border: 'var(--badge-db-border)' },
  infrastructure: { bg: 'var(--badge-infra-bg)', text: 'var(--badge-infra-text)', border: 'var(--badge-infra-border)' }
};

export default function ResultsView({ projectId, results, onRestart }) {
  return (
    <>
      <div
        className="animate-fade"
        style={{
          background: 'var(--bg-card)',
          padding: '36px',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
            Recommended Architecture Stack
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Tailored tech stack generated from your constraint questionnaire choices.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          {results.map((item) => {
            const styleBadge = CATEGORY_STYLES[item.category] || { bg: 'var(--accent-glow)', text: 'var(--primary-accent)', border: 'var(--border-color)' };

            return (
              <div
                key={item.tech_item_id || item.name}
                style={{
                  border: '1px solid var(--border-color)',
                  padding: '20px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--bg-main)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {item.name}
                  </span>
                  <span
                    style={{
                      textTransform: 'uppercase',
                      fontSize: '11px',
                      fontWeight: '800',
                      letterSpacing: '0.08em',
                      padding: '4px 10px',
                      borderRadius: '8px',
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
          className="btn-interactive"
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: 'var(--primary-accent)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px var(--accent-glow)'
          }}
        >
          Start New Assessment
        </button>
      </div>

      <ComparisonView projectId={projectId} recommendations={results} />
    </>
  );
}