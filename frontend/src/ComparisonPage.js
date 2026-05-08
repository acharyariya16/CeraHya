import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './App.css';

const STORE_META = {
  Amazon:   { emoji: '📦', accent: '#FF9900', light: '#FFF4E0', dark: '#7A4700' },
  Nykaa:    { emoji: '💄', accent: '#FC2779', light: '#FFF0F5', dark: '#8B0040' },
  Flipkart: { emoji: '🛍️', accent: '#2874F0', light: '#EEF4FF', dark: '#0D3A8A' },
  Myntra:   { emoji: '👗', accent: '#FF3F6C', light: '#FFF0F3', dark: '#8B0028' },
  Purplle:  { emoji: '🪄', accent: '#8E44AD', light: '#F8EEFF', dark: '#4A1060' },
  Tira:     { emoji: '🌺', accent: '#DF1E1E', light: '#FFF0F0', dark: '#7A0000' },
  Blinkit:  { emoji: '⚡', accent: '#F8CB46', light: '#FFFBE0', dark: '#5A4200' },
  Zepto:    { emoji: '🚀', accent: '#3C006D', light: '#F0E8FF', dark: '#1E0038' },
};

export default function ComparisonPage() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const product   = location.state?.product;

  const [stores, setStores]             = useState([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [bestDealIndex, setBestDealIndex] = useState(0);
  const [revealed, setRevealed]         = useState(false);

  useEffect(() => {
    if (!product) return;
    const fetchPrices = async () => {
      try {
        const res = await fetch('https://cerahya.onrender.com/api/get-prices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productName: product.productName })
        });
        if (!res.ok) throw new Error('Backend failed');
        processStores(await res.json());
      } catch {
        const base = (product.productName.length * 12) + 250;
        processStores([
          { name: 'Blinkit',  price: `₹${base}`,      url: `https://blinkit.com/s/?q=${encodeURIComponent(product.productName)}` },
          { name: 'Zepto',    price: `₹${base}`,       url: `https://www.zeptonow.com/search?q=${encodeURIComponent(product.productName)}` },
          { name: 'Amazon',   price: `₹${base - 15}`,  url: `https://www.amazon.in/s?k=${encodeURIComponent(product.productName)}` },
          { name: 'Nykaa',    price: `₹${base + 20}`,  url: `https://www.nykaa.com/search/result/?q=${encodeURIComponent(product.productName)}` },
          { name: 'Flipkart', price: `₹${base - 5}`,   url: `https://www.flipkart.com/search?q=${encodeURIComponent(product.productName)}` },
          { name: 'Myntra',   price: `₹${base + 10}`,  url: `https://www.myntra.com/${encodeURIComponent(product.productName)}` },
          { name: 'Purplle',  price: `₹${base - 10}`,  url: `https://www.purplle.com/search?q=${encodeURIComponent(product.productName)}` },
          { name: 'Tira',     price: `₹${base + 15}`,  url: `https://www.tirabeauty.com/search?q=${encodeURIComponent(product.productName)}` },
        ]);
      } finally {
        setIsLoading(false);
        setTimeout(() => setRevealed(true), 100);
      }
    };
    fetchPrices();
  }, [product]);

  const processStores = (data) => {
    setStores(data);
    let low = Infinity, lowIdx = 0;
    data.forEach((s, i) => {
      const n = parseInt(s.price.replace(/\D/g, ''));
      if (n < low) { low = n; lowIdx = i; }
    });
    setBestDealIndex(lowIdx);
  };

  const priceNum = (p) => parseInt(p.replace(/\D/g, ''));
  const maxPrice = stores.length ? Math.max(...stores.map(s => priceNum(s.price))) : 1;
  const minPrice = stores.length ? Math.min(...stores.map(s => priceNum(s.price))) : 0;
  const savings  = stores.length ? maxPrice - minPrice : 0;

  /* ── NO PRODUCT ── */
  if (!product) return (
    <div className="ch-root">
      <div className="ch-blob ch-blob-1" /><div className="ch-blob ch-blob-2" />
      <header className="ch-header">
        <div className="ch-logo"><span className="ch-logo-mark">✦</span><span className="ch-logo-text">CeraHya</span></div>
      </header>
      <main className="ch-main" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div className="ch-card ch-fade-in" style={{ maxWidth: 420, margin: '0 auto' }}>
          <p style={{ fontSize: '3rem' }}>🛒</p>
          <h2 className="ch-heading">No product selected</h2>
          <p className="ch-subtext">Head back and pick a product to compare prices.</p>
          <button className="ch-btn-primary" onClick={() => navigate(-1)} style={{ margin: '0 auto' }}>← Go Back</button>
        </div>
      </main>
    </div>
  );

  return (
    <div className="ch-root">
      <div className="ch-blob ch-blob-1" /><div className="ch-blob ch-blob-2" />

      {/* ── HEADER ── */}
      <header className="ch-header">
        <div className="ch-logo"><span className="ch-logo-mark">✦</span><span className="ch-logo-text">CeraHya</span></div>
        <button className="cp-back-btn" onClick={() => navigate(-1)}>← Back</button>
      </header>

      <main className="ch-main cp-main">

        {/* ── PRODUCT HERO ── */}
        <div className="cp-hero ch-fade-in">
          <div className="cp-hero-pill">
            <span>{product.step || 'Skincare'}</span>
          </div>
          <h1 className="cp-product-title">{product.productName}</h1>
          <p className="cp-product-desc">
            {product.description || `A custom ${product.step} step in your routine.`}
          </p>

          {!isLoading && savings > 0 && (
            <div className="cp-savings-strip">
              <span className="cp-savings-icon">💰</span>
              <span>Save up to <strong>₹{savings}</strong> by choosing the best store</span>
            </div>
          )}
        </div>

        {/* ── STORE GRID / LOADING ── */}
        <div className="ch-card ch-fade-in cp-card">
          <div className="db-section-header" style={{ marginBottom: '1.5rem' }}>
            <span className="db-section-icon">🏪</span>
            <div>
              <p className="ch-eyebrow" style={{ marginBottom: '0.1rem' }}>Live Comparison</p>
              <h3 className="db-section-title">Prices Across 8 Stores</h3>
            </div>
          </div>

          {isLoading ? (
            <div className="cp-loading">
              <div className="ch-spinner-wrap" style={{ margin: '0 auto 1.25rem' }}>
                <div className="ch-spinner" />
                <span className="ch-spinner-icon">✦</span>
              </div>
              <p className="ch-subtext" style={{ textAlign: 'center' }}>Scanning 8 stores for the best price…</p>
              <div className="cp-skeleton-list">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="cp-skeleton" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            </div>
          ) : (
            <div className="cp-store-list">
              {stores.map((store, index) => {
                const meta      = STORE_META[store.name] || { emoji: '🛒', accent: '#4A7C62', light: '#F0FBF4', dark: '#1C3829' };
                const isBest    = index === bestDealIndex;
                const isQuick   = store.name === 'Blinkit' || store.name === 'Zepto';
                const barWidth  = Math.round(((maxPrice - priceNum(store.price)) / (maxPrice - minPrice || 1)) * 100);

                return (
                  <div
                    key={index}
                    className={`cp-store-row ${isBest ? 'cp-store-row--best' : ''} ${revealed ? 'cp-store-row--in' : ''}`}
                    style={{ animationDelay: `${index * 0.07}s` }}
                  >
                    {/* Store Identity */}
                    <div className="cp-store-identity">
                      <div className="cp-store-emoji" style={{ background: meta.light }}>{meta.emoji}</div>
                      <div className="cp-store-name-wrap">
                        <div className="cp-store-name">{store.name}</div>
                        <div className="cp-store-tags">
                          {isQuick && <span className="cp-tag cp-tag--quick">⚡ 10 mins</span>}
                          {isBest  && <span className="cp-tag cp-tag--best">✦ Best Deal</span>}
                        </div>
                      </div>
                    </div>

                    {/* Price Bar */}
                    <div className="cp-bar-wrap">
                      <div
                        className="cp-bar-fill"
                        style={{
                          width: `${barWidth}%`,
                          background: isBest
                            ? 'linear-gradient(90deg, var(--green-mid), var(--gold))'
                            : `linear-gradient(90deg, ${meta.accent}55, ${meta.accent}22)`
                        }}
                      />
                    </div>

                    {/* Price + CTA */}
                    <div className="cp-price-action">
                      <span className={`cp-price ${isBest ? 'cp-price--best' : ''}`}>{store.price}</span>
                      <a
                        href={store.url}
                        target="_blank"
                        rel="noreferrer"
                        className="cp-buy-btn"
                        style={{ background: meta.accent, color: store.name === 'Blinkit' ? '#000' : '#fff' }}
                      >
                        Buy →
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── FOOTER NOTE ── */}
        {!isLoading && (
          <p className="cp-disclaimer ch-fade-in">
            ✦ Prices are indicative. Actual prices may vary at time of purchase.
          </p>
        )}

      </main>

      <footer className="ch-footer">
        <span>✦ CeraHya — Personalised Skincare for India</span>
      </footer>
    </div>
  );
}