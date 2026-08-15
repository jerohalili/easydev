import React, { useState } from 'react';
import ProgressBar from './components/ProgressBar';
import QuestionCard from './components/QuestionCard';
import ResultsView from './components/ResultsView';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [screen, setScreen] = useState('start'); // 'start' | 'quiz' | 'results'
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectId, setProjectId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [stepCount, setStepCount] = useState(1);
  const [results, setResults] = useState([]);
  const [isStub, setIsStub] = useState(false);
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
      console.error(err);
      setError('Could not connect to server. Ensure Express is running on port 5000.');
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
      console.error(err);
      setError('Failed to record answer.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (targetProjectId) => {
    const idToUse = targetProjectId || projectId;
    const res = await fetch(`${API_BASE}/projects/${idToUse}/score`, {
      method: 'POST'
    });
    const data = await res.json();
    setResults(data.recommendations);
    setIsStub(data.is_stub || false);
    setScreen('results');
  };

  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '640px' }}>
        <header style={{ marginBottom: '40px', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', padding: '6px 12px', background: 'var(--accent-glow)', borderRadius: '20px', border: '1px solid rgba(59, 130, 246, 0.3)', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              EasyDev Engine v1.0
            </span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            Tech Stack Identifier
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '15px' }}>
            Adaptive constraint mapping for fast architectural decisions
          </p>
        </header>

        {error && (
          <div style={{ padding: '14px 18px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', borderRadius: '12px', marginBottom: '24px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {screen === 'start' && (
          <div className="animate-fade-in" style={{ background: 'var(--bg-card)', padding: '36px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '10px' }}>
              Create New Architecture Assessment
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '14px', lineHeight: '1.6' }}>
              Define your project identity to start the adaptive branching questionnaire.
            </p>

            <form onSubmit={startNewProject}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Realtime Analytics Portal"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    color: 'var(--text-primary)',
                    fontSize: '15px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Project Description (Optional)
                </label>
                <textarea
                  placeholder="Briefly describe target workload, features, or team background..."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    color: 'var(--text-primary)',
                    fontSize: '15px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !projectTitle.trim()}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: projectTitle.trim() && !loading ? 'var(--accent-primary)' : 'var(--bg-card-hover)',
                  color: projectTitle.trim() && !loading ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '16px',
                  cursor: projectTitle.trim() && !loading ? 'pointer' : 'not-allowed',
                  boxShadow: projectTitle.trim() && !loading ? '0 4px 12px var(--accent-glow)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {loading ? 'Initializing Engine...' : 'Start Assessment →'}
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
            isStub={isStub}
            onRestart={() => {
              setProjectTitle('');
              setProjectDescription('');
              setScreen('start');
            }}
          />
        )}
      </div>
    </div>
  );
}