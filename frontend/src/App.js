import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ComparisonPage from './ComparisonPage';
import WeatherWidget from './WeatherWidget';
import './App.css';
import Dashboard from './Dashboard';

const questionsData = {
  male: [
    {
      questionText: 'How does your skin feel 1–2 hours after washing your face (no products applied)?',
      answerOptions: [
        { answerText: 'Very tight or stretched', type: 'Dry' },
        { answerText: 'Oily or greasy all over', type: 'Oily' },
        { answerText: 'Oily mainly on forehead and nose', type: 'Combination' },
        { answerText: 'Comfortable', type: 'Normal' },
      ],
    },
    {
      questionText: 'How shiny does your face look by mid-day?',
      answerOptions: [
        { answerText: 'Not shiny at all', type: 'Dry' },
        { answerText: 'Very shiny all over', type: 'Oily' },
        { answerText: 'Shiny only in the T-zone', type: 'Combination' },
        { answerText: 'Slightly shiny, but looks healthy', type: 'Normal' },
      ],
    },
    {
      questionText: 'How does your skin react after shaving?',
      answerOptions: [
        { answerText: 'Feels very dry or irritated', type: 'Dry' },
        { answerText: 'Prone to greasy skin and ingrown hairs', type: 'Oily' },
        { answerText: 'Fine on cheeks, but neck/chin gets bumps', type: 'Combination' },
        { answerText: 'Smooth with no irritation', type: 'Normal' },
      ],
    },
    {
      questionText: 'How visible are your pores?',
      answerOptions: [
        { answerText: 'Hardly visible', type: 'Dry' },
        { answerText: 'Large and visible all over', type: 'Oily' },
        { answerText: 'Visible only on my nose and forehead', type: 'Combination' },
        { answerText: 'Not very noticeable', type: 'Normal' },
      ],
    },
    {
      questionText: 'How often do you get pimples, acne, or bumps?',
      answerOptions: [
        { answerText: 'Rarely, if ever', type: 'Dry' },
        { answerText: 'Frequently all over my face', type: 'Oily' },
        { answerText: 'Mostly in my beard or T-zone area', type: 'Combination' },
        { answerText: 'Occasionally (1 or 2 a month)', type: 'Normal' },
      ],
    }
  ],
  female: [
    {
      questionText: 'How does your skin feel 1–2 hours after washing (no products applied)?',
      answerOptions: [
        { answerText: 'Tight and dry', type: 'Dry' },
        { answerText: 'Oily or greasy', type: 'Oily' },
        { answerText: 'Oily only on my T-zone (forehead, nose, chin)', type: 'Combination' },
        { answerText: 'Comfortable', type: 'Normal' },
      ],
    },
    {
      questionText: 'Do you notice shine on your face by mid-day?',
      answerOptions: [
        { answerText: 'No shine at all', type: 'Dry' },
        { answerText: 'Heavy shine all over', type: 'Oily' },
        { answerText: 'Shine only on my T-zone', type: 'Combination' },
        { answerText: 'Slight, healthy glow', type: 'Normal' },
      ],
    },
    {
      questionText: 'Are your pores visible?',
      answerOptions: [
        { answerText: 'Barely visible', type: 'Dry' },
        { answerText: 'Large and visible all over', type: 'Oily' },
        { answerText: 'Visible in some areas (like the nose)', type: 'Combination' },
        { answerText: 'Not very noticeable', type: 'Normal' },
      ],
    },
    {
      questionText: 'Do you see dry patches or flakiness?',
      answerOptions: [
        { answerText: 'Very often', type: 'Dry' },
        { answerText: 'Rarely or never', type: 'Oily' },
        { answerText: 'Sometimes, but only on my cheeks', type: 'Combination' },
        { answerText: 'Only in extreme weather', type: 'Normal' },
      ],
    },
    {
      questionText: 'How often do you get pimples or acne?',
      answerOptions: [
        { answerText: 'Rarely', type: 'Dry' },
        { answerText: 'Frequently', type: 'Oily' },
        { answerText: 'Only on certain areas (T-zone / chin)', type: 'Combination' },
        { answerText: 'Occasionally', type: 'Normal' },
      ],
    }
  ]
};

const skinTypeIcons = { Dry: '🌿', Oily: '💧', Combination: '✨', Normal: '🌸' };
const stepIcons = ['🧼', '💊', '🫧', '☀️'];

function Quiz() {
  const [gender, setGender] = useState(() => sessionStorage.getItem('gender') || null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResult, setShowResult] = useState(() => sessionStorage.getItem('showResult') === 'true');
  const [scores, setScores] = useState({ Dry: 0, Oily: 0, Combination: 0, Normal: 0 });
  const [finalResult, setFinalResult] = useState(() => sessionStorage.getItem('finalResult') || "");
  const [routineData, setRoutineData] = useState(() => {
    const saved = sessionStorage.getItem('routineData');
    return saved ? JSON.parse(saved) : null;
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [animating, setAnimating] = useState(false);

  const navigate = useNavigate();

  const handleGenderSelect = (selectedGender) => {
    sessionStorage.setItem('gender', selectedGender);
    setGender(selectedGender);
    setCurrentQuestion(0);
    setScores({ Dry: 0, Oily: 0, Combination: 0, Normal: 0 });
    setShowResult(false);
    setRoutineData(null);
  };

  const handleAnswerOptionClick = (type) => {
    setAnimating(true);
    setTimeout(() => {
      const newScores = { ...scores, [type]: scores[type] + 1 };
      setScores(newScores);
      const currentQuestionsArray = questionsData[gender];
      const nextQuestion = currentQuestion + 1;
      if (nextQuestion < currentQuestionsArray.length) {
        setCurrentQuestion(nextQuestion);
      } else {
        calculateAndFetchRoutine(newScores);
      }
      setAnimating(false);
    }, 300);
  };

  const calculateAndFetchRoutine = async (finalScores) => {
    const resultType = Object.keys(finalScores).reduce((a, b) =>
      finalScores[a] > finalScores[b] ? a : b
    );
    setFinalResult(resultType);
    setShowResult(true);
    setIsGenerating(true);
    try {
      const response = await fetch('https://cerahya.onrender.com/api/routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skinType: resultType }),
      });
      const data = await response.json();
      setRoutineData(data);
      sessionStorage.setItem('finalResult', resultType);
      sessionStorage.setItem('showResult', 'true');
      sessionStorage.setItem('routineData', JSON.stringify(data));
    } catch (error) {
      toast.error("Failed to generate routine. Please check your backend.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCompareClick = (product) => {
    navigate('/compare', { state: { product: product } });
  };

  const handleSaveRoutine = async () => {
    if (!usernameInput.trim()) {
      toast.warning("Please enter a username to save your routine!");
      return;
    }
    try {
      const response = await fetch('https://cerahya.onrender.com/api/user/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, skinType: finalResult, routineData })
      });
      if (response.ok) {
        sessionStorage.setItem('username', usernameInput);
        toast.success("Routine saved! Redirecting to Dashboard...");
        setTimeout(() => navigate('/dashboard'), 1200);
      } else {
        toast.error("Failed to save routine to the database.");
      }
    } catch (error) {
      toast.error("Network error while saving.");
    }
  };

  const restartQuiz = () => {
    sessionStorage.clear();
    setGender(null);
    setScores({ Dry: 0, Oily: 0, Combination: 0, Normal: 0 });
    setCurrentQuestion(0);
    setShowResult(false);
    setFinalResult("");
    setRoutineData(null);
  };

  const totalQuestions = gender ? questionsData[gender].length : 0;
  const progressPercentage = gender ? (currentQuestion / totalQuestions) * 100 : 0;

  return (
    <div className="ch-root">
      {/* Decorative blobs */}
      <div className="ch-blob ch-blob-1" />
      <div className="ch-blob ch-blob-2" />

      <header className="ch-header">
        <div className="ch-logo">
          <span className="ch-logo-mark">✦</span>
          <span className="ch-logo-text">CeraHya</span>
        </div>
        <div className="ch-tagline">Intelligent Skincare</div>
      </header>

      <WeatherWidget />

      <main className="ch-main">

        {/* ── GENDER SELECTION ── */}
        {!gender && (
          <div className="ch-card ch-fade-in">
            <p className="ch-eyebrow">Welcome</p>
            <h2 className="ch-heading">Let's discover your <em>skin story</em></h2>
            <p className="ch-subtext">We'll ask you 5 short questions to build a routine crafted exactly for you.</p>
            <p className="ch-label">How do you identify?</p>
            <div className="ch-gender-grid">
              <button className="ch-gender-btn" onClick={() => handleGenderSelect('male')}>
                <span className="ch-gender-icon">♂</span>
                <span>Male</span>
              </button>
              <button className="ch-gender-btn" onClick={() => handleGenderSelect('female')}>
                <span className="ch-gender-icon">♀</span>
                <span>Female</span>
              </button>
            </div>
          </div>
        )}

        {/* ── QUIZ ── */}
        {gender && !showResult && (
          <div className={`ch-card ch-fade-in ${animating ? 'ch-exit' : ''}`}>
            <div className="ch-progress-wrap">
              <div className="ch-progress-track">
                <div className="ch-progress-fill" style={{ width: `${progressPercentage}%` }} />
              </div>
              <span className="ch-progress-label">{currentQuestion + 1} / {totalQuestions}</span>
            </div>
            <p className="ch-eyebrow">Skin Analysis</p>
            <h2 className="ch-question">{questionsData[gender][currentQuestion].questionText}</h2>
            <div className="ch-answers">
              {questionsData[gender][currentQuestion].answerOptions.map((opt, i) => (
                <button
                  key={i}
                  className="ch-answer-btn"
                  onClick={() => handleAnswerOptionClick(opt.type)}
                >
                  <span className="ch-answer-dot" />
                  {opt.answerText}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── GENERATING ── */}
        {showResult && isGenerating && (
          <div className="ch-card ch-fade-in ch-generating">
            <div className="ch-spinner-wrap">
              <div className="ch-spinner" />
              <span className="ch-spinner-icon">✦</span>
            </div>
            <h2 className="ch-heading">Curating your routine…</h2>
            <p className="ch-subtext">Our AI dermatologist is handpicking products for your <strong>{finalResult}</strong> skin.</p>
            <div className="ch-dots">
              <span /><span /><span />
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {showResult && !isGenerating && !routineData && (
          <div className="ch-card ch-fade-in" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '3rem' }}>⚠️</p>
            <h2 className="ch-heading">Something went wrong</h2>
            <button className="ch-btn-primary" onClick={restartQuiz}>Try Again</button>
          </div>
        )}

        {/* ── RESULTS ── */}
        {showResult && !isGenerating && routineData && (
          <div className="ch-results ch-fade-in">

            {/* Result Badge */}
            <div className="ch-result-badge">
              <span className="ch-result-icon">{skinTypeIcons[finalResult] || '✨'}</span>
              <div>
                <p className="ch-eyebrow">Your Skin Type</p>
                <h2 className="ch-result-type">{finalResult} Skin</h2>
              </div>
            </div>

            <p className="ch-subtext" style={{ textAlign: 'center', marginBottom: '2rem' }}>
              Your AI-curated 4-step daily ritual
            </p>

            {/* Routine Cards */}
            <div className="ch-routine-grid">
              {routineData.map((item, index) => (
                <div className="ch-product-card" key={index} style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="ch-step-header">
                    <div className="ch-step-badge">{stepIcons[index] || index + 1}</div>
                    <span className="ch-step-label">{item.step}</span>
                  </div>
                  <h3 className="ch-product-name">{item.productName}</h3>
                  <p className="ch-product-desc">{item.description}</p>
                  <button className="ch-btn-outline" onClick={() => handleCompareClick(item)}>
                    Compare Prices & Buy →
                  </button>
                </div>
              ))}
            </div>

            {/* Save Section */}
            <div className="ch-save-section">
              <div className="ch-save-left">
                <h3 className="ch-save-title">Track Your Progress</h3>
                <p className="ch-save-desc">Save your routine, build streaks, and earn rewards.</p>
              </div>
              <div className="ch-save-right">
                <input
                  type="text"
                  className="ch-input"
                  placeholder="Choose a username…"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveRoutine()}
                />
                <button className="ch-btn-primary" onClick={handleSaveRoutine}>
                  Save Routine
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button className="ch-btn-ghost" onClick={restartQuiz}>↺ Retake Quiz</button>
            </div>
          </div>
        )}

      </main>

      <footer className="ch-footer">
        <span>✦ CeraHya — Personalised Skincare for India</span>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ToastContainer
        position="bottom-right"
        theme="light"
        autoClose={3000}
        toastStyle={{
          fontFamily: "'Jost', sans-serif",
          borderRadius: '12px',
          fontSize: '14px',
          boxShadow: '0 8px 32px rgba(28,56,41,0.12)'
        }}
      />
      <Routes>
        <Route path="/" element={<Quiz />} />
        <Route path="/compare" element={<ComparisonPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}