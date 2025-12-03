import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// IMPORT CSS TO ENSURE NAV STYLES WORK
import './Aiiot.css'; 

const ResourcesPage = () => {
  // --- Navigation State (Copied from AIIOT_INDEX) ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [projectsDropdownOpen, setProjectsDropdownOpen] = useState(false);
  const [mobileLaunchesExpanded, setMobileLaunchesExpanded] = useState(false);

  // --- Resource Logic ---
  const [brochures, setBrochures] = useState([]);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

  // --- Click Outside Logic for Dropdowns ---
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
    // Increased top padding to 8rem to account for fixed header
    container: { maxWidth: '80rem', margin: '0 auto', padding: '8rem 1rem 4rem 1rem', fontFamily: 'sans-serif' },
    section: { marginBottom: '4rem' },
    heading: { fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem', borderLeft: '5px solid #3b82f6', paddingLeft: '1rem' },
    cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' },
    card: { background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
    btn: { display: 'inline-block', marginTop: '1rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', textDecoration: 'none', borderRadius: '0.375rem', fontWeight: 500 }
  };

  return (
    <div className="aiiot-page-container">
      
      {/* ===================================================== */}
      {/* COPIED NAVIGATION HEADER                              */}
      {/* ===================================================== */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '5rem',
        zIndex: 1000,
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.08)'
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '5rem' }}>
            
            {/* --- LOGO (Links back to Home) --- */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 1001, textDecoration: 'none' }}>
              <div style={{
                width: 'auto',
                height: '3.25rem',
                borderRadius: '0.5rem',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.25rem',
                boxShadow: '0 3px 10px rgba(0, 0, 0, 0.12)',
                border: '1px solid #e2e8f0'
              }}>
                <img src="/logo/logo.png" alt="Adi Shankara Institute" style={{ height: '100%', width: 'auto' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>
                  AI-IoT Innovations
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }} className="logo-text-secondary">
                  Adi Shankara Engineering Institute
                </span>
              </div>
            </Link>

            {/* --- DESKTOP NAVIGATION --- */}
            <div className="desktop-nav">
              {/* Note: Added '/' to hrefs to ensure they go back to the home page anchors */}
              <a href="/#about" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }} 
                 onMouseEnter={(e) => e.target.style.color = '#3b82f6'} onMouseLeave={(e) => e.target.style.color = '#475569'}>
                 About
              </a>
              <a href="/#team" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}
                 onMouseEnter={(e) => e.target.style.color = '#3b82f6'} onMouseLeave={(e) => e.target.style.color = '#475569'}>
                 Team
              </a>

              <Link 
                to="/resources" 
                style={{ fontSize: '0.875rem', fontWeight: 600, color: '#3b82f6', textDecoration: 'none' }}
              >
                Resources
              </Link>

              <a href="/#projects" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}
                 onMouseEnter={(e) => e.target.style.color = '#3b82f6'} onMouseLeave={(e) => e.target.style.color = '#475569'}>
                 Projects
              </a>

              {/* Launches Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => { setProjectsDropdownOpen(!projectsDropdownOpen); }}
                  style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'} onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}
                >
                  Launches <span style={{ fontSize: '0.75rem' }}>▼</span>
                </button>
                {projectsDropdownOpen && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', minWidth: '14rem', zIndex: 100 }}>
                     <Link to="/homepage" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', textDecoration: 'none', color: '#1e293b' }}>
                        <span style={{ fontSize: '1.25rem' }}>🌬️</span>
                        <div><div style={{fontWeight:600, fontSize:'0.9rem'}}>AirAware</div><div style={{fontSize:'0.75rem', color:'#64748b'}}>Air Monitor</div></div>
                     </Link>
                     <a href="/weather-home" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', textDecoration: 'none', color: '#1e293b', borderTop:'1px solid #f1f5f9' }}>
                        <span style={{ fontSize: '1.25rem' }}>💧</span>
                        <div><div style={{fontWeight:600, fontSize:'0.9rem'}}>AWS Link</div><div style={{fontSize:'0.75rem', color:'#64748b'}}>Water Monitor</div></div>
                     </a>
                  </div>
                )}
              </div>

              <a href="/#contact" style={{ padding: '0.625rem 1.25rem', background: '#3b82f6', color: 'white', fontSize: '0.875rem', fontWeight: 600, borderRadius: '0.5rem' }}>
                Get in Touch
              </a>
            </div>

            {/* --- MOBILE HAMBURGER BUTTON --- */}
            <button className="mobile-nav-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>

          </nav>
        </div>

        {/* --- MOBILE MENU CONTENT --- */}
        {isMobileMenuOpen && (
          <div className="mobile-menu-wrapper">
            <a href="/#about" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'block', padding: '1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>About</a>
            <a href="/#team" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'block', padding: '1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>Team</a>
            
            <Link 
              to="/resources" 
              onClick={() => setIsMobileMenuOpen(false)} 
              style={{ display: 'block', padding: '1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#3b82f6', borderBottom: '1px solid #f1f5f9', textDecoration: 'none' }}
            >
              Resources
            </Link>

            <a href="/#projects" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'block', padding: '1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>Projects</a>

            {/* Mobile Launches Accordion */}
            <div style={{ borderBottom: '1px solid #f1f5f9', marginBottom:'2rem' }}>
              <button onClick={() => setMobileLaunchesExpanded(!mobileLaunchesExpanded)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '1rem 0', background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>
                Launches <span>{mobileLaunchesExpanded ? '−' : '+'}</span>
              </button>
              {mobileLaunchesExpanded && (
                <div className="mobile-submenu">
                  <Link to="/homepage" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'block', padding: '0.75rem 0', color: '#1e293b', fontWeight:500 }}>🌬️ AirAware Monitor</Link>
                  <a href="/weather-home" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'block', padding: '0.75rem 0', color: '#1e293b', fontWeight:500 }}>💧 AWS Water Monitor</a>
                </div>
              )}
            </div>

            <a href="/#contact" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'block', width: '100%', padding: '1rem', background: '#3b82f6', color: 'white', textAlign: 'center', borderRadius: '0.5rem', fontWeight: 600, fontSize: '1.1rem' }}>
              Get in Touch
            </a>
          </div>
        )}
      </header>


      {/* ===================================================== */}
      {/* MAIN RESOURCES CONTENT                                */}
      {/* ===================================================== */}
      <div style={styles.container}>
        {/* 1. Header & Vision/Mission */}
        <section style={styles.section}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b', textAlign: 'center', marginBottom: '3rem' }}>
            Resources & Opportunities
          </h1>
          
          <div style={styles.cardGrid}>
            <div style={{ ...styles.card, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e40af', marginBottom: '0.5rem' }}>Our Vision</h3>
              <p style={{ color: '#1e3a8a' }}>To be a global leader in AI-IoT integration, fostering a culture of innovation that bridges the gap between theoretical hardware design and intelligent software application.</p>
            </div>
            <div style={{ ...styles.card, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#166534', marginBottom: '0.5rem' }}>Our Mission</h3>
              <p style={{ color: '#14532d' }}>To provide state-of-the-art facilities for research, empower students through hands-on internships, and disseminate knowledge through seminars and open-source resources.</p>
            </div>
          </div>
        </section>

        {/* 4. Documents & Brochures (Fetched from API) */}
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