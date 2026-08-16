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
      <div 
        className="py-12 text-center text-xs sm:text-sm font-semibold tracking-wide" 
        style={{ color: 'var(--text-muted)' }}
      >
        Loading architectural trade-off analyzer...
      </div>
    );
  }

  if (loadError) {
    return (
      <div 
        className="animate-fade mt-8 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 border"
        style={{ 
          backgroundColor: 'var(--accent-glow)', 
          borderColor: 'var(--primary-accent)' 
        }}
      >
        <span className="text-xs sm:text-sm font-bold" style={{ color: 'var(--primary-accent)' }}>
          {loadError}
        </span>
        <button
          onClick={loadComparisonData}
          className="btn-interactive px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all shrink-0"
          style={{ 
            backgroundColor: 'transparent', 
            color: 'var(--primary-accent)', 
            border: '1px solid var(--primary-accent)' 
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade mt-8 sm:mt-10">
      {/* Header Info */}
      <div className="mb-6">
        <h3 className="text-lg sm:text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
          Architectural Trade-Off Analysis
        </h3>
        <p className="text-xs sm:text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Evaluate technical pros, cons, and tradeoffs when selecting alternative stack choices.
        </p>
        {saveError && (
          <p className="text-xs sm:text-sm font-bold mt-2" style={{ color: '#dc2626' }}>
            {saveError}
          </p>
        )}
      </div>

      {/* Category Layer Cards */}
      <div className="flex flex-col gap-6">
        {CATEGORIES.map(category => {
          const recItem = recommendations.find(r => r.category === category);
          const catTechs = techItems.filter(t => t.category === category);
          const customChoiceId = userSelections[category] || (recItem ? recItem.tech_item_id : '');
          const customItem = techItems.find(t => Number(t.id) === Number(customChoiceId));
          const isMatch = recItem && Number(customChoiceId) === Number(recItem.tech_item_id);

          return (
            <div
              key={category}
              className="p-5 sm:p-6 rounded-2xl border transition-all"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                boxShadow: 'var(--card-shadow)'
              }}
            >
              {/* Card Header with Status Badge */}
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <span
                  className="text-xs font-extrabold uppercase tracking-widest"
                  style={{ color: 'var(--primary-accent)' }}
                >
                  {category} Layer
                </span>

                {customChoiceId && (
                  <span
                    className="self-start sm:self-auto text-[11px] font-bold px-2.5 py-1 rounded-lg border"
                    style={{
                      backgroundColor: isMatch ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      color: isMatch ? '#10b981' : '#f59e0b',
                      borderColor: isMatch ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'
                    }}
                  >
                    {isMatch ? '✓ Matching Recommendation' : '⚡ Custom Override Active'}
                  </span>
                )}
              </div>

              {/* Side-by-Side Comparison Grid (Responsive: 1 col on mobile, 2 cols on md+) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                
                {/* EasyDev Recommended Tech Card */}
                <div 
                  className="p-4 rounded-xl border flex flex-col justify-between"
                  style={{ 
                    backgroundColor: 'var(--bg-main)', 
                    borderColor: 'var(--border-color)' 
                  }}
                >
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                      EasyDev Recommended
                    </div>
                    <div className="text-base font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                      {recItem ? recItem.name : 'N/A (Skipped)'}
                    </div>
                    {recItem && (
                      <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                        {recItem.reasoning_text}
                      </p>
                    )}
                  </div>

                  {recItem && recItem.trade_offs && (
                    <div className="text-[11px] pt-2 border-t" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                      <strong style={{ color: '#10b981' }}>Pros:</strong> {recItem.trade_offs.pros?.join(', ')}<br />
                      <strong style={{ color: '#ef4444' }}>Cons:</strong> {recItem.trade_offs.cons?.join(', ')}
                    </div>
                  )}
                </div>

                {/* Custom Tech Selection Card */}
                <div 
                  className="p-4 rounded-xl border flex flex-col justify-between"
                  style={{ 
                    backgroundColor: 'var(--bg-main)', 
                    borderColor: 'var(--border-color)' 
                  }}
                >
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                      Your Custom Selection
                    </div>
                    
                    <select
                      value={customChoiceId}
                      onChange={e => handleSelectTech(category, e.target.value)}
                      className="w-full p-2.5 rounded-lg font-bold text-xs sm:text-sm mb-3 border cursor-pointer focus:outline-none transition-all"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)'
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
                      <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                        {customItem.description}
                      </p>
                    )}
                  </div>

                  {customItem && customItem.trade_offs && (
                    <div className="text-[11px] pt-2 border-t" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                      <strong style={{ color: '#10b981' }}>Pros:</strong> {customItem.trade_offs.pros?.join(', ')}<br />
                      <strong style={{ color: '#ef4444' }}>Cons:</strong> {customItem.trade_offs.cons?.join(', ')}
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