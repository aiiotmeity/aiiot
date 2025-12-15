import React, { useState, useEffect, useRef } from 'react'; // 1. Added useRef
import { useParams, Link } from 'react-router-dom';
import emailjs from '@emailjs/browser'; // 2. Added emailjs import
import './ProductOverview.css';

const ProductOverview = () => {
  const { productId } = useParams();
  const form = useRef(); // 3. Created form reference

  // --- UI STATES ---
  const [activeCategory, setActiveCategory] = useState('Air Quality');
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isSolutionsMenuOpen, setIsSolutionsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileProductExpanded, setMobileProductExpanded] = useState(false);
  const [mobileSolutionsExpanded, setMobileSolutionsExpanded] = useState(false);
  
  // NEW: State for Request Modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // --- STATIC SOLUTIONS LIST ---
  const solutionsList = [
    { name: 'Air Quality Monitoring', link: '/project/intelligent-sensor' },
    { name: 'Flood Alert System', link: '/project/water-level' },
    { name: 'Digital Water Distribution', link: '/project/digital-water' },
    { name: 'Startup & Skill Development', link: '/project/startup-skill' }
  ];

  // --- UPDATED MENU STRUCTURE ---
  const productMenuData = {
    'Air Quality': {
      title: 'Air Quality Monitoring',
      description: 'Precision sensors for indoor and outdoor environments.',
      items: [
        { name: 'AQMS-Indoor', image: '/sensor_modules/aqms-station1.jpg', link: '/product-details/indoor-monitor' },
        { name: 'AQMS-Outdoor', image: '/sensor_modules/aqi1.jpeg', link: '/product-details/outdoor-station' },
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

  // --- HARDCODED PRODUCT DETAILS ---
  const productsDB = {
    'indoor-monitor': {
      name: "AQMS - Indoor Monitor",
      tagline: "Breathe healthy at home & office.",
      image: "/sensor_modules/aqms-station1.jpg",
      desc: "The AQMS Indoor is designed for building health. It utilizes high-precision laser dispersion sensors for particulate matter and NTC thermistors for accurate temperature readings inside offices and homes.",
      features: [
        "PM2.5 & PM10 Laser Dispersion Sensors",
        "NDIR CO2 Sensor for Ventilation",
        "WiFi Connectivity for Real-time App",
        "Compact Wall-Mount Design",
        "OLED Display for Instant Readings"
      ],
      specs: { 
        "Pollutants": "PM2.5, PM10, CO2", 
        "Power": "5V USB-C", 
        "Connectivity": "WiFi 2.4GHz", 
        "Display": "OLED Screen" 
      }
    },
    'outdoor-station': {
      name: "AQMS- Outdoor Station",
      tagline: "City-wide pollution tracking.",
      image: "/sensor_modules/aqi1.jpeg",
      desc: "A rugged outdoor station capable of withstanding harsh weather (IP67) while providing accurate environmental data for smart cities. Features dual connectivity and backup power.",
      features: [
        "Solar Powered & Battery Backup",
        "Weatherproof IP67 Rugged Case",
        "Multi-Gas Sensors (NO2, SO2, O3)",
        "Long Range LoRa + GSM Backup",
        "Real-time Cloud Data Logging"
      ],
      specs: { 
        "Range": "15km (LoRa)", 
        "Power": "Solar + Battery", 
        "Connectivity": "LoRaWAN / GSM", 
        "Protection": "IP67 Rated" 
      }
    },
    'weather-station': {
      name: "AWS- Field Meteorological Stations",
      tagline: "Comprehensive Sensing & Data Integrity.",
      image: "/sensor_modules/weather.jpg",
      desc: "Our Field-Ready Meteorological Stations are designed for autonomous operation in harsh conditions. They feature precise timestamping (RTC), local data redundancy, and on-site OLED diagnostics.",
      features: [
        "Measures Temp, Humidity, Wind Speed/Direction, Rainfall",
        "Dual LoRaWAN & GSM with Automatic Failover",
        "Onboard RTC & Local SD Card Storage",
        "High-Capacity UPS Backup Power",
        "Rugged IP67 Enclosure for Monsoon Conditions"
      ],
      specs: { 
        "Sensors": "Wind, Rain, Temp, Hum", 
        "Data Storage": "SD Card + Cloud", 
        "Housing": "IP67 Rated", 
        "Power": "Solar + UPS" 
      }
    },
    'flood-alert': {
      name: "Predictive Flood Alert System",
      tagline: "Predicting Water Levels 6 Hours Ahead.",
      image: "/sensor_modules/river1.jpg",
      desc: "Using advanced LSTM Deep Learning networks, this system provides accurate river level forecasting up to 6 hours in advance. It integrates multi-source data including dam operations, rainfall patterns, and historical river measurements.",
      features: [
        "6-Hour Advance Prediction using LSTM",
        "Integrates Dam Release & Rainfall Data",
        "Real-Time Continuous Operation",
        "Multi-Variable Input Analysis",
        "Early Warning for Neeleswaram Region"
      ],
      specs: { 
        "Model": "LSTM Deep Learning", 
        "Lead Time": "6 Hours", 
        "Data Sources": "Dam, Rain, River", 
        "Target": "Flood Prevention" 
      }
    },
    'iot-training': {
      name: "IoT & Embedded Systems Training",
      tagline: "Hands-on Workshops & Internships.",
      image: "/sensor_modules/skill.jpg",
      desc: "We offer a wide range of hands-on programs ranging from 1-day workshops to intensive 15-day internships. Focus areas include Arduino, Raspberry Pi, PCB Design, and Edge Computing.",
      features: [
        "IoT Impression: Arduino & Raspberry Pi (1 Day)",
        "Summer Internship: Electronic Prototyping (15 Days)",
        "IoT Powered Robotics: ESP8266 to Pi (3 Days)",
        "Edge Hardware Design & PCB Workshop (10 Days)",
        "Raspberry Pi & Computer Vision (1 Day)"
      ],
      specs: { 
        "Participants": "Students & Faculty", 
        "Duration": "1 to 15 Days", 
        "Tools": "KiCad, OpenCV, Arduino", 
        "Outcome": "Project Expo & Prototyping" 
      }
    },
    'gas-sensors': {
      name: "Industrial Gas Sensors",
      tagline: "Detect invisible threats.",
      image: "/sensor_modules/aqi-indoor.jpeg",
      desc: "High-precision electrochemical sensors designed to detect specific hazardous gases like Ammonia, Chlorine, and Methane in industrial zones.",
      features: ["High Sensitivity", "Fast Response Time", "Calibrated Factory", "Industrial Grade"],
      specs: { "Target Gas": "CO, NH3, H2S", "Output": "Analog/Digital", "Lifespan": "2 Years" }
    },
    'distribution-net': {
      name: "Digital Water Flow Meter",
      tagline: "Track every drop.",
      image: "/sensor_modules/distribution.jpeg",
      desc: "IoT-enabled flow meters that detect leaks and monitor water consumption in real-time for pipelines.",
      features: ["Leak Detection", "Flow Rate Analysis", "Pressure Monitoring", "Remote Valve Control"],
      specs: { "Pipe Size": "DN15 - DN50", "Pressure": "PN16", "Battery": "5 Year Life" }
    },
    'rain-gauge': {
      name: "Smart Rain Gauge",
      tagline: "Precision rainfall measurement.",
      image: "https://images.unsplash.com/photo-1590055531860-6902633df018?w=800",
      desc: "A standalone tipping bucket rain gauge for agriculture and flood monitoring.",
      features: ["Self-Emptying", "Insect Screen", "Digital Counter", "Rugged Plastic"],
      specs: { "Resolution": "0.2mm", "Type": "Tipping Bucket", "Mount": "Pole/Flat" }
    },
    'pcb-workshop': {
      name: "PCB Design Workshop",
      tagline: "From schematic to board.",
      image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800",
      desc: "A hands-on training program where students learn to design, print, and solder their own circuit boards.",
      features: ["KiCad Software", "Etching Process", "Soldering Training", "Take-home Board"],
      specs: { "Duration": "2 Days", "Certification": "Yes", "Material": "Included" }
    },
    'default': {
      name: "Product Not Found",
      tagline: "Please select a product from the menu.",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
      desc: "The product you are looking for is currently unavailable.",
      features: [],
      specs: {}
    }
  };

  const product = productsDB[productId] || productsDB['default'];

  // --- 4. NEW: SEND EMAIL FUNCTION ---
  const sendEmail = (e) => {
    e.preventDefault();

    // UPDATED: Now it reads from the hidden file
    // TEMPORARY TEST: Hardcode the keys to prove it works
    const YOUR_SERVICE_ID = 'service_v53ie77';
    const YOUR_TEMPLATE_ID = 'template_ctrip8o';
    const YOUR_PUBLIC_KEY = 'uGhwYH7cKaKvnhFc3';

    
          // ... rest of code same as before
    // ---------------------------------------------------------

    emailjs.sendForm(YOUR_SERVICE_ID, YOUR_TEMPLATE_ID, form.current, YOUR_PUBLIC_KEY)
      .then((result) => {
          console.log(result.text);
          alert("Request Sent! We will contact you soon.");
          setIsRequestModalOpen(false);
          e.target.reset(); // Clear form after sending
      }, (error) => {
          console.log(error.text);
          alert("Failed to send message. Please try again.");
      });
  };

  useEffect(() => {
    // Lock scroll if Mobile Menu OR Modal is open
    if (isMobileMenuOpen || isRequestModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    window.scrollTo(0, 0);
  }, [isMobileMenuOpen, productId, isRequestModalOpen]);

  return (
    <div className="project-page">
      {/* 1. HEADER (Fully Responsive) */}
      <header className="aiiot-header-local">
         <div className="project-header-inner">
             {/* Logo */}
             <Link to="/" className="logo-link">
               <div className="logo-box">
                 <img src="/logo/logo.png" alt="Adi Shankara Institute" style={{ height: '100%', width: 'auto' }} />
               </div>
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                 <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>AI-IoT Innovations</span>
               </div>
             </Link>
 
             {/* DESKTOP NAV */}
             <div className="project-desktop-nav">
               <Link to="/" className="project-nav-link">Home</Link>
               
               {/* Solutions Dropdown */}
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

               {/* Products Mega Menu */}
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
               
               <Link to="/resources" className="project-nav-link">R&D</Link>
               <a href="#contact" className="btn-primary-small">Get in Touch</a>
             </div>
 
             {/* MOBILE HAMBURGER */}
             <button className="mobile-nav-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
               {isMobileMenuOpen ? '✕' : '☰'}
             </button>
         </div>

         {/* MOBILE MENU OVERLAY */}
         {isMobileMenuOpen && (
            <div className="mobile-menu-wrapper">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="mobile-link">Home</Link>
                
                {/* Solutions Accordion */}
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

                {/* Products Accordion */}
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

                <Link to="/resources" onClick={() => setIsMobileMenuOpen(false)} className="mobile-link">Resources</Link>
                <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary" style={{ textAlign: 'center', marginTop: '1rem', display:'block' }}>Get in Touch</a>
            </div>
         )}
      </header>

      {/* 2. MAIN CONTENT (Hardcoded Data) */}
      <div className="container" style={{paddingTop: '8rem', paddingBottom: '5rem'}}>
        
        {/* HERO SECTION */}
        <div className="product-hero-section">
          <div className="product-text-side">
            <span className="product-badge">Product Details</span>
            <h1 className="product-title">{product.name}</h1>
            <p className="product-tagline">{product.tagline}</p>
            <p className="product-desc">{product.desc}</p>
            
            <div style={{marginTop:'2rem'}}>
               <button 
                  className="btn-primary" 
                  onClick={() => setIsRequestModalOpen(true)}
                >
                  Request Info
                </button>
            </div>
          </div>

          <div className="product-image-side">
             <img src={product.image} alt={product.name} />
          </div>
        </div>

        {/* DETAILS GRID */}
        <div className="product-details-grid">
           {/* Features */}
           <div className="features-container">
              <h3>Key Features</h3>
              <div style={{marginTop:'1.5rem'}}>
                {product.features.map((f, i) => (
                  <div key={i} className="feature-list-item">
                    <div className="check-icon">✓</div>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
           </div>

           {/* Specifications */}
           <div className="specs-container">
              <h3>Technical Specs</h3>
              <div className="specs-box">
                {Object.entries(product.specs).map(([key, val], idx) => (
                   <div key={key} className="spec-row">
                      <span className="spec-key">{key}</span>
                      <span className="spec-val">{val}</span>
                   </div>
                ))}
              </div>
           </div>
        </div>

      </div>
      {/* --- NEW: REQUEST INFO MODAL --- */}
      {isRequestModalOpen && (
        <div className="modal-overlay" onClick={() => setIsRequestModalOpen(false)} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', zIndex: 10005,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(5px)'
        }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
                background: 'white', width: '90%', maxWidth: '500px',
                borderRadius: '16px', padding: '2rem', position: 'relative',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}>
                <button 
                    onClick={() => setIsRequestModalOpen(false)}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
                >
                    ✕
                </button>
                
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#1e293b' }}>Request Information</h2>
                <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                    Interested in <strong>{product.name}</strong>? Fill out the form below.
                </p>

                {/* --- IMPORTANT: UPDATED FORM TAG --- */}
                <form ref={form} onSubmit={sendEmail}>
                    
                    {/* HIDDEN INPUT: Sends product name automatically */}
                    <input type="hidden" name="product_name" value={product.name} />

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Full Name</label>
                        <input 
                          type="text" 
                          name="user_name"  /* MATCHES TEMPLATE {{user_name}} */
                          placeholder="John Doe" 
                          required 
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem' }} 
                        />
                    </div>
                    
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Email Address</label>
                        <input 
                          type="email" 
                          name="user_email" /* MATCHES TEMPLATE {{user_email}} */
                          placeholder="john@company.com" 
                          required 
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem' }} 
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Message</label>
                        <textarea 
                          rows="3" 
                          name="message" /* MATCHES TEMPLATE {{message}} */
                          placeholder="I am interested in..." 
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem', fontFamily: 'inherit' }}
                        ></textarea>
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Send Request</button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Or chat with us directly</p>
                    <a 
                        href={`https://wa.me/919999999999?text=Hi, I am interested in ${product.name}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a', fontWeight: '600', marginTop: '0.5rem', textDecoration: 'none' }}
                    >
                       <span style={{ fontSize: '1.2rem' }}>📱</span> WhatsApp Us
                    </a>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ProductOverview;