import React, { useEffect, useState } from 'react';
import { apiFetch } from '../config';

const CATEGORY_STYLES = {
  language: { bg: 'var(--badge-lang-bg, rgba(239, 68, 68, 0.1))', text: 'var(--badge-lang-text, #ef4444)', border: 'var(--badge-lang-border, rgba(239, 68, 68, 0.3))' },
  frontend: { bg: 'var(--badge-front-bg, rgba(59, 130, 246, 0.1))', text: 'var(--badge-front-text, #3b82f6)', border: 'var(--badge-front-border, rgba(59, 130, 246, 0.3))' },
  backend: { bg: 'var(--badge-back-bg, rgba(16, 185, 129, 0.1))', text: 'var(--badge-back-text, #10b981)', border: 'var(--badge-back-border, rgba(16, 185, 129, 0.3))' },
  database: { bg: 'var(--badge-db-bg, rgba(245, 158, 11, 0.1))', text: 'var(--badge-db-text, #f59e0b)', border: 'var(--badge-db-border, rgba(245, 158, 11, 0.3))' },
  infrastructure: { bg: 'var(--badge-infra-bg, rgba(139, 92, 246, 0.1))', text: 'var(--badge-infra-text, #8b5cf6)', border: 'var(--badge-infra-border, rgba(139, 92, 246, 0.3))' }
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
      setError(err.message || 'Failed to load project history.');
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
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>
        Loading proposal history...
      </div>
    );
  }

  return (
    <div style={{ marginTop: '24px', width: '100%', boxSizing: 'border-box' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="22" height="22" viewBox="0 0 256 256" fill="var(--primary-accent)"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z"/></svg>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              Proposal History
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Review past assessments and their recommended tech stack outputs
          </p>
        </div>
        <button
          onClick={onStartNew}
          className="btn-interactive"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px 18px',
            backgroundColor: 'var(--primary-accent)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 256 256" fill="#ffffff"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>
          <span>New Assessment</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{ padding: '14px 18px', backgroundColor: 'var(--accent-glow)', border: '1px solid var(--primary-accent)', color: 'var(--primary-accent)', borderRadius: '12px', marginBottom: '24px', fontSize: '13px', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <span>{error}</span>
          <button
            onClick={fetchHistory}
            className="btn-interactive"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', backgroundColor: 'transparent', color: 'var(--primary-accent)', border: '1px solid var(--primary-accent)', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!error && projects.length === 0 && (
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '40px 20px', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center', boxShadow: 'var(--card-shadow)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 16px 0' }}>
            No previous project proposals found.
          </p>
          <button
            onClick={onStartNew}
            className="btn-interactive"
            style={{ padding: '10px 18px', backgroundColor: 'var(--primary-accent)', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
          >
            Create Your First Proposal
          </button>
        </div>
      )}

      {/* Project Cards List */}
      {!error && projects.length > 0 && (
        <div className="history-grid">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => onSelectProject(proj.id)}
              className="option-card"
              style={{
                backgroundColor: 'var(--bg-card)',
                padding: '20px 24px',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--card-shadow)',
                cursor: 'pointer',
                boxSizing: 'border-box',
                width: '100%'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, lineHeight: '1.3' }}>
                  {proj.title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>
                    {new Date(proj.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, proj.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      transition: 'color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    title="Delete project"
                  >
                    <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96ZM192,208H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"/></svg>
                  </button>
                </div>
              </div>

              {proj.description && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 14px 0', lineHeight: '1.5' }}>
                  {proj.description}
                </p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                {proj.recommendations && proj.recommendations.map((rec) => {
                  const styleBadge = CATEGORY_STYLES[rec.category] || { 
                    bg: 'var(--bg-input)', 
                    text: 'var(--text-primary)', 
                    border: 'var(--border-color)' 
                  };
                  return (
                    <span
                      key={rec.name}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: styleBadge.bg,
                        color: styleBadge.text,
                        border: `1px solid ${styleBadge.border}`,
                        whiteSpace: 'nowrap'
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