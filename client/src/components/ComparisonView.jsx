import React, { useState, useEffect } from 'react';
import { API_BASE, apiFetch } from '../config';

const CATEGORIES = ['language', 'frontend', 'backend', 'database', 'infrastructure'];

export default function ComparisonView({ projectId, recommendations = [], apiBase = API_BASE }) {
  const [techItems, setTechItems] = useState([]);
  const [userSelections, setUserSelections] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (projectId) {
      loadComparisonData();
    }
  }, [projectId]);

  const loadComparisonData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [techData, userStackData] = await Promise.all([
        apiFetch('/tech-items', undefined, apiBase),
        apiFetch(`/projects/${projectId}/user-stack`, undefined, apiBase)
      ]);

      setTechItems(techData || []);

      const mappedSelections = {};
      if (Array.isArray(userStackData)) {
        userStackData.forEach(item => {
          mappedSelections[item.category] = item.tech_item_id;
        });
      }
      setUserSelections(mappedSelections);
    } catch (err) {
      setLoadError(err.message || 'Failed to load the comparison data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTech = async (category, techItemId) => {
    if (!techItemId) {
      setUserSelections(prev => {
        const copy = { ...prev };
        delete copy[category];
        return copy;
      });
      return;
    }

    const numericId = Number(techItemId);
    setUserSelections(prev => ({ ...prev, [category]: numericId }));
    setSaveError(null);

    try {
      await apiFetch(`/projects/${projectId}/user-stack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, tech_item_id: numericId })
      }, apiBase);
    } catch (err) {
      setSaveError(err.message || 'Failed to save your selection — it may not persist.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>
        Loading architectural trade-off analyzer...
      </div>
    );
  }

  if (loadError) {
    return (
      <div 
        style={{
          marginTop: '32px',
          padding: '16px 20px',
          borderRadius: '16px',
          backgroundColor: 'var(--accent-glow)',
          border: '1px solid var(--primary-accent)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxSizing: 'border-box',
          width: '100%'
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary-accent)' }}>
          {loadError}
        </span>
        <button
          type="button"
          onClick={loadComparisonData}
          style={{
            backgroundColor: 'transparent',
            color: 'var(--primary-accent)',
            border: '1px solid var(--primary-accent)',
            padding: '8px 16px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: '800',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '36px', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* Header Info */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
          Architectural Trade-Off Analysis
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
          Evaluate technical pros, cons, and tradeoffs when selecting alternative stack choices.
        </p>
        {saveError && (
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#dc2626', margin: '8px 0 0 0' }}>
            {saveError}
          </p>
        )}
      </div>

      {/* Category Layer Cards Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
        {CATEGORIES.map(category => {
          const recItem = recommendations.find(r => r.category === category);
          const catTechs = techItems.filter(t => t.category === category);
          const customChoiceId = userSelections[category] || (recItem ? recItem.tech_item_id : '');
          const customItem = techItems.find(t => Number(t.id) === Number(customChoiceId));
          const isMatch = recItem && Number(customChoiceId) === Number(recItem.tech_item_id);

          return (
            <div
              key={category}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--card-shadow)',
                padding: '20px 16px',
                boxSizing: 'border-box',
                width: '100%',
                maxWidth: '100%',
                overflow: 'hidden'
              }}
            >
              {/* Card Header with Status Badge */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '10px',
                  paddingBottom: '14px',
                  marginBottom: '18px',
                  borderBottom: '1px solid var(--border-color)',
                  boxSizing: 'border-box'
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--primary-accent)'
                  }}
                >
                  {category} Layer
                </span>

                {customChoiceId && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      backgroundColor: isMatch ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      color: isMatch ? '#10b981' : '#f59e0b',
                      border: `1px solid ${isMatch ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isMatch ? '✓ Matching Recommendation' : '⚡ Custom Override Active'}
                  </span>
                )}
              </div>

              {/* Side-by-Side / Stacked Comparison Columns */}
              <div className="comparison-columns">
                {/* EasyDev Recommended Tech Card */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    boxSizing: 'border-box',
                    width: '100%',
                    wordBreak: 'break-word'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      EasyDev Recommended
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
                      {recItem ? recItem.name : 'N/A (Skipped)'}
                    </div>
                    {recItem && (
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                        {recItem.reasoning_text}
                      </p>
                    )}
                  </div>

                  {recItem && recItem.trade_offs && (
                    <div style={{ fontSize: '11px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#16a34a' }}>Pros:</strong> {recItem.trade_offs.pros?.join(', ')}
                      </div>
                      <div>
                        <strong style={{ color: '#dc2626' }}>Cons:</strong> {recItem.trade_offs.cons?.join(', ')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom Tech Selection Card */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    boxSizing: 'border-box',
                    width: '100%',
                    wordBreak: 'break-word'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Your Custom Selection
                    </div>
                    
                    <select
                      value={customChoiceId}
                      onChange={e => handleSelectTech(category, e.target.value)}
                      style={{
                        width: '100%',
                        maxWidth: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '13px',
                        backgroundColor: 'var(--bg-input)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        marginBottom: '12px',
                        boxSizing: 'border-box'
                      }}
                    >
                      {catTechs.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>

                    {customItem && (
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                        {customItem.description}
                      </p>
                    )}
                  </div>

                  {customItem && customItem.trade_offs && (
                    <div style={{ fontSize: '11px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#16a34a' }}>Pros:</strong> {customItem.trade_offs.pros?.join(', ')}
                      </div>
                      <div>
                        <strong style={{ color: '#dc2626' }}>Cons:</strong> {customItem.trade_offs.cons?.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}