import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './ProjectDetail.css';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const [workshops, setWorkshops] = useState([]);
  
  // --- MENU STATES ---
  const [activeCategory, setActiveCategory] = useState('Air Quality');
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  
  // --- MOBILE & NAV STATES ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileProductExpanded, setMobileProductExpanded] = useState(false);
  const [isSolutionsMenuOpen, setIsSolutionsMenuOpen] = useState(false); 
  const [mobileSolutionsExpanded, setMobileSolutionsExpanded] = useState(false); 

  const solutionsList = [
    { name: 'Air Quality Monitoring', link: '/project/intelligent-sensor' },
    { name: 'Flood Alert System', link: '/project/water-level' },
    { name: 'Digital Water Distribution', link: '/project/digital-water' },
    { name: 'Startup & Skill Development', link: '/project/startup-skill' }
  ];

  // --- UPDATED MENU DATA (With 3 Air Quality Products) ---
  const productMenuData = {
    'Air Quality': {
      title: 'Air Quality Monitoring',
      description: 'Precision sensors for indoor and outdoor environments.',
      items: [
        { name: 'AQMS-Indoor ', image: '/sensor_modules/aqi-indoor1.jpg', link: '/product-details/indoor-monitor' },
        { name: 'AQMS-Outdoor  ', image: '/sensor_modules/aqi1.jpeg', link: '/product-details/outdoor-station' },
        
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

  // --- UPDATED PROJECT DATA (Based on your Images/Text) ---
  const projectsData = {
    'intelligent-sensor': {
      title: 'AQMS- Advanced Air Quality Monitoring',
      tagline: 'Real-time Reliable Rugged.',
      heroImage: 'https://images.unsplash.com/photo-1529619768328-e37af76c6fe5?q=80&w=2000&auto=format&fit=crop',
      subimage: '/sensor_modules/aqi1.jpeg',
      description: 'A comprehensive environmental monitoring solution measuring NO2, SO2, NH3, O3, PM2.5, and PM10 with LoRaWAN connectivity.',
      fullDescription: `The AQMS is a state-of-the-art monitoring station designed for both urban and industrial applications. It integrates high-precision laser dispersion sensors and NTC thermistors to track pollutants and weather data in real-time. Built with a rugged enclosure, it ensures continuous operation with dual connectivity (LoRa + GSM) and backup power.`,
      innovations: [
        { title: 'Multi-Gas Sensing', desc: 'Measures NO2, SO2, NH3, O3, PM2.5, PM10.', icon: '🔬' },
        { title: 'Dual Connectivity', desc: 'LoRaWAN for long range + GSM backup.', icon: '📡' },
        { title: 'Design', desc: ' Weatherproof & Durable enclosure.', icon: '🛡️' },
        { title: 'Data Security', desc: 'SD Card backup & AWS Cloud integration.', icon: '☁️' }
      ],
      // UPDATED: Focused on Town Junctions, Local Hospitals, and Markets
      applications: [
        { 
          title: 'Local Schools', 
          image: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=800', 
          desc: 'Monitoring classroom air quality to ensure a healthy learning environment for students.' 
        },
        { 
          title: 'College', 
          image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800', 
          desc: 'Indoor monitoring device placed within college labs to track ventilation and safety.' 
        },
        { 
          title: 'Town Center', 
          image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800', 
          desc: 'Tracking urban pollution, dust, and vehicle emissions at the main town junction.' 
        }
      ],
      impacts: [
        { label: 'Pollutants', value: '6 Types' }, 
        { label: 'Comms', value: 'LoRa/GSM' }, { label: 'Backup', value: '24hr UPS' }
      ]
    },
    'water-level': {
      title: 'Predictive Flood Alert System',
      tagline: 'Predicting Water Levels 6 Hours Ahead.',
      heroImage: 'https://images.unsplash.com/photo-1454789476662-53eb23ba5907?q=80&w=2000&auto=format&fit=crop',
      subimage: '/sensor_modules/river1.jpg',
      description: 'Using advanced LSTM Deep Learning networks to provide accurate river level forecasting and flood warnings.',
      fullDescription: `This system addresses the challenge of sudden floods by predicting river levels up to 6 hours in advance. It integrates multi-source data including upstream dam operations, real-time rainfall patterns, and historical river measurements into a comprehensive LSTM Neural Network model.`,
      innovations: [
        { title: 'LSTM Network', desc: 'Deep learning for 6-hour advance prediction.', icon: '🧠' },
        { title: 'Multi-Source Data', desc: 'Integrates Dam + Rainfall + River levels.', icon: '🌊' },
        { title: 'Real-Time Alert', desc: 'Instant notifications for emergency response.', icon: '🚨' },
        { title: 'Ultrasonic Accuracy', desc: 'Precision level monitoring sensors.', icon: '📏' }
      ],
      // UPDATED: Focused on specific Riverside communities and local bridges
      applications: [
        { title: 'Riverside', image: '/sensor_modules/bridge.jpg', desc: 'Alerting specific households in low-lying Neeleswaram areas.' },
        { title: 'Local Causeways', image: '/sensor_modules/catchment.jpg', desc: 'Warning traffic before small bridges get submerged.' },
        
      ],
      impacts: [
        { label: 'Lead Time', value: '6 Hours' }, { label: 'Model', value: 'LSTM' },
        { label: 'Accuracy', value: '98%' }, { label: 'Region', value: 'Kerala' }
      ]
    },
    'digital-water': {
      title: 'Digital Water Distribution',
      tagline: 'Smart flow for smart cities.',
      heroImage: 'https://images.unsplash.com/photo-1516937941348-c09645f3a2eb?q=80&w=2000&auto=format&fit=crop',
      subimage: '/sensor_modules/distribution.jpeg',
      description: 'A system built to monitor, analyze, and optimize local water distribution networks.',
      fullDescription: `We conducted comprehensive ground studies engaging with KWA officials. This system digitizes the water network to ensure fair distribution, detect leaks instantly, and manage pressure across the pipeline network using IoT flow meters.`,
      innovations: [
        
        { title: 'Leak Detection', desc: 'Instant pressure drop alerts.', icon: '💧' },
        { title: 'Flow Analysis', desc: 'Real-time consumption tracking.', icon: '📊' },
        { title: 'Remote Valve', desc: 'Control water flow from the cloud.', icon: '🎛️' }
      ],
      // UPDATED: Focused on Panchayat Wards and Local Residents Associations
      applications: [
       { 
          title: 'Kalady Panchayat Wards', 
          image: '/sensor_modules/panchayath.jpg', 
          desc: 'Equitable water distribution for specific wards in Kalady Grama Panchayat.' 
        },
        { 
          title: 'Periyar Pump House', 
          image: '/sensor_modules/pump.jpg', 
          desc: 'Automating operations at the KWA sub-station near Kalady Bridge.' 
        },
        { 
          title: 'Local Housing Colonies', 
          image: 'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=800', 
          desc: 'Leak detection for residential associations in the Mattoor & Neeleeswaram areas.' 
        }
      ],
      impacts: [
        { label: 'Partner', value: 'KWA' }, { label: 'Goal', value: 'Efficiency' },
        { label: 'Tech', value: 'XAI' }
      ]
    },
    'startup-skill': {
      title: 'IoT & Embedded Systems Training',
      tagline: 'Hands-on Workshops & Internships.',
      heroImage: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=2000&auto=format&fit=crop',
      subimage: '/sensor_modules/skill.jpg',
      description: 'Comprehensive training programs ranging from 1-day workshops to intensive 15-day internships on IoT and Edge Computing.',
      fullDescription: `We bridge the gap between academia and industry by providing hands-on training in Arduino, Raspberry Pi, PCB Design (KiCad), and IoT prototyping. Our programs culminate in real-world project expos and prototype development.`,
      innovations: [
        { title: 'Summer Internship', desc: '15 Days on Electronic Prototyping.', icon: '📅' },
        { title: 'PCB Design', desc: 'KiCad & Edge Hardware Workshop.', icon: '🛠️' },
        { title: 'IoT Robotics', desc: 'ESP8266 to Raspberry Pi integration.', icon: '🤖' },
        { title: 'Computer Vision', desc: 'Raspberry Pi & OpenCV training.', icon: '👁️' }
      ],
      // UPDATED: Focused on nearby Polytechnics and Local Engineering Colleges
      applications: [
        { title: 'Local Colleges', image: '/sensor_modules/asiet.png', desc: 'Workshops for nearby Engineering & Polytechnic institutes.' },
        { title: 'District Schools', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800', desc: 'Setting up ATAL Tinkering Labs in local schools.' },
        { title: 'Community Centers', image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800', desc: 'Weekend robotics camps for neighborhood students.' }
      ],
      impacts: [
    { label: 'Interns', value: '19+' },
    { label: 'Workshops', value: '8+' },
    { label: 'Startups', value: '6 Teams' },
    { label: 'Staff', value: '6' }
]

    },
  };

  const project = projectsData[projectId];

  useEffect(() => { window.scrollTo(0, 0); }, [projectId]);

  useEffect(() => {
    if (projectId === 'startup-skill') {
      // Optional: Keep API call for dynamic workshops if backend is ready
      const API_BASE_URL = 'https://aiiot-1.onrender.com';
      axios.get(`${API_BASE_URL}/api/workshops/`).then(res => setWorkshops(res.data)).catch(err => console.error(err));
    }
  }, [projectId]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isMobileMenuOpen]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if(el) { window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' }); }
  };

  if (!project) return <div>Loading...</div>;

  return (
    <div className="project-page">
      
      {/* 1. HEADER (Design Unchanged) */}
      <header className="aiiot-header-local">
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

               <a href="#footer" className="btn-primary-small">Get in Touch</a>
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

                <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary" style={{ textAlign: 'center', marginTop: '1rem' }}>Get in Touch</a>
            </div>
         )}
      </header>

      {/* 2. HERO */}
      <section className="project-hero-fullscreen" style={{ backgroundImage: `url(${project.heroImage})` }}>
        <div className="hero-content-wrapper">
          <div className="hero-pill">Detailed Case Study</div>
          <h1 className="hero-main-title">{project.title}</h1>
          <p className="hero-sub-text">{project.description}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => scrollToSection('overview')} className="btn-white">Explore Project</button>
          </div>
        </div>

        {/* Bubbles only for Intelligent Sensor */}
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

      <br></br>

      {/* 3. OVERVIEW CARD */}
      <div className="container overview-section-wrapper" id="overview">
         <div className="overview-glass-card">
            
            <div className="overview-text-side">
              <div style={{color:'#3b82f6', fontWeight:'700', textTransform:'uppercase', fontSize:'0.85rem', marginBottom:'1rem'}}>
                  Mission Statement
              </div>
              <h2 className="mission-headline">{project.tagline}</h2>
              <p className="mission-body">{project.fullDescription}</p>
              
              <div style={{marginTop:'2rem'}}>
                <button 
                    onClick={() => scrollToSection('innovations')} 
                    className="btn-primary" 
                    style={{fontSize:'0.9rem', padding:'0.8rem 1.5rem', border:'none', cursor:'pointer'}}
                >
                    View Technology
                </button>
              </div>
            </div>
            
            <div className="overview-visual-side" style={{ backgroundImage: `url(${project.subimage})` }}>
               <div className="visual-overlay-gradient"></div>
            </div>

         </div>
      </div>

      {/* 4. INNOVATIONS GRID */}
      <div className="container section-padding" id="innovations" style={{ paddingBottom: '4rem' }}>
         <h2 className="section-title" style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem', marginTop: '2rem', textAlign: 'center' }}>Key Technologies</h2>
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
                 <div className="icon-box" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{item.icon}</div>
                 <h3 className="card-title" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{item.title}</h3>
                 <p className="card-desc" style={{ color: '#64748b' }}>{item.desc}</p>
               </div>
             ))}
           </div>
         )}
      </div>

      {/* 5. APPLICATIONS */}
      <section id="applications" style={{ background: '#eff6ff', padding: '5rem 0' }}>
        <div className="container">
          <h2 className="section-title" style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginBottom: '3rem', textAlign: 'center' }}>Deployment Areas</h2>
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

      {/* 6. IMPACT */}
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
      <footer id="footer" style={{ background: '#1e293b', color: '#cbd5e1', padding: '3rem 0' }}>
        <div className="container">
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
                    <Link to={`/#${link.toLowerCase()}`} style={{ fontSize: '0.875rem', color: 'white', textDecoration: 'none' }}>{link}</Link>
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