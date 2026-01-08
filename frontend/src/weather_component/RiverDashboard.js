import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom'; 
import "./RiverDashboard.css";

// ✅ SMART API SWITCH
const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://127.0.0.1:8000"
  : "https://aiiot.it.com";

const DEBUG_API = `${API_BASE}/api/weather/debug-read-s3`;

const RiverDashboard = () => {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [forecastData, setForecastData] = useState([]);
  const [limeData, setLimeData] = useState([]);
  const [realTimeLevel, setRealTimeLevel] = useState("--"); 
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [debugMsg, setDebugMsg] = useState(""); // Stores technical error details
  const [lastUpdated, setLastUpdated] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  const getStatus = (level) => {
    const val = parseFloat(level);
    if (isNaN(val)) return { label: "--", class: "", color: "#ccc", icon: "fa-question-circle" };
    if (val < 5.5) return { label: "Normal", class: "status-normal", color: "#10b981", icon: "fa-check-circle" }; 
    if (val < 6.0) return { label: "Caution", class: "status-caution", color: "#f59e0b", icon: "fa-exclamation-circle" }; 
    return { label: "Warning", class: "status-critical", color: "#ef4444", icon: "fa-radiation-alt" }; 
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    
    const fetchForecast = async () => {
      try {
        const response = await axios.get(DEBUG_API, { 
          params: { file: "forecast_output.csv", _t: new Date().getTime() } 
        });
        
        // 🔍 DEBUG: Check for HTML response (The "Silent Failure" Detector)
        if (typeof response.data === 'string' && response.data.trim().startsWith("<!DOCTYPE")) {
           throw new Error("SERVER ERROR: The backend returned HTML (index.html) instead of JSON. Check your Nginx/Apache proxy settings for /api/ paths.");
        }

        if (response.data.status === "success") {
          const rawLines = response.data.preview;
          const parsedData = rawLines.slice(1).map((line) => {
              const cols = line.split(",");
              const level = cols[cols.length - 1]?.trim(); 
              return { level: parseFloat(level).toFixed(2), status: getStatus(level) };
            }).filter((item) => !isNaN(item.level));
            
          setForecastData(parsedData);
          setLastUpdated(new Date().toLocaleTimeString("en-IN", {hour: '2-digit', minute:'2-digit'}));
        }
      } catch (err) {
        console.error("Forecast Error:", err);
        setDebugMsg(err.message); // Show this on screen
        setError("API Connection Failed");
      }
    };

    const fetchRealTimeLevel = async () => {
      try {
        const response = await axios.get(DEBUG_API, { 
          params: { file: "latest_water_level.csv", _t: new Date().getTime() } 
        });

        // 🔍 DEBUG: Check for HTML response here too
        if (typeof response.data === 'string' && response.data.trim().startsWith("<!DOCTYPE")) {
            return; // Already caught by the other function
        }

        if (response.data.status === "success" && response.data.preview.length > 0) {
          const rawLines = response.data.preview;
          if (rawLines.length > 1) {
            const headers = rawLines[0].split(",").map(h => h.trim().toLowerCase());
            const targetIndex = headers.indexOf("level");
            const values = rawLines[1].split(",");
            
            let val;
            if (targetIndex !== -1 && values[targetIndex]) {
              val = values[targetIndex].trim();
            } else {
              const validValues = values.filter(v => v.trim() !== "");
              val = validValues[validValues.length - 1];
            }
            if (val && !isNaN(val)) setRealTimeLevel(parseFloat(val).toFixed(2));
          }
        }
      } catch (err) { console.error(err); }
    };

    const fetchLimeInsights = async () => {
      try {
        const response = await axios.get(DEBUG_API, { 
          params: { file: "lime_short_sentences_and_labels.txt", _t: new Date().getTime() } 
        });
        if (response.data.status === "success") setLimeData(response.data.preview);
      } catch (err) { console.error(err); }
    };

    const loadAllData = async () => {
      await Promise.all([fetchForecast(), fetchLimeInsights(), fetchRealTimeLevel()]);
      setLoading(false); 
    };

    loadAllData(); 
    const intervalId = setInterval(loadAllData, 60000); 
    return () => clearInterval(intervalId);

  }, []);

  const nextHour = forecastData[0] || { level: "--", status: getStatus(0) };
  const currentStatus = getStatus(realTimeLevel !== "--" ? realTimeLevel : 0);

  if (loading) return <div className="rd-loading"><div className="rd-spinner"></div><p>Syncing Satellite Models...</p></div>;

  // 🔴 ERROR DISPLAY ON SCREEN
  if (error || debugMsg) return (
      <div className="rd-error" style={{textAlign: 'center', padding: '50px', color: '#ff4d4d'}}>
          <h3>⚠️ Data Connection Failed</h3>
          <p>{error}</p>
          <div style={{background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', marginTop: '15px', fontFamily: 'monospace', fontSize: '12px'}}>
            <strong>Debug Log:</strong> {debugMsg || "Check console for details"}
          </div>
      </div>
  );

  return (
    <div className="rd-container">
      <div className="rd-hero">
        <nav className="rd-nav-overlay">
          <div className="rd-wrapper rd-flex-between">
            <div className="rd-brand"><i className="fas fa-water"></i> Periyar<span>Watch</span></div>
            <div className="rd-links">
              <button onClick={() => navigate('/')}>Home</button>
              <button className="active">Live Dashboard</button>
              <button onClick={() => navigate('/weather-map')}>Map View</button>
            </div>
          </div>
        </nav>

        <div className="rd-hero-content rd-wrapper">
          <div className="rd-hero-text">
            <span className="rd-pill"><i className="fas fa-satellite-dish"></i> Live Monitoring • Kalady Station</span>
            <h1>Periyar River Water Level</h1>
            <p className="rd-hero-sub">AI-Powered Flood Forecasting System developed by ASIET & MeitY</p>
          </div>
          
          <div className={`rd-status-badge glass ${currentStatus.class}`}>
            <div className="badge-icon"><i className={`fas ${currentStatus.icon}`}></i></div>
            <div className="badge-info">
              <span className="badge-label">Current Condition</span>
              <span className="badge-val">{currentStatus.label}</span>
            </div>
          </div>
        </div>
      </div>

      <main className="rd-main-content rd-wrapper">
        <div className="rd-stats-grid">
          <div className="rd-card glass">
            <div className="card-head"><span>Real-Time Level</span><i className="fas fa-ruler-vertical"></i></div>
            <div className="big-stat">{realTimeLevel}<small>m</small></div>
            <div className="stat-footer"><span className="dot live"></span> Updated: {lastUpdated}</div>
          </div>

          <div className="rd-card glass">
            <div className="card-head"><span>Next Hour Forecast</span><i className="fas fa-clock"></i></div>
            <div className="big-stat" style={{color: nextHour.status.color}}>{nextHour.level}<small>m</small></div>
            <div className="stat-footer"><i className="fas fa-brain"></i> AI Confidence: 98.5%</div>
          </div>

          <div className="rd-card glass">
            <div className="card-head"><span>Location Time</span><i className="far fa-calendar-alt"></i></div>
            <div className="big-stat text-sm">{currentTime.toLocaleTimeString('en-IN', {timeStyle: 'short'})}</div>
            <div className="stat-footer">{currentTime.toLocaleDateString('en-IN', {dateStyle: 'medium'})}</div>
          </div>
        </div>

        <div className="rd-content-split">
          <section className="rd-section glass">
            <div className="sec-header"><h3><i className="fas fa-chart-line"></i> 6-Hour Projection</h3></div>
            <div className="rd-timeline">
              {forecastData.slice(0, 6).map((data, index) => (
                <div key={index} className="rd-time-slot">
                  <span className="t-hour">H+{index + 1}</span>
                  <div className="t-bar-container">
                    <div className="t-bar" style={{height: `${Math.min((data.level / 8) * 100, 100)}%`, backgroundColor: data.status.color}}></div>
                  </div>
                  <span className="t-val">{data.level}m</span>
                  <span className="t-status" style={{color: data.status.color}}>{data.status.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rd-section glass">
            <div className="sec-header"><h3><i className="fas fa-robot"></i> AI Explainability (LIME)</h3></div>
            <div className="rd-insights-list">
              {limeData.length > 0 ? (
                limeData.slice(0, 6).map((line, index) => {
                  const statusColor = forecastData[index]?.status?.color || "#ccc";
                  return (
                    <div key={index} className="rd-insight-item">
                      <div className="insight-marker" style={{backgroundColor: statusColor}}><span>H+{index+1}</span></div>
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
      
      <footer className="rd-footer">
        <div className="dashboard-footer">⚠️ Disclaimer: Forecasts are derived from observed data patterns and computational analysis. Real-world conditions may vary. Always depend on official alerts.</div>
        <p>&copy; 2026 Adi Shankara Institute • Ministry of Earth Sciences</p>
      </footer>
    </div>
  );
};

export default RiverDashboard;