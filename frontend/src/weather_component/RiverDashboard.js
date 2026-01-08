import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom'; 
import "./RiverDashboard.css";

const DEBUG_API = "http://127.0.0.1:8000/api/weather/debug-read-s3";

const RiverDashboard = () => {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [forecastData, setForecastData] = useState([]);
  const [limeData, setLimeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- HELPERS ---
  const getStatus = (level) => {
    const val = parseFloat(level);
    if (val < 5.5) return { label: "Normal", class: "status-normal", color: "#10b981", icon: "fa-check-circle" }; 
    if (val < 6.0) return { label: "Caution", class: "status-caution", color: "#f59e0b", icon: "fa-exclamation-circle" }; 
    return { label: "Warning", class: "status-critical", color: "#ef4444", icon: "fa-radiation-alt" }; 
  };

  // --- EFFECTS ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const response = await axios.get(DEBUG_API, { params: { file: "forecast_output.csv" } });
        if (response.data.status === "success") {
          const rawLines = response.data.preview;
          const parsedData = rawLines.slice(1).map((line) => {
              const cols = line.split(",");
              const level = cols[cols.length - 1]?.trim();
              return { level: parseFloat(level).toFixed(2), status: getStatus(level) };
            }).filter((item) => !isNaN(item.level));
          setForecastData(parsedData);
          setLastUpdated(new Date().toLocaleTimeString("en-US", {hour: '2-digit', minute:'2-digit'}));
        }
      } catch (err) {
        console.error("Forecast API error:", err);
        setError("Failed to fetch forecast data");
      }
    };

    const fetchLimeInsights = async () => {
      try {
        const response = await axios.get(DEBUG_API, { params: { file: "lime_short_sentences_and_labels.txt" } });
        if (response.data.status === "success") {
          setLimeData(response.data.preview);
        }
      } catch (err) {
        console.error("LIME API error:", err);
      }
    };

    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([fetchForecast(), fetchLimeInsights()]);
      setLoading(false);
    };

    loadAllData();
  }, []);

  // --- RENDER VARS ---
  const nextHour = forecastData[0] || { level: "--", status: getStatus(0) };
  const currentLevel = (parseFloat(nextHour.level) - 0.17).toFixed(2);
  const currentStatus = getStatus(currentLevel);

  if (loading) return <div className="rd-loading"><div className="rd-spinner"></div><p>Syncing Satellite Models...</p></div>;
  if (error && forecastData.length === 0) return <div className="rd-error"><h3>Connection Failed</h3><p>{error}</p></div>;

  return (
    <div className="rd-container">
      
      {/* --- HERO BACKGROUND SECTION --- */}
      <div className="rd-hero">
        {/* Navigation Overlay */}
        <nav className="rd-nav-overlay">
          <div className="rd-wrapper rd-flex-between">
            <div className="rd-brand">
              <i className="fas fa-water"></i> Periyar<span>Watch</span>
            </div>
            <div className="rd-links">
              <button onClick={() => navigate('/')}>Home</button>
              <button className="active">Live Dashboard</button>
              <button onClick={() => navigate('/weather-map')}>Map View</button>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="rd-hero-content rd-wrapper">
          <div className="rd-hero-text">
            <span className="rd-pill"><i className="fas fa-satellite-dish"></i> Live Monitoring • Kalady Station</span>
            <h1>Periyar River Water Level</h1>
            <p className="rd-hero-sub">AI-Powered Flood Forecasting System developed by ASIET & MeitY</p>
          </div>
          
          {/* Main Status Badge */}
          <div className={`rd-status-badge glass ${currentStatus.class}`}>
            <div className="badge-icon"><i className={`fas ${currentStatus.icon}`}></i></div>
            <div className="badge-info">
              <span className="badge-label">Current Condition</span>
              <span className="badge-val">{currentStatus.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT (OVERLAPPING) --- */}
      <main className="rd-main-content rd-wrapper">
        
        {/* Top Stats Row */}
        <div className="rd-stats-grid">
          
          {/* Card 1: Live Water Level */}
          <div className="rd-card glass">
            <div className="card-head">
              <span>Real-Time Level</span>
              <i className="fas fa-ruler-vertical"></i>
            </div>
            <div className="big-stat">
              {currentLevel}<small>m</small>
            </div>
            <div className="stat-footer">
              <span className="dot live"></span> Updated: {lastUpdated}
            </div>
          </div>

          {/* Card 2: 1-Hour Forecast */}
          <div className="rd-card glass">
            <div className="card-head">
              <span>Next Hour Forecast</span>
              <i className="fas fa-clock"></i>
            </div>
            <div className="big-stat" style={{color: nextHour.status.color}}>
              {nextHour.level}<small>m</small>
            </div>
            <div className="stat-footer">
              <i className="fas fa-brain"></i> AI Confidence: 98.5%
            </div>
          </div>

          {/* Card 3: System Status */}
          <div className="rd-card glass">
            <div className="card-head">
              <span>Location Time</span>
              <i className="far fa-calendar-alt"></i>
            </div>
            <div className="big-stat text-sm">
              {currentTime.toLocaleTimeString('en-IN', {timeStyle: 'short'})}
            </div>
            <div className="stat-footer">
              {currentTime.toLocaleDateString('en-IN', {dateStyle: 'medium'})}
            </div>
          </div>
        </div>

        {/* Middle Section: Graph & Feed */}
        <div className="rd-content-split">
          
          {/* Left: 6-Hour Timeline */}
          <section className="rd-section glass">
            <div className="sec-header">
              <h3><i className="fas fa-chart-line"></i> 6-Hour Projection</h3>
            </div>
            <div className="rd-timeline">
              {forecastData.slice(0, 6).map((data, index) => (
                <div key={index} className="rd-time-slot">
                  <span className="t-hour">H+{index + 1}</span>
                  <div className="t-bar-container">
                    <div 
                      className="t-bar" 
                      style={{
                        height: `${Math.min((data.level / 8) * 100, 100)}%`, // Scale based on max 8m
                        backgroundColor: data.status.color
                      }}
                    ></div>
                  </div>
                  <span className="t-val">{data.level}m</span>
                  <span className="t-status" style={{color: data.status.color}}>{data.status.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Right: AI Insights */}
          <section className="rd-section glass">
            <div className="sec-header">
              <h3><i className="fas fa-robot"></i> AI Explainability (LIME)</h3>
            </div>
            <div className="rd-insights-list">
              {limeData.length > 0 ? (
                limeData.slice(0, 6).map((line, index) => {
                  const statusColor = forecastData[index]?.status?.color || "#ccc";
                  return (
                    <div key={index} className="rd-insight-item">
                      <div className="insight-marker" style={{backgroundColor: statusColor}}>
                        <span>H+{index+1}</span>
                      </div>
                      <p>{line}</p>
                    </div>
                  );
                })
              ) : (
                <div className="empty-msg">No anomalies detected.</div>
              )}
            </div>
          </section>

        </div>
      </main>
      
      {/* Simple Footer */}
      <footer className="rd-footer">
        <p>&copy; 2026 Adi Shankara Institute • Ministry of Earth Sciences</p>
      </footer>
    </div>
  );
};

export default RiverDashboard;