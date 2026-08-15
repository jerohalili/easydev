import React from 'react';

export default function ResultsView({ results, isStub, onRestart }) {
  return (
    <div style={{ background: '#ffffff', padding: '28px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827' }}>Recommended Tech Stack</h2>
        {isStub && (
          <span style={{ fontSize: '12px', background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>
            Scoring Stub
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
        {results.map((item) => (
          <div key={item.tech_item_id || item.name} style={{ border: '1px solid #e5e7eb', padding: '16px', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>{item.name}</span>
              <span style={{ textTransform: 'uppercase', fontSize: '12px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>
                {item.category}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: '#4b5563', lineHeight: '1.5' }}>
              {item.reasoning_text}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={onRestart}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#111827',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        Start New Project
      </button>
    </div>
  );
}