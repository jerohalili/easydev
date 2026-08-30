import React, { useState } from 'react';
import { ClockCounterClockwise, ArrowRight, ClipboardText } from '@phosphor-icons/react';
import ProgressBar from './components/ProgressBar';
import QuestionCard from './components/QuestionCard';
import ResultsView from './components/ResultsView';
import HistoryView from './components/HistoryView';
import ThemeToggle from './components/ThemeToggle';
import { apiFetch } from './config';

export default function App() {
  const [activeTab, setActiveTab] = useState('new');
  const [screen, setScreen] = useState('start');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectId, setProjectId] = useState(null);
  // `history` holds every question screen visited, in order, each with the
  // options it showed and (once answered) the option ids the user picked.
  // `historyIndex` points at the one currently on screen. Going "Back" just
  // moves the pointer left — no re-fetch needed, since the question and its
  // options are already cached in the entry. Answering the last question in
  // the chain (next_question_id === null) moves to the review screen
  // instead of scoring immediately.
  const [history, setHistory] = useState([]); // [{ question, options, selectedIds }]
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [reviewItems, setReviewItems] = useState([]);
  const [stepCount, setStepCount] = useState(1);
  const [totalSteps, setTotalSteps] = useState(9);
  const [results, setResults] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startNewProject = async (e) => {
    e.preventDefault();
    if (!projectTitle.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const projData = await apiFetch('/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: projectTitle,
          description: projectDescription
        })
      });
      setProjectId(projData.project.id);

      if (projData.first_question_id) {
        const { question, options: opts, remaining_steps } = await fetchQuestionData(projData.first_question_id);
        setHistory([{ question, options: opts, selectedIds: [] }]);
        setHistoryIndex(0);
        setStepCount(1);
        setTotalSteps(remaining_steps);
        setScreen('quiz');
      }
    } catch (err) {
      setError(err.message || 'Could not start the assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionData = async (questionId) => {
    const data = await apiFetch(`/questions/${questionId}`);
    return { question: data.question, options: data.options, remaining_steps: data.remaining_steps };
  };

  const currentEntry = historyIndex >= 0 ? history[historyIndex] : null;

  const goBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setStepCount(stepCount - 1);
    }
  };

  // Jump back into the quiz to edit an earlier answer from the review
  // screen. Everything after that point in history is discarded once the
  // user re-submits — if the edited answer changes where the chain goes
  // next (e.g. project type on Q1), the old forward path would be stale
  // anyway, so handleSubmitAnswers rebuilds it fresh from here.
  const editQuestion = (index) => {
    setScreen('quiz');
    setHistoryIndex(index);
    setStepCount(index + 1);
  };

  const handleSubmitAnswers = async (optionIds) => {
    if (!optionIds || optionIds.length === 0 || !currentEntry) return;

    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/projects/${projectId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: currentEntry.question.id,
          option_ids: optionIds
        })
      });

      setWarnings(data.warnings || []);

      // Record the answer on the current entry, discarding any stale
      // forward history from a previous path through the quiz.
      const answeredEntry = { ...currentEntry, selectedIds: optionIds };
      const trimmedHistory = history.slice(0, historyIndex + 1);
      trimmedHistory[historyIndex] = answeredEntry;

      if (data.next_question_id) {
        const { question, options: opts, remaining_steps } = await fetchQuestionData(data.next_question_id);
        const newIndex = historyIndex + 1;
        setHistory([...trimmedHistory, { question, options: opts, selectedIds: [] }]);
        setHistoryIndex(newIndex);
        const newStep = newIndex + 1;
        setStepCount(newStep);
        setTotalSteps(newStep - 1 + remaining_steps);
      } else {
        setHistory(trimmedHistory);
        await showReview();
      }
    } catch (err) {
      setError(err.message || 'Failed to record answers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showReview = async () => {
    const data = await apiFetch(`/projects/${projectId}/summary`);
    setReviewItems(data || []);
    setScreen('review');
  };

  const fetchResults = async (targetProjectId) => {
    const idToUse = targetProjectId || projectId;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/projects/${idToUse}/score`, { method: 'POST' });
      setResults(data.recommendations);
      setWarnings(data.warnings || []);
      setScreen('results');
    } catch (err) {
      setError(err.message || 'Failed to generate recommendation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadPastProject = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/projects/${id}`);
      setProjectId(data.project.id);
      setResults(data.recommendations);
      // Contradiction warnings are computed live at scoring time, not
      // persisted — a project loaded from history won't have them until
      // it's re-scored.
      setWarnings([]);
      setActiveTab('new');
      setScreen('results');
    } catch (err) {
      setError(err.message || 'Failed to load project detail.');
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
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  backgroundColor: activeTab === 'new' ? 'var(--primary-accent)' : 'transparent',
                  color: activeTab === 'new' ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: 'var(--card-shadow)'
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
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  backgroundColor: activeTab === 'history' ? 'var(--primary-accent)' : 'transparent',
                  color: activeTab === 'history' ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: 'var(--card-shadow)'
                }}
              >
                <ClockCounterClockwise size={16} weight="duotone" />
                <span>History</span>
              </button>
            </div>

            <ThemeToggle />
          </div>
        </header>

        {/* Error Alert */}
        {error && (
          <div style={{ padding: '14px 18px', backgroundColor: 'var(--accent-glow)', border: '1px solid var(--primary-accent)', color: 'var(--primary-accent)', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: '600' }}>
            {error}
          </div>
        )}

        {/* Assessment Tab */}
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

                <form onSubmit={startNewProject}>
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

            {screen === 'quiz' && currentEntry && (
              <div className="narrow-content">
                <ProgressBar stepCount={stepCount} totalSteps={totalSteps} />
                {historyIndex > 0 && (
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={loading}
                    className="btn-interactive"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 4px',
                      marginBottom: '10px',
                      border: 'none',
                      background: 'none',
                      color: 'var(--text-secondary)',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    ← Back
                  </button>
                )}
                {warnings.length > 0 && (
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
                    <strong style={{ color: 'var(--text-primary)' }}>Heads up —</strong>{' '}
                    {warnings.length === 1 ? warnings[0] : (
                      <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px' }}>
                        {warnings.map((msg, idx) => (
                          <li key={idx} style={{ marginBottom: idx < warnings.length - 1 ? '4px' : 0 }}>{msg}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                <QuestionCard
                  question={currentEntry.question}
                  options={currentEntry.options}
                  initialSelectedIds={currentEntry.selectedIds}
                  onSubmitAnswers={handleSubmitAnswers}
                  loading={loading}
                />
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
                    {reviewItems.map((item) => {
                      const historyIdx = history.findIndex((h) => h.question.id === item.question_id);
                      const labels = (item.selected_options || []).map((o) => o.label).join(', ');
                      return (
                        <button
                          key={item.question_id}
                          type="button"
                          onClick={() => historyIdx >= 0 && editQuestion(historyIdx)}
                          className="btn-interactive"
                          style={{
                            textAlign: 'left',
                            padding: '14px 16px',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-main)',
                            cursor: historyIdx >= 0 ? 'pointer' : 'default',
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
                    onClick={() => fetchResults(projectId)}
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
                projectId={projectId}
                results={results}
                warnings={warnings}
                onRestart={() => {
                  setProjectTitle('');
                  setProjectDescription('');
                  setWarnings([]);
                  setHistory([]);
                  setHistoryIndex(-1);
                  setReviewItems([]);
                  setScreen('start');
                }}
              />
            )}
          </>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <HistoryView
            onSelectProject={loadPastProject}
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