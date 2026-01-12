import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'; // 🟢 Import Map components
import 'leaflet/dist/leaflet.css'; // 🟢 Import Map styles
import "./RiverDashboard.css";

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://aiiot-1.onrender.com'
  : 'http://localhost:8000';

const FloodMap = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [floodData, setFloodData] = useState(null);
  const [viewMode, setViewMode] = useState("map"); // 🟢 'map' or 'table'

  const simulatedLevel = searchParams.get('level');

  useEffect(() => {
    const fetchFloodAnalysis = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/weather/flood-analysis`, {
          params: { level: simulatedLevel } 
        });
        if (response.data) {
          setFloodData(response.data);
        }
      } catch (error) {
        console.error("Analysis Failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFloodAnalysis();
  }, [simulatedLevel]);

  if (loading) return <div className="rd-loading"><div className="rd-spinner"></div><p>Analyzing Satellite Terrain (DEM)...</p></div>;

  // 🟢 Helper to get color based on depth
  const getSeverityColor = (depth) => {
      if (depth < 1.0) return "#f59e0b"; // Orange (Moderate)
      return "#ef4444"; // Red (Severe)
  };

  return (
    <div className="rd-container">
      <nav className="rd-nav-overlay">
        <div className="rd-wrapper rd-flex-between">
            <div className="rd-brand"><i className="fas fa-water"></i> Periyar<span>Watch</span></div>
            <button onClick={() => navigate('/')} style={{background:'transparent', border:'1px solid white', color:'white', padding:'5px 15px', borderRadius:'5px', cursor:'pointer'}}>
              <i className="fas fa-arrow-left"></i> Back to Dashboard
            </button>
        </div>
      </nav>

      <main className="rd-main-content rd-wrapper" style={{marginTop: '100px'}}>
        
        <div className="rd-hero-text" style={{textAlign: 'center', marginBottom: '40px'}}>
          <h1><i className="fas fa-map-marked-alt"></i> Flood Impact Simulation</h1>
          <p>Visualizing impact at water level: <strong>{floodData?.current_water_level}m</strong></p>
        </div>

        {/* STATS GRID */}
        <div className="rd-stats-grid">
            <div className="rd-card glass">
                <div className="card-head"><span>Forecast Level</span></div>
                <div className="big-stat">{floodData?.current_water_level} m</div>
            </div>
            <div className="rd-card glass">
                <div className="card-head"><span>Affected Areas</span></div>
                <div className="big-stat" style={{color: '#ef4444'}}>{floodData?.flooded_count || 0}</div>
            </div>
            <div className="rd-card glass" style={{cursor:'pointer'}} onClick={() => setViewMode(viewMode === 'map' ? 'table' : 'map')}>
                <div className="card-head"><span>View Mode</span></div>
                <div className="big-stat" style={{fontSize: '1.5rem', marginTop: '10px'}}>
                    {viewMode === 'map' ? <><i className="fas fa-table"></i> Switch to Table</> : <><i className="fas fa-map"></i> Switch to Map</>}
                </div>
            </div>
        </div>

        {/* 🟢 MAP OR TABLE SECTION */}
        {floodData?.data && floodData.data.length > 0 ? (
          <section className="rd-section glass" style={{marginTop: '30px', height: '600px', padding: '10px'}}>
            
            {viewMode === 'map' ? (
                // 🟢 MAP VIEW
                <MapContainer 
                    center={[10.16, 76.43]} // Coordinates for Kalady/Neeleeswaram
                    zoom={13} 
                    style={{ height: "100%", width: "100%", borderRadius: "10px" }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                    />
                    
                    {/* Render a circle for each flooded point */}
                    {floodData.data.map((point, idx) => (
                        <CircleMarker 
                            key={idx}
                            center={[point.lat, point.lon]}
                            radius={5}
                            pathOptions={{ color: getSeverityColor(point.depth), fillColor: getSeverityColor(point.depth), fillOpacity: 0.7 }}
                        >
                            <Popup>
                                <strong>Flood Depth: {point.depth}m</strong><br/>
                                {point.explanation}<br/>
                                Lat: {point.lat}, Lon: {point.lon}
                            </Popup>
                        </CircleMarker>
                    ))}
                </MapContainer>
            ) : (
                // 🟢 TABLE VIEW (Your existing table code)
                <div style={{overflowX: 'auto', height: '100%'}}>
                    <table style={{width: '100%', borderCollapse: 'collapse', color: 'white'}}>
                        <thead>
                        <tr style={{borderBottom: '1px solid rgba(255,255,255,0.2)', textAlign: 'left'}}>
                            <th style={{padding: '12px'}}>Coordinates</th>
                            <th style={{padding: '12px'}}>Depth</th>
                            <th style={{padding: '12px'}}>Severity</th>
                        </tr>
                        </thead>
                        <tbody>
                        {floodData.data.slice(0, 100).map((row, idx) => (
                            <tr key={idx} style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                            <td style={{padding: '12px', fontFamily: 'monospace', color:'#fbbf24'}}>{row.lat}, {row.lon}</td>
                            <td style={{padding: '12px', fontWeight:'bold'}}>+{row.depth}m</td>
                            <td style={{padding: '12px'}}>{row.explanation}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
          </section>
        ) : (
          <div className="rd-section glass" style={{marginTop: '30px', textAlign:'center', padding:'40px'}}>
            <h3><i className="fas fa-check-circle" style={{color:'#10b981'}}></i> No flood risks detected.</h3>
            <p>At {floodData?.current_water_level}m, the river is within safe banks.</p>
          </div>
        )}

      </main>
    </div>
  );
};

export default FloodMap;