import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Resources.css';
import './ProjectDetail.css'; // Import this to ensure Nav styles work

const ResourcesPage = () => {
  // --- NAV STATES (COPIED FROM PROJECT DETAIL) ---
  const [activeCategory, setActiveCategory] = useState('Air Quality');
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileProductExpanded, setMobileProductExpanded] = useState(false);
  const [isSolutionsMenuOpen, setIsSolutionsMenuOpen] = useState(false); 
  const [mobileSolutionsExpanded, setMobileSolutionsExpanded] = useState(false); 

  // --- PAGE STATES ---
  const [activeTab, setActiveTab] = useState('publications'); // Default tab
  const [workshops, setWorkshops] = useState([]);
  const [brochures, setBrochures] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://aiiot-1.onrender.com'
  : 'http://localhost:8000';

  // --- NAV DATA ---
  const solutionsList = [
    { name: 'Air Quality Monitoring', link: '/project/intelligent-sensor' },
    { name: 'Flood Alert System', link: '/project/water-level' },
    { name: 'Digital Water Distribution', link: '/project/digital-water' },
    { name: 'Startup & Skill Development', link: '/project/startup-skill' }
  ];

  const productMenuData = {
    'Air Quality': {
      title: 'Air Quality Monitoring',
      description: 'Precision sensors for indoor and outdoor environments.',
      items: [
        { name: 'AQMS ', image: '/sensor_modules/aqms-station1.jpg', link: '/product-details/indoor-monitor' },
        { name: 'AQMS  ', image: '/sensor_modules/aqi1.jpeg', link: '/product-details/outdoor-station' },
        { name: 'Gas Sensors', image: '/sensor_modules/aqi-indoor.jpeg', link: '/product-details/gas-sensors' }
      ]
    },
    'Water Solutions': {
      title: 'Water Management',
      description: 'Flood alerts and distribution logic.',
      items: [
        { name: 'Predictive Flood Alert', image: '/sensor_modules/river1.jpg', link: '/product-details/flood-alert' },
        { name: 'Digital Flow Meter', image: '/sensor_modules/distribution.jpeg', link: '/product-details/distribution-net' }
      ]
    },
    'Weather': {
      title: 'Weather Stations',
      description: 'Hyper-local weather data collection.',
      items: [
        { name: 'AWS', image: '/sensor_modules/weather.jpg', link: '/product-details/weather-station' },
      ]
    },
    'Training': {
      title: 'Skill Development',
      description: 'Kits and workshops for students.',
      items: [
        { name: 'IoT Workshops & Internships', image: '/sensor_modules/skill.jpg', link: '/product-details/iot-training' },
        { name: 'PCB Design Course', image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400', link: '/product-details/pcb-workshop' }
      ]
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const wsRes = await fetch(`${API_BASE_URL}/api/workshops/`);
        const wsData = await wsRes.json();
        setWorkshops(wsData.results || wsData);

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

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isMobileMenuOpen]);

  return (
    <div className="resources-page-container">
      
      {/* ================= HEADER SECTION (COPIED FROM PROJECTDETAIL) ================= */}
      <header className="aiiot-header-local" style={{position: 'fixed', top: 0, width: '100%', zIndex: 1000, background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'}}>
         <div className="project-header-inner">
            <Link to="/" className="project-logo">
                AI-IoT Innovations
            </Link>

            <div className="project-desktop-nav">
               <Link to="/" className="project-nav-link">Home</Link>
               
               {/* SOLUTIONS DROPDOWN */}
               <div 
                   className="dropdown-wrapper"
                   onMouseEnter={() => setIsSolutionsMenuOpen(true)}
                   onMouseLeave={() => setIsSolutionsMenuOpen(false)}
               >
                   <div className="project-nav-link product-trigger" style={{ cursor: 'pointer' }}>
                     Solutions <span>▾</span>
                   </div>
                   <div className={`simple-dropdown ${isSolutionsMenuOpen ? 'visible' : ''}`}>
                     {solutionsList.map((sol, index) => (
                       <Link key={index} to={sol.link} className="simple-dropdown-item">
                         {sol.name}
                       </Link>
                     ))}
                   </div>
               </div>
               
               {/* PRODUCTS MEGA MENU */}
               <div 
                   className="mega-menu-wrapper"
                   onMouseEnter={() => setIsMegaMenuOpen(true)}
                   onMouseLeave={() => setIsMegaMenuOpen(false)}
                 >
                   <Link to="" className="project-nav-link product-trigger">
                     Products <span>▾</span>
                   </Link>
   
                   <div className={`mega-menu-container ${isMegaMenuOpen ? 'visible' : ''}`}>
                     <div className="mega-menu-sidebar">
                       {Object.keys(productMenuData).map((key) => (
                         <div 
                           key={key} 
                           className={`mega-sidebar-item ${activeCategory === key ? 'active' : ''}`}
                           onMouseEnter={() => setActiveCategory(key)}
                         >
                           {key} <span>›</span>
                         </div>
                       ))}
                     </div>
   
                     <div className="mega-menu-content">
                       <div className="mega-content-header">
                         <h4>{productMenuData[activeCategory].title}</h4>
                         <p>{productMenuData[activeCategory].description}</p>
                       </div>
                       <div className="mega-grid">
                         {productMenuData[activeCategory].items.map((item, idx) => (
                           <Link to={item.link} key={idx} className="mega-product-card">
                              <div className="mega-img-box">
                                <img src={item.image} alt={item.name} />
                              </div>
                              <span>{item.name}</span>
                           </Link>
                         ))}
                       </div>
                     </div>
                   </div>
                 </div>

               <a href="/#contact" className="btn-primary-small">Get in Touch</a>
            </div>

            <button 
                className="mobile-nav-toggle"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                {isMobileMenuOpen ? '✕' : '☰'}
            </button>
         </div>

         {/* MOBILE OVERLAY */}
         {isMobileMenuOpen && (
            <div className="mobile-menu-wrapper">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="mobile-link">Home</Link>
                {/* SOLUTIONS MOBILE */}
                <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                    <div 
                        onClick={() => setMobileSolutionsExpanded(!mobileSolutionsExpanded)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', padding: '1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}
                    >
                        Solutions <span>{mobileSolutionsExpanded ? '▴' : '▾'}</span>
                    </div>
                    {mobileSolutionsExpanded && (
                        <div style={{ background: '#f8fafc', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                            {solutionsList.map((sol, i) => (
                                <Link 
                                    key={i} 
                                    to={sol.link} 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    style={{ display: 'block', padding: '0.5rem 0', fontSize: '0.95rem', color: '#475569', textDecoration: 'none', borderBottom: i !== solutionsList.length -1 ? '1px solid #e2e8f0' : 'none' }}
                                >
                                    • {sol.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
                {/* PRODUCTS MOBILE */}
                <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                    <div 
                        onClick={() => setMobileProductExpanded(!mobileProductExpanded)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', padding: '1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}
                    >
                        Products <span>{mobileProductExpanded ? '▴' : '▾'}</span>
                    </div>
                    {mobileProductExpanded && (
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                            {Object.keys(productMenuData).map((categoryKey) => (
                                <div key={categoryKey} style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: '700', textTransform: 'uppercase', marginBottom:'0.5rem' }}>{categoryKey}</div>
                                    {productMenuData[categoryKey].items.map((item, i) => (
                                        <Link 
                                            key={i} 
                                            to={item.link} 
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            style={{ display: 'block', padding: '0.25rem 0', fontSize: '0.95rem', color: '#475569', textDecoration: 'none' }}
                                        >
                                            • {item.name}
                                        </Link>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <a href="/#contact" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary" style={{ textAlign: 'center', marginTop: '1rem' }}>Get in Touch</a>
            </div>
         )}
      </header>
      
      {/* Space to push content down from fixed header */}
      <div style={{height: '80px'}}></div>

      {/* --- R&D HEADER --- */}
      <div className="rd-header">
         <div className="rd-header-content">
             <h1>Research & Development Center</h1>
             <p>Driving innovation through IoT, AI, and Environmental Intelligence.</p>
         </div>
      </div>

      <div className="resources-content-wrapper">
        
        {/* --- OBJECTIVES CARD (UPDATED) --- */}
        <div className="objectives-card">
            <h3 className="objectives-title">🎯 R&D Mission & Objectives</h3>
            {/* NEW BULLETED LIST ADDED HERE */}
            <ul className="objectives-list" style={{ paddingLeft: '1.5rem', color: '#475569', lineHeight: '1.8' }}>
              <li>Develop intelligent sensor modules for pollution monitoring.</li>
              <li>Validate smart water level monitoring with flood alerts.</li>
              <li>Create digital systems for water level distribution.</li>
              <li>Build a startup & skill development ecosystem.</li>
              
            </ul>
        </div>

        {/* --- TABS NAVIGATION --- */}
        <div className="rd-tabs">
            <button 
                className={`rd-tab-btn ${activeTab === 'publications' ? 'active' : ''}`}
                onClick={() => setActiveTab('publications')}
            >
                Publications, Patents & Research
            </button>
            <button 
                className={`rd-tab-btn ${activeTab === 'training' ? 'active' : ''}`}
                onClick={() => setActiveTab('training')}
            >
                Training & Workshops
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
                    
                    {/* --- RESEARCH SECTION --- */}
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

                    {/* --- DOWNLOADS SECTION --- */}
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