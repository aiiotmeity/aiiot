import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Resources.css';

const ResourcesPage = () => {
  const [activeTab, setActiveTab] = useState('training'); // 'training' or 'publications'
  const [workshops, setWorkshops] = useState([]);
  const [brochures, setBrochures] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://aiiot-1.onrender.com'
  : 'http://localhost:8000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Workshops (The Table Data)
        const wsRes = await fetch(`${API_BASE_URL}/api/workshops/`);
        const wsData = await wsRes.json();
        setWorkshops(wsData.results || wsData);

        // 2. Fetch Brochures (The Downloads)
        const broRes = await fetch(`${API_BASE_URL}/api/brochures/`);
        const broData = await broRes.json();
        setBrochures(broData.results || broData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching R&D data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, [API_BASE_URL]);

  return (
    <div className="resources-page-container">
      
      {/* --- Header Section --- */}
      <header className="rd-header">
         <div className="rd-header-content">
             <h1>Research & Development Center</h1>
             <p>Driving innovation through IoT, AI, and Environmental Intelligence.</p>
             <Link to="/" className="back-link">← Back to Home</Link>
         </div>
      </header>

      <div className="resources-content-wrapper">
        
        {/* --- Objectives Card --- */}
        <div className="objectives-card">
            <h3 className="objectives-title">🎯 R&D Mission</h3>
            <p className="main-objective-text">
              To develop digital networking solutions for preventive and predictive environmental monitoring while fostering a startup ecosystem.
            </p>
        </div>

        {/* --- TABS NAVIGATION --- */}
        <div className="rd-tabs">
            <button 
                className={`rd-tab-btn ${activeTab === 'training' ? 'active' : ''}`}
                onClick={() => setActiveTab('training')}
            >
                Training & Workshops
            </button>
            <button 
                className={`rd-tab-btn ${activeTab === 'publications' ? 'active' : ''}`}
                onClick={() => setActiveTab('publications')}
            >
                Publications, Patents & Research
            </button>
        </div>

        {/* --- CONTENT AREA --- */}
        <div className="rd-content-area">
            
            {loading && <div className="loading-spinner">Loading R&D Data...</div>}

            {/* TAB 1: TRAINING TABLE */}
            {!loading && activeTab === 'training' && (
                <div className="table-responsive">
                    <table className="rd-table">
                        <thead>
                            <tr>
                                <th>Program Title</th>
                                <th>Type</th>
                                <th>Duration</th>
                                <th>Dates</th>
                                <th>Participants</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workshops.length > 0 ? (
                                workshops.map((row, idx) => (
                                    <tr key={idx}>
                                        <td className="fw-bold">{row.title}</td>
                                        <td><span className="badge-type">{row.category}</span></td>
                                        <td>{row.duration || 'N/A'}</td>
                                        <td>{row.event_date_text}</td>
                                        <td>{row.participants}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center">No upcoming training programs.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* TAB 2: PUBLICATIONS & PATENTS */}
            {!loading && activeTab === 'publications' && (
                <div className="publications-wrapper">
                    
                    {/* --- NEW SECTION: Static Research Data --- */}
                    <div className="research-highlights-card">
                        <div className="research-section">
                            <h3 className="section-title">📜 Intellectual Property (Patents)</h3>
                            <ul className="research-list">
                                <li>
                                    <strong>Patent Filed:</strong> "Artificial Intelligence Integrated Water Level Monitoring Solution with an Associated Alert for Floods"
                                    <br />
                                    <span className="text-muted">Application Number: 202441079490 | Filed: October 25, 2024 (INDIA Patent Office)</span>
                                </li>
                            </ul>
                        </div>
                        
                        <div className="research-divider"></div>

                        <div className="research-section">
                            <h3 className="section-title">📚 Research Publications & Submissions</h3>
                            <ul className="research-list">
                                <li>
                                    <span className="badge-status published">Published</span>
                                    <strong> "Comparative Analysis of RNN models for Air Pollution Forecasting"</strong>
                                    <br />
                                    <span className="text-muted">Presented in ICICDS-2025</span>
                                </li>
                                <li>
                                    <span className="badge-status accepted">Accepted</span>
                                    <strong> "AI-Based Environmental Pollution Monitoring with Personalized Health Risk Assessment"</strong>
                                    <br />
                                    <span className="text-muted">Accepted for presentation at the Second International Conference on Security, Surveillance and Artificial Intelligence (ICSSAI-2025), Kolkata.</span>
                                </li>
                                <li>
                                    <span className="badge-status communicated">Communicated</span>
                                    <strong> "A Comparative Analysis of Conventional Methods for Sensor-Driven Spatial Interpolation for Air Quality Monitoring"</strong>
                                    <br />
                                    <span className="text-muted">Communicated to Engineering, Technology & Applied Science Research.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* --- EXISTING SECTION: Downloadable Brochures --- */}
                    <h3 className="mt-8 mb-4 section-title-small">📥 Downloads & Resources</h3>
                    {brochures.length > 0 ? (
                        <div className="brochure-grid">
                            {brochures.map((b, idx) => (
                                <div key={idx} className="brochure-card">
                                    <div className="brochure-icon">{b.icon || '📄'}</div>
                                    <div>
                                        <span className="card-category-badge">{b.category}</span>
                                        <h4 className="card-title">{b.title}</h4>
                                        <p className="card-desc">{b.description}</p>
                                    </div>
                                    <a href={b.file} target="_blank" rel="noopener noreferrer" className="download-btn">
                                        Download PDF
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted">No downloadable resources available at the moment.</p>
                    )}
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default ResourcesPage;