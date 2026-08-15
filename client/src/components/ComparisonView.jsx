import React, { useState, useEffect } from 'react';

const CATEGORIES = ['language', 'frontend', 'backend', 'database', 'infrastructure'];

export default function ComparisonView({ projectId, recommendations, apiBase = 'http://localhost:5000/api' }) {
  const [techItems, setTechItems] = useState([]);
  const [userSelections, setUserSelections] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingCategory, setSavingCategory] = useState(null);

  useEffect(() => {
    loadComparisonData();
  }, [projectId]);

  const loadComparisonData = async () => {
    try {
      const [techRes, userStackRes] = await Promise.all([
        fetch(`${apiBase}/tech-items`),
        fetch(`${apiBase}/projects/${projectId}/user-stack`)
      ]);

      const techData = await techRes.json();
      const userStackData = await userStackRes.json();

      setTechItems(techData);

      const mappedSelections = {};
      userStackData.forEach(item => {
        mappedSelections[item.category] = item.tech_item_id;
      });
      setUserSelections(mappedSelections);
    } catch (err) {
      console.error('Failed loading comparison data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTech = async (category, techItemId) => {
    const numericId = Number(techItemId);
    setUserSelections(prev => ({ ...prev, [category]: numericId }));
    setSavingCategory(category);

    try {
      await fetch(`${apiBase}/projects/${projectId}/user-stack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, tech_item_id: numericId })
      });
    } catch (err) {
      console.error('Error saving selection:', err);
    } finally {
      setSavingCategory(null);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Loading comparison tool...</div>;
  }

  return (
    <div className="animate-fade" style={{ marginTop: '32px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
          Side-by-Side Stack Comparison
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Compare EasyDev's recommended stack against your custom preferred choices.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {CATEGORIES.map(category => {
          const recItem = recommendations.find(r => r.category === category);
          const catTechs = techItems.filter(t => t.category === category);
          const userChoiceId = userSelections[category] || (recItem ? recItem.tech_item_id : '');
          const isMatch = recItem && Number(userChoiceId) === Number(recItem.tech_item_id);

          return (
            <div
              key={category}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                padding: '16px 20px',
                borderRadius: '14px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-main)'
              }}
            >
              {/* Column 1: EasyDev Recommended Stack */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    {category} (Recommended)
                  </span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {recItem ? recItem.name : 'None (Optional)'}
                </div>
              </div>

              {/* Column 2: User-Customized Stack */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Your Custom Choice
                  </span>
                  {userChoiceId && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: isMatch ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: isMatch ? '#10b981' : '#f59e0b',
                        border: `1px solid ${isMatch ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                      }}
                    >
                      {isMatch ? '✓ Matches Recommendation' : '⚡ Custom Override'}
                    </span>
                  )}
                </div>

                <select
                  value={userChoiceId}
                  onChange={e => handleSelectTech(category, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  <option value="">-- Select custom alternative --</option>
                  {catTechs.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}