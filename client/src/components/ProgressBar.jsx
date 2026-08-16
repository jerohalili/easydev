import React from 'react';

export default function ProgressBar({ stepCount, totalSteps = 9 }) {
  const progressPercent = Math.min(Math.round((stepCount / totalSteps) * 100), 100);

  return (
    <div style={{ marginBottom: '24px', width: '100%', boxSizing: 'border-box' }} className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Questionnaire Progress
        </span>
        <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary-accent)', background: 'var(--accent-glow)', padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
          Step {stepCount} of {totalSteps} ({progressPercent}%)
        </span>
      </div>
      <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}>
        <div
          style={{
            height: '100%',
            width: `${progressPercent}%`,
            backgroundColor: 'var(--primary-accent)',
            borderRadius: '999px',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 0 12px var(--primary-accent)'
          }}
        />
      </div>
    </div>
  );
}