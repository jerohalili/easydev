import React from 'react';
import ComparisonView from './ComparisonView';
import { CATEGORY_STYLES as STACK_LAYER_STYLES } from '../categoryStyles';

// Marker must match api/index.js SAFE_DEFAULT_MARKER exactly — the backend
// prefixes reasoning_text for zero-score fallback stack picks (all "I don't
// know" in a layer). I strip it here so juniors don't see the internal tag.
const SAFE_DEFAULT_MARKER = 'Default pick:';

function isFallbackStackPick(stackPick) {
  return typeof stackPick.reasoning_text === 'string' && stackPick.reasoning_text.startsWith(SAFE_DEFAULT_MARKER);
}

function stripFallbackMarker(stackPick) {
  return isFallbackStackPick(stackPick)
    ? stackPick.reasoning_text.slice(SAFE_DEFAULT_MARKER.length).trim()
    : stackPick.reasoning_text;
}

// Props stay as projectId/results/warnings (App + API shape), internals use proposal language.
export default function ResultsView({ projectId, results, warnings, onRestart }) {
  const stackPicks = results || [];
  const stackFlags = warnings || [];
  const fallbackPickCount = stackPicks.filter(isFallbackStackPick).length;
  // Showed the banner for 1 fallback once — noisy. 2+ means the proposal was mostly unsure.
  const showFallbackBanner = fallbackPickCount >= 2;

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }} className="animate-fade">
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          padding: '32px 24px',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--card-shadow)',
          marginBottom: '32px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            Recommended Architecture Stack
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
            Tailored tech stack generated from your constraint questionnaire choices.
          </p>
        </div>

        {showFallbackBanner && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '14px',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              marginBottom: '20px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: '1.5'
            }}
          >
            <strong style={{ color: 'var(--text-primary)' }}>No problem —</strong> a few of your answers were "I don't know," so
            we filled those in with a safe, industry-standard stack to start with. Look for the{' '}
            <span
              style={{
                fontSize: '10px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--accent-glow)',
                color: 'var(--primary-accent)',
                border: '1px solid var(--primary-accent)'
              }}
            >
              Default Pick
            </span>{' '}
            badge below — you can always revisit those answers and re-score for a more tailored result.
          </div>
        )}

        {stackFlags.length > 0 && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '14px',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--badge-back-border, var(--border-color))',
              marginBottom: '20px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: '1.5'
            }}
          >
            <strong style={{ color: 'var(--text-primary)' }}>Worth a second look —</strong> a couple of your answers seem to
            contradict each other:
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              {stackFlags.map((msg, idx) => (
                <li key={idx} style={{ marginBottom: idx < stackFlags.length - 1 ? '6px' : 0 }}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="results-grid" style={{ marginBottom: '28px' }}>
          {(!stackPicks || stackPicks.length === 0) ? (
            <div 
              style={{
                padding: '24px',
                borderRadius: '14px',
                border: '1px dashed var(--border-color)',
                textAlign: 'center',
                backgroundColor: 'var(--bg-main)'
              }}
            >
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                No stack picks came back for this proposal. Usually means the questionnaire answers
                didn't weight toward any tech in a layer — restart the proposal and tweak a couple answers.
              </p>
            </div>
          ) : stackPicks.map((item) => {
            const styleBadge = STACK_LAYER_STYLES[item.category] || {
              bg: 'var(--accent-glow)',
              text: 'var(--primary-accent)',
              border: 'var(--border-color)'
            };
            const isDefault = isFallbackStackPick(item);

            return (
              <div
                key={item.tech_item_id || item.name}
                style={{
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxSizing: 'border-box',
                  width: '100%'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', wordBreak: 'break-word', flex: 1 }}>
                    {item.name}
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {isDefault && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--accent-glow)',
                          color: 'var(--primary-accent)',
                          border: '1px solid var(--primary-accent)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Default Pick
                      </span>
                    )}
                    {item.needs_confirmation && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--bg-input)',
                          color: 'var(--text-secondary)',
                          border: '1px dashed var(--border-color)',
                          whiteSpace: 'nowrap'
                        }}
                        title="This was a close call — double-check it fits before treating it as final."
                      >
                        Please Confirm
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: styleBadge.bg,
                        color: styleBadge.text,
                        border: `1px solid ${styleBadge.border}`,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.category}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5', wordBreak: 'break-word' }}>
                  {stripFallbackMarker(item)}
                </p>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onRestart}
          className="btn-interactive"
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: 'var(--primary-accent)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '15px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px var(--accent-glow)',
            boxSizing: 'border-box'
          }}
        >
          Start New Assessment
        </button>
      </div>

      <ComparisonView projectId={projectId} recommendations={results || []} />
    </div>
  );
}