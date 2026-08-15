// client/src/components/QuestionCard.jsx
import React, { useState } from 'react';

export default function QuestionCard({ question, options, onSelectOption, loading }) {
  const [selectedOptionId, setSelectedOptionId] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedOptionId && !loading) {
      onSelectOption(selectedOptionId);
      setSelectedOptionId(null);
    }
  };

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
      <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>
        {question.prompt_text}
      </h2>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
        Select the option that best matches your project scope. If you are unsure, pick "I don't know".
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
          {options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            const isDontKnow = opt.label.toLowerCase().includes('don\'t know') || opt.label.toLowerCase().includes('not sure');

            return (
              <button
                key={opt.id}
                type="button"
                className="option-card"
                onClick={() => setSelectedOptionId(opt.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  textAlign: 'left',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: isSelected ? 'var(--primary-accent)' : 'transparent',
                  backgroundColor: isSelected ? 'var(--accent-glow)' : 'var(--bg-card)',
                  color: isSelected ? 'var(--text-primary)' : (isDontKnow ? 'var(--text-muted)' : 'var(--text-secondary)'),
                  fontWeight: isSelected ? '700' : '500',
                  fontStyle: isDontKnow ? 'italic' : 'normal',
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                <div>
                  <div style={{ fontWeight: '700' }}>{opt.label}</div>
                </div>
                <span
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: isSelected ? 'var(--primary-accent)' : 'var(--border-color)',
                    backgroundColor: isSelected ? 'var(--primary-accent)' : 'transparent',
                    display: 'inline-block',
                    flexShrink: 0,
                    marginLeft: '12px',
                    transition: 'all 0.15s ease'
                  }}
                />
              </button>
            );
          })}
        </div>

        <button
          type="submit"
          className="btn-interactive"
          disabled={!selectedOptionId || loading}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: selectedOptionId && !loading ? 'var(--primary-accent)' : 'var(--bg-input)',
            color: selectedOptionId && !loading ? '#ffffff' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '16px',
            cursor: selectedOptionId && !loading ? 'pointer' : 'not-allowed',
            boxShadow: selectedOptionId && !loading ? '0 4px 14px var(--accent-glow)' : 'none'
          }}
        >
          {loading ? 'Processing Choice...' : 'Continue →'}
        </button>
      </form>
    </div>
  );
}