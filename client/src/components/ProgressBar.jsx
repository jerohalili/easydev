import React from 'react';

export default function ProgressBar({ stepCount, totalSteps = 9 }) {
  const progressPercent = Math.min(Math.round((stepCount / totalSteps) * 100), 100);

  return (
    <div className="animate-fade mb-6 sm:mb-8">
      {/* Label and Percentage Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
        <span 
          className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider" 
          style={{ color: 'var(--text-muted)' }}
        >
          Questionnaire Progress
        </span>
        <span 
          className="self-start sm:self-auto text-[11px] sm:text-xs font-extrabold px-2.5 py-1 rounded-full border transition-all"
          style={{ 
            color: 'var(--primary-accent)', 
            backgroundColor: 'var(--accent-glow)',
            borderColor: 'var(--border-color)'
          }}
        >
          Step {stepCount} of ~{totalSteps} ({progressPercent}%)
        </span>
      </div>

      {/* Progress Track */}
      <div 
        className="h-2.5 w-full rounded-full overflow-hidden border transition-all"
        style={{ 
          backgroundColor: 'var(--bg-input)', 
          borderColor: 'var(--border-color)' 
        }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: 'var(--primary-accent)',
            boxShadow: '0 0 12px var(--primary-accent)'
          }}
        />
      </div>
    </div>
  );
}