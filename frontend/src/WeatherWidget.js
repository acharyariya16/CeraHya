import React, { useState } from 'react';
import { toast } from 'react-toastify';

export default function WeatherWidget() {
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getLocationAndTip = () => {
    // 1. Check if the browser supports GPS
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLoading(true);

    // 2. Ask the user for permission to use their location
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // 3. Send coordinates to our new Node.js backend
          const res = await fetch('https://cerahya.onrender.com/api/weather-tip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: latitude, lon: longitude })
          });
          
          const data = await res.json();
          setWeatherData(data); // Save the temp and AI tip!
          toast.success("Location synced! AI tip generated.");
          
        } catch (err) {
          toast.error("Failed to fetch weather tip from backend.");
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        setIsLoading(false);
        toast.warning("Please allow location access in your browser to get your weather tip!");
      }
    );
  };

  return (
    <div className="weather-widget" style={{ marginBottom: '25px', padding: '15px 20px', borderRadius: '15px', background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)', color: 'white', boxShadow: '0 8px 20px rgba(108, 92, 231, 0.3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        
        {/* Left Side: Text and AI Tip */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ☁️ Local Weather Skin Tip
          </h3>
          
          {weatherData ? (
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4', opacity: 0.95 }}>
              <strong style={{ fontSize: '18px', marginRight: '5px' }}>{weatherData.temp}°C</strong> 
              {weatherData.tip}
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: '13px', opacity: 0.8 }}>
              Enable location to get a real-time AI skincare tip for your current weather.
            </p>
          )}
        </div>
        
        {/* Right Side: The GPS Button */}
        {!weatherData && (
          <button 
            onClick={getLocationAndTip} 
            disabled={isLoading}
            style={{ 
              background: 'rgba(255,255,255,0.2)', 
              color: 'white', 
              border: '1px solid rgba(255,255,255,0.4)', 
              padding: '10px 15px', 
              borderRadius: '10px',
              fontSize: '13px', 
              margin: 0, 
              cursor: isLoading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {isLoading ? "⏳ Locating..." : "📍 Enable Location"}
          </button>
        )}
        
      </div>
    </div>
  );
}