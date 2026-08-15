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
      className="animate-fade-in"
      style={{
        background: 'var(--bg-card)',
        padding: '32px',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
      }}
    >
      <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '24px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
        {question.prompt_text}
      </h2>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
          {options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedOptionId(opt.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  textAlign: 'left',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  backgroundColor: isSelected ? 'var(--accent-glow)' : 'rgba(15, 23, 42, 0.5)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: isSelected ? '600' : '400',
                  cursor: 'pointer',
                  fontSize: '15px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{opt.label}</span>
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: isSelected ? '5px solid var(--accent-primary)' : '2px solid var(--text-muted)',
                    backgroundColor: 'transparent',
                    display: 'inline-block',
                    flexShrink: 0,
                    marginLeft: '12px'
                  }}
                />
              </button>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={!selectedOptionId || loading}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: selectedOptionId && !loading ? 'var(--accent-primary)' : 'var(--bg-card-hover)',
            color: selectedOptionId && !loading ? '#ffffff' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '600',
            fontSize: '16px',
            cursor: selectedOptionId && !loading ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            boxShadow: selectedOptionId && !loading ? '0 4px 12px var(--accent-glow)' : 'none'
          }}
        >
          {loading ? 'Processing Answer...' : 'Continue →'}
        </button>
      </form>
    </div>
  );
}