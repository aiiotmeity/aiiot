import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import './Aiiot.css';

const AIIOT_INDEX = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [heroImages, setHeroImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- MEGA MENU STATES (ADDED) ---
  const [activeCategory, setActiveCategory] = useState('Air Quality');
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://aiiot-1.onrender.com'
  : 'http://localhost:8000';

  // --- MEGA MENU DATA (ADDED) ---
  const productMenuData = {
    'Air Quality': {
      title: 'Air Quality Monitoring',
      description: 'Precision sensors for indoor and outdoor environments.',
      items: [
        { name: 'Indoor Monitor', image: '/sensor_modules/aqicrop.jpeg', link: '/project/intelligent-sensor' },
        { name: 'Outdoor Station', image: '/sensor_modules/aqi1.jpeg', link: '/project/intelligent-sensor' },
        { name: 'Gas Sensors', image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400', link: '/project/intelligent-sensor' }
      ]
    },
    'Water Solutions': {
      title: 'Water Management',
      description: 'Flood alerts and distribution logic.',
      items: [
        { name: 'Flood Alert System', image: '/sensor_modules/river1.jpg', link: '/project/water-level' },
        { name: 'Level Sensors', image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400', link: '/project/water-level' },
        { name: 'Distribution Net', image: '/sensor_modules/distribution.jpeg', link: '/project/digital-water' }
      ]
    },
    'Weather': {
      title: 'Weather Stations',
      description: 'Hyper-local weather data collection.',
      items: [
        { name: 'Auto Weather Station', image: '/sensor_modules/weather.jpg', link: '/project/water-level' },
        { name: 'Rain Gauges', image: 'https://images.unsplash.com/photo-1590055531860-6902633df018?w=400', link: '/project/water-level' }
      ]
    },
    'Training': {
      title: 'Skill Development',
      description: 'Kits and workshops for students.',
      items: [
        { name: 'IoT Starter Kits', image: '/sensor_modules/skill.jpg', link: '/project/startup-skill' },
        { name: 'PCB Workshops', image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400', link: '/project/startup-skill' }
      ]
    }
  };

  const projectIdMap = {
    'Air Quality Monitoring': 'intelligent-sensor',
    'Smart Water Level Monitoring': 'water-level',
    'Digital Water Distribution': 'digital-water',
    'Startup & Skill Development': 'startup-skill',
  };

  // --- EXISTING LOGIC ---
  useEffect(() => {
    if (window.feather) {
      window.feather.replace();
    }
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
    handleScrollAnimation(); 
    window.addEventListener("scroll", handleScrollAnimation);
    setupCarousel();
    return () => {
      window.removeEventListener("scroll", handleScrollAnimation);
    };
  }, []);

  const setupCarousel = () => {
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
    { name: "Dr. Ajay Kumar", role: "Principal Investigator", description: "Dr. Ajay Kumar is an Associate Professor at ASIET...", image: "/faculties/ajay.jpeg" },
    { name: "Mr. Albins Paul", role: "Co-Investigator", description: "Assistant Professor at ASIET's ECE Department...", image: "/faculties/albins.jpg" },
    { name: "Prof. P.V. Rajaraman", role: "Co-Investigator", description: "Assistant Professor, CTO...", image: "/faculties/rajaraman.jpg" },
    { name: "Mr. Abhijith Pm", role: "Project Associate", description: "", image: "/faculties/abhijith.jpeg" },
    { name: "Mrs. Hasna Hameed", role: "Project Associate", description: "", image: "/faculties/hasna2.jpeg" },
    { name: "Ms. Arathy Surendran", role: "Project Associate", description: "", image: "/faculties/arathy.jpeg" },
    { name: "Mr. Bhagyaraj J", role: "Project Assistant", description: "", image: "/faculties/bhagyaraj.jpeg" },
    { name: "Mr. Amaljith N Raj", role: "Project Assistant", description: "", image: "/faculties/amaljith.jpeg" },
    { name: "Mrs. Jibina EA", role: "Project Assistant", description: "", image: "/faculties/jibinaea.jpeg" }
  ];

  const projects = [
    { title: "Air Quality Monitoring", description: "Developed a smart sensor module capable of real-time monitoring and management of environmental pollutants. The module integrates multiple gas and environmental sensors to continuously measure air quality parameters such as PM2.5, PM10, CO₂, CO, NH₃, temperature, and humidity....", image: "/sensor_modules/aqicrop.jpeg" },
    { title: "Smart Water Level Monitoring", description: "Smart Water Level Monitoring", description: "A robust and intelligent system designed for real-time water level tracking with an integrated early-warning alert mechanism to mitigate flood risks. The solution continuously monitors water fluctuations using sensor-based measurements and ensures timely notifications during critical water level rises....", image: "/sensor_modules/river1.jpg" },
    { title: "Digital Water Distribution", description: "The Digital Water Distribution system creates a virtual replica of water distribution networks, enabling real-time monitoring, leak detection, and predictive maintenance. Using IoT sensors and AI analytics, it optimizes water flow and reduces wastage...", image: "/sensor_modules/distribution.jpeg" },
    { title: "Startup & Skill Development", description: "Building a vibrant startup ecosystem while offering hands-on skill development programs centered around our IoT solutions. These initiatives empower innovators, students, and professionals to adopt emerging technologies and bring their ideas to market....", image: "/sensor_modules/skill.jpg" }
  ];

  return (
    <div className="aiiot-page-container">
      {/* Header Section */}
      <header className="aiiot-header">
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
              <a href="#about" className="nav-link">About</a>
              <a href="#team" className="nav-link">Team</a>
              <Link to="/resources" className="nav-link">Resources</Link>

              {/* === MEGA MENU IMPLEMENTATION === */}
              <div 
                className="mega-menu-wrapper"
                onMouseEnter={() => setIsMegaMenuOpen(true)}
                onMouseLeave={() => setIsMegaMenuOpen(false)}
              >
                <Link to="/products" className="nav-link product-trigger">
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

              <Link to="/homepage" className="nav-link">AirAware</Link>
              <a href="/weather-home" className="nav-link">AWS</a>
              <a href="#contact" className="nav-btn-primary">Get in Touch</a>
            </div>

            {/* MOBILE HAMBURGER BUTTON */}
            <button className="mobile-nav-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </nav>
        </div>

        {/* MOBILE MENU CONTENT */}
        {isMobileMenuOpen && (
          <div className="mobile-menu-wrapper">
            <a href="#about" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'block', padding: '1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9', textDecoration:'none' }}>About</a>
            <a href="#team" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'block', padding: '1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9', textDecoration:'none' }}>Team</a>
            <Link to="/resources" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'block', padding: '1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9', textDecoration: 'none' }}>Resources</Link>
            <Link to="/products" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'block', padding: '1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9', textDecoration: 'none' }}>Products</Link>
            <Link to="/homepage" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'block', padding: '1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9', textDecoration: 'none' }}>AirAware</Link>
            <a href="/weather-home" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'block', padding: '1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9', textDecoration: 'none' }}>AWS</a>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, paddingTop: '3rem' }}>
        {/* Hero Section */}
        <section className="hero-gradient reveal-on-scroll" style={{ padding: '5rem 0' }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3rem' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ display: 'inline-block', padding: '0.5rem 1rem', background: '#eff6ff', color: '#2563eb', fontSize: '0.875rem', fontWeight: 500, borderRadius: '9999px', marginBottom: '1.5rem' }}>
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
                  <a href="#projects" style={{ padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white', fontWeight: 500, borderRadius: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration:'none' }}>
                    Explore Projects <span>→</span>
                  </a>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div id="hero-image-container" style={{ position: 'relative' }}>
                  {isLoading ? (
                    <div className="animate-pulse" style={{ width: '100%', height: '24rem', background: '#e2e8f0', borderRadius: '1rem' }}></div>
                  ) : (
                    <img id="hero-image" src={heroImages[currentImageIndex]} alt="AI IoT Innovation" style={{ width: '100%', height: '24rem', objectFit: 'cover', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }} />
                  )}
                  {heroImages.length > 0 && (
                     <div id="carousel-indicators" style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.5rem' }}>
                      {heroImages.map((_, index) => (
                        <button key={index} onClick={() => handleIndicatorClick(index)} className={`indicator ${index === currentImageIndex ? 'active' : ''}`} style={{ width: '0.75rem', height: '0.75rem', borderRadius: '9999px', background: index === currentImageIndex ? '#3b82f6' : 'rgba(255, 255, 255, 0.5)' }} aria-label={`Go to slide ${index + 1}`}></button>
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
              <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>About Our Center</h2>
              <p style={{ fontSize: '1.125rem', color: '#475569' }}>Pioneering research where intelligence meets connectivity.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#475569', marginBottom: '1.5rem', lineHeight: 1.6 }}>The Center for AI IoT Innovation is a facility focused on the integration of electronics hardware design with artificial intelligence (AI) and explainable AI (XAI)...</p>
                <p style={{ color: '#475569', lineHeight: 1.6 }}>The center provides resources for both theoretical research and practical applications...</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                {[ { icon: '⚡', title: 'Innovation', desc: 'State-of-the-art research facilities' }, { icon: '💻', title: 'Technology', desc: 'Advanced AI & IoT integration' }, { icon: '👥', title: 'Collaboration', desc: 'Expert faculty and researchers' }, { icon: '🏆', title: 'Excellence', desc: 'Industry-leading solutions' } ].map((item, idx) => (
                  <div key={idx} style={{ padding: '1.5rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem' }}>
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
              <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>Meet Our Expert Faculty</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              {teamMembers.map((member, index) => (
                <div key={index} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem', transition: 'all 0.3s ease', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '6rem', height: '6rem', borderRadius: '9999px', overflow: 'hidden', border: '3px solid #ffffffff' }}>
                      <img src={member.image} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.background = '#dbeafe'; e.target.parentElement.innerHTML = '<span style="font-size: 2rem; color: #3b82f6;">👤</span>'; }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <h4 style={{ fontWeight: 700, color: '#1e293b' }}>{member.name}</h4>
                      <p style={{ fontSize: '0.875rem', color: '#3b82f6' }}>{member.role}</p>
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
              <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#1e293b' }}>Our Ongoing Projects</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
              {projects.map((project, index) => {
                const projectId = projectIdMap[project.title] || 'unknown';
                return (
                  <div key={index} className={`reveal-on-scroll project-card ${index % 2 === 0 ? 'layout-normal' : 'layout-reverse'}`}>
                    <div className="project-image-wrapper">
                      <img src={project.image} alt={project.title} style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '1rem' }} />
                    </div>
                    <div className="project-content-wrapper">
                      <h3 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#1e293b' }}>{project.title}</h3>
                      <p style={{ fontSize: '1rem', color: '#475569', marginBottom: '1.5rem' }}>{project.description}</p>
                      <Link to={`/project/${projectId}`} onClick={() => window.scrollTo(0, 0)} style={{ padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white', borderRadius: '0.5rem', textDecoration: 'none' }}>Learn More</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Contact Section */}
           {/* Contact Section */}
        <section id="contact" className="reveal-on-scroll" style={{ padding: '5rem 0', background: '#f8fafc' }}>
          <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '0 1rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>Let's Build the Future Together</h2>
            <p style={{ fontSize: '1.125rem', color: '#475569', marginBottom: '2rem' }}>Have a project in mind, a question, or want to collaborate? We'd love to hear from you.</p>
            <a href="mailto:contact@aiiot.edu" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white', fontWeight: 500, borderRadius: '0.5rem', textDecoration:'none' }}>
              <span>✉️</span> Contact Us
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ background: '#1e293b', color: '#cbd5e1', padding: '3rem 0' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            <div>
              <h5 style={{ fontWeight: 700, color: 'white', marginBottom: '1rem' }}>AI-IoT Innovations</h5>
              <p style={{ fontSize: '0.875rem' }}>Advancing the integration of AI and IoT technologies for a smarter tomorrow.</p>
            </div>
            <div>
              <h5 style={{ fontWeight: 700, color: 'white', marginBottom: '1rem' }}>Quick Links</h5>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {['About', 'Team', 'Solutions', 'Contact'].map((link, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem' }}>
                    <a href={`#${link.toLowerCase()}`} style={{ fontSize: '0.875rem', color: 'white', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)', position: 'relative', paddingBottom: '0.25rem' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.transform = 'translateX(8px)'; e.currentTarget.style.fontWeight = '600'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.fontWeight = '400'; }}>
                      <span style={{ display: 'inline-block', width: '0.25rem', height: '0.25rem', background: '#3b82f6', borderRadius: '50%', opacity: 0, transition: 'opacity 0.3s ease' }} onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }} onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}></span>{link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="footer-section">
              <h3 style={{ color: 'white', fontWeight: 700, marginBottom: '1rem' }}>Contact Information</h3>
              <p style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>Adi Shankara Institute of Engineering and Technology<br />Kalady 683574, Ernakulam<br />Kerala, India</p><br />
              <p style={{ fontSize: '0.875rem', color: '#cbd5e1' }}><strong style={{ color: 'white' }}>Email:</strong> aiiot@adishankara.ac.in<br /><strong style={{ color: 'white' }}>Phone:</strong> 9846900310</p>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #334155', marginTop: '2rem', paddingTop: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
            <p>&copy; 2025 Center for AI-IoT Innovations. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AIIOT_INDEX;