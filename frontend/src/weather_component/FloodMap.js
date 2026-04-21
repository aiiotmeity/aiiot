import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import "./FloodMap.css";
import L from 'leaflet';
import kaladyRiver from "../assets/kalady-river.png";

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://aiiot-1.onrender.com'
  : 'http://localhost:8000';

const ITEMS_PER_PAGE = 10;

// 🎨 HELPER: Risk Color Logic
const getRiskStatus = (depth, isNormalState) => {
  if (isNormalState) {
    return {
      color: "#10b981", 
      bg: "rgba(16, 185, 129, 0.1)",
      label: "Safe / Normal Flow",
      icon: "fa-check-circle",
      shadow: "0 4px 14px 0 rgba(16, 185, 129, 0.39)"
    };
  }

  if (depth <= 3) return { color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", label: "Low Risk", icon: "fa-check-circle", shadow: "0 4px 14px 0 rgba(16, 185, 129, 0.39)" };
  if (depth < 8) return { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", label: "Moderate Risk", icon: "fa-exclamation-circle", shadow: "0 4px 14px 0 rgba(245, 158, 11, 0.39)" };
  return { color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", label: "Critical Risk", icon: "fa-exclamation-triangle", shadow: "0 4px 14px 0 rgba(239, 68, 68, 0.39)" };
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

// 📍 COMPONENT: Map Popup
const LocationPopup = ({ lat, lon, depth, isNormalState }) => {
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
    <div style={{ fontFamily: 'Inter, sans-serif', minWidth: '220px', padding: '5px' }}>
      <div style={{ color: status.color, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{status.label}</div>
      <strong style={{ fontSize: '15px', color: '#0f172a', display: 'block', marginBottom: '8px' }}>{title}</strong>
      {!isNormalState && (
        <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '6px', marginBottom: '8px' }}>
          <span style={{ color: '#64748b', fontSize: '11px' }}>Water Depth:</span>
          <strong style={{ color: status.color, marginLeft: '5px', fontSize: '14px' }}>{depth}m</strong>
        </div>
      )}
      <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
        <i className="fas fa-map-marker-alt" style={{ marginRight: '5px' }}></i>
        {address}
      </div>
    </div>
  );
};

const MapController = ({ targetLoc }) => {
  const map = useMap();
  useEffect(() => {
    if (targetLoc) { map.flyTo(targetLoc, 14, { animate: true, duration: 1.5 }); }
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
    } catch (err) { console.error(err); }
    finally { setSearching(false); }
  };

  return (
    <div className="custom-map-controls">      
      <form onSubmit={handleSearch} className="search-form-overlay">
        <input
          type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search location..."
          className="search-input-leaflet"
        />
        <button type="submit" className="search-btn-leaflet">
          {searching ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-search"></i>}
        </button>
      </form>
      <button onClick={onFindMe} className="locate-btn-leaflet">
        <i className="fas fa-location-arrow"></i>
      </button>
    </div>
  );
};

const MapLegend = () => (
  <div className="map-legend-overlay">
    <h5 style={{ margin: '0 0 10px 0', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7 }}>Risk Scale</h5>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span> Critical</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span> Moderate</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span> Low Risk</div>
    </div>
  </div>
);

const Pagination = ({ currentPage, totalItems, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} style={{ padding: '8px 15px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Prev</button>
      <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{currentPage} / {totalPages}</span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} style={{ padding: '8px 15px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Next</button>
    </div>
  );
};

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
      const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${data.lat}&lon=${data.lon}`);
      if (res.data) { setDetails(res.data); setDisplayName(generateSmartName(res.data)); }
    } catch (e) { setDetails({ error: true }); }
    finally { setLoading(false); }
  };

  return (
    <div className="rd-glass-card" style={{ marginBottom: '12px', borderLeft: `4px solid ${status.color}`, padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ background: status.bg, color: status.color, width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className={`fas ${status.icon}`}></i>
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>{displayName}</h4>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Depth: <strong>{data.depth}m</strong></span>
          </div>
        </div>
        <button onClick={() => { if (!expanded) fetchDetails(); setExpanded(!expanded); }} style={{ background: 'transparent', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}>
          {expanded ? 'Hide' : 'Analyze'}
        </button>
      </div>
      {expanded && <div style={{ marginTop: '15px', padding: '15px', background: '#f8fafc', borderRadius: '10px', fontSize: '0.85rem' }}>{loading ? 'Loading...' : details?.display_name || 'Unavailable'}</div>}
    </div>
  );
};

const FloodMap = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [floodData, setFloodData] = useState(null);
  const [severePage, setSeverePage] = useState(1);
  const [otherPage, setOtherPage] = useState(1);
  const [showAllAreas, setShowAllAreas] = useState(false);
  const [mapCenter, setMapCenter] = useState([10.16, 76.43]);
  const [userPos, setUserPos] = useState(null);

  const simulatedLevel = searchParams.get('level');

  useEffect(() => {
    const fetchFloodAnalysis = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/weather/flood-analysis`, { params: { level: simulatedLevel } });
        if (response.data) {
          if (response.data.data) response.data.data.sort((a, b) => b.depth - a.depth);
          setFloodData(response.data);
        }
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    fetchFloodAnalysis();
  }, [simulatedLevel]);

  const handleLocateUser = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((p) => {
        const c = [p.coords.latitude, p.coords.longitude];
        setUserPos(c); setMapCenter(c);
      });
    }
  };

  if (loading) return <div className="rd-loading"><div className="rd-spinner"></div><p>Syncing Satellite Data...</p></div>;

  const threshold = floodData?.current_water_level || 3.5;
  const isNormalState = threshold <= 3.0;
  const severeZones = floodData?.data?.filter(d => d.depth >= threshold) || [];
  const otherZones = floodData?.data?.filter(d => d.depth < threshold) || [];
  const currentSevere = severeZones.slice((severePage - 1) * ITEMS_PER_PAGE, severePage * ITEMS_PER_PAGE);

  const getAlert = (level) => {
    if (level < 3) return { title: "Conditions Normal", message: "Water levels are safe.", color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", icon: "fa-check-circle" };
    if (level < 8) return { title: "Caution: Rising Water", message: "Monitoring required.", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", icon: "fa-exclamation-circle" };
    return { title: "⚠️ Flood Warning", message: "Extreme risk detected.", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", icon: "fa-exclamation-triangle" };
  };

  const alertData = getAlert(threshold);

  return (
    <div className="rd-advanced-page" style={{ background: '#f1f5f9', minHeight: '100vh' }}>
      <style>{`
        .rd-nav-header { 
            display: flex; justify-content: space-between; align-items: center; 
            padding: 15px 5%; background: rgba(240, 242, 248, 0.9); backdrop-filter: blur(10px);
            color: white; position: sticky; top: 0; z-index: 2000;
        }
        .hero-section {
            background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${kaladyRiver});
            background-size: cover; background-position: center; padding: 60px 20px;
            text-align: center; color: white;
        }
        .status-pill-container {
            background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255,255,255,0.2);
            padding: 20px; border-radius: 15px; display: inline-flex; align-items: center; gap: 20px;
            backdrop-filter: blur(10px); margin-top: 20px;
        }
        .map-section { height: 60vh; width: 100%; position: relative; border-bottom: 4px solid #e2e8f0; }
        .custom-map-controls { position: absolute; top: 20px; left: 20px; z-index: 1000; display: flex; gap: 10px; }
        .search-form-overlay { display: flex; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .search-input-leaflet { border: none; padding: 10px; width: 200px; outline: none; }
        .search-btn-leaflet { background: #3b82f6; color: white; border: none; padding: 0 15px; cursor: pointer; }
        .locate-btn-leaflet { background: white; border: none; width: 40px; height: 40px; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); color: #3b82f6; }
        .map-legend-overlay { position: absolute; bottom: 20px; right: 20px; z-index: 1000; background: white; padding: 15px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .main-content-grid { display: grid; grid-template-columns: 1fr 350px; gap: 30px; padding: 40px 5%; }
        
        @media (max-width: 900px) {
            .main-content-grid { grid-template-columns: 1fr; }
            .search-input-leaflet { width: 150px; }
        }
      `}</style>

      {/* 1. STICKY HEADER */}
      <header className="rd-nav-header">
        <div style={{ fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <i className="fas fa-satellite-dish" style={{ marginRight: '10px',color: '#3b82f6' }}></i>
          <span style={{ fontWeight: 300 ,color: '#3b82f6'}}>Periyar Risk</span>
        </div>
        <button onClick={() => navigate('/river-forecast')} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
          <i className="fas fa-th-large"></i> Dashboard
        </button>
      </header>

      {/* 2. HERO SECTION */}
      <section className="hero-section">
        <span style={{ background: 'rgba(59, 130, 246, 0.3)', padding: '5px 15px', borderRadius: '20px', fontSize: '0.8rem', border: '1px solid #3b82f6' }}>Geospatial Intelligence</span>
        <h1 style={{ fontSize: '2.5rem', margin: '15px 0' }}>Flood Risk Analysis</h1>
        <p style={{ opacity: 0.9 }}>Live hydrological simulation for Periyar Basin based on current river level.</p>
        
        <div className="status-pill-container">
          <i className="fas fa-water" style={{ fontSize: '2rem', color: '#60a5fa' }}></i>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.8 }}>Current Water Level</span>
            <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold' }}>{threshold}m</p>
          </div>
          <i className={`fas ${alertData.icon}`} style={{ fontSize: '1.5rem', color: alertData.color }}></i>
        </div>
      </section>

      {/* 3. MAP AREA */}
      <section className="map-section">
        {/* Floating Alert Box */}
        <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000, background: alertData.bg, border: `1px solid ${alertData.color}`, padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px', backdropFilter: 'blur(10px)', maxWidth: '300px' }}>
          <i className={`fas ${alertData.icon}`} style={{ color: alertData.color }}></i>
          <div style={{ color: alertData.color }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{alertData.title}</h4>
            <p style={{ margin: 0, fontSize: '0.7rem' }}>{alertData.message}</p>
          </div>
        </div>

        <CustomMapControls onSearch={(pos) => setMapCenter(pos)} onFindMe={handleLocateUser} />
        <MapLegend />

        <MapContainer center={[10.16, 76.43]} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          <MapController targetLoc={mapCenter} />
          {userPos && <CircleMarker center={userPos} radius={8} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.8 }}><Popup>Your Location</Popup></CircleMarker>}
          {floodData?.data?.map((point, idx) => {
            const status = getRiskStatus(point.depth, isNormalState);
            return (
              <CircleMarker key={idx} center={[point.lat, point.lon]} radius={6} pathOptions={{ color: 'white', weight: 1, fillColor: status.color, fillOpacity: 0.8 }}>
                <Tooltip direction="top" offset={[0, -5]}><div style={{ fontWeight: '700', color: status.color }}>{point.depth}m</div></Tooltip>
                <Popup><LocationPopup {...point} isNormalState={isNormalState} /></Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </section>

      {/* 4. CONTENT GRID */}
      <main className="main-content-grid">
        <div className="list-section">
          <h3 style={{ marginBottom: '20px' }}><i className="fas fa-layer-group"></i> Affected Areas</h3>
          {isNormalState ? (
            <div style={{ background: 'white', padding: '40px', borderRadius: '15px', textAlign: 'center' }}>
              <i className="fas fa-check-circle" style={{ fontSize: '3rem', color: '#10b981', marginBottom: '15px' }}></i>
              <h4>No Active Flooding</h4>
              <p style={{ color: '#64748b' }}>Current river levels are within safe operational limits.</p>
            </div>
          ) : (
            <div>
              {currentSevere.map((item, index) => <AffectedAreaItem key={index} data={item} index={index} />)}
              <Pagination currentPage={severePage} totalItems={severeZones.length} onPageChange={setSeverePage} />
            </div>
          )}
        </div>

        <div className="sidebar-section">
          <div style={{ background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h4 style={{ marginBottom: '15px' }}>Model Status</h4>
            <div style={{ padding: '10px', borderLeft: `4px solid ${isNormalState ? '#10b981' : '#ef4444'}`, background: '#f8fafc', marginBottom: '15px' }}>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>{isNormalState ? "Stable Flow" : "Flood Hazard Alert"}</p>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Analysis is based on Satellite Lidar Topography combined with IoT water level sensors.</p>
          </div>
        </div>
      </main>

      <footer style={{ background: '#0f172a', color: 'white', padding: '40px 5%', textAlign: 'center' }}>
        <p>© {new Date().getFullYear()} Center for AI-IoT Innovations. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default FloodMap;