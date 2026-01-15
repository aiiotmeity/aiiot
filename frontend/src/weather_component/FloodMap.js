import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import "./RiverDashboard.css"; // Uses the new Government CSS

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://aiiot-1.onrender.com'
  : 'http://localhost:8000';

const ITEMS_PER_PAGE = 10; 

// ---------------------------------------------------------
// 🧠 HELPER: Smart Name Generator
// ---------------------------------------------------------
const generateSmartName = (osmData) => {
  if (!osmData) return "Unknown Location";
  const addr = osmData.address || {};
  
  const street = addr.road || addr.street || addr.pedestrian || addr.path || addr.lane;
  const area = addr.neighbourhood || addr.suburb || addr.residential || addr.village;
  const town = addr.town || addr.city || addr.county;

  if (street && area) return `${street}, ${area}`;
  if (street && town) return `${street}, ${town}`;
  if (area && town) return `${area}, ${town}`;

  if (osmData.display_name) {
    const parts = osmData.display_name.split(", ");
    return parts.slice(0, 2).join(", ");
  }
  return town || "Flood Point";
};

// ---------------------------------------------------------
// 📍 COMPONENT 1: Map Popup
// ---------------------------------------------------------
const LocationPopup = ({ lat, lon, depth, explanation }) => {
  const [address, setAddress] = useState("Loading details...");
  const [title, setTitle] = useState("Flood Point");

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
    <div style={{fontFamily: 'Inter, sans-serif', minWidth: '200px'}}>
      <strong style={{fontSize: '14px', color: '#1e3a8a', display:'block', marginBottom:'4px'}}>{title}</strong>
      <div style={{height:'1px', background:'#e2e8f0', margin:'4px 0'}}></div>
      <div style={{fontSize:'12px', margin:'4px 0'}}><span style={{color:'#64748b'}}>Depth:</span> <strong style={{color:'#ef4444'}}>{depth}m</strong></div>
      <div style={{fontSize:'12px', margin:'4px 0'}}><span style={{color:'#64748b'}}>Status:</span> {explanation}</div>
      <div style={{fontSize:'11px', marginTop:'8px', color:'#94a3b8', lineHeight:'1.2', borderTop:'1px dashed #e2e8f0', paddingTop:'4px'}}>{address}</div>
    </div>
  );
};

// ---------------------------------------------------------
// 🔘 COMPONENT 2: Pagination Controls
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

  const isSevere = data.depth >= 1.5;
  const borderColor = isSevere ? "#ef4444" : "#f59e0b";
  const bgBadge = isSevere ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)";
  const textBadge = isSevere ? "#b91c1c" : "#b45309";
  const icon = isSevere ? "fa-exclamation-triangle" : "fa-water";

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
    if (isSevere) {
      const timer = setTimeout(() => { fetchDetails(); }, index * 800);
      return () => clearTimeout(timer);
    }
  }, [isSevere, index]);

  return (
    <div style={{
      background: '#ffffff', borderRadius: '8px', marginBottom: '16px',
      border: '1px solid #e2e8f0', borderLeft: `4px solid ${borderColor}`, 
      padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      transition: 'transform 0.2s'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            background: bgBadge, color: textBadge, width: '45px', height: '45px', 
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
          }}>
            <i className={`fas ${icon}`}></i>
          </div>
          <div>
            <h4 style={{ margin: '0 0 5px 0', fontSize: '1.05rem', color: '#1f2937', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {displayName}
              {loading && <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '0.9rem', color: '#94a3b8' }}></i>}
            </h4>
            
            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Inundation: <strong style={{color: textBadge}}>{data.depth}m</strong> • {isSevere ? "High Risk Zone" : "Moderate Risk"}
            </span>
          </div>
        </div>
        <button 
          onClick={() => { if(!expanded && !details) fetchDetails(); setExpanded(!expanded); }}
          style={{
            padding: '8px 16px', background: expanded ? '#f1f5f9' : '#fff', color: expanded ? '#64748b' : '#3b82f6',
            border: expanded ? '1px solid #e2e8f0' : '1px solid #3b82f6', 
            borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '0.85rem'
          }}
        >
          {expanded ? "Close Details" : "Locate"}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #f1f5f9', fontSize: '0.9rem', background: '#f8fafc', padding: '15px', borderRadius: '6px' }}>
          {loading ? (
            <div style={{color: '#64748b', display:'flex', alignItems:'center', gap:'10px'}}>
              <i className="fas fa-spinner fa-spin"></i> Retrieving geospatial data...
            </div>
          ) : details && !details.error ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
               <div style={{gridColumn: 'span 2'}}>
                 <small style={{color:'#94a3b8', fontSize: '0.75rem', fontWeight:'600', letterSpacing:'0.5px'}}>OFFICIAL ADDRESS</small><br/>
                 <strong style={{color:'#334155'}}>{details.display_name}</strong>
               </div>
               <div>
                 <small style={{color:'#94a3b8', fontSize: '0.75rem', fontWeight:'600', letterSpacing:'0.5px'}}>LOCALITY</small><br/>
                 <strong>{details.address.road || details.address.neighbourhood || details.display_name.split(',')[0]}</strong>
               </div>
               <div>
                 <small style={{color:'#94a3b8', fontSize: '0.75rem', fontWeight:'600', letterSpacing:'0.5px'}}>JURISDICTION</small><br/>
                 <strong>{details.address.village || details.address.town || "Angamali"}</strong>
               </div>
            </div>
          ) : (
            <div style={{color:'#ef4444'}}>Location details temporarily unavailable.</div>
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

  const simulatedLevel = searchParams.get('level');

  useEffect(() => {
    const fetchFloodAnalysis = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/weather/flood-analysis`, {
          params: { level: simulatedLevel } 
        });
        if (response.data) {
           if(response.data.data) response.data.data.sort((a,b) => b.depth - a.depth);
           setFloodData(response.data);
           setSeverePage(1);
           setOtherPage(1);
        }
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchFloodAnalysis();
  }, [simulatedLevel]);

  if (loading) return <div className="rd-loading"><div className="rd-spinner"></div><p>Calculating Flood Impact...</p></div>;

  const severeZones = floodData?.data?.filter(d => d.depth >= 1.5) || [];
  const otherZones = floodData?.data?.filter(d => d.depth < 1.5) || [];

  const currentSevere = severeZones.slice((severePage - 1) * ITEMS_PER_PAGE, severePage * ITEMS_PER_PAGE);
  const currentOther = otherZones.slice((otherPage - 1) * ITEMS_PER_PAGE, otherPage * ITEMS_PER_PAGE);

  return (
    <div className="rd-container">
      {/* 1. Header */}
      <div className="rd-hero" style={{ height: 'auto', paddingBottom: '60px' }}>
        <nav className="rd-nav-overlay">
          <div className="rd-wrapper rd-flex-between">
              <div className="rd-brand"><i className="fas fa-water"></i> Periyar<span>Watch</span></div>
              <div className="rd-links">
                <button onClick={() => navigate('/river-dashboard')}>Back to Dashboard</button>
              </div>
          </div>
        </nav>
        <div className="rd-hero-content rd-wrapper" style={{display:'block', textAlign:'center', paddingTop:'30px'}}>
            <span className="rd-pill"><i className="fas fa-globe-asia"></i> Geospatial Analysis</span>
            <h1 style={{marginTop:'15px'}}>Flood Risk Map</h1>
            <p className="rd-hero-sub" style={{margin:'10px auto'}}>
              Simulation based on river water level at <strong>{floodData?.current_water_level}m</strong>.
            </p>
        </div>
      </div>

      <main className="rd-main-content rd-wrapper">
        
        {/* ✅ NEW: ANALYSIS INDICATION / DISCLAIMER */}
        <div style={{
          background: '#eff6ff', 
          border: '1px solid #bfdbfe', 
          borderRadius: '8px', 
          padding: '15px 20px', 
          marginBottom: '25px', 
          display: 'flex', 
          gap: '15px',
          alignItems: 'flex-start'
        }}>
          <i className="fas fa-info-circle" style={{color: '#1e40af', fontSize: '1.2rem', marginTop: '3px'}}></i>
          <div>
            <h4 style={{margin: '0 0 5px 0', color: '#1e3a8a', fontSize: '1rem'}}>Analysis Indication</h4>
            <p style={{margin: 0, color: '#1e40af', fontSize: '0.9rem', lineHeight: '1.5'}}>
              The areas highlighted below are determined based on <strong>previous analysis</strong> and historical flood data. 
              This map projects the <strong>probability of water levels affecting chance areas</strong> corresponding to the current simulated river height. 
              Please verify with local authorities for real-time evacuation orders.
            </p>
          </div>
        </div>

        {/* 2. Map Card */}
        <section className="rd-card" style={{height: '550px', padding: '0', overflow:'hidden', position:'relative', zIndex:1}}>
          <MapContainer center={[10.16, 76.43]} zoom={13} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
              {floodData?.data?.map((point, idx) => (
                  <CircleMarker 
                      key={idx} center={[point.lat, point.lon]} radius={7}
                      pathOptions={{ color: 'white', weight:1, fillColor: point.depth >= 1.5 ? '#ef4444' : '#f59e0b', fillOpacity: 0.8 }}
                  >
                      <Popup><LocationPopup {...point} /></Popup>
                  </CircleMarker>
              ))}
          </MapContainer>
        </section>

        {/* 3. Severe Zones */}
        {severeZones.length > 0 && (
          <section className="rd-section" style={{ marginTop: '30px', border: 'none', padding:'0', overflow:'hidden' }}>
            <div style={{ 
              background: '#fee2e2', borderLeft: '4px solid #ef4444', color: '#991b1b', 
              padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderRadius: '8px 8px 0 0' 
            }}>
              <i className="fas fa-exclamation-circle" style={{fontSize:'1.5rem'}}></i>
              <div>
                <h3 style={{margin:0, fontSize:'1.1rem'}}>Critical Impact Zones</h3>
                <span style={{fontSize:'0.9rem', opacity:0.9}}>{severeZones.length} locations identified with depth {'>'} 1.5m</span>
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

        {/* 4. Moderate Zones */}
        {otherZones.length > 0 && (
          <section style={{ marginTop: '40px', marginBottom: '60px' }}>
            <div style={{textAlign:'center', marginBottom:'20px'}}>
              <button 
                onClick={() => setShowAllAreas(!showAllAreas)}
                className="btn-secondary"
                style={{
                  padding: '12px 25px', background: showAllAreas ? '#f59e0b' : 'transparent',
                  border: '2px solid #f59e0b', color: showAllAreas ? 'white' : '#d97706', 
                  borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize:'0.95rem',
                  display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s'
                }}
              >
                {showAllAreas ? <><i className="fas fa-eye-slash"></i> Hide Moderate Areas</> : <><i className="fas fa-eye"></i> View {otherZones.length} Moderate Risk Areas</>}
              </button>
            </div>
            
            {showAllAreas && (
              <div className="rd-card">
                 <h3 style={{fontSize:'1.1rem', marginBottom:'20px', color:'#d97706'}}>Moderate Impact Zones</h3>
                 {currentOther.map((item, index) => (
                    <AffectedAreaItem key={index} data={item} />
                 ))}
                 <Pagination currentPage={otherPage} totalItems={otherZones.length} onPageChange={setOtherPage} />
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default FloodMap;