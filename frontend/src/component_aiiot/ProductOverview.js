import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './ProductOverview.css'; 

const ProductOverview = () => {
  const { productId } = useParams();

  // --- MENU STATES ---
  const [activeCategory, setActiveCategory] = useState('Air Quality');
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isSolutionsMenuOpen, setIsSolutionsMenuOpen] = useState(false);
  
  // --- MOBILE STATES ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileProductExpanded, setMobileProductExpanded] = useState(false);
  const [mobileSolutionsExpanded, setMobileSolutionsExpanded] = useState(false);

  // --- DATA ---
  const solutionsList = [
    { name: 'Air Quality Monitoring', link: '/project/intelligent-sensor' },
    { name: 'Flood Alert System', link: '/project/water-level' },
    { name: 'Digital Water Distribution', link: '/project/digital-water' },
    { name: 'Startup & Skill Development', link: '/project/startup-skill' }
  ];

  const productMenuData = {
    'Air Quality': {
      title: 'Air Quality Monitoring',
      description: 'Precision sensors for indoor and outdoor environments.',
      items: [
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

  const productsDB = {
    'indoor-monitor': {
      name: "Indoor Air Quality Monitor",
      tagline: "Breathe healthy at home & office.",
      image: "/sensor_modules/aqicrop.jpeg",
      desc: "A compact, wall-mounted device designed to track CO2, Temperature, Humidity, and PM2.5 levels inside buildings to ensure occupant health.",
      features: ["PM2.5 Laser Sensor", "NDIR CO2 Sensor", "WiFi Connectivity", "Mobile App Alert"],
      specs: { "Range": "0-999 ug/m3", "Power": "5V USB-C", "Connectivity": "WiFi 2.4GHz", "Display": "OLED Screen" }
    },
    'outdoor-station': {
      name: "Outdoor Environmental Station",
      tagline: "City-wide pollution tracking.",
      image: "/sensor_modules/aqi1.jpeg",
      desc: "rugged outdoor station capable of withstanding harsh weather (IP67) while providing accurate environmental data for smart cities.",
      features: ["Solar Powered", "Weatherproof IP67", "Multi-Gas Sensors (NO2, SO2, O3)", "Long Range LoRa"],
      specs: { "Range": "15km LoRa", "Power": "Solar + Battery", "Connectivity": "LoRaWAN", "Protection": "IP67" }
    },
    'gas-sensors': {
      name: "Industrial Gas Sensors",
      tagline: "Detect invisible threats.",
      image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800",
      desc: "High-precision electrochemical sensors designed to detect specific hazardous gases like Ammonia, Chlorine, and Methane in industrial zones.",
      features: ["High Sensitivity", "Fast Response Time", "Calibrated Factory", "Industrial Grade"],
      specs: { "Target Gas": "CO, NH3, H2S", "Output": "Analog/Digital", "Lifespan": "2 Years" }
    },
    'flood-alert': {
      name: "Smart Flood Alert System",
      tagline: "Early warning saves lives.",
      image: "/sensor_modules/river1.jpg",
      desc: "An ultrasonic water level monitoring system that predicts floods using AI and sends SMS alerts to community leaders.",
      features: ["Ultrasonic Sensor", "Solar Backup", "GSM/SMS Alerts", "AI Prediction Model"],
      specs: { "Range": "0-10 Meters", "Accuracy": "+/- 1cm", "Power": "Solar 20W", "Comms": "4G LTE" }
    },
    'level-sensors': {
      name: "Ultrasonic Level Sensors",
      tagline: "Non-contact precision.",
      image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800",
      desc: "Standalone sensors for tanks and reservoirs. Measures distance without touching the liquid, ensuring longevity.",
      features: ["Non-contact", "Waterproof Transducer", "Easy Installation", "Low Power"],
      specs: { "Beam Angle": "15 degrees", "Temp": "-20 to 60C", "Output": "RS485 / 4-20mA" }
    },
    'distribution-net': {
      name: "Digital Water Flow Meter",
      tagline: "Track every drop.",
      image: "/sensor_modules/distribution.jpeg",
      desc: "IoT-enabled flow meters that detect leaks and monitor water consumption in real-time for pipelines.",
      features: ["Leak Detection", "Flow Rate Analysis", "Pressure Monitoring", "Remote Valve Control"],
      specs: { "Pipe Size": "DN15 - DN50", "Pressure": "PN16", "Battery": "5 Year Life" }
    },
    'weather-station': {
      name: "Automatic Weather Station",
      tagline: "Hyper-local climate data.",
      image: "/sensor_modules/weather.jpg",
      desc: "A complete weather monitoring suite measuring wind speed, direction, rainfall, temperature, and humidity.",
      features: ["All-in-one Sensor", "Wind Vane & Anemometer", "Tipping Bucket Rain Gauge", "Cloud Logging"],
      specs: { "Wind Speed": "0-60 m/s", "Rain Res": "0.2mm", "Solar": "Included" }
    },
    'rain-gauge': {
      name: "Smart Rain Gauge",
      tagline: "Precision rainfall measurement.",
      image: "https://images.unsplash.com/photo-1590055531860-6902633df018?w=800",
      desc: "A standalone tipping bucket rain gauge for agriculture and flood monitoring.",
      features: ["Self-Emptying", "Insect Screen", "Digital Counter", "Rugged Plastic"],
      specs: { "Resolution": "0.2mm", "Type": "Tipping Bucket", "Mount": "Pole/Flat" }
    },
    'iot-starter-kit': {
      name: "IoT Education Kit",
      tagline: "Learn by doing.",
      image: "/sensor_modules/skill.jpg",
      desc: "A comprehensive kit for students containing NodeMCU, sensors, jumper wires, and a guidebook for 10 projects.",
      features: ["NodeMCU ESP8266", "10+ Sensors", "Breadboard & Wires", "Step-by-step PDF"],
      specs: { "Projects": "10", "Level": "Beginner", "Language": "C++ / Python" }
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
      desc: "The product you are looking for is currently unavailable or the link is incorrect.",
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
      {/* 1. HEADER */}
      <header className="aiiot-header-local">
         <div className="project-header-inner">
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

               <div 
                 className="mega-menu-wrapper"
                 onMouseEnter={() => setIsMegaMenuOpen(true)}
                 onMouseLeave={() => setIsMegaMenuOpen(false)}
               >
                 <Link to="/products" className="project-nav-link product-trigger">
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
               
               <Link to="/resources" className="project-nav-link">Resources</Link>
               <a href="#contact" className="btn-primary-small">Get in Touch</a>
             </div>
 
             {/* MOBILE HAMBURGER */}
             <button className="mobile-nav-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
               {isMobileMenuOpen ? '✕' : '☰'}
             </button>
         </div>

         {/* MOBILE MENU */}
         {isMobileMenuOpen && (
            <div className="mobile-menu-wrapper">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="mobile-link">Home</Link>
                
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

      {/* 2. MAIN CONTENT - USING CSS CLASSES FOR RESPONSIVENESS */}
      <div className="container" style={{paddingTop: '8rem', paddingBottom: '5rem'}}>
        
        {/* HERO SECTION */}
        <div className="product-hero-section">
          <div className="product-text-side">
            <span className="product-badge">Product Details</span>
            <h1 className="product-title">{product.name}</h1>
            <p className="product-tagline">{product.tagline}</p>
            <p className="product-desc">{product.desc}</p>
            
            <div style={{marginTop:'2rem'}}>
               <button className="btn-primary">Request Quote / Info</button>
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
                {product.features && product.features.map((f, i) => (
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
                {product.specs && Object.entries(product.specs).map(([key, val], idx) => (
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