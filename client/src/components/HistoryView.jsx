import React, { useEffect, useState } from 'react';
import { apiFetch } from '../config';
import { CATEGORY_STYLES as STACK_LAYER_STYLES } from '../categoryStyles';

// Proposal dashboard — every completed questionnaire is a proposal row with
// its 5 stack picks denormalized for the badges. Re-scores append to results,
// never overwrite, so the timeline stays intact (learned that the hard way).
export default function HistoryView({ onSelectProject, onResumeProject, onStartNew }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProposalHistory();
  }, []);

  const fetchProposalHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/projects');
      setProposals(data);
    } catch (err) {
      setError(err.message || 'Couldn\'t load your proposal history.');
    } finally {
      setLoading(false);
    }
  };

  const dropProposal = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this stack proposal and its picks from history?')) return;
    try {
      await apiFetch(`/projects/${id}`, { method: 'DELETE' });
      setProposals(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err.message || 'Couldn\'t delete that proposal. Try again.');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="22" height="22" viewBox="0 0 256 256" fill="var(--primary-accent)"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z"/></svg>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              Proposal History
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Review past assessments and their recommended tech stack outputs — or continue where you left off
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

      {error && (
        <div style={{ padding: '14px 18px', backgroundColor: 'var(--accent-glow)', border: '1px solid var(--primary-accent)', color: 'var(--primary-accent)', borderRadius: '12px', marginBottom: '24px', fontSize: '13px', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <span>{error}</span>
          <button
            onClick={fetchProposalHistory}
            className="btn-interactive"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', backgroundColor: 'transparent', color: 'var(--primary-accent)', border: '1px solid var(--primary-accent)', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}

      {!error && proposals.length === 0 && (
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

      {!error && proposals.length > 0 && (
        <div className="history-grid">
          {proposals.map((proposal) => {
            const isComplete = (proposal.recommendations || []).length > 0;
            const answerCount = Number(proposal.answer_count) || 0;
            const totalCount = Number(proposal.total_questions) || answerCount;
            const progressPercent = totalCount > 0 ? Math.min(Math.round((answerCount / totalCount) * 100), 100) : 0;
            return (
            <div
              key={proposal.id}
              onClick={() => (isComplete ? onSelectProject(proposal.id) : onResumeProject?.(proposal.id))}
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
                  {proposal.title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>
                    {new Date(proposal.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => dropProposal(e, proposal.id)}
                    className="btn-interactive delete-btn"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px'
                    }}
                    title="Delete project"
                  >
                    <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96ZM192,208H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"/></svg>
                  </button>
                </div>
              </div>

              {proposal.description && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 14px 0', lineHeight: '1.5' }}>
                  {proposal.description}
                </p>
              )}

              {!isComplete ? (
                <div style={{ marginTop: '12px', paddingTop: '14px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary-accent)', background: 'var(--accent-glow)', padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                      In progress
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                      {answerCount > 0 ? `${answerCount} of ${totalCount} answered` : `Not started · ${totalCount} questions`}
                    </span>
                  </div>
                  <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${progressPercent}%`,
                        backgroundColor: 'var(--primary-accent)',
                        borderRadius: '999px',
                        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)' }}>
                      Tap anywhere to pick up where you left off
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary-accent)', whiteSpace: 'nowrap' }}>
                      {answerCount > 0 ? 'Resume →' : 'Start →'}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                  {proposal.recommendations && proposal.recommendations.map((stackPick) => {
                    const styleBadge = STACK_LAYER_STYLES[stackPick.category] || {
                      bg: 'var(--bg-input)',
                      text: 'var(--text-primary)',
                      border: 'var(--border-color)'
                    };
                    return (
                      <span
                        key={stackPick.name}
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
                        {stackPick.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}