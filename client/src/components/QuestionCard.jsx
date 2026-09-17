import React, { useState, useEffect } from 'react';

// One questionnaire step in the stack proposal flow. Props stay generic
// (question/options) because they mirror the DB rows directly.
export default function QuestionCard({ question, options, onSubmitAnswers, loading, initialSelectedIds }) {
  const [proposalPickedIds, setProposalPickedIds] = useState(initialSelectedIds || []);

  // New step -> reset; Back/edit jump -> restore last picks for that step.
  // Junior devs second-guess a lot, blanking their answer on Back felt broken.
  useEffect(() => {
    setProposalPickedIds(initialSelectedIds || []);
  }, [question.id, initialSelectedIds]);

  const toggleProposalOption = (id) => {
    if (question.is_multiselect) {
      const clickedOption = options.find((opt) => opt.id === id);
      const isUnsure = Boolean(clickedOption?.is_unsure);

      setProposalPickedIds((prev) => {
        // "I don't know" + a real answer together would zero-out + boost at
        // the same time in scoring — picking one clears the other.
        if (isUnsure) {
          return prev.includes(id) ? [] : [id];
        }
        const withoutUnsure = prev.filter((item) => !options.find((opt) => opt.id === item)?.is_unsure);
        return withoutUnsure.includes(id)
          ? withoutUnsure.filter((item) => item !== id)
          : [...withoutUnsure, id];
      });
    } else {
      setProposalPickedIds([id]);
    }
  };

  const submitProposalStep = (e) => {
    if (e) e.preventDefault();
    if (proposalPickedIds.length > 0 && !loading) {
      onSubmitAnswers(proposalPickedIds);
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
          const isSelected = proposalPickedIds.includes(opt.id);

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleProposalOption(opt.id)}
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

      <button
        type="button"
        onClick={submitProposalStep}
        disabled={proposalPickedIds.length === 0 || loading}
        className="btn-interactive"
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: proposalPickedIds.length > 0 && !loading ? 'var(--primary-accent)' : 'var(--bg-input)',
          color: proposalPickedIds.length > 0 && !loading ? '#ffffff' : 'var(--text-muted)',
          border: proposalPickedIds.length > 0 && !loading ? 'none' : '1px solid var(--border-color)',
          borderRadius: '12px',
          fontWeight: '700',
          fontSize: '15px',
          cursor: proposalPickedIds.length > 0 && !loading ? 'pointer' : 'not-allowed',
          boxShadow: proposalPickedIds.length > 0 && !loading ? '0 4px 14px var(--accent-glow)' : 'none',
          boxSizing: 'border-box'
        }}
      >
        {loading ? 'Saving proposal answer...' : 'Continue →'}
      </button>
    </div>
  );
}