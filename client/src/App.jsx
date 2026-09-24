import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ClockCounterClockwise, ArrowRight, ClipboardText } from '@phosphor-icons/react';
import ProgressBar from './components/ProgressBar';
import QuestionCard from './components/QuestionCard';
import ResultsView from './components/ResultsView';
import HistoryView from './components/HistoryView';
import ThemeToggle from './components/ThemeToggle';
import { apiFetch } from './config';

export default function App() {
  // Proposal flow state — kept together on purpose, order mirrors the questionnaire:
  // start -> quiz -> review -> stack picks. I tried splitting this into a reducer
  // early on and it just made the branching harder to follow.
  const [activeTab, setActiveTab] = useState('new');
  const [screen, setScreen] = useState('start');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [proposalId, setProposalId] = useState(null);
  // Client-side questionnaire path so Back doesn't re-fetch (junior devs go back a lot)
  const [proposalPath, setProposalPath] = useState([]); // [{ question, options, selectedIds }]
  const [proposalPathPos, setProposalPathPos] = useState(-1);
  const [proposalReviewLines, setProposalReviewLines] = useState([]);
  const [stepCount, setStepCount] = useState(1);
  const [totalSteps, setTotalSteps] = useState(9);
  // stackPicks = the 5 recommended techs (language/frontend/backend/database/infra)
  const [stackPicks, setStackPicks] = useState([]);
  // proposalFlags = contradiction heads-ups from the scoring engine (Q3 vs Q2 etc.)
  const [proposalFlags, setProposalFlags] = useState([]);
  const [loading, setLoading] = useState(false);
  // Non-blocking questionnaire state: per-answer saves + next-question fetches
  // run in the background so Continue feels instant. `loading` is reserved for
  // the true blocking moments (start, review build, final scoring).
  const [answerSaving, setAnswerSaving] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);
  const [error, setError] = useState(null);
  // Prefetched question payloads: questionId -> { question, options, remaining_steps }
  const questionCacheRef = useRef(new Map());
  // In-flight background save promises, flushed before review/scoring.
  const pendingSavesRef = useRef([]);

  const startProposal = async (e) => {
    e.preventDefault();
    if (!projectTitle.trim()) return;

    setLoading(true);
    setError(null);
    questionCacheRef.current.clear();
    pendingSavesRef.current = [];
    setAnswerSaving(false);
    setLoadingNext(false);
    try {
      const projData = await apiFetch('/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: projectTitle,
          description: projectDescription
        })
      });
      setProposalId(projData.project.id);

      if (projData.first_question_id) {
        const { question, options: opts, remaining_steps } = await fetchQuestionnaireStep(projData.first_question_id);
        setProposalPath([{ question, options: opts, selectedIds: [] }]);
        setProposalPathPos(0);
        setStepCount(1);
        // NOTE: remaining_steps is a static walk from the DB, not 9-fixed.
        // My first progress bar hardcoded 9 and it jumped backwards on the API skip path.
        setTotalSteps(remaining_steps);
        setScreen('quiz');
      }
    } catch (err) {
      setError(err.message || `Couldn't open "${projectTitle}" proposal. Check connection and try again.`);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionnaireStep = useCallback(async (questionId) => {
    const cacheKey = Number(questionId);
    const cached = questionCacheRef.current.get(cacheKey);
    if (cached) return cached;
    const data = await apiFetch(`/questions/${questionId}`);
    const step = { question: data.question, options: data.options, remaining_steps: data.remaining_steps };
    questionCacheRef.current.set(cacheKey, step);
    return step;
  }, []);

  // Fire-and-forget prefetch so Continue is usually a cache hit (instant).
  const prefetchQuestionSteps = useCallback((questionIds) => {
    [...new Set((questionIds || []).filter(Boolean))].forEach((id) => {
      const cacheKey = Number(id);
      if (questionCacheRef.current.has(cacheKey)) return;
      apiFetch(`/questions/${id}`)
        .then((data) => {
          questionCacheRef.current.set(cacheKey, {
            question: data.question,
            options: data.options,
            remaining_steps: data.remaining_steps
          });
        })
        .catch(() => {});
    });
  }, []);

  const trackBackgroundSave = useCallback((promise) => {
    pendingSavesRef.current.push(promise);
    setAnswerSaving(true);
    const cleanup = () => {
      pendingSavesRef.current = pendingSavesRef.current.filter((p) => p !== promise);
      if (pendingSavesRef.current.length === 0) setAnswerSaving(false);
    };
    promise.then(cleanup, cleanup);
    return promise;
  }, []);

  const flushPendingSaves = useCallback(async () => {
    const pending = [...pendingSavesRef.current];
    if (pending.length > 0) await Promise.allSettled(pending);
  }, []);

  const currentProposalStep = proposalPathPos >= 0 ? proposalPath[proposalPathPos] : null;

  const stepBackInProposal = () => {
    if (proposalPathPos > 0) {
      setProposalPathPos(proposalPathPos - 1);
      setStepCount(stepCount - 1);
    }
  };

  // Jump back to edit an earlier proposal answer; stale forward branch gets
  // discarded on re-submit (branching means the old forward path may be invalid now)
  const jumpBackToProposalStep = (index) => {
    setScreen('quiz');
    setProposalPathPos(index);
    setStepCount(index + 1);
  };

  // Prefetch successors of the visible step while the user reads, so
  // Continue is usually an instant cache hit instead of a spinner.
  useEffect(() => {
    if (screen !== 'quiz' || !currentProposalStep) return;
    prefetchQuestionSteps((currentProposalStep.options || []).map((o) => o.next_question_id));
  }, [screen, currentProposalStep, prefetchQuestionSteps]);

  const buildProposalReview = async () => {
    // Only blocking loader in the quiz flow besides the final score —
    // flush the last background save so the summary sees every answer.
    setLoading(true);
    setError(null);
    try {
      await flushPendingSaves();
      const data = await apiFetch(`/projects/${proposalId}/summary`);
      setProposalReviewLines(data || []);
      setScreen('review');
    } catch (err) {
      setError(err.message || `Couldn't load the review for this proposal. Try again.`);
    } finally {
      setLoading(false);
    }
  };

  const advanceToQuestionStep = (step, posSnapshot) => {
    const newIndex = posSnapshot + 1;
    setProposalPath((prev) => {
      const base = prev.slice(0, posSnapshot + 1);
      return [...base, { question: step.question, options: step.options, selectedIds: [] }];
    });
    setProposalPathPos(newIndex);
    const newStep = newIndex + 1;
    setStepCount(newStep);
    setTotalSteps(newStep - 1 + (step.remaining_steps ?? 1));
    prefetchQuestionSteps((step.options || []).map((o) => o.next_question_id));
  };

  const submitProposalAnswer = (optionIds) => {
    if (!optionIds || optionIds.length === 0 || !currentProposalStep) return;
    if (loading || loadingNext) return;

    setError(null);
    const stepSnapshot = currentProposalStep;
    const posSnapshot = proposalPathPos;
    const activeProposalId = proposalId;

    // Record answer locally first, drop stale forward branch — Back restores
    // instantly even while the save is still in flight.
    const answeredStep = { ...stepSnapshot, selectedIds: optionIds };
    const trimmedPath = proposalPath.slice(0, posSnapshot + 1);
    trimmedPath[posSnapshot] = answeredStep;
    setProposalPath(trimmedPath);

    // Server picks next from targetOptionIds[0] — mirror it for the optimistic jump.
    const localNextId =
      (stepSnapshot.options || []).find((o) => o.id === optionIds[0])?.next_question_id ?? null;

    // Background save: non-blocking, warnings land async, failures banner only.
    const savePromise = apiFetch(`/projects/${activeProposalId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id: stepSnapshot.question.id,
        option_ids: optionIds
      })
    })
      .then((data) => {
        setProposalFlags(data.warnings || []);
        return data;
      })
      .catch((err) => {
        setError(err.message || `Couldn't save that questionnaire answer in the background. Check connection — tap Continue again to retry.`);
        throw err;
      });
    trackBackgroundSave(savePromise);

    // Authoritative reconcile (e.g. brand-new auto-skip of Q6/Q8): if the
    // server skipped past our optimistic pick and the user hasn't answered
    // that screen yet, swap in the server's step.
    savePromise
      .then(async (data) => {
        const serverNext = data.next_question_id ?? null;
        if (serverNext === localNextId || serverNext == null) {
          if (serverNext == null && localNextId == null) {
            // True end of questionnaire — blocking loader only here.
            await flushPendingSaves();
            await buildProposalReview();
          } else if (serverNext != null && localNextId == null) {
            try {
              const serverStep = await fetchQuestionnaireStep(serverNext);
              advanceToQuestionStep(serverStep, posSnapshot);
            } catch {
              // Error banner already set; user stays on a valid step.
            }
          }
          return;
        }
        try {
          const serverStep = await fetchQuestionnaireStep(serverNext);
          setProposalPath((prev) => {
            const nextSlot = prev[posSnapshot + 1];
            if (!nextSlot || (nextSlot.selectedIds || []).length > 0) return prev;
            if (Number(nextSlot.question.id) !== Number(localNextId)) return prev;
            const swapped = [...prev];
            swapped[posSnapshot + 1] = {
              question: serverStep.question,
              options: serverStep.options,
              selectedIds: []
            };
            return swapped;
          });
          prefetchQuestionSteps((serverStep.options || []).map((o) => o.next_question_id));
        } catch {
          // Keep the optimistic step — it is still answerable and savable.
        }
      })
      .catch(() => {});

    if (localNextId == null) {
      // Optimistically the end; the save callback above finishes the jump to
      // review (blocking) once the server confirms. Nothing more to do here.
      return;
    }

    const cached = questionCacheRef.current.get(Number(localNextId));
    if (cached) {
      advanceToQuestionStep(cached, posSnapshot);
      return;
    }

    // Cache miss: fetch next without locking the whole UI — Back/options on
    // the follow-up stay interactive, only a slim placeholder shows.
    setLoadingNext(true);
    fetchQuestionnaireStep(localNextId)
      .then((step) => advanceToQuestionStep(step, posSnapshot))
      .catch((err) => {
        setError(err.message || `Couldn't load the next questionnaire step. Try again.`);
      })
      .finally(() => setLoadingNext(false));
  };

  const scoreProposalStack = async (targetProposalId) => {
    const idToUse = targetProposalId || proposalId;
    setLoading(true);
    setError(null);
    try {
      await flushPendingSaves();
      const data = await apiFetch(`/projects/${idToUse}/score`, { method: 'POST' });
      setStackPicks(data.recommendations);
      setProposalFlags(data.warnings || []);
      setScreen('results');
    } catch (err) {
      setError(err.message || 'Stack scoring failed for this proposal. Your answers are saved — try again.');
    } finally {
      setLoading(false);
    }
  };

  const reopenProposal = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/projects/${id}`);
      setProposalId(data.project.id);
      setStackPicks(data.recommendations);
      // Flags are computed at scoring time, not stored — history reopens clean
      setProposalFlags([]);
      setActiveTab('new');
      setScreen('results');
    } catch (err) {
      setError(err.message || 'Couldn\'t reopen that proposal from history.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="app-shell app-shell-wide">
        
        {/* Header & Navigation */}
        <header style={{ marginBottom: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              EasyDev
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '4px 0 0 0' }}>Tech Stack Identifier</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
              <button
                onClick={() => setActiveTab('new')}
                className="btn-interactive tab-btn"
                data-active={activeTab === 'new'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  border: 'none',
                  borderRadius: '10px',
                  backgroundColor: activeTab === 'new' ? 'var(--primary-accent)' : 'var(--tab-bg)',
                  color: activeTab === 'new' ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <ClipboardText size={16} weight="duotone" />
                <span>Assessment</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className="btn-interactive tab-btn"
                data-active={activeTab === 'history'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  border: 'none',
                  borderRadius: '10px',
                  backgroundColor: activeTab === 'history' ? 'var(--primary-accent)' : 'var(--tab-bg)',
                  color: activeTab === 'history' ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <ClockCounterClockwise size={16} weight="duotone" />
                <span>History</span>
              </button>
            </div>

            <ThemeToggle />
          </div>
        </header>

        {/* Proposal error — kept inline so questionnaire context isn't lost */}
        {error && (
          <div style={{ padding: '14px 18px', backgroundColor: 'var(--accent-glow)', border: '1px solid var(--primary-accent)', color: 'var(--primary-accent)', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: '600' }}>
            {error}
          </div>
        )}

        {/* Stack proposal tab (new questionnaire) */}
        {activeTab === 'new' && (
          <>
            {screen === 'start' && (
              <div className="narrow-content">
              <div className="animate-fade" style={{ background: 'var(--bg-card)', padding: '36px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                  Create Project Proposal
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '14px', lineHeight: '1.6', margin: '0 0 28px 0' }}>
                  Name your proposal to begin the questionnaire. Select your project requirements and click continue to progress through the assessment.
                </p>

                <form onSubmit={startProposal}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                      PROJECT TITLE *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Realtime Analytics Dashboard"
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        fontSize: '15px'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '28px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                      PROJECT DESCRIPTION (OPTIONAL)
                    </label>
                    <textarea
                      placeholder="Briefly describe target workload, technical goals, or constraints..."
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        fontSize: '15px',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-interactive"
                    disabled={loading || !projectTitle.trim()}
                    style={{
                      width: '100%',
                      padding: '14px',
                      backgroundColor: projectTitle.trim() && !loading ? 'var(--primary-accent)' : 'var(--bg-input)',
                      color: projectTitle.trim() && !loading ? '#ffffff' : 'var(--text-muted)',
                      border: projectTitle.trim() && !loading ? 'none' : '1px solid var(--border-color)',
                      borderRadius: '12px',
                      fontWeight: '700',
                      fontSize: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: projectTitle.trim() && !loading ? 'pointer' : 'not-allowed',
                      boxShadow: projectTitle.trim() && !loading ? '0 4px 14px var(--accent-glow)' : 'none'
                    }}
                  >
                    <span>{loading ? 'Initializing Engine...' : 'Start Assessment'}</span>
                    {!loading && <ArrowRight size={18} weight="bold" />}
                  </button>
                </form>
              </div>
              </div>
            )}

            {screen === 'quiz' && currentProposalStep && (
              <div className="narrow-content">
                <ProgressBar stepCount={stepCount} totalSteps={totalSteps} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '30px', marginBottom: '10px' }}>
                  <div>
                    {proposalPathPos > 0 && (
                      <button
                        type="button"
                        onClick={stepBackInProposal}
                        disabled={loading || loadingNext}
                        className="btn-interactive"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 4px',
                          border: 'none',
                          background: 'none',
                          color: 'var(--text-secondary)',
                          fontWeight: '700',
                          fontSize: '13px',
                          cursor: loading || loadingNext ? 'not-allowed' : 'pointer'
                        }}
                      >
                        ← Back
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', whiteSpace: 'nowrap', visibility: answerSaving && !loadingNext ? 'visible' : 'hidden' }}>
                    Saving…
                  </span>
                </div>
                {proposalFlags.length > 0 && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px dashed var(--border-color)',
                      marginBottom: '14px',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.5'
                    }}
                  >
                    <strong style={{ color: 'var(--text-primary)' }}>Heads up on your proposal —</strong>{' '}
                    {proposalFlags.length === 1 ? proposalFlags[0] : (
                      <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px' }}>
                        {proposalFlags.map((msg, idx) => (
                          <li key={idx} style={{ marginBottom: idx < proposalFlags.length - 1 ? '4px' : 0 }}>{msg}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {loadingNext ? (
                  <div
                    className="animate-fade"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      padding: '32px 24px',
                      borderRadius: '20px',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'var(--card-shadow)',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Preparing next question…
                  </div>
                ) : (
                  <QuestionCard
                    question={currentProposalStep.question}
                    options={currentProposalStep.options}
                    initialSelectedIds={currentProposalStep.selectedIds}
                    onSubmitAnswers={submitProposalAnswer}
                    saving={answerSaving}
                  />
                )}
              </div>
            )}

            {screen === 'review' && (
              <div className="narrow-content">
                <div className="animate-fade" style={{ background: 'var(--bg-card)', padding: '32px 24px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                    Review your answers
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 22px 0', lineHeight: '1.5' }}>
                    Here's everything you told us. Tap any answer to change it before we generate your stack.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                    {proposalReviewLines.map((item) => {
                      const pathIdx = proposalPath.findIndex((h) => h.question.id === item.question_id);
                      const labels = (item.selected_options || []).map((o) => o.label).join(', ');
                      return (
                        <button
                          key={item.question_id}
                          type="button"
                          onClick={() => pathIdx >= 0 && jumpBackToProposalStep(pathIdx)}
                          className="btn-interactive"
                          style={{
                            textAlign: 'left',
                            padding: '14px 16px',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-main)',
                            cursor: pathIdx >= 0 ? 'pointer' : 'default',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                          }}
                        >
                          <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {item.prompt_text}
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {labels || '—'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => scoreProposalStack(proposalId)}
                    disabled={loading}
                    className="btn-interactive"
                    style={{
                      width: '100%',
                      padding: '14px',
                      backgroundColor: !loading ? 'var(--primary-accent)' : 'var(--bg-input)',
                      color: !loading ? '#ffffff' : 'var(--text-muted)',
                      border: !loading ? 'none' : '1px solid var(--border-color)',
                      borderRadius: '12px',
                      fontWeight: '700',
                      fontSize: '15px',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? 'Generating...' : 'Looks good — Get My Recommendation'}
                  </button>
                </div>
              </div>
            )}

            {screen === 'results' && (
              <ResultsView
                projectId={proposalId}
                results={stackPicks}
                warnings={proposalFlags}
                onRestart={() => {
                  setProjectTitle('');
                  setProjectDescription('');
                  setProposalFlags([]);
                  setProposalPath([]);
                  setProposalPathPos(-1);
                  setProposalReviewLines([]);
                  questionCacheRef.current.clear();
                  pendingSavesRef.current = [];
                  setAnswerSaving(false);
                  setLoadingNext(false);
                  setScreen('start');
                }}
              />
            )}
          </>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <HistoryView
            onSelectProject={reopenProposal}
            onStartNew={() => {
              setActiveTab('new');
              setScreen('start');
            }}
          />
        )}
      </div>
    </div>
  );
}