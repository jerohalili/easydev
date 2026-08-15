import React, { useState } from 'react';
import ProgressBar from './components/ProgressBar';
import QuestionCard from './components/QuestionCard';
import ResultsView from './components/ResultsView';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [screen, setScreen] = useState('start'); // 'start' | 'quiz' | 'results'
  const [projectId, setProjectId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [stepCount, setStepCount] = useState(1);
  const [results, setResults] = useState([]);
  const [isStub, setIsStub] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Start project & fetch first question
  const startNewProject = async () => {
    setLoading(true);
    setError(null);
    try {
      const projRes = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Web Project' })
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

  // 2. Fetch question details & options by ID
  const fetchQuestion = async (questionId) => {
    const res = await fetch(`${API_BASE}/questions/${questionId}`);
    const data = await res.json();
    setCurrentQuestion(data.question);
    setOptions(data.options);
  };

  // 3. Handle answer submission & branching check
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
        // Terminal question reached -> trigger scoring endpoint
        await fetchResults(projectId);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to record answer.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Trigger scoring stub and view results
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'system-ui, sans-serif', padding: '40px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <header style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0' }}>EasyDev</h1>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '15px' }}>Tech Stack Identifier for Developers</p>
        </header>

        {error && (
          <div style={{ padding: '12px 16px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {screen === 'start' && (
          <div style={{ background: '#ffffff', padding: '32px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>Identify Your Ideal Tech Stack</h2>
            <p style={{ color: '#4b5563', marginBottom: '24px', fontSize: '14px', lineHeight: '1.6' }}>
              Answer a short adaptive questionnaire about your project goals and constraints to receive a tailored tech stack recommendation.
            </p>
            <button
              onClick={startNewProject}
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Starting...' : 'Start Questionnaire'}
            </button>
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
            onRestart={() => setScreen('start')}
          />
        )}
      </div>
    </div>
  );
}