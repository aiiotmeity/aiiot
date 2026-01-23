import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import "./RiverDashboard.css";
import L from 'leaflet';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://aiiot-1.onrender.com'
  : 'http://localhost:8000';

const ITEMS_PER_PAGE = 10;

// ---------------------------------------------------------
// 🎨 HELPER: Risk Color Logic
// ---------------------------------------------------------
const getRiskStatus = (depth, isNormalState) => {
  // If the overall river state is Normal, force everything to look Safe
  if (isNormalState) {
    return {
      color: "#10b981", // Green
      bg: "rgba(16, 185, 129, 0.1)",
      label: "Safe / Normal Flow",
      icon: "fa-check-circle"
    };
  }

  // Otherwise, use the standard flood thresholds
  if (depth <= 3) return { color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", label: "Low Risk", icon: "fa-check-circle" };
  if (depth < 8) return { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", label: "Moderate Risk", icon: "fa-exclamation-circle" };
  return { color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", label: "Critical Risk", icon: "fa-exclamation-triangle" };
};

const generateSmartName = (osmData) => {
  if (!osmData) return "Unknown Location";
  const addr = osmData.address || {};
  const street = addr.road || addr.street || addr.pedestrian || addr.path || addr.lane;
  const area = addr.neighbourhood || addr.suburb || addr.residential || addr.village;
  const town = addr.town || addr.city || addr.county;

  if (street && area) return `${street}, ${area}`;
  if (street && town) return `${street}, ${town}`;
  if (area && town) return `${area}, ${town}`;
  if (osmData.display_name) return osmData.display_name.split(", ").slice(0, 2).join(", ");
  return town || "Flood Point";
};

// ---------------------------------------------------------
// 📍 COMPONENT 1: Map Popup
// ---------------------------------------------------------
const LocationPopup = ({ lat, lon, depth, explanation, isNormalState }) => {
  const [address, setAddress] = useState("Loading details...");
  const [title, setTitle] = useState("Location Details");
  const status = getRiskStatus(depth, isNormalState);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
        const res = await axios.get(url);
        if (res.data) {
          setTitle(generateSmartName(res.data));
          setAddress(res.data.display_name);
        }
      } catch (err) { setAddress("Address unavailable"); }
    };
    fetchAddress();
  }, [lat, lon]);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minWidth: '200px' }}>
      <strong style={{ fontSize: '14px', color: '#1e3a8a', display: 'block', marginBottom: '4px' }}>{title}</strong>
      <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
      {/* Only show depth if NOT in normal state, to avoid confusing users with '10m' depth when river is low */}
      {!isNormalState && (
        <div style={{ fontSize: '12px', margin: '4px 0' }}>
          <span style={{ color: '#64748b' }}>Est. Inundation:</span>
          <strong style={{ color: status.color, marginLeft: '5px' }}>{depth}m</strong>
        </div>
      )}
      <div style={{ fontSize: '12px', margin: '4px 0' }}><span style={{ color: '#64748b' }}>Condition:</span> <span style={{ color: status.color, fontWeight: '600' }}>{status.label}</span></div>
      <div style={{ fontSize: '11px', marginTop: '8px', color: '#94a3b8', lineHeight: '1.2', borderTop: '1px dashed #e2e8f0', paddingTop: '4px' }}>{address}</div>
    </div>
  );
};

// ---------------------------------------------------------
// 🗺️ COMPONENT 2: Map Controls (Search & Location)
// ---------------------------------------------------------
const MapController = ({ targetLoc }) => {
  const map = useMap();
  useEffect(() => {
    if (targetLoc) {
      map.flyTo(targetLoc, 14, { animate: true, duration: 1.5 });
    }
  }, [targetLoc, map]);
  return null;
};

const CustomMapControls = ({ onSearch, onFindMe }) => {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      if (res.data && res.data.length > 0) {
        const { lat, lon } = res.data[0];
        onSearch([parseFloat(lat), parseFloat(lon)]);
      }
    } catch (err) { console.error("Search error:", err); }
    finally { setSearching(false); }
  };

  return (
    <div style={{
      position: 'absolute', top: '24px', left: '84px', zIndex: 1000,
      display: 'flex', alignItems: 'center', gap: '12px'
    }}>
      <form onSubmit={handleSearch} style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        borderRadius: '30px',
        padding: '4px',
        border: '1px solid rgba(255,255,255,0.5)',
        width: '320px',
        transition: 'all 0.3s'
      }}>
        <input
          type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search location..."
          style={{
            flex: 1, padding: '10px 20px', border: 'none', outline: 'none',
            fontSize: '0.9rem', background: 'transparent', color: '#1e293b',
            fontWeight: '500'
          }}
        />
        <button type="submit" style={{
          background: '#1e40af', color: 'white', border: 'none',
          minWidth: '88px', height: '40px', borderRadius: '12px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0 12px', transition: 'all 0.2s'
        }} onMouseOver={(e) => e.currentTarget.style.background = '#1e3a8a'} onMouseOut={(e) => e.currentTarget.style.background = '#1e40af'}>
          {searching ? (
            <>
              <i className="fas fa-circle-notch fa-spin"></i>
              <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Searching</span>
            </>
          ) : (
            <>
              <i className="fas fa-search"></i>
              <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>Search</span>
            </>
          )}
        </button>
      </form>

      <button onClick={onFindMe} title="My Location" style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        color: '#1e40af',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s'
      }} onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.color = '#1e3a8a'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.color = '#1e40af'; }}>
        <i className="fas fa-location-arrow" style={{ fontSize: '1.2rem' }}></i>
      </button>
    </div>
  );
};

const MapLegend = () => (
  <div style={{
    position: 'absolute', bottom: '20px', right: '20px', zIndex: 1000,
    background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(5px)',
    padding: '15px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.8rem'
  }}>
    <h5 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#1e3a8a', fontWeight: '700' }}>Risk Legend</h5>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></span>
        <span>Critical Risk (&gt;8m)</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></span>
        <span>Moderate Risk (3m-8m)</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></span>
        <span>Low Risk (&lt;3m)</span>
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------
// 🔘 COMPONENT 3: Pagination Controls
// ---------------------------------------------------------
const Pagination = ({ currentPage, totalItems, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', padding: '25px 0' }}>
      <button
        onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
        style={{
          padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0',
          background: currentPage === 1 ? '#f8fafc' : '#ffffff',
          color: currentPage === 1 ? '#cbd5e1' : '#1e40af',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          fontWeight: '500', transition: 'all 0.2s'
        }}
      >
        <i className="fas fa-chevron-left"></i> Prev
      </button>

      <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>
        Page <strong>{currentPage}</strong> of {totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
        style={{
          padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0',
          background: currentPage === totalPages ? '#f8fafc' : '#ffffff',
          color: currentPage === totalPages ? '#cbd5e1' : '#1e40af',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          fontWeight: '500', transition: 'all 0.2s'
        }}
      >
        Next <i className="fas fa-chevron-right"></i>
      </button>
    </div>
  );
};

// ---------------------------------------------------------
// 📋 COMPONENT 3: List Item
// ---------------------------------------------------------
const AffectedAreaItem = ({ data, index }) => {
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(data.place);

  const status = getRiskStatus(data.depth, false);

  const fetchDetails = async () => {
    if (details || loading) return;
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${data.lat}&lon=${data.lon}`;
      const res = await axios.get(url);
      if (res.data) {
        setDetails(res.data);
        setDisplayName(generateSmartName(res.data));
      }
    } catch (e) { setDetails({ error: true }); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (data.depth >= 8) {
      const timer = setTimeout(() => { fetchDetails(); }, index * 800);
      return () => clearTimeout(timer);
    }
  }, [data.depth, index]);

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        marginBottom: '16px',
        border: '1px solid #e2e8f0',
        borderLeft: `6px solid ${status.color}`,
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{
            background: status.bg,
            color: status.color,
            width: '60px',
            height: '60px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem',
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.03)'
          }}>
            <i className={`fas ${status.icon}`}></i>
          </div>
          <div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', color: '#0f172a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {displayName}
              {loading && <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '0.9rem', color: '#94a3b8' }}></i>}
            </h4>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '0.9rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fas fa-water" style={{ fontSize: '0.85rem', color: '#3b82f6' }}></i>
                Depth: <strong style={{ color: status.color }}>{data.depth}m</strong>
              </span>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }}></span>
              <span style={{
                fontSize: '0.75rem',
                background: status.bg,
                color: status.color,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                padding: '4px 10px',
                borderRadius: '20px'
              }}>
                {status.label}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => { if (!expanded && !details) fetchDetails(); setExpanded(!expanded); }}
          style={{
            padding: '12px 24px',
            background: expanded ? '#f1f5f9' : '#1e40af',
            color: expanded ? '#475569' : '#ffffff',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.3s ease',
            boxShadow: expanded ? 'none' : '0 10px 15px -3px rgba(30, 64, 175, 0.3)'
          }}
          onMouseOver={(e) => { if (!expanded) e.target.style.background = '#1e3a8a'; }}
          onMouseOut={(e) => { if (!expanded) e.target.style.background = '#1e40af'; }}
        >
          {expanded ? <><i className="fas fa-times"></i> Close</> : <><i className="fas fa-search-location"></i> View Details</>}
        </button>
      </div>

      {expanded && (
        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid #f1f5f9',
          fontSize: '0.95rem'
        }}>
          {loading ? (
            <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '12px', padding: '20px' }}>
              <i className="fas fa-circle-notch fa-spin"></i> Retrieving mapping infrastructure...
            </div>
          ) : details && !details.error ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '24px',
              background: '#f8fafc',
              padding: '20px',
              borderRadius: '12px'
            }}>
              <div style={{ gridColumn: 'span 2' }}>
                <small style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: '800', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>PRIMARY ADDRESS</small>
                <strong style={{ color: '#1e293b', lineHeight: '1.4', fontSize: '1rem' }}>{details.display_name}</strong>
              </div>
              <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: '800', display: 'block', marginBottom: '4px', letterSpacing: '0.5px' }}>DISTRICT/TOWN</small>
                <strong style={{ color: '#1e293b' }}>{details.address.city || details.address.town || details.address.county || "Ernakulam"}</strong>
              </div>
              <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: '800', display: 'block', marginBottom: '4px', letterSpacing: '0.5px' }}>WARD/VILLAGE</small>
                <strong style={{ color: '#1e293b' }}>{details.address.village || details.address.suburb || "Kalady Region"}</strong>
              </div>
            </div>
          ) : (
            <div style={{ color: '#ef4444', padding: '20px', background: '#fef2f2', borderRadius: '12px' }}>
              <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i> Mapping services currently saturated. Please try again.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------
// 🚀 MAIN PAGE
// ---------------------------------------------------------
const FloodMap = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [floodData, setFloodData] = useState(null);

  const [severePage, setSeverePage] = useState(1);
  const [otherPage, setOtherPage] = useState(1);
  const [showAllAreas, setShowAllAreas] = useState(false);
  const [mapCenter, setMapCenter] = useState([10.16, 76.43]);
  const [searchPos, setSearchPos] = useState(null);
  const [userPos, setUserPos] = useState(null);

  const simulatedLevel = searchParams.get('level');

  useEffect(() => {
    const fetchFloodAnalysis = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/weather/flood-analysis`, {
          params: { level: simulatedLevel }
        });
        if (response.data) {
          if (response.data.data) response.data.data.sort((a, b) => b.depth - a.depth);
          setFloodData(response.data);
          setSeverePage(1);
          setOtherPage(1);
        }
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    fetchFloodAnalysis();
  }, [simulatedLevel]);

  const handleLocateUser = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(coords);
        setMapCenter(coords);
      }, (err) => {
        alert("Permission to access location was denied or failed.");
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  if (loading) return <div className="rd-loading"><div className="rd-spinner"></div><p>Calculating Flood Impact...</p></div>;

  const threshold = floodData?.current_water_level || 3.5;

  // ✅ SMART LOGIC: Is the situation actually dangerous?
  // If the water level is <= 3.0m, we consider it "Normal" and "Safe".
  // This prevents showing "Critical" red alerts when the river is actually safe.
  const isNormalState = threshold <= 3.0;

  // Filters
  const severeZones = floodData?.data?.filter(d => d.depth >= threshold) || [];
  const otherZones = floodData?.data?.filter(d => d.depth < threshold) || [];

  const currentSevere = severeZones.slice((severePage - 1) * ITEMS_PER_PAGE, severePage * ITEMS_PER_PAGE);
  const currentOther = otherZones.slice((otherPage - 1) * ITEMS_PER_PAGE, otherPage * ITEMS_PER_PAGE);

  return (
    <div className="rd-container" style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Enhanced Hero Section */}
      <div className="rd-hero" style={{
        height: 'auto',
        paddingBottom: '80px',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Background Decor */}
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '40%', height: '80%', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', filter: 'blur(100px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '30%', height: '60%', background: 'rgba(59,130,246,0.1)', borderRadius: '50%', filter: 'blur(80px)' }}></div>

        <nav className="rd-nav-overlay" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="rd-wrapper rd-flex-between">
            <div className="rd-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.4rem', fontWeight: '800' }}>
              <div style={{ background: '#fff', color: '#1e40af', width: '35px', height: '35px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-water"></i>
              </div>
              <span>Periyar<span style={{ fontWeight: '300', opacity: 0.9 }}>FloodRisk</span></span>
            </div>
            <div className="rd-links">
              <button
                onClick={() => navigate('/river-forecast')}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '10px', color: 'white', fontWeight: '600', transition: 'all 0.3s'
                }}
                onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.25)'}
                onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
              >
                <i className="fas fa-chart-line"></i> Dashboard
              </button>
            </div>
          </div>
        </nav>

        <div className="rd-hero-content rd-wrapper" style={{ display: 'block', textAlign: 'center', paddingTop: '60px', position: 'relative', zIndex: 1 }}>
          <span className="rd-pill" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', backdropFilter: 'blur(5px)' }}>
            <i className="fas fa-satellite"></i> Real-time Geospatial Analysis
          </span>
          <h1 style={{ marginTop: '20px', fontSize: '3rem', fontWeight: '800', textShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>Flood Risk Analysis</h1>
          <p className="rd-hero-sub" style={{ margin: '15px auto', fontSize: '1.2rem', opacity: 0.9, maxWidth: '700px' }}>
            Advanced hydrological simulation based on river water level at <strong>{floodData?.current_water_level}m</strong>.
          </p>
        </div>
      </div>

      <main className="rd-main-content rd-wrapper" style={{ marginTop: '-40px', position: 'relative', zIndex: 10, flex: 1 }}>

        {/* ✅ UPDATED DISCLAIMER (Based on State) */}
        <div style={{
          background: isNormalState ? '#ecfdf5' : '#eff6ff',
          border: isNormalState ? '1px solid #10b981' : '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '15px 20px',
          marginBottom: '25px',
          display: 'flex',
          gap: '15px',
          alignItems: 'flex-start'
        }}>
          <i className={`fas ${isNormalState ? 'fa-check-circle' : 'fa-info-circle'}`}
            style={{ color: isNormalState ? '#059669' : '#1e40af', fontSize: '1.2rem', marginTop: '3px' }}>
          </i>
          <div>
            <h4 style={{ margin: '0 0 5px 0', color: isNormalState ? '#047857' : '#1e3a8a', fontSize: '1rem' }}>
              {isNormalState ? "Conditions Normal" : "Analysis Indication"}
            </h4>
            <p style={{
              margin: 0,
              // Update color based on specific severity: Green (Normal) / Orange (Caution) / Red (Critical)
              color: isNormalState ? '#065f46' : (threshold < 8 ? '#c2410c' : '#b91c1c'),
              fontSize: '0.9rem',
              lineHeight: '1.5'
            }}>
              {isNormalState
                ? "Current water levels are within safe limits. The map below shows the river channel and potential flood-prone areas. No active flood alerts."
                : threshold < 8
                  ? (
                    // CAUTION STATE (3m - 8m)
                    <>
                      <strong>⚠️ CAUTION:</strong> Water levels are elevated ({threshold}m).
                      Moderate flood risk detected in <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>caution</span>.
                      Residents in low-lying areas should stay alert.
                    </>
                  )
                  : (
                    // CRITICAL STATE (> 8m)
                    <>
                      <strong>🚨 CRITICAL WARNING:</strong> Severe flooding imminent. Water level is at <strong style={{ textDecoration: 'underline' }}>{threshold}m</strong>.
                      High danger in <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Critical Zones</span>.
                      Immediate precautions recommended.
                    </>
                  )
              }
            </p>
          </div>
        </div>

        {/* 2. Map Card */}
        <section className="rd-card" style={{ height: '600px', padding: '0', overflow: 'hidden', position: 'relative', zIndex: 1, border: 'none', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}>
          <CustomMapControls onSearch={(pos) => { setMapCenter(pos); setSearchPos(pos); }} onFindMe={handleLocateUser} />
          <MapLegend />

          <MapContainer center={[10.16, 76.43]} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
            <MapController targetLoc={mapCenter} />

            {userPos && (
              <CircleMarker center={userPos} radius={10} pathOptions={{ color: '#1e40af', fillColor: '#3b82f6', fillOpacity: 0.6, weight: 2 }}>
                <Popup><div style={{ fontWeight: 600, color: '#1e40af' }}><i className="fas fa-user-circle"></i> Your Current Position</div></Popup>
              </CircleMarker>
            )}

            {searchPos && (
              <CircleMarker center={searchPos} radius={12} pathOptions={{ color: '#ef4444', fillColor: '#fee2e2', fillOpacity: 0.8, weight: 3, dashArray: '5, 5' }}>
                <Popup><div style={{ fontWeight: 600, color: '#b91c1c' }}><i className="fas fa-search-location"></i> Searched Location</div></Popup>
              </CircleMarker>
            )}

            {floodData?.data?.map((point, idx) => {
              const status = getRiskStatus(point.depth, isNormalState);
              return (
                <CircleMarker
                  key={idx} center={[point.lat, point.lon]} radius={7}
                  pathOptions={{
                    color: 'white',
                    weight: 1,
                    fillColor: status.color,
                    fillOpacity: 0.8
                  }}
                  eventHandlers={{
                    mouseover: (e) => {
                      e.target.setStyle({ radius: 10, weight: 2 });
                    },
                    mouseout: (e) => {
                      e.target.setStyle({ radius: 7, weight: 1 });
                    }
                  }}
                >
                  <Tooltip direction="top" offset={[0, -5]} opacity={1}>
                    <div style={{ fontWeight: '700', color: status.color }}>{point.depth}m</div>
                  </Tooltip>
                  <Popup><LocationPopup {...point} isNormalState={isNormalState} /></Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </section>

        {/* 3. CONDITIONAL LIST DISPLAY */}

        {/* Case A: NORMAL STATE (Hide confusing lists) */}
        {isNormalState ? (
          <div style={{
            marginTop: '30px', padding: '40px', textAlign: 'center',
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px'
          }}>
            <div style={{ fontSize: '3rem', color: '#10b981', marginBottom: '15px' }}><i className="fas fa-shield-alt"></i></div>
            <h3 style={{ color: '#064e3b', marginBottom: '10px' }}>Region is currently Safe</h3>
            <p style={{ color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
              The Periyar river level at Kalady is currently <strong>{threshold}m</strong>, which is below the flood warning threshold (3.0m).
              No inundation detected in residential areas.
            </p>
          </div>
        ) : (
          /* Case B: ALERT STATE (Show Critical Lists) */
          <>
            {severeZones.length > 0 && (
              <section className="rd-section" style={{ marginTop: '30px', border: 'none', padding: '0', overflow: 'hidden' }}>
                <div style={{
                  background: '#fee2e2', borderLeft: '4px solid #ef4444', color: '#991b1b',
                  padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderRadius: '8px 8px 0 0'
                }}>
                  <i className="fas fa-exclamation-circle" style={{ fontSize: '1.5rem' }}></i>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Critical Impact Zones</h3>
                    <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>{severeZones.length} locations identified with depth {'>'} {threshold}m</span>
                  </div>
                </div>

                <div style={{ background: '#fff', padding: '25px', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
                  {currentSevere.map((item, index) => (
                    <AffectedAreaItem key={index} data={item} index={index} />
                  ))}
                  <Pagination currentPage={severePage} totalItems={severeZones.length} onPageChange={setSeverePage} />
                </div>
              </section>
            )}

            {/* Moderate Zones List (Only show in Alert State) */}
            {otherZones.length > 0 && (
              <section style={{ marginTop: '40px', marginBottom: '60px' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <button
                    onClick={() => setShowAllAreas(!showAllAreas)}
                    className="btn-secondary"
                    style={{
                      padding: '12px 25px', background: showAllAreas ? '#f59e0b' : 'transparent',
                      border: '2px solid #f59e0b', color: showAllAreas ? 'white' : '#d97706',
                      borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem',
                      display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s'
                    }}
                  >
                    {showAllAreas ? <><i className="fas fa-eye-slash"></i> Hide Moderate Areas</> : <><i className="fas fa-eye"></i> View {otherZones.length} Moderate Risk Areas</>}
                  </button>
                </div>

                {showAllAreas && (
                  <div className="rd-card">
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', color: '#d97706' }}>Moderate Impact Zones</h3>
                    {currentOther.map((item, index) => (
                      <AffectedAreaItem key={index} data={item} />
                    ))}
                    <Pagination currentPage={otherPage} totalItems={otherZones.length} onPageChange={setOtherPage} />
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {/* 4. Enhanced Institutional Footer */}
      <footer className="footer" style={{
        background: '#1e293b',
        color: '#f8fafc',
        paddingTop: '60px',
        marginTop: '60px',
        borderTop: '4px solid #1e40af'
      }}>
        <div className="footer-container rd-wrapper" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div className="footer-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '40px',
            paddingBottom: '40px'
          }}>
            <div className="footer-section">
              <h4 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fas fa-microchip" style={{ color: '#3b82f6' }}></i> Weather Monitoring System
              </h4>
              <p style={{ lineHeight: '1.6', opacity: 0.8, fontSize: '0.95rem' }}>
                Advanced meteorological monitoring facility providing real-time weather data
                and historical records for research, education, and public service.
              </p>
            </div>

            <div className="footer-section">
              <h4 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '20px' }}>Quick Links</h4>
              <ul className="footer-links" style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '12px' }}><a href="#home" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.3s' }}>Home</a></li>
                <li style={{ marginBottom: '12px' }}><a href="#about" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.3s' }}>About System</a></li>
                <li style={{ marginBottom: '12px' }}><a href="#services" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.3s' }}>Services</a></li>
                <li style={{ marginBottom: '12px' }}><a href="#contact" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.3s' }}>Contact</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '20px' }}>Institution</h4>
              <ul className="footer-links" style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ lineHeight: '1.5' }}>
                  <a href="https://www.adishankara.ac.in" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '600', display: 'block' }}>
                    Adi Shankara Institute of Engineering & Technology, Kalady
                  </a>
                  <span style={{ fontSize: '0.85rem', opacity: 0.7, color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                    Vidya Bharathi Nagar, Mattoor, Kalady, Kerala 683574
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom" style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            padding: '30px 0',
            textAlign: 'center',
            fontSize: '0.9rem',
            color: '#94a3b8'
          }}>
            <p style={{ margin: 0 }}>
              © {new Date().getFullYear()} <strong>Adi Shankara Institute of Engineering & Technology</strong>.
              <span style={{ display: 'block', marginTop: '8px', opacity: 0.6 }}>Weather Monitoring System. All rights reserved.</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FloodMap;
