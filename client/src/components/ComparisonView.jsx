import React, { useState, useEffect } from 'react';
import { apiFetch } from '../config';

// The 5 stack layers EasyDev scores — kept in this order for the proposal UI.
// DB calls these `category` on tech_items; I use stackLayer locally so it's
// obvious we're talking about the proposal's architecture layers.
const STACK_LAYERS = ['language', 'frontend', 'backend', 'database', 'infrastructure'];

export default function ComparisonView({ projectId, recommendations = [] }) {
  // stackCatalog = full tech_items table; manualStackPicks = user's own stack per layer
  const [stackCatalog, setStackCatalog] = useState([]);
  const [manualStackPicks, setManualStackPicks] = useState({});
  const [loading, setLoading] = useState(true);
  const [compareLoadError, setCompareLoadError] = useState(null);
  const [stackSaveError, setStackSaveError] = useState(null);

  useEffect(() => {
    if (projectId) {
      loadStackCompare();
    }
  }, [projectId]);

  const loadStackCompare = async () => {
    setLoading(true);
    setCompareLoadError(null);
    try {
      const [catalogData, savedStackData] = await Promise.all([
        apiFetch('/tech-items'),
        apiFetch(`/projects/${projectId}/user-stack`)
      ]);

      setStackCatalog(catalogData || []);

      const mappedPicks = {};
      if (Array.isArray(savedStackData)) {
        savedStackData.forEach(pick => {
          mappedPicks[pick.category] = pick.tech_item_id;
        });
      }
      setManualStackPicks(mappedPicks);
    } catch (err) {
      setCompareLoadError(err.message || 'Couldn\'t load the stack comparison for this proposal.');
    } finally {
      setLoading(false);
    }
  };

  // Manual override per layer — saved immediately so a refresh keeps the
  // junior's own stack next to the recommended one.
  const pickManualStackLayer = async (stackLayer, techItemId) => {
    if (!techItemId) {
      setManualStackPicks(prev => {
        const copy = { ...prev };
        delete copy[stackLayer];
        return copy;
      });
      return;
    }

    const numericId = Number(techItemId);
    setManualStackPicks(prev => ({ ...prev, [stackLayer]: numericId }));
    setStackSaveError(null);

    try {
      await apiFetch(`/projects/${projectId}/user-stack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // wire keys stay category/tech_item_id — backend + DB contract
        body: JSON.stringify({ category: stackLayer, tech_item_id: numericId })
      });
    } catch (err) {
      setStackSaveError(err.message || 'Couldn\'t save that stack override — it may not stick around.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>
        Loading architectural trade-off analyzer...
      </div>
    );
  }

  if (compareLoadError) {
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
          {compareLoadError}
        </span>
        <button
          type="button"
          onClick={loadStackCompare}
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
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
          Architectural Trade-Off Analysis
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
          Evaluate technical pros, cons, and tradeoffs when selecting alternative stack choices.
        </p>
        {stackSaveError && (
          <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-cons)', margin: '8px 0 0 0' }}>
            {stackSaveError}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
        {STACK_LAYERS.map(stackLayer => {
          const recPick = recommendations.find(r => r.category === stackLayer);
          const layerCatalog = stackCatalog.filter(t => t.category === stackLayer);
          const customChoiceId = manualStackPicks[stackLayer] || (recPick ? recPick.tech_item_id : '');
          const customItem = stackCatalog.find(t => Number(t.id) === Number(customChoiceId));
          const isMatch = recPick && Number(customChoiceId) === Number(recPick.tech_item_id);

          return (
            <div
              key={stackLayer}
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
                  {stackLayer} Layer
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

              <div className="comparison-columns">
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
                      {recPick ? recPick.name : 'N/A (Skipped)'}
                    </div>
                    {recPick && (
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                        {recPick.reasoning_text}
                      </p>
                    )}
                  </div>

                  {recPick && recPick.trade_offs && (
                    <div style={{ fontSize: '11px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: 'var(--color-pros)' }}>Pros:</strong> {recPick.trade_offs.pros?.join(', ')}
                      </div>
                      <div>
                        <strong style={{ color: 'var(--color-cons)' }}>Cons:</strong> {recPick.trade_offs.cons?.join(', ')}
                      </div>
                    </div>
                  )}
                </div>

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
                      onChange={e => pickManualStackLayer(stackLayer, e.target.value)}
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
                      {layerCatalog.map(t => (
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
                        <strong style={{ color: 'var(--color-pros)' }}>Pros:</strong> {customItem.trade_offs.pros?.join(', ')}
                      </div>
                      <div>
                        <strong style={{ color: 'var(--color-cons)' }}>Cons:</strong> {customItem.trade_offs.cons?.join(', ')}
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