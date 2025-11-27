// filepath: c:\React\my-django-react-app\frontend\src\component_aiiot\Aiiot_index.js
import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import './Aiiot.css';

const AIIOT_INDEX = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [projectsDropdownOpen, setProjectsDropdownOpen] = useState(false);
  const [heroImages, setHeroImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resourcesDropdownOpen, setResourcesDropdownOpen] = useState(false);
  const [brochures, setBrochures] = useState([]);
  const [brochuresLoading, setBrochuresLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null); // NEW: Track selected category
  const [categories, setCategories] = useState([]); // NEW: Store unique categories
  // ... existing states ...
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileResourcesExpanded, setMobileResourcesExpanded] = useState(false);
  const [mobileLaunchesExpanded, setMobileLaunchesExpanded] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
  // Map project titles to IDs
  const projectIdMap = {
    'Intelligent Sensor Module': 'intelligent-sensor',
    'Smart Water Level Monitoring': 'water-level',
    'Digital Water Distribution': 'digital-water',
    'Startup & Skill Development': 'startup-skill',
    'Explainable AI Software': 'xai-software'
  };

  // Map project titles to IDs
 
  // Add this useEffect after your other useEffects

useEffect(() => {
  const handleClickOutside = (event) => {
    // Check if click is outside the navigation area
    const navElement = document.querySelector('nav');
    if (navElement && !navElement.contains(event.target)) {
      setResourcesDropdownOpen(false);
      setProjectsDropdownOpen(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, []);
  
  

  useEffect(() => {
    const fetchBrochures = async () => {
      setBrochuresLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/brochures/`);
        if (!response.ok) throw new Error('Failed to fetch brochures');
        
        const data = await response.json();
        const brochureArray = data.results || data;
        
        if (brochureArray && brochureArray.length > 0) {
          const formattedBrochures = brochureArray.map(brochure => {
  // FIX: Check if the file URL is already absolute (starts with http)
          const fileUrl = brochure.file;
          const finalUrl = fileUrl.startsWith('http') 
            ? fileUrl 
            : `${API_BASE_URL}${fileUrl}`;

          return {
            title: brochure.title,
            description: brochure.description,
            icon: brochure.icon || '📄',
            url: finalUrl,  // Use the corrected URL here
            type: "PDF",
            category: brochure.category,
            id: brochure.id
          };
        });
          
          // Extract unique categories
          const uniqueCategories = [...new Set(formattedBrochures.map(b => b.category))];
          
          console.log('Brochures fetched:', formattedBrochures);
          console.log('Categories:', uniqueCategories);
          
          setBrochures(formattedBrochures);
          setCategories(uniqueCategories);
          setSelectedCategory(null); // Reset category selection
        }
      } catch (error) {
        console.error('Error fetching brochures:', error);
      } finally {
        setBrochuresLoading(false);
      }
    };

    fetchBrochures();
  }, []);

  // NEW: Filter brochures by category
  const filteredBrochures = selectedCategory 
    ? brochures.filter(b => b.category === selectedCategory)
    : brochures;

 
  useEffect(() => {
    // Initialize Feather Icons (if available)
    if (window.feather) {
      window.feather.replace();
    }

    // Reveal on scroll animation
    const scrollElements = document.querySelectorAll(".reveal-on-scroll");

    const elementInView = (el, dividend = 1) => {
      const elementTop = el.getBoundingClientRect().top;
      return elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend;
    };

    const displayScrollElement = (element) => element.classList.add("is-visible");

    const handleScrollAnimation = () => {
      scrollElements.forEach((el) => {
        if (elementInView(el, 1.25)) displayScrollElement(el);
      });
    };
  

  

    handleScrollAnimation(); // Initial check
    window.addEventListener("scroll", handleScrollAnimation);

    // Setup carousel with local images from public folder
    setupCarousel();

    return () => {
      window.removeEventListener("scroll", handleScrollAnimation);
    };
  }, []);

  const setupCarousel = () => {
    // Use images from your public/carousel-images folder
    const localImages = [
      '/carousel-images/aiiot1.jpg',
      '/carousel-images/aiiot2.jpeg',
      '/carousel-images/aiiot3.jpg',
      '/carousel-images/aiiot4.jpg',
    ];

    setHeroImages(localImages);
    setIsLoading(false);
  };

  useEffect(() => {
    if (heroImages.length === 0) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [heroImages]);

  const handleIndicatorClick = (index) => {
    setCurrentImageIndex(index);
  };

  const teamMembers = [
    {
      name: "Dr. Ajay Kumar",
      role: "Principal Investigator",
      description: "Dr. Ajay Kumar is an Associate Professor at ASIET...",
      image: "/faculties/ajay.jpeg" // Check if this is .jpg or .jpeg
    },
    {
      name: "Mr. Albins Paul",
      role: "Co-Investigator",
      description: "Assistant Professor at ASIET's ECE Department...",
      image: "/faculties/albins.jpg"
    },
    {
      name: "Prof. P.V. Rajaraman",
      role: "Co-Investigator",
      description: "Assistant Professor, CTO...",
      image: "/faculties/rajaraman.jpg"
    },
    {
      name: "Mr. Abhijith Pm",
      role: "Project Associate",
      description: "",
      image: "/faculties/abhijith.jpeg" // Check extension
    },
    {
      name: "Mrs. Hasna Hameed",
      role: "Project Associate",
      description: "",
      // FIX: It was likely a mismatch. Check if file is hasna.jpg or hasna2.jpeg
      image: "/faculties/hasna2.jpg" 
    },
    {
      name: "Ms. Arathy Surendran",
      role: "Project Associate",
      description: "",
      // FIX: Check if file is actually Arathy.jpg (Capital A) or arathy.jpeg (with e)
      image: "/faculties/arathy.jpg" 
    },
    {
      name: "Mr. Bhagyaraj J",
      role: "Project Assistant",
      description: "",
      image: "/faculties/bhagyaraj.jpeg"
    },
    {
      name: "Mr. Amaljith N Raj",
      role: "Project Assistant",
      description: "",
      image: "/faculties/amaljith.jpg"
    },
    {
      name: "Mrs. Jibina EA",
      role: "Project Assistant",
      description: "",
      image: "/faculties/jibinaea.jpeg"
    }
  ];

  const projects = [
    {
      title: "Intelligent Sensor Module",
      description: "Developed a smart sensor module capable of real-time monitoring and management of environmental pollutants. The module integrates multiple gas and environmental sensors to continuously measure air quality parameters such as PM2.5, PM10, CO₂, CO, NH₃, temperature, and humidity.",
      image: "/sensor_modules/module2.jpg"
    },
    {
      title: "Smart Water Level Monitoring",
      description: "A robust and intelligent system designed for real-time water level tracking with an integrated early-warning alert mechanism to mitigate flood risks. The solution continuously monitors water fluctuations using sensor-based measurements and ensures timely notifications during critical water level rises.",
      image: "/sensor_modules/water_monitor.jpg"
    },
    {
      title: "Digital Water Distribution",
      description: "The Digital Water Distribution system creates a virtual replica of water distribution networks, enabling real-time monitoring, leak detection, and predictive maintenance. Using IoT sensors and AI analytics, it optimizes water flow and reduces wastage.",
      image: "/sensor_modules/water_authorityy.jpeg"
    },
    {
      title: "Startup & Skill Development",
      description: "Building a vibrant startup ecosystem while offering hands-on skill development programs centered around our IoT solutions. These initiatives empower innovators, students, and professionals to adopt emerging technologies and bring their ideas to market.",
      image: "/sensor_modules/skill.jpg"
    },
    {
      title: "Explainable AI Software",
      description: "Building analysis software based on Explainable AI (XAI) to bring transparency and trust to complex IoT systems.",
      image: "/sensor_modules/ai.jpeg"
    }
  ];

  return (

    
    <div className="aiiot-page-container">
      {/* Header Section */}
      <header style={{
        position: 'fixed',    // CHANGED from 'sticky' to 'fixed' (Stops disappearing)
        top: 0,
        left: 0,
        right: 0,
        height: '5rem',       // Explicit height
        zIndex: 1000,
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.08)'
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '5rem' }}>
            
            {/* --- LOGO --- */}
            <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 1001, textDecoration: 'none' }}>
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
            </a>

            {/* ===================================================== */}
            {/* DESKTOP NAVIGATION                                    */}
            {/* ===================================================== */}
            <div className="desktop-nav">
              <a href="#about" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }} 
                 onMouseEnter={(e) => e.target.style.color = '#3b82f6'} onMouseLeave={(e) => e.target.style.color = '#475569'}>
                 About
              </a>
              <a href="#team" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}
                 onMouseEnter={(e) => e.target.style.color = '#3b82f6'} onMouseLeave={(e) => e.target.style.color = '#475569'}>
                 Team
              </a>

              {/* Resources Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => { setResourcesDropdownOpen(!resourcesDropdownOpen); setProjectsDropdownOpen(false); }}
                  style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'} onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}
                >
                  Resources <span style={{ fontSize: '0.75rem' }}>▼</span>
                </button>

                {resourcesDropdownOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: 'white', borderRadius: '0.5rem',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)', border: '1px solid #e2e8f0', minWidth: '18rem', zIndex: 100, maxHeight: '500px', overflowY: 'auto'
                  }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.75rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                      <button onClick={() => setSelectedCategory(null)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: selectedCategory === null ? 'white' : '#475569', background: selectedCategory === null ? '#3b82f6' : '#e2e8f0', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
                        All ({brochures.length})
                      </button>
                      {categories.map((cat) => (
                        <button key={cat} onClick={() => setSelectedCategory(cat)}
                          style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: selectedCategory === cat ? 'white' : '#475569', background: selectedCategory === cat ? '#3b82f6' : '#e2e8f0', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', textTransform: 'capitalize' }}>
                          {cat} ({brochures.filter(b => b.category === cat).length})
                        </button>
                      ))}
                    </div>
                    <div>
                      {brochuresLoading ? <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>Loading...</div> : 
                       filteredBrochures.length > 0 ? filteredBrochures.map((brochure, idx) => (
                        <a key={idx} href={brochure.url} target="_blank" rel="noopener noreferrer"
                           style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', textDecoration: 'none', borderBottom: '1px solid #f1f5f9' }}
                           className="hover:bg-blue-50">
                          <span style={{ fontSize: '1.25rem' }}>{brochure.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize:'0.9rem' }}>{brochure.title}</div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{brochure.category}</div>
                          </div>
                        </a>
                      )) : <div style={{ padding: '1rem', color: '#64748b' }}>No resources found</div>}
                    </div>
                  </div>
                )}
              </div>

              <a href="#projects" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}
                 onMouseEnter={(e) => e.target.style.color = '#3b82f6'} onMouseLeave={(e) => e.target.style.color = '#475569'}>
                 Projects
              </a>

              {/* Launches Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => { setProjectsDropdownOpen(!projectsDropdownOpen); setResourcesDropdownOpen(false); }}
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

              <a href="#contact" style={{ padding: '0.625rem 1.25rem', background: '#3b82f6', color: 'white', fontSize: '0.875rem', fontWeight: 600, borderRadius: '0.5rem' }}>
                Get in Touch
              </a>
            </div>

            {/* ===================================================== */}
            {/* MOBILE HAMBURGER BUTTON (Controlled by CSS now)       */}
            {/* ===================================================== */}
            <button className="mobile-nav-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>

          </nav>
        </div>

        {/* ===================================================== */}
        {/* MOBILE MENU CONTENT                                   */}
        {/* ===================================================== */}
        {isMobileMenuOpen && (
          <div className="mobile-menu-wrapper">
            <a href="#about" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'block', padding: '1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>About</a>
            <a href="#team" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'block', padding: '1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>Team</a>
            
            {/* Mobile Resources Accordion */}
            <div style={{ borderBottom: '1px solid #f1f5f9' }}>
              <button onClick={() => setMobileResourcesExpanded(!mobileResourcesExpanded)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '1rem 0', background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>
                Resources <span>{mobileResourcesExpanded ? '−' : '+'}</span>
              </button>
              {mobileResourcesExpanded && (
                <div className="mobile-submenu">
                   {brochures.length > 0 ? brochures.map((b, i) => (
                     <a key={i} href={b.url} target="_blank" style={{ display: 'block', padding: '0.75rem 0', color: '#475569', fontSize: '0.95rem', textDecoration:'none' }}>
                       {b.icon} {b.title}
                     </a>
                   )) : <div style={{color:'#94a3b8'}}>No resources loaded</div>}
                </div>
              )}
            </div>

            <a href="#projects" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'block', padding: '1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>Projects</a>

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

            <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'block', width: '100%', padding: '1rem', background: '#3b82f6', color: 'white', textAlign: 'center', borderRadius: '0.5rem', fontWeight: 600, fontSize: '1.1rem' }}>
              Get in Touch
            </a>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {/* Hero Section */}
        <section className="hero-gradient reveal-on-scroll" style={{ padding: '5rem 0' }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3rem' }}>
              {/* Left Side - Text Content */}
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  background: '#eff6ff',
                  color: '#2563eb',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  borderRadius: '9999px',
                  marginBottom: '1.5rem'
                }}>
                  Sponsored by Ministry of Electronics and Information Technology
                </p>
                <h1 style={{ fontSize: '3rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem', lineHeight: 1.2 }}>
                  Center for AI-IoT <span style={{ color: '#3b82f6' }}>Innovations</span>
                </h1>
                <p style={{ fontSize: '1.125rem', color: '#475569', marginBottom: '2rem' }}>
                  The Center for AI IoT Innovation is a facility focused on the integration of electronics hardware design 
                  with artificial intelligence (AI) and explainable AI (XAI).
                </p>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', justifyContent: 'center' }}>
                  <a href="#projects" style={{
                    padding: '0.75rem 1.5rem',
                    background: '#3b82f6',
                    color: 'white',
                    fontWeight: 500,
                    borderRadius: '0.5rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    Explore Projects
                    <span>→</span>
                  </a>
                  <a href="#team" style={{
                    padding: '0.75rem 1.5rem',
                    background: 'white',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    fontWeight: 500,
                    borderRadius: '0.5rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    Meet the Team
                    <span>👥</span>
                  </a>
                </div>
              </div>

              {/* Right Side - Hero Image with Carousel */}
              <div style={{ flex: 1 }}>
                <div id="hero-image-container" style={{ position: 'relative' }}>
                  {isLoading ? (
                    <div className="animate-pulse" style={{
                      width: '100%',
                      height: '24rem',
                      background: '#e2e8f0',
                      borderRadius: '1rem'
                    }}></div>
                  ) : (
                    <img
                      id="hero-image"
                      src={heroImages[currentImageIndex]}
                      alt="AI IoT Innovation"
                      style={{
                        width: '100%',
                        height: '24rem',
                        objectFit: 'cover',
                        borderRadius: '1rem',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  )}

                  {/* Carousel Indicators */}
                  {heroImages.length > 0 && (
                    <div id="carousel-indicators" style={{
                      position: 'absolute',
                      bottom: '1rem',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: '0.5rem'
                    }}>
                      {heroImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => handleIndicatorClick(index)}
                          className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                          style={{
                            width: '0.75rem',
                            height: '0.75rem',
                            borderRadius: '9999px',
                            background: index === currentImageIndex ? '#3b82f6' : 'rgba(255, 255, 255, 0.5)'
                          }}
                          aria-label={`Go to slide ${index + 1}`}
                        ></button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="reveal-on-scroll" style={{ padding: '5rem 0' }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>
                About Our Center
              </h2>
              <p style={{ fontSize: '1.125rem', color: '#475569' }}>
                Pioneering research where intelligence meets connectivity.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#475569', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  The Center for AI IoT Innovation is a facility focused on the integration of electronics hardware design 
                  with artificial intelligence (AI) and explainable AI (XAI). The lab is equipped with hardware development tools, 
                  computing systems, and educational resources to support research and development in this area.
                </p>
                <p style={{ color: '#475569', lineHeight: 1.6 }}>
                  The center provides resources for both theoretical research and practical applications, aiming to advance 
                  the integration of AI technologies with IoT systems.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                {[
                  { icon: '⚡', title: 'Innovation', desc: 'State-of-the-art research facilities' },
                  { icon: '💻', title: 'Technology', desc: 'Advanced AI & IoT integration' },
                  { icon: '👥', title: 'Collaboration', desc: 'Expert faculty and researchers' },
                  { icon: '🏆', title: 'Excellence', desc: 'Industry-leading solutions' }
                ].map((item, idx) => (
                  <div key={idx} style={{
                    padding: '1.5rem',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.75rem'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{item.icon}</div>
                    <h4 style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>{item.title}</h4>
                    <p style={{ fontSize: '0.875rem', color: '#475569' }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section id="team" className="reveal-on-scroll" style={{ padding: '5rem 0', background: '#f8fafc' }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>
                Meet Our Expert Faculty
              </h2>
              <p style={{ fontSize: '1.125rem', color: '#475569' }}>
                The brilliant minds leading our research and innovation.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              {teamMembers.map((member, index) => (
                <div key={index} style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    {/* Team Member Photo */}
                    <div style={{
                      width: '6rem',
                      height: '6rem',
                      borderRadius: '9999px',
                      overflow: 'hidden',
                      border: '3px solid #ffffffff',
                      flexShrink: 0
                    }}>
                      <img 
                        src={member.image} 
                        alt={member.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          // Fallback if image doesn't load
                          e.target.style.display = 'none';
                          e.target.parentElement.style.background = '#dbeafe';
                          e.target.parentElement.style.display = 'flex';
                          e.target.parentElement.style.alignItems = 'center';
                          e.target.parentElement.style.justifyContent = 'center';
                          e.target.parentElement.innerHTML = '<span style="font-size: 2rem; color: #3b82f6;">👤</span>';
                        }}
                      />
                    </div>

                    {/* Member Info */}
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <h4 style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem', fontSize: '1.125rem' }}>
                        {member.name}
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: '#3b82f6', fontWeight: 600, marginBottom: '0.5rem' }}>
                        {member.role}
                      </p>
                      {member.description && (
                        <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, textAlign: 'left', marginTop: '1rem' }}>
                          {member.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Projects Section */}
      <section id="projects" className="reveal-on-scroll" style={{ padding: '5rem 0' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>
            Our Ongoing Projects
          </h2>
          <p style={{ fontSize: '1.125rem', color: '#475569' }}>
            From concept to reality, we're building solutions that matter.
          </p>
        </div>

        {/* Projects as Paragraphs with Images */}
        {/* Projects List */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
      {projects.map((project, index) => {
        const projectId = projectIdMap[project.title] || 'unknown';
        // Determine direction class based on index
        const layoutClass = index % 2 === 0 ? 'layout-normal' : 'layout-reverse';
        
        return (
          <div 
            key={index}
            className={`reveal-on-scroll project-card ${layoutClass}`}
            // Inline styles removed here because they are now in CSS
          >
            {/* Image Section */}
            <div className="project-image-wrapper">
              <img 
                src={project.image}
                alt={project.title}
                style={{
                  width: '100%',
                  height: '280px',
                  objectFit: 'cover',
                  borderRadius: '1rem',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                  transition: 'transform 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.style.background = '#eff6ff';
                  e.target.parentElement.style.display = 'flex';
                  e.target.parentElement.style.alignItems = 'center';
                  e.target.parentElement.style.justifyContent = 'center';
                  e.target.parentElement.style.borderRadius = '1rem';
                  e.target.parentElement.style.height = '280px';
                  e.target.parentElement.innerHTML = `<div style="text-align: center;"><span style="font-size: 4rem;">📊</span></div>`;
                }}
              />
            </div>

            {/* Text Content Section */}
            <div className="project-content-wrapper">
              <h3 style={{
                fontSize: '1.875rem',
                fontWeight: 700,
                color: '#1e293b',
                marginBottom: '1rem'
              }}>
                {project.title}
              </h3>
              <p style={{
                fontSize: '1rem',
                color: '#475569',
                lineHeight: 1.8,
                marginBottom: '1.5rem'
              }}>
                {project.description}
              </p>
              <Link 
                to={`/project/${projectId}`}
                onClick={() => window.scrollTo(0, 0)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: '#3b82f6',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2563eb';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#3b82f6';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                Learn More 
                <span style={{ fontSize: '1.125rem' }}>→</span>
              </Link>
            </div>
          </div>
        );
      })}
    
            
       </div> 
      </div>
      </section>

        {/* Contact Section */}
        <section id="contact" className="reveal-on-scroll" style={{ padding: '5rem 0', background: '#f8fafc' }}>
          <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '0 1rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>
              Let's Build the Future Together
            </h2>
            <p style={{ fontSize: '1.125rem', color: '#475569', marginBottom: '2rem' }}>
              Have a project in mind, a question, or want to collaborate? We'd love to hear from you.
            </p>
            <a href="mailto:contact@aiiot.edu" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: '#3b82f6',
              color: 'white',
              fontWeight: 500,
              borderRadius: '0.5rem'
            }}>
              <span>✉️</span>
              Contact Us
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      {/* Footer */}
<footer style={{ background: '#1e293b', color: '#cbd5e1', padding: '3rem 0' }}>
  <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
      <div>
        <h5 style={{ fontWeight: 700, color: 'white', marginBottom: '1rem' }}>AI-IoT Innovations</h5>
        <p style={{ fontSize: '0.875rem' }}>
          Advancing the integration of AI and IoT technologies for a smarter tomorrow.
        </p>
      </div>
      
      <div>
        <h5 style={{ fontWeight: 700, color: 'white', marginBottom: '1rem' }}>Quick Links</h5>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {['About', 'Team', 'Projects', 'Contact'].map((link, idx) => (
            <li key={idx} style={{ marginBottom: '0.5rem' }}>
              <a 
                href={`#${link.toLowerCase()}`} 
                style={{ 
                  fontSize: '0.875rem', 
                  color: 'white',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  position: 'relative',
                  paddingBottom: '0.25rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#3b82f6';
                  e.currentTarget.style.transform = 'translateX(8px)';
                  e.currentTarget.style.fontWeight = '600';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.fontWeight = '400';
                }}
              >
                <span style={{
                  display: 'inline-block',
                  width: '0.25rem',
                  height: '0.25rem',
                  background: '#3b82f6',
                  borderRadius: '50%',
                  opacity: 0,
                  transition: 'opacity 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0';
                }}
                ></span>
                {link}
              </a>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="footer-section">
        <h3 style={{ color: 'white', fontWeight: 700, marginBottom: '1rem' }}>Contact Information</h3>
        <p style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>
          Adi Shankara Institute of Engineering and Technology<br />
          Kalady 683574, Ernakulam<br />
          Kerala, India
        </p>
        <br />
        <p style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>
          <strong style={{ color: 'white' }}>Email:</strong> aiiot@adishankara.ac.in<br />
          <strong style={{ color: 'white' }}>Phone:</strong> 9846900310
        </p>
      </div>
    </div>
    
    <div style={{
      borderTop: '1px solid #334155',
      marginTop: '2rem',
      paddingTop: '2rem',
      textAlign: 'center',
      fontSize: '0.875rem'
    }}>
      <p>&copy; 2025 Center for AI-IoT Innovations. All rights reserved.</p>
    </div>
  </div>
</footer>
    </div>
  );
};

export default AIIOT_INDEX;