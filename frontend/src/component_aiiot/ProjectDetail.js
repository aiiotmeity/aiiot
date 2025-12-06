import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios'; // Ensure you have axios installed: npm install axios
import './ProjectDetail.css';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const [activeSection, setActiveSection] = useState('overview');
  
  // State for dynamic workshops
  const [workshops, setWorkshops] = useState([]);
  const [loadingWorkshops, setLoadingWorkshops] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [projectId]);

  // Fetch Workshops only if we are on the 'startup-skill' page
  useEffect(() => {
    if (projectId === 'startup-skill') {
      setLoadingWorkshops(true);
      // CHANGE THIS URL TO YOUR ACTUAL DJANGO URL
      // NEW CODE (Works on both Localhost and Production)
        const API_BASE_URL = process.env.NODE_ENV === 'production'
          ? 'https://aiiot-1.onrender.com'
          : 'http://localhost:8000';

        axios.get(`${API_BASE_URL}/api/workshops/`)
        .then(response => {
          setWorkshops(response.data);
          setLoadingWorkshops(false);
        })
        .catch(error => {
          console.error("Error fetching workshops", error);
          setLoadingWorkshops(false);
        });
    }
  }, [projectId]);

  // Handle Scroll Spy
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['overview', 'innovations', 'impact', 'contact'];
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element && element.offsetTop <= scrollPosition && (element.offsetTop + element.offsetHeight) > scrollPosition) {
          setActiveSection(section);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  // --- STATIC DATA (Updated with your new text) ---
  const projectsData = {
    'intelligent-sensor': {
      title: 'Pollution Intelligence Network',
      subtitle: 'AI-Powered Hyperlocal Monitoring',
      tagline: 'Sensing. Predicting. Protecting.',
      mainImage: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=2069&auto=format&fit=crop',
      description: 'A scalable LoRa-based network designed not just to monitor, but to predict air quality trends using Artificial Intelligence.',
      fullDescription: `We have deployed a validation-ready network that goes beyond simple sensing. By utilizing LoRa technology for long-range communication and advanced AI models, we provide a 4-day AQI forecast. This allows citizens to plan their activities based on future air quality, not just current readings.`,
      innovations: [
        { title: 'Comprehensive Sensing', desc: 'Simultaneous detection of PM2.5, PM10, CO, NO2, O3, and NH3.', icon: '🔬' },
        { title: '4-Day AI Forecasting', desc: 'Machine learning algorithms analyze trends to predict AQI levels 96 hours ahead.', icon: '🤖' },
        { title: 'Personalized Health Risk', desc: 'Dynamic health assessments that warn specific at-risk groups.', icon: '❤️' },
        { title: 'LoRa Scalability', desc: 'Long-range network architecture covers entire districts with minimal hardware.', icon: '📡' }
      ],
      impacts: [
        { label: 'Pollutants', value: 'PM2.5, PM10, Gases' },
        { label: 'Forecast', value: '4-Days Ahead' },
        { label: 'Tech Stack', value: 'LoRa + AI' },
        { label: 'Network', value: 'Mesh Topology' }
      ]
    },
    
    // --- UPDATED FLOOD PROJECT ---
    'water-level': {
      title: 'River Watch & Flood Alert',
      subtitle: 'Deep Learning Flood Forecasting',
      tagline: 'Predicting the flow. Protecting Kalady.',
      mainImage: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=2070&auto=format&fit=crop',
      description: 'A comprehensive LSTM neural network system for real-time river level forecasting at Kalady.',
      fullDescription: `
        This project integrates multi-source data—dam operations (water level, release rates), real-time upstream rainfall from multiple stations, and historical Neeleswaram river levels.
        We utilize a comprehensive LSTM neural network with a 3-stacked layer architecture (128→64→32 units) to analyze temporal features (hour, day, seasonal patterns). This delivers accurate 6-hour ahead predictions, providing critical lead time for authorities.
      `,
      innovations: [
        { title: 'LSTM Architecture', desc: '3 stacked layers (128→64→32 units) trained on historical data.', icon: '🧠' },
        { title: 'Multi-Source Data', desc: 'Integrates Dam operations, local rainfall, and river metrics.', icon: '🌊' },
        { title: '6-Hour Prediction', desc: 'Accurate forecasting allowing 6 hours of preparation time.', icon: '⏱️' },
        { title: 'Custom AWS Hardware', desc: 'Proprietary Automatic Weather Station measuring Rainfall, Wind, Temp.', icon: '⛈️' }
      ],
      impacts: [
        { label: 'Target', value: 'Kalady Region' },
        { label: 'Model', value: 'LSTM Network' },
        { label: 'Lead Time', value: '6 Hours' },
        { label: 'Hardware', value: 'Custom AWS' }
      ]
    },

    // --- UPDATED DIGITAL WATER PROJECT ---
    'digital-water': {
      title: 'Digital Water Distribution',
      subtitle: 'Community-First Water Management',
      tagline: 'Collaborative solutions for efficient distribution.',
      mainImage: 'https://images.unsplash.com/photo-1605218457336-9276c1272bd8?q=80&w=2070&auto=format&fit=crop',
      description: 'A digital system built on extensive ground studies to monitor and optimize local water distribution effectively.',
      fullDescription: `
        We conducted comprehensive ground studies by engaging with Assistant Engineers (AE) at KWA Perumbavoor Division to understand regional networks. Site visits to the KWA Main Water Pumping Station in Chembarakky allowed us to examine pumping infrastructure and automation possibilities. This stakeholder feedback informs our Explainable AI-based analysis software.
      `,
      innovations: [
        { title: 'Stakeholder Collaboration', desc: 'Requirements gathered from KWA officials and Panchayat authorities.', icon: '🤝' },
        { title: 'Ground Study', desc: 'Site visits to Chembarakky Pumping Station to assess infrastructure.', icon: '📍' },
        { title: 'Explainable AI', desc: 'AI-based analysis software for transparent IoT solutions.', icon: '🤖' },
        { title: 'Community Feedback', desc: 'Integrated channels for residents to report issues.', icon: '🗣️' }
      ],
      impacts: [
        { label: 'Partners', value: 'KWA & Panchayat' },
        { label: 'Focus', value: 'Pumping Infra' },
        { label: 'Tech', value: 'Explainable AI' },
        { label: 'Method', value: 'Field Study' }
      ]
    },

    // --- STARTUP SKILL (Content is handled dynamically below) ---
    'startup-skill': {
      title: 'Startup Ecosystem & Skills',
      subtitle: 'Empowering the Next Gen',
      tagline: 'Hands-on mastery of IoT & Environment.',
      mainImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop',
      description: 'Establishing multiple training programs across IoT, AI, and embedded systems through workshops, internships, and hands-on projects.',
      fullDescription: `
        We foster a startup ecosystem by providing students with real-world exposure. From intensive 15-day summer internships to 6-month specialized intern training, we bridge the gap between academia and industry. Our research outputs include filed patents and published papers, proving the efficacy of our innovation model.
      `,
      // These are static highlights, the list of workshops comes from API
      innovations: [
        { title: 'Research Outputs', desc: '1 Patent filed, 2 Papers published, 1 communicated.', icon: '📜' },
        { title: 'Internship Program', desc: '15-day intensive training & 6-month long-term mentorships.', icon: '🎓' },
        { title: 'Hands-on Workshops', desc: 'Covering PCB Design, Edge Hardware, and Robotics.', icon: '🛠️' },
        { title: 'Idea Pitching', desc: 'Competitions to select and mentor promising startup teams.', icon: '🚀' }
      ],
      impacts: [
        { label: 'Workshops', value: '260+ Students' },
        { label: 'Interns', value: '49+ Trained' },
        { label: 'Research', value: '1 Patent' },
        { label: 'Teams', value: '6 Mentored' }
      ]
    },
  };

  const project = projectsData[projectId];

  if (!project) {
    return (
      <div className="project-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <h2 style={{ marginBottom: '1rem' }}>Project Loading...</h2>
        <Link to="/" className="btn-primary">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="project-page">
      
      {/* 1. HERO SECTION */}
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-content">
            <span className="hero-tag">Detailed Case Study</span>
            <h1 className="hero-title">{project.title}</h1>
            <p className="hero-desc">{project.description}</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => scrollToSection('innovations')} className="btn-primary">
                View Details
              </button>
              <Link to="/" className="btn-secondary">
                Back to List
              </Link>
            </div>
          </div>
          <div className="hero-img-wrapper">
            <img src={project.mainImage} alt={project.title} className="hero-img" />
          </div>
        </div>
      </section>

      {/* 2. STICKY NAV */}
      <div className="sticky-nav">
        <div className="container nav-container">
          {['Overview', 'Innovations', 'Impact', 'Contact'].map((item) => (
            <div 
              key={item} 
              onClick={() => scrollToSection(item.toLowerCase())} 
              className={`nav-item ${activeSection === item.toLowerCase() ? 'active' : ''}`}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="container">

        {/* 3. OVERVIEW */}
        <section id="overview" className="section-padding">
          <div className="overview-content">
            <h3 style={{ color: '#0ea5e9', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Mission Statement
            </h3>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem' }}>
              {project.tagline}
            </h2>
            <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: '#475569' }}>
              {project.fullDescription}
            </p>
          </div>
        </section>

        {/* 4. INNOVATIONS / DYNAMIC CONTENT */}
        <section id="innovations" className="section-padding">
          
          {/* If this is the Skill Development Page, show Dynamic Workshops */}
          {projectId === 'startup-skill' ? (
             <div>
                <h2 className="section-title">Training & Workshops</h2>
                <p className="section-subtitle">Real-time data from our latest programs.</p>

                {loadingWorkshops ? (
                   <p style={{textAlign: 'center'}}>Loading latest workshops...</p>
                ) : (
                  <div className="innovation-grid">
                    {workshops.length > 0 ? workshops.map((ws) => (
                      <div key={ws.id} className="feature-card">
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'start'}}>
                           <div className="icon-box" style={{marginBottom:'0.5rem'}}>📅</div>
                           {ws.category === 'internship' && <span style={{background:'#dbeafe', color:'#1e40af', padding:'2px 8px', borderRadius:'4px', fontSize:'0.75rem', fontWeight:'bold'}}>Internship</span>}
                        </div>
                        <h3 className="card-title">{ws.title}</h3>
                        <p style={{color:'#0284c7', fontWeight:'600', fontSize:'0.9rem', marginBottom:'0.5rem'}}>
                           {ws.event_date_text}
                        </p>
                        <p style={{fontSize:'0.85rem', color:'#64748b', marginBottom:'1rem'}}>
                           Participants: <strong>{ws.participants}</strong>
                        </p>
                        <p className="card-desc" style={{marginBottom:'1.5rem'}}>{ws.description}</p>
                        
                        {ws.brochure_file && (
                          <a href={ws.brochure_file} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{marginTop:'auto', justifyContent:'center', fontSize:'0.85rem'}}>
                             Download Brochure
                          </a>
                        )}
                      </div>
                    )) : (
                      <p style={{textAlign:'center', gridColumn:'1/-1'}}>No workshops added yet. Check back soon!</p>
                    )}
                  </div>
                )}
                
                {/* Show the Static Research highlights below the dynamic list */}
                <div style={{marginTop: '4rem'}}>
                    <h2 className="section-title">Research & Impact</h2>
                    <div className="innovation-grid" style={{marginTop: '2rem'}}>
                       {project.innovations.map((item, idx) => (
                        <div key={idx} className="feature-card">
                          <div className="icon-box">{item.icon}</div>
                          <h3 className="card-title">{item.title}</h3>
                          <p className="card-desc">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                </div>

             </div>
          ) : (
            // Standard View for other projects
            <div>
              <h2 className="section-title">Key Innovations</h2>
              <p className="section-subtitle">Technological breakthroughs powering this solution.</p>
              <div className="innovation-grid">
                {project.innovations && project.innovations.map((item, idx) => (
                  <div key={idx} className="feature-card">
                    <div className="icon-box">{item.icon}</div>
                    <h3 className="card-title">{item.title}</h3>
                    <p className="card-desc">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 5. IMPACT & SPECS */}
        <section id="impact" className="section-padding">
          <div className="impact-container">
            <h2 className="section-title">Project Impact</h2>
            <p className="section-subtitle">Measurable outcomes and specifics.</p>
            
            <div className="impact-grid">
              {project.impacts && project.impacts.map((stat, idx) => (
                <div key={idx} className="stat-box">
                  <div className="stat-label">{stat.label}</div>
                  <div className="stat-value">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. CONTACT */}
        <section id="contact" className="contact-section">
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem' }}>
            Collaboration
          </h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>
            Open for partnerships with government bodies and institutions.
          </p>
          <a href="mailto:contact@aiiot.edu" className="btn-primary" style={{ textDecoration: 'none', borderRadius: '2rem' }}>
            Get in Touch
          </a>
        </section>

      </div>
    </div>
  );
};

export default ProjectDetail;