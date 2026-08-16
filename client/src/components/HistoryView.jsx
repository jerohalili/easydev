import React, { useEffect, useState } from 'react';
import { apiFetch } from '../config';

const CATEGORY_STYLES = {
  language: { bg: 'var(--badge-lang-bg)', text: 'var(--badge-lang-text)', border: 'var(--badge-lang-border)' },
  frontend: { bg: 'var(--badge-front-bg)', text: 'var(--badge-front-text)', border: 'var(--badge-front-border)' },
  backend: { bg: 'var(--badge-back-bg)', text: 'var(--badge-back-text)', border: 'var(--badge-back-border)' },
  database: { bg: 'var(--badge-db-bg)', text: 'var(--badge-db-text)', border: 'var(--badge-db-border)' },
  infrastructure: { bg: 'var(--badge-infra-bg)', text: 'var(--badge-infra-text)', border: 'var(--badge-infra-border)' }
};

export default function HistoryView({ onSelectProject, onStartNew }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/projects');
      setProjects(data);
    } catch (err) {
      setError(err.message || 'Failed to load your project history.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this proposal from history?')) return;
    try {
      await apiFetch(`/projects/${id}`, { method: 'DELETE' });
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete project. Please try again.');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontWeight: '600' }}>Loading proposal history...</div>;
  }

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>Proposal History</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Review past assessments and their recommended tech stack outputs
          </p>
        </div>
        <button
          onClick={onStartNew}
          className="btn-interactive"
          style={{
            padding: '10px 18px',
            backgroundColor: 'var(--primary-accent)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          + New Assessment
        </button>
      </div>

      {error && (
        <div style={{ padding: '14px 18px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#dc2626', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span>{error}</span>
          <button
            onClick={fetchHistory}
            className="btn-interactive"
            style={{ padding: '6px 14px', backgroundColor: 'transparent', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      )}

      {!error && projects.length === 0 && (
        <div style={{ background: 'var(--bg-card)', padding: '40px', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center', boxShadow: 'var(--card-shadow)' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>No previous project proposals found.</p>
          <button
            onClick={onStartNew}
            className="btn-interactive"
            style={{ padding: '10px 18px', backgroundColor: 'var(--primary-accent)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
          >
            Create Your First Proposal
          </button>
        </div>
      )}

      {!error && projects.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => onSelectProject(proj.id)}
              className="option-card"
              style={{
                background: 'var(--bg-card)',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--card-shadow)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>{proj.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>
                    {new Date(proj.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, proj.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', padding: '4px' }}
                    title="Delete project"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {proj.description && (
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                  {proj.description}
                </p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                {proj.recommendations && proj.recommendations.map((rec) => {
                  const styleBadge = CATEGORY_STYLES[rec.category] || { bg: 'var(--bg-input)', text: 'var(--text-primary)', border: 'var(--border-color)' };
                  return (
                    <span
                      key={rec.name}
                      style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: styleBadge.bg,
                        color: styleBadge.text,
                        border: `1px solid ${styleBadge.border}`
                      }}
                    >
                      {rec.name}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}