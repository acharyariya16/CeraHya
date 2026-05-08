import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Confetti from 'react-confetti';
import './App.css';

const stepIcons = ['🧼', '💊', '🫧', '☀️', '🌿', '💧', '✨', '🌸'];

export default function Dashboard() {
  const [username, setUsername]               = useState(sessionStorage.getItem('username') || '');
  const [userData, setUserData]               = useState(null);
  const [inputName, setInputName]             = useState('');
  const [showConfetti, setShowConfetti]       = useState(false);

  const [ingredientInput, setIngredientInput] = useState('');
  const [analysisResult, setAnalysisResult]   = useState(null);
  const [isAnalyzing, setIsAnalyzing]         = useState(false);

  const [showAddForm, setShowAddForm]         = useState(false);
  const [customStep, setCustomStep]           = useState('');
  const [customProduct, setCustomProduct]     = useState('');

  const [editingIndex, setEditingIndex]       = useState(null);
  const [editStep, setEditStep]               = useState('');
  const [editProduct, setEditProduct]         = useState('');

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const navigate = useNavigate();

  const validateName = (name) => {
    const t = name.trim();
    if (!t) return "Please enter your username.";
    if (!/^[a-zA-Z\s]+$/.test(t)) return "Username can only contain letters and spaces.";
    if (t.length < 3) return "Username must be at least 3 characters.";
    if (!/[aeiouyAEIOUY]/.test(t)) return "Please enter a real name.";
    if (/[bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ]{4,}/.test(t)) return "That looks like gibberish!";
    if (/(.)\1{2,}/.test(t)) return "Please avoid repeating characters.";
    return null;
  };

  const handleLoginClick = () => {
    const err = validateName(inputName);
    if (err) { toast.error(err); return; }
    fetchUserData(inputName);
  };

  const fetchUserData = async (nameToFetch) => {
    try {
      const res = await fetch(`https://cerahya.onrender.com/api/user/${nameToFetch}`);
      if (res.ok) {
        const data = await res.json();
        setUserData(data);
        setUsername(nameToFetch);
        sessionStorage.setItem('username', nameToFetch);
      } else {
        toast.error("User not found! Try taking the quiz first.");
      }
    } catch { toast.error("Network error."); }
  };

  useEffect(() => { if (username) fetchUserData(username); }, [username]);

  const handleCompleteRoutine = async () => {
    try {
      const res  = await fetch('https://cerahya.onrender.com/api/user/complete-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await res.json();

      if (data.message.includes("Already completed")) {
        toast.info("Already completed today — come back tomorrow! 🌟");
      } else {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        toast.success(`+50 Points · ${data.streak}-Day Streak 🔥`);
      }
      fetchUserData(username);
    } catch { toast.error("Network error. Could not update routine."); }
  };

  const handleAnalyzeIngredients = async () => {
    if (!ingredientInput.trim()) { toast.warning("Paste some ingredients first!"); return; }
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const res  = await fetch('https://cerahya.onrender.com/api/analyze-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skinType: userData.skinType, ingredients: ingredientInput })
      });
      setAnalysisResult(await res.json());
    } catch { toast.error("Failed to analyze ingredients."); }
    finally { setIsAnalyzing(false); }
  };

  const handleAddCustomProduct = async () => {
    if (!customStep.trim() || !customProduct.trim()) { toast.warning("Fill in both fields!"); return; }
    try {
      const res = await fetch('https://cerahya.onrender.com/api/user/add-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, newProduct: { step: customStep, productName: customProduct, description: "Custom added." } })
      });
      if (res.ok) {
        toast.success(`Added "${customStep}" to your routine!`);
        setCustomStep(''); setCustomProduct(''); setShowAddForm(false);
        fetchUserData(username);
      } else toast.error("Failed to add product.");
    } catch { toast.error("Network error."); }
  };

  const handleDeleteProduct = async (idx) => {
    try {
      const res = await fetch('https://cerahya.onrender.com/api/user/delete-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, index: idx })
      });
      if (res.ok) { toast.success("Step removed!"); setProductToDelete(null); fetchUserData(username); }
      else toast.error("Failed to delete.");
    } catch { toast.error("Network error."); }
  };

  const handleSaveEdit = async (idx) => {
    if (!editStep.trim() || !editProduct.trim()) { toast.warning("Fields cannot be empty!"); return; }
    try {
      const res = await fetch('https://cerahya.onrender.com/api/user/edit-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, index: idx, updatedProduct: { ...userData.savedRoutine[idx], step: editStep, productName: editProduct } })
      });
      if (res.ok) { toast.success("Step updated!"); setEditingIndex(null); fetchUserData(username); }
      else toast.error("Failed to update.");
    } catch { toast.error("Network error."); }
  };

  const handleCompareClick = (product) => navigate('/compare', { state: { product } });

  /* ── LOGIN SCREEN ── */
  if (!username) return (
    <div className="ch-root">
      <div className="ch-blob ch-blob-1" /><div className="ch-blob ch-blob-2" />
      <header className="ch-header">
        <div className="ch-logo"><span className="ch-logo-mark">✦</span><span className="ch-logo-text">CeraHya</span></div>
        <div className="ch-tagline">Intelligent Skincare</div>
      </header>
      <main className="ch-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div className="ch-card ch-fade-in" style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🪞</div>
          <p className="ch-eyebrow">Your Dashboard</p>
          <h2 className="ch-heading">Welcome back</h2>
          <p className="ch-subtext">Enter your username to view your routine, streaks, and progress.</p>
          <input
            className="ch-input"
            type="text"
            placeholder="e.g., Riya"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoginClick()}
            style={{ width: '100%', marginBottom: '0.75rem' }}
          />
          <button className="ch-btn-primary" onClick={handleLoginClick} style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem' }}>
            Enter Dashboard
          </button>
          <button className="ch-btn-ghost" onClick={() => navigate('/')} style={{ width: '100%' }}>
            ↺ Take the Quiz Instead
          </button>
        </div>
      </main>
    </div>
  );

  /* ── LOADING ── */
  if (!userData) return (
    <div className="ch-root">
      <div className="ch-blob ch-blob-1" /><div className="ch-blob ch-blob-2" />
      <header className="ch-header">
        <div className="ch-logo"><span className="ch-logo-mark">✦</span><span className="ch-logo-text">CeraHya</span></div>
      </header>
      <main className="ch-main ch-generating" style={{ textAlign: 'center', paddingTop: '5rem' }}>
        <div className="ch-spinner-wrap"><div className="ch-spinner" /><span className="ch-spinner-icon">✦</span></div>
        <p className="ch-subtext" style={{ marginTop: '1rem' }}>Loading your dashboard…</p>
      </main>
    </div>
  );

  /* ── STREAK LEVEL LABEL ── */
  const streakLevel = userData.currentStreak >= 30 ? '🏆 Legendary'
    : userData.currentStreak >= 14 ? '💎 Dedicated'
    : userData.currentStreak >= 7  ? '🔥 On Fire'
    : userData.currentStreak >= 3  ? '⚡ Building'
    : '🌱 Starting';

  /* ── MAIN DASHBOARD ── */
  return (
    <div className="ch-root">
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={350} />}
      <div className="ch-blob ch-blob-1" /><div className="ch-blob ch-blob-2" />

      <header className="ch-header">
        <div className="ch-logo"><span className="ch-logo-mark">✦</span><span className="ch-logo-text">CeraHya</span></div>
        <div className="ch-tagline">Intelligent Skincare</div>
      </header>

      <main className="ch-main db-main">

        {/* ── WELCOME STRIP ── */}
        <div className="db-welcome ch-fade-in">
          <div>
            <p className="ch-eyebrow">Dashboard</p>
            <h2 className="ch-heading" style={{ marginBottom: 0 }}>Hello, {username} ✦</h2>
            <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.3rem', fontWeight: 300 }}>
              {userData.skinType} Skin · {streakLevel}
            </p>
          </div>
          <button className="db-complete-btn" onClick={handleCompleteRoutine}>
            <span>✅</span>
            <span>Complete Today's Routine</span>
          </button>
        </div>

        {/* ── STATS ROW ── */}
        <div className="db-stats ch-fade-in">
          <div className="db-stat-card">
            <span className="db-stat-icon">🔥</span>
            <div>
              <div className="db-stat-value">{userData.currentStreak}</div>
              <div className="db-stat-label">Day Streak</div>
            </div>
          </div>
          <div className="db-stat-divider" />
          <div className="db-stat-card">
            <span className="db-stat-icon">⭐</span>
            <div>
              <div className="db-stat-value">{userData.points}</div>
              <div className="db-stat-label">Points Earned</div>
            </div>
          </div>
          <div className="db-stat-divider" />
          <div className="db-stat-card">
            <span className="db-stat-icon">🧴</span>
            <div>
              <div className="db-stat-value">{userData.savedRoutine?.length || 0}</div>
              <div className="db-stat-label">Routine Steps</div>
            </div>
          </div>
        </div>

        {/* ── INGREDIENT SCANNER ── */}
        <div className="ch-card ch-fade-in db-section">
          <div className="db-section-header">
            <span className="db-section-icon">🧪</span>
            <div>
              <p className="ch-eyebrow" style={{ marginBottom: '0.1rem' }}>AI-Powered</p>
              <h3 className="db-section-title">Ingredient Scanner</h3>
            </div>
          </div>
          <p className="ch-subtext">
            Paste any product's ingredient list below. We'll check if it's safe for your <strong style={{ color: 'var(--green-mid)' }}>{userData.skinType}</strong> skin.
          </p>

          <textarea
            className="db-textarea"
            placeholder="e.g., Water, Glycerin, Niacinamide, Salicylic Acid, Fragrance…"
            value={ingredientInput}
            onChange={(e) => setIngredientInput(e.target.value)}
          />

          <button className="ch-btn-primary" onClick={handleAnalyzeIngredients} disabled={isAnalyzing}
            style={{ opacity: isAnalyzing ? 0.7 : 1 }}>
            {isAnalyzing
              ? <><span className="db-btn-spinner" /> Analyzing…</>
              : '✦ Analyze Ingredients'}
          </button>

          {analysisResult && (
            <div className={`db-analysis ${analysisResult.isSafe ? 'db-analysis--safe' : 'db-analysis--warn'}`}>
              <div className="db-analysis-title">
                <span>{analysisResult.isSafe ? '✅' : '⚠️'}</span>
                <span>{analysisResult.isSafe ? 'Generally Safe for Your Skin' : 'Proceed with Caution'}</span>
              </div>
              <p className="db-analysis-summary">{analysisResult.summary}</p>

              {analysisResult.goodIngredients.length > 0 && (
                <div className="db-ingredient-group">
                  <div className="db-ingredient-label db-ingredient-label--good">✦ Hero Ingredients</div>
                  {analysisResult.goodIngredients.map((ing, i) => (
                    <div key={i} className="db-ingredient-chip db-ingredient-chip--good">{ing}</div>
                  ))}
                </div>
              )}
              {analysisResult.badIngredients.length > 0 && (
                <div className="db-ingredient-group" style={{ marginTop: '0.75rem' }}>
                  <div className="db-ingredient-label db-ingredient-label--bad">✦ Red Flags</div>
                  {analysisResult.badIngredients.map((ing, i) => (
                    <div key={i} className="db-ingredient-chip db-ingredient-chip--bad">{ing}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── SAVED ROUTINE ── */}
        <div className="ch-card ch-fade-in db-section">
          <div className="db-section-header">
            <span className="db-section-icon">🌿</span>
            <div>
              <p className="ch-eyebrow" style={{ marginBottom: '0.1rem' }}>Personalised</p>
              <h3 className="db-section-title">My Saved Routine</h3>
            </div>
          </div>

          <div className="db-routine-list">
            {userData.savedRoutine.map((item, index) => (
              <div key={index} className="db-routine-item ch-fade-in" style={{ animationDelay: `${index * 0.06}s` }}>

                {/* EDIT MODE */}
                {editingIndex === index ? (
                  <div className="db-edit-form">
                    <input className="ch-input" value={editStep} onChange={(e) => setEditStep(e.target.value)} placeholder="Step type (e.g., Toner)" />
                    <input className="ch-input" value={editProduct} onChange={(e) => setEditProduct(e.target.value)} placeholder="Product name" />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="ch-btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleSaveEdit(index)}>Save</button>
                      <button className="ch-btn-ghost" style={{ flex: 1 }} onClick={() => setEditingIndex(null)}>Cancel</button>
                    </div>
                  </div>
                ) : productToDelete === index ? (
                  /* DELETE CONFIRM */
                  <div className="db-delete-confirm">
                    <p className="db-delete-text">Remove <strong>{item.step}</strong> from your routine?</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="db-btn-danger" onClick={() => handleDeleteProduct(index)}>Yes, Remove</button>
                      <button className="ch-btn-ghost" style={{ flex: 1 }} onClick={() => setProductToDelete(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  /* DEFAULT VIEW */
                  <div className="db-routine-row">
                    <div className="db-routine-badge">{stepIcons[index] || index + 1}</div>
                    <div className="db-routine-info">
                      <span className="db-routine-step">{item.step}</span>
                      <span className="db-routine-product">{item.productName}</span>
                    </div>
                    <div className="db-routine-actions">
                      <button className="db-icon-btn db-icon-btn--buy" onClick={() => handleCompareClick(item)} title="Compare Prices">🛒</button>
                      <button className="db-icon-btn db-icon-btn--edit" onClick={() => { setEditingIndex(index); setEditStep(item.step); setEditProduct(item.productName); }} title="Edit">✏️</button>
                      <button className="db-icon-btn db-icon-btn--del" onClick={() => setProductToDelete(index)} title="Remove">🗑️</button>
                    </div>
                  </div>
                )}

              </div>
            ))}
          </div>

          {/* ADD CUSTOM PRODUCT */}
          {!showAddForm ? (
            <button className="db-add-btn" onClick={() => setShowAddForm(true)}>＋ Add Extra Step</button>
          ) : (
            <div className="db-add-form">
              <input className="ch-input" placeholder="Step type (e.g., Eye Cream, Toner)" value={customStep} onChange={(e) => setCustomStep(e.target.value)} />
              <input className="ch-input" placeholder="Product name (e.g., COSRX Snail Mucin)" value={customProduct} onChange={(e) => setCustomProduct(e.target.value)} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="ch-btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleAddCustomProduct}>Save Step</button>
                <button className="ch-btn-ghost" style={{ flex: 1 }} onClick={() => setShowAddForm(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* ── LOGOUT ── */}
        <div style={{ textAlign: 'center' }}>
          {!showLogoutConfirm ? (
            <button className="ch-btn-ghost" onClick={() => setShowLogoutConfirm(true)} style={{ width: '100%', maxWidth: 300 }}>
              ← Log Out
            </button>
          ) : (
            <div className="db-logout-confirm ch-fade-in">
              <p className="db-logout-text">Are you sure you want to log out?</p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="db-btn-danger" onClick={() => { sessionStorage.clear(); setUsername(''); setAnalysisResult(null); setShowLogoutConfirm(false); }}>
                  Yes, Log Out
                </button>
                <button className="ch-btn-ghost" style={{ flex: 1 }} onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>

      </main>

      <footer className="ch-footer">
        <span>✦ CeraHya — Personalised Skincare for India</span>
      </footer>
    </div>
  );
}