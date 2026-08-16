import React, { useState, useEffect } from 'react';
import { API_BASE, apiFetch } from '../config';

const CATEGORIES = ['language', 'frontend', 'backend', 'database', 'infrastructure'];

export default function ComparisonView({ projectId, recommendations, apiBase = API_BASE }) {
  const [techItems, setTechItems] = useState([]);
  const [userSelections, setUserSelections] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    loadComparisonData();
  }, [projectId]);

  const loadComparisonData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [techData, userStackData] = await Promise.all([
        apiFetch('/tech-items', undefined, apiBase),
        apiFetch(`/projects/${projectId}/user-stack`, undefined, apiBase)
      ]);

      setTechItems(techData);

      const mappedSelections = {};
      userStackData.forEach(item => {
        mappedSelections[item.category] = item.tech_item_id;
      });
      setUserSelections(mappedSelections);
    } catch (err) {
      setLoadError(err.message || 'Failed to load the comparison data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTech = async (category, techItemId) => {
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
      <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
        Loading architectural trade-off analyzer...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="animate-fade" style={{ marginTop: '36px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ color: '#dc2626', fontSize: '14px', fontWeight: '600' }}>{loadError}</span>
        <button
          onClick={loadComparisonData}
          className="btn-interactive"
          style={{ padding: '6px 14px', backgroundColor: 'transparent', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ marginTop: '36px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
          Architectural Trade-Off Analysis
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Evaluate technical pros, cons, and tradeoffs when selecting alternative stack choices.
        </p>
        {saveError && (
          <p style={{ fontSize: '13px', color: '#dc2626', fontWeight: '600', marginTop: '10px' }}>
            {saveError}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card)',
                padding: '20px',
                boxShadow: 'var(--card-shadow)'
              }}
            >
              {/* Card Header with Status Badge aligned strictly to the right */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '12px'
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    color: 'var(--primary-accent)',
                    letterSpacing: '0.08em'
                  }}
                >
                  {category} Layer
                </span>

                {customChoiceId && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      backgroundColor: isMatch ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      color: isMatch ? '#10b981' : '#f59e0b',
                      border: `1px solid ${isMatch ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                    }}
                  >
                    {isMatch ? '✓ Matching Recommendation' : '⚡ Custom Override Active'}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Recommended Tech Card */}
                <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    EASYDEV RECOMMENDED
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    {recItem ? recItem.name : 'N/A (Skipped)'}
                  </div>
                  {recItem && (
                    <>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                        {recItem.reasoning_text}
                      </p>
                      {recItem.trade_offs && (
                        <div style={{ fontSize: '11px', color: 'var(--text-primary)' }}>
                          <strong style={{ color: '#10b981' }}>Pros:</strong> {recItem.trade_offs.pros?.join(', ')}<br />
                          <strong style={{ color: '#ef4444' }}>Cons:</strong> {recItem.trade_offs.cons?.join(', ')}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Custom Tech Choice Card */}
                <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    YOUR CUSTOM SELECTION
                  </div>
                  <select
                    value={customChoiceId}
                    onChange={e => handleSelectTech(category, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontWeight: '700',
                      fontSize: '14px',
                      marginBottom: '10px'
                    }}
                  >
                    <option value="">-- Select custom alternative --</option>
                    {catTechs.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>

                  {customItem && (
                    <>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                        {customItem.description}
                      </p>
                      {customItem.trade_offs && (
                        <div style={{ fontSize: '11px', color: 'var(--text-primary)' }}>
                          <strong style={{ color: '#10b981' }}>Pros:</strong> {customItem.trade_offs.pros?.join(', ')}<br />
                          <strong style={{ color: '#ef4444' }}>Cons:</strong> {customItem.trade_offs.cons?.join(', ')}
                        </div>
                      )}
                    </>
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