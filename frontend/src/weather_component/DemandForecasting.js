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
    bgGradient: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)"
  },
  "Node2_Zone_Demand": {
    sectionTitle: "SECTION 2",
    label: "Zone ID: Node 2",
    color: "#3b82f6", 
    bgGradient: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)"
  },
  "Node5_Zone_Demand": {
    sectionTitle: "SECTION 3",
    label: "Zone ID: Node 5",
    color: "#10b981", 
    bgGradient: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)"
  },
  "Node7_Zone_Demand": {
    sectionTitle: "SECTION 4",
    label: "Zone ID: Node 7",
    color: "#f59e0b", 
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

  return (
    <div className="demand-forecasting-container" style={{ padding: '32px 24px', fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif', maxWidth: '1440px', margin: '0 auto', backgroundColor: '#f1f5f9', minHeight: '100vh', color: '#1e293b' }}>
      
      {/* Navigation Row */}
      <button 
        className="btn btn-secondary" 
        onClick={() => navigate('/weather-home')}
        style={{ marginBottom: '28px', cursor: 'pointer', padding: '12px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.transform = 'translateX(-2px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.transform = 'none'; }}
      >
        <i className="fas fa-arrow-left" style={{ fontSize: '1px' }}></i> Home
      </button>

      {/* ─── ADVANCED VISUAL HEADER CARD WITH BACKGROUND IMAGE IMAGE ─── */}
      <header style={{ 
        position: 'relative', 
        borderRadius: '16px', 
        overflow: 'hidden', 
        marginBottom: '36px', 
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)'
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
          background: 'linear-gradient(135deg, rgba(15,23,42,0.55) 0%, rgba(30,41,59,0.35) 100%)',
          zIndex: 2
        }}></div>

        {/* Content Box */}
        <div style={{ position: 'relative', zIndex: 3, padding: '40px 32px', color: '#ffffff' }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '32px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            Real-time Hydraulic Demand Forecasting
          </h1>
          <p style={{ color: '#cbd5e1', margin: '0', fontSize: '16px', maxWidth: '800px', lineHeight: '1.5', fontWeight: '400' }}>
            Live operational data from the Artificial Intelligence Integrated Water Distribution system bed.
          </p>
        </div>
      </header>

      {/* Asynchronous System Handling Interceptors */}
      {loading ? (
        <div style={{ padding: '80px 0', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #f1f5f9', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px auto' }}></div>
          <p style={{ fontSize: '16px', color: '#475569', fontWeight: '500', margin: '0' }}>Connecting to AWS S3 telemetry buffers...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : error ? (
        <div style={{ padding: '32px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', color: '#991b1b', boxShadow: '0 4px 6px -1px rgba(239,68,68,0.05)' }}>
          <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '700' }}><i className="fas fa-exclamation-triangle" style={{ fontSize: '20px' }}></i> Operational Telemetry Offline</h4>
          <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#b91c1c' }}>{error}</p>
          <button onClick={fetchLiveDemandData} style={{ padding: '10px 20px', backgroundColor: '#991b1b', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
            Retry Telemetry Fetch
          </button>
        </div>
      ) : (
        <>
          {/* Real-time Content Display Block */}
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '28px', marginBottom: '28px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '28px', gap: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
              <h3 style={{ margin: '0', color: '#334155', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-satellite-dish" style={{ color: '#10b981', fontSize: '18px' }}></i>
                Live Forecast Execution Cycle: <span style={{ fontWeight: '700', color: '#0f172a', marginLeft: '4px' }}>{forecastData?.timestamp}</span>
              </h3>
              {/* <span style={{ fontSize: '12px', background: '#d1fae5', color: '#065f46', padding: '6px 14px', borderRadius: '30px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(16,185,129,0.1)' }}>
                <i className="fas fa-sync-alt fa-spin"></i> Auto-refreshing Live from S3
              </span> */}
            </div>

            {/* Demand Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px', marginBottom: '12px' }}>
              {forecastData?.demand && Object.keys(forecastData.demand).length > 0 ? (
                Object.entries(forecastData.demand).map(([nodeName, val]) => {
                  const systemSegment = zoneLocationMapping[nodeName] || {
                    sectionTitle: "SYSTEM NODE",
                    label: `ID: ${nodeName.replace(/_/g, ' ')}`,
                    color: "#64748b",
                    bgGradient: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)"
                  };

                  const currentFlowValue = Number(val);
                  const capacityGaugePercent = Math.min(100, Math.max(8, (currentFlowValue / 15) * 100));

                  return (
                    <div 
                      key={nodeName} 
                      style={{ 
                        background: '#ffffff', 
                        borderRadius: '16px', 
                        border: '1px solid #e2e8f0', 
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
                        overflow: 'hidden',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 20px -8px rgba(0,0,0,0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02)'; }}
                    >
                      <div style={{ background: systemSegment.bgGradient || "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ margin: '0 0 2px 0', color: '#0f172a', fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px' }}>
                            {systemSegment.sectionTitle}
                          </h4>
                          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                            {systemSegment.label}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: '700', backgroundColor: '#ffffff', color: '#475569', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                          {nodeName.split('_')[0]}
                        </span>
                      </div>
                      
                      <div style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '20px' }}>
                          <p style={{ fontSize: '44px', fontWeight: '800', margin: '0', color: '#0f172a', letterSpacing: '-1.5px', lineHeight: '1' }}>
                            {val}
                          </p>
                          <span style={{ fontSize: '40px', color: '#475569', fontWeight: '1000' }}>L</span>
                        </div>

                        
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: '#64748b', gridColumn: '1/-1', textAlign: 'center', padding: '32px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '0' }}>No node matrices populated for this parsing sequence.</p>
              )}
            </div>
          </div>

          {/* ─── NEWLY ADDED EXTERNAL STAKEHOLDER PLATFORM REDIRECTS ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            <a 
              href="https://aiiot.it.com/project/digital-water" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-project-diagram" style={{ fontSize: '18px' }}></i>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Digital Water Solution</h4>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Explore global system architecture</span>
                </div>
              </div>
              <i className="fas fa-external-link-alt" style={{ color: '#94a3b8', fontSize: '14px' }}></i>
            </a>

            <a 
              href="https://aiiot.it.com/product-details/distribution-net" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-network-wired" style={{ fontSize: '18px' }}></i>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Distribution Network</h4>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Review network product details</span>
                </div>
              </div>
              <i className="fas fa-external-link-alt" style={{ color: '#94a3b8', fontSize: '14px' }}></i>
            </a>
          </div>

          {/* Infrastructure Intent Explainer Block */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px', display: 'flex', gap: '20px', alignItems: 'flex-start', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
            <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '10px', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-info-circle" style={{ fontSize: '20px' }}></i>
            </div>
            <div>
              <h4 style={{ margin: '0 0 6px 0', color: '#0f172a', fontSize: '16px', fontWeight: '700' }}>✅ Distribution System Status</h4>
              <p style={{ margin: '0', color: '#475569', lineHeight: '1.6', fontSize: '14.5px' }}>
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