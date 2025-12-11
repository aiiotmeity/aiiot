import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './ProductOverview.css';

const ProductOverview = () => {
  const { productId } = useParams();

  // --- UI STATES ---
  const [activeCategory, setActiveCategory] = useState('Air Quality');
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isSolutionsMenuOpen, setIsSolutionsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileProductExpanded, setMobileProductExpanded] = useState(false);
  const [mobileSolutionsExpanded, setMobileSolutionsExpanded] = useState(false);

  // --- STATIC SOLUTIONS LIST ---
  const solutionsList = [
    { name: 'Air Quality Monitoring', link: '/project/intelligent-sensor' },
    { name: 'Flood Alert System', link: '/project/water-level' },
    { name: 'Digital Water Distribution', link: '/project/digital-water' },
    { name: 'Startup & Skill Development', link: '/project/startup-skill' }
  ];

  // --- UPDATED MENU STRUCTURE (Now with 3 Items in Air Quality) ---
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

  // --- HARDCODED PRODUCT DETAILS ---
  const productsDB = {
    // 1. AQM v3 INDOOR
    'indoor-monitor': {
      name: "AQMS - Indoor Monitor",
      tagline: "Breathe healthy at home & office.",
      image: "/sensor_modules/aqms-station1.jpg",
      desc: "The AQM v3 Indoor is designed for building health. It utilizes high-precision laser dispersion sensors for particulate matter and NTC thermistors for accurate temperature readings inside offices and homes.",
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

    // 2. AQM v3 OUTDOOR (Added Back)
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

    // 3. AWS v1 & v2 (Weather Station)
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

    // 4. PREDICTING WATER LEVELS (Flood Alert)
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

    // 5. TRAINING PROGRAMS
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

    // Keep other existing items
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

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    window.scrollTo(0, 0);
  }, [isMobileMenuOpen, productId]);

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
               
               <Link to="/resources" className="project-nav-link">R&D Mission</Link>
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
               <button className="btn-primary">Request Info</button>
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
    </div>
  );
};

export default ProductOverview;