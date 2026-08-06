import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Network Base Endpoint Configuration matching your system standards
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://aiiot-1.onrender.com'
  : 'http://localhost:8000';

// ─── SYSTEM ID & SECTION TRANSLATION DICTIONARY ───
const zoneLocationMapping = {
  "Node1_Zone_Demand": {
    sectionTitle: "SECTION 1",
    label: "Zone ID: Node 1",
    color: "#ef4444",
    glow: "rgba(239, 68, 68, 0.25)",
    bgGradient: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)"
  },
  "Node2_Zone_Demand": {
    sectionTitle: "SECTION 1",
    label: "Zone ID: Node 2",
    color: "#3b82f6",
    glow: "rgba(59, 130, 246, 0.25)",
    bgGradient: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)"
  },
  "Node5_Zone_Demand": {
    sectionTitle: "SECTION 2",
    label: "Zone ID: Node 5",
    color: "#10b981",
    glow: "rgba(16, 185, 129, 0.25)",
    bgGradient: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)"
  },
  "Node7_Zone_Demand": {
    sectionTitle: "SECTION 3 ",
    label: "Zone ID: Node 7",
    color: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.25)",
    bgGradient: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)"
  }
};

const DemandForecasting = () => {
  const navigate = useNavigate();
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLiveDemandData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/weather/water-demand`);      
      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        setForecastData(result);
        setError(null);
      } else {
        throw new Error(result.error || 'Failed parsing live data arrays.');
      }
    } catch (err) {
      console.error('Error connecting to hydraulic telemetry stream:', err);
      setError(err.message || 'Failed connecting to real-time S3 telemetry streams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveDemandData();
    const telemetryInterval = setInterval(fetchLiveDemandData, 30000);
    return () => clearInterval(telemetryInterval);
  }, []);

  // ─── DESIGN TOKENS (visual layer only — no data/behavior lives here) ───
  const palette = {
    bg: '#F1F5F9',
    bgGrid: 'rgba(15, 23, 42, 0.035)',
    panel: '#FFFFFF',
    panelAlt: '#F8FAFC',
    line: '#E2E8F0',
    text: '#0F172A',
    textMuted: '#64748B',
    textFaint: '#94A3B8',
    accent: '#2563EB',
    accentSoft: '#EFF6FF'
  };
  const fontDisplay = '"Space Grotesk", "Inter", "Segoe UI", system-ui, sans-serif';
  const fontBody = '"Inter", "Segoe UI", system-ui, sans-serif';
  const fontMono = '"JetBrains Mono", "SFMono-Regular", Consolas, monospace';

  return (
    <div className="demand-forecasting-container" style={{
      padding: '32px 24px',
      fontFamily: fontBody,
      maxWidth: '1440px',
      margin: '0 auto',
      backgroundColor: palette.bg,
      backgroundImage: `linear-gradient(${palette.bgGrid} 1px, transparent 1px), linear-gradient(90deg, ${palette.bgGrid} 1px, transparent 1px)`,
      backgroundSize: '36px 36px',
      minHeight: '100vh',
      color: palette.text
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        @keyframes df-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes df-scan { 0% { transform: translateX(-100%); } 100% { transform: translateX(420%); } }

        @media (prefers-reduced-motion: reduce) {
          .df-spinner, .df-scanbar { animation: none !important; }
        }
      `}</style>

      {/* Navigation Row */}
      <button 
        className="btn btn-secondary" 
        onClick={() => navigate('/weather-home')}
        style={{ marginBottom: '28px', cursor: 'pointer', padding: '11px 18px', borderRadius: '8px', border: `1px solid ${palette.line}`, backgroundColor: palette.panel, fontWeight: '600', fontFamily: fontBody, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px', color: palette.textMuted, letterSpacing: '0.2px', boxShadow: '0 1px 2px rgba(15,23,42,0.04)', transition: 'all 0.2s ease' }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = palette.accent; e.currentTarget.style.color = palette.accent; e.currentTarget.style.transform = 'translateX(-2px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = palette.line; e.currentTarget.style.color = palette.textMuted; e.currentTarget.style.transform = 'none'; }}
      >
        <i className="fas fa-arrow-left" style={{ fontSize: '12px' }}></i> Home
      </button>

      {/* ─── ADVANCED VISUAL HEADER CARD WITH BACKGROUND IMAGE IMAGE ─── */}
      <header style={{ 
        position: 'relative', 
        borderRadius: '18px', 
        overflow: 'hidden', 
        marginBottom: '36px', 
        boxShadow: '0 20px 40px -18px rgba(15,23,42,0.35)'
      }}>
        {/* Background Image Layer referencing the requested public production build location */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "url('/sensor_modules/distribution.jpeg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 1
        }}></div>
        
        {/* Deep linear gradient overlay to guarantee rich contrast over the background asset */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(120deg, rgba(15,23,42,0.82) 0%, rgba(30,41,59,0.55) 55%, rgba(15,23,42,0.78) 100%)',
          zIndex: 2
        }}></div>

        {/* Content Box */}
        <div style={{ position: 'relative', zIndex: 3, padding: '38px 32px 34px 32px', color: '#ffffff' }}>
          <h1 style={{ margin: '0 0 10px 0', fontFamily: fontDisplay, fontSize: '32px', fontWeight: '700', letterSpacing: '-0.5px' }}>
            Real-time Hydraulic Demand Forecasting
          </h1>
          <p style={{ color: '#cbd5e1', margin: '0 0 22px 0', fontSize: '15px', maxWidth: '760px', lineHeight: '1.6', fontWeight: '400' }}>
            Live operational data from the Artificial Intelligence Integrated Water Distribution system bed.
          </p>
          {/* signature element: telemetry waveform, echoes the sensor stream this page reads from */}
          <svg width="100%" height="26" viewBox="0 0 600 26" preserveAspectRatio="none" style={{ display: 'block', maxWidth: '400px', opacity: 0.9 }} aria-hidden="true">
            <polyline
              points="0,13 40,13 55,4 70,22 85,13 130,13 145,7 160,19 175,13 260,13 275,2 292,24 310,13 600,13"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </header>

      {/* Asynchronous System Handling Interceptors */}
      {loading ? (
        <div style={{ padding: '70px 0', textAlign: 'center', background: palette.panel, borderRadius: '16px', border: `1px solid ${palette.line}`, position: 'relative', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.03)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', backgroundColor: palette.panelAlt, overflow: 'hidden' }}>
            <div className="df-scanbar" style={{ width: '30%', height: '100%', backgroundColor: palette.accent, animation: 'df-scan 1.4s ease-in-out infinite' }}></div>
          </div>
          <div className="df-spinner" style={{ width: '36px', height: '36px', border: `3px solid ${palette.panelAlt}`, borderTop: `3px solid ${palette.accent}`, borderRadius: '50%', animation: 'df-spin 0.8s linear infinite', margin: '0 auto 20px auto' }}></div>
          <p style={{ fontSize: '14px', color: palette.textMuted, fontWeight: '500', margin: '0', fontFamily: fontMono, letterSpacing: '0.3px' }}>Connecting to AWS S3 telemetry buffers...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '30px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '14px', color: '#991b1b', boxShadow: '0 4px 6px -1px rgba(239,68,68,0.05)' }}>
          <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: '700', color: '#991b1b', fontFamily: fontBody }}>
            <i className="fas fa-exclamation-triangle" style={{ fontSize: '18px' }}></i> Operational Telemetry Offline
          </h4>
          <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#b91c1c', fontFamily: fontMono }}>{error}</p>
          <button
            onClick={fetchLiveDemandData}
            style={{ padding: '10px 20px', backgroundColor: '#991b1b', color: '#ffffff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', fontFamily: fontBody, transition: 'background-color 0.2s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#7f1d1d'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#991b1b'; }}
          >
            Retry Telemetry Fetch
          </button>
        </div>
      ) : (
        <>
          {/* Real-time Content Display Block */}
          <div style={{ background: palette.panel, borderRadius: '16px', border: `1px solid ${palette.line}`, padding: '26px', marginBottom: '26px', boxShadow: '0 1px 3px rgba(15,23,42,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '26px', gap: '16px', borderBottom: `1px solid ${palette.line}`, paddingBottom: '20px' }}>
              <h3 style={{ margin: '0', color: palette.text, fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: fontBody }}>
                <i className="fas fa-satellite-dish" style={{ color: palette.accent, fontSize: '17px' }}></i>
                Live Forecast Execution Cycle:
                <span style={{ fontFamily: fontMono, fontWeight: '600', color: palette.text, backgroundColor: palette.panelAlt, border: `1px solid ${palette.line}`, padding: '3px 9px', borderRadius: '6px', fontSize: '12.5px', marginLeft: '2px' }}>{forecastData?.timestamp}</span>
              </h3>
              <span style={{ fontSize: '11px', background: '#d1fae5', color: '#065f46', padding: '6px 12px', borderRadius: '30px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: fontMono, letterSpacing: '0.3px' }}>
                <i className="fas fa-sync-alt fa-spin"></i> Auto-refreshing Live from S3
              </span>
            </div>

            {/* Demand Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '22px', marginBottom: '12px' }}>
              {forecastData?.demand && Object.keys(forecastData.demand).length > 0 ? (
                Object.entries(forecastData.demand).map(([nodeName, val]) => {
                  const systemSegment = zoneLocationMapping[nodeName] || {
                    sectionTitle: "SYSTEM NODE",
                    label: `ID: ${nodeName.replace(/_/g, ' ')}`,
                    color: palette.textMuted,
                    glow: "rgba(100, 116, 139, 0.2)",
                    bgGradient: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)"
                  };

                  const currentFlowValue = Number(val);
                  const capacityGaugePercent = Math.min(100, Math.max(8, (currentFlowValue / 15) * 100));

                  return (
                    <div 
                      key={nodeName} 
                      style={{ 
                        background: palette.panel, 
                        borderRadius: '16px', 
                        border: `1px solid ${palette.line}`, 
                        boxShadow: '0 4px 6px -1px rgba(15,23,42,0.02)',
                        overflow: 'hidden',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 16px 28px -14px ${systemSegment.glow}`; e.currentTarget.style.borderColor = systemSegment.color; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(15,23,42,0.02)'; e.currentTarget.style.borderColor = palette.line; }}
                    >
                      <div style={{ background: systemSegment.bgGradient, padding: '18px 22px', borderBottom: `1px solid ${palette.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ margin: '0 0 3px 0', color: systemSegment.color, fontSize: '12px', fontWeight: '700', letterSpacing: '1.5px', fontFamily: fontMono }}>
                            {systemSegment.sectionTitle}
                          </h4>
                          <span style={{ fontSize: '13px', color: palette.text, fontWeight: '600', fontFamily: fontBody }}>
                            {systemSegment.label}
                          </span>
                        </div>
                        <span style={{ fontSize: '10.5px', fontFamily: fontMono, fontWeight: '600', backgroundColor: '#ffffff', color: palette.textMuted, padding: '4px 8px', borderRadius: '5px', border: `1px solid ${palette.line}`, letterSpacing: '0.5px' }}>
                          {nodeName.split('_')[0]}
                        </span>
                      </div>
                      
                      <div style={{ padding: '22px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px', marginBottom: '18px' }}>
                          <p style={{ fontSize: '42px', fontWeight: '700', margin: '0', color: palette.text, letterSpacing: '-1px', lineHeight: '1', fontFamily: fontDisplay }}>
                            {val}
                          </p>
                          <span style={{ fontSize: '18px', color: palette.textMuted, fontWeight: '600', fontFamily: fontDisplay }}>L</span>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                            
                          </div>
                          <div style={{ height: '5px', borderRadius: '3px', backgroundColor: palette.panelAlt, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${capacityGaugePercent}%`, borderRadius: '3px', backgroundColor: systemSegment.color, transition: 'width 0.6s ease' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: palette.textMuted, gridColumn: '1/-1', textAlign: 'center', padding: '32px', background: palette.panelAlt, borderRadius: '12px', border: `1px solid ${palette.line}`, margin: '0', fontFamily: fontBody }}>No node matrices populated for this parsing sequence.</p>
              )}
            </div>
          </div>

          {/* ─── NEWLY ADDED EXTERNAL STAKEHOLDER PLATFORM REDIRECTS ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px', marginBottom: '26px' }}>
            <a 
              href="https://aiiot.it.com/project/digital-water" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', background: palette.panel, border: `1px solid ${palette.line}`, borderRadius: '12px', padding: '19px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(15,23,42,0.03)', transition: 'all 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = palette.accent; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 22px -14px rgba(37,99,235,0.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = palette.line; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,23,42,0.03)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '9px', backgroundColor: palette.accentSoft, color: palette.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-project-diagram" style={{ fontSize: '17px' }}></i>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '700', color: palette.text, fontFamily: fontBody }}>Digital Water Solution</h4>
                  <span style={{ fontSize: '12px', color: palette.textMuted }}>Explore global system architecture</span>
                </div>
              </div>
              <i className="fas fa-external-link-alt" style={{ color: palette.textFaint, fontSize: '13px' }}></i>
            </a>

            <a 
              href="https://aiiot.it.com/product-details/distribution-net" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', background: palette.panel, border: `1px solid ${palette.line}`, borderRadius: '12px', padding: '19px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(15,23,42,0.03)', transition: 'all 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 22px -14px rgba(16,185,129,0.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = palette.line; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,23,42,0.03)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '9px', backgroundColor: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-network-wired" style={{ fontSize: '17px' }}></i>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '700', color: palette.text, fontFamily: fontBody }}>Distribution Network</h4>
                  <span style={{ fontSize: '12px', color: palette.textMuted }}>Review network product details</span>
                </div>
              </div>
              <i className="fas fa-external-link-alt" style={{ color: palette.textFaint, fontSize: '13px' }}></i>
            </a>
          </div>

          {/* Infrastructure Intent Explainer Block */}
          <div style={{ background: palette.panel, border: `1px solid ${palette.line}`, borderRadius: '16px', padding: '26px', display: 'flex', gap: '18px', alignItems: 'flex-start', boxShadow: '0 1px 3px rgba(15,23,42,0.02)' }}>
            <div style={{ backgroundColor: palette.accentSoft, padding: '12px', borderRadius: '10px', color: palette.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-info-circle" style={{ fontSize: '19px' }}></i>
            </div>
            <div>
              <h4 style={{ margin: '0 0 6px 0', color: palette.text, fontSize: '15px', fontWeight: '700', fontFamily: fontBody }}>✅ Distribution System Status</h4>
              <p style={{ margin: '0', color: palette.textMuted, lineHeight: '1.6', fontSize: '14px', fontFamily: fontBody }}>
                This system provides real-time water demand monitoring across the three wards to support efficient water distribution and supply management.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DemandForecasting;