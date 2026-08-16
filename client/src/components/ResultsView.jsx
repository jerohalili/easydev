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
        className="animate-fade p-6 sm:p-9 rounded-2xl sm:rounded-[20px] border transition-all"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div className="mb-6 sm:mb-7">
          <h2 className="text-xl sm:text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            Recommended Architecture Stack
          </h2>
          <p className="text-xs sm:text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Tailored tech stack generated from your constraint questionnaire choices.
          </p>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          {results.length === 0 ? (
            <div 
              className="p-6 rounded-xl border border-dashed text-center"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
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
                className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border flex flex-col gap-2 transition-all"
                style={{
                  backgroundColor: 'var(--bg-main)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-base sm:text-lg font-extrabold" style={{ color: 'var(--text-primary)' }}>
                    {item.name}
                  </span>
                  <span
                    className="self-start sm:self-auto text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border"
                    style={{
                      backgroundColor: styleBadge.bg,
                      color: styleBadge.text,
                      borderColor: styleBadge.border
                    }}
                  >
                    {item.category}
                  </span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {item.reasoning_text}
                </p>
              </div>
            );
          })}
        </div>

        <button
          onClick={onRestart}
          className="btn-interactive w-full p-3.5 sm:p-4 rounded-xl font-bold text-sm sm:text-base text-white transition-all cursor-pointer"
          style={{
            backgroundColor: 'var(--primary-accent)',
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