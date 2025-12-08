import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './ProjectDetail.css';


const ProjectDetail = () => {
  const { projectId } = useParams();
  const [workshops, setWorkshops] = useState([]);
  
  const [activeCategory, setActiveCategory] = useState('Air Quality');
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  // --- MEGA MENU DATA (Updated with correct links) ---
  const productMenuData = {
    'Air Quality': {
      title: 'Air Quality Monitoring',
      description: 'Precision sensors for indoor and outdoor environments.',
      items: [
        // The link MUST match the 'slug' you put in Django Admin
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


  const projectsData = {
    'intelligent-sensor': {
      title: 'Protect Your Health from Invisible Pollutants!',
      tagline: 'Sensing. Predicting. Protecting.',
      heroImage: 'https://images.unsplash.com/photo-1529619768328-e37af76c6fe5?q=80&w=2000&auto=format&fit=crop',
      subimage: '/sensor_modules/aqicrop.jpeg',
      description: 'According to WHO, air pollution causes 7 million premature deaths. Our sensors track these invisible threats in real-time.',
      fullDescription: `We have deployed a validation-ready network that goes beyond simple sensing. By utilizing LoRa technology for long-range communication and advanced AI models, we provide a 4-day AQI forecast.`,
      innovations: [
        { title: 'Comprehensive Sensing', desc: 'Detects PM2.5, PM10, CO, NO2.', icon: '🔬' },
        { title: '4-Day AI Forecast', desc: 'Predicting levels 96 hours ahead.', icon: '🤖' },
        { title: 'Health Risk Engine', desc: 'Dynamic alerts for at-risk groups.', icon: '❤️' },
        { title: 'LoRa Mesh', desc: 'City-wide coverage with low power.', icon: '📡' }
      ],
      applications: [
        { title: 'Smart Schools', image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800', desc: 'Protecting children during outdoor activities.' },
        { title: 'Industrial Zones', image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800', desc: 'Monitoring emission compliance in real-time.' },
        { title: 'Public Parks', image: 'https://images.unsplash.com/photo-1496062031456-07b8f162a322?w=800', desc: 'Advising joggers on the best time to run.' }
      ],
      impacts: [
        { label: 'Pollutants', value: '6 Types' }, { label: 'Forecast', value: '4 Days' },
        { label: 'Tech', value: 'LoRa + AI' }, { label: 'Network', value: 'Mesh' }
      ]
    },
    'water-level': {
      title: 'River Watch & Flood Alert',
      tagline: 'Predicting the Flow. Protecting Lives.',
      heroImage: 'https://images.unsplash.com/photo-1454789476662-53eb23ba5907?q=80&w=2000&auto=format&fit=crop',
      subimage: '/sensor_modules/weather.jpg',
      description: 'A comprehensive LSTM neural network system for real-time river level forecasting.',
      fullDescription: `This project integrates multi-source data—dam operations, rainfall, and historical levels—into a comprehensive LSTM Neural Network.`,
      innovations: [
        { title: 'LSTM Network', desc: 'Deep learning for flood prediction.', icon: '🧠' },
        { title: 'Multi-Source Data', desc: 'Dam + Rainfall + River Levels.', icon: '🌊' },
        { title: '6-Hour Lead Time', desc: 'Early warning for evacuation.', icon: '⏱️' },
        { title: 'Custom AWS', desc: 'Proprietary weather stations.', icon: '⛈️' }
      ],
      applications: [
        { title: 'River Banks', image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800', desc: 'Early warning for riverside communities.' },
        { title: 'Dam Reservoirs', image: 'https://images.unsplash.com/photo-1524410943962-42da6a603c40?w=800', desc: 'Optimizing water release schedules.' },
        { title: 'Urban Drainage', image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800', desc: 'Preventing flash floods in cities.' }
      ],
      impacts: [
        { label: 'Location', value: 'Kalady' }, { label: 'Model', value: 'LSTM' },
        { label: 'Lead Time', value: '6 Hours' }, { label: 'Hardware', value: 'Custom' }
      ]
    },
    'digital-water': {
      title: 'Digital Water Distribution',
      tagline: 'Smart flow for smart cities.',
      heroImage: 'https://images.unsplash.com/photo-1516937941348-c09645f3a2eb?q=80&w=2000&auto=format&fit=crop',
      subimage: '/sensor_modules/distribution.jpeg',
      description: 'A digital twin system built to monitor, analyze, and optimize local water distribution networks.',
      fullDescription: `We conducted comprehensive ground studies engaging with KWA officials. This system digitizes the water network to ensure fair distribution.`,
      innovations: [
        { title: 'Digital Twin', desc: 'Virtual replica of pipe networks.', icon: '💻' },
        { title: 'Leak Detection', desc: 'Instant pressure drop alerts.', icon: '💧' },
        { title: 'Explainable AI', desc: 'Transparent decision making.', icon: '🤖' },
        { title: 'Community App', desc: 'Resident reporting channel.', icon: '📱' }
      ],
      applications: [
        { title: 'Municipalities', image: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=800', desc: 'Managing city-wide water supply.' },
        { title: 'Apartments', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', desc: 'Fair distribution to all floors.' },
        { title: 'Treatment Plants', image: 'https://images.unsplash.com/photo-1563770095-39d46e8c78cc?w=800', desc: 'Monitoring output quality and flow.' }
      ],
      impacts: [
        { label: 'Partner', value: 'KWA' }, { label: 'Goal', value: 'Efficiency' },
        { label: 'Tech', value: 'XAI' }, { label: 'Method', value: 'Digital Twin' }
      ]
    },
    'startup-skill': {
      title: 'Innovation & Skills Hub',
      tagline: 'Empowering the builders of tomorrow.',
      heroImage: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=2000&auto=format&fit=crop',
      subimage: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=2000&auto=format&fit=crop',
      description: 'Bridging the gap between academia and industry through hands-on IoT and AI training.',
      fullDescription: `We foster a startup ecosystem by providing students with real-world exposure. From intensive 15-day summer internships to 6-month specialized intern training.`,
      innovations: [
        { title: 'Incubation', desc: 'Support for student startups.', icon: '🚀' },
        { title: 'PCB Design', desc: 'Industrial standard training.', icon: '🛠️' },
        { title: 'Patents', desc: 'Guidance on IP filing.', icon: '📜' },
        { title: 'Mentorship', desc: 'Expert industry guidance.', icon: '🎓' }
      ],
      applications: [
        { title: 'Universities', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800', desc: 'Setting up IoT labs and curriculum.' },
        { title: 'Tech Startups', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800', desc: 'Prototyping new hardware ideas.' },
        { title: 'Student Projects', image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800', desc: 'Final year project guidance.' }
      ],
      impacts: [
        { label: 'Students', value: '260+' }, { label: 'Interns', value: '49+' },
        { label: 'Patents', value: '1 Filed' }, { label: 'Startups', value: '6 Teams' }
      ]
    },
  };

  const project = projectsData[projectId];

  useEffect(() => { window.scrollTo(0, 0); }, [projectId]);

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
      
      {/* 1. HEADER */}
      <header className="aiiot-header-local">
         <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', height:'5rem' }}>
            <Link to="/" style={{textDecoration:'none', color:'#1e293b', fontWeight:'800', fontSize:'1.2rem'}}>AI-IoT Innovations</Link>
            <div style={{display:'flex', gap:'2rem', alignItems:'center'}}>
               <Link to="/" style={{textDecoration:'none', color:'#64748b', fontWeight:'600'}}>Home</Link>
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

      {/* 3. UPDATED OVERVIEW CARD (Right side now has Image + Text) */}
      <div className="container overview-section-wrapper" id="overview">
         <div className="overview-glass-card">
            
            {/* Left Side: Mission Text */}
            {/* Left Side: Mission Text */}
            <div className="overview-text-side">
              <div style={{color:'#3b82f6', fontWeight:'700', textTransform:'uppercase', fontSize:'0.85rem', marginBottom:'1rem'}}>
                  Mission Statement
              </div>
              <h2 className="mission-headline">{project.tagline}</h2>
              <p className="mission-body">{project.fullDescription}</p>
              
              <div style={{marginTop:'2rem'}}>
                {/* Link is better than button for page navigation */}
                <button 
                    onClick={() => scrollToSection('innovations')} 
                    className="btn-primary" 
                    style={{fontSize:'0.9rem', padding:'0.8rem 1.5rem', border:'none', cursor:'pointer'}}
                >
                    View Technology
                </button>
              </div>
            </div>
            
            {/* Right Side: Visual Image + Short Desc Overlay */}
            <div className="overview-visual-side" style={{ backgroundImage: `url(${project.subimage})` }}>
               <div className="visual-overlay-gradient">
                  {/* <h3 className="mini-card-title">{project.title}</h3>
                  <p className="mini-card-desc">{project.description}</p> */}
               </div>
            </div>

         </div>
      </div>

      {/* 4. INNOVATIONS GRID */}
      <div className="container section-padding" id="innovations">
         <h2 className="section-title">Key Technologies</h2>
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
         {/* 5. NEW: APPLICATIONS SECTION (Added Here) */}
      <section id="applications" style={{ background: '#eff6ff', padding: '5rem 0' }}>
        <div className="container">
          <h2 className="section-title">Where We Deploy</h2>
          <div className="applications-grid">
            {project.applications && project.applications.map((app, idx) => (
              <div key={idx} className="application-card">
                <div className="app-img-wrapper">
                  <img src={app.image} alt={app.title} />
                </div>
                <div className="app-content">
                  <h3>{app.title}</h3>
                  <p>{app.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* 5. IMPACT SECTION */}
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

export default ProjectDetail;