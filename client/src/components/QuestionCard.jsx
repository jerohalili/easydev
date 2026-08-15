import React from 'react';

export default function QuestionCard({ question, options, onSelectOption, loading }) {
  return (
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
      <h2
        style={{
          fontSize: '20px',
          fontWeight: '800',
          marginBottom: '24px',
          color: 'var(--text-primary)',
          lineHeight: '1.4'
        }}
      >
        {question.prompt_text}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelectOption(opt.id)}
            disabled={loading}
            className="btn-interactive"
            style={{
              width: '100%',
              padding: '16px 20px',
              textAlign: 'left',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              gap: '16px',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ flex: 1, lineHeight: '1.4' }}>{opt.label}</span>

            {/* Selection Dot aligned to the far right */}
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: '2px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-accent)',
                  opacity: 0,
                  transition: 'opacity 0.2s ease'
                }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}