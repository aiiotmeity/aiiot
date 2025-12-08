import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Aiiot.css'; 

const ResourcesPage = () => {
  // --- Navigation State ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [projectsDropdownOpen, setProjectsDropdownOpen] = useState(false);
  const [mobileLaunchesExpanded, setMobileLaunchesExpanded] = useState(false);

   const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [heroImages, setHeroImages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // --- MEGA MENU STATES (ADDED) ---
    const [activeCategory, setActiveCategory] = useState('Air Quality');
    const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
    const productMenuData = {
    'Air Quality': {
      title: 'Air Quality Monitoring',
      description: 'Precision sensors for indoor and outdoor environments.',
      items: [
        // LINK FORMAT: /product-details/unique-id
        { name: 'Indoor Monitor', image: '/sensor_modules/aqicrop.jpeg', link: '/product-details/indoor-monitor' },
        { name: 'Outdoor Station', image: '/sensor_modules/aqi1.jpeg', link: '/product-details/outdoor-station' },
        { name: 'Gas Sensors', image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400', link: '/product-details/gas-sensors' }
      ]
    },
    'Water Solutions': {
      title: 'Water Management',
      description: 'Flood alerts and distribution logic.',
      items: [
        { name: 'Flood Alert System', image: '/sensor_modules/river1.jpg', link: '/product-details/flood-alert' },
        { name: 'Level Sensors', image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400', link: '/product-details/level-sensors' },
        { name: 'Distribution Net', image: '/sensor_modules/distribution.jpeg', link: '/product-details/distribution-net' }
      ]
    },
    'Weather': {
      title: 'Weather Stations',
      description: 'Hyper-local weather data collection.',
      items: [
        { name: 'Auto Weather Station', image: '/sensor_modules/weather.jpg', link: '/product-details/weather-station' },
        { name: 'Rain Gauges', image: 'https://images.unsplash.com/photo-1590055531860-6902633df018?w=400', link: '/product-details/rain-gauge' }
      ]
    },
    'Training': {
      title: 'Skill Development',
      description: 'Kits and workshops for students.',
      items: [
        { name: 'IoT Starter Kits', image: '/sensor_modules/skill.jpg', link: '/product-details/iot-starter-kit' },
        { name: 'PCB Workshops', image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400', link: '/product-details/pcb-workshop' }
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

  const styles = {
    container: { maxWidth: '80rem', margin: '0 auto', padding: '8rem 1rem 4rem 1rem', fontFamily: 'sans-serif' },
    section: { marginBottom: '4rem' },
    heading: { fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem', borderLeft: '5px solid #3b82f6', paddingLeft: '1rem' },
    // Standard Grid for Brochures
    cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' },
    // NEW STYLE: Vertical Stack for Top Section
    verticalStack: { display: 'flex', flexDirection: 'column', gap: '2rem' },
    card: { background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column' },
    btn: { display: 'inline-block', marginTop: '1rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', textDecoration: 'none', borderRadius: '0.375rem', fontWeight: 500 }
  };

  return (
    <div className="aiiot-page-container">
      
      {/* ===================================================== */}
      {/* NAVIGATION HEADER                                     */}
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
                               <Link to="https://aiiot.it.com/project/intelligent-sensor" className="nav-link product-trigger">
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
      {/* MAIN CONTENT                                          */}
      {/* ===================================================== */}
      <div style={styles.container}>
        
        {/* 1. Facility & Objectives Section (STACKED VERTICALLY) */}
        <section style={styles.section}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b', textAlign: 'center', marginBottom: '3rem' }}>
            Center for AI-IoT Innovation
          </h1>
          
          {/* Using verticalStack instead of cardGrid here */}
          <div style={styles.verticalStack}>
            {/* Vision / Facility Description Card */}
            

            {/* Mission / Objectives Card */}
            <div style={{ ...styles.card, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#166534', marginBottom: '1rem' }}>Our Objectives</h3>
              <p style={{ color: '#14532d', fontWeight: 600, marginBottom: '0.75rem', fontSize: '1.1rem' }}>
                Main Objective: Development of digital networking for preventive and predictive environmental and climatic warning solutions.
              </p>
              <ul style={{ color: '#14532d', paddingLeft: '1.2rem', marginTop: '0.5rem', lineHeight: 1.8, fontSize: '1.05rem' }}>
                <li style={{marginBottom:'0.5rem'}}>Develop intelligent sensor modules for pollution monitoring.</li>
                <li style={{marginBottom:'0.5rem'}}>Validate smart water level monitoring with flood alerts.</li>
                <li style={{marginBottom:'0.5rem'}}>Create digital systems for water level distribution.</li>
                <li style={{marginBottom:'0.5rem'}}>Build a startup & skill development ecosystem.</li>
                <li>Develop Explainable AI (XAI) analysis software for IoT.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2. Documents & Brochures (REMAINS GRID) */}
        <section style={styles.section}>
          <h2 style={styles.heading}>📄 Official Documents & Brochures</h2>
          {brochures.length === 0 ? (
            <p style={{ color: '#64748b' }}>Loading resources...</p>
          ) : (
            <div style={styles.cardGrid}>
              {brochures.map((b, idx) => (
                <div key={idx} style={styles.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', background: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{b.category}</span>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.5rem' }}>{b.title}</h4>
                      <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{b.description}</p>
                    </div>
                  </div>
                  <a href={b.url} target="_blank" rel="noopener noreferrer" style={styles.btn}>
                    Download PDF ⬇️
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        <div style={{textAlign: 'center', marginTop: '2rem'}}>
          <Link to="/" style={{color: '#64748b', textDecoration: 'none'}}>← Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default ResourcesPage;