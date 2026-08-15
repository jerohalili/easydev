import React from 'react';

export default function ProgressBar({ stepCount }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#666' }}>
        <span>Question Progress</span>
        <span>Step {stepCount}</span>
      </div>
      <div style={{ height: '8px', width: '100%', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.min(stepCount * 25, 100)}%`,
            backgroundColor: '#2563eb',
            transition: 'width 0.3s ease'
          }}
        />
      </div>
    </div>
  );
}