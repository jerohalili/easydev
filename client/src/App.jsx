import React, { useState } from 'react';
import ProgressBar from './components/ProgressBar';
import QuestionCard from './components/QuestionCard';
import ResultsView from './components/ResultsView';
import HistoryView from './components/HistoryView';
import ThemeToggle from './components/ThemeToggle';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'
  const [screen, setScreen] = useState('start'); // 'start' | 'quiz' | 'results'
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectId, setProjectId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [stepCount, setStepCount] = useState(1);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startNewProject = async (e) => {
    e.preventDefault();
    if (!projectTitle.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const projRes = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: projectTitle,
          description: projectDescription
        })
      });
      const projData = await projRes.json();
      setProjectId(projData.project.id);

      if (projData.first_question_id) {
        await fetchQuestion(projData.first_question_id);
        setStepCount(1);
        setScreen('quiz');
      }
    } catch (err) {
      setError('Could not connect to server. Ensure Express is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestion = async (questionId) => {
    const res = await fetch(`${API_BASE}/questions/${questionId}`);
    const data = await res.json();
    setCurrentQuestion(data.question);
    setOptions(data.options);
  };

  const handleSelectOption = async (optionId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          option_id: optionId
        })
      });
      const data = await res.json();

      if (data.next_question_id) {
        await fetchQuestion(data.next_question_id);
        setStepCount((prev) => prev + 1);
      } else {
        await fetchResults(projectId);
      }
    } catch (err) {
      setError('Failed to record answer.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (targetProjectId) => {
    const idToUse = targetProjectId || projectId;
    const res = await fetch(`${API_BASE}/projects/${idToUse}/score`, { method: 'POST' });
    const data = await res.json();
    setResults(data.recommendations);
    setScreen('results');
  };

  const loadPastProject = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/projects/${id}`);
      const data = await res.json();
      setProjectId(data.project.id);
      setResults(data.recommendations);
      setActiveTab('new');
      setScreen('results');
    } catch (err) {
      setError('Failed to load project detail.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '680px' }}>
        {/* Navigation Bar */}
        <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              EasyDev
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Tech Stack Identifier</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setActiveTab('new')}
                style={{
                  padding: '6px 14px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: activeTab === 'new' ? 'var(--primary-accent)' : 'transparent',
                  color: activeTab === 'new' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Assessment
              </button>
              <button
                onClick={() => setActiveTab('history')}
                style={{
                  padding: '6px 14px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: activeTab === 'history' ? 'var(--primary-accent)' : 'transparent',
                  color: activeTab === 'history' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                📜 History
              </button>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {error && (
          <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* Tab 1: New Assessment / Questionnaire Flow */}
        {activeTab === 'new' && (
          <>
            {screen === 'start' && (
              <div className="animate-fade" style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Create Project Proposal</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                  Define your project title and answer questions to generate a tailored stack recommendation across 5 categories.
                </p>

                <form onSubmit={startNewProject}>
                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      PROJECT TITLE *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Multi-Tenant E-Commerce Portal"
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        fontSize: '15px'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      PROJECT DESCRIPTION (OPTIONAL)
                    </label>
                    <textarea
                      placeholder="Briefly describe what you are building..."
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        fontSize: '15px'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !projectTitle.trim()}
                    style={{
                      width: '100%',
                      padding: '14px',
                      backgroundColor: projectTitle.trim() && !loading ? 'var(--primary-accent)' : 'var(--text-muted)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '16px',
                      cursor: projectTitle.trim() && !loading ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {loading ? 'Initializing...' : 'Start Assessment →'}
                  </button>
                </form>
              </div>
            )}

            {screen === 'quiz' && currentQuestion && (
              <div>
                <ProgressBar stepCount={stepCount} />
                <QuestionCard
                  question={currentQuestion}
                  options={options}
                  onSelectOption={handleSelectOption}
                  loading={loading}
                />
              </div>
            )}

            {screen === 'results' && (
              <ResultsView
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

        {/* Tab 2: Project History */}
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