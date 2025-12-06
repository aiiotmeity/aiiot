import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './ProjectDetail.css';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const [workshops, setWorkshops] = useState([]);
  
  // --- HEADER STATE ---
  const [activeCategory, setActiveCategory] = useState('Air Quality');
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);

  // --- PROJECT DATA WITH SPECIFIC BACKGROUNDS ---
  const projectsData = {
    'intelligent-sensor': {
      title: 'Stay Ahead: Guard Against Pollutants',
      tagline: 'Sensing. Predicting. Protecting.',
      // BACKGROUND: Foggy City (Prana Style)
      heroImage: 'https://images.unsplash.com/photo-1529619768328-e37af76c6fe5?q=80&w=2000&auto=format&fit=crop',
      description: 'According to WHO, air pollution causes 7 million premature deaths. Our sensors track these invisible threats in real-time.',
      fullDescription: `We have deployed a validation-ready network that goes beyond simple sensing. By utilizing LoRa technology for long-range communication and advanced AI models, we provide a 4-day AQI forecast.`,
      innovations: [
        { title: 'Comprehensive Sensing', desc: 'Detects PM2.5, PM10, CO, NO2.', icon: '🔬' },
        { title: '4-Day AI Forecast', desc: 'Predicting levels 96 hours ahead.', icon: '🤖' },
        { title: 'Health Risk Engine', desc: 'Dynamic alerts for at-risk groups.', icon: '❤️' },
        { title: 'LoRa Mesh', desc: 'City-wide coverage with low power.', icon: '📡' }
      ],
      impacts: [
        { label: 'Pollutants', value: '6 Types' }, { label: 'Forecast', value: '4 Days' },
        { label: 'Tech', value: 'LoRa + AI' }, { label: 'Network', value: 'Mesh' }
      ]
    },
    'water-level': {
      title: 'River Watch & Flood Alert',
      tagline: 'Predicting the Flow. Protecting Lives.',
      // BACKGROUND: Stormy River
      heroImage: 'https://images.unsplash.com/photo-1454789476662-53eb23ba5907?q=80&w=2000&auto=format&fit=crop',
      description: 'A comprehensive LSTM neural network system for real-time river level forecasting at Kalady.',
      fullDescription: `This project integrates multi-source data—dam operations, rainfall, and historical levels—into a comprehensive LSTM Neural Network. It delivers accurate 6-hour ahead predictions.`,
      innovations: [
        { title: 'LSTM Network', desc: 'Deep learning for flood prediction.', icon: '🧠' },
        { title: 'Multi-Source Data', desc: 'Dam + Rainfall + River Levels.', icon: '🌊' },
        { title: '6-Hour Lead Time', desc: 'Early warning for evacuation.', icon: '⏱️' },
        { title: 'Custom AWS', desc: 'Proprietary weather stations.', icon: '⛈️' }
      ],
      impacts: [
        { label: 'Location', value: 'Kalady' }, { label: 'Model', value: 'LSTM' },
        { label: 'Lead Time', value: '6 Hours' }, { label: 'Hardware', value: 'Custom' }
      ]
    },
    'digital-water': {
      title: 'Digital Water Distribution',
      tagline: 'Smart flow for smart cities.',
      // BACKGROUND: Industrial Pipes
      heroImage: 'https://images.unsplash.com/photo-1516937941348-c09645f3a2eb?q=80&w=2000&auto=format&fit=crop',
      description: 'A digital twin system built to monitor, analyze, and optimize local water distribution networks.',
      fullDescription: `We conducted comprehensive ground studies engaging with KWA officials. This system digitizes the water network to ensure fair distribution and detect leaks instantly.`,
      innovations: [
        { title: 'Digital Twin', desc: 'Virtual replica of pipe networks.', icon: '💻' },
        { title: 'Leak Detection', desc: 'Instant pressure drop alerts.', icon: '💧' },
        { title: 'Explainable AI', desc: 'Transparent decision making.', icon: '🤖' },
        { title: 'Community App', desc: 'Resident reporting channel.', icon: '📱' }
      ],
      impacts: [
        { label: 'Partner', value: 'KWA' }, { label: 'Goal', value: 'Efficiency' },
        { label: 'Tech', value: 'XAI' }, { label: 'Method', value: 'Digital Twin' }
      ]
    },
    'startup-skill': {
      title: 'Innovation & Skills Hub',
      tagline: 'Empowering the builders of tomorrow.',
      // BACKGROUND: High Tech Lab
      heroImage: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=2000&auto=format&fit=crop',
      description: 'Bridging the gap between academia and industry through hands-on IoT and AI training.',
      fullDescription: `We foster a startup ecosystem by providing students with real-world exposure. From intensive 15-day summer internships to 6-month specialized intern training.`,
      innovations: [
        { title: 'Incubation', desc: 'Support for student startups.', icon: '🚀' },
        { title: 'PCB Design', desc: 'Industrial standard training.', icon: '🛠️' },
        { title: 'Patents', desc: 'Guidance on IP filing.', icon: '📜' },
        { title: 'Mentorship', desc: 'Expert industry guidance.', icon: '🎓' }
      ],
      impacts: [
        { label: 'Students', value: '260+' }, { label: 'Interns', value: '49+' },
        { label: 'Patents', value: '1 Filed' }, { label: 'Startups', value: '6 Teams' }
      ]
    },
  };

  const project = projectsData[projectId];

  useEffect(() => { window.scrollTo(0, 0); }, [projectId]);

  // Fetch Workshops
  useEffect(() => {
    if (projectId === 'startup-skill') {
      const API_BASE_URL = process.env.NODE_ENV === 'production' ? 'https://aiiot-1.onrender.com' : 'http://localhost:8000';
      axios.get(`${API_BASE_URL}/api/workshops/`).then(res => setWorkshops(res.data)).catch(err => console.error(err));
    }
  }, [projectId]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if(el) { window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' }); }
  };

  if (!project) return <div>Loading...</div>;

  return (
    <div className="project-page">
      
      {/* 1. HEADER - Local Nav */}
      <header className="aiiot-header-local">
         <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', height:'5rem' }}>
            <Link to="/" style={{textDecoration:'none', color:'#1e293b', fontWeight:'800', fontSize:'1.2rem'}}>AI-IoT Innovations</Link>
            <div style={{display:'flex', gap:'2rem', alignItems:'center'}}>
               <Link to="/" style={{textDecoration:'none', color:'#64748b', fontWeight:'600'}}>Home</Link>
               <Link to="/products" style={{textDecoration:'none', color:'#64748b', fontWeight:'600'}}>Products</Link>
               <a href="#contact" className="btn-primary" style={{padding:'0.5rem 1.2rem', fontSize:'0.9rem'}}>Get in Touch</a>
            </div>
         </div>
      </header>

      {/* 2. UNIVERSAL FULL-SCREEN HERO */}
      <section className="project-hero-fullscreen" style={{ backgroundImage: `url(${project.heroImage})` }}>
        <div className="hero-content-wrapper">
          <div className="hero-pill">Detailed Case Study</div>
          <h1 className="hero-main-title">{project.title}</h1>
          <p className="hero-sub-text">{project.description}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => scrollToSection('overview')} className="btn-white">Explore Project</button>
          </div>
        </div>

        {/* Floating Bubbles (Only for Intelligent Sensor) */}
        {projectId === 'intelligent-sensor' && (
          <div className="hero-bubbles-wrapper">
             <div className="p-bubble b1">☁️ PM2.5</div>
             <div className="p-bubble b2">🌫️ PM10</div>
             <div className="p-bubble b3">🧪 NO2</div>
             <div className="p-bubble b4">🏭 CO</div>
             <div className="p-bubble b5">💨 SO2</div>
             <div className="p-bubble b6">⚡ O3</div>
          </div>
        )}
      </section>

      {/* 3. BEAUTIFUL OVERVIEW CARD (Overlaps Hero) */}
      <div className="container overview-section-wrapper" id="overview">
         <div className="overview-glass-card">
            {/* Left Side: Text */}
            <div className="overview-text-side">
               <div className="mission-label">The Mission</div>
               <h2 className="mission-headline">{project.tagline}</h2>
               <p className="mission-body">{project.fullDescription}</p>
            </div>
            {/* Right Side: Visual */}
            <div className="overview-visual-side">
               <div style={{textAlign:'center', padding:'2rem'}}>
                  <div style={{fontSize:'4rem', marginBottom:'1rem'}}>🚀</div>
                  <h3 style={{color:'#1e293b', fontWeight:'700', fontSize:'1.5rem'}}>Impact Driven</h3>
                  <p style={{color:'#64748b', marginTop:'0.5rem'}}>Engineering solutions for real-world problems.</p>
               </div>
            </div>
         </div>
      </div>

      {/* 4. INNOVATIONS GRID */}
      <div className="container section-padding" id="innovations">
         <h2 className="section-title">Key Innovations</h2>
         {projectId === 'startup-skill' && workshops.length > 0 ? (
            <div className="innovation-grid">
               {workshops.map((ws) => (
                  <div key={ws.id} className="feature-card">
                     <h3 className="card-title">{ws.title}</h3>
                     <p style={{color:'#0284c7', fontWeight:'600'}}>{ws.event_date_text}</p>
                     <p className="card-desc">{ws.description}</p>
                  </div>
               ))}
            </div>
         ) : (
           <div className="innovation-grid">
             {project.innovations.map((item, idx) => (
               <div key={idx} className="feature-card">
                 <div className="icon-box">{item.icon}</div>
                 <h3 className="card-title">{item.title}</h3>
                 <p className="card-desc">{item.desc}</p>
               </div>
             ))}
           </div>
         )}
      </div>

      {/* 5. IMPACT SECTION (Parallax) */}
      <section id="impact" className="impact-parallax-section" style={{ backgroundImage: `url(${project.heroImage})` }}>
         <div className="impact-overlay">
            <div className="container">
               <h2 style={{ color: 'white', fontSize: '2.5rem', fontWeight: 800, marginBottom: '3rem' }}>Measurable Impact</h2>
               <div className="impact-grid-dark">
                  {project.impacts.map((stat, idx) => (
                     <div key={idx} className="stat-box-dark">
                        <div className="stat-value-dark">{stat.value}</div>
                        <div className="stat-label-dark">{stat.label}</div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </section>

      {/* 6. CONTACT */}
      <div className="container contact-section" id="contact">
         <h2>Ready to Collaborate?</h2>
         <br/>
         <a href="mailto:contact@aiiot.edu" className="btn-primary" style={{ textDecoration: 'none', borderRadius: '2rem' }}>Get in Touch</a>
      </div>

    </div>
  );
};

export default ProjectDetail;