import React from 'react';

export default function ProgressBar({ stepCount }) {
  // Approximate progress percentage across 9 questions
  const progressPercent = Math.min(Math.round((stepCount / 9) * 100), 100);

  return (
    <div style={{ marginBottom: '28px' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Questionnaire Progress
        </span>
        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-primary)', background: 'var(--accent-glow)', padding: '2px 8px', borderRadius: '12px' }}>
          Step {stepCount} of ~9 ({progressPercent}%)
        </span>
      </div>
      <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--bg-card)', borderRadius: '999px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        <div
          style={{
            height: '100%',
            width: `${progressPercent}%`,
            backgroundColor: 'var(--accent-primary)',
            borderRadius: '999px',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)'
          }}
        />
      </div>
    </div>
  );
}