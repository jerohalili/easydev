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
    return (
      <div 
        className="py-12 text-center text-xs sm:text-sm font-semibold tracking-wide" 
        style={{ color: 'var(--text-muted)' }}
      >
        Loading proposal history...
      </div>
    );
  }

  return (
    <div className="animate-fade mt-6 sm:mt-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            Proposal History
          </h2>
          <p className="text-xs sm:text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Review past assessments and their recommended tech stack outputs
          </p>
        </div>
        <button
          onClick={onStartNew}
          className="btn-interactive w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white cursor-pointer transition-all shrink-0"
          style={{ backgroundColor: 'var(--primary-accent)' }}
        >
          + New Assessment
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div 
          className="p-4 sm:p-5 rounded-2xl mb-6 flex flex-col sm:flex-row justify-between items-center gap-3 border"
          style={{ 
            backgroundColor: 'var(--accent-glow)', 
            borderColor: 'var(--primary-accent)' 
          }}
        >
          <span className="text-xs sm:text-sm font-bold" style={{ color: 'var(--primary-accent)' }}>
            {error}
          </span>
          <button
            onClick={fetchHistory}
            className="btn-interactive px-4 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all shrink-0"
            style={{ 
              backgroundColor: 'transparent', 
              color: 'var(--primary-accent)', 
              border: '1px solid var(--primary-accent)' 
            }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!error && projects.length === 0 && (
        <div 
          className="p-8 sm:p-12 rounded-2xl border text-center"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--border-color)', 
            boxShadow: 'var(--card-shadow)' 
          }}
        >
          <p className="text-xs sm:text-sm mb-5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            No previous project proposals found.
          </p>
          <button
            onClick={onStartNew}
            className="btn-interactive px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white cursor-pointer transition-all"
            style={{ backgroundColor: 'var(--primary-accent)' }}
          >
            Create Your First Proposal
          </button>
        </div>
      )}

      {/* Project History Cards List */}
      {!error && projects.length > 0 && (
        <div className="flex flex-col gap-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => onSelectProject(proj.id)}
              className="option-card p-5 sm:p-6 rounded-2xl border cursor-pointer transition-all"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                boxShadow: 'var(--card-shadow)'
              }}
            >
              {/* Card Title & Meta Info */}
              <div className="flex justify-between items-start gap-3 mb-2">
                <h3 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {proj.title}
                </h3>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] sm:text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {new Date(proj.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, proj.id)}
                    className="p-1 rounded-md text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer text-sm"
                    title="Delete project"
                  >
                    X
                  </button>
                </div>
              </div>

              {/* Description */}
              {proj.description && (
                <p className="text-xs sm:text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {proj.description}
                </p>
              )}

              {/* Tech Stack Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {proj.recommendations && proj.recommendations.map((rec) => {
                  const styleBadge = CATEGORY_STYLES[rec.category] || { 
                    bg: 'var(--bg-input)', 
                    text: 'var(--text-primary)', 
                    border: 'var(--border-color)' 
                  };
                  return (
                    <span
                      key={rec.name}
                      className="text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-md border"
                      style={{
                        backgroundColor: styleBadge.bg,
                        color: styleBadge.text,
                        borderColor: styleBadge.border
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