import React, { useState } from 'react';
import { ClockCounterClockwise, ArrowRight, ClipboardText } from '@phosphor-icons/react';
import ProgressBar from './components/ProgressBar';
import QuestionCard from './components/QuestionCard';
import ResultsView from './components/ResultsView';
import HistoryView from './components/HistoryView';
import ThemeToggle from './components/ThemeToggle';
import { API_BASE, apiFetch } from './config';

export default function App() {
  const [activeTab, setActiveTab] = useState('new');
  const [screen, setScreen] = useState('start');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectId, setProjectId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [stepCount, setStepCount] = useState(1);
  const [totalSteps, setTotalSteps] = useState(9);
  const [results, setResults] = useState([]);
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
        const remaining = await fetchQuestion(projData.first_question_id);
        setStepCount(1);
        setTotalSteps(remaining);
        setScreen('quiz');
      }
    } catch (err) {
      setError(err.message || 'Could not start the assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestion = async (questionId) => {
    const data = await apiFetch(`/questions/${questionId}`);
    setCurrentQuestion(data.question);
    setOptions(data.options);
    return data.remaining_steps;
  };

  const handleSubmitAnswers = async (optionIds) => {
    if (!optionIds || optionIds.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/projects/${projectId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          option_ids: optionIds
        })
      });

      if (data.next_question_id) {
        const remaining = await fetchQuestion(data.next_question_id);
        const newStep = stepCount + 1;
        setStepCount(newStep);
        setTotalSteps(newStep - 1 + remaining);
      } else {
        await fetchResults(projectId);
      }
    } catch (err) {
      setError(err.message || 'Failed to record answers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (targetProjectId) => {
    const idToUse = targetProjectId || projectId;
    const data = await apiFetch(`/projects/${idToUse}/score`, { method: 'POST' });
    setResults(data.recommendations);
    setScreen('results');
  };

  const loadPastProject = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/projects/${id}`);
      setProjectId(data.project.id);
      setResults(data.recommendations);
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
      <div className={`app-shell${(activeTab === 'history' || (activeTab === 'new' && screen === 'results')) ? ' app-shell-wide' : ''}`}>
        
        {/* Header & Navigation */}
        <header style={{ marginBottom: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              EasyDev
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '4px 0 0 0' }}>Tech Stack Identifier</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
              <button
                onClick={() => setActiveTab('new')}
                className="btn-interactive"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: activeTab === 'new' ? 'var(--primary-accent)' : 'transparent',
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
                className="btn-interactive"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: activeTab === 'history' ? 'var(--primary-accent)' : 'transparent',
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
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: '700',
                      fontSize: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center',
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
            )}

            {screen === 'quiz' && currentQuestion && (
              <div>
                <ProgressBar stepCount={stepCount} totalSteps={totalSteps} />
                <QuestionCard
                  question={currentQuestion}
                  options={options}
                  onSubmitAnswers={handleSubmitAnswers}
                  loading={loading}
                />
              </div>
            )}

            {screen === 'results' && (
              <ResultsView
                projectId={projectId}
                results={results}
                onRestart={() => {
                  setProjectTitle('');
                  setProjectDescription('');
                  setScreen('start');
                }}
              />
            )}
          </>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <HistoryView
            apiBase={API_BASE}
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