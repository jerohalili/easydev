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
    <div style={{ width: '100%', boxSizing: 'border-box' }} className="animate-fade">
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          padding: '32px 24px',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--card-shadow)',
          marginBottom: '32px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            Recommended Architecture Stack
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
            Tailored tech stack generated from your constraint questionnaire choices.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px', width: '100%' }}>
          {(!results || results.length === 0) ? (
            <div 
              style={{
                padding: '24px',
                borderRadius: '14px',
                border: '1px dashed var(--border-color)',
                textAlign: 'center',
                backgroundColor: 'var(--bg-main)'
              }}
            >
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                No recommendations were generated for this assessment. This can happen if your answers
                didn't weight strongly enough toward any specific technology in a category — try restarting
                and adjusting your responses.
              </p>
            </div>
          ) : results.map((item) => {
            const styleBadge = CATEGORY_STYLES[item.category] || { 
              bg: 'var(--accent-glow)', 
              text: 'var(--primary-accent)', 
              border: 'var(--border-color)' 
            };

            return (
              <div
                key={item.tech_item_id || item.name}
                style={{
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxSizing: 'border-box',
                  width: '100%'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', wordBreak: 'break-word', flex: 1 }}>
                    {item.name}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: styleBadge.bg,
                      color: styleBadge.text,
                      border: `1px solid ${styleBadge.border}`,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {item.category}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5', wordBreak: 'break-word' }}>
                  {item.reasoning_text}
                </p>
              </div>
            );
          })}
        </div>

        <button
          type="button"
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
            fontSize: '15px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px var(--accent-glow)',
            boxSizing: 'border-box'
          }}
        >
          Start New Assessment
        </button>
      </div>

      <ComparisonView projectId={projectId} recommendations={results || []} />
    </div>
  );
}