import React, { useEffect, useState } from 'react';

const CATEGORY_COLORS = {
  language: '#ef4444',
  frontend: '#3b82f6',
  backend: '#10b981',
  database: '#f59e0b',
  infrastructure: '#8b5cf6'
};

export default function HistoryView({ onSelectProject, onStartNew }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this proposal from history?')) return;
    await fetch(`http://localhost:5000/api/projects/${id}`, { method: 'DELETE' });
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading project history...</div>;
  }

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800' }}>Project Proposals History</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Review past assessments and their recommended tech stack outputs
          </p>
        </div>
        <button
          onClick={onStartNew}
          style={{
            padding: '10px 18px',
            backgroundColor: 'var(--primary-accent)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          + New Assessment
        </button>
      </div>

      {projects.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', padding: '40px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>No previous project proposals found.</p>
          <button
            onClick={onStartNew}
            style={{ padding: '10px 18px', backgroundColor: 'var(--primary-accent)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
          >
            Create Your First Proposal
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => onSelectProject(proj.id)}
              style={{
                background: 'var(--bg-card)',
                padding: '20px 24px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--card-shadow)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>{proj.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(proj.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, proj.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}
                    title="Delete project"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {proj.description && (
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  {proj.description}
                </p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                {proj.recommendations && proj.recommendations.map((rec) => (
                  <span
                    key={rec.name}
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-input)',
                      color: CATEGORY_COLORS[rec.category] || 'var(--text-primary)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {rec.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}