import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Trash, 
  ClockCounterClockwise, 
  ArrowClockwise, 
  Code, 
  FolderSimple 
} from '@phosphor-icons/react';
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
    return (
      <div 
        style={{ padding: '48px 0', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}
      >
        Loading proposal history...
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ marginTop: '24px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClockCounterClockwise size={22} weight="duotone" style={{ color: 'var(--primary-accent)' }} />
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              Proposal History
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Review past assessments and their recommended tech stack outputs
          </p>
        </div>
        <button
          onClick={onStartNew}
          className="btn-interactive"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 18px',
            backgroundColor: 'var(--primary-accent)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} weight="bold" />
          <span>New Assessment</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div 
          style={{ 
            padding: '14px 18px', 
            backgroundColor: 'var(--accent-glow)', 
            border: '1px solid var(--primary-accent)', 
            color: 'var(--primary-accent)', 
            borderRadius: '12px', 
            marginBottom: '24px', 
            fontSize: '13px', 
            fontWeight: '600',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <span>{error}</span>
          <button
            onClick={fetchHistory}
            className="btn-interactive"
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px', 
              backgroundColor: 'transparent', 
              color: 'var(--primary-accent)', 
              border: '1px solid var(--primary-accent)', 
              borderRadius: '8px', 
              fontWeight: '700', 
              fontSize: '12px', 
              cursor: 'pointer' 
            }}
          >
            <ArrowClockwise size={14} weight="bold" />
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!error && projects.length === 0 && (
        <div 
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            padding: '40px 20px', 
            borderRadius: '16px', 
            border: '1px solid var(--border-color)', 
            textAlign: 'center',
            boxShadow: 'var(--card-shadow)'
          }}
        >
          <FolderSimple size={40} weight="duotone" style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
            No previous project proposals found.
          </p>
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
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Create Your First Proposal
          </button>
        </div>
      )}

      {/* Project Cards List */}
      {!error && projects.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  {proj.title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>
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
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '6px',
                      transition: 'color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    title="Delete project"
                  >
                    <Trash size={18} weight="regular" />
                  </button>
                </div>
              </div>

              {proj.description && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.5', margin: '0 0 14px 0' }}>
                  {proj.description}
                </p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: styleBadge.bg,
                        color: styleBadge.text,
                        border: `1px solid ${styleBadge.border}`
                      }}
                    >
                      <Code size={12} weight="bold" />
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