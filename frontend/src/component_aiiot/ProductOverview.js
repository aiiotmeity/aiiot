import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios'; // Keep if you use backend later
import './ProjectDetail.css'; 



const ProductOverview = () => {
  const { productId } = useParams(); // Gets 'indoor-monitor', 'flood-alert', etc.



  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [heroImages, setHeroImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- MEGA MENU STATES (ADDED) ---
  const [activeCategory, setActiveCategory] = useState('Air Quality');
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  

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

  // --- MOCK DATABASE (Matches the links in Aiiot_index.js) ---
  const productsDB = {
    // 1. AIR QUALITY
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
      desc: " rugged outdoor station capable of withstanding harsh weather (IP67) while providing accurate environmental data for smart cities.",
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

    // 2. WATER SOLUTIONS
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

    // 3. WEATHER
    'weather-station': {
      name: "Automatic Weather Station (AWS)",
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

    // 4. TRAINING
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

    // FALLBACK
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

  useEffect(() => { window.scrollTo(0, 0); }, [productId]);

  return (
    <div className="project-page">
      {/* Header */}
      <header className="aiiot-header-local">
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
                       <a href="https://aiiot.it.com/project/intelligent-sensor" className="nav-link">Solutions</a>
         
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
         
                       
                       <a href="#contact" className="nav-btn-primary">Get in Touch</a>
                     </div>
         
                     {/* MOBILE HAMBURGER BUTTON */}
                     <button className="mobile-nav-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                       {isMobileMenuOpen ? '✕' : '☰'}
                     </button>
                   </nav>
                 </div>
      </header>

      <div className="container" style={{paddingTop: '8rem', paddingBottom: '5rem'}}>
        
        {/* Hero Area */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', marginBottom:'5rem' }}>
          <div>
            <span style={{background:'#dbeafe', color:'#1e40af', padding:'0.4rem 1rem', borderRadius:'2rem', fontSize:'0.8rem', fontWeight:'bold', textTransform:'uppercase'}}>
              Product Details
            </span>
            <h1 style={{fontSize:'3.5rem', fontWeight:'800', color:'#1e293b', marginTop:'1rem', marginBottom:'1rem', lineHeight: 1.1}}>
              {product.name}
            </h1>
            <p style={{fontSize:'1.5rem', color:'#64748b', marginBottom:'1.5rem', fontWeight:'300'}}>
              {product.tagline}
            </p>
            <p style={{fontSize:'1rem', color:'#475569', lineHeight:'1.7', marginBottom:'2rem'}}>
              {product.desc}
            </p>
            
            <div style={{marginTop:'2rem'}}>
               <button className="btn-primary">Request Quote / Info</button>
            </div>
          </div>

          <div style={{background:'white', padding:'2rem', borderRadius:'2rem', boxShadow:'0 20px 40px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9'}}>
             <img src={product.image} alt={product.name} style={{width:'100%', borderRadius:'1rem'}} />
          </div>
        </div>

        {/* Features & Specs */}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem'}}>
           {/* Features */}
           <div>
              <h3 style={{fontSize:'1.5rem', fontWeight:'700', marginBottom:'1.5rem'}}>Key Features</h3>
              <ul style={{listStyle:'none', padding:0}}>
                {product.features && product.features.map((f, i) => (
                  <li key={i} style={{display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem', fontSize:'1.1rem', color:'#334155'}}>
                    <span style={{color:'#3b82f6', fontWeight:'bold'}}>✓</span> {f}
                  </li>
                ))}
              </ul>
           </div>

           {/* Specifications */}
           <div>
              <h3 style={{fontSize:'1.5rem', fontWeight:'700', marginBottom:'1.5rem'}}>Technical Specs</h3>
              <div style={{border:'1px solid #e2e8f0', borderRadius:'1rem', overflow:'hidden'}}>
                {product.specs && Object.entries(product.specs).map(([key, val], idx) => (
                   <div key={key} style={{display:'flex', justifyContent:'space-between', padding:'1rem 1.5rem', background: idx%2===0 ? '#f8fafc' : 'white', borderBottom:'1px solid #f1f5f9'}}>
                      <span style={{fontWeight:'600', color:'#64748b'}}>{key}</span>
                      <span style={{color:'#1e293b', fontWeight:'700'}}>{val}</span>
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