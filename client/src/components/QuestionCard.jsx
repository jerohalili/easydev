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
    <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: '#111827' }}>
        {question.prompt_text}
      </h2>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedOptionId(opt.id)}
                style={{
                  textAlign: 'left',
                  padding: '14px 18px',
                  borderRadius: '8px',
                  border: isSelected ? '2px solid #2563eb' : '1px solid #d1d5db',
                  backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                  color: isSelected ? '#1d4ed8' : '#374151',
                  fontWeight: isSelected ? '600' : '400',
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={!selectedOptionId || loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: selectedOptionId && !loading ? '#2563eb' : '#9ca3af',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '16px',
            cursor: selectedOptionId && !loading ? 'pointer' : 'not-allowed'
          }}
        >
          {loading ? 'Submitting...' : 'Next Question →'}
        </button>
      </form>
    </div>
  );
}