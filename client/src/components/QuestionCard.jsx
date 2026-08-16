import React, { useState, useEffect } from 'react';

export default function QuestionCard({ question, options, onSubmitAnswers, loading }) {
  const [selectedIds, setSelectedIds] = useState([]);

  // Reset selected options whenever a new question loads
  useEffect(() => {
    setSelectedIds([]);
  }, [question.id]);

  const handleSelectOption = (id) => {
    if (question.is_multiselect) {
      // Toggle for multi-select
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
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
      className="animate-fade p-6 sm:p-9 rounded-2xl sm:rounded-[20px] border transition-all"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--card-shadow)'
      }}
    >
      <h2
        className="text-lg sm:text-xl font-extrabold mb-2 leading-snug"
        style={{ color: 'var(--text-primary)' }}
      >
        {question.prompt_text}
      </h2>

      <p className="text-xs sm:text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
        {question.is_multiselect
          ? 'Select all choices that apply to your project.'
          : 'Select one option to continue.'}
      </p>

      <div className="flex flex-col gap-3 mb-6">
        {options.map((opt) => {
          const isSelected = selectedIds.includes(opt.id);

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelectOption(opt.id)}
              disabled={loading}
              className="btn-interactive w-full p-4 sm:p-5 text-left rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold flex items-center justify-between gap-4 transition-all"
              style={{
                backgroundColor: isSelected ? 'var(--accent-glow)' : 'var(--bg-main)',
                color: 'var(--text-primary)',
                borderColor: isSelected ? 'var(--primary-accent)' : 'var(--border-color)',
                borderWidth: '1px',
                borderStyle: 'solid',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              <span className="flex-1 leading-snug">{opt.label}</span>

              {/* Selection indicator strictly on the far right */}
              <div
                className="w-[18px] h-[18px] flex items-center justify-center shrink-0 transition-all"
                style={{
                  borderRadius: question.is_multiselect ? '4px' : '50%',
                  border: `2px solid ${isSelected ? 'var(--primary-accent)' : 'var(--border-color)'}`,
                  backgroundColor: isSelected && question.is_multiselect ? 'var(--primary-accent)' : 'transparent'
                }}
              >
                {question.is_multiselect ? (
                  isSelected && <span className="text-white text-[11px] font-bold">✓</span>
                ) : (
                  <div
                    className="w-2 h-2 rounded-full transition-opacity duration-200"
                    style={{
                      backgroundColor: 'var(--primary-accent)',
                      opacity: isSelected ? 1 : 0
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
        className="btn-interactive w-full p-3.5 sm:p-4 rounded-xl font-bold text-sm sm:text-base transition-all"
        style={{
          backgroundColor: selectedIds.length > 0 && !loading ? 'var(--primary-accent)' : 'var(--bg-input)',
          color: selectedIds.length > 0 && !loading ? '#ffffff' : 'var(--text-muted)',
          border: 'none',
          cursor: selectedIds.length > 0 && !loading ? 'pointer' : 'not-allowed',
          boxShadow: selectedIds.length > 0 && !loading ? '0 4px 14px var(--accent-glow)' : 'none'
        }}
      >
        {loading ? 'Processing...' : 'Continue →'}
      </button>
    </div>
  );
}