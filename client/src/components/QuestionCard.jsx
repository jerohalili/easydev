import React, { useState, useEffect } from 'react';

export default function QuestionCard({ question, options, onSubmitAnswers, loading, initialSelectedIds }) {
  const [selectedIds, setSelectedIds] = useState(initialSelectedIds || []);

  // Reset selected options whenever a new question loads — but if the app
  // is showing a question the user already answered (navigating Back, or
  // jumping in from the review screen to edit an earlier answer),
  // pre-select whatever they picked last time instead of starting blank.
  useEffect(() => {
    setSelectedIds(initialSelectedIds || []);
  }, [question.id, initialSelectedIds]);

  const handleSelectOption = (id) => {
    if (question.is_multiselect) {
      const clickedOption = options.find((opt) => opt.id === id);
      const isUnsure = Boolean(clickedOption?.is_unsure);

      setSelectedIds((prev) => {
        // "I don't know" doesn't make sense combined with a real answer —
        // picking it clears everything else, and picking a real answer
        // clears "I don't know" if it was selected. Keeps multi-select
        // combinations logically consistent instead of letting the two
        // contradict each other silently.
        if (isUnsure) {
          return prev.includes(id) ? [] : [id];
        }
        const withoutUnsure = prev.filter((item) => !options.find((opt) => opt.id === item)?.is_unsure);
        return withoutUnsure.includes(id)
          ? withoutUnsure.filter((item) => item !== id)
          : [...withoutUnsure, id];
      });
    } else {
      // Single selection
      setSelectedIds([id]);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (selectedIds.length > 0 && !loading) {
      onSubmitAnswers(selectedIds);
    }
  };

  return (
    <div
      className="animate-fade"
      style={{
        backgroundColor: 'var(--bg-card)',
        padding: '32px 24px',
        borderRadius: '20px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--card-shadow)',
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <h2
        style={{
          fontSize: '20px',
          fontWeight: '800',
          color: 'var(--text-primary)',
          lineHeight: '1.4',
          margin: '0 0 8px 0'
        }}
      >
        {question.prompt_text}
      </h2>

      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px 0', lineHeight: '1.5' }}>
        {question.is_multiselect
          ? 'Select all choices that apply to your project.'
          : 'Select one option to continue.'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', width: '100%' }}>
        {options.map((opt) => {
          const isSelected = selectedIds.includes(opt.id);

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelectOption(opt.id)}
              disabled={loading}
              className="btn-interactive option-card"
              style={{
                width: '100%',
                padding: '14px 18px',
                textAlign: 'left',
                backgroundColor: isSelected ? 'var(--accent-glow)' : 'var(--bg-main)',
                color: 'var(--text-primary)',
                border: `1px solid ${isSelected ? 'var(--primary-accent)' : 'var(--border-color)'}`,
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                minHeight: '48px'
              }}
            >
              <span style={{ flex: 1, lineHeight: '1.4', wordBreak: 'break-word' }}>{opt.label}</span>

              {/* Selection indicator strictly on the far right */}
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: question.is_multiselect ? '4px' : '50%',
                  border: `2px solid ${isSelected ? 'var(--primary-accent)' : 'var(--border-color)'}`,
                  backgroundColor: isSelected && question.is_multiselect ? 'var(--primary-accent)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {question.is_multiselect ? (
                  isSelected && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>✓</span>
                ) : (
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-accent)',
                      opacity: isSelected ? 1 : 0,
                      transition: 'opacity 0.2s ease'
                    }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Submit / Continue Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={selectedIds.length === 0 || loading}
        className="btn-interactive"
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: selectedIds.length > 0 && !loading ? 'var(--primary-accent)' : 'var(--bg-input)',
          color: selectedIds.length > 0 && !loading ? '#ffffff' : 'var(--text-muted)',
          border: 'none',
          borderRadius: '12px',
          fontWeight: '700',
          fontSize: '15px',
          cursor: selectedIds.length > 0 && !loading ? 'pointer' : 'not-allowed',
          boxShadow: selectedIds.length > 0 && !loading ? '0 4px 14px var(--accent-glow)' : 'none',
          boxSizing: 'border-box'
        }}
      >
        {loading ? 'Processing...' : 'Continue →'}
      </button>
    </div>
  );
}