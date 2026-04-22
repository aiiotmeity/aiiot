import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from 'react-router-dom'; 
import "./RiverDashboard.css";
import dataloggerImage from "../assets/datalogger.png";

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://aiiot-1.onrender.com'
  : 'http://localhost:8000';

const DEBUG_API = `${API_BASE_URL}/api/weather/debug-read-s3`;

const RiverDashboard = () => {
  const navigate = useNavigate();
  
  // --- ALL ORIGINAL STATES PRESERVED ---
  const [forecastData, setForecastData] = useState([]);
  const [limeData, setLimeData] = useState([]);
  const [realTimeLevel, setRealTimeLevel] = useState("--"); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [debugMsg, setDebugMsg] = useState(""); 
  const [lastUpdated, setLastUpdated] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [apiErrorBanner, setApiErrorBanner] = useState(false);

  const getStatus = (level) => {
    const val = parseFloat(level);
    if (isNaN(val)) return { label: "--", class: "status-unknown", color: "#ccc", icon: "fa-question-circle" };
    if (val < 3) return { label: "Normal", class: "status-normal", color: "#10b981", icon: "fa-check-circle" }; 
    if (val < 8.0) return { label: "Caution", class: "status-caution", color: "#f59e0b", icon: "fa-exclamation-circle" }; 
    return { label: "Warning", class: "status-critical", color: "#ef4444", icon: "fa-radiation-alt" }; 
  };

  // --- ALL ORIGINAL USEEFFECTS PRESERVED ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const response = await fetchWithRetry(DEBUG_API, { 
          params: { file: "forecast_output.csv", _t: new Date().getTime() } 
        });
        if (response.data && response.data.status === "success") {
          const rawLines = response.data.preview;
          const parsedData = rawLines.map((line) => {
            const cols = line.split(",");
            const rawVal = cols[cols.length - 1]?.trim();
            if (!rawVal || isNaN(rawVal)) return { level: NaN };
            let displayVal = rawVal;
            if (rawVal.includes('.')) {
                const parts = rawVal.split('.');
                if (parts[1].length > 2) { displayVal = `${parts[0]}.${parts[1].substring(0, 2)}`; }
            }
            return { level: displayVal, status: getStatus(rawVal) };
          }).filter((item) => !isNaN(item.level));            
          setForecastData(parsedData);
          setLastUpdated(new Date().toLocaleTimeString("en-IN", {hour: '2-digit', minute:'2-digit'}));
        }
      } catch (err) {
        setDebugMsg(err.message || String(err));
        setApiErrorBanner(true);
      }
    };

    const fetchRealTimeLevel = async () => {
      try {
        const response = await fetchWithRetry(DEBUG_API, { 
          params: { file: "hourly_averages/STA_01_MASTER_LOG.csv", _t: new Date().getTime() } 
        });
        if (response.data.status === "success" && response.data.preview.length > 0) {
          const rawLines = response.data.preview;
          const lastLine = rawLines[rawLines.length - 1];
          const values = lastLine.split(",");
          const headers = rawLines[0].split(",").map(h => h.trim().toLowerCase());
          const targetIndex = headers.findIndex(h => h.replace(/[^a-z0-9]/g, '') === 'wlm');
          let val = (targetIndex !== -1 && values[targetIndex]) ? values[targetIndex].trim() : values[values.length - 1];
          if (val && !isNaN(val)) setRealTimeLevel(parseFloat(val).toFixed(2));
        }
      } catch (err) { setApiErrorBanner(true); }
    };

    const fetchLimeInsights = async () => {
      try {
        const response = await fetchWithRetry(DEBUG_API, { 
          params: { file: "lime_short_sentences_and_labels.txt", _t: new Date().getTime() } 
        });
        if (response.data && response.data.status === "success") setLimeData(response.data.preview);
      } catch (err) { setApiErrorBanner(true); }
    };

    const loadAllData = async () => {
      await Promise.all([fetchForecast(), fetchLimeInsights(), fetchRealTimeLevel()]);
      setLoading(false); 
    };

    loadAllData(); 
    const intervalId = setInterval(loadAllData, 60000); 
    return () => clearInterval(intervalId);
  }, []);

  async function fetchWithRetry(url, axiosConfig = {}, retries = 3, backoff = 800) {
    let lastErr;
    for (let i = 0; i < retries; i++) {
      try {
        const resp = await axios.get(url, axiosConfig);
        setApiErrorBanner(false);
        return resp;
      } catch (err) {
        lastErr = err;
        await new Promise((res) => setTimeout(res, backoff * (i + 1)));
      }
    }
    throw lastErr;
  }

  const nextHour = forecastData[0] || { level: "--", status: getStatus(0) };
  const currentStatus = getStatus(realTimeLevel !== "--" ? realTimeLevel : 0);

  if (loading) return <div className="rd-loading"><div className="rd-spinner"></div><p>Syncing Government Servers...</p></div>;

  return (
    <div className="rd-advanced-page">
      <style>
        {`:root { --hero-bg-image: url(${dataloggerImage}); }`}
      </style>
      {/* --- HERO SECTION (MATCHING PROJECTDETAIL) --- */}
      <section className="rd-hero-fullscreen">
        <div className="hero-overlay-gradient"></div>
        
        <nav className="rd-navbar">
          <div className="rd-container-inner rd-flex-between">
            <div className="rd-nav-links">
              <button onClick={() => navigate('/weather-home')}>Home</button>
              
            </div>
            
           
            {/* <Link to="/" className="rd-logo">Periyar River Flood Monitoring</Link>
             */}
           
          </div>
        </nav>
  <br></br>
        <div className="hero-content-wrapper">
          <div className="hero-pill">Real-Time Hydrological Monitoring</div>
          <h1 className="hero-main-title">Periyar River Water Level</h1>
          <p className="hero-sub-text">Advanced AI-powered flood forecasting system providing 6-hour predictive insights for the Kalady region.</p>
          
          <div className={`rd-status-card-top ${currentStatus.class}`}>
            <i className={`fas ${currentStatus.icon}`}></i>
            <div>
              <span className="status-label">Current Condition</span>
              <h3 className="status-val">{currentStatus.label}</h3>
            </div>
          </div>
        </div>
      </section>

      {/* --- MAIN DASHBOARD CONTENT --- */}
      <div className="rd-content-container">
        
        {/* 1. KEY STATS GRID */}
        <div className="rd-stats-grid">
          <div className="rd-glass-card">
            <div className="card-top"><span>Live Level</span><i className="fas fa-ruler-vertical"></i></div>
            <div className="big-stat">{realTimeLevel}<small>m</small></div>
            <div className="card-foot"><span className="live-dot"></span> Last Updated: {lastUpdated}</div>
          </div>

          <div className="rd-glass-card">
            <div className="card-top"><span>1Hr Forecast</span><i className="fas fa-bolt"></i></div>
            <div className="big-stat" style={{color: nextHour.status.color}}>{nextHour.level}<small>m</small></div>
            <div className="card-foot"><i className="fas fa-brain"></i> AI Accuracy: 98.5%</div>
          </div>

          <div className="rd-glass-card">
            <div className="card-top"><span>Station Time</span><i className="far fa-clock"></i></div>
            <div className="big-stat-time">{currentTime.toLocaleTimeString('en-IN', {timeStyle: 'short'})}</div>
            <div className="card-foot">{currentTime.toLocaleDateString('en-IN', {dateStyle: 'medium'})}</div>
          </div>
        </div>

        {/* 2. PROJECTION & AI ANALYSIS */}
        <div className="rd-split-layout">
          

          {/* Timeline Section - Updated for better clickability */}
          <section className="rd-dashboard-section">
            <div className="section-header">
              <h3><i className="fas fa-chart-area"></i> 6-Hour Water Level Projection</h3>
              <p className="section-subtitle section-subtitle-after">Click any hour to view detailed impact analysis</p>
            </div>
            <br></br>
            <br>
            </br>
            <div className="rd-timeline-scroll">
              <div className="rd-timeline-flex">
                {forecastData.slice(-7).map((data, index) => {
                  const levelNumber = parseFloat(data.level);
                  return (
                    <div 
                      key={index} 
                      className="rd-time-node clickable-node" 
                      onClick={() => !isNaN(levelNumber) && navigate(`/flood-analysis?level=${data.level}`)}
                      title={`View analysis for ${data.level}m`}
                    >
                      <span className="time-label">H+{index + 1}</span>
                      <div className="bar-track">
                        <div 
                          className="bar-fill" 
                          style={{ 
                            height: `${Math.min((levelNumber / 8) * 100, 100)}%`, 
                            backgroundColor: data.status.color 
                          }}
                        >
                          <div className="bar-glow"></div>
                        </div>
                      </div>
                      <span className="val-label">{data.level}m</span>
                      <div className="impact-chip" style={{background: data.status.color + '20', color: data.status.color}}>
                        {data.status.label}
                      </div>
                      
                      {/* Explicit Action Button for User Understanding */}
                      <button className="node-analysis-btn">
                        Details <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            
          </section>


          {/* AI LIME Section */}
          <section className="rd-dashboard-section ai-explainability-section">
            <div className="section-header">
              <h3><i className="fas fa-robot"></i> AI Explainability (LIME)</h3>
            </div>
            <div className="rd-lime-list">
              {limeData.length > 0 ? limeData.slice(0, 5).map((line, index) => {
                const match = line.match(/^\[(GREEN|ORANGE|RED|WARNING)\]/);
                const tag = match ? match[0] : "";
                const cleanText = line.replace(tag, "").trim();
                return (
                  <div key={index} className="rd-lime-item">
                    <div className="lime-index">H+{index + 1}</div>
                    <p className="lime-desc">{cleanText}</p>
                  </div>
                );
              }) : <p className="empty-state">Calibration in progress...</p>}
            </div>
          </section>

        </div>
      </div>




         
      {/* --- ADVANCED FOOTER (MATCHING PROJECTDETAIL) --- */}
     <footer className="footer" style={{ background: '#0f172a', color: '#cbd5e1', padding: '3rem 0 1rem 0' }}>
  <div className="footer-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
    <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
      
      {/* 1. PROJECT INFO */}
      <div className="footer-section">
        <h5 style={{ fontWeight: 700, color: 'white', marginBottom: '1rem', fontSize: '1.1rem' }}>AI-IoT Innovations</h5>
        <p style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>Advancing the integration of AI and IoT technologies for a smarter tomorrow.</p>
      </div>

      {/* 2. QUICK LINKS */}
      <div className="footer-section">
        
      </div>

      {/* 3. CONTACT INFORMATION */}
      <div className="footer-section">
        <h5 style={{ fontWeight: 700, color: 'white', marginBottom: '1rem', fontSize: '1.1rem' }}>Contact Information</h5>
        <p style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
          Adi Shankara Institute of Engineering and Technology<br />
          Kalady 683574, Ernakulam<br />
          Kerala, India
        </p>
        <p style={{ fontSize: '0.875rem', marginTop: '1rem' }}>
          <strong style={{ color: 'white' }}>Email:</strong> aiiot@adishankara.ac.in<br />
          <strong style={{ color: 'white' }}>Phone:</strong> 9846900310
        </p>
      </div>

    </div>

    {/* BOTTOM LINE */}
    <div className="footer-bottom" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', textAlign: 'center' }}>
      <p style={{ fontSize: '0.75rem' }}>
        © {new Date().getFullYear()} Periyar Flood Monitoring System | 
        Center for AI-IoT Innovations. All rights reserved.
      </p>
    </div>
  </div>
</footer>
    </div>
  );
};

export default RiverDashboard;