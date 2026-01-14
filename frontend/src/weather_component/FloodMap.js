import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import "./RiverDashboard.css";

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
  const [address, setAddress] = useState("Loading...");
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
    <div className="popup-content">
      <strong style={{fontSize: '14px', color: '#0f172a'}}>{title}</strong>
      <hr style={{margin: '5px 0', border: '0', borderTop: '1px solid #ccc'}}/>
      <div><span className="label">Depth:</span> <strong style={{color:'#ef4444'}}>{depth}m</strong></div>
      <div><span className="label">Status:</span> {explanation}</div>
      <div style={{fontSize:'10px', marginTop:'5px', color:'#555', lineHeight:'1.2'}}>{address}</div>
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', padding: '20px 0' }}>
      <button 
        onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
        style={{
          padding: '8px 16px', borderRadius: '20px', border: 'none', 
          background: currentPage === 1 ? '#e2e8f0' : '#3b82f6', 
          color: currentPage === 1 ? '#94a3b8' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
        }}
      >
        <i className="fas fa-chevron-left"></i> Prev
      </button>
      
      <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>
        Page {currentPage} of {totalPages}
      </span>

      <button 
        onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
        style={{
          padding: '8px 16px', borderRadius: '20px', border: 'none', 
          background: currentPage === totalPages ? '#e2e8f0' : '#3b82f6', 
          color: currentPage === totalPages ? '#94a3b8' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
        }}
      >
        Next <i className="fas fa-chevron-right"></i>
      </button>
    </div>
  );
};

// ---------------------------------------------------------
// 📋 COMPONENT 3: List Item (With Spinner & Auto-Fetch)
// ---------------------------------------------------------
const AffectedAreaItem = ({ data, index }) => {
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(data.place); 

  const isSevere = data.depth >= 1.5;
  const borderColor = isSevere ? "#ef4444" : "#f59e0b";
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
    // Only auto-fetch if severe. 
    if (isSevere) {
      const timer = setTimeout(() => { fetchDetails(); }, index * 800);
      return () => clearTimeout(timer);
    }
  }, [isSevere, index]);

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', marginBottom: '12px',
      borderLeft: `6px solid ${borderColor}`, padding: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ 
            background: borderColor, color: 'white', width: '40px', height: '40px', 
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
          }}>
            <i className={`fas ${icon}`}></i>
          </div>
          <div>
            {/* 🔥 UPDATED: Name + Loading Spinner */}
            <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {displayName}
              {loading && <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '0.9rem', color: '#94a3b8' }}></i>}
            </h4>
            
            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Water Level: <strong>{data.depth}m</strong> • {isSevere ? "Danger Zone" : "Waterlogging"}
            </span>
          </div>
        </div>
        <button 
          onClick={() => { if(!expanded && !details) fetchDetails(); setExpanded(!expanded); }}
          style={{
            padding: '8px 15px', background: expanded ? '#e2e8f0' : '#3b82f6', color: expanded ? '#475569' : 'white',
            border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem'
          }}
        >
          {expanded ? "Close" : "Get Exact Location"}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
          {loading ? (
            <div style={{color: '#64748b', display:'flex', alignItems:'center', gap:'10px'}}>
              <i className="fas fa-spinner fa-spin"></i> Finding street details...
            </div>
          ) : details && !details.error ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
               <div style={{gridColumn: 'span 2', marginBottom:'5px'}}>
                 <small style={{color:'#94a3b8'}}>FULL ADDRESS</small><br/>
                 <strong style={{color:'#334155'}}>{details.display_name}</strong>
               </div>
               <div>
                 <small style={{color:'#94a3b8'}}>STREET / AREA</small><br/>
                 <strong>{details.address.road || details.address.neighbourhood || details.display_name.split(',')[0]}</strong>
               </div>
               <div>
                 <small style={{color:'#94a3b8'}}>TOWN / VILLAGE</small><br/>
                 <strong>{details.address.village || details.address.town || "Angamali"}</strong>
               </div>
            </div>
          ) : (
            <div style={{color:'red'}}>Location details not available.</div>
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

  if (loading) return <div className="rd-loading"><div className="rd-spinner"></div><p>Scanning Area...</p></div>;

  const severeZones = floodData?.data?.filter(d => d.depth >= 1.5) || [];
  const otherZones = floodData?.data?.filter(d => d.depth < 1.5) || [];

  const currentSevere = severeZones.slice((severePage - 1) * ITEMS_PER_PAGE, severePage * ITEMS_PER_PAGE);
  const currentOther = otherZones.slice((otherPage - 1) * ITEMS_PER_PAGE, otherPage * ITEMS_PER_PAGE);

  return (
    <div className="rd-container">
      <nav className="rd-nav-overlay">
        <div className="rd-wrapper rd-flex-between">
            <div className="rd-brand">Periyar<span>Watch</span></div>
            <button onClick={() => navigate('/')} className="nav-btn"><i className="fas fa-arrow-left"></i> Home</button>
        </div>
      </nav>

      <main className="rd-main-content rd-wrapper" style={{marginTop: '90px'}}>
        <div style={{textAlign: 'center', marginBottom: '30px'}}>
          <h2 style={{fontSize: '2rem', marginBottom:'5px'}}>Flood Impact Map</h2>
          <p style={{opacity: 0.8}}>Showing areas affected if water reaches <strong>{floodData?.current_water_level}m</strong></p>
        </div>

        <section className="rd-section glass" style={{height: '500px', marginBottom: '40px', padding:'5px'}}>
          <MapContainer center={[10.16, 76.43]} zoom={13} style={{ height: "100%", width: "100%", borderRadius: "8px" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
              {floodData?.data?.map((point, idx) => (
                  <CircleMarker 
                      key={idx} center={[point.lat, point.lon]} radius={6}
                      pathOptions={{ color: 'white', weight:1, fillColor: point.depth >= 1.5 ? '#ef4444' : '#f59e0b', fillOpacity: 0.8 }}
                  >
                      <Popup><LocationPopup {...point} /></Popup>
                  </CircleMarker>
              ))}
          </MapContainer>
        </section>

        {/* 🚨 SEVERE ZONES */}
        {severeZones.length > 0 && (
          <section className="rd-section" style={{ borderTop: 'none' }}>
            <div style={{ background: '#ef4444', color: 'white', padding: '15px', borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fas fa-bullhorn" style={{fontSize:'1.5rem'}}></i>
              <div><h3 style={{margin:0, fontSize:'1.2rem'}}>Severe Danger Zones ({severeZones.length})</h3></div>
            </div>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '20px', borderRadius: '0 0 10px 10px' }}>
              {currentSevere.map((item, index) => (
                  <AffectedAreaItem key={index} data={item} index={index} />
              ))}
              <Pagination currentPage={severePage} totalItems={severeZones.length} onPageChange={setSeverePage} />
            </div>
          </section>
        )}

        {/* 🟡 OTHER ZONES */}
        {otherZones.length > 0 && (
          <section style={{ marginTop: '30px', marginBottom: '50px' }}>
            <button 
              onClick={() => setShowAllAreas(!showAllAreas)}
              style={{
                width: '100%', padding: '15px', background: showAllAreas ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                border: '2px solid #f59e0b', color: showAllAreas ? 'black' : '#f59e0b', borderRadius: '10px',
                cursor: 'pointer', fontWeight: 'bold'
              }}
            >
              {showAllAreas ? "Hide Moderate Areas" : `View ${otherZones.length} Other Affected Areas`}
            </button>
            
            {showAllAreas && (
              <div style={{ marginTop: '20px' }}>
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