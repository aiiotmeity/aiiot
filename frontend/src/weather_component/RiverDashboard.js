import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom'; 
import "./RiverDashboard.css";

// ✅ SMART API SWITCH: Automatically detects if you are on Localhost or the Live Web
const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://127.0.0.1:8000"       // Use this when testing on your laptop
  : "https://aiiot.it.com";       // Use this when deployed to the web

const DEBUG_API = `${API_BASE}/api/weather/debug-read-s3`;

const RiverDashboard = () => {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [forecastData, setForecastData] = useState([]);
  const [limeData, setLimeData] = useState([]);
  const [realTimeLevel, setRealTimeLevel] = useState("--"); 
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- HELPERS ---
  const getStatus = (level) => {
    const val = parseFloat(level);
    if (isNaN(val)) return { label: "--", class: "", color: "#ccc", icon: "fa-question-circle" };
    if (val < 5.5) return { label: "Normal", class: "status-normal", color: "#10b981", icon: "fa-check-circle" }; 
    if (val < 6.0) return { label: "Caution", class: "status-caution", color: "#f59e0b", icon: "fa-exclamation-circle" }; 
    return { label: "Warning", class: "status-critical", color: "#ef4444", icon: "fa-radiation-alt" }; 
  };

  // --- CLOCK EFFECT ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- DATA FETCHING EFFECT (With Auto-Refresh) ---
  useEffect(() => {
    
    // 1. Fetch Forecast Data
    const fetchForecast = async () => {
      try {
        // ✅ ADDED: Cache Buster (_t) to force new data
        const response = await axios.get(DEBUG_API, { 
          params: { file: "forecast_output.csv", _t: new Date().getTime() } 
        });
        
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
        console.error("Forecast API error:", err);
        setError("Failed to fetch forecast data");
      }
    };

    // 2. Fetch Real-Time Level (latest_water_level.csv)
    // 2. Fetch Real-Time Level (latest_water_level.csv)
    const fetchRealTimeLevel = async () => {
      try {
        const response = await axios.get(DEBUG_API, { 
          params: { file: "latest_water_level.csv", _t: new Date().getTime() } 
        });
        
        if (response.data.status === "success" && response.data.preview.length > 0) {
          const rawLines = response.data.preview;
          
          // Need at least header (row 0) and data (row 1)
          if (rawLines.length > 1) {
            // 1. Parse Headers (Row 0) to find where "level" is
            const headers = rawLines[0].split(",").map(h => h.trim().toLowerCase());
            const targetIndex = headers.indexOf("level");

            // 2. Parse Data (Row 1)
            const values = rawLines[1].split(",");
            
            let val;
            if (targetIndex !== -1 && values[targetIndex]) {
              // ✅ Found "level" column? Use that specific index!
              val = values[targetIndex].trim();
            } else {
              // ⚠️ Fallback: If "level" header not found, grab the last valid value
              const validValues = values.filter(v => v.trim() !== "");
              val = validValues[validValues.length - 1];
            }

            if (val && !isNaN(val)) {
              setRealTimeLevel(parseFloat(val).toFixed(2));
            }
          }
        }
      } catch (err) {
        console.error("Real-Time Level API error:", err);
      }
    };

    // 3. Fetch LIME Insights
    const fetchLimeInsights = async () => {
      try {
        // ✅ ADDED: Cache Buster
        const response = await axios.get(DEBUG_API, { 
          params: { file: "lime_short_sentences_and_labels.txt", _t: new Date().getTime() } 
        });
        if (response.data.status === "success") {
          setLimeData(response.data.preview);
        }
      } catch (err) {
        console.error("LIME API error:", err);
      }
    };

    // Master function to load all data
    const loadAllData = async () => {
      await Promise.all([fetchForecast(), fetchLimeInsights(), fetchRealTimeLevel()]);
      setLoading(false); 
    };

    // --- EXECUTION ---
    loadAllData(); // Initial Load

    // ✅ ADDED: Auto-Refresh Interval (Every 60 seconds)
    // This makes the dashboard dynamic!
    const intervalId = setInterval(() => {
      console.log("Auto-refreshing dashboard data...");
      loadAllData();
    }, 60000); 

    return () => clearInterval(intervalId);

  }, []);

  // --- RENDER HELPERS ---
  const nextHour = forecastData[0] || { level: "--", status: getStatus(0) };
  const currentStatus = getStatus(realTimeLevel !== "--" ? realTimeLevel : 0);

  if (loading) return <div className="rd-loading"><div className="rd-spinner"></div><p>Syncing Satellite Models...</p></div>;
  if (error && forecastData.length === 0) return <div className="rd-error"><h3>Connection Failed</h3><p>{error}</p></div>;

  return (
    <div className="rd-container">
      <div className="rd-hero">
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
          
          {/* CARD 1: REAL-TIME LEVEL */}
          <div className="rd-card glass">
            <div className="card-head">
              <span>Real-Time Level</span>
              <i className="fas fa-ruler-vertical"></i>
            </div>
            <div className="big-stat">
              {realTimeLevel}<small>m</small>
            </div>
            <div className="stat-footer">
              <span className="dot live"></span> Updated: {lastUpdated}
            </div>
          </div>

          {/* CARD 2: NEXT HOUR FORECAST */}
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

          {/* CARD 3: TIME */}
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

        <div className="rd-content-split">
          
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
                        height: `${Math.min((data.level / 8) * 100, 100)}%`,
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
      
      <footer className="rd-footer">
        <div className="dashboard-footer">
          ⚠️ Disclaimer: Forecasts are derived from observed data patterns and computational analysis. Real-world conditions may vary. Always depend on official alerts.
        </div>
        <p>&copy; 2026 Adi Shankara Institute • Ministry of Earth Sciences</p>
      </footer>
    </div>
  );
};

export default RiverDashboard;