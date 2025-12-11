import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Resources.css'; // <--- Import the new CSS

const ResourcesPage = () => {
  // --- Navigation State ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [projectsDropdownOpen, setProjectsDropdownOpen] = useState(false);
  const [mobileLaunchesExpanded, setMobileLaunchesExpanded] = useState(false);

   const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [heroImages, setHeroImages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // --- MEGA MENU STATES ---
    const [activeCategory, setActiveCategory] = useState('Air Quality');
    const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);

    // --- MEGA MENU DATA ---
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


  // --- Resource Logic ---
  const [brochures, setBrochures] = useState([]);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

  // --- Click Outside Logic ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      const navElement = document.querySelector('nav');
      if (navElement && !navElement.contains(event.target)) {
        setProjectsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // --- Fetch Brochures Logic ---
  useEffect(() => {
    const fetchBrochures = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/brochures/`);
        const data = await response.json();
        const brochureArray = data.results || data;

        if (brochureArray && brochureArray.length > 0) {
          const formatted = brochureArray.map(b => ({
            title: b.title,
            description: b.description,
            url: b.file.startsWith('http') ? b.file : `${API_BASE_URL}${b.file}`,
            category: b.category || 'General'
          }));
          setBrochures(formatted);
        }
      } catch (error) {
        console.error('Error fetching brochures:', error);
      }
    };
    fetchBrochures();
  }, [API_BASE_URL]);

  return (
    <div className="resources-page-container">
      
      {/* ===================================================== */}
      {/* NAVIGATION HEADER (Kept your logic, updated classes)  */}
      {/* ===================================================== */}
      <header className="aiiot-header-local">
               <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem', position: 'relative' }}>
                         <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '5rem' }}>
                           
                           {/* LOGO */}
                           <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', zIndex: 1001 }}>
                             <div className="logo-box">
                               <img src="/logo/logo.png" alt="Adi Shankara Institute" style={{ height: '100%', width: 'auto' }} />
                             </div>
                             <div style={{ display: 'flex', flexDirection: 'column' }}>
                               <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>AI-IoT Innovations</span>
                               <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Adi Shankara Engineering Institute</span>
                             </div>
                           </Link>
               
                           {/* DESKTOP NAV */}
                           <div className="desktop-nav">
                             <a href="https://aiiot.it.com/project/intelligent-sensor" className="nav-link">Solutions</a>
               
                             <Link to="/resources" className="nav-link">Resources</Link>
                             
                             {/* === MEGA MENU IMPLEMENTATION === */}
                             <div 
                               className="mega-menu-wrapper"
                               onMouseEnter={() => setIsMegaMenuOpen(true)}
                               onMouseLeave={() => setIsMegaMenuOpen(false)}
                             >
                               <Link to="" className="nav-link product-trigger">
                                 Products <span>▾</span>
                               </Link>
               
                               <div className={`mega-menu-container ${isMegaMenuOpen ? 'visible' : ''}`}>
                                 {/* LEFT SIDEBAR (Categories) */}
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
               
                                 {/* RIGHT CONTENT (Grid) */}
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
                             {/* === END MEGA MENU === */}
               
                             
                             <a href="#contact" className="nav-btn-primary">Get in Touch</a>
                           </div>
               
                           {/* MOBILE HAMBURGER BUTTON */}
                           <button className="mobile-nav-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                             {isMobileMenuOpen ? '✕' : '☰'}
                           </button>
                         </nav>
                       </div>
            </header>


      {/* ===================================================== */}
      {/* MAIN CONTENT (Updated with CSS Classes)               */}
      {/* ===================================================== */}
      <div className="resources-content-wrapper">
        
        {/* 1. Facility & Objectives Section */}
        <section className="resources-hero-section">
          <h1 className="page-title">Center for AI-IoT Innovation</h1>
          
          <div className="objectives-card">
            <h3 className="objectives-title">🚀 Our Objectives</h3>
            
            <p className="main-objective-text">
              Main Objective: Development of digital networking for preventive and predictive environmental and climatic warning solutions.
            </p>
            
            <ul className="objectives-list">
              <li>Develop intelligent sensor modules for pollution monitoring.</li>
              <li>Validate smart water level monitoring with flood alerts.</li>
              <li>Create digital systems for water level distribution.</li>
              <li>Build a startup & skill development ecosystem.</li>
              <li>Develop Explainable AI (XAI) analysis software for IoT.</li>
            </ul>
          </div>
        </section>

        {/* 2. Documents & Brochures */}
        <section>
          <h2 className="resources-section-title">📄 Official Documents & Brochures</h2>
          
          {brochures.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center' }}>Loading resources...</p>
          ) : (
            <div className="brochure-grid">
              {brochures.map((b, idx) => (
                <div key={idx} className="brochure-card">
                  <div>
                    <span className="card-category-badge">{b.category}</span>
                    <h4 className="card-title">{b.title}</h4>
                    <p className="card-desc">{b.description}</p>
                  </div>
                  <a href={b.url} target="_blank" rel="noopener noreferrer" className="download-btn">
                    <span>📥</span> Download PDF
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="back-link-wrapper">
          <Link to="/" className="back-link">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default ResourcesPage;